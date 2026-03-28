/** Home Assistant REST API state shape (subset) */
export interface HAStateRaw {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

/** Normalized entity for NexusOS UI */
export interface UiEntity {
  entity_id: string;
  friendly_name: string;
  area: string;
  state: string;
  domain: string;
  attributes: Record<string, unknown>;
}
