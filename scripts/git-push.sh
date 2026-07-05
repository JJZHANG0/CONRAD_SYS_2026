#!/usr/bin/env bash
# Push via local proxy when GitHub direct access times out (common in CN networks).
# Requires Clash/V2Ray etc. listening on 127.0.0.1:7890
set -euo pipefail
cd "$(dirname "$0")/.."
export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:7890}"
export HTTP_PROXY="${HTTP_PROXY:-http://127.0.0.1:7890}"
git push "$@"
