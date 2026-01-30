// app/lesson/[slug]/page.tsx
import LessonPlayer from "@/app/components/LessonPlayer";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { createClient } from "@/app/lib/supabase";

type Props = {
  params: { slug: string };
};

export default async function LessonPage(props: Props) {
  const { slug } = await props.params;
  const supabase = createClient();

  // --------------------------------------------------
  // Fetch current lesson
  // --------------------------------------------------
  const { data: lesson, error } = await supabase
    .from("concept_units")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !lesson) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Lesson not found" }]} />
        <div className="mt-8 p-6 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">❌ Lesson not found</h2>
          <p className="mb-4">The lesson you’re looking for doesn’t exist or may have been moved.</p>
          <a href="/" className="text-blue-600 underline hover:text-blue-800">
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Fetch all lessons in the same subject for prev/next
  // --------------------------------------------------
  const { data: lessons } = await supabase
    .from("concept_units")
    .select("slug, title, learning_objective, difficulty")
    .eq("subject", lesson.subject)
    .order("difficulty", { ascending: true })
    .order("title", { ascending: true }); // ensures consistent ordering

  // Find the current lesson index
  const index = lessons?.findIndex((l) => l.slug === slug) ?? -1;
  const prevLesson = index > 0 ? lessons![index - 1] : null;
  const nextLesson = index >= 0 && index < (lessons?.length ?? 0) - 1
    ? lessons![index + 1]
    : null;

  // --------------------------------------------------
  // Prepare lesson object for LessonPlayer
  // --------------------------------------------------
  const lessonData = {
    title: lesson.title,
    explanation: lesson.explanation,
    check: lesson.check,
    practice: lesson.practice,
    difficulty: lesson.difficulty,
    subject: lesson.subject,
    learningObjective: lesson.learning_objective,
    slug: lesson.slug,
    teach_intro: lesson.teach_intro,
    teach_key_points: lesson.teach_key_points,
    example_question: lesson.example_question,
    example_answer: lesson.example_answer,
    example_steps: lesson.example_steps,
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="w-full px-6 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: lesson.subject, href: `/subject/${lesson.subject}` },
          { label: lesson.title },
        ]}
      />

      <LessonPlayer
        lesson={lessonData}
        prevLesson={prevLesson}
        nextLesson={nextLesson} 
      />
    </div>
  );
}
