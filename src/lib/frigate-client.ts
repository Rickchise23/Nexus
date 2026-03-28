const FRIGATE_TIMEOUT_MS = 8000;

export function getFrigateBase(): string | null {
  const u = process.env.FRIGATE_URL?.trim();
  return u ? u.replace(/\/$/, '') : null;
}

export async function frigateFetch(path: string): Promise<Response> {
  const base = getFrigateBase();
  if (!base) throw new Error('FRIGATE_URL not set');
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FRIGATE_TIMEOUT_MS);
  try {
    return await fetch(url, { next: { revalidate: 0 }, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}
