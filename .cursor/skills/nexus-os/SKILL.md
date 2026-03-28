---
name: nexus-os
description: >
  Master context for the Nexus OS project and Ralli AI business.
  Use this skill whenever the user mentions Nexus, Launch Pad, Ralli AI,
  Ralli Ads, ScopeForm, client builds, Mac Mini setup, agent tools,
  the unified shell, or any conversation about Rick's projects and business.
  Also trigger when discussing the tech stack (Next.js, Tailwind, Clerk,
  Supabase, Vercel, Claude API, Home Assistant), deployment workflows,
  or referencing past builds. This skill contains the complete project
  map, architecture decisions, and business context so assistants never
  need to ask "what's the project?" again.
---

# Nexus OS — Master Project Context

> **Owner**: Rick Griffith  
> **Business**: Ralli AI (DBA under Ralli Pickleball LLC)  
> **Location**: Phoenix, AZ  
> **Domain**: ralliai.com | uselaunchpad.dev  
> **Role**: Ops guy turned builder. Not a developer by trade. Uses AI (primarily Claude) to build everything.

---

## What Is Nexus OS?

Nexus is a unified command center that ties together digital build tools, smart home, ad management, and AI agents into one cockpit. It is a single Next.js 14 app in this repo (`/Users/rickgriffith/Desktop/nexus`).

### Modules (all in one app)

| Module | What It Does | Status |
|--------|-------------|--------|
| **Home** | Entity grid, area filtering, live scenes, real temp stats, device toggle | Wired to HA APIs with mock fallback |
| **Energy** | Consumption vs solar chart, per-device breakdown, cost tracking | Wired to `/api/ha/energy` |
| **Cameras** | Frigate camera grid, AI detection events, snapshot proxy | Wired to `/api/ha/cameras` |
| **Automations** | Toggle list, HA automations | Wired to `/api/ha/automations` |
| **System** | HA connection test, service health with latency, Mac Mini info | Wired to `/api/ha/health` |
| **Agent Bay** | ⌘J slide-over — Claude chat | Wired to `/api/agent/chat` |
| **Command Palette** | ⌘K — search, navigate, or send to Agent Bay | Built |
| **Notifications** | Toast alerts for security events | Built with auto-dismiss |
| **Launch Pad** | GitHub, Vercel, Supabase panels | Deployed separately at uselaunchpad.dev (not yet merged) |
| **Ralli Ads** | Multi-client ad campaign manager | Standalone artifact (not yet merged) |

### API routes — Home Assistant “stack” (10)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ha` | GET/POST | HA REST proxy — states, config, ping, history, toggle, `call_service` |
| `/api/ha/stream` | GET (SSE) | Real-time state streaming (`full` payloads; polling-based bridge) |
| `/api/ha/health` | GET | Parallel health checks (HA, Frigate, MQTT hints, Claude key) |
| `/api/ha/energy` | GET | Energy sensors — consumption, solar, battery, power, history |
| `/api/ha/cameras` | GET | Frigate proxy — stats, events, snapshot images |
| `/api/ha/automations` | GET/POST | List automations; POST toggle |
| `/api/ha/scenes` | GET | List HA scenes for Quick Actions |
| `/api/agent/chat` | POST | Claude agentic loop + tools |
| `/api/mcp` | GET/POST | MCP bridge for Assist / voice workflows |

### Other API routes in this repo

`/api/weather`, `/api/stocks`, `/api/calendar`, `/api/content`, `/api/signals`, `/api/deploy`, `/api/dev/git` — shared with the original Nexus TV/controller features.

### Repository layout (this monorepo)

```
nexus/
├── setup.sh                          — First-run: env copy, npm install, dirs
├── docker-compose.yml                — HA + Mosquitto (port mapping; Frigate commented)
├── MAC_MINI_SETUP.md                 — Mac Mini steps
├── mosquitto/config/mosquitto.conf
├── .env.example / .cursorrules / .gitignore
├── package.json / tsconfig.json / tailwind.config.js / postcss.config.js / next.config.js
├── app/
│   ├── layout.tsx / page.tsx / globals.css
│   ├── os/page.tsx                   — Nexus OS (imports NexusOS)
│   ├── tv/ / controller/             — Original Nexus surfaces
│   └── api/                          — All route handlers (see above)
├── src/
│   ├── components/NexusOS.tsx        — Unified shell (integrated; use this in production)
│   ├── lib/                          — ha-client, ha-energy, frigate-client, db, etc.
│   └── hooks/                        — Legacy Nexus hooks if present
└── artifacts/nexus-os/
    └── NexusOS.standalone.jsx        — Standalone preview artifact (no `/api/ha` wiring)
```

**Important**: Production UI is `src/components/NexusOS.tsx`. The standalone `artifacts/nexus-os/NexusOS.standalone.jsx` is for quick previews only; it does not call the HA APIs.

### Key architecture decisions

- **HA token never leaves the server** — browser calls `/api/*`, server proxies to HA with `HA_TOKEN`.
- **SSE streaming first, polling fallback** — `EventSource` to `/api/ha/stream`, retries, then 5s poll of `/api/ha?action=states`. Response `mock: true` does **not** count as “connected”.
- **Auto-detect HA** — modules try real APIs; empty or missing env → mock data.
- **Agent Bay** — `/api/agent/chat` uses Anthropic SDK; tools can call HA via server routes.
- **Docker on macOS** — `network_mode: host` is avoided; **port mapping** in `docker-compose.yml`.
- **Matter** — HA Matter integration; entities show up like any other domain.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth | Clerk / Supabase (roadmap; not required for local HA) |
| AI | Claude API (Anthropic SDK) |
| Deployment | Vercel (optional) + Mac Mini for HA |
| Smart Home | Home Assistant (Docker on Mac Mini M4) |
| Local AI | Ollama (optional) |
| Camera NVR | Frigate (`FRIGATE_URL`) |
| MQTT | Mosquitto (compose file) |
| Icons | Lucide React (no emoji in UI) |
| Fonts | DM Sans, Outfit, JetBrains Mono (see `globals.css`) |
| Charts | Recharts |

---

## Design system

- **Theme**: Dark only. Backgrounds `#08080b` → `#0c0c10`.
- **Aesthetic**: Robinhood-style fintech — clean, data-dense.
- **Accents**: Blue `#60A5FA`, green `#6EE7B7`, red `#F87171`, yellow `#FBBF24`, purple `#A78BFA`.
- **Logo**: “NEXUS” — Outfit extra-light, `letter-spacing: 0.25em`.

---

## Ralli AI — business (summary)

Agency/product work: client sites, ad campaigns, ScopeForm, Launch Pad SaaS.

---

## Hardware

- **Mac Mini M4** — HA (Docker), Frigate (optional), MQTT, Nexus (Next.js).
- **Planned**: Zigbee (e.g. ZBT-2), cameras for Frigate, Matter/Thread devices.
- **Thread border router**: Apple TV 4K or HomePod Mini (or standalone).

---

## What’s next (priority)

1. Stand up HA on the Mac Mini — `docker compose up`, token in `.env.local`.
2. Split `NexusOS.tsx` into smaller modules when it hurts maintenance.
3. First Matter/Thread device for live entities.
4. Mobile layout (hamburger / bottom tabs).
5. Merge Launch Pad panels into the shell (optional).
6. Remote access — Tailscale or Cloudflare Tunnel.
7. Frigate — uncomment service, add `frigate-config`.
8. Ralli AI marketing site — separate project.

---

## Communication style

Rick prefers working code, shipping fast, dark mode, plain English, no jargon walls, Cursor-first workflows.
