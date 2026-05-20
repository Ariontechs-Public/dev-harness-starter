#!/usr/bin/env bash
# 任一層失敗就 exit 2。
# Claude Code 的 Stop hook 只有 exit code 2 才是 blocking(把 stderr 餵回、
# 阻止收工);其他非零碼是 non-blocking,Claude 只印警告就照樣收工 ──
# 那樣整個 demo 的對照會失效。所以這裡顯式把失敗轉成 exit 2。
set -uo pipefail
DIR="$(dirname "$0")"
echo "── gate: lint ──"      >&2; bash "$DIR/lint.sh"      || { echo "✗ lint gate failed" >&2; exit 2; }
echo "── gate: typecheck ──" >&2; bash "$DIR/typecheck.sh" || { echo "✗ type gate failed" >&2; exit 2; }
echo "── gate: test ──"      >&2; bash "$DIR/test.sh"      || { echo "✗ test gate failed (回去把它修對,別回報 done)" >&2; exit 2; }
echo "✓ all gates passed" >&2
