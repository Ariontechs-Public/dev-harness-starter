# dev-harness-starter — Claude Code 工作規則

## Definition of Ready(動工前)

接到任務先檢查「準備好了沒」,**先問、不要猜**:

- **Feature 類**:有沒有 UI 規格 / `PLAN.md`?沒有,先問清楚介面長相、位置、驗證、錯誤狀態,別自己腦補。
- **Bug 類**:能不能複現?沒有重現步驟,**先請回報者補**,不要亂翻 code 亂猜。先複現,才動手。
- 邊界未定義(折扣會疊加嗎?哪個優先?價格可以變負嗎?金額四捨五入到幾位?)一律先問。

> 不要使用 `systematic-debugging` skill —— 這個 repo 的「先複現」紀律由上面的 DoR 規則負責,不要讓外部 skill 介入。

## 完成的定義(Definition of Done)

- `bash gate/gate.sh` 全綠(lint + typecheck + test)才算完成。
- **不准在 gate 沒過的情況下回報「done」。**

## 慣例(fat skills 示意 — 真實專案這裡是你公司的領域知識)

- 純函式,不改全域狀態。
- 金額一律 `Math.round(x * 100) / 100`。

## 跨模型 runner(`runner/`)

`runner/` 是一個**獨立的薄 TS 套件**,透過 Vercel AI SDK 把任務丟給不同模型,
比較「有 / 沒 harness」(細節見 `runner/README.md`、`docs/specs/`、`docs/plans/`)。

- 它**刻意不走這層 Claude Code harness** —— 自己組 system prompt,不載入任何客戶端
  skill / hook,以求跨人、跨模型可重現。改它時別硬把本 repo 的 hook 套上去。
- 它有**自己的測試**:`cd runner && npm test`。上面 `bash gate/gate.sh` 只管
  `sample-app`,**不涵蓋 `runner/`**;動了 `runner/` 要另外跑它的 test + `npx tsc --noEmit`。
- 免 key 看差別:`cd runner && npm run demo`(replay,gate 真的跑)。
- `runner/src/gate.ts` 會就地改寫 `sample-app/src/discount.ts` 跑真 gate、再還原;
  任何會 import 它的程式都別在 import 時觸發(用「直接執行才跑」的 guard)。
