import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/app/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
      
  try {
    const { question, studentId} = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }
    if (!studentId) {
      return NextResponse.json({ error: "No studentId provided" }, { status: 400 });
    }

    //get student details
     const supabase = createClient();
      const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();


    const systemPrompt  = `
        - Act like a teacher for a student learning
        - Explain the concept Lesson content
        - Student asks: ${question}
        - Guide how to answer the question correctly, Is it Text or Numerical
        - Provide an example
        - Keep it under 5 sentences
        - Be encouraging

        Student profile:
        - Age: ${student.age}
        - School year: ${student.grade}

        Teaching instructions:
        - Teach at the student's school year level.
        - Use age-appropriate language.
        - Use British English.
        - Break complex concepts into simple steps.
        - Provide worked examples.
        - Use real-life examples where possible.
        - Explain unfamiliar terminology.
        - Ask a question at the end to check understanding.
        - Encourage the student to think independently.
        - Do not overwhelm the student with information.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt },
                 { role: "user", content: question },
                ],
      temperature: 0.6
    });

    const answer = completion.choices?.[0]?.message?.content ?? "Sorry, I couldn't answer that.";

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
