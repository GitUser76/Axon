import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const {
      subject,
      lessonTitle,
      explanation,
      question,
      studentAnswer,
      correctAnswer,
      advisory,
      mode,
      difficulty
    } = await req.json();

    if (!lessonTitle || !question || !correctAnswer || !mode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let prompt = "";

    // 🟡 MODE 1 — HINT
    if (mode === "hint") {
      prompt = `
You are a calm, encouraging tutor teaching a ${difficulty} student.

Lesson: ${lessonTitle}

Question:
${question}

Student answer:
${studentAnswer}

Correct answer:
${correctAnswer}

Advisory:
${advisory ? `Teaching guidance:\n${advisory}` : ""}

Difficulty:
${difficulty}

Task:
- Act like a year ${difficulty} teacher
- Explain briefly why the answer is incorrect
- Student answered ${studentAnswer} where as the correct answer is ${correctAnswer}
- Guide how to answer the question correctly, Is it Text or Numerical
- Give a small hint
- Do NOT give the full answer
- Use simple language
- Max 3 sentences
`;
    }

    // 🔵 MODE 2 — RETEACH
    if (mode === "reteach") {
      prompt = `
You are a friendly tutor reteaching a Year ${difficulty} student.

Lesson: ${lessonTitle}

Original explanation:
${explanation}

Advisory:
${advisory ? `Teaching guidance:\n${advisory}` : ""}

Difficulty:
${difficulty}


The student is confused.

Task:
- Act like a year ${difficulty} teacher
- Explain the concept again using different wording
- Student answered ${studentAnswer} where as the correct answer is ${correctAnswer}
- Guide how to answer the question correctly, Is it Text or Numerical
- Provide an example
- Keep it under 5 sentences
- Be encouraging
`;
    }

    console.log("=====> " + prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6
    });

    const response =
      completion.choices[0]?.message?.content ??
      "Let's take another look at this together.";

      console.log("Response from ChatGPT: ==> " + response);

    return NextResponse.json({ response});

  } catch (error) {
    console.error("AI feedback error:", error);
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 500 }
    );
  }
}
