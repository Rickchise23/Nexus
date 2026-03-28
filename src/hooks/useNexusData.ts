import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { WeatherData, Signal, ContentItem, Goal, StockQuote, NexusMode } from '@/types/nexus';
import { determineMode } from '@/lib/mode-engine';

function mapGoalRow(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    label: String(row.label),
    done: Boolean(row.done),
    date: String(row.date),
  };
}

function mapContentRow(row: Record<string, unknown>): ContentItem {
  let tags: string[] = [];
  try {
    tags = typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : Array.isArray(row.tags) ? row.tags as string[] : [];
  } catch {
    tags = [];
  }
  return {
    id: String(row.id),
    url: String(row.url),
    title: String(row.title),
    source: String(row.source),
    type: row.type as ContentItem['type'],
    duration: String(row.duration ?? ''),
    thumbnail: row.thumbnail ? String(row.thumbnail) : undefined,
    tags,
    status: row.status as ContentItem['status'],
    progress: Number(row.progress ?? 0),
    savedBy: String(row.saved_by ?? row.savedBy ?? 'rick'),
    savedAt: String(row.saved_at ?? row.savedAt ?? new Date().toISOString()),
    modeAffinity: row.mode_affinity as NexusMode | undefined,
  };
}

function mapSignalRow(row: Record<string, unknown>): Signal {
  return {
    id: String(row.id),
    source: String(row.source),
    text: String(row.text),
    type: row.type as Signal['type'],
    time: String(row.time),
    read: Boolean(row.read),
  };
}

interface NexusData {
  weather: WeatherData | null;
  signals: Signal[];
  content: ContentItem[];
  goals: Goal[];
  stocks: StockQuote[];
  mode: NexusMode;
  modeOverride: NexusMode | null;
  setModeOverride: Dispatch<SetStateAction<NexusMode | null>>;
  refresh: () => void;
  loading: boolean;
}

export function useNexusData(): NexusData {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [modeOverride, setModeOverride] = useState<NexusMode | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [w, s, c, g, st] = await Promise.allSettled([
        fetch('/api/weather').then(r => r.json()),
        fetch('/api/signals').then(r => r.json()),
        fetch('/api/content').then(r => r.json()),
        fetch('/api/calendar').then(r => r.json()),
        fetch('/api/stocks').then(r => r.json()),
      ]);

      if (w.status === 'fulfilled') setWeather(w.value);
      if (s.status === 'fulfilled' && Array.isArray(s.value)) setSignals(s.value.map((r) => mapSignalRow(r as Record<string, unknown>)));
      if (c.status === 'fulfilled' && Array.isArray(c.value)) setContent(c.value.map((r) => mapContentRow(r as Record<string, unknown>)));
      if (g.status === 'fulfilled' && Array.isArray(g.value)) setGoals(g.value.map((r) => mapGoalRow(r as Record<string, unknown>)));
      if (st.status === 'fulfilled' && Array.isArray(st.value)) setStocks(st.value);
    } catch (e) {
      console.error('[Nexus] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Poll every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Poll weather less frequently (10 min)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const w = await fetch('/api/weather').then(r => r.json());
        setWeather(w);
      } catch {}
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  const mode = determineMode(modeOverride);

  return { weather, signals, content, goals, stocks, mode, modeOverride, setModeOverride, refresh: fetchAll, loading };
}
