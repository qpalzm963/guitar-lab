"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell
      eyebrow="發生錯誤"
      title="這個頁面出了一點問題"
      width="reading"
      subtitle="這可能只是暫時的狀況。你可以再試一次,或先回首頁。"
    >
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => unstable_retry()}>再試一次</Button>
        <Button href="/" variant="ghost">
          回首頁
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-gray-500">
          錯誤代碼:{error.digest}
        </p>
      ) : null}
    </PageShell>
  );
}
