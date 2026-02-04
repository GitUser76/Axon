"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");

  const handleLogin = () => {
    if (!studentName.trim()) return;

    // Save student locally for now
    localStorage.setItem("student_id", studentName);
    localStorage.setItem("student_grade", "3"); // default grade, adjust as needed

    // Redirect to subject selection or first lesson
    router.push("/subject");
  };

  return (
    <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>Welcome to LearnAI</h1>
      <p style={{ marginBottom: 20 }}>
        Enter your name to continue learning with AI-powered lessons, badges, and personalized practice.
      </p>

      <input
        type="text"
        placeholder="Your name"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        style={{ padding: 10, width: "80%", marginBottom: 20, borderRadius: 6, border: "1px solid #ccc" }}
      />

      <br />
      <button
        onClick={handleLogin}
        style={{ padding: "10px 20px", borderRadius: 6, background: "#4f46e5", color: "#fff", fontWeight: 600 }}
      >
        Log In
      </button>
    </div>
  );
}
