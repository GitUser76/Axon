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

  // -------------------------
  // EXISTING PROGRESS TRACKING
  // -------------------------
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

  const now = new Date().toISOString();

  const { data: upserted, error: upsertError } = await supabase
    .from("student_progress")
    .upsert(
      {
        student_id: studentId,
        lesson_slug,
        attempts,
        correct_attempts,
        last_attempt_at: now,
      },
      {
        onConflict: ["student_id", "lesson_slug"] as any,
      }
    )
    .select();

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    return NextResponse.json({ error: upsertError }, { status: 500 });
  }

  console.log("✅ Upserted row:", upserted);

  // -------------------------
  // 🧠 MASTERY TRACKING
  // -------------------------
  if (correct) {
    // Find concept_id for this lesson
    const { data: lesson } = await supabase
      .from("concept_units")
      .select("concept_id")
      .eq("slug", lesson_slug)
      .single();

    if (lesson?.concept_id) {
      const conceptId = lesson.concept_id;

      // Get existing mastery row
      const { data: masteryRow } = await supabase
        .from("student_mastery")
        .select("mastery_level, xp")
        .eq("student_id", studentId)
        .eq("concept_id", conceptId)
        .maybeSingle();

      const currentLevel = masteryRow?.mastery_level ?? 0;
      const currentXP = masteryRow?.xp ?? 0;

      // Increase mastery (cap at 5)
      const newLevel = Math.min(currentLevel + 1, 5);

      // Give some XP for correct answer
      const xpGain = 10; // can adjust dynamically if needed
      const newXP = currentXP + xpGain;

      const { error: masteryError } = await supabase
        .from("student_mastery")
        .upsert(
          {
            student_id: studentId,
            concept_id: conceptId,
            mastery_level: newLevel,
            xp: newXP,
            last_updated: now,
          },
          { onConflict: ["student_id", "concept_id"] as any }
        );

      if (masteryError) {
        console.error("Mastery update error:", masteryError);
      } else {
        console.log(
          `🧠 Mastery updated: concept ${conceptId} → Level ${newLevel}, XP ${newXP}`
        );
      }
    }
  }

  return NextResponse.json({ ok: true, upserted });
}

// -------------------------
// EXISTING HELPERS (unchanged)
// -------------------------
function calculateMastery(score?: number) {
  if (score === undefined) return 1;
  if (score >= 85) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  return 2;
}

function calculateXP(action: string, score?: number) {
  switch (action) {
    case "lesson_view":
      return 5;
    case "check_correct":
      return 10;
    case "practice_complete":
      return 15;
    case "assessment_complete":
      return 20 + (score && score >= 85 ? 30 : 0);
    default:
      return 0;
  }
}
