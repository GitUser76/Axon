import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
     
  try {
    const { question, lessonTitle, explanation } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const prompt = `
- Act like a teacher for a student learning ${lessonTitle}
- Explain the concept Lesson content: ${explanation || "No explanation provided"}
- Student asks: ${question}
- Guide how to answer the question correctly, Is it Text or Numerical
- Provide an example
- Keep it under 5 sentences
- Be encouraging
`;


    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6
    });

    const answer = completion.choices?.[0]?.message?.content ?? "Sorry, I couldn't answer that.";

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
