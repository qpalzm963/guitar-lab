import type { ButtonHTMLAttributes, ReactNode } from "react";

// A pill toggle for "selected" state (label mode, shape/position/concept
// pickers, filter axes, …). Active uses a LIGHT rose TINT — deliberately not the
// solid rose-600 reserved for primary actions in Button — so a selected toggle
// reads differently from a clickable call-to-action. Replaces the copy-pasted
// `pill` + `border-rose-600 bg-rose-600 text-white` string across explorers.
const BASE =
  "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

const ACTIVE = "border-rose-300 bg-rose-50 text-rose-700";
const INACTIVE = "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

export interface ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  active: boolean;
  className?: string;
  children: ReactNode;
}

export function ToggleButton({
  active,
  className = "",
  children,
  ...rest
}: ToggleButtonProps) {
  const cls = `${BASE} ${active ? ACTIVE : INACTIVE} ${className}`.trim();
  return (
    <button className={cls} aria-pressed={active} {...rest}>
      {children}
    </button>
  );
}
