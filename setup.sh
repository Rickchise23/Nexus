#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Nexus — local setup"
if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example (edit HA_URL, HA_TOKEN, FRIGATE_URL, ANTHROPIC_API_KEY)."
fi

mkdir -p mosquitto/config mosquitto/data mosquitto/log ha-config

npm install

echo ""
node scripts/check-env.cjs || true
echo "Next:"
echo "  1. Edit .env.local — on the Mac mini brain use HA_URL=http://127.0.0.1:8123"
echo "  2. docker compose up -d   # HA + Mosquitto"
echo "  3. npm run dev  → http://localhost:3000/os   (or npm run build && npm run start)"
echo ""
