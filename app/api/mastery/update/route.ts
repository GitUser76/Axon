import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

export async function POST(req: Request) {
  try {
  const body: {
    studentId: string;
    concept: string;
    difficulty: string;
    score: number;
  } = await req.json();

  const { studentId, concept, difficulty, score } = body;

    // ✅ Validate payload
    if (
      !studentId ||
      !concept ||
      difficulty === undefined ||
      score === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }


    // Multipliers for difficulty
    const multipliers: Record<number, number> = {
        7: 0.7,
        8: 1.0,
        9: 1.15,
        10: 1.3,
        11: 1.5,
        12: 1.9,
        13: 2.5,
        14: 3,
    };

    const supabase = createClient();

    // 1️⃣ Fetch existing mastery
    const { data: existing, error: fetchError } = await supabase
      .from("mastery")
      .select("mastery, xp")
      .eq("student_id", studentId)
      .eq("concept", concept)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let mastery = existing?.mastery ?? 0;
    console.log("Old Mastery:", mastery);
    let xp = existing?.xp ?? 0;

    // 2️⃣ Difficulty multiplier (numeric logic)
    const difficultyNumber = Number(difficulty);
    const difficultyMultiplier = multipliers[difficultyNumber] ?? 1;

    // 3️⃣ Mastery delta
    const delta = Math.round(score * 15 * difficultyMultiplier);
    mastery = Math.max(0, Math.min(5000, mastery + delta));
    // 4️⃣ XP calculation
    let xpGain = Math.round(10 * difficultyMultiplier);

    if (score === 1) xpGain += 5; // perfect score bonus

    xp += xpGain;

    console.log("==========================");
    console.log("Student:", studentId);
    console.log("Concept:", concept);
    console.log("Score:", score);
    console.log("Difficulty:", difficulty);
    console.log("Delta:", delta);
    console.log("New Mastery:", mastery);
    console.log("XP:", xp);
    console.log("==========================");

    // 4️⃣ Upsert mastery
    const { error: upsertError } = await supabase
      .from("mastery")
      .upsert(
        {
          student_id: studentId,
          concept,
          mastery,
          xp,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "student_id,concept",
        }
      );

    if (upsertError) throw upsertError;

    return NextResponse.json({
      success: true,
      mastery,
      delta,
    });

  } catch (err) {
    console.error("Mastery update failed:", err);

    return NextResponse.json(
      { error: "Failed to update mastery" },
      { status: 500 }
    );
  }
}
