import type { HAStateRaw } from '@/types/ha';

export function numState(state: string): number {
  const n = parseFloat(state);
  return Number.isFinite(n) ? n : 0;
}

function labelOf(e: HAStateRaw): string {
  const a = e.attributes || {};
  return (a.friendly_name as string) || e.entity_id;
}

function unitLower(e: HAStateRaw): string {
  const u = e.attributes?.unit_of_measurement;
  return typeof u === 'string' ? u.toLowerCase() : '';
}

function haystack(e: HAStateRaw): string {
  return `${e.entity_id} ${labelOf(e)}`.toLowerCase();
}

export type ClassifiedEnergy = {
  consumption: Array<{ entity_id: string; name: string; state: number }>;
  solar: Array<{ entity_id: string; name: string; state: number }>;
  battery: Array<{ entity_id: string; name: string; state: number }>;
  power: Array<{ entity_id: string; name: string; state: number }>;
  primaryHistoryEntityId: string | null;
};

/** Classify HA states into energy buckets for NexusOS Energy module */
export function classifyEnergyEntities(states: HAStateRaw[]): ClassifiedEnergy {
  const consumption: ClassifiedEnergy['consumption'] = [];
  const solar: ClassifiedEnergy['solar'] = [];
  const battery: ClassifiedEnergy['battery'] = [];
  const power: ClassifiedEnergy['power'] = [];

  for (const e of states) {
    const dc = (e.attributes?.device_class as string) || '';
    const u = unitLower(e);
    const hs = haystack(e);
    const n = numState(e.state);
    const row = { entity_id: e.entity_id, name: labelOf(e), state: n };

    const isKwh = u.includes('kwh') || u === 'kwh' || u === 'mwh';
    const isW = u === 'w' || u.endsWith(' w') || u.includes(' watt');
    const isEnergyDc = dc === 'energy';
    const isPowerDc = dc === 'power';

    if (isPowerDc || (isW && e.entity_id.startsWith('sensor.'))) {
      power.push(row);
      continue;
    }

    const solarHint = hs.includes('solar') || hs.includes('pv ') || hs.includes('photovoltaic');
    const batteryHint = hs.includes('battery') || hs.includes('batt ');

    if (batteryHint && (isEnergyDc || isKwh || dc === 'battery')) {
      battery.push(row);
      continue;
    }
    if (solarHint && (isEnergyDc || isKwh)) {
      solar.push(row);
      continue;
    }

    if (isEnergyDc || isKwh || (dc === 'power' && isKwh)) {
      if (solarHint) solar.push(row);
      else if (batteryHint) battery.push(row);
      else consumption.push(row);
    }
  }

  let primaryHistoryEntityId: string | null = null;
  if (consumption.length > 0) primaryHistoryEntityId = consumption[0].entity_id;
  else if (solar.length > 0) primaryHistoryEntityId = solar[0].entity_id;
  else if (power.length > 0) primaryHistoryEntityId = power[0].entity_id;

  return { consumption, solar, battery, power, primaryHistoryEntityId };
}

export function hasAnyEnergyData(c: ClassifiedEnergy): boolean {
  return (
    c.consumption.length + c.solar.length + c.battery.length + c.power.length > 0
  );
}
