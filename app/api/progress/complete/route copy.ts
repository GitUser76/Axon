import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

export async function POST(req: Request) {
  console.log("🔥 COMPLETE endpoint hit");

  const body = await req.json();
  console.log("📦 Request body:", body);

  const supabase = createClient();

  const { error } = await supabase
    .from("lesson_progress")
    .upsert({
      lesson_slug: body.lesson_slug,
      completed: true,
    });

  if (error) {
    console.error("❌ Supabase error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
