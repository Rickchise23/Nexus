import { writeFileSync } from 'fs';

function createSVG(size, maskable = false) {
  const pad = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - pad * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = inner * 0.28;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0f"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#60A5FA" stroke-width="${size * 0.015}" opacity="0.6"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.4}" fill="#60A5FA" opacity="0.9"/>
  <text x="${cx}" y="${cy + inner * 0.22}" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="200" font-size="${inner * 0.09}" fill="rgba(255,255,255,0.7)" letter-spacing="${inner * 0.015}">NEXUS</text>
</svg>`;
}

for (const [file, size, maskable] of [
  ['public/icons/icon-192.svg', 192, false],
  ['public/icons/icon-512.svg', 512, false],
  ['public/icons/icon-maskable-512.svg', 512, true],
]) {
  writeFileSync(file, createSVG(size, maskable));
  console.log(`wrote ${file}`);
}
