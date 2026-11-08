#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
npx playwright install --with-deps chromium
npm run build
npx piezas doctor
npm run check
