import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

type Difficulty = "easy" | "medium" | "hard";

export async function POST(req: Request) {
    
  try {
    const {
      studentId,
      concept,
      difficulty,
      score, // expected 0 → 1
    }: {
      studentId: string;
      concept: string;
      difficulty: Difficulty;
      score: number;
    } = await req.json();

    

    // ✅ Validate payload
    if (
      !studentId ||
      !concept ||
      !difficulty ||
      score === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1️⃣ Get existing mastery (safe fetch)
    const { data: existing, error: fetchError } = await supabase
      .from("mastery")
      .select("mastery")
      .eq("student_id", studentId)
      .eq("concept", concept)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let mastery = existing?.mastery ?? 0;

    // 2️⃣ Difficulty multiplier
    let difficultyMultiplier = 1;
    if (difficulty === "easy") difficultyMultiplier = 0.7;
    if (difficulty === "hard") difficultyMultiplier = 1.3;

    // 3️⃣ Calculate mastery delta
    // score is 0–1, max ~15 points per quiz
    const delta = Math.round(score * 15 * difficultyMultiplier);

    mastery = Math.max(0, Math.min(100, mastery + delta));
    console.log("==========================");
    console.log(studentId);
    console.log(concept);
    console.log(mastery);
    console.log("==========================");

    // 4️⃣ Upsert mastery
    const { error: upsertError } = await supabase
      .from("mastery")
      .upsert(
        {
          student_id: studentId,
          concept,
          mastery,
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
