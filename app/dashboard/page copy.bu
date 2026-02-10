"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase";

type ProgressRow = {
  lesson_slug: string;
  status: string;
  last_attempt_at: string;
};

type MasteryRow = {
  concept_id: string;
  mastery_level: number;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [streak, setStreak] = useState(0);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId =
    typeof window !== "undefined" ? localStorage.getItem("student_id") : null;

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------
  useEffect(() => {
    if (!studentId) return;

    Promise.all([
      supabase
        .from("student_progress")
        .select("lesson_slug, status, last_attempt_at")
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
  }, [studentId]);

  // --------------------------------------------------
  // 🔥 DAILY STREAK
  // --------------------------------------------------
  useEffect(() => {
    if (!progress.length) return;

    const days = new Set(
      progress.map((p) => new Date(p.last_attempt_at).toDateString())
    );

    let count = 0;
    let day = new Date();

    while (days.has(day.toDateString())) {
      count++;
      day.setDate(day.getDate() - 1);
    }

    setStreak(count);
  }, [progress]);

  // --------------------------------------------------
  // 🎯 RECOMMENDED LESSON (lowest mastery, not complete)
  // --------------------------------------------------
  useEffect(() => {
    if (!mastery.length || !progress.length) return;

    supabase
      .from("concept_units")
      .select("slug, concept_id")
      .then(({ data }) => {
        if (!data) return;

        let lowest = Infinity;
        let pick: string | null = null;

        data.forEach((lesson) => {
          const level =
            mastery.find((m) => m.concept_id === lesson.concept_id)
              ?.mastery_level ?? 0;

          const done = progress.some(
            (p) => p.lesson_slug === lesson.slug && p.status === "complete"
          );

          if (!done && level < lowest) {
            lowest = level;
            pick = lesson.slug;
          }
        });

        setRecommended(pick);
      });
  }, [mastery, progress]);

  if (loading) return <p className="p-6">Loading dashboard…</p>;

  // --------------------------------------------------
  // 🏆 BADGES
  // --------------------------------------------------
  const completedLessons = progress.filter((p) => p.status === "complete").length;

  const badges: string[] = [];
  if (completedLessons >= 1) badges.push("🟢 First Steps");
  if (completedLessons >= 5) badges.push("🔥 On a Roll");
  if (mastery.some((m) => m.mastery_level >= 5)) badges.push("🧠 Concept Crusher");
  if (progress.length >= 50) badges.push("💯 Practice Pro");

  // --------------------------------------------------
  // 📈 XP SYSTEM
  // --------------------------------------------------
  const totalXP =
    progress.reduce((sum, p) => sum + (p.status === "complete" ? 20 : 0), 0) +
    mastery.reduce((sum, m) => sum + m.mastery_level * 10, 0);

  const level = Math.floor(totalXP / 100);
  const xpIntoLevel = totalXP % 100;

  // --------------------------------------------------
  // 🧠 WEAKEST CONCEPT
  // --------------------------------------------------
  const weakest = mastery.reduce<MasteryRow | null>((min, m) => {
    if (!min) return m;
    return m.mastery_level < min.mastery_level ? m : min;
  }, null);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">📊 Learning Dashboard</h1>

      {/* XP */}
      <div className="mb-8">
        <h3 className="font-semibold mb-1">📈 Level {level}</h3>
        <div className="h-3 bg-gray-200 rounded">
          <div
            className="h-3 bg-indigo-600 rounded"
            style={{ width: `${xpIntoLevel}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">{xpIntoLevel}/100 XP to next level</p>
      </div>

      {/* Streak */}
      <div className="p-4 mb-8 border rounded bg-orange-50">
        <h3 className="font-semibold">🔥 Daily Streak</h3>
        <p className="text-2xl font-bold">
          {streak} day{streak !== 1 && "s"}
        </p>
      </div>

      {/* Recommended */}
      {recommended && (
        <div className="p-6 mb-8 border rounded bg-green-50">
          <h3 className="font-semibold mb-2">🎯 Recommended Next Lesson</h3>
          <Link
            href={`/lesson/${recommended}`}
            className="inline-block px-4 py-2 bg-green-600 text-white rounded"
          >
            Start Lesson
          </Link>
        </div>
      )}

      {/* Weakest Concept */}
      {weakest && weakest.mastery_level < 3 && (
        <div className="p-4 border rounded bg-red-50 mb-8">
          <h3 className="font-semibold">🧠 Needs Practice</h3>
          <p className="text-sm">
            One concept is still developing. Practicing it will boost your mastery!
          </p>
        </div>
      )}

      {/* Badges */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">🏆 Badges Earned</h3>
        <div className="flex flex-wrap gap-2">
          {badges.length > 0 ? (
            badges.map((b) => (
              <span
                key={b}
                className="px-3 py-1 bg-yellow-100 border rounded-full text-sm"
              >
                {b}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No badges yet — keep learning!
            </p>
          )}
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
