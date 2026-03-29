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

## One unified TV app

**`/`** and **`/os`** both load the same **NexusOS** shell: **Pulse** (ambient clock + signals) plus **Home / Energy / Cameras / Automations / System**. Home Assistant is reached via the sidebar modules and `/api/ha/*` (HTTP + SSE), not a separate app.

| URL | Role |
|-----|------|
| **`/`** | Main TV — fullscreen Chrome on the Mac mini |
| **`/controller`** | Phone — WebSocket **port 8080** switches modules, modes, content, goals |
| **`/tv`** | Legacy **NexusTV** only (optional) |

**`/controller`** must reach **`ws://<same-host>:8080`** (the standalone WS process). If you only run `next dev`, the controller stays **Disconnected**.

## Before the Mac mini (do this on your dev machine)

1. **`git pull`** so the mini clones the same `main` you verified.
2. **`npm ci`** (or `npm install`) then **`npm run verify`** — runs `build` → `tsc` → **`check:env`** → **`security-check`**. Fix anything that fails before you rely on the TV.
3. Copy **`.env.example` → `.env.local`** and fill what you can; keep secrets out of git. Use a password manager for **HA long-lived token** so you can paste it on the mini in seconds.
4. Rehearse **`npm run dev:all`** once: open **`/`** (Pulse + sidebar) and **`/controller`** on your phone on the same Wi‑Fi — **Connected** and module buttons should change the TV.
5. Note the **LAN IP** you will use on the mini (`http://<ip>:3000`, `http://<ip>:3000/controller`). Plan **DHCP reservation** or static IP.
6. Optional: add **`/controller`** to the iPhone home screen (PWA) after the mini is up — **Share → Add to Home Screen**.

On the mini you will: clone/pull, `.env.local`, **`npm ci && npm run build && npm run start:all`** (or `launchd` with `start:all`), allow **3000** + **8080** through the firewall for LAN access. See **`MAC_MINI_SETUP.md`**.

## Quick Start

```bash
npm install
npm run verify    # build + typecheck + env report + security script (see Before the Mac mini)
cp .env.example .env.local
# Add API keys on the machine that runs Next (or skip for mock data)
```

**Phone + TV:** run Next and the WebSocket together:

```bash
npm run dev:all
```

Or two terminals: `npm run dev` and `npm run ws`.

**Production on the Mac mini:** `npm run build && npm run start:all` (or `start:all` in LaunchAgent — see `scripts/com.nexus.next.plist.example`).

**TV:** `http://localhost:3000` in fullscreen Chrome on the Mac mini.  
**Phone:** `http://<mac-mini-ip>:3000/controller` on the same network.

## Keyboard (TV, NexusOS)

- **`P` `H` `E` `C` `A` `S`** — switch module (Pulse, Home, Energy, Cameras, Automations, System)
- **`1`–`6`** — mode override (Morning … Night); **`0`** — auto mode
- **`⌘K`** — command palette · **`⌘J`** — Agent Bay · **`Esc`** — close overlays

## Architecture

Mac mini runs everything. TV displays. Phone controls via WebSocket. SQLite persists. HA is server-side only (`HA_URL` + `HA_TOKEN` in `.env.local`).

Built by Ralli AI.
