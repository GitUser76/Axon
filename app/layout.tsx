"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import StudentGate from "@/app/components/StudentGate";
import StudentSwitcher from "@/app/components/StudentSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
   const [currentStudent, setCurrentStudent] = useState<string | "">("");
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="w-full px-6 py-4">

          {/* Student selector always visible */}
          <StudentSwitcher
          activeStudent={currentStudent}
            onChange={setCurrentStudent}
          />

          {/* 🚦 Block app without active student */}
          <StudentGate>
            {children}
          </StudentGate>
        </div>
      </body>
    </html>
  );
}
