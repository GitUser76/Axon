// app/about/page.tsx
import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontWeight: "bold", fontSize: 32 }}>About My Learning Platform</h1>

      <p style={{ marginTop: 16 }}>
        🚀 Hi! I built this platform to make learning more fun, interactive, and adaptive for students.
      </p>

      <p style={{ marginTop: 16 }}>
        I’m not a teacher, but I spend a lot of time helping my son with homework and 
        extracurricular learning. I often found it challenging to explain concepts clearly, 
        so I built this app to stay engaged with his lessons and the current syllabus.

        With AI and gamified learning, my goal was to create a space where mastery, feedback, and 
        practice are personalized — making learning both effective and fun for parent and child alike.
      </p>

      <p style={{ marginTop: 16 }}>
        This platform is currently in early access. You can explore lessons, try our AI tools, and track your progress. 
        Students get badges, mastery tracking, and more as they grow their skills.
      </p>

      <p style={{ marginTop: 16 }}>
        If you would like to get involved drop me an email at: . And i will create you an account.
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/" style={{ color: "#2563eb", fontWeight: "bold" }}>
          ⬅️ Back to Home
        </Link>
      </p>
    </div>
  );
}
