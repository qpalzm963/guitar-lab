import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LESSONS, getLesson } from "@/lib/course/data";
import { LessonView } from "@/components/course/LessonView";
import { PageShell } from "@/components/ui/PageShell";

// Static export: the lesson slugs are known at build time, so generateStaticParams
// enumerates them all and Next prerenders course/<slug>.html for each. No runtime
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
  // Defensive: with generateStaticParams + export this only renders for the
  // known slugs, but guard anyway so a stray param 404s instead of crashing.
  if (!lesson) notFound();

  return (
    <PageShell
      eyebrow={`第 ${lesson.order} 課`}
      title={lesson.title}
      width="reading"
      subtitle={lesson.summary}
    >
      <LessonView lesson={lesson} />
    </PageShell>
  );
}
