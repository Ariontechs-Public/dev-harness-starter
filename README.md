# dev-harness-starter

一個可跑的「薄 harness」縮影。用你自己的 Claude Code,親手感受**同一個 model,差別只在那層 harness**。

這是馬在飛科技「產品研發 AI 代理人」概念的最小可跑範本 —— 不碰你自己的 code、零額外 token(用你現有的 Claude Code 訂閱跑)。

## 親手試(5 分鐘)

```bash
git clone <this-repo> && cd dev-harness-starter
cd sample-app && npm install && cd ..
```

**1. 先看「沒 harness」會怎樣:**

```bash
git checkout naive
```

在 repo 根開 Claude Code,跟它說「完成 TASK.md」。它會把 VIP 折扣的 happy path 補上、測試全綠、回報 done —— 但它沒處理負價、沒做金額 rounding(沒人要求、沒測試擋、沒 DoR 提醒)。**看起來完成,其實有 latent bug。**

**2. 再看「有 harness」:**

```bash
git checkout main
```

同一個任務、同一個 Claude Code。這次:

- **DoR**(`CLAUDE.md`)→ 它動工前先問你邊界(疊加?負價?rounding?)
- **三層 gate**(`gate/gate.sh`,接在 Stop hook)→ lint / type / test 沒全綠,它不准收工
- **獨立審查**(`/independent-review`)→ fork 一個沒參與實作的 context,自己跑 gate 確認,不信實作者的自我報告

同一個腦,被這層薄 harness 逼著真的做對。

**3. 看那層 harness 到底加了什麼:**

```bash
git diff naive..main --stat
```

差異就是 `CLAUDE.md` + `.claude/settings.json` + `.claude/commands/independent-review.md` + invariant 測試 —— 幾個純文字檔。**這就是「薄 harness」:可以照著搬去你自己的 repo。**

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
