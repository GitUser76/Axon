import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/app/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function masteryToDifficulty(mastery: number) {
  if (mastery < 50) return "very_easy";
  if (mastery < 100) return "easy";
  if (mastery < 150) return "basic";
  if (mastery < 200) return "standard";
  if (mastery < 275) return "intermediate";
  if (mastery < 350) return "challenging";
  if (mastery < 425) return "advanced";
  return "very_hard";
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
        You are an expert educational quiz generator.

        Task:
        Generate ${numQuestions} quiz questions for a Year ${grade} student.

        Student Level:
        - School Year: ${grade}
        - Subject: ${subject}
        - Sub-topic: ${subTopic}
        - Target Difficulty Level: ${difficulty}

        Strict Rules:
        - Questions MUST match the knowledge level of a typical Year ${grade} student
        - Do NOT include concepts above this grade
        - Keep wording clear, short, and age-appropriate
        - Prefer real-world word problems where relevant
        - Avoid trick questions
        - Each question must have ONE clear correct answer
        - Provide a helpful hint (not the solution)

        Difficulty Guidance:
        - Difficulty refers to challenge within Year ${grade}, NOT higher-grade material
        - ${difficulty} difficulty should feel appropriately challenging but solvable

        Style:
        - Realistic school-style questions
        - Short and clear
        - No unnecessary complexity
        - Natural classroom tone

        Example Style:
        A school buys 45 textbooks costing £8.50 each. What is the total cost?
        Answer: 382.50

        Output Requirements (CRITICAL):
        - Return JSON ONLY
        - No markdown
        - No extra text
        - Valid JSON array

        JSON Format:
        [
          {
            "question": "...",
            "hint": "...",
            "answer": "...",
            "units": "...",
            "difficulty": ${difficulty},
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
