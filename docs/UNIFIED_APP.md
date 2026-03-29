# Unified Nexus app — handoff for Cursor / Mac mini

This document explains how the TV experience was unified so assistants and humans have the same mental model on any machine.

## Problem we solved

Nexus had **two different “TV” experiences**:

1. **NexusTV** (`src/components/NexusTV.tsx`) — ambient Pulse (clock, weather, signals, goals), mode engine, phone control via WebSocket.
2. **NexusOS** (`src/components/NexusOS.tsx`) — Home Assistant shell (Home, Energy, Cameras, Automations, System), SSE/polling to `/api/ha/*`.

The phone controller talked to the **WebSocket server** expecting the old TV shell. The **Home Assistant UI** lived at `/os` while the **main route** was still NexusTV, so people saw “only the clock” on `/` and had to discover `/os` separately.

## What “unified” means now

**`NexusOS` is the single TV shell.** It includes:

- **Pulse module** — the ambient layer (large clock, weather, signal ticker, next goal, stocks/content footnotes). Data comes from **`useNexusData()`** (weather, signals, goals, content, stocks via `/api/*`).
- **HA modules** — Home, Energy, Cameras, Automations, System — unchanged in spirit; real HA when `HA_URL` + `HA_TOKEN` are set in `.env.local`, mocks otherwise.
- **WebSocket** — **`useNexusSocket()`** so the **phone controller** can switch **modes**, send **refresh**, and switch **modules** on the TV.

Default sidebar tab is **Pulse** so the TV still feels like the original ambient “screensaver,” but **Home Assistant is one sidebar click away** (no separate product to explain).

## Routes (important)

| Route | Component | Notes |
|-------|-----------|--------|
| **`/`** | `NexusOS` | Primary TV URL — fullscreen Chrome on the Mac mini |
| **`/os`** | `NexusOS` | Same app as `/` (alias for bookmarks and old links) |
| **`/tv`** | `NexusTV` | **Legacy** — old Pulse/Dashboard-only UI kept for comparison or rollback |
| **`/controller`** | Phone UI | Must reach **WebSocket port 8080** on the same host IP the phone uses |

## WebSocket protocol additions

Types live in **`src/types/nexus.ts`**.

- **`module_switch`** — `{ type: "module_switch", module: string }`  
  Valid `module` values match the NexusOS sidebar: `pulse`, `home`, `energy`, `cameras`, `automations`, `system`.

Existing messages still apply: **`mode_switch`**, **`mode_auto`**, **`refresh`**, **`view_toggle`** (`pulse` / `dashboard` maps to Pulse vs Home module), **`content_drop`**, goals, signals, etc.

The standalone WS process is **`src/lib/ws-server.mjs`** (default port **8080**). It **broadcasts** messages between clients; it does not need special handling for `module_switch` beyond relaying.

## How to run (Mac mini or dev laptop)

**Always run Next.js and the WebSocket server together** for phone control:

```bash
npm run dev:all
```

Or production:

```bash
npm run build && npm run start:all
```

If only `npm run dev` runs, **`/controller` shows Disconnected`** — that is expected.

## Environment

- **Home Assistant (live devices):** `HA_URL`, `HA_TOKEN` in **`.env.local`** (server-side only).  
- **Optional:** `FRIGATE_URL`, `ANTHROPIC_API_KEY`, weather/stocks keys — see **`.env.example`** and **`npm run check:env`**.

## Verification on a new machine

```bash
npm ci
npm run verify
```

`verify` runs production build, TypeScript check, env report, and **`scripts/security-check.sh`**.

## Files to read first

- **`src/components/NexusOS.tsx`** — shell, `MODULES`, `PulseModule`, HA hooks, keyboard shortcuts (`P`/`H`/`E`/`C`/`A`/`S`, `0`–`6` modes).
- **`app/page.tsx`** — root imports `NexusOS`.
- **`app/os/page.tsx`** — same `NexusOS` import.
- **`app/controller/page.tsx`** — module grid sends **`module_switch`** over WS.
- **`src/hooks/useNexusData.ts`**, **`src/hooks/useNexusSocket.ts`**.

## Summary sentence

**One Next.js app (`NexusOS`) is the TV: Pulse + Home Assistant modules + phone control over WebSocket; `/` and `/os` are the same; `/tv` is legacy NexusTV only.**
