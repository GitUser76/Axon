import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";
import { requireStudent } from "@/app/lib/requireStudent";

export async function POST(req: Request) {
  const body = await req.json();
  const { lesson_slug, correct } = body;
  const studentId = req.headers.get("x-student-id");

  console.log("Attempting: " + studentId);

  if (!studentId || !lesson_slug) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    await requireStudent(studentId);
  } catch {
    return NextResponse.json({ error: "Student not allowed" }, { status: 403 });
  }

  const supabase = createClient();


  const { data } = await supabase
    .from("student_progress")
    .select("attempts, correct_attempts")
    .eq("student_id", studentId)
    .eq("lesson_slug", lesson_slug)
    .single();
  
    console.log(data);

  await supabase
    .from("student_progress")
    .upsert({
      student_Id: studentId,
      lesson_slug,
      attempts: (data?.attempts ?? 0) + 1,
      correct_attempts: correct
        ? (data?.correct_attempts ?? 0) + 1
        : data?.correct_attempts ?? 0,
      last_attempt_at: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}
