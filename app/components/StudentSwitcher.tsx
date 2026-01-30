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
    <div className="mb-6 p-2 border rounded bg-gray-50 max-w-sm">
      <strong>Active Student:</strong> {student.name}
    </div>
  );
}
