"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase";


const supabase = createClient();

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    yearAtSchool: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            to: form.email,
            subject: "Welcome to SnapStudy 🎉",
            text: `Welcome, ${form.name}! Let’s start learning 🚀`,
            html: `
            <div style="font-family:Verdana; padding:20px;">
                <h2>🎉 Welcome to SnapStudy, ${form.name}!</h2>
                <p style="margin:6px 0 22px; color:#000000; font-size:14px;"> Learning just got fun 🚀</p>
                <p style="margin:6px 0 22px; color:#000000; font-size:14px;">You can log in using your email.</p>
            </div>
            `
        }),
    });


    try {
      // Check if student exists
      const { data: existing, error: fetchError } = await supabase
        .from("students")
        .select("id")
        .eq("email", form.email)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") { // 116 = no rows found
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (existing) {
        //localStorage.setItem("student_id", existing.id);

        setStatusMessage("✅ You are already registered. Please log in");

        setTimeout(() => {
            router.push("/");
        }, 2500);

        return;
        }


      // Insert new student
      const { data: newStudent, error: insertError } = await supabase
        .from("students")
        .insert({
          name: form.name,
          email: form.email,
          age: parseInt(form.age),
          grade: form.yearAtSchool.replace(/year\s*/i, ""),
          live:true,
          created_at:new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Save student locally
      //localStorage.setItem("student_id", newStudent.id);
      setStatusMessage("✅ Registration Successul.. you can now login");

        setTimeout(() => {
            router.push("/");
        }, 2500);
      //router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">🎓 Student Registration</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Name"
          className="w-full border p-3 rounded"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          type="number"
          placeholder="Age"
          className="w-full border p-3 rounded"
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <select
          required
          className="w-full border p-3 rounded"
          onChange={(e) => setForm({ ...form, yearAtSchool: e.target.value })}
        >
          <option value="">Year at school</option>
          <option>Year 7</option>
          <option>Year 8</option>
          <option>Year 9</option>
          <option>Year 10</option>
          <option>Year 11</option>
          <option>Year 12</option>
        </select>

        {error && <p className="text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold"
        >
          {loading ? "Registering..." : "Register"}
        </button>


      </form>
      
        {statusMessage && (
            <p className="mt-4 text-green-600 font-medium">
                {statusMessage}
            </p>
        )}
    </div>
  );
}
