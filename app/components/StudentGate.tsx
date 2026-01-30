"use client";

import { useState, useEffect } from "react";
import StudentLogin from "./StudentLogin"; // the email login form

export default function StudentGate({ children }: { children: React.ReactNode }) {
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("student_id");
    setStudentId(id);
  }, []);

  if (!studentId) {
    // 🔹 Show login form instead of static message
    return <StudentLogin />;
  }

  // Student selected → render app
  return <>{children}</>;
}
