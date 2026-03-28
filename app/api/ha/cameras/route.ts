import { NextRequest, NextResponse } from 'next/server';
import { frigateFetch, getFrigateBase } from '@/lib/frigate-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'stats';
  const base = getFrigateBase();

  if (action === 'stats') {
    if (!base) return NextResponse.json(null, { status: 404 });
    try {
      const res = await frigateFetch('/api/stats');
      if (!res.ok) return NextResponse.json(null, { status: 502 });
      return NextResponse.json(await res.json());
    } catch {
      return NextResponse.json(null, { status: 502 });
    }
  }

  if (action === 'events') {
    if (!base) return NextResponse.json([]);
    const limit = req.nextUrl.searchParams.get('limit') || '10';
    try {
      const res = await frigateFetch(`/api/events?limit=${encodeURIComponent(limit)}`);
      if (!res.ok) return NextResponse.json([]);
      return NextResponse.json(await res.json());
    } catch {
      return NextResponse.json([]);
    }
  }

  if (action === 'snapshot') {
    const camera = req.nextUrl.searchParams.get('camera');
    if (!camera || !base) {
      return new NextResponse(null, { status: 404 });
    }
    try {
      const res = await frigateFetch(`/api/${encodeURIComponent(camera)}/latest.jpg`);
      if (!res.ok) return new NextResponse(null, { status: 502 });
      const buf = await res.arrayBuffer();
      const ct = res.headers.get('content-type') || 'image/jpeg';
      return new NextResponse(buf, {
        headers: { 'Content-Type': ct, 'Cache-Control': 'no-cache' },
      });
    } catch {
      return new NextResponse(null, { status: 502 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
