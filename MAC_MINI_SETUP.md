# Mac Mini — Nexus + Home Assistant

Use this on the Mac Mini M4 that runs Docker, Frigate (optional), and the Next.js dev or production server.

## Before you sit at the mini (do this on any machine)

Doing this now saves time when you plug in the brain:

1. **Push this repo to GitHub (or zip it)** so the mini can `git clone` — fastest path on a fresh Mac.
2. **Install the Docker Desktop .dmg** ahead of time (you already have it in Downloads) so you are not waiting on a large download.
3. **Apple ID / App Store** signed in on the mini if you will install tools from the store.
4. **Homebrew** (optional but common): install Node LTS on the mini with `brew install node` so `npm` lives at `/opt/homebrew/bin/npm` (matches the LaunchAgent example).
5. On your **current** machine, run **`npm run verify`** (`build` + `tsc` + `check:env` + `scripts/security-check.sh`) — catches TypeScript and env issues before the mini. After `git clone` on the mini, run **`npm ci && npm run verify`** once dependencies are installed.

---

## 1. Install Docker Desktop for Mac

Enable file sharing for the project folder if you store the repo outside the default location.

## 2. Clone or copy the Nexus repo

Place it somewhere stable, e.g. `~/Projects/nexus`.

## 3. Run `./setup.sh`

Creates `.env.local` from `.env.example`, installs npm deps, ensures `ha-config` and Mosquitto dirs exist.

## 4. Start Home Assistant + Mosquitto

```bash
docker compose up -d
```

Open `http://localhost:8123`, complete onboarding, create a **long-lived access token** (Profile → Security).

## 5. Point Nexus at Home Assistant

In `.env.local` set:

- `HA_URL=http://127.0.0.1:8123` (or the LAN IP of this Mac from other devices)
- `HA_TOKEN=<your token>`

Restart `npm run dev:all` (or `npm run start:all`) after changing env.

## 6. Frigate (optional)

Uncomment the `frigate` service in `docker-compose.yml`, add `./frigate-config/config.yml`, then set `FRIGATE_URL=http://127.0.0.1:5000` in `.env.local`.

## 7. Run Next.js + WebSocket (phone controller)

The **controller** (`/controller`) requires the **WS server on port 8080**, not only Next on 3000:

```bash
npm run dev:all
# or production:
npm run build && npm run start:all
```

If the phone shows **Disconnected**, the WS process isn’t running or macOS Firewall is blocking **8080** (and **3000**) on the LAN.

## 8. Open Nexus OS UI

`http://localhost:3000/os` — Home Assistant shell (separate from the Pulse TV + phone controller). Modules auto-detect HA; without credentials they use mock data.

## 9. Production Next.js on the Mac

```bash
npm run build && npm run start:all
```

(`start:all` runs **Next + WebSocket** so the phone controller keeps working.)

- **`npm run check:env`** — prints which `.env.local` keys are set (never shows secrets). Run anytime after editing env.
- **Auto-start on login:** copy `scripts/com.nexus.next.plist.example` to `~/Library/LaunchAgents/com.nexus.next.plist`, set **ProgramArguments** to `run`, `start:all` (see plist comments), replace `YOUR_USER` and the repo path, fix the `npm` path with `which npm`, run `launchctl load ~/Library/LaunchAgents/com.nexus.next.plist`. Requires a successful **`npm run build`** first.

For TV fullscreen: **Pulse + phone** → open `/` ; **Nexus OS (HA)** → open `/os` in Chrome kiosk mode.

## 10. Remote access (later)

Use Cloudflare Tunnel or Tailscale so Vercel or your phone can reach `HA_URL` securely — do not expose HA raw to the public internet without TLS and auth.

## 11. Matter / Thread

Home Assistant integrates Matter; entities appear like any other. Thread border routing often uses Apple TV or HomePod Mini on the same Apple Home.

## 12. Zigbee / USB (optional)

If you use a USB coordinator (e.g. ZBT-2), pass it through to the Home Assistant container with Docker Desktop device mapping, or run ZHA on a separate host and point HA at it over the network.
