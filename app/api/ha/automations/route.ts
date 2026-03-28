import { NextRequest, NextResponse } from 'next/server';
import { createHAClient } from '@/lib/ha-client';
import type { HAStateRaw } from '@/types/ha';

export const dynamic = 'force-dynamic';

function getConfig() {
  const url = process.env.HA_URL?.trim();
  const token = process.env.HA_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

export async function GET() {
  const cfg = getConfig();
  if (!cfg) {
    return NextResponse.json({ configured: false, automations: [] });
  }
  try {
    const client = createHAClient(cfg.url, cfg.token);
    const states = await client.getStates();
    const automations = (states as HAStateRaw[])
      .filter((s) => s.entity_id.startsWith('automation.'))
      .map((s) => ({
        entity_id: s.entity_id,
        alias: (s.attributes?.friendly_name as string) || s.entity_id,
        state: s.state === 'on' ? 'on' : 'off',
        last_triggered: (s.attributes?.last_triggered as string) || null,
      }));
    return NextResponse.json({ configured: automations.length > 0, automations });
  } catch (e) {
    return NextResponse.json(
      {
        configured: false,
        automations: [],
        error: e instanceof Error ? e.message : 'failed',
      },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const cfg = getConfig();
  if (!cfg) {
    return NextResponse.json({ ok: true, mock: true });
  }

  if (body.action === 'toggle' && typeof body.entity_id === 'string') {
    try {
      const client = createHAClient(cfg.url, cfg.token);
      await client.callService('automation', 'toggle', { entity_id: body.entity_id });
      return NextResponse.json({ ok: true, mock: false });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'toggle failed' },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
