"use client"; // Error boundaries must be Client Components

import "./globals.css";
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // global-error replaces the root layout, so it must render its own <html>/<body>
  // and cannot use SiteHeader/PageShell. Keep it minimal: a centered rose/gray shell.
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full bg-white text-gray-900">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-600">
            發生錯誤
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
            應用程式發生問題
          </h1>
          <p className="mt-1 text-gray-600">
            這可能只是暫時的狀況。你可以再試一次,或先回首頁。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => unstable_retry()}
              className="inline-flex cursor-pointer items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
            >
              再試一次
            </button>
            {/* Plain <a>, not next/link: global-error renders outside the app
                tree (it replaces the root layout), so a full document reload to
                "/" is the correct, reliable recovery here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
            >
              回首頁
            </a>
          </div>
          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-gray-500">
              錯誤代碼:{error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
