import { NextResponse } from 'next/server';
import { createHAClient } from '@/lib/ha-client';
import { frigateFetch, getFrigateBase } from '@/lib/frigate-client';

export const dynamic = 'force-dynamic';

function getHAConfig() {
  const url = process.env.HA_URL?.trim();
  const token = process.env.HA_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

export async function GET() {
  const services: Array<{
    name: string;
    status: 'online' | 'offline';
    detail: string;
    latency?: number;
  }> = [];

  const t0 = Date.now();

  const haCfg = getHAConfig();
  if (haCfg) {
    const t1 = Date.now();
    try {
      const client = createHAClient(haCfg.url, haCfg.token);
      const ok = await client.ping();
      const lat = Date.now() - t1;
      let detail = 'Connected';
      try {
        const c = await client.getConfig();
        const ver = c.version != null ? String(c.version) : 'HA';
        const loc = c.location_name != null ? String(c.location_name) : 'Home';
        detail = `${ver} — ${loc}`;
      } catch {
        // ignore
      }
      services.push({
        name: 'Home Assistant',
        status: ok ? 'online' : 'offline',
        detail,
        latency: lat,
      });
    } catch (e) {
      services.push({
        name: 'Home Assistant',
        status: 'offline',
        detail: e instanceof Error ? e.message : 'Unreachable',
      });
    }
  } else {
    services.push({
      name: 'Home Assistant',
      status: 'offline',
      detail: 'Set HA_URL and HA_TOKEN in .env.local',
    });
  }

  const frigate = getFrigateBase();
  if (frigate) {
    const t1 = Date.now();
    try {
      const res = await frigateFetch('/api/version');
      const lat = Date.now() - t1;
      const ok = res.ok;
      const j = ok ? ((await res.json()) as { version?: string }) : {};
      services.push({
        name: 'Frigate NVR',
        status: ok ? 'online' : 'offline',
        detail: ok ? `Frigate ${j.version ?? 'ok'}` : 'Error',
        latency: lat,
      });
    } catch (e) {
      services.push({
        name: 'Frigate NVR',
        status: 'offline',
        detail: e instanceof Error ? e.message : 'Unreachable',
      });
    }
  } else {
    services.push({
      name: 'Frigate NVR',
      status: 'offline',
      detail: 'Set FRIGATE_URL in .env.local',
    });
  }

  const mqtt = process.env.MQTT_URL?.trim();
  const mqttHost = process.env.MQTT_HOST?.trim();
  if (mqtt || mqttHost) {
    services.push({
      name: 'MQTT Broker',
      status: 'online',
      detail: mqtt || mqttHost || 'Configured',
    });
  } else {
    services.push({
      name: 'MQTT Broker',
      status: 'offline',
      detail: 'Set MQTT_URL or MQTT_HOST in .env.local',
    });
  }

  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  services.push({
    name: 'Claude API',
    status: anthropic ? 'online' : 'offline',
    detail: anthropic ? 'Agent Bay ready' : 'Set ANTHROPIC_API_KEY',
  });

  const online = services.filter((s) => s.status === 'online').length;
  const total_latency_ms = Date.now() - t0;

  return NextResponse.json({
    status: online >= Math.floor(services.length * 0.6) ? 'healthy' : 'degraded',
    total_latency_ms,
    services,
  });
}
