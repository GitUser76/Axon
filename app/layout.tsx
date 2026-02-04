"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

// Pages that are public
const PUBLIC_PAGES = ["/", "/about"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentStudent, setCurrentStudent] = useState<string | "">("");
  const [isPublicPage, setIsPublicPage] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    setIsPublicPage(PUBLIC_PAGES.includes(path));
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="w-full px-6 py-4">
          <nav className="mb-4">
            <Link href="/" className="mr-4">Home</Link>
            <Link href="/about">About</Link>
          </nav>

          {/* Student selector always visible */}
          <StudentSwitcher activeStudent={currentStudent} onChange={setCurrentStudent} />

          {/* 🚦 Only block app if NOT public */}
          {isPublicPage ? children : <StudentGate>{children}</StudentGate>}
        </div>
      </body>
    </html>
  );
}
