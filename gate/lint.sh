#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../sample-app" && npm run lint
