import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";
import { requireStudent } from "@/app/lib/requireStudent";

export async function POST(req: Request) {
  const body = await req.json();
  const { student_id, lesson_slug, difficulty } = body;

  if (!student_id || !lesson_slug) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    await requireStudent(student_id);
  } catch {
    return NextResponse.json({ error: "Student not allowed" }, { status: 403 });
  }

  const supabase = createClient();

  await supabase
    .from("lesson_progress")
    .upsert({
      student_id,
      lesson_slug,
      difficulty,
      started_at: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}
