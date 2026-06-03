import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LESSONS, getLesson } from "@/lib/course/data";
import { LessonView } from "@/components/course/LessonView";

// Static export: the lesson slugs are known at build time, so generateStaticParams
// enumerates all five and Next prerenders course/<slug>.html for each. No runtime
// params are possible in an `output: 'export'` build, which is exactly what we
// want — the route is fully static.
export function generateStaticParams() {
  return LESSONS.map((l) => ({ lesson: l.slug }));
}

// Per-lesson metadata. params is async in this Next version (App Router).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lesson: string }>;
}): Promise<Metadata> {
  const { lesson: slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) return { title: "課程 · guitar-lab" };
  return {
    title: `${lesson.title} · 課程 · guitar-lab`,
    description: lesson.summary,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lesson: string }>;
}) {
  const { lesson: slug } = await params;
  const lesson = getLesson(slug);
  // Defensive: with generateStaticParams + export this only renders for the five
  // known slugs, but guard anyway so a stray param 404s instead of crashing.
  if (!lesson) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold">{lesson.title}</h1>
      <p className="mb-6 text-sm text-gray-500">{lesson.summary}</p>
      <LessonView lesson={lesson} />
    </main>
  );
}
