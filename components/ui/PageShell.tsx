import type { ReactNode } from "react";

// Consistent page frame: centered <main> at one of three widths, a header block
// (optional eyebrow → h1 → optional subtitle), then the page body. Replaces the
// per-page `mx-auto max-w-* p-6` + bespoke h1 + `<p class="text-sm text-gray-500">`
// shells so page width, type scale, and copy color are uniform.
type Width = "reading" | "tool" | "wide";

const WIDTHS: Record<Width, string> = {
  reading: "max-w-3xl", // long-form reading (course, lessons, practice)
  tool: "max-w-5xl", // single-tool explorers
  wide: "max-w-6xl", // dense maps / multi-column layouts
};

export function PageShell({
  eyebrow,
  title,
  subtitle,
  width = "tool",
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  width?: Width;
  children: ReactNode;
}) {
  return (
    <main className={`mx-auto w-full ${WIDTHS[width]} p-6`}>
      <header className="mb-6">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-rose-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-gray-600">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
