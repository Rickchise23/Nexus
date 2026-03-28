import { NextResponse } from 'next/server';
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
    return NextResponse.json({ configured: false, scenes: [] });
  }
  try {
    const client = createHAClient(cfg.url, cfg.token);
    const states = await client.getStates();
    const scenes = (states as HAStateRaw[])
      .filter((s) => s.entity_id.startsWith('scene.'))
      .map((s) => ({
        id: s.entity_id.replace(/^scene\./, ''),
        name: (s.attributes?.friendly_name as string) || s.entity_id,
        entity_id: s.entity_id,
      }));
    return NextResponse.json({ configured: scenes.length > 0, scenes });
  } catch (e) {
    return NextResponse.json(
      {
        configured: false,
        scenes: [],
        error: e instanceof Error ? e.message : 'failed',
      },
      { status: 502 }
    );
  }
}
