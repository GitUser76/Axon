"use client";

import { useState, useEffect } from "react";

type Student = {
  id: string;
  name: string;
};

type Props = {
  activeStudent: string;
  onChange: (id: string) => void;
};

export default function StudentSwitcher({ activeStudent, onChange }: Props) {
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("student_id");
    if (!id) return;

    fetch("/api/students")
      .then((res) => res.json())
      .then((students: Student[]) => {
        const s = students.find((s) => s.id === id);
        if (s) setStudent(s);
      });
  }, []);

  if (!student) return null;

  return (
    <div className="max-w-3xl mx-auto px-6">
    <div className="mb-6 p-3 border rounded-lg bg-blue-50 flex items-center justify-between text-sm">
      <span className="text-gray-600">
        <strong>Active Student:</strong>
        &nbsp;&nbsp;<span className="font-semibold text-blue-700">{student.name}</span>
      </span>
      
    </div>
</div>


  );
}
