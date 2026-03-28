import type { UiEntity } from '@/types/ha';

/** Seed mock entities when HA_URL / HA_TOKEN are not configured */
export const HA_MOCK_ENTITIES: UiEntity[] = [
  { entity_id: 'light.living_room', friendly_name: 'Living Room Lights', area: 'living_room', state: 'on', domain: 'light', attributes: { brightness: 204, color_temp: 350 } },
  { entity_id: 'light.bedroom', friendly_name: 'Bedroom Lights', area: 'bedroom', state: 'off', domain: 'light', attributes: { brightness: 0 } },
  { entity_id: 'light.kitchen', friendly_name: 'Kitchen Lights', area: 'kitchen', state: 'on', domain: 'light', attributes: { brightness: 255 } },
  { entity_id: 'light.office_desk', friendly_name: 'Desk Lamp', area: 'office', state: 'on', domain: 'light', attributes: { brightness: 180 } },
  { entity_id: 'light.garage', friendly_name: 'Garage Light', area: 'garage', state: 'off', domain: 'light', attributes: { brightness: 0 } },
  { entity_id: 'light.porch', friendly_name: 'Porch Light', area: 'exterior', state: 'on', domain: 'light', attributes: { brightness: 128 } },
  { entity_id: 'climate.main_floor', friendly_name: 'Main Thermostat', area: 'living_room', state: 'cool', domain: 'climate', attributes: { temperature: 72, current_temperature: 74, hvac_action: 'cooling' } },
  { entity_id: 'climate.bedroom', friendly_name: 'Bedroom AC', area: 'bedroom', state: 'cool', domain: 'climate', attributes: { temperature: 68, current_temperature: 70, hvac_action: 'idle' } },
  { entity_id: 'lock.front_door', friendly_name: 'Front Door', area: 'exterior', state: 'locked', domain: 'lock', attributes: {} },
  { entity_id: 'lock.garage_door', friendly_name: 'Garage Door Lock', area: 'garage', state: 'locked', domain: 'lock', attributes: {} },
  { entity_id: 'binary_sensor.front_door', friendly_name: 'Front Door', area: 'exterior', state: 'off', domain: 'binary_sensor', attributes: { device_class: 'door' } },
  { entity_id: 'binary_sensor.motion_office', friendly_name: 'Office Motion', area: 'office', state: 'on', domain: 'binary_sensor', attributes: { device_class: 'motion' } },
  { entity_id: 'sensor.indoor_temp', friendly_name: 'Indoor Temperature', area: 'living_room', state: '74.2', domain: 'sensor', attributes: { unit_of_measurement: '°F', device_class: 'temperature' } },
  { entity_id: 'sensor.outdoor_temp', friendly_name: 'Outdoor Temperature', area: 'exterior', state: '101.4', domain: 'sensor', attributes: { unit_of_measurement: '°F', device_class: 'temperature' } },
  { entity_id: 'sensor.humidity', friendly_name: 'Indoor Humidity', area: 'living_room', state: '38', domain: 'sensor', attributes: { unit_of_measurement: '%', device_class: 'humidity' } },
  { entity_id: 'fan.living_room', friendly_name: 'Ceiling Fan', area: 'living_room', state: 'on', domain: 'fan', attributes: { percentage: 66 } },
  { entity_id: 'fan.bedroom', friendly_name: 'Bedroom Fan', area: 'bedroom', state: 'off', domain: 'fan', attributes: { percentage: 0 } },
  { entity_id: 'media_player.living_room', friendly_name: 'Living Room TV', area: 'living_room', state: 'off', domain: 'media_player', attributes: { source: 'Apple TV' } },
  { entity_id: 'switch.office_monitor', friendly_name: 'Monitor Power', area: 'office', state: 'on', domain: 'switch', attributes: {} },
  { entity_id: 'cover.garage', friendly_name: 'Garage Door', area: 'garage', state: 'closed', domain: 'cover', attributes: {} },
];

export function cloneMockEntities(): UiEntity[] {
  return HA_MOCK_ENTITIES.map((e) => ({
    ...e,
    attributes: { ...e.attributes },
  }));
}
