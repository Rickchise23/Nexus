import { WebSocketServer } from 'ws';

const PORT = process.env.WS_PORT || 8080;
const NEXUS_INTERNAL_URL = process.env.NEXUS_INTERNAL_URL || 'http://127.0.0.1:3000';

const wss = new WebSocketServer({ port: Number(PORT) });

const clients = new Set();

async function persist(msg) {
  const base = NEXUS_INTERNAL_URL;

  if (msg.type === 'content_drop' && msg.url) {
    const res = await fetch(`${base}/api/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: msg.url, title: msg.title || msg.url }),
    });
    if (!res.ok) console.error('[Nexus WS] content_drop failed', res.status);
    return;
  }

  if (msg.type === 'goal_toggle' && msg.id) {
    const res = await fetch(`${base}/api/calendar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msg.id }),
    });
    if (!res.ok) console.error('[Nexus WS] goal_toggle failed', res.status);
    return;
  }

  if (msg.type === 'goal_add' && msg.label) {
    const res = await fetch(`${base}/api/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: msg.label }),
    });
    if (!res.ok) console.error('[Nexus WS] goal_add failed', res.status);
    return;
  }

  if (msg.type === 'signal_dismiss' && msg.id && msg.id !== 'current') {
    const res = await fetch(`${base}/api/signals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msg.id }),
    });
    if (!res.ok) console.error('[Nexus WS] signal_dismiss failed', res.status);
  }
}

console.log(`[Nexus WS] Server running on ws://localhost:${PORT} (API: ${NEXUS_INTERNAL_URL})`);

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Nexus WS] Client connected. Total: ${clients.size}`);

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      console.log(`[Nexus WS] Received:`, msg.type);

      if (['content_drop', 'goal_toggle', 'goal_add', 'signal_dismiss'].includes(msg.type)) {
        await persist(msg);
      }

      for (const client of clients) {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(msg));
        }
      }
    } catch (e) {
      console.error('[Nexus WS] Parse error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Nexus WS] Client disconnected. Total: ${clients.size}`);
  });

  ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
});
