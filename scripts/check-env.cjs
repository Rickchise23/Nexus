#!/usr/bin/env node
/**
 * Reads .env.local and reports which Nexus-related variables are set (never prints values).
 * Usage: node scripts/check-env.cjs   |   npm run check:env
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env.local');
const examplePath = path.join(root, '.env.example');

function parseEnv(content) {
  const out = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function status(key, env) {
  const v = env[key];
  if (v === undefined || v === '') return { ok: false, hint: 'missing' };
  return { ok: true, hint: `${v.length} chars` };
}

let env = {};
if (fs.existsSync(envPath)) {
  env = parseEnv(fs.readFileSync(envPath, 'utf8'));
} else {
  console.log('No .env.local yet — run ./setup.sh or copy .env.example → .env.local\n');
}

const groups = [
  {
    title: 'Home Assistant (live devices / scenes)',
    keys: ['HA_URL', 'HA_TOKEN'],
    note: 'On the Mac mini brain: HA_URL=http://127.0.0.1:8123',
  },
  {
    title: 'Frigate (Cameras module)',
    keys: ['FRIGATE_URL'],
    note: 'Optional until NVR is running',
  },
  {
    title: 'Agent Bay (Claude)',
    keys: ['ANTHROPIC_API_KEY'],
    note: 'Optional',
  },
  {
    title: 'MQTT (System health row)',
    keys: ['MQTT_HOST', 'MQTT_URL'],
    note: 'Optional — matches Mosquitto in docker-compose',
  },
];

console.log('Nexus — environment check (.env.local)\n');

for (const g of groups) {
  console.log(`${g.title}`);
  console.log(`  ${g.note}`);
  for (const key of g.keys) {
    const s = status(key, env);
    const mark = s.ok ? '✓' : '○';
    const label = s.ok ? `set (${s.hint})` : s.hint;
    console.log(`  ${mark} ${key}: ${label}`);
  }
  console.log('');
}

const haReady = status('HA_URL', env).ok && status('HA_TOKEN', env).ok;
if (haReady) {
  console.log('HA: ready for real entities (restart Next after any .env change).\n');
} else {
  console.log('HA: not fully configured — UI will use mock data until HA_URL + HA_TOKEN are set.\n');
}

if (fs.existsSync(examplePath)) {
  console.log(`Template: ${examplePath}`);
}
console.log(`Your file: ${envPath}`);
