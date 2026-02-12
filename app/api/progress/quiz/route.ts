import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/app/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function masteryToDifficulty(mastery: number) {
  if (mastery < 40) return "easy";
  if (mastery > 40 && mastery < 60) return "standard"; //mastery < 70
  if (mastery > 60 && mastery < 80) return "multi-step";
  return "hard";
}

export async function POST(req: Request) {
  try {
    const {
      subject,
      subTopic,
      studentId,
      grade,
      numQuestions = 5,
    } = await req.json();
    
        console.log(studentId + subject + subTopic + grade);

    if (!studentId || !subject || !subTopic || grade == null) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 🔍 Fetch mastery
    const { data: masteryRow } = await supabase
      .from("mastery")
      .select("mastery")
      .eq("student_id", studentId)
      .eq("concept", subTopic)
      .single();

    const mastery = masteryRow?.mastery ?? 0;
    const difficulty = masteryToDifficulty(mastery);

    // 🧠 AI prompt with GRADE BENCHMARK
   
      const prompt = `
          Generate ${numQuestions} quiz questions
          for a school year ${grade} student.

          Subject: ${subject}
          Sub-topic: ${subTopic}

          Rules:
          - Questions, language and examples must be appropriate for school year ${grade}
          - Do NOT assume knowledge above this grade
          - Difficulty should be ${difficulty} within this grade level and should match a typical school curriculum
          - provide a hint for the student to help answer the question

          Return JSON ONLY:
          [
            {
              "question": "...",
              "hint":" "...",
              "answer": "...",
              "units": "...",
              "difficulty": ${grade},
              "answer_keywords": ["...", "..."]
            }
          ]
          `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const raw = completion.choices[0].message?.content ?? "[]";

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

      const stripUnits = (text: string) => {
        // Keep only digits, decimal points, minus sign
        const match = text.match(/-?\d+(\.\d+)?/);
        return match ? match[0] : text;
      };


    let questions = [];
    try {
      questions = JSON.parse(cleaned);
            questions = questions.map((q: any) => {
        if (typeof q.answer === "string") {
          return {
            ...q,
            answer: stripUnits(q.answer),
          };
        }
        return q;
      });
    } catch {
      console.error("Quiz JSON parse failed:", cleaned);
    }
      console.log("Grade: " + grade);
      console.log("Mastery: " + mastery);
      console.log(questions);

    return NextResponse.json({
      grade,
      questions,
    });
  } catch (err) {
    console.error("Quiz generation failed", err);
    return NextResponse.json(
      { error: "Quiz generation failed" },
      { status: 500 }
    );
  }
}
