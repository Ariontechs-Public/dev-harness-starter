#!/usr/bin/env bash
# UserPromptSubmit hook: print DoR reminder; Claude Code injects stdout into
# context when the hook exits 0. Must NOT exit nonzero (exit 2 would BLOCK the
# prompt). The final `exit 0` guarantees a clean exit code.
cat <<'TXT'
[DoR 提醒] 動工前先檢查 Definition of Ready:
- Feature 類:需要 UI 規格 / PLAN.md。沒有就先問,不要自己腦補介面。
- Bug 類:需要可複現。沒有重現步驟就先請回報者補,不要亂查亂猜。
- 邊界未定義(疊加?價格可負?四捨五入到幾位?)一律先問,別猜。
TXT
exit 0
