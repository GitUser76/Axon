import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");

  if (!subject) {
    return NextResponse.json(
      { error: "Missing subject" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("concept_units")
    .select("sub_topic")
    .eq("subject", subject)
    .not("sub_topic", "is", null);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Deduplicate
  const subTopics = Array.from(
    new Set(data.map((d) => d.sub_topic))
  );
    console.log("-----------------" + subTopics);

  return NextResponse.json({ subTopics });
}
