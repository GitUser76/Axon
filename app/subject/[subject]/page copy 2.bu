
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { createClient } from "../../../app/lib/supabase";

const supabase = createClient();

type Props = {
  params: Promise<{
    subject: string;
  }>;
};

type LessonRow = {
  title: string;
  slug: string;
  sub_topic: string | null;
  difficulty: number;
};

export default async function SubjectPage(props: Props) {
  // unwrap params
  const { subject } = await props.params;
  //const studentId = localStorage.getItem("student_id");

  // fetch lessons
  const { data: lessons, error } = await supabase
    .from("concept_units")
    .select("title, slug, sub_topic, difficulty, learning_objective")
    .eq("subject", subject)
    .order("difficulty", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: subject },
          ]}
        />
        <p>❌ Failed to load lessons</p>
      </div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: subject },
          ]}
        />
        <p>📭 No lessons found for {subject}</p>
      </div>
    );
  }

  // group lessons by difficulty (6+, 7+, etc.)
  const grouped = lessons.reduce<Record<number, LessonRow[]>>(
    (acc, lesson) => {
      acc[lesson.difficulty] ||= [];
      acc[lesson.difficulty].push(lesson);
      return acc;
    },
    {}
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: subject },
        ]}
      />

      <h1 style={{ marginBottom: 24 }}>{subject}</h1>

      {Object.entries(grouped).map(([difficulty, lessons]) => (
        <section key={difficulty} style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 12 }}>
            Difficulty {difficulty}+
          </h2>

          {lessons.map((lesson) => (
            <div
              key={lesson.slug}
              style={{
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 6,
                marginBottom: 10,
              }}
            >
              {lesson.sub_topic && (
                <div style={{ fontSize: 14, color: "#666" }}>
                  {lesson.sub_topic}
                </div>
              )}

              <Link
                href={`/lesson/${lesson.slug}`}
                style={{ fontSize: 16, fontWeight: 500 }}
              >
                👉 {lesson.title}
              </Link>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
