"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase";
import Breadcrumbs from "@/app/components/Breadcrumbs";

type LessonRow = {
  title: string;
  slug: string;
  sub_topic: string | null;
  difficulty: number;
};

type ProgressRow = {
  lesson_slug: string;
  status: string; // "started" | "complete"
};

export default function SubjectPage() {
  const { subject } = useParams<{ subject: string }>();
  const supabase = createClient();

  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const grade = Number(localStorage.getItem("student_grade"));
    const studentId = localStorage.getItem("student_id");

    if (!grade || !studentId || !subject) {
      setLoading(false);
      return;
    }

    // 1️⃣ Fetch lessons allowed for this student level
    supabase
      .from("concept_units")
      .select("title, slug, sub_topic, difficulty")
      .eq("subject", subject)
      .lte("difficulty", grade)
      .order("difficulty", { ascending: true })
      .then(({ data: lessonsData, error }) => {
        if (error) {
          console.error("Lessons error:", error);
          setLoading(false);
          return;
        }

        setLessons(lessonsData || []);

        // 2️⃣ Fetch student progress
        supabase
          .from("student_progress")
          .select("lesson_slug, status")
          .eq("student_id", studentId)
          .then(({ data: progressData, error: progressError }) => {
            if (progressError) {
              console.error("Progress error:", progressError);
            }
            setProgress(progressData || []);
            setLoading(false);
          });
      });
  }, [subject]);

  if (loading) return <p style={{ padding: 24 }}>Loading lessons…</p>;

  if (!lessons.length)
    return (
      <div style={{ padding: 24 }}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: subject }]} />
        <p>No lessons available for your level yet.</p>
      </div>
    );

  // 📚 Group lessons by sub-topic
  const grouped = lessons.reduce<Record<string, LessonRow[]>>((acc, lesson) => {
    const key = lesson.sub_topic || "General";
    acc[key] ||= [];
    acc[key].push(lesson);
    return acc;
  }, {});

  // 📊 Progress % per sub-topic
  const getProgressPercent = (topicLessons: LessonRow[]) => {
    const completedCount = topicLessons.filter((lesson) =>
      progress.some(
        (p) => p.lesson_slug === lesson.slug && p.status === "complete"
      )
    ).length;

    return Math.round((completedCount / topicLessons.length) * 100);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: subject }]} />
      <h1 style={{ marginBottom: 24 }}>{subject}</h1>

      {Object.entries(grouped).map(([topic, topicLessons]) => {
        const percent = getProgressPercent(topicLessons);

        return (
          <section key={topic} style={{ marginBottom: 40 }}>
            {/* 🟦 Sub-topic Header */}
            <div style={{ marginBottom: 8 }}>
              <h2>{topic}</h2>

              {/* 📊 Progress Bar */}
              <div
                style={{
                  height: 10,
                  background: "#eee",
                  borderRadius: 5,
                  overflow: "hidden",
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    background: percent === 100 ? "#16a34a" : "#2563eb",
                    height: "100%",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                {percent}% complete
              </p>
            </div>

            {/* 📚 Lessons */}
            {topicLessons.map((lesson) => {
              const lessonStatus = progress.find(
                (p) => p.lesson_slug === lesson.slug
              )?.status;

              const bgColor =
                lessonStatus === "complete"
                  ? "#ecfdf5" // green
                  : lessonStatus === "started"
                  ? "#eff6ff" // light blue
                  : "white";

              return (
                <div
                  key={lesson.slug}
                  style={{
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    marginBottom: 10,
                    background: bgColor,
                  }}
                >
                  <div style={{ fontSize: 14, color: "#666" }}>
                    Difficulty {lesson.difficulty}+
                  </div>

                  <Link
                    href={`/lesson/${lesson.slug}`}
                    style={{ fontSize: 16, fontWeight: 500 }}
                  >
                    {lessonStatus === "complete"
                      ? "✅ "
                      : lessonStatus === "started"
                      ? "🟦 "
                      : "👉 "}
                    {lesson.title}
                  </Link>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
