"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase";

const MAX_AI_ATTEMPTS = 3;

type Check = {
  question: string;
  answer: string;
  advisory?: string;
  answer_keywords?: string[];
};

type Practice = {
  question: string;
  answer: string;
  hint?: string;
  answer_keywords?: string[];
};

// ---------------------------
// New: Lesson block types
// ---------------------------
type LessonBlock =
  | { type: "text"; content: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "example"; question: string; steps: string[] }
  | { type: "question"; prompt: string; answer: string };

type Lesson = {
  title: string;
  teach_intro?: string;
  teach_key_points?: string | string[];
  example_question?: string;
  example_steps?: string | string[];
  example_answer?: string;
  explanation?: { text: string };
  check: Check[];
  practice?: Practice[];
  difficulty: number;
  slug: string;
  learningObjective: string;
  lesson_content?: LessonBlock[]; // NEW
};

type NavLesson = { slug: string; title: string };

type Props = {
  lesson: Lesson;
  prevLesson?: NavLesson | null;
  nextLesson?: NavLesson | null;
};

export default function TeachMePage({ lesson, prevLesson, nextLesson }: Props) {
    const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [loadingAI, setLoadingAI] = useState(false);
  const [reteachText, setReteachText] = useState<string | null>(null);

  const [aiPracticeQuestions, setAiPracticeQuestions] = useState<Practice[]>([]);
  const [aiPracticeIndex, setAiPracticeIndex] = useState(0);
  const [aiPracticeLoading, setAiPracticeLoading] = useState(false);

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [badges, setBadges] = useState<string[]>([]);
  const MAX_ATTEMPTS = 3;
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);


 
  const normalize = (v: string) => v.toLowerCase().trim().replace(/[^\w\s]/g, "");
  const keywordMatch = (studentAnswer: string, keywords: string[]) => {
    const normalizedStudent = normalize(studentAnswer);
    return keywords.some((kw) => normalizedStudent.includes(normalize(kw)));
  };

  const steps = [
    { key: "teach", label: "Teach" },
    { key: "example", label: "Example" },
    { key: "check", label: "Check" },
    { key: "practice", label: "Practice" },
    { key: "complete", label: "Complete" },
  ] as const;

  const currentAiPractice = aiPracticeQuestions[aiPracticeIndex];

  useEffect(() => {
    const id = localStorage.getItem("student_id");
    setStudentId(id);
  }, []);

  
  const handleCheck = async () => {
  if (!studentId || showAnswer) return;



  // ❌ INCORRECT
  const newAttempts = attempts + 1;
  setAttempts(newAttempts);

  // 🚨 MAX ATTEMPTS REACHED → SHOW ANSWER
  if (newAttempts >= MAX_ATTEMPTS) {
    setShowAnswer(true);
    setFeedback("❌ Let's look at the correct answer.");
    return;
  }

  // Otherwise: AI help
  setLoadingAI(true);
  try {
    const mode = newAttempts === 1 ? "hint" : "reteach";

    const res = await fetch("/api/ai-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonTitle: lesson.title,
  
        studentAnswer: answer,

        mode,
        difficulty: lesson.difficulty,
      }),
    });

    const data = await res.json();

    if (mode === "hint") {
      setFeedback(`💡 Hint: ${data.response}`);
    } else {
      setReteachText(data.response);
      setFeedback("Try again using the explanation above.");
    }
  } finally {
    setLoadingAI(false);
  }
};



  const startAIPractice = async () => {

    setAiPracticeLoading(true);
    setAiPracticeQuestions([]);
    setAiPracticeIndex(0);

    try {
      const res = await fetch("/api/practice-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonTitle: lesson.title, difficulty: lesson.difficulty }),
      });

      const data = await res.json();
      setAiPracticeQuestions(data.questions || []);
    } catch {
      setAiPracticeQuestions([]);
    } finally {
      setAiPracticeLoading(false);
    }
  };



  const resetCheckState = () => {
    setAnswer("");
    setFeedback("");
    setAttempts(0);
    setReteachText(null);
    //
    setReteachText(null);
    setShowAnswer(false);
    setIsCorrect(null);
  };

  const handleAiQuestion = async () => {
  if (!aiQuestion.trim()) return;

  setAiLoading(true);
  setAiAnswer("");

  try {
    console.log("Calling Teach Me API:", aiQuestion);

    const res = await fetch("/api/teach-me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: aiQuestion,
        studentId: studentId,
      }),
    });

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const data = await res.json();

    console.log("Teach Me API response:", data);

    setAiAnswer(data.answer || "Sorry, no answer received.");

  } catch (err) {
    console.error("Teach Me API error:", err);

    setAiAnswer(
      err instanceof Error ? err.message : "Error fetching answer."
    );

  } finally {
    setAiLoading(false);
  }
};


  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Back to Dashboard
        </button>

      {/* AI Q&A */}
      <div className="mt-8 p-4 border rounded bg-gray-50">
       

        <h3 className="font-semibold mb-2"> 🧠 What would you like me to teach?</h3>
        <textarea
          className="border p-2 w-full rounded mb-2"
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          placeholder="Type your question here..."
        />
        <button
          type="button"
          onClick={handleAiQuestion}
          disabled={aiLoading || !aiQuestion.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"    
        >
          {aiLoading ? "Thinking..." : "Ask"}
        </button>
        {aiAnswer && <div className="mt-2 p-2 bg-white border rounded"><strong>⭐ Answer:</strong><p>{aiAnswer}</p></div>}
      </div>
    </div>
  );
}
