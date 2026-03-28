import { NextRequest } from 'next/server';
import { createHAClient } from '@/lib/ha-client';

export const dynamic = 'force-dynamic';

function getConfig() {
  const url = process.env.HA_URL?.trim();
  const token = process.env.HA_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

export async function GET(req: NextRequest) {
  const cfg = getConfig();
  const encoder = new TextEncoder();

  if (!cfg) {
    return new Response(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'HA not configured' })}\n\n`), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  const client = createHAClient(cfg.url, cfg.token);
  let lastJson = '';

  const stream = new ReadableStream({
    async start(controller) {
      const signal = req.signal;

      const tick = async () => {
        if (signal.aborted) return;
        try {
          const states = await client.getStates();
          const json = JSON.stringify(states);
          if (json !== lastJson) {
            lastJson = json;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'full', entities: states })}\n\n`)
            );
          }
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'fetch failed' })}\n\n`)
          );
        }
      };

      await tick();
      const iv = setInterval(() => {
        void tick();
      }, 2500);

      signal.addEventListener('abort', () => {
        clearInterval(iv);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
