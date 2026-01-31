"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "./lib/supabase";
import StudentLogin from "@/app/components/StudentLogin";

type Subject = { subject: string };
type Student = { id: string; name: string; email: string; grade: number };

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // ----------------------------
  // Load students + restore session
  // ----------------------------
  useEffect(() => {
    supabase
      .from("students")
      .select("id, name, email, grade")
      .order("name")
      .then(({ data, error }) => {
        if (!error && data) {
          setStudents(data);

          const storedId = localStorage.getItem("student_id");
          if (storedId) {
            const found = data.find((s) => s.id === storedId);
            if (found) setActiveStudent(found);
          }
        }
        setLoading(false);
      });
  }, []);

  // ----------------------------
  // Load subjects BASED ON GRADE
  // ----------------------------
  useEffect(() => {
    if (!activeStudent) return;

    supabase
      .from("concept_units")
      .select("subject, difficulty")
      .lte("difficulty", activeStudent.grade)
      .not("subject", "is", null)
      .then(({ data, error }) => {
        if (!error && data) {
          const uniqueSubjects = Array.from(
            new Set(data.map((d) => d.subject))
          ).map((s) => ({ subject: s }));
          setSubjects(uniqueSubjects);
        }
      });
  }, [activeStudent]);

  // ----------------------------
  // Logout
  // ----------------------------
  const handleLogout = () => {
    localStorage.removeItem("student_id");
    setActiveStudent(null);
    setSubjects([]);
    location.reload();
  };

  // ----------------------------
  // Login select
  // ----------------------------
  const handleStudentSelect = (student: Student) => {
    localStorage.setItem("student_id", student.id);
    setActiveStudent(student);
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Login */}

      
      {!activeStudent && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Login as a Student</h1>
          <StudentLogin students={students} onSelect={handleStudentSelect} />
        </div>
      )}

      {/* Active student header */}
      {activeStudent && (
        <div className="mb-6 flex justify-between items-center p-4 border rounded bg-blue-50">
          <div>
            <p className="font-semibold">👋 {activeStudent.name}</p>
            <p className="text-sm text-gray-600">
              You are at Grade Level: {activeStudent.grade}
            </p>
          </div>
          <br></br>

          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {/* Subjects */}
      {activeStudent && (
        <>
        <br></br>
          <h1 className="text-3xl font-bold mb-6">Choose a subject</h1>

          {subjects.length === 0 && (
            <p className="text-gray-500">No subjects available at this level yet.</p>
          )}

          {subjects.map((s) => (
            <Link
              key={s.subject}
              href={`/subject/${s.subject}`}
              className="block p-4 mb-3 border rounded hover:bg-gray-100"
            >
              {s.subject.charAt(0).toUpperCase() + s.subject.slice(1)}
              
            &nbsp;&nbsp;&nbsp;&nbsp;
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
