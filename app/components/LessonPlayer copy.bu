"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Check = { question: string; answer: string; advisory?: string };
type Practice = { question: string; answer: string; hint?: string };

type Lesson = {
  title: string;
  learningObjective: string;
  difficulty: number;
  slug: string;

  teach_intro?: string;
  teach_key_points?: string[];
  example_question?: string;
  example_steps?: string[];
  example_answer?: string;

  explanation: { text: string };
  check: Check[];
  practice?: Practice[];
};

type NavLesson = { slug: string; title: string };

type Props = {
  lesson: Lesson;
  prevLesson?: NavLesson | null;
  nextLesson?: NavLesson | null;
};
const steps = ["Teach", "Example", "Check", "Practice", "Complete"];

export default function LessonPlayer({ lesson, prevLesson, nextLesson }: Props) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  const [step, setStep] = useState<
    "teach" | "example" | "explanation" | "check" | "practice" | "complete"
  >("teach");

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [loadingAI, setLoadingAI] = useState(false);
  const [reteachText, setReteachText] = useState<string | null>(null);

  const normalize = (v: string) => v.toLowerCase().trim();

  useEffect(() => {
    setStudentId(localStorage.getItem("student_id"));
  }, []);

  useEffect(() => {
    if (!studentId) return;
    fetch("/api/progress/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, difficulty: lesson.difficulty }),
    });
  }, [studentId, lesson.slug, lesson.difficulty]);

  const currentCheck = lesson.check[checkIndex];

  // ------------------ CHECK ------------------
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

      if (checkIndex + 1 < lesson.check.length) setCheckIndex((i) => i + 1);
      else if (lesson.practice?.length) startPractice();
      else completeLesson();
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
          explanation: lesson.explanation.text,
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

  // ------------------ PRACTICE ------------------
  const handlePracticeCheck = async () => {
    if (!lesson.practice || !studentId) return;
    const current = lesson.practice[practiceIndex];
    const correct = normalize(answer) === normalize(current.answer);

    await fetch("/api/progress/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-student-id": studentId },
      body: JSON.stringify({ lesson_slug: lesson.slug, correct }),
    });

    setFeedback(correct ? "✅ Correct!" : `❌ Correct answer: ${current.answer}`);
    setAnswer("");

    if (practiceIndex + 1 < lesson.practice.length) setPracticeIndex((i) => i + 1);
    else completeLesson();
  };

  // ------------------ COMPLETE ------------------
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

  const startPractice = () => {
    setPracticeIndex(0);
    setAnswer("");
    setFeedback("");
    setStep("practice");
  };

  // ------------------ UI ------------------
  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h2>{lesson.learningObjective}</h2>
      <p style={{ color: "#666" }}>Difficulty: {lesson.difficulty}+</p>

      {/* TEACH */}
      {step === "teach" && (
        <>
          <p>{lesson.teach_intro}</p>
          {lesson.teach_key_points && (
            <ul>
              {lesson.teach_key_points.map((p, i) => (
                <li key={i}>• {p}</li>
              ))}
            </ul>
          )}
          <button onClick={() => setStep("example")}>See Example</button>
        </>
      )}

      {/* EXAMPLE */}
      {step === "example" && (
        <>
          <h3>Worked Example</h3>
          <p><strong>Question:</strong> {lesson.example_question}</p>
          {lesson.example_steps?.map((s, i) => <p key={i}>Step {i + 1}: {s}</p>)}
          <p><strong>Answer:</strong> {lesson.example_answer}</p>
          <button onClick={() => setStep("explanation")}>Now You Try</button>
        </>
      )}

      {/* EXPLANATION */}
      {step === "explanation" && (
        <>
          <p>{lesson.explanation.text}</p>
          <button onClick={() => setStep("check")}>Start Check</button>
        </>
      )}

      {/* CHECK */}
      {step === "check" && (
        <>
          {reteachText && <div style={{ background: "#eef" }}>{reteachText}</div>}
          <p><strong>Check {checkIndex + 1} / {lesson.check.length}</strong></p>
          <p>{currentCheck.question}</p>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <button onClick={handleCheck}>{loadingAI ? "Thinking..." : "Submit"}</button>
          {feedback && <p>{feedback}</p>}
        </>
      )}

      {/* PRACTICE */}
      {step === "practice" && lesson.practice && (
        <>
          <p><strong>Practice {practiceIndex + 1} / {lesson.practice.length}</strong></p>
          <p>{lesson.practice[practiceIndex].question}</p>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <button onClick={handlePracticeCheck}>Submit</button>
          {feedback && <p>{feedback}</p>}
        </>
      )}

      {/* COMPLETE */}
      {step === "complete" && (
        <>
          <p>🎉 Lesson complete!</p>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {prevLesson ? <Link href={`/lesson/${prevLesson.slug}`}>← {prevLesson.title}</Link> : <span />}
            {nextLesson ? <Link href={`/lesson/${nextLesson.slug}`}>{nextLesson.title} →</Link> : <span />}
          </div>
        </>
      )}
    </div>
  );
}
