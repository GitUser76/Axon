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

export default function LessonPlayer({ lesson, prevLesson, nextLesson }: Props) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [step, setStep] = useState<"teach" | "example" | "check" | "practice" | "complete">("teach");

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


  // ------------------ NEW: MASTERY TRACKING ------------------
  const sendProgress = async (action: string, score?: number) => {
    if (!studentId) return;

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          concept_id: lesson.slug,
          action,
          score,
        }),
      });
    } catch (err) {
      console.error("Progress tracking failed", err);
    }
  };
  // -----------------------------------------------------------

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

    sendProgress("lesson_view");
  }, [studentId, lesson.slug, lesson.difficulty]);

  const handleCheck = async () => {
  if (!studentId || showAnswer) return;

  const keywords = currentCheck.answer_keywords?.length
    ? currentCheck.answer_keywords
    : [currentCheck.answer];

  const correct = keywordMatch(answer, keywords);
  setIsCorrect(correct);

  await fetch("/api/progress/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-student-id": studentId },
    body: JSON.stringify({ lesson_slug: lesson.slug, correct }),
  });

  // ✅ CORRECT
  if (correct) {
    setFeedback("✅ Correct!");
    sendProgress("check_correct");

    if (attempts === 0) setBadges((b) => [...b, "⭐ First Try"]);
    else setBadges((b) => [...b, "🔁 Persistence"]);

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

  // ❌ INCORRECT
  const newAttempts = attempts + 1;
  setAttempts(newAttempts);

  // 🚨 MAX ATTEMPTS REACHED → SHOW ANSWER
  if (newAttempts >= MAX_ATTEMPTS) {
    setShowAnswer(true);
    setFeedback("❌ Let's look at the correct answer.");
    sendProgress("check_failed_max");
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


  // const handleCheck = async () => {
  //   if (!studentId) return;

  //   const keywords = currentCheck.answer_keywords?.length
  //     ? currentCheck.answer_keywords
  //     : [currentCheck.answer];

  //   const isCorrect = keywordMatch(answer, keywords);

  //   await fetch("/api/progress/attempt", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", "x-student-id": studentId },
  //     body: JSON.stringify({ lesson_slug: lesson.slug, correct: isCorrect }),
  //   });

  //   if (isCorrect) {
  //     setFeedback("✅ Correct!");
  //     sendProgress("check_correct");

  //     if (attempts === 0) setBadges((prev) => [...prev, "⭐ First Try"]);
  //     else setBadges((prev) => [...prev, "🔁 Persistence"]);

  //     setTimeout(() => {
  //       resetCheckState();
  //       if (checkIndex + 1 < lesson.check.length) {
  //         setCheckIndex((i) => i + 1);
  //       } else {
  //         startAIPractice();
  //       }
  //     }, 1500);
  //     return;
  //   }

  //   setAttempts((prev) => prev + 1);
  //   setLoadingAI(true);
  //   try {
  //     const mode = attempts === 0 ? "hint" : "reteach";
  //     const res = await fetch("/api/ai-feedback", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         lessonTitle: lesson.title,
  //         explanation: currentCheck.question,
  //         question: currentCheck.question,
  //         studentAnswer: answer,
  //         correctAnswer: currentCheck.answer,
  //         advisory: currentCheck.advisory,
  //         mode,
  //         difficulty: lesson.difficulty,
  //       }),
  //     });
  //     const data = await res.json();

  //     if (mode === "hint") setFeedback(`💡 Hint: ${data.response}`);
  //     else {
  //       setReteachText(data.response);
  //       setFeedback("Try again using the explanation above.");
  //       setAnswer("");
  //       setAttempts(0);
  //     }
  //   } finally {
  //     setLoadingAI(false);
  //   }
  // };

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

    if (correct) sendProgress("practice_complete");

    setFeedback(correct ? "✅ Correct!" : `❌ Not quite. Answer: ${currentAiPractice.answer}`);
    setAnswer("");

    if (correct && aiPracticeIndex + 1 >= aiPracticeQuestions.length) {
      setBadges((prev) => [...prev, "🧠 Practice Pro"]);
    }

    if (aiPracticeIndex + 1 < aiPracticeQuestions.length) {
      setAiPracticeIndex((i) => i + 1);
    } else {
      setTimeout(() => completeLesson(), 2000);
    }
  };

  const completeLesson = async () => {
    if (!studentId || hasCompleted) return;
    setHasCompleted(true);

    sendProgress("assessment_complete", 100);

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

  // ----------------------------
  // Render Lesson Blocks (NEW)
  // ----------------------------
  const renderLessonBlock = (block: LessonBlock, idx: number) => {
    switch (block.type) {
      case "text":
        return <p key={idx}>{block.content}</p>;
      case "image":
        return (
          <figure key={idx}>
            <img src={block.url} alt={block.caption || ""} className="rounded shadow mb-2" />
            <strong>{block.caption && <figcaption className="text-sm text-gray-600">{block.caption}</figcaption>}</strong>
            <br></br>
          </figure>
        );
      case "example":
        return (
          <div key={idx} className="p-4 border rounded bg-gray-50 mb-2">
            <strong>Example: {block.question}</strong>
            <ol className="list-decimal ml-5 mt-2">
              {block.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        );
      case "question":
        return (
          <div key={idx} className="p-4 border rounded bg-blue-50 mb-2">
            <strong>Try it: {block.prompt}</strong>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      {/* Progress Bar */}
      <div className="w-full overflow-x-auto mb-6">
        <div className="min-w-[600px] flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300" />
          <div
            className="absolute top-5 left-0 h-1 bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((s, i) => {
            const isComplete = i < currentStepIndex;
            const isActive = i === currentStepIndex;
            return (
              <div key={s.key} className="flex flex-col items-center flex-1 relative">
                <div
                  className={`z-10 w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold border-2
                    ${isComplete ? "bg-green-600 border-green-600 text-white" : isActive ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100" : "bg-white border-gray-400 text-gray-500"}`}
                >
                  {isComplete ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center whitespace-nowrap
                    ${isActive ? "text-blue-700" : isComplete ? "text-green-700" : "text-gray-500"}`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEACH */}
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
          <br></br>
          {/* NEW: Render lesson content blocks */}
          {lesson.lesson_content && lesson.lesson_content.map((block, idx) => renderLessonBlock(block, idx))}
          <br></br><br></br>  
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep("example")}>
            ➡️ Next: Example
          </button>
        </div>
      )}

      {/* EXAMPLE */}
      {step === "example" && (
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep("teach")}>
            ⬅️ Back To Lesson
          </button><br/><br/>
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

      {/* CHECK */}
      {step === "check" && currentCheck && (
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep("example")}>
           ⬅️ Back To Example
          </button><br/>
          
          {reteachText && <div className="bg-blue-50 p-3 mb-2"><strong>📘 Reteach</strong><p>{reteachText}</p></div>}
          <p><strong>Check {checkIndex + 1} / {lesson.check.length}</strong></p>
          <p className="text-sm text-gray-500 mb-1">
            You have {MAX_ATTEMPTS} attempts to answer.
          </p>
          <p className="text-sm text-gray-500 mb-1">
            <strong>{attempts + 1} of {MAX_ATTEMPTS} </strong>
          </p>
          <br></br>
          <p>{currentCheck.question}</p>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border p-2 rounded mb-2 w-full" />
          <button onClick={handleCheck} disabled={loadingAI} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loadingAI ? "Thinking..." : "Submit"}
          </button>
          {feedback && (
            <p className="mt-2 font-semibold" style={{ color: feedback.includes("✅") ? "green" : "red" }}>
              {feedback}
            </p>
          )}
          {/** providing correct answer */}
          {showAnswer && (
  <div className="mt-3 p-3 bg-yellow-50 border rounded">
    <p className="font-semibold">✅ Correct answer:</p>
    <p>{currentCheck.answer}</p>

    <button
      className="mt-3 px-4 py-2 bg-green-600 text-white rounded"
      onClick={() => {
        resetCheckState();
        if (checkIndex + 1 < lesson.check.length) {
          setCheckIndex((i) => i + 1);
        } else {
          startAIPractice();
        }
      }}
    >
      Continue →
    </button>
  </div>
)}

        </div>
      )}

      {/* PRACTICE */}
      {step === "practice" && (
        <div>
          <br/>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep("check")}>
            ⬅️ Back To Checking
          </button>
          {aiPracticeLoading ? (
            <p>Generating practice questions...</p>
          ) : currentAiPractice ? (
            <>
              <p><strong>Practice {aiPracticeIndex + 1} / {aiPracticeQuestions.length}</strong></p>
              <p>{currentAiPractice.question}</p>
              {currentAiPractice.hint && <p>Hint: {currentAiPractice.hint}</p>}
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border p-2 rounded mb-2 w-full" />
              <button onClick={handleAiPracticeCheck} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
              {feedback && (
                <p className="mt-2 font-semibold" style={{ color: feedback.includes("✅") ? "green" : "red" }}>
                  {feedback}
                </p>
              )}
            </>
          ) : (
            <p>No practice questions available.</p>
          )}
        </div>
      )}

      {/* COMPLETE */}
      {step === "complete" && (
        <div>
          <p>🎉 Lesson complete!</p>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-4 p-3 border rounded bg-yellow-50">
              <h4 className="font-semibold mb-2">🏆 Achievements Earned</h4>
              <ul className="list-disc ml-6">
                {badges.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}
          

          <div className="flex justify-between mt-4">
            {prevLesson ? <Link href={`/lesson/${prevLesson.slug}`}>⬅️ {prevLesson.title}</Link> : <span />}
            {nextLesson ? <Link href={`/lesson/${nextLesson.slug}`}>{nextLesson.title} ➡️</Link> : <span />}
          </div>
        </div>
      )}

      {/* AI Q&A */}
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
