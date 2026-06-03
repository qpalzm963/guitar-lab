import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "guitar-lab",
  description: "吉他教學工具:互動指板、和弦圖、練習。",
};

// Global nav targets, in curriculum order. A plain server-rendered list (no
// client state) so the header works in the static export and never ships JS.
const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/course", label: "課程" },
  { href: "/curriculum", label: "課程地圖" },
  { href: "/fretboard", label: "指板" },
  { href: "/chords", label: "和弦" },
  { href: "/caged", label: "CAGED" },
  { href: "/intervals", label: "音程" },
  { href: "/harmony", label: "進階和聲" },
  { href: "/practice", label: "練習" },
  { href: "/licks", label: "樂句" },
  { href: "/diagrams", label: "圖表" },
];

function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <Link
          href="/"
          className="shrink-0 font-mono text-sm font-semibold tracking-tight text-gray-900"
        >
          guitar-lab
        </Link>
        <nav
          aria-label="主要導覽"
          className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm overflow-x-auto"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-gray-600 transition-colors hover:text-rose-600"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
