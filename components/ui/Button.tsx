import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Shared action button. Three intents:
//  - primary   = rose-600 solid (the main call-to-action, e.g. 開始上課, play)
//  - secondary = gray-900 solid (utility actions, e.g. 匯出 PNG / 列印 / 儲存)
//  - ghost     = bordered neutral (low-emphasis actions, e.g. 清空 / 返回)
// "Selected" toggle state lives in ToggleButton, NOT here — keeping the rose
// solid exclusively for primary actions disambiguates action from selection.
export type ButtonVariant = "primary" | "secondary" | "ghost";

const BASE =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-rose-600 text-white hover:bg-rose-700",
  secondary: "border border-gray-800 bg-gray-900 text-white hover:bg-gray-700",
  ghost:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
};

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

// Rendered as a real <button> by default, or as a next/link <a> when `href` is
// passed (so nav CTAs and action buttons share one visual language).
type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", className = "", children } = props;
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`.trim();

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }

  // Strip the link-only / shared props before spreading native button attrs.
  const { variant: _v, className: _c, children: _ch, ...rest } = props;
  void _v;
  void _c;
  void _ch;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
