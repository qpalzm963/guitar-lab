import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

// Home groups the tools the way the curriculum does: start here → theory tools →
// practice. Each card is a titled link with a one-line value prop and a category
// badge, replacing the flat row of 10 identical rose buttons.
type Tool = {
  href: string;
  title: string;
  desc: string;
};

type Group = {
  heading: string;
  tone: BadgeTone;
  badge: string;
  tools: Tool[];
};

const GROUPS: Group[] = [
  {
    heading: "開始學習",
    tone: "brand",
    badge: "課程",
    tools: [
      {
        href: "/course",
        title: "課程",
        desc: "循序漸進的七堂課,含大綱、工具與小測驗。",
      },
    ],
  },
  {
    heading: "樂理工具",
    tone: "info",
    badge: "樂理",
    tools: [
      {
        href: "/fretboard",
        title: "指板探索",
        desc: "選音階與根音,看音在整個指板上的分布。",
      },
      {
        href: "/chords",
        title: "和弦工具",
        desc: "看和弦音在指板上的分布與常用按法。",
      },
      {
        href: "/caged",
        title: "CAGED 系統",
        desc: "逐一檢視 C/A/G/E/D 五個把位的和弦位置。",
      },
      {
        href: "/intervals",
        title: "音程練習",
        desc: "看音程在指板上的分布,並做視覺辨認測驗。",
      },
      {
        href: "/harmony",
        title: "進階和聲",
        desc: "次屬、借用、三全音代理、轉位與 Drop 2。",
      },
    ],
  },
  {
    heading: "練習與製作",
    tone: "success",
    badge: "練習",
    tools: [
      {
        href: "/practice",
        title: "練習工具",
        desc: "節拍器、持續音、調音器與聽力測驗,練節奏、音準與辨音。",
      },
      {
        href: "/licks",
        title: "樂句庫",
        desc: "依音階與曲風瀏覽樂句,可播放與調速。",
      },
      {
        href: "/diagrams",
        title: "圖表編輯器",
        desc: "手動製作指板圖作業卡,存檔、匯出或列印。",
      },
    ],
  },
];

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-6xl flex-1 p-6 focus:outline-none"
    >
      <section aria-labelledby="hero-heading" className="py-8">
        <p className="text-xs font-medium uppercase tracking-wide text-rose-600">
          guitar-lab
        </p>
        <h1
          id="hero-heading"
          className="mt-1 text-3xl font-semibold tracking-tight text-gray-900"
        >
          把吉他樂理變成看得見、可練習的工具
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          互動指板、和弦與音階圖、節拍器與樂句庫,從一個地方開始學。
        </p>
        <div className="mt-5">
          <Button href="/course">開始上課 →</Button>
        </div>
      </section>

      <div className="space-y-10 pb-12">
        {GROUPS.map((group) => (
          <section
            key={group.heading}
            aria-labelledby={`sec-${group.heading}`}
          >
            <h2
              id={`sec-${group.heading}`}
              className="mb-3 text-lg font-semibold text-gray-900"
            >
              {group.heading}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-rose-200 hover:bg-rose-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {tool.title}
                    </h3>
                    <Badge tone={group.tone}>{group.badge}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{tool.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
