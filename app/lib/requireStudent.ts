import { createClient } from "@/app/lib/supabase";

/**
 * Checks that a given student exists in the database.
 * Throws an error if the student is not found.
 * @param studentId string
 * @returns student data
 */
export async function requireStudent(studentId: string) {
  if (!studentId) {
    throw new Error("STUDENT_ID_MISSING");
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("students")
    .select("id, name, email") // optionally fetch other fields
    .eq("id", studentId)
    .single();

  if (error || !data) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  return data;
}
