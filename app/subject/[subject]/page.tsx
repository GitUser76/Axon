"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase";
import Breadcrumbs from "@/app/components/Breadcrumbs";

type LessonRow = {
  title: string;
  slug: string;
  sub_topic: string | null;
  difficulty: number;
  concept_id: string; // ⭐ needed for mastery map
};

type ProgressRow = {
  lesson_slug: string;
  status: string;
};

type MasteryRow = {
  concept_id: string;
  mastery_level: number;
};

// -------------------------
// Helper: Lesson-level and Subject-level mastery message
// -------------------------
function getMasteryMessage(level: number) {
  if (level >= 5) return { text: "🎉 Mastered! Excellent work!", color: "#16a34a" };
  if (level >= 3) return { text: "🔵 Developing — keep practicing until mastered.", color: "#2563eb" };
  if (level >= 1) return { text: "🟡 Started — you're on your way!", color: "#facc15" };
  return { text: "⚪ Not started yet — begin practicing!", color: "#9ca3af" };
}

export default function SubjectPage() {
  const params = useParams();
  const subject = params?.subject as string;

  const supabase = createClient();

  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [masteryMap, setMasteryMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  const [subjectMastery, setSubjectMastery] = useState(0);

  useEffect(() => {
    const grade = Number(localStorage.getItem("student_grade"));
    const studentId = localStorage.getItem("student_id");

    if (!grade || !studentId || !subject) {
      setLoading(false);
      return;
    }

    supabase
      .from("concept_units")
      .select("title, slug, sub_topic, difficulty, concept_id")
      .eq("subject", subject)
      .lte("difficulty", grade)
      .order("difficulty", { ascending: true })
      .then(({ data: lessonsData }) => {
        const allLessons = lessonsData || [];
        setLessons(allLessons);

        // Load progress
        supabase
          .from("student_progress")
          .select("lesson_slug, status")
          .eq("student_id", studentId)
          .then(({ data: progressData }) => {
            const progressRows = progressData || [];
            setProgress(progressRows);

            // Load mastery levels
            supabase
              .from("student_mastery")
              .select("concept_id, mastery_level")
              .eq("student_id", studentId)
              .then(({ data: masteryRows }) => {
                const map: Record<string, number> = {};
                (masteryRows || []).forEach((row: MasteryRow) => {
                  map[row.concept_id] = row.mastery_level;
                });
                setMasteryMap(map);

                // Calculate subject mastery %
                const completed = progressRows.filter(
                  (p) =>
                    p.status === "complete" &&
                    allLessons.some((l) => l.slug === p.lesson_slug)
                ).length;

                const masteryPercent = allLessons.length
                  ? Math.round((completed / allLessons.length) * 100)
                  : 0;

                setSubjectMastery(masteryPercent);
                setLoading(false);
              });
          });
      });
  }, [subject]);

  if (loading) return <p style={{ padding: 24 }}>Loading lessons…</p>;

  const grouped = lessons.reduce<Record<string, LessonRow[]>>((acc, lesson) => {
    const key = lesson.sub_topic || "General";
    acc[key] ||= [];
    acc[key].push(lesson);
    return acc;
  }, {});

  const getProgressPercent = (topicLessons: LessonRow[]) => {
    const completedCount = topicLessons.filter((lesson) =>
      progress.some(
        (p) => p.lesson_slug === lesson.slug && p.status === "complete"
      )
    ).length;

    return Math.round((completedCount / topicLessons.length) * 100);
  };

  const toggleTopic = (topic: string) => {
    setOpenTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  // -------------------------
  // Get subject-level mastery message
  // -------------------------
  const subjectLevel = Math.round(subjectMastery / 20); // convert 0-100% → 0-5
  const { text: subjectMessage, color: subjectColor } = getMasteryMessage(subjectLevel);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: subject }]} />
      <h1 style={{ marginBottom: 24, fontWeight: "bold", color: "#1310a5" }}>
        📚 {subject}
      </h1>

      {/* SUBJECT MASTERY BAR */}
      <div style={{ marginBottom: 30, padding: 16, borderRadius: 12, background: "#eef2ff", border: "1px solid #c7d2fe" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <strong>📈 {subject} Mastery</strong>
          <span>{subjectMastery}%</span>
        </div>
        <div style={{ height: 12, background: "#ffffff", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${subjectMastery}%`, height: "100%", background: subjectMastery === 100 ? "#16a34a" : "#4f46e5" }} />
        </div>

        {/* 🔹 Subject-level encouragement message */}
        <div style={{ fontSize: 13, marginTop: 6, color: subjectColor }}>
          {subjectMessage}
        </div>
      </div>

      {/* LESSONS GROUPED BY TOPIC */}
      {Object.entries(grouped).map(([topic, topicLessons]) => {
        const percent = getProgressPercent(topicLessons);
        const isOpen = openTopics[topic] ?? true;

        let headerBg = "#f3f4f6";
        if (percent === 100) headerBg = "#dcfce7";
        else if (percent > 0) headerBg = "#dbeafe";

        return (
          <section key={topic} style={{ marginBottom: 28 }}>
            <button onClick={() => toggleTopic(topic)} style={{ width: "100%", textAlign: "left", borderRadius: 10, padding: "14px 16px", cursor: "pointer", border: "1px solid #e5e7eb", background: headerBg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 18 }}>🧠 {topic}</strong>
                <span style={{ fontSize: 18 }}>{isOpen ? "▾" : "▸"}</span>
              </div>
              <div style={{ height: 8, background: "#ffffff", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
                <div style={{ width: `${percent}%`, background: percent === 100 ? "#16a34a" : "#2563eb", height: "100%" }} />
              </div>
              <p style={{ fontSize: 12, marginTop: 6 }}>{percent}% complete</p>
            </button>

            {isOpen && (
              <div style={{ marginTop: 12 }}>
                {topicLessons.map((lesson) => {
                  const lessonStatus = progress.find((p) => p.lesson_slug === lesson.slug)?.status;
                  const level = masteryMap[lesson.concept_id] || 0;

                  const label =
                    level >= 5 ? "🟢 Mastered" :
                    level >= 3 ? "🔵 Developing — keep practicing until mastered." :
                    level >= 1 ? "🟡 Started" :
                    "⚪ Not started";

                  const bgColor =
                    lessonStatus === "complete" ? "#ecfdf5" :
                    lessonStatus === "started" ? "#eff6ff" :
                    "white";

                  return (
                    <div key={lesson.slug} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 6, marginBottom: 10, background: bgColor }}>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        Difficulty {lesson.difficulty}+
                      </div>

                      <Link href={`/lesson/${lesson.slug}`} style={{ fontSize: 16, fontWeight: 500 }}>
                        {lesson.title}
                      </Link>

                      {/* ⭐ Mastery Label */}
                      <div style={{ fontSize: 14, marginTop: 4 }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
