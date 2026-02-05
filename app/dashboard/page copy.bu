"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase";

type Progress = {
  lesson_slug: string;
  status: string;
};

type Mastery = {
  concept_id: string;
  mastery_level: number;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [studentName, setStudentName] = useState("");
  const [progress, setProgress] = useState<Progress[]>([]);
  const [mastery, setMastery] = useState<Mastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = localStorage.getItem("student_id");
    const studentName = localStorage.getItem("student_name");

    if (!studentId) return;

    if (studentName) setStudentName(studentName);

    Promise.all([
      supabase
        .from("student_progress")
        .select("lesson_slug, status")
        .eq("student_id", studentId),

      supabase
        .from("student_mastery")
        .select("concept_id, mastery_level")
        .eq("student_id", studentId),
    ]).then(([progressRes, masteryRes]) => {
      setProgress(progressRes.data || []);
      setMastery(masteryRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-8">Loading dashboard…</p>;

  const completedLessons = progress.filter(p => p.status === "complete").length;
  const startedLessons = progress.filter(p => p.status === "started").length;

  const avgMastery =
    mastery.length > 0
      ? Math.round(
          mastery.reduce((sum, m) => sum + m.mastery_level, 0) / mastery.length
        )
      : 0;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Learning Dashboard</h1>

      {/* Welcome */}
      <div className="mb-6 p-4 bg-blue-50 border rounded">
        <h2 className="text-lg font-semibold">Welcome back{studentName && `, ${studentName}`} 👋</h2>
        <p className="text-sm text-gray-600">Here's a snapshot of your learning journey.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded bg-green-50">
          <p className="text-sm text-gray-600">Lessons Completed</p>
          <p className="text-2xl font-bold">{completedLessons}</p>
        </div>

        <div className="p-4 border rounded bg-yellow-50">
          <p className="text-sm text-gray-600">Lessons In Progress</p>
          <p className="text-2xl font-bold">{startedLessons}</p>
        </div>

        <div className="p-4 border rounded bg-purple-50">
          <p className="text-sm text-gray-600">Average Mastery Level</p>
          <p className="text-2xl font-bold">Level {avgMastery}</p>
        </div>
      </div>

      {/* Resume Learning */}
      <div className="p-6 border rounded bg-indigo-50 mb-8">
        <h3 className="font-semibold mb-2">🚀 Continue Learning</h3>
        <p className="text-sm mb-3">Jump back into your subjects and keep building mastery.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go to Subjects
        </Link>
      </div>

      {/* Encouragement */}
      <div className="text-center text-sm text-gray-600">
        Consistency builds mastery. Keep going — you're doing great 💪
      </div>
    </div>
  );
}
