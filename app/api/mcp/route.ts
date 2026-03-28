import { NextRequest, NextResponse } from 'next/server';
import { triggerVercelDeploy } from '@/lib/nexus-deploy';

/**
 * MCP-style bridge for Home Assistant Assist / external callers.
 * POST JSON: { "tool": "nexus_deploy" | "nexus_github_status" | "nexus_system_status" | "nexus_morning_briefing", "args"?: object }
 */
export async function POST(req: NextRequest) {
  let body: { tool?: string; args?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const tool = body.tool;
  if (!tool) {
    return NextResponse.json({ error: 'tool required' }, { status: 400 });
  }

  const args = body.args || {};

  switch (tool) {
    case 'nexus_deploy': {
      const r = await triggerVercelDeploy();
      return NextResponse.json({
        ok: r.ok,
        status: r.status,
        message: r.message,
      });
    }
    case 'nexus_github_status': {
      return NextResponse.json({
        ok: true,
        message: 'Wire GITHUB_TOKEN or GitHub API in a follow-up; this is a stub.',
        repo: args.repo ?? process.env.GITHUB_REPO ?? 'not configured',
      });
    }
    case 'nexus_system_status': {
      return NextResponse.json({
        ok: true,
        uptime: process.uptime(),
        node: process.version,
        platform: process.platform,
        nexus: 'running',
      });
    }
    case 'nexus_morning_briefing': {
      return NextResponse.json({
        ok: true,
        briefing: [
          'Nexus: online',
          'Calendar: connect Google Calendar in a future phase',
          'Weather: use /api/weather',
          'HA: set HA_URL + HA_TOKEN for live home state',
        ],
      });
    }
    default:
      return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'nexus-mcp',
    tools: [
      { name: 'nexus_deploy', description: 'Trigger a Vercel deploy via deploy hook' },
      { name: 'nexus_github_status', description: 'GitHub repo status (stub)' },
      { name: 'nexus_system_status', description: 'Nexus process / host snapshot' },
      { name: 'nexus_morning_briefing', description: 'Daily briefing placeholder' },
    ],
  });
}
