// Récupère la géométrie de fond d'une ville (rivière, grands parcs) sur OpenStreetMap (Overpass),
// la simplifie (Douglas-Peucker) et l'écrit en JSON compact. Usage : node geo.mjs <sortie.json>
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = process.argv[2] ?? 'out/geo.json';
const CITY = process.argv[3] ?? 'prague';
const CITIES = {
  prague: { bbox: '50.00,14.32,50.14,14.52', river: '^Vltava$', canal: null },
  toulouse: { bbox: '43.54,1.36,43.67,1.52', river: 'Garonne', canal: 'Canal du Midi|Canal de Brienne|Canal latéral' },
};
const CONF = CITIES[CITY];
const BBOX = CONF.bbox; // sud, ouest, nord, est
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(q) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await overpassOnce(q);
    } catch (e) {
      console.error('nouvel essai', attempt + 1, e.message);
      await pause(15000 * (attempt + 1));
    }
  }
  throw new Error('Overpass indisponible');
}

async function overpassOnce(q) {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'User-Agent': 'Ruella/1.0 (github.com/John20261/Ruella)' } });
      if (res.ok) return await res.json();
      console.error(url, res.status);
    } catch (e) { console.error(url, e.message); }
  }
  throw new Error('Overpass indisponible');
}

function perpDist(p, a, b) {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
  const dx = x2 - x1, dy = y2 - y1;
  const l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / l)) : 0;
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = perpDist(pts[i], pts[0], pts[pts.length - 1]); if (d > max) { max = d; idx = i; } }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}
const round = (pts) => pts.map(([lat, lng]) => [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5]);

// Assemble des segments de ligne bout à bout.
function chain(ways) {
  const segs = ways.map((w) => w.geometry.map((g) => [g.lat, g.lon]));
  const key = (p) => p.join(',');
  const lines = [];
  while (segs.length) {
    let line = segs.shift();
    let grown = true;
    while (grown) {
      grown = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (key(s[0]) === key(line[line.length - 1])) line = line.concat(s.slice(1));
        else if (key(s[s.length - 1]) === key(line[0])) line = s.concat(line.slice(1));
        else if (key(s[0]) === key(line[0])) line = s.slice().reverse().concat(line.slice(1));
        else if (key(s[s.length - 1]) === key(line[line.length - 1])) line = line.concat(s.slice().reverse().slice(1));
        else continue;
        segs.splice(i, 1); grown = true; break;
      }
    }
    lines.push(line);
  }
  return lines.sort((a, b) => b.length - a.length);
}

const river = await overpass(`[out:json][timeout:60];way["waterway"="river"]["name"~"${CONF.river}"](${BBOX});out geom;`);
const riverLines = chain(river.elements).filter((l) => l.length > 5).map((l) => round(simplify(l, 0.0004)));
let canalLines = [];
if (CONF.canal) {
  await pause(5000);
  const canal = await overpass(`[out:json][timeout:60];way["waterway"="canal"]["name"~"${CONF.canal}"](${BBOX});out geom;`);
  canalLines = chain(canal.elements).filter((l) => l.length > 3).map((l) => round(simplify(l, 0.0003)));
}

await pause(5000);
const parksQ = await overpass(`[out:json][timeout:90];(way["leisure"~"^(park|garden)$"]["name"](${BBOX});relation["leisure"~"^(park|garden)$"]["name"](${BBOX});way["landuse"~"^(forest|grass)$"]["name"](${BBOX});relation["landuse"="forest"]["name"](${BBOX});way["natural"="wood"]["name"](${BBOX}););out geom;`);
const parks = [];
for (const el of parksQ.elements) {
  let ring = null;
  if (el.type === 'way' && el.geometry) ring = el.geometry.map((g) => [g.lat, g.lon]);
  if (el.type === 'relation' && el.members) {
    const outers = el.members.filter((m) => m.role === 'outer' && m.geometry).map((m) => ({ geometry: m.geometry }));
    if (outers.length) ring = chain(outers)[0];
  }
  if (!ring || ring.length < 4) continue;
  const lats = ring.map((p) => p[0]), lngs = ring.map((p) => p[1]);
  const area = (Math.max(...lats) - Math.min(...lats)) * (Math.max(...lngs) - Math.min(...lngs));
  if (area < 0.00002) continue; // ignore les petits squares
  parks.push({ name: el.tags?.name ?? '', area, ring: round(simplify(ring, 0.0002)) });
}
parks.sort((a, b) => b.area - a.area);

const out = { bbox: BBOX, river: riverLines, canals: canalLines, parks: parks.slice(0, 60).map(({ name, ring }) => ({ name, ring })) };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
console.log('rivière', riverLines.map((l) => l.length), 'canaux', canalLines.map((l) => l.length), 'parcs', out.parks.length, out.parks.map((p) => p.name).join(' | '));
