import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

export async function GET(req: Request) {
  const studentId = req.headers.get("x-student-id");
  if (!studentId) return NextResponse.json({ valid: false });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .single();

  if (error || !data) return NextResponse.json({ valid: false });

  return NextResponse.json({ valid: true });
}
