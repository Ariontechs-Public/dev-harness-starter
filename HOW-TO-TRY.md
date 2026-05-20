# 親手試:naive(無 harness)

1. `cd sample-app && npm install`
2. 開你的 Claude Code,在 repo 根目錄。
3. 跟它說:「完成 TASK.md。」
4. 觀察:它通常直接把 VIP 的 happy path 補上、3 個測試全綠、回報「done」——
   但它**不知道也沒被要求**處理負價 / rounding(那些 invariant 不在 naive
   的測試裡、也沒有 DoR 提醒)。沒有任何東西自動擋它。這就是 latent bug。

接著:`git checkout main`(完整 harness 版),同樣的任務再試一次,看差別。
