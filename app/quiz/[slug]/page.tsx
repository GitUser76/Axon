"use client";

import { useState, useEffect } from "react";
import QuizMode, { QuizQuestion } from "@/app/components/QuizMode";
import { createClient } from "@/app/lib/supabase";
import { useParams } from "next/navigation";

interface PageProps {
  params: { slug: string };
}

export default function QuizPage() {
  const params = useParams();
  const subject =
    typeof params.slug === "string"
      ? decodeURIComponent(params.slug)
      : "";


  const [subTopics, setSubTopics] = useState<string[]>([]);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<{ id: string; grade: number } | null>(null);

  const supabase = createClient();

  // Load student from localStorage
  useEffect(() => {
    const id = localStorage.getItem("student_id");
    const gradeStr = localStorage.getItem("student_grade");
    if (id && gradeStr) setStudent({ id, grade: Number(gradeStr) });
  }, []);

  // Load subTopics for this subject
  useEffect(() => {
    const fetchSubTopics = async () => {
      try {
        const res = await fetch(`/api/progress/quiz/subtopics?subject=${subject}`);
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
        console.log("=====> " + student.id);
      const res = await fetch("/api/progress/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          subTopic,
          studentId: student.id,
          grade: student.grade,
          numQuestions: 5,
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

  if (!selectedSubTopic) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{subject} Quiz</h1>
        <p className="mb-4">Select a sub-topic to start:</p>
        <div className="grid gap-3">
          {subTopics.map((s) => (
            <button
              key={s}
              onClick={() => startQuiz(s)}
              className="p-4 border rounded hover:bg-gray-100 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      {loading ? (
        <p>Loading Quiz...</p>
      ) : student && questions.length > 0 ? (
        <QuizMode
          questions={questions}
          subject={subject}
          subTopic={selectedSubTopic}
          studentId={student.id}
        />
      ) : (
        <p>No questions available.</p>
      )}
    </div>
  );
}
