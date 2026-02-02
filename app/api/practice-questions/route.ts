import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { difficulty, lessonTitle } = await req.json();

    if (!lessonTitle) {
      return NextResponse.json({ error: "No lesson title provided" }, { status: 400 });
    }

    const prompt = `
You are a friendly tutor. Generate 5 ${lessonTitle} practice questions for a Year ${difficulty} student.
Make them progressively harder.

Return ONLY valid JSON in this format:

{
  "questions": [
    { 
      "question": "text",
      "answer": "short keyword answer",
      "answer_keywords": ["keyword1", "keyword2"],
      "hint": "text"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "{}";

    // 🧠 Parse AI JSON safely
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Failed to parse AI JSON:", raw);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // 🪵 LOG QUESTIONS TO SERVER CONSOLE
    console.log("🧠 AI Practice Questions Generated:");
    parsed.questions?.forEach((q: any, i: number) => {
      console.log(`Q${i + 1}:`, q.question);
      console.log(`Answer:`, q.answer);
      console.log(`Keywords:`, q.answer_keywords);
    });

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("🔥 AI Practice Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
