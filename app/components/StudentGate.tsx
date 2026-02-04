"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import StudentLogin from "./StudentLogin";

export default function StudentGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("student_id");
    setStudentId(id);
    setChecking(false);
  }, []);

  // ⛔ While checking localStorage, render nothing (prevents flicker)
  if (checking) return null;

  // 🌍 Public pages that should NOT require login
  const publicRoutes = ["/", "/about", "/login"];

  const isPublic = publicRoutes.includes(pathname);

  if (!studentId && !isPublic) {
    return <StudentLogin />;
  }

  return <>{children}</>;
}
