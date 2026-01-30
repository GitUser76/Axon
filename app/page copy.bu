"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "./lib/supabase";
import StudentLogin from "@/app/components/StudentLogin";

type Subject = { subject: string };
type Student = { id: string; name: string; email: string, grade:string };


export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const studentId = localStorage.getItem("student_id");
    console.log(studentId);


    // Load subjects
    supabase
      .from("concept_units")
      .select("subject")
      .not("subject", "is", null)
      .then(({ data, error }) => {
        if (!error && data) {
          const uniqueSubjects = Array.from(
            new Set(data.map((d) => d.subject))
          ).map((s) => ({ subject: s }));
          setSubjects(uniqueSubjects);
        }
      });

    // Load students
    supabase
      .from("students")
      .select("id, name, email")
      .order("name")
      .then(({ data, error }) => {
        if (!error && data) {
          setStudents(data);

          // Check localStorage for active student
          const storedId = localStorage.getItem("student_id");
          if (storedId) {
            const found = data.find((s) => s.id === storedId);
            if (found) setActiveStudent(found);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ----------------------------
  // Logout function
  // ----------------------------
  const handleLogout = () => {
    localStorage.removeItem("student_id"); // clear storage
    setActiveStudent(null); // reset state
    location.reload();
  };

  // ----------------------------
  // Handle student login
  // ----------------------------
  const handleStudentSelect = (student: Student) => {
    localStorage.setItem("student_id", student.id);
    localStorage.setItem("student_grade", student.grade);
    
    setActiveStudent(student);
    
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Show login if no active student */}
      {!activeStudent && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Login as a Student</h1>
          <StudentLogin students={students} onSelect={handleStudentSelect} />
        </div>
      )}

      {/* Active student info + Logout */}
      {activeStudent && (
        <div className="mb-6 flex justify-between items-center p-4 border rounded bg-blue-50">
          
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout 
          </button>
        </div>
      )}

      {/* Subjects only visible if student is active */}
      {activeStudent && (
        <><br></br>
          <h1 className="text-3xl font-bold mb-6">Choose a subject</h1>
          
          {subjects.map((s) => (
            <Link
              key={s.subject}
              href={`/subject/${s.subject}`}
              className="block p-4 mb-3 border rounded hover:bg-gray-100"
            >
              {s.subject.charAt(0).toUpperCase() + s.subject.slice(1)}
              &nbsp;&nbsp;
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
