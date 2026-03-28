import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ToolUseBlock, TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { getHAClientFromEnv } from '@/lib/ha-client';
import { normalizeState } from '@/lib/ha-normalize';
import type { HAStateRaw } from '@/types/ha';
import { addSignal } from '@/lib/db';
import { triggerVercelDeploy } from '@/lib/nexus-deploy';
import { gitPush, gitStatusSummary } from '@/lib/nexus-git';

export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

const tools: Anthropic.Tool[] = [
  {
    name: 'ha_get_states',
    description: 'List all Home Assistant entity states (lights, locks, climate, sensors, etc.).',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'ha_get_entity',
    description: 'Get the current state of a single entity by entity_id.',
    input_schema: {
      type: 'object' as const,
      properties: { entity_id: { type: 'string', description: 'e.g. light.kitchen' } },
      required: ['entity_id'],
    },
  },
  {
    name: 'ha_call_service',
    description: 'Call a Home Assistant service (e.g. light.turn_on, lock.lock, climate.set_temperature).',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: { type: 'string' },
        service: { type: 'string' },
        service_data: { type: 'object', description: 'JSON object passed to HA' },
      },
      required: ['domain', 'service'],
    },
  },
  {
    name: 'ha_get_history',
    description: 'Fetch state history for an entity (last 24h).',
    input_schema: {
      type: 'object' as const,
      properties: { entity_id: { type: 'string' } },
      required: ['entity_id'],
    },
  },
  {
    name: 'ha_fire_event',
    description: 'Fire an event on the Home Assistant event bus.',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_type: { type: 'string' },
        event_data: { type: 'object' },
      },
      required: ['event_type'],
    },
  },
  {
    name: 'nexus_trigger_deploy',
    description:
      'Trigger a Vercel production deploy (Launch Pad / linked project) via deploy hook configured on the Nexus Mac mini.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'nexus_git_status',
    description: 'Show current git branch and short status for NEXUS_REPO_PATH (e.g. Launch Pad clone on this machine).',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'nexus_git_push',
    description:
      'Run git push in NEXUS_REPO_PATH. Only succeeds when NEXUS_GIT_PUSH_ENABLED=true (safety switch on the Mac mini).',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
];

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === 'nexus_trigger_deploy') {
    const r = await triggerVercelDeploy();
    addSignal({
      source: 'Launch Pad',
      text: r.ok ? r.message : `Deploy failed: ${r.message}`,
      type: r.ok ? 'deploy' : 'alert',
    });
    return JSON.stringify(r);
  }

  if (name === 'nexus_git_status') {
    const r = await gitStatusSummary();
    return JSON.stringify(r);
  }

  if (name === 'nexus_git_push') {
    const r = await gitPush();
    if (r.ok) {
      addSignal({ source: 'Git', text: r.message.slice(0, 240), type: 'product' });
    }
    return JSON.stringify(r);
  }

  const client = getHAClientFromEnv();
  if (!client) {
    return JSON.stringify({
      mock: true,
      message:
        'Home Assistant is not configured (HA_URL / HA_TOKEN missing). Describe what you would do once HA is connected.',
    });
  }
  try {
    switch (name) {
      case 'ha_get_states': {
        const states = await client.getStates();
        return JSON.stringify({ count: states.length, states: states.slice(0, 80) });
      }
      case 'ha_get_entity': {
        const entityId = input.entity_id as string;
        const s = await client.getState(entityId);
        return JSON.stringify(normalizeState(s as HAStateRaw));
      }
      case 'ha_call_service': {
        const domain = input.domain as string;
        const service = input.service as string;
        const serviceData = (input.service_data as Record<string, unknown>) || {};
        const out = await client.callService(domain, service, serviceData);
        return JSON.stringify({ ok: true, result: out });
      }
      case 'ha_get_history': {
        const entityId = input.entity_id as string;
        const hist = await client.getHistory(entityId);
        return JSON.stringify(hist);
      }
      case 'ha_fire_event': {
        const eventType = input.event_type as string;
        const eventData = (input.event_data as Record<string, unknown>) || {};
        await client.fireEvent(eventType, eventData);
        return JSON.stringify({ ok: true });
      }
      default:
        return JSON.stringify({ error: 'unknown tool' });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : 'tool failed' });
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it to .env.local.' },
      { status: 503 }
    );
  }

  let body: { messages?: { role: string; content: string }[]; notifySignal?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const notifySignal = body.notifySignal === true;
  const userMessages = body.messages;
  if (!userMessages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = userMessages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from the user' }, { status: 400 });
  }

  const system = `You are Nexus Agent Bay on a Mac mini: Home Assistant tools, plus shipping code via Vercel and git on this host.
- Use HA tools when the user asks about lights, locks, climate, or home state.
- Use nexus_trigger_deploy when they want to deploy Launch Pad (or the linked Vercel project) from the couch.
- Use nexus_git_status to see branch and working tree for NEXUS_REPO_PATH.
- Use nexus_git_push only when they explicitly ask to push; it only works if the server has enabled it.
Be concise. Confirm destructive actions in plain language.`;

  const finish = (text: string) => {
    if (notifySignal && text.trim()) {
      addSignal({
        source: 'Agent Bay',
        text: text.trim().slice(0, 280),
        type: 'agent',
      });
    }
    return NextResponse.json({ role: 'assistant', content: text });
  };

  for (let iter = 0; iter < 5; iter++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      tools,
      messages,
    });

    const textBlocks = response.content.filter((b): b is TextBlock => b.type === 'text');
    const toolUses = response.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');

    if (toolUses.length === 0) {
      const text = textBlocks.map((b) => b.text).join('\n') || 'Done.';
      return finish(text);
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const input = (tu.input || {}) as Record<string, unknown>;
      const result = await runTool(tu.name, input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: result,
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  return finish('Stopped after maximum tool iterations. Ask a follow-up to continue.');
}
