# dev-harness-starter — Claude Code 工作規則

## Definition of Ready(動工前)

接到任務先檢查「準備好了沒」。TASK.md 若有未定義的邊界,**先問、不要猜**:

- 折扣碼會不會疊加?哪個優先?
- 價格有沒有下限(可以變負嗎)?
- 金額要不要四捨五入?到幾位?

問清楚、得到答案,才開始寫。

## 完成的定義(Definition of Done)

- `bash gate/gate.sh` 全綠(lint + typecheck + test)才算完成。
- **不准在 gate 沒過的情況下回報「done」。**

## 慣例(fat skills 示意 — 真實專案這裡是你公司的領域知識)

- 純函式,不改全域狀態。
- 金額一律 `Math.round(x * 100) / 100`。
