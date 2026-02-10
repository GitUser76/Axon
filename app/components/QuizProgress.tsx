"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ProgressItem = {
  concept: string;
  mastery: number;
};

export default function QuizProgress({
  data,
}: {
  data: ProgressItem[];
}) {
  if (!data.length) {
    return (
      <p className="text-sm text-gray-500">
        No progress yet — complete a quiz to begin 📈
      </p>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="concept" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="mastery" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
