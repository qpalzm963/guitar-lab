import { forwardRef, type ReactNode } from "react";

// Shared wrapper for the wide fretboard SVG (~960px) the explorers render. The
// board overflows on phones, so this provides the horizontal-scroll container
// PLUS a small affordance — a "← 左右滑動 →" hint shown ONLY on small screens
// (sm:hidden) so it's clear the board scrolls. Desktop (>= sm) is unchanged: the
// hint is hidden and the board fits. The ref is forwarded to the scroll div so
// callers keep doing boardRef.current?.querySelector("svg") for PNG export.
export const ScrollableBoard = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string }
>(function ScrollableBoard({ children, className }, ref) {
  return (
    <div>
      <p className="mb-1 text-center text-xs text-gray-500 sm:hidden">
        ← 左右滑動查看完整指板 →
      </p>
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label="指板,可左右捲動查看"
        className={`overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1${
          className ? ` ${className}` : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
});
