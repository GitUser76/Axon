import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

export async function POST(req: Request) {
  try {
    const { studentId, badges } = await req.json();

    if (!studentId || !badges?.length) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const rows = badges.map((badge: string) => ({
      student_id: studentId,
      badge,
    }));

    const { error } = await supabase
      .from("student_badges")
      .upsert(rows, { onConflict: "student_id,badge" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Badge award failed:", err);
    return NextResponse.json(
      { error: "Failed to award badges" },
      { status: 500 }
    );
  }
}
