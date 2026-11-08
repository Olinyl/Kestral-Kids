#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
if [ -x /usr/bin/chromium ]; then
  export KESTREL_BROWSER=/usr/bin/chromium
else
  npx playwright install --with-deps chromium
fi
npm run build
npx piezas doctor
npm run check
