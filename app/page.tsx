import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center p-8">
      <h1 className="text-3xl font-bold">guitar-lab</h1>
      <p className="mt-2 text-gray-500">吉他教學工具(開發中 · P0/P1)</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/curriculum"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟課程地圖 →
        </Link>
        <Link
          href="/fretboard"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟指板探索 →
        </Link>
        <Link
          href="/chords"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟和弦工具 →
        </Link>
        <Link
          href="/caged"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟 CAGED 系統 →
        </Link>
        <Link
          href="/intervals"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟音程練習 →
        </Link>
        <Link
          href="/harmony"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟進階和聲 →
        </Link>
        <Link
          href="/practice"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟練習工具 →
        </Link>
        <Link
          href="/diagrams"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟圖表編輯器 →
        </Link>
        <Link
          href="/licks"
          className="inline-block rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          開啟樂句庫 →
        </Link>
      </div>
    </main>
  );
}
