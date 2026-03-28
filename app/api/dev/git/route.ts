import { NextRequest, NextResponse } from 'next/server';
import { gitPush, gitStatusSummary } from '@/lib/nexus-git';

/**
 * POST /api/dev/git — server-side git (Mac mini only). Body: { "action": "status" | "push" }
 */
export async function POST(req: NextRequest) {
  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action || 'status';

  if (action === 'status') {
    const out = await gitStatusSummary();
    return NextResponse.json(out);
  }

  if (action === 'push') {
    const out = await gitPush();
    return NextResponse.json(out);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
