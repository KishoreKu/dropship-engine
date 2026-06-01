#!/usr/bin/env bash
set -euo pipefail

echo "==> Dropship Engine — Setup"
echo ""

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[+] .env created from .env.example — edit it with your API keys"
else
  echo "[.] .env already exists"
fi

echo "[+] Installing dependencies…"
npm install

echo "[+] Checking TypeScript…"
npx tsc --noEmit

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Setup complete                                        ║"
echo "║                                                        ║"
echo "║  Next steps:                                           ║"
echo "║  1. Edit .env with your API keys                       ║"
echo "║  2. npm run dev                                        ║"
echo "║  3. Open http://localhost:3000/health                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
