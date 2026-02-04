import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";
import { requireStudent } from "@/app/lib/requireStudent";


  const supabase = createClient();

function calculateMastery(score?: number) {
  if (score === undefined) return 1; // lesson viewed
  if (score >= 85) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  return 2;
}

function calculateXP(action: string, score?: number) {
  switch (action) {
    case "lesson_view": return 5;
    case "check_correct": return 10;
    case "practice_complete": return 15;
    case "assessment_complete": return 20 + (score && score >= 85 ? 30 : 0);
    default: return 0;
  }
}

export async function POST(req: Request) {
  const { student_id, concept_id, action, score } = await req.json();

  const { data: existing } = await supabase
    .from("student_mastery")
    .select("*")
    .eq("student_id", student_id)
    .eq("concept_id", concept_id)
    .single();

  const newMastery = calculateMastery(score);
  const earnedXP = calculateXP(action, score);

  const updated = {
    student_id,
    concept_id,
    mastery_level: Math.max(existing?.mastery_level || 0, newMastery),
    xp: (existing?.xp || 0) + earnedXP,
    last_updated: new Date(),
  };

  await supabase.from("student_mastery").upsert(updated);

  return NextResponse.json({ success: true });
}
