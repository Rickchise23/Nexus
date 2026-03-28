import { NextRequest, NextResponse } from 'next/server';
import { createHAClient } from '@/lib/ha-client';
import { cloneMockEntities } from '@/lib/ha-mock';
import { normalizeState } from '@/lib/ha-normalize';
import type { HAStateRaw, UiEntity } from '@/types/ha';

let mockEntities: UiEntity[] = cloneMockEntities();

function getConfig() {
  const url = process.env.HA_URL?.trim();
  const token = process.env.HA_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

function flipMockState(e: UiEntity): UiEntity {
  const domain = e.domain;
  let state = e.state;
  switch (domain) {
    case 'light':
    case 'switch':
    case 'fan':
      state = e.state === 'on' ? 'off' : 'on';
      break;
    case 'lock':
      state = e.state === 'locked' ? 'unlocked' : 'locked';
      break;
    case 'cover':
      state = e.state === 'closed' ? 'open' : 'closed';
      break;
    case 'media_player':
      state = e.state === 'on' || e.state === 'playing' ? 'off' : 'on';
      break;
    default:
      state = e.state === 'on' ? 'off' : 'on';
  }
  return { ...e, state };
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'states';
  const cfg = getConfig();

  if (action === 'ping') {
    if (!cfg) {
      return NextResponse.json({
        ok: true,
        connected: false,
        mock: true,
        message: 'HA_URL/HA_TOKEN not set — using mock',
      });
    }
    try {
      const client = createHAClient(cfg.url, cfg.token);
      const ok = await client.ping();
      return NextResponse.json({ ok, connected: ok, mock: false });
    } catch (e) {
      return NextResponse.json(
        { ok: false, connected: false, error: e instanceof Error ? e.message : 'ping failed' },
        { status: 502 }
      );
    }
  }

  if (action === 'config') {
    if (!cfg) {
      return NextResponse.json({ mock: true, version: 'mock', location_name: 'Home' });
    }
    try {
      const client = createHAClient(cfg.url, cfg.token);
      const c = await client.getConfig();
      return NextResponse.json({
        mock: false,
        version: c.version,
        location_name: c.location_name,
        ...c,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'config failed' },
        { status: 502 }
      );
    }
  }

  if (action === 'states') {
    if (!cfg) {
      return NextResponse.json({ mock: true, entities: mockEntities });
    }
    try {
      const client = createHAClient(cfg.url, cfg.token);
      const states = await client.getStates();
      return NextResponse.json({ mock: false, states });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'HA request failed' },
        { status: 502 }
      );
    }
  }

  const entityId = req.nextUrl.searchParams.get('entity_id');
  if (action === 'entity' && entityId) {
    if (!cfg) {
      const e = mockEntities.find((x) => x.entity_id === entityId);
      return e ? NextResponse.json({ mock: true, entity: e }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    try {
      const client = createHAClient(cfg.url, cfg.token);
      const s = await client.getState(entityId);
      return NextResponse.json({ mock: false, entity: normalizeState(s as HAStateRaw) });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'HA request failed' },
        { status: 502 }
      );
    }
  }

  if (action === 'history' && entityId && cfg) {
    try {
      const client = createHAClient(cfg.url, cfg.token);
      const hist = await client.getHistory(entityId);
      return NextResponse.json({ mock: false, history: hist });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'HA request failed' },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: 'Unknown action or missing params' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action as string;
  const cfg = getConfig();

  if (action === 'toggle' && typeof body.entity_id === 'string') {
    const id = body.entity_id;
    if (!cfg) {
      mockEntities = mockEntities.map((e) => (e.entity_id === id ? flipMockState(e) : e));
      return NextResponse.json({ ok: true, mock: true, entities: mockEntities });
    }
    try {
      const client = createHAClient(cfg.url, cfg.token);
      const domain = id.split('.')[0];
      if (domain === 'lock') {
        const st = await client.getState(id);
        const svc = st.state === 'locked' ? 'unlock' : 'lock';
        await client.callService('lock', svc, { entity_id: id });
      } else if (domain === 'climate') {
        const st = await client.getState(id);
        await client.callService('climate', 'set_hvac_mode', {
          entity_id: id,
          hvac_mode: st.state === 'off' ? 'cool' : 'off',
        });
      } else if (domain === 'cover') {
        const st = await client.getState(id);
        const open = st.state !== 'closed' && st.state !== 'closing';
        await client.callService('cover', open ? 'close_cover' : 'open_cover', { entity_id: id });
      } else if (domain === 'media_player') {
        const st = await client.getState(id);
        const on = st.state === 'on' || st.state === 'playing';
        await client.callService('media_player', on ? 'turn_off' : 'turn_on', { entity_id: id });
      } else {
        await client.callService(domain, 'toggle', { entity_id: id });
      }
      const states = await client.getStates();
      return NextResponse.json({ ok: true, mock: false, states });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'toggle failed' },
        { status: 502 }
      );
    }
  }

  if (action === 'call_service') {
    const domain = body.domain as string;
    const service = body.service as string;
    const fromData = (typeof body.data === 'object' && body.data && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : {}) || {};
    const serviceData = {
      ...fromData,
      ...((body.service_data as Record<string, unknown>) || {}),
    };
    if (!domain || !service) {
      return NextResponse.json({ error: 'domain and service required' }, { status: 400 });
    }
    if (!cfg) {
      return NextResponse.json({ ok: true, mock: true, note: 'No HA — call ignored' });
    }
    try {
      const client = createHAClient(cfg.url, cfg.token);
      await client.callService(domain, service, serviceData);
      return NextResponse.json({ ok: true, mock: false });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'service call failed' },
        { status: 502 }
      );
    }
  }

  if (action === 'fire_event') {
    const eventType = body.event_type as string;
    const eventData = (body.event_data as Record<string, unknown>) || {};
    if (!eventType) return NextResponse.json({ error: 'event_type required' }, { status: 400 });
    if (!cfg) {
      return NextResponse.json({ ok: true, mock: true, note: 'No HA — event not fired' });
    }
    try {
      const client = createHAClient(cfg.url, cfg.token);
      await client.fireEvent(eventType, eventData);
      return NextResponse.json({ ok: true, mock: false });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'fire_event failed' },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
