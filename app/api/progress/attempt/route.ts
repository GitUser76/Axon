import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";
import { requireStudent } from "@/app/lib/requireStudent";

export async function POST(req: Request) {
  const body = await req.json();
  const { lesson_slug, correct, subject, difficulty } = body;
  const studentId = req.headers.get("x-student-id");

  console.log("Attempting:", studentId, lesson_slug, correct);

  if (!studentId || !lesson_slug) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    await requireStudent(studentId);
  } catch {
    return NextResponse.json({ error: "Student not allowed" }, { status: 403 });
  }

  const supabase = createClient();

  // Get current attempts (maybe there is none yet)
  const { data, error } = await supabase
    .from("student_progress")
    .select("attempts, correct_attempts")
    .eq("student_id", studentId)
    .eq("lesson_slug", lesson_slug)
    .maybeSingle();

  if (error) {
    console.error("Error selecting progress:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  const attempts = (data?.attempts ?? 0) + 1;
  const correct_attempts = correct
    ? (data?.correct_attempts ?? 0) + 1
    : data?.correct_attempts ?? 0;

  // ⚡ Upsert with ON CONFLICT
  const { data: upserted, error: upsertError } = await supabase
    .from("student_progress")
    .upsert(
      {
        student_id: studentId,
        lesson_slug,
        attempts,
        correct_attempts,
        last_attempt_at: new Date().toISOString(),
      },
      {
        onConflict: ["student_id", "lesson_slug"], // <--- critical!
      }
    )
    .select();

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    return NextResponse.json({ error: upsertError }, { status: 500 });
  }

  console.log("✅ Upserted row:", upserted);

  return NextResponse.json({ ok: true, upserted });
}
