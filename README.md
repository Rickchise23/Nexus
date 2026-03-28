# NEXUS

> Your home operating system.

A living ambient display that runs on a Mac mini connected to a 65-inch TV. Controlled by your phone. Powered by AI.

## GitHub

Repo is initialized on `main`. To push (after [GitHub CLI](https://cli.github.com) login or a new empty repo):

```bash
gh auth login
gh repo create nexus --private --source=. --remote=origin --push
```

Or create an empty repo on github.com, then:

```bash
git remote add origin https://github.com/YOUR_USER/nexus.git
git push -u origin main
```

## Quick Start

```bash
npm install
npm run build          # verify production build
cp .env.example .env.local
# Add your API keys (or skip for mock data)
npm run dev    # Terminal 1: Next.js app
npm run ws     # Terminal 2: WebSocket server
```

**Nexus OS UI:** `http://localhost:3000/os`

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
