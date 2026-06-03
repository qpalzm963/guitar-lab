import type { ReactNode } from "react";

// Small pill for categorizing content (used on the home cards and as a generic
// status chip). Tones map to the brand + semantic palette.
export type BadgeTone = "brand" | "success" | "warning" | "info" | "neutral";

const TONES: Record<BadgeTone, string> = {
  brand: "bg-rose-100 text-rose-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
  neutral: "bg-gray-100 text-gray-600",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
