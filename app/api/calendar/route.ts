import { NextRequest, NextResponse } from 'next/server';
import { getGoals, addGoal, toggleGoal } from '@/lib/db';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || undefined;
  const goals = getGoals(date);
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { label, date } = body;
  if (!label) return NextResponse.json({ error: 'label required' }, { status: 400 });
  const id = addGoal(label, date);
  return NextResponse.json({ id, success: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  toggleGoal(id);
  return NextResponse.json({ success: true });
}
