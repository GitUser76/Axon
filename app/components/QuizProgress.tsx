"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
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
          
          {/* ✅ Gradient Definition */}
          <defs>
            <linearGradient id="masteryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          {/* ✅ Grid */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* ✅ Axes */}
          <XAxis
            dataKey="concept"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            domain={[0, 150]}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />

          {/* ✅ Tooltip */}
          <Tooltip
            cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />

          {/* ✅ Bars */}
          <Bar
            dataKey="mastery"
            fill="url(#masteryGradient)"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          >
            {/* ✅ Optional color override by mastery */}
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.mastery >= 80
                    ? "#22c55e"   // green → strong
                    : entry.mastery >= 50
                    ? "#6366f1"   // indigo → progressing
                    : "#f59e0b"   // amber → needs practice
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
