'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UiEntity } from '@/types/ha';
import { normalizeStates } from '@/lib/ha-normalize';

export type HAMode = 'loading' | 'mock' | 'live';

export function useHA() {
  const [entities, setEntities] = useState<UiEntity[]>([]);
  const [mode, setMode] = useState<HAMode>('loading');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/ha?action=states');
      const j = await r.json();
      if (!r.ok) {
        setError(typeof j.error === 'string' ? j.error : 'Failed to load HA');
        return;
      }
      setError(null);
      if (j.mock) {
        setMode('mock');
        setEntities(Array.isArray(j.entities) ? j.entities : []);
      } else {
        setMode('live');
        setEntities(normalizeStates(Array.isArray(j.states) ? j.states : []));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const toggle = useCallback(
    async (entityId: string) => {
      const r = await fetch('/api/ha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', entity_id: entityId }),
      });
      const j = await r.json();
      if (!r.ok) return;
      if (j.mock && Array.isArray(j.entities)) {
        setEntities(j.entities);
      } else if (Array.isArray(j.states)) {
        setEntities(normalizeStates(j.states));
      } else {
        refresh();
      }
    },
    [refresh]
  );

  const callService = useCallback(
    async (domain: string, service: string, serviceData?: Record<string, unknown>) => {
      await fetch('/api/ha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'call_service', domain, service, service_data: serviceData ?? {} }),
      });
      refresh();
    },
    [refresh]
  );

  const turnOn = useCallback(
    (entityId: string) => {
      const domain = entityId.split('.')[0];
      return callService(domain, 'turn_on', { entity_id: entityId });
    },
    [callService]
  );

  const turnOff = useCallback(
    (entityId: string) => {
      const domain = entityId.split('.')[0];
      return callService(domain, 'turn_off', { entity_id: entityId });
    },
    [callService]
  );

  const setClimate = useCallback(
    (entityId: string, temperature: number) =>
      callService('climate', 'set_temperature', { entity_id: entityId, temperature }),
    [callService]
  );

  const lock = useCallback(
    (entityId: string) => callService('lock', 'lock', { entity_id: entityId }),
    [callService]
  );

  const unlock = useCallback(
    (entityId: string) => callService('lock', 'unlock', { entity_id: entityId }),
    [callService]
  );

  return {
    entities,
    mode,
    error,
    connected: mode === 'live',
    mock: mode === 'mock',
    loading: mode === 'loading',
    refresh,
    toggle,
    callService,
    turnOn,
    turnOff,
    setClimate,
    lock,
    unlock,
  };
}
