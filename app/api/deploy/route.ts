import { NextResponse } from 'next/server';
import { addSignal } from '@/lib/db';
import { triggerVercelDeploy } from '@/lib/nexus-deploy';

/**
 * POST /api/deploy — trigger Vercel deploy hook + log a TV signal (Launch Pad / couch workflow).
 */
export async function POST() {
  const result = await triggerVercelDeploy();

  const text = result.ok
    ? `${result.message}${result.status != null ? ` (${result.status})` : ''}`
    : result.message;

  addSignal({
    source: 'Launch Pad',
    text,
    type: result.ok ? 'deploy' : 'alert',
  });

  return NextResponse.json({
    ok: result.ok,
    message: result.message,
    status: result.status,
  });
}
