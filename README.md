# guitar-lab

把吉他樂理變成「看得見、可練習」的工具。

guitar-lab 是一套 **local-first、桌面優先、繁體中文（zh-TW）** 的吉他教學 web app:互動指板、和弦與音階圖、節拍器與樂句庫,搭配一份貫穿全站的課程地圖,從一個地方開始學。

- **沒有後端、不需登入**:所有狀態(進度、設定、自製圖表)都存在瀏覽器的 `localStorage`。
- **線上 Demo**:<https://qpalzm963.github.io/guitar-lab/>

> 純前端靜態網站,透過 GitHub Actions 自動部署到 GitHub Pages。

---

## 特色 Differentiators

- **以課程為核心(curriculum-driven)**:一份「六大領域」的學習大綱把所有工具串起來。每個課程項目都連到對應的互動工具,並能在瀏覽器端記錄學習進度。
- **可產生並匯出指板圖當作業**:音階、CAGED、琶音、和弦圖都能在指板上生成,並匯出成 PNG 或直接列印成作業卡。
- **樂理正確(theory-correct)**:音名、音程、和弦、音階等內容皆以 [`tonal`](https://github.com/tonaljs/tonal) 計算,測驗答案也用 `tonal` 交叉驗證,而非手寫硬編。

---

## 功能總覽 Features

| 路徑 Route | 名稱 | 說明 |
| --- | --- | --- |
| `/course` | 課程 | 依老師教材整理的 **5 堂課**,含章節大綱、對應工具連結、學習進度,以及原創的選擇題小測驗。 |
| `/curriculum` | 課程地圖 | **六大領域**(音階／和弦／節奏訓練／技巧／樂句應用／樂理)共 **111 個項目**,記錄已學進度並連到工具;尚無工具的項目標示為「規劃中」。 |
| `/fretboard` | 指板探索 | 選音階與根音,看音在整個指板上的分布;可切換把位(position)、匯出 PNG,並支援網址深連結(如 `?root=C&scale=major`)。 |
| `/chords` | 和弦工具 | 看和弦音在指板上的分布與常用按法。 |
| `/caged` | CAGED 系統 | 逐一檢視 C / A / G / E / D 五個把位的和弦位置。 |
| `/intervals` | 音程練習 | 看音程在指板上的分布,並做視覺辨認測驗(visual quiz)。 |
| `/harmony` | 進階和聲 | 次屬和弦(secondary dominant)、大小調互換(modal interchange)、三全音代理(tritone sub)、轉位和弦與 Drop 2。 |
| `/licks` | 樂句庫 | 依音階 × 曲風瀏覽樂句,透過 alphaTab 播放與調速。 |
| `/practice` | 練習工具 | 節拍器(metronome)與持續音(drone),用 Tone.js 練節奏與音準。 |
| `/diagrams` | 圖表編輯器 | 手動製作指板圖作業卡,存進本機圖庫,可匯出 PNG 或列印。 |

---

## 教材與版權 Teaching materials & copyright

**這個 repo 不內含、也不散布任何受版權保護的教材。**

- 課程(`/course`)的內容——文字講解、章節大綱與測驗題——皆為**原創**,根據標準、屬於公共領域的樂理知識重新撰寫,並以 `tonal` 驗證正確性。課程頁面只呈現這份原創文字內容,**全站不載入、也不顯示任何 PDF**。
- 老師本人的教材 PDF **不在** repo 中,也**不會**發佈:`public/materials/*.pdf` 已被 `.gitignore` 排除,因此永遠不會被 commit 或上到公開的 GitHub Pages。

---

## 技術棧 Tech stack

- **框架**:[Next.js 16](https://nextjs.org)(App Router、Turbopack、靜態匯出 `output: 'export'`)
- **UI**:[React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS 4](https://tailwindcss.com)
- **樂理**:[`tonal`](https://github.com/tonaljs/tonal)(音名／音程／和弦／音階運算)
- **音訊**:[`tone`](https://tonejs.github.io)(節拍器與 drone,client-only、動態 `import` 延遲載入)
- **譜面**:[`@coderline/alphatab`](https://www.alphatab.net)(吉他譜算繪與播放)
- **狀態**:[`zustand`](https://github.com/pmndrs/zustand)(搭配 `persist` 寫入 `localStorage`)
- **指板繪製**:自製 SVG fretboard 元件
- **測試**:[`vitest`](https://vitest.dev) —— 目前 **211** 個測試,全部通過(16 個測試檔)

---

## 開始使用 Getting started

需要 Node.js(CI 使用 Node 22)。

```bash
npm install      # 安裝相依套件
npm run dev      # 啟動開發伺服器(預設 http://localhost:3000)
npm test         # 執行 vitest(211 tests)
npm run build    # 產生靜態匯出(輸出到 out/)
```

---

## 部署 Deployment

推送到 `main` 時,GitHub Actions(`.github/workflows/deploy.yml`)會建置靜態匯出並部署到 GitHub Pages。

部署細節由 `next.config.ts` 控制:

- `output: 'export'` —— 產生純靜態網站。
- `basePath` 與 `NEXT_PUBLIC_BASE_PATH` 只在環境變數 `GITHUB_PAGES=true` 時設為 `/guitar-lab`(讓網站可從子路徑提供服務,並讓 alphaTab 的 worker／字型／音色等執行期資源正確解析)。
- 本機 `dev` / `build` 不帶該環境變數,因此維持在根路徑(`/`),開發體驗不受影響。

---

## 專案結構 Project structure

```
guitar-lab/
├─ app/                 # Next.js App Router 路由(course / curriculum / fretboard / chords / caged / intervals / harmony / licks / practice / diagrams)
├─ components/          # 各功能的 UI 元件(fretboard / chord / caged / harmony / licks / practice / diagram / course / curriculum / ui)
├─ lib/
│  ├─ theory/           # 樂理運算:notes / intervals / chords / caged / positions / fretboard / harmony / scaleProjection(以 tonal 為底)
│  ├─ curriculum/       # 六大領域課程大綱(data.ts:111 個項目)
│  ├─ course/           # 課程資料與課程文字內容(data.ts / lessonContent.ts)
│  ├─ store/            # zustand stores(progress / course / diagrams / settings)+ persist
│  ├─ audio/            # Tone.js 節拍器與 drone(純排程邏輯與引擎分離以便測試)
│  ├─ alphatab/         # alphaTab 資源路徑處理
│  ├─ export/           # SVG → PNG 匯出
│  └─ url/              # 深連結初始參數
├─ data/                # 和弦按法資料(chordShapes)
├─ public/
│  └─ alphatab/         # alphaTab 執行期資源
└─ .github/workflows/   # GitHub Pages 部署
```

---

## 授權 License

本專案目前**沒有** `LICENSE` 檔案,程式碼授權方式由作者保留、待定(TBD)。

教材(`public/materials/` 內的 PDF)**明確不包含**在本 repo 中,其版權由原作者保留。
