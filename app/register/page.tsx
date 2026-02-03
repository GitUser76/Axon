"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    if (data.studentId) {
      localStorage.setItem("student_id", data.studentId);
      router.push("/");
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-3">
      <h1 className="text-xl font-bold">Register</h1>
      <input className="border p-2 w-full" placeholder="Name" onChange={e => setName(e.target.value)} />
      <input className="border p-2 w-full" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" className="border p-2 w-full" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegister} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Create Account</button>
    </div>
  );
}
