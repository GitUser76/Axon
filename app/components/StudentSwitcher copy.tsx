// in RootLayout or HomePage
import StudentLogin from "@/app/components/StudentLogin";
import { useState, useEffect } from "react";

const [students, setStudents] = useState<Student[]>([]);
const [activeStudent, setActiveStudent] = useState<string | null>(
  localStorage.getItem("student_id")
);

useEffect(() => {
  fetch("/api/students")
    .then((res) => res.json())
    .then(setStudents);
}, []);

// Only show login if no student is selected
return (
  <>
    {!activeStudent && (
      <StudentLogin students={students} onSelect={setActiveStudent} />
    )}
    {activeStudent && (
      <StudentSwitcher activeStudent={activeStudent} onChange={setActiveStudent} />
    )}
  </>
);
