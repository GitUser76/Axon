"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "./lib/supabase";
import StudentLogin, { Student as StudentType } from "@/app/components/StudentLogin";

type Subject = { subject: string };

type MasteryRow = {
  subject: string;
  mastery: number;
};

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentType[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentType | null>(null);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // ----------------------------
  // Load students + restore session
  // ----------------------------
  useEffect(() => {
    const storedId = localStorage.getItem("student_id");

    supabase
      .from("students")
      .select("id, name, email, grade")
      .order("name")
      .then(({ data, error }) => {
        if (!error && data) {
          setStudents(data);

          if (storedId) {
            const found = data.find((s) => s.id === storedId);
            if (found) {
              setActiveStudent(found);
            } else {
              localStorage.removeItem("student_id");
            }
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
  // Load mastery
  // ----------------------------
  useEffect(() => {
    if (!activeStudent) return;

    supabase
      .from("mastery")
      .select("subject, mastery")
      .eq("student_id", activeStudent.id)
      .then(({ data }) => {
        if (data) setMastery(data);
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
  const handleStudentSelect = (student: StudentType) => {
    localStorage.setItem("student_id", student.id);
    setActiveStudent(student);
  };

  const getMasteryForSubject = (subject: string) => {
    return mastery.find((m) => m.subject === subject)?.mastery ?? 0;
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <p className="font-medium">
        🚀 This platform is in early access. Progress is saved, and lessons improve over time.
      </p>
      <p>
        We’re inviting a small group of students to try an AI learning tool that adapts to their level.
      </p>

      <br /><br />

      {/* Login */}
      {!activeStudent && !loading && (
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

          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {/* ----------------------------
          MASTERY DASHBOARD (NEW)
      ---------------------------- */}
      {activeStudent && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">📊 Your Mastery</h2>

          {subjects.map((s) => {
            const masteryValue = getMasteryForSubject(s.subject);

            return (
              <div
                key={s.subject}
                className="mb-4 p-4 border rounded bg-white"
              >
                <div className="flex justify-between mb-2">
                  <strong>
                    {s.subject.charAt(0).toUpperCase() + s.subject.slice(1)}
                  </strong>
                  <span>{masteryValue}%</span>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded overflow-hidden mb-3">
                  <div
                    className={`h-full ${
                      masteryValue >= 80
                        ? "bg-green-600"
                        : masteryValue >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${masteryValue}%` }}
                  />
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/quiz/${s.subject}`}
                    className="px-4 py-2 bg-purple-600 text-white rounded"
                  >
                    ⚡ Quick Quiz
                  </Link>

                  <Link
                    href={`/subject/${s.subject}`}
                    className="px-4 py-2 border rounded"
                  >
                    📘 Continue Lesson
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subjects (existing section stays) */}
      {/* {activeStudent && (
        <>
          <h1 className="text-3xl font-bold mb-6">Choose a subject</h1>

          {subjects.length === 0 && (
            <p className="text-gray-500">
              No subjects available at this level yet.
            </p>
          )}

          {subjects.map((s) => (
            <Link
              key={s.subject}
              href={`/subject/${s.subject}`}
              className="block p-4 mb-3 border rounded hover:bg-gray-100"
            >
              {s.subject.charAt(0).toUpperCase() + s.subject.slice(1)}
            </Link>
          ))}
        </>
      )} */}
    </div>
  );
}
