"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Check = { question: string; answer: string; advisory?: string };
type Practice = { question: string; answer: string; hint?: string };

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
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [step, setStep] = useState<
    "teach" | "example" | "check" | "practice" | "complete"
  >("teach");

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [loadingAI, setLoadingAI] = useState(false);
  const [reteachText, setReteachText] = useState<string | null>(null);

  const normalize = (v: string) => v.toLowerCase().trim();

  // -------------------------
  // Load student ID
  // -------------------------
  useEffect(() => {
    const id = localStorage.getItem("student_id");
    setStudentId(id);
  }, []);

  // -------------------------
  // Start lesson progress
  // -------------------------
  useEffect(() => {
    if (!studentId) return;
    fetch("/api/progress/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, difficulty: lesson.difficulty }),
    });
  }, [studentId, lesson.slug, lesson.difficulty]);

  const currentCheck = lesson.check[checkIndex];

  // -------------------------
  // Handle check submission
  // -------------------------
  const handleCheck = async () => {
    if (!studentId) return;
    const isCorrect = normalize(answer) === normalize(currentCheck.answer);

    await fetch("/api/progress/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, correct: isCorrect }),
    });

    if (isCorrect) {
      setFeedback("✅ Correct!");
      resetCheckState();

      if (checkIndex + 1 < lesson.check.length) {
        setCheckIndex((i) => i + 1); // next check
      } else if (lesson.practice?.length) {
        startPractice();
      } else {
        completeLesson();
      }
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

  // -------------------------
  // Practice submission
  // -------------------------
  const handlePracticeCheck = async () => {
    if (!lesson.practice || !studentId) return;
    const current = lesson.practice[practiceIndex];
    const correct = normalize(answer) === normalize(current.answer);

    await fetch("/api/progress/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, correct }),
    });

    setFeedback(correct ? "✅ Correct!" : `❌ Incorrect. Correct: ${current.answer}`);
    setAnswer("");

    if (practiceIndex + 1 < lesson.practice.length) setPracticeIndex((i) => i + 1);
    else completeLesson();
  };

  // -------------------------
  // Complete lesson
  // -------------------------
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

  // -------------------------
  // Helpers
  // -------------------------
  const resetCheckState = () => {
    setAnswer("");
    setFeedback("");
    setAttempts(0);
    setReteachText(null);
  };
  const startPractice = () => {
    setPracticeIndex(0);
    setAnswer("");
    setFeedback("");
    setStep("practice");
  };

  // -------------------------
  // Progress bar
  // -------------------------
  const steps = ["Teach", "Example", "Check", "Practice", "Complete"];
  const currentStepIndex = steps.indexOf(step.charAt(0).toUpperCase() + step.slice(1));

  // -------------------------
  // Render
  // -------------------------
  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      {/* Progress Bar */}
      {/* Horizontal Progress Bar */}
<div className="flex items-center justify-between mb-8 w-full overflow-x-auto">
  {steps.map((s, i) => {
    const isActive = i === currentStepIndex;
    const isComplete = i < currentStepIndex;

    return (
      <div key={s} className="flex items-center flex-1 min-w-[120px]">
        {/* Step Circle + Label */}
        <div className="flex flex-col items-center flex-1 text-center">
          <div
            className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold border-2 transition
              ${
                isComplete
                  ? "bg-green-600 text-white border-green-600"
                  : isActive
                  ? "bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100"
                  : "bg-gray-200 text-gray-600 border-gray-300"
              }`}
          >
            {isComplete ? "✓" : i + 1}
          </div>

          <span
            className={`mt-2 text-sm font-medium px-1
              ${
                isActive
                  ? "text-blue-700"
                  : isComplete
                  ? "text-green-700"
                  : "text-gray-500"
              }`}
          >
            {s}
          </span>
        </div>

        {/* Arrow connector */}
        {i < steps.length - 1 && (
          <div className="flex items-center px-2">
            <div
              className={`h-1 w-full rounded transition
                ${isComplete ? "bg-green-500" : "bg-gray-300"}`}
              style={{ minWidth: "40px" }}
            />
            <span className="mx-1 text-gray-400">➜</span>
          </div>
        )}
      </div>
    );
  })}
</div>


      <h2>Learning Objective: {lesson.learningObjective}</h2>
      <p style={{ color: "#666" }}>Difficulty: {lesson.difficulty}+</p>
      <br />

      {/* ---------------- TEACH ---------------- */}
      {step === "teach" && (
        <div>
          {lesson.teach_intro && <p className="mb-2">{lesson.teach_intro}</p>}

          {lesson.teach_key_points && (
            <ul className="list-disc ml-6 mb-2">
              {(typeof lesson.teach_key_points === "string"
                ? lesson.teach_key_points.split("\n")
                : Array.isArray(lesson.teach_key_points)
                ? lesson.teach_key_points
                : []
              ).map((kp, idx) => (
                <li key={idx}>{kp}</li>
              ))}
            </ul>
          )}

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded mt-2"
            onClick={() => setStep("example")}
          >
            Next: Example
          </button>
        </div>
      )}

      {/* ---------------- EXAMPLE ---------------- */}
      {step === "example" && (
        <div>
          {lesson.example_question && (
            <>
              <p>
                <strong>Example:</strong> {lesson.example_question}
              </p>

              {lesson.example_steps && (
                <ul className="list-decimal ml-6 mb-2">
                  {(typeof lesson.example_steps === "string"
                    ? lesson.example_steps.split("\n")
                    : Array.isArray(lesson.example_steps)
                    ? lesson.example_steps
                    : []
                  ).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              )}

              {lesson.example_answer && (
                <p>
                  <strong>Answer:</strong> {lesson.example_answer}
                </p>
              )}
            </>
          )}

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded mt-2"
            onClick={() => setStep("check")}
          >
            Next: Check
          </button>
        </div>
      )}

      {/* ---------------- CHECK ---------------- */}
      {step === "check" && (
        <div>
          {reteachText && (
            <div className="bg-blue-50 p-3 mb-2">
              <strong>📘 Reteach</strong>
              <p>{reteachText}</p>
            </div>
          )}
          <p>
            <strong>Check {checkIndex + 1} / {lesson.check.length}</strong>
          </p>
          <p>{currentCheck.question}</p>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="border p-2 rounded mb-2 w-full"
          />
          <button
            onClick={handleCheck}
            disabled={loadingAI}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loadingAI ? "Thinking..." : "Submit"}
          </button>
          {feedback && <p className="mt-2">{feedback}</p>}
        </div>
      )}

      {/* ---------------- PRACTICE ---------------- */}
      {step === "practice" && lesson.practice && (
        <div>
          <p>
            <strong>
              Practice {practiceIndex + 1} / {lesson.practice.length}
            </strong>
          </p>
          <p>{lesson.practice[practiceIndex].question}</p>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="border p-2 rounded mb-2 w-full"
          />
          <button
            onClick={handlePracticeCheck}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Submit
          </button>
          {feedback && <p className="mt-2">{feedback}</p>}
        </div>
      )}

      {/* ---------------- COMPLETE ---------------- */}
      {step === "complete" && (
        <div>
          <p>🎉 Lesson complete!</p>
          <div className="flex justify-between mt-4">
            {prevLesson ? <Link href={`/lesson/${prevLesson.slug}`}>← {prevLesson.title}</Link> : <span />}
            {nextLesson ? <Link href={`/lesson/${nextLesson.slug}`}>{nextLesson.title} →</Link> : <span />}
          </div>
        </div>
      )}
    </div>
  );
}
