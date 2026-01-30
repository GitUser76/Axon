"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  subjects: string[];
  students: Student[];
};

export default function ClientLanding({ subjects, students }: Props) {
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [emailInput, setEmailInput] = useState("");

  // 🔹 Clear localStorage on initial load
  useEffect(() => {
    localStorage.removeItem("student_id");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.email === emailInput.trim());
    if (student) {
      localStorage.setItem("student_id", student.id);
      setActiveStudent(student);
      setEmailInput("");
    } else {
      alert("No student found with that email");
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {!activeStudent ? (
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Student Login</h1>
          <form onSubmit={handleLogin} className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="border p-2 rounded flex-1"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Login
            </button>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Active student: {activeStudent.name}
          </h2>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Choose a subject</h1>

      {subjects.map((subject) => (
        <Link
          key={subject}
          href={`/subject/${subject}`}
          className="block p-4 mb-3 border rounded hover:bg-gray-100"
        >
          {subject.charAt(0).toUpperCase() + subject.slice(1)}
        </Link>
      ))}
    </div>
  );
}
