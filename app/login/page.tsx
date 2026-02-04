"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("email", email)
      .single();

    if (error || !data) {
      alert("Student not found. Check email or ask parent to register.");
      setLoading(false);
      return;
    }

    // Save session locally
    localStorage.setItem("student_id", data.id);

    // 👉 Redirect into the learning area
    router.push("/");
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Student Login</h1>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="Student email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 6,
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Continue Learning"}
        </button>
      </form>
    </div>
  );
}
