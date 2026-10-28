import { prague, praguePlaces } from '@/content/prague';
import type { City, Place, PlaceKind } from '@/content/types';

export const cities: City[] = [prague];

const placesByCity: Record<string, Place[]> = {
  prague: praguePlaces,
};

/** Catégories affichées dans l'écran « Explorer la ville ». */
export const kindGroups: { key: 'visites' | 'pepites' | 'restaurants'; label: string; kinds: PlaceKind[] }[] = [
  { key: 'visites', label: 'Visites', kinds: ['monument', 'museum', 'district', 'viewpoint', 'park'] },
  { key: 'pepites', label: 'Pépites', kinds: ['gem'] },
  { key: 'restaurants', label: 'Restaurants', kinds: ['restaurant'] },
];

export function getCity(id: string): City | undefined {
  return cities.find((c) => c.id === id);
}

export function getPlaces(cityId: string): Place[] {
  return placesByCity[cityId] ?? [];
}

export function getPlace(id: string): Place | undefined {
  for (const list of Object.values(placesByCity)) {
    const found = list.find((p) => p.id === id);
    if (found) return found;
  }
  return undefined;
}

/** « 20 min », « 1 h », « 1 h 30 ». */
export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export const kindLabel: Record<PlaceKind, string> = {
  monument: 'Monument',
  museum: 'Musée',
  gem: 'Pépite',
  restaurant: 'Restaurant',
  viewpoint: 'Point de vue',
  district: 'Quartier',
  park: 'Parc',
};

/**
 * Règles de qualité de l'étape 4. Renvoie la liste des problèmes (vide = fiche valide).
 * Une fiche `published` doit en plus être vérifiée, géolocalisée et illustrée sous licence.
 */
export function validatePlace(place: Place, city: City): string[] {
  const problems: string[] = [];
  const where = `[${place.id}]`;

  if (!/^[a-z]{3}-[a-z0-9-]+$/.test(place.id)) problems.push(`${where} identifiant invalide`);
  if (place.cityId !== city.id) problems.push(`${where} ville incohérente`);
  if (!place.name.trim()) problems.push(`${where} nom manquant`);
  if (place.hook.length > 120) problems.push(`${where} accroche trop longue (${place.hook.length} > 120)`);
  if (place.hook.trim().length < 20) problems.push(`${where} accroche trop courte`);

  const { minLat, maxLat, minLng, maxLng } = city.bounds;
  if (place.lat < minLat || place.lat > maxLat || place.lng < minLng || place.lng > maxLng) {
    problems.push(`${where} position hors de ${city.name}`);
  }
  if (place.radiusM < 20 || place.radiusM > 300) problems.push(`${where} rayon de validation hors limites`);
  if (place.durationMin <= 0) problems.push(`${where} durée invalide`);
  if (place.ages.length === 0) problems.push(`${where} âges conseillés manquants`);
  if (place.wishes.length === 0) problems.push(`${where} envies manquantes`);

  if (place.kind === 'gem') {
    if (!place.why || place.why.trim().length < 40) problems.push(`${where} pépite sans « pourquoi c'est canon »`);
    if (place.durationMin > 20) problems.push(`${where} une pépite dure 20 min maximum`);
  }
  if (place.kind === 'restaurant' && !place.priceLevel) problems.push(`${where} restaurant sans niveau de prix`);

  for (const url of [place.ticketUrl, ...place.verification.sources]) {
    if (url && !url.startsWith('https://')) problems.push(`${where} lien non sécurisé : ${url}`);
  }
  if (place.verification.status === 'verified') {
    if (!place.verification.date) problems.push(`${where} vérification sans date`);
    if (place.verification.sources.length === 0) problems.push(`${where} vérification sans source`);
  }

  if (place.status === 'published') {
    if (place.verification.status !== 'verified') problems.push(`${where} publiée sans vérification`);
    if (!place.coordsVerified) problems.push(`${where} publiée avec une position approximative`);
    if (!place.photo) problems.push(`${where} publiée sans photo`);
  }
  if (place.photo && (!place.photo.author || !place.photo.license || !place.photo.sourceUrl)) {
    problems.push(`${where} photo sans auteur, licence ou source`);
  }

  return problems;
}

export function validateCatalog(): string[] {
  const problems: string[] = [];
  for (const city of cities) {
    const places = getPlaces(city.id);
    const seen = new Set<string>();
    for (const p of places) {
      if (seen.has(p.id)) problems.push(`[${p.id}] identifiant en double`);
      seen.add(p.id);
      problems.push(...validatePlace(p, city));
    }
  }
  return problems;
}

/** Avancement du contenu d'une ville, pour suivre l'objectif 40 / 40 / 25. */
function groupKinds(key: (typeof kindGroups)[number]['key']): PlaceKind[] {
  return kindGroups.find((g) => g.key === key)?.kinds ?? [];
}

export function contentProgress(cityId: string) {
  const places = getPlaces(cityId);
  const count = (kinds: PlaceKind[]) => places.filter((p) => kinds.includes(p.kind)).length;
  return {
    visites: count(groupKinds('visites')),
    pepites: count(groupKinds('pepites')),
    restaurants: count(groupKinds('restaurants')),
    verifiees: places.filter((p) => p.verification.status === 'verified').length,
    publiees: places.filter((p) => p.status === 'published').length,
    total: places.length,
  };
}
