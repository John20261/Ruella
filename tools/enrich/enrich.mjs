// Collecte des positions et des photos libres de droits pour les fiches Ruella.
// Exécuté dans GitHub Actions (accès Internet), résultat publié comme artefact :
//   node tools/enrich/enrich.mjs tools/enrich/targets.json out/enrichment.json
// Sources : Wikidata (position P625, image P18, site officiel P856), Wikimedia Commons
// (auteur et licence de la photo), OpenStreetMap Nominatim (position des lieux absents de Wikidata).
// Respecte les règles d'usage : User-Agent identifiant, une requête par seconde vers Nominatim.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const UA = 'RuellaContentBot/0.1 (https://github.com/John20261/Ruella)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * attempt);
      continue;
    }
    throw new Error(`${res.status} ${url}`);
  }
  throw new Error(`échec après 3 essais : ${url}`);
}

const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// Ville visée : Prague par défaut ; un fichier de cibles peut préciser { country, bbox, items }.
let COUNTRY = 'cz';
let BBOX = [49.94, 50.18, 14.22, 14.71];

async function entityFromWiki(title, site = 'enwiki') {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=${site}&titles=${encodeURIComponent(title)}&props=claims|labels|sitelinks&languages=fr|en|cs&format=json`;
  const data = await getJson(url);
  const entity = Object.values(data.entities ?? {})[0];
  return entity && typeof entity.id === 'string' && entity.id.startsWith('Q') ? entity : null;
}

async function entityFromSearch(query, lang = 'en') {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=${lang}&limit=5&format=json`;
  const data = await getJson(url);
  for (const hit of data.search ?? []) {
    const e = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${hit.id}&props=claims|labels|sitelinks&languages=fr|en|cs&format=json`,
    );
    const entity = e.entities[hit.id];
    const coord = entity?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (coord && coord.latitude > BBOX[0] && coord.latitude < BBOX[1] && coord.longitude > BBOX[2] && coord.longitude < BBOX[3]) {
      return entity;
    }
  }
  return null;
}

async function commonsPhoto(fileName) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(`File:${fileName}`)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&format=json`;
  const data = await getJson(url);
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  return {
    url: info.thumburl ?? info.url,
    author: stripHtml(meta.Artist?.value) || 'Auteur inconnu',
    license: stripHtml(meta.LicenseShortName?.value) || 'Licence inconnue',
    sourceUrl: info.descriptionurl,
  };
}

async function nominatim(query) {
  await sleep(1100);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1&countrycodes=${COUNTRY}`;
  const data = await getJson(url);
  const hit = data[0];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), osm: `https://www.openstreetmap.org/${hit.osm_type}/${hit.osm_id}`, label: hit.display_name } : null;
}

const claimValue = (entity, prop) => entity?.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;

async function main() {
  const [, , input, output] = process.argv;
  const raw = JSON.parse(await readFile(input, 'utf8'));
  const targets = Array.isArray(raw) ? raw : raw.items;
  if (!Array.isArray(raw)) {
    COUNTRY = raw.country ?? COUNTRY;
    BBOX = raw.bbox ?? BBOX;
  }
  const results = [];

  for (const t of targets) {
    const row = { id: t.id };
    try {
      let entity = null;
      if (t.frwiki) entity = await entityFromWiki(t.frwiki, 'frwiki');
      if (!entity && t.enwiki) entity = await entityFromWiki(t.enwiki);
      if (!entity && t.search) entity = await entityFromSearch(t.search, t.frwiki ? 'fr' : 'en');
      if (!entity && t.enwiki) entity = await entityFromSearch(t.enwiki);
      if (!entity && t.frwiki) entity = await entityFromSearch(t.frwiki, 'fr');

      if (entity) {
        row.wikidata = `https://www.wikidata.org/wiki/${entity.id}`;
        row.label = entity.labels?.fr?.value ?? entity.labels?.en?.value;
        row.labelCs = entity.labels?.cs?.value;
        const coord = claimValue(entity, 'P625');
        if (coord) row.wikidataCoords = { lat: coord.latitude, lng: coord.longitude };
        row.website = claimValue(entity, 'P856') ?? null;
        row.frwiki = entity.sitelinks?.frwiki?.title ?? null;
        const image = claimValue(entity, 'P18');
        if (image) row.photo = await commonsPhoto(image);
      }
      for (const q of [t.osm, ...(t.osmAlt ?? [])].filter(Boolean)) {
        row.osm = await nominatim(q);
        if (row.osm) break;
      }
    } catch (err) {
      row.error = String(err.message ?? err);
    }
    results.push(row);
    console.log(`${row.id}: ${row.wikidata ?? '—'} ${row.osm ? 'osm ✓' : ''} ${row.photo ? 'photo ✓' : ''} ${row.error ?? ''}`);
    await sleep(300);
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
