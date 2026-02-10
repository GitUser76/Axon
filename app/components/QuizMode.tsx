"use client";

import { useState } from "react";
import Link from "next/link";

export type QuizQuestion = {
  question: string;
  answer: string;
  hint: string,
  units: string,
  answer_keywords?: string[]; // ✅ ADD THIS
  difficulty: number;
};

export interface QuizModeProps {
  questions: QuizQuestion[];
  subject: string;
  subTopic: string;
  studentId: string;
}

// --------------------
// Helpers
// --------------------
const normalize = (text: string) =>
  text.toLowerCase().replace(/[^\w\s]/g, "").trim();

const keywordMatch = (input: string, keywords: string[]) => {
  const normalizedInput = normalize(input);
  return keywords.some((kw) =>
    normalizedInput.includes(normalize(kw))
  );
};

export default function QuizMode({
  questions,
  subject,
  subTopic,
  studentId,
}: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    correctAnswer?: string;
  } | null>(null);

  //AI Question
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
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

  const current = questions[currentIndex];

  const submitAnswer = async () => {
    if (!current || feedback) return; // prevent double-submit

    const keywords =
      current.answer_keywords && current.answer_keywords.length > 0
        ? current.answer_keywords
        : [current.answer];

    const isCorrect = keywordMatch(input, keywords);

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setFeedback(
      isCorrect
        ? { type: "correct" }
        : { type: "wrong", correctAnswer: current.answer }
    );

    setInput("");

    setAiAnswer("");
    setAiQuestion("");

    // Show feedback briefly, then move on
    setTimeout(async () => {
      setFeedback(null);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setFinished(true);

        // ✅ Send FINAL score (avoid stale state)
        const finalScore = isCorrect ? score + 1 : score;

        await fetch("/api/mastery/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: studentId,
            concept: subTopic,
            difficulty: current.difficulty,
            score: finalScore,
          }),
        });
      }
    }, 2500);
  };

  if (finished) {
    return (
      <div className="p-6 border rounded bg-green-50">
        <h2 className="text-2xl font-bold mb-2">Quiz Complete 🎉</h2>
        <p>
          Score: {score} / {questions.length}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Topic: {subject} → {subTopic}
        </p>

        {/* <div className="flex justify-between mt-4">
            {<Link href={`/`}>Back Home </Link>}
        </div> */}
      </div>
    );
  }

  return (
    <div className="p-6 border rounded">
      <p className="text-sm text-gray-500 mb-2">
        {subject} → {subTopic}
      </p>
      <h2 className="text-lg font-semibold mb-4">
        Question {currentIndex + 1} of {questions.length}
      </h2>

      <p className="mb-4">{current.question}</p>
      <p className="mb-4">Hint: </p>
      <p className="mb-4">{current.hint}</p>
      
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
        className="w-full border p-2 rounded mb-3"
        placeholder="Your answer"
        disabled={!!feedback}
      />

      <button
        onClick={submitAnswer}
        disabled={!!feedback}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Submit
      </button>

      {/* Feedback */}
      {feedback && (
        <div className="mt-3 text-lg">
          {feedback.type === "correct" ? (
            <span className="text-green-600">✅ Correct!</span>
          ) : (
            <span className="text-red-600">
              ❌ Wrong. Correct answer:{" "}
              <strong>{feedback.correctAnswer}</strong>
            </span>
          )}
        </div>
      )}

       {/* AI Q&A */}
       <br></br><br></br>
      <div className="mt-8 p-4 border rounded bg-gray-50">
       

        <h3 className="font-semibold mb-2">🚀 Ask a question about this lesson</h3>
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
