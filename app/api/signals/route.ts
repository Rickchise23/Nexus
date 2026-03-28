import { NextRequest, NextResponse } from 'next/server';
import { getSignals, addSignal, dismissSignal } from '@/lib/db';

export async function GET() {
  const signals = getSignals();
  return NextResponse.json(signals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, text, type } = body;
  if (!source || !text) return NextResponse.json({ error: 'source and text required' }, { status: 400 });
  const id = addSignal({ source, text, type: type || 'alert' });
  return NextResponse.json({ id, success: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  dismissSignal(id);
  return NextResponse.json({ success: true });
}
