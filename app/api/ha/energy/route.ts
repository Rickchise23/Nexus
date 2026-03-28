import { NextResponse } from 'next/server';
import { createHAClient } from '@/lib/ha-client';
import { classifyEnergyEntities, hasAnyEnergyData } from '@/lib/ha-energy';
import type { HAStateRaw } from '@/types/ha';

export const dynamic = 'force-dynamic';

function getConfig() {
  const url = process.env.HA_URL?.trim();
  const token = process.env.HA_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

function parseHistory(hist: unknown): { time: string; value: number }[] {
  if (!Array.isArray(hist) || hist.length === 0) return [];
  const inner = hist[0];
  if (!Array.isArray(inner)) return [];
  return inner.map((p: { last_changed?: string; state?: string }) => ({
    time: p.last_changed || new Date().toISOString(),
    value: parseFloat(String(p.state ?? '0')) || 0,
  }));
}

export async function GET() {
  const cfg = getConfig();
  if (!cfg) {
    return NextResponse.json({ source: 'mock', entities: null });
  }
  try {
    const client = createHAClient(cfg.url, cfg.token);
    const states = await client.getStates();
    const classified = classifyEnergyEntities(states as HAStateRaw[]);
    if (!hasAnyEnergyData(classified)) {
      return NextResponse.json({ source: 'mock', entities: null });
    }
    let history: { time: string; value: number }[] = [];
    if (classified.primaryHistoryEntityId) {
      const hist = await client.getHistory(classified.primaryHistoryEntityId);
      history = parseHistory(hist);
    }
    return NextResponse.json({
      source: 'live',
      entities: {
        consumption: classified.consumption,
        solar: classified.solar,
        battery: classified.battery,
        power: classified.power,
      },
      history,
    });
  } catch (e) {
    return NextResponse.json(
      {
        source: 'mock',
        entities: null,
        error: e instanceof Error ? e.message : 'failed',
      },
      { status: 502 }
    );
  }
}
