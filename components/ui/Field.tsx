import type { ReactNode, SelectHTMLAttributes } from "react";

// Labeled control wrapper: a vertical <label> with a muted caption above its
// control. Replaces the repeated
//   <label class="flex flex-col gap-1 text-sm"><span class="text-gray-500">…
// block in every explorer. The control itself (Select, <input>, a toggle row…)
// is passed as children so Field stays agnostic.
export function Field({
  label,
  children,
  className = "",
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`.trim()}>
      <span className="text-sm text-gray-500">{label}</span>
      {children}
    </label>
  );
}

// Same caption + stack as Field, but renders a plain <div> instead of <label>.
// Use this when the "control" is a row of buttons (e.g. ToggleButton groups):
// wrapping interactive buttons in a <label> would hijack their clicks, so a
// toggle group must NOT live inside Field.
export function FieldGroup({
  label,
  children,
  className = "",
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 text-sm ${className}`.trim()}>
      <span className="text-sm text-gray-500">{label}</span>
      {children}
    </div>
  );
}

// A consistently styled <select> (rounded border + focus ring). Extra width or
// state classes (e.g. min-w-56, disabled:opacity-50) are passed via className.
export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-md border border-gray-300 px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  );
}
