// Original, copyright-safe written lessons (zh-TW) for the five course topics.
//
// Why this file exists: the course previously leaned on the teacher's
// copyrighted PDFs. The app ships none of them, so this module provides ORIGINAL
// explanatory text authored from scratch using standard, public-domain music
// theory. Music-theory FACTS (e.g. "the major scale is W-W-H-W-W-W-H") are not
// copyrightable; only a particular author's wording is. Nothing here is copied
// from any source — it is written in our own words from general theory.
//
// Accuracy: every note/chord/interval claim below was checked against `tonal`
// (the same library the app and lib/course/data.test.ts use). For example:
//   C major = C D E F G A B; A minor pentatonic = A C D E G;
//   Cmaj7 = C E G B; ii-V-I in C = Dm7 G7 Cmaj7;
//   C major diatonic triads = C Dm Em F G Am Bdim;
//   on the low-E (6th) string, fret 8 = C and fret 5 = A.
//
// Shape: pure data, no React and no logic. The course UI (LessonView) reads
// LESSON_CONTENT[slug] and renders it; integration is done elsewhere.
//
// Deep links: hrefs use the exact tool param schemas the app expects:
//   /fretboard?root=<note>&scale=<scale>
//   /caged?root=<note>&quality=<quality>
//   /chords?root=<note>&type=<type>
//   /intervals?root=<note>&interval=<interval>
//   /harmony?concept=<concept>&key=<key>
//   /practice   (no params)

/** A deep link from a section into one of the app's interactive tools. */
export interface LessonToolLink {
  /** zh-TW call-to-action label, e.g. "到指板探索看 C 大調". */
  label: string;
  /** In-app route with query params matching the tool's schema. */
  href: string;
}

/** One readable section of a lesson. */
export interface LessonSection {
  /** zh-TW section heading. */
  heading: string;
  /** One or more zh-TW paragraphs (plain prose). */
  paragraphs: string[];
  /** Optional quick-reference bullet points (zh-TW). */
  bullets?: string[];
  /** Optional deep link into a tool that practices this section. */
  tool?: LessonToolLink;
}

/** The full written content for one lesson, keyed in LESSON_CONTENT by slug. */
export interface LessonContent {
  /** What the learner should be able to do after the lesson (zh-TW). */
  objectives: string[];
  /** Ordered explanatory sections. */
  sections: LessonSection[];
  /** Frequent beginner errors and how to avoid them (zh-TW). */
  commonMistakes: string[];
  /** A concrete, ordered practice plan for this topic (zh-TW). */
  practiceSteps: string[];
}

export const LESSON_CONTENT: Record<string, LessonContent> = {
  // ───────────────────────────────────────────────────────── scale ──
  scale: {
    objectives: [
      "用「全音／半音」的排列說出大調音階的公式,並推導任何一個大調。",
      "理解自然小調,以及它與大調的「關係大小調」連結。",
      "認識大調與小調五聲音階,知道它們是同一組音的兩種看法。",
      "了解音階如何分布在指板上、為什麼要分把位練習。",
    ],
    sections: [
      {
        heading: "音階是什麼?為什麼重要",
        paragraphs: [
          "音階(scale)就是一組「依固定音高間距排好、循環出現」的音。它像是一首曲子的調色盤:旋律、即興、和弦大多從同一個音階裡取材,因此聽起來才會有一致的調性與情緒。",
          "對吉他手來說,音階特別實用:一旦把某個音階的指型記在指板上,你就能在那片區域裡安心地獨奏、填音、設計樂句,而不必逐音去猜。先把「音階的結構」想清楚,指板才不會只是死背的點。",
        ],
        bullets: [
          "半音(half step / semitone):指板上相鄰一格的距離。",
          "全音(whole step / tone):兩格的距離,等於兩個半音。",
          "級數:音階裡的第幾個音,用 1、2、3…(或 do re mi)稱呼。",
        ],
      },
      {
        heading: "大調音階的公式:全全半全全全半",
        paragraphs: [
          "大調音階(major scale)由主音往上,音與音之間的間距固定是:全-全-半-全-全-全-半(W-W-H-W-W-W-H)。半音落在第 3→4 級與第 7→8 級之間,其餘都是全音。記住這個公式,你就能算出任何大調。",
          "以 C 大調為例,套公式得到 C D E F G A B,剛好沒有任何升降記號——這也是為什麼初學常從 C 大調入門。換個主音公式不變:G 大調是 G A B C D E F#(第 7 級要升成 F# 才能維持「全全半全全全半」),D 大調則是 D E F# G A B C#。",
        ],
        bullets: [
          "公式(由主音往上):全 全 半 全 全 全 半。",
          "半音位置:3→4 級、7→8 級。",
          "C 大調:C D E F G A B(無升降)。",
          "G 大調:G A B C D E F#;D 大調:D E F# G A B C#。",
        ],
        tool: {
          label: "到指板探索看 C 大調怎麼分布",
          href: "/fretboard?root=C&scale=major",
        },
      },
      {
        heading: "自然小調與關係大小調",
        paragraphs: [
          "自然小調(natural minor)的公式是全-半-全-全-半-全-全(W-H-W-W-H-W-W),半音落在第 2→3 級與第 5→6 級。相對於大調,它的第 3、6、7 級降低半音,聽起來較暗、較感傷。以 A 為主音:A B C D E F G。",
          "把 A 自然小調與 C 大調並排會發現:它們用的是「完全相同的七個音」,只是起點不同——這就是關係大小調。每個大調都有一個關係小調,位置在大調主音「上方大六度 / 下方小三度」。所以 C 大調的關係小調是 Am;反過來,小調的關係大調在主音上方小三度(Am → C)。",
        ],
        bullets: [
          "自然小調公式:全 半 全 全 半 全 全。",
          "A 自然小調:A B C D E F G(與 C 大調同音)。",
          "關係小調 = 大調主音的下方小三度(C → Am)。",
          "關係大調 = 小調主音的上方小三度(Am → C)。",
        ],
        tool: {
          label: "切到 A 自然小調比較同一組音",
          href: "/fretboard?root=A&scale=minor",
        },
      },
      {
        heading: "五聲音階:更精簡的五個音",
        paragraphs: [
          "五聲音階(pentatonic)只用五個音,少了最容易「撞到」和弦的兩個音,因此特別好聽、好用,是搖滾與藍調獨奏的主力。大調五聲是大調去掉第 4 與第 7 級:C 大調五聲 = C D E G A。小調五聲是自然小調去掉第 2 與第 b6 級:A 小調五聲 = A C D E G。",
          "注意 C 大調五聲(C D E G A)與 A 小調五聲(A C D E G)其實是同一組音,差別只在你把哪個音當主音——這正是關係大小調觀念在五聲上的延伸。實務上很多吉他手先學「小調五聲」的盒型,因為它的第一個常用指型最直覺。",
        ],
        bullets: [
          "大調五聲 = 大調去掉第 4、7 級(C:C D E G A)。",
          "小調五聲 = 自然小調去掉第 2、b6 級(A:A C D E G)。",
          "大調五聲與其關係小調五聲是同一組音。",
        ],
        tool: {
          label: "看 A 小調五聲的指板分布",
          href: "/fretboard?root=A&scale=minor pentatonic",
        },
      },
      {
        heading: "音階在指板上:把位與連結",
        paragraphs: [
          "吉他每條弦都能彈到音階裡的音,所以同一個音會在指板上重複出現好幾個位置。與其一次背整片,不如把指板切成幾個「把位(position)」,每個把位是一段相鄰品格內、手指不太需要大移動就彈得到的指型。",
          "練熟之後,相鄰把位會在邊界互相重疊、首尾相接,於是你能從低把位一路接到高把位,把整片指板串起來。下一課的 CAGED 系統,就是一套把這些把位用五個熟悉的和弦指型來定位、連結的方法。",
        ],
        tool: {
          label: "用 CAGED 把 C 大調的把位串起來",
          href: "/caged?root=C&quality=major",
        },
      },
    ],
    commonMistakes: [
      "把「全音/半音」記反:半音是相鄰一格,全音是兩格;算錯會推出錯的音階。",
      "換調時忘了套公式,結果該升的音沒升(例如 G 大調漏掉 F#)。",
      "以為關係大小調是不同的音——其實是同一組音、不同主音。",
      "只背一個五聲盒型就停手,換把位或換調就卡住。",
      "死背指板的點卻不理解級數,導致無法移調或套到別的調。",
    ],
    practiceSteps: [
      "先在一條弦上,用「全全半全全全半」唱並彈出 C 大調,確認半音落點。",
      "在指板探索開 C 大調,專注記住一個把位的指型(先求準,不求快)。",
      "把同一個指型平移成 G 大調,驗證音名(應出現 F#)。",
      "練 A 小調五聲的第一個盒型,再對照它與 C 大調五聲是同一組音。",
      "用節拍器以慢速上行/下行該音階,乾淨後每次加 5–10 BPM。",
    ],
  },

  // ───────────────────────────────────────────────────────── caged ──
  caged: {
    objectives: [
      "說出 CAGED 代表哪五個開放和弦指型,以及它們為什麼可平移。",
      "理解五個指型如何首尾相接、覆蓋整個指板。",
      "用任一指型在指板上找到指定和弦或音階的位置。",
      "以 C 大調為例,排出五個指型在指板上的把位順序。",
    ],
    sections: [
      {
        heading: "CAGED 是什麼",
        paragraphs: [
          "CAGED 是五個你早就會的開放和弦——C、A、G、E、D——的指型縮寫。核心觀念是:這五個指型都可以「整組平移」到指板上更高的位置,變成封閉和弦(barre chord),用來彈奏任何一個調的同名和弦。",
          "為什麼剛好是這五個?因為用這五個指型,就能把一個大三和弦在指板上「無縫」地佈滿;它們合起來涵蓋了所有把位,於是 CAGED 成為一套把指板組織起來的地圖,而不只是五個孤立的和弦。",
        ],
        bullets: [
          "C、A、G、E、D = 五個開放和弦指型。",
          "每個指型都可平移成封閉和弦。",
          "平移一格 = 升高一個半音。",
        ],
      },
      {
        heading: "從開放和弦到可移動指型",
        paragraphs: [
          "把開放和弦往高把位平移時,原本的空弦沒有手指壓著,就改用食指橫按(barre)整排來取代上弦枕的作用,其餘手指維持原本的相對形狀。最常用的兩個就是 E 指型與 A 指型的封閉和弦:E 指型的根音在第六弦,A 指型的根音在第五弦。",
          "因為平移一格就升高一個半音,你只要知道根音落在第幾格,就能算出和弦名稱。例如把 E 指型平移到第六弦第 5 格,該格是 A 音,於是得到 A 和弦;平移到第 8 格(C 音)就是 C 和弦。",
        ],
        bullets: [
          "E 指型根音在第六弦;A 指型根音在第五弦。",
          "空弦改由食指橫按取代。",
          "E 指型在第六弦第 5 格 = A 和弦;第 8 格 = C 和弦。",
        ],
      },
      {
        heading: "五個指型如何連結整片指板",
        paragraphs: [
          "對任何一個大三和弦,沿著指板往高把位走,五個指型固定按 C → A → G → E → D 的順序出現,到尾端再循環回 C。相鄰兩個指型會共用一些音、在邊界重疊,因此能像拼圖一樣首尾相接,把整片指板連起來。",
          "順序的記法很簡單:就是 CAGED 這個字本身。先把某個調的五個指型位置記熟,你就能在指板任何地方,立刻認出「現在身處哪個指型、根音在哪」。",
        ],
        bullets: [
          "順序固定:C → A → G → E → D(再循環)。",
          "相鄰指型重疊、共用音,可無縫銜接。",
          "同一套順序也適用於音階與琶音,不只和弦。",
        ],
      },
      {
        heading: "實際範例:C 大調的五個把位",
        paragraphs: [
          "以 C 大調(根音 C)為例,五個指型沿指板的大致位置如下(品格為概數,實際依指型涵蓋範圍略有重疊):",
          "把這五段連起來,C 大三和弦/ C 大調音階就鋪滿了整片指板。換調時整組往上或往下平移即可——例如要彈 D,把每個位置各往高兩格(兩個半音)就好。",
        ],
        bullets: [
          "C 指型:約第 0–3 格(含開放 C 和弦那一帶)。",
          "A 指型:約第 3–5 格(根音 C 在第五弦第 3 格)。",
          "G 指型:約第 5–8 格。",
          "E 指型:約第 8–10 格(根音 C 在第六弦第 8 格)。",
          "D 指型:約第 10–13 格,之後循環回 C 指型(第 12 格為高八度)。",
        ],
        tool: {
          label: "在 CAGED 工具看 C 大調五個指型如何拼接",
          href: "/caged?root=C&quality=major",
        },
      },
      {
        heading: "用 CAGED 定位音階與琶音",
        paragraphs: [
          "CAGED 的價值不只在和弦:同一個指型框出的範圍,也告訴你該把位裡音階與琶音的落點。當你知道「現在是 E 指型」,就同時知道這附近的根音、三度、五度在哪,獨奏時更容易瞄準想要的音。",
          "建議的順序是:先把和弦指型記熟並能平移,再把對應的音階/琶音音貼到同一個框裡。這樣指板的「點」就有了結構,而不是零散的記憶。",
        ],
        tool: {
          label: "對照同一把位的音階分布",
          href: "/fretboard?root=C&scale=major",
        },
      },
    ],
    commonMistakes: [
      "只把 CAGED 當成五個和弦背,卻沒理解它們會平移、會連結。",
      "弄錯根音在第幾條弦:E 指型根音在第六弦、A 指型在第五弦。",
      "橫按時食指沒壓實、或手腕角度不對,導致悶音、雜音。",
      "忘了「平移一格 = 升一個半音」,因此算錯封閉和弦的名稱。",
      "只練單一指型,換把位就接不起來——少了重疊銜接的練習。",
    ],
    practiceSteps: [
      "先確認自己能彈乾淨的開放 C A G E D 五個和弦。",
      "把 E 指型與 A 指型練成封閉和弦,沿第六/第五弦找根音平移。",
      "在 CAGED 工具開 C 大調,依 C→A→G→E→D 順序逐一定位五個把位。",
      "在每兩個相鄰指型的邊界,找出它們共用、重疊的音。",
      "把整組往上平移兩格驗證成 D,確認名稱與根音位置正確。",
    ],
  },

  // ──────────────────────────────────────────────── chord-system ──
  "chord-system": {
    objectives: [
      "理解和弦是用「三度堆疊」建立起來的。",
      "分辨四種三和弦:大、小、減、增,以及它們的音程差異。",
      "認識常見七和弦:maj7、7、m7、m7b5、dim7 的組成。",
      "看懂常見和弦符號,並知道吉他上怎麼按出基本聲位。",
    ],
    sections: [
      {
        heading: "和弦怎麼來:三度疊置",
        paragraphs: [
          "最基本的和弦由「三度音程」一層層往上疊而成。從根音(root)出發,往上疊一個三度得到第三音,再往上疊一個三度得到第五音——這三個音就構成一個三和弦(triad)。",
          "三度有兩種大小:大三度(4 個半音)與小三度(3 個半音)。把這兩種三度用不同順序組合,就產生四種不同性格的三和弦。換句話說,和弦的「顏色」是由這些三度的大小決定的。",
        ],
        bullets: [
          "三和弦 = 根音 + 三度 + 五度。",
          "大三度 = 4 個半音;小三度 = 3 個半音。",
          "繼續往上再疊一個三度,就成為七和弦。",
        ],
      },
      {
        heading: "四種三和弦:大、小、減、增",
        paragraphs: [
          "大三和弦(major)= 大三度 + 小三度,聽起來明亮、穩定,例如 C = C E G。小三和弦(minor)= 小三度 + 大三度,較柔和、感傷,例如 Cm = C Eb G。大、小三和弦的五度相同,差別只在三度:大三度與小三度差一個半音。",
          "減三和弦(diminished)= 小三度 + 小三度,帶緊張、不安定感,例如 Cdim = C Eb Gb。增三和弦(augmented)= 大三度 + 大三度,聽起來懸浮、夢幻,例如 Caug = C E G#。減和弦把五度降半音,增和弦把五度升半音。",
        ],
        bullets: [
          "大三和弦:大三度 + 小三度(C = C E G)。",
          "小三和弦:小三度 + 大三度(Cm = C Eb G)。",
          "減三和弦:小三度 + 小三度(Cdim = C Eb Gb)。",
          "增三和弦:大三度 + 大三度(Caug = C E G#)。",
        ],
        tool: {
          label: "在和弦工具切換大/小/減/增比較聲響",
          href: "/chords?root=C",
        },
      },
      {
        heading: "七和弦:再疊一個三度",
        paragraphs: [
          "在三和弦上再往上疊一個三度,得到第七音,就成為七和弦。七和弦比三和弦多一層色彩,是流行、爵士、藍調的常客。關鍵在於「第七音」是大七度(11 個半音)還是小七度(10 個半音),以及底下的三和弦是大還是小。",
          "五個最常見的七和弦:大七和弦 maj7 = 大三和弦 + 大七度(Cmaj7 = C E G B);屬七和弦 7 = 大三和弦 + 小七度(C7 = C E G Bb);小七和弦 m7 = 小三和弦 + 小七度(Cm7 = C Eb G Bb);小七降五 m7b5(半減)= 減三和弦 + 小七度(Cm7b5 = C Eb Gb Bb);減七和弦 dim7 = 減三和弦 + 減七度(Cdim7 = C Eb Gb Bbb,聽感等同 A)。",
        ],
        bullets: [
          "maj7:大三和弦 + 大七度(Cmaj7 = C E G B)。",
          "7(屬七):大三和弦 + 小七度(C7 = C E G Bb)。",
          "m7:小三和弦 + 小七度(Cm7 = C Eb G Bb)。",
          "m7b5(半減):減三和弦 + 小七度(Cm7b5 = C Eb Gb Bb)。",
          "dim7:減三和弦 + 減七度(Cdim7 = C Eb Gb Bbb)。",
        ],
        tool: {
          label: "看 Cmaj7 的組成音與按法",
          href: "/chords?root=C&type=maj7",
        },
      },
      {
        heading: "看懂和弦符號",
        paragraphs: [
          "和弦符號是一套縮寫:大寫字母是根音(C、G、F#…);後面的後綴標明品質。沒有後綴或寫 maj 代表大三和弦;m 或 min 代表小三和弦;dim 或 ° 代表減;aug 或 + 代表增。",
          "加上數字代表七和弦或延伸音:maj7 是大七、7 是屬七、m7 是小七、m7b5(也寫 ø)是半減七、dim7(也寫 °7)是減七。先把這幾個記熟,看譜時就能立刻知道要堆哪些音。",
        ],
        bullets: [
          "C / Cmaj = 大三和弦;Cm / Cmin = 小三和弦。",
          "Cdim 或 C° = 減;Caug 或 C+ = 增。",
          "Cmaj7 大七;C7 屬七;Cm7 小七;Cm7b5(Cø)半減;Cdim7(C°7)減七。",
        ],
      },
      {
        heading: "吉他上的基本聲位",
        paragraphs: [
          "同一個和弦在吉他上有很多種按法(voicing),因為每個音都能在不同弦上找到。實務上常從「根音在第六弦或第五弦」的封閉指型入手,既好移調,也方便和前一課的 CAGED 指型對應。",
          "初學七和弦時,先求按出全部組成音、聲音乾淨,再追求漂亮的聲位排列。等熟悉了根音位置,你就能在指板上自由地把同一個和弦換到不同把位。",
        ],
        tool: {
          label: "用 CAGED 指型定位和弦根音",
          href: "/caged?root=C&quality=major",
        },
      },
    ],
    commonMistakes: [
      "只記和弦的「按法圖」卻不知道它由哪些音組成,換調就無從推算。",
      "混淆大三度(4 半音)與小三度(3 半音),導致大小和弦判斷錯誤。",
      "把屬七(7)與大七(maj7)搞混:差別在第七音是小七還是大七。",
      "忽略減和弦/增和弦是改「五度」(降或升),誤以為改的是三度。",
      "看到 m7b5、dim7 等符號就慌——其實只是固定的三度堆疊規則。",
    ],
    practiceSteps: [
      "用三度堆疊親手寫出 C、Cm、Cdim、Caug 四個三和弦的音。",
      "在和弦工具逐一切換這四種三和弦,邊聽邊比較三度與五度的差別。",
      "把每個三和弦往上加第七音,寫出 Cmaj7、C7、Cm7、Cm7b5、Cdim7。",
      "在吉他上找出根音在第五弦的封閉指型,彈出 Cmaj7 與 C7 並比較。",
      "隨機抽一個和弦符號(如 Fm7),不看工具先推音,再用工具驗證。",
    ],
  },

  // ──────────────────────────────────────────────────── diatonic ──
  diatonic: {
    objectives: [
      "理解順階和弦是「只用調內音、在每一級上疊三度」產生的。",
      "記住大調七個順階三和弦的品質:I ii iii IV V vi vii°。",
      "用級數記號(羅馬數字)描述和弦進行。",
      "認識並能在 C 大調中彈出常見進行:I–IV–V、ii–V–I、I–V–vi–IV。",
    ],
    sections: [
      {
        heading: "順階和弦怎麼產生",
        paragraphs: [
          "順階和弦(diatonic chords)是把上一課的「三度堆疊」套用到整個音階上:在音階的每一個音上,只用「調內」的音往上疊三度,就得到屬於這個調的七個和弦。因為全程不借用調外音,這些和弦聽起來自然地同屬一個家族。",
          "以 C 大調(C D E F G A B)為例,從每個音往上隔一個、再隔一個取音:C-E-G、D-F-A、E-G-B…依此類推。產生的和弦品質,完全由大調音階裡全音/半音的分布決定。",
        ],
        bullets: [
          "規則:在每一級上,只用調內音往上疊三度。",
          "七個音 → 七個順階和弦。",
          "和弦品質由音階的全/半音排列自動決定。",
        ],
      },
      {
        heading: "七個順階三和弦的品質",
        paragraphs: [
          "大調的順階三和弦品質是固定的:第 1、4、5 級是大三和弦,第 2、3、6 級是小三和弦,第 7 級是減三和弦。用級數記號寫成 I、ii、iii、IV、V、vi、vii°——大寫代表大三和弦,小寫代表小三和弦,° 代表減和弦。",
          "在 C 大調裡,這七個和弦就是 C、Dm、Em、F、G、Am、Bdim。這個品質順序(大-小-小-大-大-小-減)對每一個大調都成立,所以只要會算音階,就會算任何調的順階和弦。",
        ],
        bullets: [
          "品質順序:I 大、ii 小、iii 小、IV 大、V 大、vi 小、vii° 減。",
          "C 大調:C、Dm、Em、F、G、Am、Bdim。",
          "大寫=大三和弦,小寫=小三和弦,°=減和弦。",
        ],
        tool: {
          label: "在和弦工具逐一檢視 C 大調的順階和弦",
          href: "/chords?root=C",
        },
      },
      {
        heading: "順階七和弦",
        paragraphs: [
          "在每個順階三和弦上再疊一個調內的三度,就得到順階七和弦。大調的順階七和弦品質同樣固定:Imaj7、iim7、iiim7、IVmaj7、V7、vim7、viim7b5。注意第 5 級是「屬七(V7)」,第 7 級是「半減(m7b5)」。",
          "在 C 大調裡,就是 Cmaj7、Dm7、Em7、Fmaj7、G7、Am7、Bm7b5。其中 V7(G7)帶有最強的「想回到主和弦」的張力,是和聲進行裡的關鍵推進力——這也是下一個重點。",
        ],
        bullets: [
          "順階七和弦:Imaj7、iim7、iiim7、IVmaj7、V7、vim7、viim7b5。",
          "C 大調:Cmaj7、Dm7、Em7、Fmaj7、G7、Am7、Bm7b5。",
          "只有第 5 級是屬七(V7),張力最強。",
        ],
        tool: {
          label: "看 G7 的組成與它的推進感",
          href: "/chords?root=G&type=7",
        },
      },
      {
        heading: "級數記號與常見進行",
        paragraphs: [
          "用羅馬數字(級數)而非具體和弦名來描述進行,好處是「移調即用」:同一個 I–V–vi–IV 在任何調都成立,只要把級數換成該調的順階和弦即可。這也是流行歌分析最常用的語言。",
          "三個最常見、最好用的進行:I–IV–V 是搖滾/藍調的骨幹;ii–V–I 是爵士裡最核心的解決;I–V–vi–IV 則是無數流行歌的「萬用四和弦」。在 C 大調分別是:I–IV–V = C–F–G;ii–V–I(七和弦)= Dm7–G7–Cmaj7;I–V–vi–IV = C–G–Am–F。",
        ],
        bullets: [
          "I–IV–V(C 大調)= C – F – G。",
          "ii–V–I(七和弦,C 大調)= Dm7 – G7 – Cmaj7。",
          "I–V–vi–IV(C 大調)= C – G – Am – F。",
          "用羅馬數字描述,可直接移調到任何大調。",
        ],
      },
      {
        heading: "再走一步:借用與次屬",
        paragraphs: [
          "順階和弦是和聲的地基。等你熟了,作曲常會「暫時借一個調外和弦」來增加色彩,最常見的就是次屬和弦(secondary dominant)——例如在進到某個順階和弦前,先放一個指向它的屬七,製造更強的解決感。",
          "這些進階手法(次屬、借用、代理)都建立在你能先看清順階和弦的基礎上,所以先把上面的級數與三個常見進行練熟,再往進階和聲延伸會輕鬆很多。",
        ],
        tool: {
          label: "到進階和聲看次屬和弦怎麼運作",
          href: "/harmony?concept=secondary-dominant&key=C",
        },
      },
    ],
    commonMistakes: [
      "疊和弦時不小心用了調外音,破壞了「順階」的前提。",
      "把品質順序記錯:大調是「大-小-小-大-大-小-減」,別和小調搞混。",
      "忘了第 7 級三和弦是減和弦(vii°)、七和弦是半減(m7b5)。",
      "以為 V 級的順階七和弦是大七——其實是屬七(V7,如 C 大調的 G7)。",
      "只背 C 大調的具體和弦,卻沒用級數思考,換調就得重背。",
    ],
    practiceSteps: [
      "親手在 C 大調每一級疊三度,寫出七個順階三和弦並標級數。",
      "在和弦工具逐一彈過 C、Dm、Em、F、G、Am、Bdim,核對品質。",
      "把每個三和弦升級成順階七和弦,確認 V 級是 G7、vii 級是 Bm7b5。",
      "用吉他彈 C–F–G、Dm7–G7–Cmaj7、C–G–Am–F 三個進行,熟悉聲響。",
      "挑另一個調(如 G 大調),只靠級數推出它的順階和弦並驗證。",
    ],
  },

  // ────────────────────────────────────────────────────── basics ──
  basics: {
    objectives: [
      "建立暖指與基本手部協調的習慣,降低受傷風險。",
      "掌握交替撥弦的基本動作與右手放鬆。",
      "理解手指獨立與經濟手法(economy)的概念。",
      "會用節拍器設定速度與細分,並安排合理的每日練習。",
    ],
    sections: [
      {
        heading: "為什麼要練基本功",
        paragraphs: [
          "基本功是把「想彈的東西」變成「手能穩定做到」的橋樑。乾淨的觸弦、放鬆的雙手、穩定的節奏,這些底層能力決定了你學任何曲子、任何技巧的天花板。它們不華麗,卻是進步最划算的投資。",
          "練基本功的兩條鐵律:第一,放鬆優先——緊繃會拖慢速度也容易受傷;第二,慢而準再求快——先把動作做對,速度是「練對之後自然來的結果」,不是硬衝出來的。",
        ],
        bullets: [
          "目標:乾淨、放鬆、節奏穩。",
          "鐵律一:放鬆優先,避免緊繃與受傷。",
          "鐵律二:先慢而準,再逐步加速。",
        ],
      },
      {
        heading: "暖指:從慢速、放鬆開始",
        paragraphs: [
          "正式練習前先暖指,讓手指、手腕進入狀態。經典的入門練習是「爬格子」:在相鄰四格上,用食、中、無名、小指依序按彈(例如第 1–2–3–4 格),逐弦上行再下行,保持每個音平均、不搶拍。",
          "重點不在快,而在每個音都清楚、左右手同步、肩頸放鬆。覺得吃力或緊繃就放慢或休息——暖指是為了預備,不是為了操到痠。",
        ],
        bullets: [
          "爬格子:四指對四格,逐弦上行/下行。",
          "求每個音平均、左右手同步。",
          "肩、頸、手腕放鬆;會痠就放慢或休息。",
        ],
      },
      {
        heading: "右手:交替撥弦",
        paragraphs: [
          "交替撥弦(alternate picking)是下撥(↓)與上撥(↑)規律地交替,而不是每個音都用下撥。它讓右手動作最省、最容易提速,是單音線條與音階跑動的基礎。",
          "練習時讓 pick 只露出一點點、手腕主導小幅度擺動,並刻意數「下-上-下-上」。配合節拍器,讓每一下都落在拍點上;先把交替的規律練成反射動作,再追求速度。",
        ],
        bullets: [
          "下撥↓與上撥↑規律交替。",
          "手腕主導、動作小;pick 只露一點。",
          "心裡數「下-上-下-上」,每下對齊拍點。",
        ],
        tool: {
          label: "開節拍器練穩定的下上撥",
          href: "/practice",
        },
      },
      {
        heading: "左手:手指獨立與經濟手法",
        paragraphs: [
          "手指獨立(finger independence)是指每根手指能各自動作、不互相牽連——尤其無名指與小指最需要練。蜘蛛爬(spider)這類把指序打亂的練習(例如 1-3-2-4)能有效訓練這點。重點是按弦時不用過度施力:剛好讓音乾淨即可,多餘的力只會造成緊繃。",
          "經濟手法(economy)則是「能少動就少動」:換弦時手指走最短路徑、按過的手指不急著抬太高、撥弦方向順著移動方向。把多餘動作省掉,速度與穩定度都會跟著上來。",
        ],
        bullets: [
          "手指獨立:用打亂指序(如 1-3-2-4)練無名/小指。",
          "按弦力度剛好就好,別過度用力。",
          "經濟手法:走最短路徑、減少多餘抬指與移動。",
        ],
      },
      {
        heading: "節拍器:速度與細分",
        paragraphs: [
          "節拍器給你一個不會偏移的拍點,是練基本功的核心工具。先把速度(BPM,每分鐘拍數)設在「能彈得乾淨」的慢速,確認穩定後,每次只加一點點(例如 5–10 BPM),讓進步可被量化。",
          "進一步可練「細分」:一拍裡平均放幾個音——一個音是四分音符,兩個是八分音符,四個是十六分音符,三個則是三連音。先用八分音符對齊,再挑戰十六分與三連音,節奏感會明顯變紮實。",
        ],
        bullets: [
          "BPM = 每分鐘拍數;從乾淨的慢速起步。",
          "穩定後每次只加 5–10 BPM。",
          "細分:一拍 1 音(四分)、2 音(八分)、4 音(十六分)、3 音(三連音)。",
        ],
        tool: {
          label: "用節拍器設定 BPM 與細分來練習",
          href: "/practice",
        },
      },
      {
        heading: "安排每日練習",
        paragraphs: [
          "與其久久練一次大量,不如每天固定、短而專注。一段合理的日常大約可分成:暖指(約 5 分鐘)、技巧基本功如交替撥弦/爬格子(約 10 分鐘)、音階或和弦(約 10 分鐘)、再用一點時間套用到實際曲子或即興(約 5–10 分鐘)。時間可依自己情況縮放,重點是規律。",
          "每個項目都搭節拍器、記下今天的乾淨速度,下次從那裡接續。把「練對」放在「練多」前面,長期累積的效果會遠超偶爾的衝刺。",
        ],
        bullets: [
          "規律 > 一次練很久;每天短而專注更有效。",
          "範例分配:暖指 5、技巧 10、音階/和弦 10、應用 5–10 分鐘。",
          "每項搭節拍器並記錄乾淨速度,下次接續。",
        ],
        tool: {
          label: "把節拍器與持續低音當每日練習基底",
          href: "/practice",
        },
      },
    ],
    commonMistakes: [
      "跳過暖指、一開始就全速衝,容易出錯也容易受傷。",
      "按弦過度用力造成手部緊繃,反而拖慢速度。",
      "右手每個音都用下撥,放棄了交替撥弦帶來的效率。",
      "不用節拍器,速度忽快忽慢,節奏無法穩定。",
      "為了追速度犧牲乾淨度——錯誤動作練越多越難改。",
      "三天打魚兩天曬網;基本功靠的是每天規律累積。",
    ],
    practiceSteps: [
      "暖指 5 分鐘:在相鄰四格用 1-2-3-4 逐弦上下行,求平均與放鬆。",
      "開節拍器設一個能彈乾淨的慢速,練交替撥弦數「下-上-下-上」。",
      "用打亂指序(如 1-3-2-4)練手指獨立,特別照顧無名指與小指。",
      "把上行音階先用八分音符對齊節拍器,乾淨後再試十六分或三連音。",
      "乾淨無誤地維持後,把 BPM 加 5–10,並記下今天的速度供下次接續。",
    ],
  },
};
