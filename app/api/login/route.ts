// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/app/lib/supabase";
// import bcrypt from "bcryptjs";

// export async function POST(req: NextRequest) {
//   try {
//     const supabase = createClient();
//     const { email, password } = await req.json();

//     const { data: student } = await supabase
//       .from("students")
//       .select("id, name, grade")
//       .eq("email", email)
//       .single();

//     if (!student) return NextResponse.json({ error: "Email not registered" }, { status: 400 });

//     const { data: storedPassword } = await supabase
//       .from("student_passwords")
//       .select("password_hash")
//       .eq("student_id", student.id)
//       .single();

//     if (!storedPassword) return NextResponse.json({ error: "Login error" }, { status: 400 });

//     const match = await bcrypt.compare(password, storedPassword.password_hash);
//     if (!match) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });

//     return NextResponse.json({ student });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
