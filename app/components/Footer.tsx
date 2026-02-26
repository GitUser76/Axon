"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left */}
        <p className="text-sm text-gray-500 text-center md:text-left">
          © {new Date().getFullYear()} SnapStudy. All rights reserved.
        </p>

        {/* Right – Social */}
        <div className="flex items-center gap-4 text-xl">
          {/* <Link
            href="https://instagram.com/YOUR_HANDLE"
            target="_blank"
            className="hover:scale-110 transition"
          >
            📸
          </Link> */}

          <Link
            href="mailto:team.appsnapstudy@gmail.com"
            className="hover:scale-110 transition"
          >
            ✉️
          </Link>
        </div>
      </div>
    </footer>
  );
}