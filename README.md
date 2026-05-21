# dev-harness-starter

一個可跑的「薄 harness」縮影。用你自己的 Claude Code,親手感受**同一個 model,差別只在那層 harness**。

這是馬在飛科技「產品研發 AI 代理人」概念的最小可跑範本 —— 不碰你自己的 code、零額外 token(用你現有的 Claude Code 訂閱跑)。

## 親手試(5 分鐘)

```bash
git clone <this-repo> && cd dev-harness-starter
cd sample-app && npm install && cd ..
```

這個 repo 有三個工作項:`TASK-feature.md`(加折扣碼輸入 UI)、
`TASK-bug.md`(客戶回報購物車有時會壞掉)、`TASK-coupon.md`(加 SAVE200 折價券)。

**1. 先看「沒 harness」(`git checkout naive`):**

開 Claude Code,分別說「完成 TASK-feature.md」「完成 TASK-bug.md」。你會看到:
- feature → 它**不問 UI 規格**,介面自己亂定。
- bug → 它**沒有重現步驟就開始亂翻 code 亂猜**(其實是購物車被移到空才壞)。

**2. 再看「有 harness」(`git checkout main`):**

同樣兩句話。這次因為一個 `UserPromptSubmit` hook 每次都注入 DoR:
- feature → 它**先問介面規格 / 要 PLAN**,才動工。
- bug → 它**先問怎麼複現**,定位到「空車」才修(順手補測試)。

**3. 看 harness 加了什麼:**

```bash
git diff naive..main --stat
```

差異就是 `CLAUDE.md` + `.claude/settings.json`(DoR hook + Stop gate)+
`.claude/commands/independent-review.md` + `gate/dor-reminder.sh` + invariant 測試 —— 幾個純文字檔。

**4. 還有一種:harness 抓出你沒注意的 bug(`TASK-coupon.md`):**

說「完成 TASK-coupon.md」(加 SAVE200 折價券,折 200 元)。直覺寫法 `price - 200`,大額購物車沒事、happy-path 測試也過 —— 但小額購物車(如 150 元)總額會變成 **−50**。
- `naive`:沒有人攔,帶著負總額直接出貨。
- `main`:gate 的 invariant 測試(折後不可為負)擋下,`/independent-review` 也會抓出來判「需修改」。

## 想換 model?

在你的 Claude Code 裡 `/model` 切換就好,這層 harness 一行都不用動 —— 這就是「手腦分離」:腦(model)可換,手(harness)是你長期累積、屬於你的資產。

## 三層結構

| 層 | 在這 repo 裡 | 角色 |
|---|---|---|
| Context | `CLAUDE.md` | 讓模型知道規則 / DoR / 你的領域知識(fat skills) |
| Tool use | gate 腳本能跑什麼 | 限制即設計 |
| Hooks | `.claude/settings.json` Stop hook | 出口把關,gate 沒過不准收工 |

完整的概念說明:[什麼是 Agent Harness](https://www.ariontechs.com/zh/notes/2026-05-20-what-is-agent-harness) · [我們的 RD Agent Harness 怎麼設計](https://www.ariontechs.com/zh/notes/2026-05-21-rd-agent-harness)

## 這只是縮影

這個 repo 展示**機制**。真正的難處在「你公司的 DoR 判斷規則怎麼設計、reviewer 看什麼維度、fat skills 怎麼長」—— 那是領域知識,要在你自己的 codebase 上才談得清楚。

想把這套套到你公司的 codebase?我們提供一次 **30 分鐘免費 Harness 診斷**:[在 LINE 上跟 Mia 預約](https://www.ariontechs.com/zh/products?ref=harness-starter)。

## 維護

這是範本 repo,對應某個 Claude Code 版本;隨工具演進可能需更新,best-effort 維護。外部 PR best-effort,不保證收。

## License

MIT — 隨意拿去用、改、商用。fat skills 是你的,這層薄 harness 大方公開。
