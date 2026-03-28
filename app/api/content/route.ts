import { NextRequest, NextResponse } from 'next/server';
import { getContent, addContent, updateContentProgress, updateContentStatus, deleteContent } from '@/lib/db';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || undefined;
  const items = getContent(status as string | undefined);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, title, source, type, duration } = body;

  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  // Auto-detect source from URL
  const autoSource = url.includes('youtube.com') || url.includes('youtu.be') ? 'YouTube'
    : url.includes('spotify.com') ? 'Spotify'
    : url.includes('podcasts.apple') ? 'Apple Podcasts'
    : source || 'Link';

  const autoType = url.includes('youtube.com') || url.includes('youtu.be') ? 'video'
    : url.includes('spotify.com') || url.includes('podcast') ? 'podcast'
    : type || 'article';

  const id = addContent({
    url,
    title: title || url,
    source: autoSource,
    type: autoType,
    duration: duration || '',
  });

  return NextResponse.json({ id, success: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, progress, status } = body;

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  if (progress !== undefined) updateContentProgress(id, progress);
  if (status) updateContentStatus(id, status);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  deleteContent(id);
  return NextResponse.json({ success: true });
}
