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

        RESPONSE FORMAT:
        Return a valid JSON object with the following structure:

        {
        "answer": "Your educational explanation",
        "imageQuery": "Specific educational image search query",
        "imageAlt": "Description of the image required"
        }

        RULES:
        - Use an image when it helps explain the topic.
        - Use specific educational image search terms.
        - Prefer labelled diagrams and scientific illustrations.
        - If an image is not useful, return an empty imageQuery.
        - Do not invent image URLs.
        - Do not include personal student information in imageQuery.
        - Return JSON only.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt },
                 { role: "user", content: question },
                ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    // const answer = completion.choices?.[0]?.message?.content ?? "Sorry, I couldn't answer that.";

    // return NextResponse.json({ answer });

    const content = completion.choices[0].message.content;

    const result = JSON.parse(content || "{}");

    if (typeof result.answer !== "string") {
    throw new Error("Invalid AI response");
    }

    let imageUrl = null;
    let imageSource = null;

    if (
    typeof result.imageQuery === "string" &&
    result.imageQuery.trim()
    ) {
    const image = await searchImage(result.imageQuery);

    imageUrl = image?.url || null;
    imageSource = image?.source || null;
    }

    return NextResponse.json({
    answer: result.answer,
    imageUrl,
    imageSource,
    imageAlt: result.imageAlt || "Educational image",
    });


  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }


  //image search
  async function searchImage(query: string) {
  try {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6",
      gsrlimit: "5",
      prop: "imageinfo",
      iiprop: "url|mime",
      iiurlwidth: "600",
      format: "json",
      formatversion: "2",
    });

    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
      {
        headers: {
          "User-Agent": "SnapStudy/1.0 (https://snapstudy.uk)",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    const pages = data.query?.pages || [];

    for (const page of pages) {
      const image = page.imageinfo?.[0];

      if (
        image &&
        image.mime?.startsWith("image/") &&
        image.thumburl
      ) {
        return {
          url: image.thumburl,
          source: image.descriptionurl,
        };
      }
    }

    return null;

  } catch (error) {
    console.error("Image search error:", error);
    return null;
  }
}
}
