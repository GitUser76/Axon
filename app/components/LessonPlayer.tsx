"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  answer_keywords?: string[]; // ✅ NEW — allows partial matching
};

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
};

type NavLesson = { slug: string; title: string };

type Props = {
  lesson: Lesson;
  prevLesson?: NavLesson | null;
  nextLesson?: NavLesson | null;
};

export default function LessonPlayer({ lesson, prevLesson, nextLesson }: Props) {
  // ------------------------- STATES -------------------------
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [step, setStep] = useState<"teach" | "example" | "check" | "practice" | "complete">("teach");

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [loadingAI, setLoadingAI] = useState(false);
  const [reteachText, setReteachText] = useState<string | null>(null);

  // ------------------------- AI PRACTICE STATES -------------------------
  const [aiPracticeQuestions, setAiPracticeQuestions] = useState<Practice[]>([]);
  const [aiPracticeIndex, setAiPracticeIndex] = useState(0);
  const [aiPracticeLoading, setAiPracticeLoading] = useState(false);

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ------------------------- HELPERS -------------------------
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

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const currentCheck = lesson.check[checkIndex];
  const currentAiPractice = aiPracticeQuestions[aiPracticeIndex];

  // ------------------------- EFFECTS -------------------------
  useEffect(() => {
    const id = localStorage.getItem("student_id");
    setStudentId(id);
  }, []);

  useEffect(() => {
    if (!studentId) return;
    fetch("/api/progress/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, difficulty: lesson.difficulty }),
    });
  }, [studentId, lesson.slug, lesson.difficulty]);

  // ------------------------- CHECK HANDLER -------------------------
  const handleCheck = async () => {
    if (!studentId) return;

    const keywords = currentCheck.answer_keywords?.length
      ? currentCheck.answer_keywords
      : [currentCheck.answer];

    const isCorrect = keywordMatch(answer, keywords);

    await fetch("/api/progress/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, correct: isCorrect }),
    });

    if (isCorrect) {
      setFeedback("✅ Correct!");
      setTimeout(() => {
        resetCheckState();
        if (checkIndex + 1 < lesson.check.length) {
          setCheckIndex((i) => i + 1);
        } else {
          startAIPractice();
        }
      }, 1500);
      return;
    }

    setAttempts((prev) => prev + 1);
    setLoadingAI(true);
    try {
      const mode = attempts === 0 ? "hint" : "reteach";
      const res = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          explanation: currentCheck.question,
          question: currentCheck.question,
          studentAnswer: answer,
          correctAnswer: currentCheck.answer,
          advisory: currentCheck.advisory,
          mode,
          difficulty: lesson.difficulty,
        }),
      });
      const data = await res.json();

      if (mode === "hint") setFeedback(`💡 Hint: ${data.response}`);
      else {
        setReteachText(data.response);
        setFeedback("Try again using the explanation above.");
        setAnswer("");
        setAttempts(0);
      }
    } finally {
      setLoadingAI(false);
    }
  };

  // ------------------------- AI PRACTICE -------------------------
  const startAIPractice = async () => {
    setStep("practice");
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

  const handleAiPracticeCheck = async () => {
    if (!studentId || !currentAiPractice) return;

    const keywords = currentAiPractice.answer_keywords?.length
      ? currentAiPractice.answer_keywords
      : [currentAiPractice.answer];

    const correct = keywordMatch(answer, keywords);

    await fetch("/api/progress/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, correct }),
    });

    setFeedback(correct ? "✅ Correct!" : `❌ Not quite. Answer: ${currentAiPractice.answer}`);
    setAnswer("");

    if (aiPracticeIndex + 1 < aiPracticeQuestions.length) {
      setAiPracticeIndex((i) => i + 1);
    } else {
      setTimeout(() => completeLesson(), 2000);
    }
  };

  // ------------------------- LESSON COMPLETE -------------------------
  const completeLesson = async () => {
    if (!studentId || hasCompleted) return;
    setHasCompleted(true);

    await fetch("/api/progress/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug }),
    });

    setStep("complete");
  };

  const resetCheckState = () => {
    setAnswer("");
    setFeedback("");
    setAttempts(0);
    setReteachText(null);
  };

  // ------------------------- AI LESSON Q&A -------------------------
  const handleAiQuestion = async () => {
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiAnswer("");

    try {
      const res = await fetch("/api/lesson-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: aiQuestion,
          lessonTitle: lesson.title,
          explanation: lesson.teach_intro || lesson.explanation?.text,
        }),
      });

      const data = await res.json();
      setAiAnswer(data.answer || "Sorry, no answer received.");
    } catch {
      setAiAnswer("Error fetching answer.");
    } finally {
      setAiLoading(false);
    }
  };

  // ------------------------- RENDER -------------------------
  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      {step === "teach" && (
        <div>
          {lesson.teach_intro && <p className="mb-2">{lesson.teach_intro}</p>}
          {lesson.teach_key_points && (
            <ul className="list-disc ml-6 mb-2">
              {(Array.isArray(lesson.teach_key_points)
                ? lesson.teach_key_points
                : lesson.teach_key_points.split("\n")
              ).map((kp, idx) => (
                <li key={idx}>{kp}</li>
              ))}
            </ul>
          )}
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep("example")}>
            ➡️ Next: Example
          </button>
        </div>
      )}

      {step === "example" && (
        <div>
          {lesson.example_question && <p><strong>Example:</strong> {lesson.example_question}</p>}
          {lesson.example_steps && (
            <ul className="list-decimal ml-6 mb-2">
              {(Array.isArray(lesson.example_steps)
                ? lesson.example_steps
                : lesson.example_steps.split("\n")
              ).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
          {lesson.example_answer && <p><strong>Answer:</strong> {lesson.example_answer}</p>}
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep("check")}>
            ➡️ Next: Check
          </button>
        </div>
      )}

      {step === "check" && currentCheck && (
        <div>
          {reteachText && <div className="bg-blue-50 p-3 mb-2"><strong>📘 Reteach</strong><p>{reteachText}</p></div>}
          <p><strong>Check {checkIndex + 1} / {lesson.check.length}</strong></p>
          <p>{currentCheck.question}</p>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border p-2 rounded mb-2 w-full" />
          <button onClick={handleCheck} disabled={loadingAI} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loadingAI ? "Thinking..." : "Submit"}
          </button>
          {feedback && <p className="mt-2">{feedback}</p>}
        </div>
      )}

      {step === "practice" && (
        <div>
          {aiPracticeLoading ? (
            <p>Generating practice questions...</p>
          ) : currentAiPractice ? (
            <>
              <p><strong>Practice {aiPracticeIndex + 1} / {aiPracticeQuestions.length}</strong></p>
              <p>{currentAiPractice.question}</p>
              {currentAiPractice.hint && <p>Hint: {currentAiPractice.hint}</p>}
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border p-2 rounded mb-2 w-full" />
              <button onClick={handleAiPracticeCheck} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
              {feedback && <p className="mt-2">{feedback}</p>}
            </>
          ) : (
            <p>No practice questions available.</p>
          )}
        </div>
      )}

      {step === "complete" && (
        <div>
          <p>🎉 Lesson complete!</p>
          <div className="flex justify-between mt-4">
            {prevLesson ? <Link href={`/lesson/${prevLesson.slug}`}>⬅️ {prevLesson.title}</Link> : <span />}
            {nextLesson ? <Link href={`/lesson/${nextLesson.slug}`}>{nextLesson.title} ➡️</Link> : <span />}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h3 className="font-semibold mb-2">🤖 Ask a question about this lesson</h3>
        <textarea
          className="border p-2 w-full rounded mb-2"
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          placeholder="Type your question here..."
        />
        <button onClick={handleAiQuestion} disabled={aiLoading || !aiQuestion.trim()} className="px-4 py-2 bg-green-900 text-white rounded">
          {aiLoading ? "Thinking..." : "Ask"}
        </button>
        {aiAnswer && <div className="mt-2 p-2 bg-white border rounded"><strong>⭐ Answer:</strong><p>{aiAnswer}</p></div>}
      </div>
    </div>
  );
}
