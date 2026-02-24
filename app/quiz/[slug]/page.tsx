"use client";

import { useState, useEffect } from "react";
import QuizMode, { QuizQuestion } from "@/app/components/QuizMode";
import { createClient } from "@/app/lib/supabase";
import { useParams } from "next/navigation";

type SubTopicRow = {
  sub_topic: string;
  title: string;
};

const groupBySubTopic = (rows: { sub_topic: string; title: string }[]) => {
  return rows.reduce<Record<string, string[]>>((acc, row) => {
    if (!acc[row.sub_topic]) acc[row.sub_topic] = [];
    acc[row.sub_topic].push(row.title);
    return acc;
  }, {});
};

export default function QuizPage() {
  const params = useParams();
  const subject =
    typeof params.slug === "string"
      ? decodeURIComponent(params.slug)
      : "";

  const [subTopics, setSubTopics] = useState<SubTopicRow[]>([]);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<{ id: string; grade: number } | null>(null);

  const supabase = createClient();

  // ✅ Load student
  useEffect(() => {
    const id = localStorage.getItem("student_id");
    const gradeStr = localStorage.getItem("student_grade");
    if (id && gradeStr) setStudent({ id, grade: Number(gradeStr) });
  }, []);

  // ✅ Load subtopics
  useEffect(() => {
    const fetchSubTopics = async () => {
      try {
        const res = await fetch(
          `/api/progress/quiz/subtopics?subject=${subject}`
        );
        const data = await res.json();

        setSubTopics(data.subTopics || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSubTopics();
  }, [subject]);

  const startQuiz = async (subTopic: string) => {
    if (!student) return alert("No student logged in");

    setSelectedSubTopic(subTopic);
    setLoading(true);

    try {
      const res = await fetch("/api/progress/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          subTopic,
          studentId: student.id,
          grade: student.grade,
          numQuestions: 7,
        }),
      });

      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // 📚 SUBTOPIC SELECTION SCREEN
  // --------------------------------------------------
  if (!selectedSubTopic) {
  const grouped = groupBySubTopic(subTopics);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        📚 {subject} Quizzes
      </h1>

      <p className="mb-4 text-gray-600">
        Choose a quiz to begin:
      </p>

      <div className="space-y-6">
        {Object.entries(grouped).map(([subTopic, titles]) => (
          <div key={subTopic} className="border rounded-lg p-4 bg-white">
            
            {/* Sub-topic header */}
            <h2 className="font-bold text-lg mb-3 text-indigo-700">
              📘 {subTopic}
            </h2>
            <span className="text-xs text-gray-500">
            {titles.length} quizzes.
            </span>

            {/* Lessons inside sub-topic */}
            <div className="space-y-2">
              {titles.map((title, i) => (
                <button
                    key={`${subTopic}-${title}-${i}`}
                    onClick={() => startQuiz(subTopic)}
                    className="
                        w-full text-left
                        px-4 py-3
                        rounded-lg
                        border
                        bg-gradient-to-r from-white to-gray-50
                        hover:from-indigo-50 hover:to-indigo-100
                        hover:border-indigo-400
                        hover:shadow-md
                        transition
                        duration-200
                        cursor-pointer
                    "
                    >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           
                            <span className="font-medium text-gray-800">
                            {title}
                            </span>
                        </div>

                        <span className="text-sm text-indigo-500">
                            Start →
                        </span>
                    </div>

                </button>

              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


  // --------------------------------------------------
  // 🔮 LOADING / QUIZ
  // --------------------------------------------------
  return (
    <div className="p-6 max-w-xl mx-auto">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-semibold text-blue-600 animate-pulse">
            🔮 Generating your quiz…
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Tailored just for you
          </p>

          <div className="w-full mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : student && questions.length > 0 ? (
        <QuizMode
          questions={questions}
          subject={subject}
          subTopic={selectedSubTopic}
          studentId={student.id}
        />
      ) : (
        <p className="text-center text-gray-500">
          No questions available.
        </p>
      )}
    </div>
  );
}
