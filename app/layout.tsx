"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Footer from "@/app/components/Footer";

import StudentGate from "@/app/components/StudentGate";
import StudentSwitcher from "@/app/components/StudentSwitcher";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const PUBLIC_PATHS = ["/", "/about", "/login", "/register"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentStudent, setCurrentStudent] = useState<string | "">("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔁 Function to re-check login
  const checkLogin = () => {
    const storedId = localStorage.getItem("student_id");
    setCurrentStudent(storedId || "");
    setIsLoggedIn(!!storedId);
  };

  // Run on first load + whenever route changes
  useEffect(() => {
    checkLogin();
  }, [pathname]);

  // Listen for login changes in other components/tabs
  useEffect(() => {
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
      
        <div className="w-full px-6 py-4">
         <Link href="/">
            <Image
              src="/images/SnapStudy-App.png"
              alt="SnapStudy learning illustration"
              width={150}
              height={200}
              className="mx-auto"
              priority
            />
          </Link> 

          <nav className="mb-6 flex gap-8 text-lg items-center justify-center">
            

            <Link href="/">Home</Link>
            <Link href="/about">About</Link>

            {isLoggedIn && (
              <Link href="/dashboard" className="mr-4">Dashboard</Link>
            )}


            {!isLoggedIn && (
              <Link href="/login" className="font-semibold text-blue-600">
                Login
              </Link>
            )}
            
            {!isLoggedIn && (
              <Link href="/register" className="font-semibold text-blue-600">
                Register
              </Link>
            )}

            {isLoggedIn && (
              <button
                onClick={() => {
                  localStorage.removeItem("student_id");
                  localStorage.removeItem("student_grade");
                  window.location.href = "/";
                }}
                className="text-red-600"
              >
                Logout
              </button>
            )}

          </nav>


          {/* Student switcher only inside app */}
          {!isPublicPage && isLoggedIn && (
            <StudentSwitcher
              activeStudent={currentStudent}
              onChange={(id) => {
                setCurrentStudent(id);
                localStorage.setItem("student_id", id);
                setIsLoggedIn(true);
              }}
            />
          )}

          {/* Gate protected pages */}
          {isPublicPage ? children : <StudentGate>{children}</StudentGate>}
          
        <Footer />
        </div>
      </body>
    </html>
  );
}
