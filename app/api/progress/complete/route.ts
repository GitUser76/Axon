import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

export async function POST(req: Request) {
  const supabase = createClient();

  const body = await req.json();
  const studentId = req.headers.get("x-student-id");
  const lessonSlug = body.lesson_slug;
  const now = new Date().toISOString();

  console.log("🔥 COMPLETE endpoint hit");
  console.log("📦 Request body:", body);
  console.log("👤 Student ID:", studentId);

  // --------------------------------------------------
  // 🛑 VALIDATION
  // --------------------------------------------------
  if (!studentId || !lessonSlug) {
    return NextResponse.json(
      { error: "Missing student_id or lesson_slug" },
      { status: 400 }
    );
  }

  // --------------------------------------------------
  // 🧑 ENSURE STUDENT EXISTS
  // --------------------------------------------------
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    console.error("❌ Invalid student:", studentError);
    return NextResponse.json(
      { error: "Student does not exist" },
      { status: 403 }
    );
  }

  // --------------------------------------------------
  // 🏁 1️⃣ MARK LESSON COMPLETE
  // --------------------------------------------------
  const { error: lessonError } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        student_id: studentId,
        lesson_slug: lessonSlug,
        completed: true,
        completed_at: now,
        updated_at: now,
      },
      {
        onConflict: "student_id,lesson_slug",
      }
    );

  if (lessonError) {
    console.error("❌ lesson_progress upsert failed:", lessonError);
    return NextResponse.json({ error: lessonError }, { status: 500 });
  }

  // --------------------------------------------------
  // 📊 2️⃣ UPDATE STUDENT_PROGRESS STATUS
  // --------------------------------------------------

  // Get existing attempts so we don't overwrite them
  const { data: progressData, error: selectError } = await supabase
    .from("student_progress")
    .select("attempts, correct_attempts")
    .eq("student_id", studentId)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();

  if (selectError) {
    console.error("❌ progress select failed:", selectError);
  }

  const { error: progressError } = await supabase
    .from("student_progress")
    .upsert(
      {
        student_id: studentId,
        lesson_slug: lessonSlug,
        attempts: progressData?.attempts ?? 0,
        correct_attempts: progressData?.correct_attempts ?? 0,
        status: "complete",
        updated_at: now,
      },
      {
        onConflict: "student_id,lesson_slug",
      }
    );

  if (progressError) {
    console.error("❌ student_progress upsert failed:", progressError);
    return NextResponse.json({ error: progressError }, { status: 500 });
  }

  console.log("✅ Lesson + progress marked complete");

  return NextResponse.json({ success: true });
}
