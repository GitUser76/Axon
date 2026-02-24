"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

export type Student = {
  id: string;
  name: string;
  email: string;
  grade: string;
};

interface StudentLoginProps {
  students?: Student[]; // optional, can be passed from parent
  onSelect?: (student: Student) => void; // callback when student is selected
}

export default function StudentLogin({ students: propStudents, onSelect }: StudentLoginProps) {
  const [students, setStudents] = useState<Student[]>(propStudents || []);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Fetch students if not passed via props
  useEffect(() => {
    if (!propStudents) {
      const supabase = createClient();
      supabase
        .from("students")
        .select("id, name, email, grade")
        .eq("live", true)
        .then((res) => {
          if (res.data) setStudents(res.data);
        });
    }
  }, [propStudents]);

  const handleLogin = () => {
    if (!students.length) {
      setError("No students found. Try again later.");
      return;
    }

    const student = students.find(
      (s) => s.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!student) {
      setError("Email not registered.");
      return;
    }

    // Save to localStorage & cookies
    localStorage.setItem("student_id", student.id);
    localStorage.setItem("student_name", student.name);
    localStorage.setItem("student_grade", student.grade);
    document.cookie = `student_id=${student.id}; path=/`;
    document.cookie = `student_grade=${student.grade}; path=/`;

    setError("");

    // Call callback if provided
    if (onSelect) {
      onSelect(student);
    } else {
      location.reload(); // fallback behavior
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 border">
        {/* Intro */}
        <div className="mb-6 text-sm text-gray-600 space-y-2">
          <p className="font-medium">
            🚀 This platform is in early access. Progress is saved, and lessons
            improve over time.
          </p>
          <p>
            We’re inviting a small group of students to try an AI learning tool
            that adapts to their level.
          </p>
          <br></br>
          <p className="whitespace-normal sm:whitespace-nowrap">
            if you want to be a early adopter (try it out whilst it's being developed) then 
            email me: <strong>team.appsnapstudy@gmail.com</strong>
          </p>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-5 text-center">Student Login</h2>

        {/* Input */}
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none p-3 rounded-lg mb-4 transition"
        />

        {/* Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition shadow-sm"
        >
          Login
        </button>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
