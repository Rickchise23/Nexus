import type { HAStateRaw } from '@/types/ha';

function baseHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function createHAClient(baseUrl: string, token: string) {
  const base = baseUrl.replace(/\/$/, '');

  async function parseJson(res: Response) {
    const text = await res.text();
    if (!res.ok) throw new Error(text || res.statusText);
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  return {
    base,

    async getStates(): Promise<HAStateRaw[]> {
      const res = await fetch(`${base}/api/states`, { headers: baseHeaders(token) });
      return parseJson(res) as Promise<HAStateRaw[]>;
    },

    async getState(entityId: string): Promise<HAStateRaw> {
      const res = await fetch(`${base}/api/states/${encodeURIComponent(entityId)}`, {
        headers: baseHeaders(token),
      });
      return parseJson(res) as Promise<HAStateRaw>;
    },

    async callService(domain: string, service: string, serviceData: Record<string, unknown> = {}) {
      const res = await fetch(`${base}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: baseHeaders(token),
        body: JSON.stringify(serviceData),
      });
      return parseJson(res);
    },

    async fireEvent(eventType: string, eventData: Record<string, unknown> = {}) {
      const res = await fetch(`${base}/api/events/${encodeURIComponent(eventType)}`, {
        method: 'POST',
        headers: baseHeaders(token),
        body: JSON.stringify(eventData),
      });
      return parseJson(res);
    },

    /** History for one entity (last 24h) */
    async getHistory(entityId: string): Promise<unknown> {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      const qs = new URLSearchParams({
        filter_entity_id: entityId,
        end_time: end.toISOString(),
        minimal_response: 'true',
      });
      const res = await fetch(`${base}/api/history/period/${encodeURIComponent(start.toISOString())}?${qs}`, {
        headers: baseHeaders(token),
      });
      return parseJson(res);
    },

    async ping(): Promise<boolean> {
      const res = await fetch(`${base}/api/`, { headers: baseHeaders(token) });
      return res.ok;
    },

    async getConfig(): Promise<Record<string, unknown>> {
      const res = await fetch(`${base}/api/config`, { headers: baseHeaders(token) });
      return parseJson(res) as Promise<Record<string, unknown>>;
    },
  };
}

export type HAClient = ReturnType<typeof createHAClient>;

export function getHAClientFromEnv(): HAClient | null {
  const url = process.env.HA_URL?.trim();
  const token = process.env.HA_TOKEN?.trim();
  if (!url || !token) return null;
  return createHAClient(url, token);
}
