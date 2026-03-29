# NEXUS

> Your home operating system.

A living ambient display that runs on a Mac mini connected to a 65-inch TV. Controlled by your phone. Powered by AI.

## GitHub

Repo is initialized on `main`. To push (after [GitHub CLI](https://cli.github.com) login or a new empty repo):

```bash
gh auth login
gh repo create nexus --private --source=. --remote=origin --push
```

Remote (this project): [github.com/Rickchise23/Nexus](https://github.com/Rickchise23/Nexus)

```bash
git remote add origin https://github.com/Rickchise23/Nexus.git
git push -u origin main
```

## Two UIs (don’t mix them up)

| URL | What it is |
|-----|------------|
| **`/`** (TV) | Pulse / Dashboard — **phone controller** at `/controller` talks to this via **WebSocket port 8080**. |
| **`/os`** | Nexus OS (Home Assistant shell) — uses **HTTP + SSE** to `/api/ha/*`. The **phone controller does not drive `/os`** yet. |

## Quick Start

```bash
npm install
npm run build          # verify production build
cp .env.example .env.local
# Add your API keys (or skip for mock data)
```

**Phone + TV control (Pulse/Dashboard):** run **both** Next.js and the WebSocket server — one command:

```bash
npm run dev:all
```

Or two terminals: `npm run dev` and `npm run ws`. If you only start Next, **`/controller` shows Disconnected** and TV buttons from the phone won’t work.

**Production on the Mac mini:** `npm run build && npm run start:all` (or `start:all` in LaunchAgent).

**Nexus OS (HA):** `http://localhost:3000/os` — needs `HA_URL` + `HA_TOKEN` in `.env.local` for real devices.

**TV:** Open `localhost:3000` in fullscreen Chrome on the Mac mini.
**Phone:** Open `[mac-mini-ip]:3000/controller` on your phone's browser.

## Keyboard Controls (TV)

- `P` - Toggle Pulse / Dashboard view
- `C` - Open content overlay
- `1-6` - Switch modes (Morning, Focus, Home, Evening, Weekend, Night)
- `0` - Return to auto mode

## Architecture

Mac mini runs everything. TV displays. Phone controls. SQLite persists. WebSocket connects.

Built by Ralli AI.
