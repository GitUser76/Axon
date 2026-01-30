// app/api/students/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase";

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("students")
    .select("id, name")
    .order("name");

  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(data);
}
