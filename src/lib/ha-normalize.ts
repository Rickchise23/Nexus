import type { HAStateRaw, UiEntity } from '@/types/ha';

export function normalizeState(s: HAStateRaw): UiEntity {
  const domain = s.entity_id.split('.')[0] ?? 'unknown';
  const attrs = s.attributes ?? {};
  const friendly =
    (typeof attrs.friendly_name === 'string' && attrs.friendly_name) || s.entity_id;
  const area =
    (typeof attrs.area_id === 'string' && attrs.area_id) ||
    (typeof (attrs as { area?: string }).area === 'string' && (attrs as { area?: string }).area) ||
    'unassigned';

  return {
    entity_id: s.entity_id,
    friendly_name: friendly,
    area,
    state: s.state,
    domain,
    attributes: attrs as Record<string, unknown>,
  };
}

export function normalizeStates(states: HAStateRaw[]): UiEntity[] {
  return states.map(normalizeState);
}
