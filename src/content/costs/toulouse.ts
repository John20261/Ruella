import type { Cost, Meal, Transit } from '../types';

/**
 * Prix à Toulouse (euros). `estimate: true` = ordre de grandeur, non relu sur une source officielle.
 * Lieux absents : gratuits (églises, places, jardins, extérieurs).
 */
const E = { currency: 'EUR', estimate: true } as const;
const V = { currency: 'EUR' } as const;

export const toulouseCosts: Record<string, Cost> = {
  'tls-jacobins': { ...V, adult: 5, child: 3 },
  'tls-augustins': { ...V, adult: 9, child: 5 },
  'tls-bemberg': { ...E, adult: 10, child: 6 },
  'tls-saint-raymond': { ...E, adult: 5, child: 3 },
  'tls-abattoirs': { ...E, adult: 9, child: 5 },
  'tls-cite-espace': { ...V, adult: 32, child: 25.5, freeUnder: 5, childUntil: 18 },
  'tls-aeroscopia': { ...E, adult: 15, child: 12 },
  'tls-halle-machine': { ...E, adult: 12, child: 9, freeUnder: 4 },
  'tls-museum': { ...V, adult: 12, child: 6 },
  'tls-paul-dupuy': { ...E, adult: 5, child: 3 },
  'tls-georges-labit': { ...E, adult: 5, child: 3 },
  'tls-chateau-eau': { ...E, adult: 4, child: 2 },
  'tls-envol-pionniers': { ...E, adult: 10, child: 7 },
  'tls-vieux-toulouse': { ...E, adult: 5, child: 3 },
  'tls-saint-sernin': { ...E, adult: 3, child: 0, childUntil: 12 },
};

export const toulouseMeals: Record<string, Meal> = {
  'tls-bibent': { ...E, adult: 30 },
  'tls-chez-emile': { ...E, adult: 35 },
  'tls-colombier': { ...E, adult: 30 },
  'tls-au-gascon': { ...E, adult: 15 },
  'tls-chez-attila': { ...E, adult: 18 },
  'tls-florida': { ...E, adult: 15 },
  'tls-faim-haricots': { ...E, adult: 14 },
  'tls-sherpa': { ...E, adult: 12 },
  'tls-flowers': { ...E, adult: 10 },
  'tls-navarre': { ...E, adult: 18 },
  'tls-os-a-moelle': { ...E, adult: 25 },
  'tls-aubrac': { ...E, adult: 28 },
  'tls-caves-marechale': { ...E, adult: 28 },
  'tls-jgo': { ...E, adult: 28 },
  'tls-genty-magre': { ...E, adult: 40 },
  'tls-bapz': { ...E, adult: 12 },
  'tls-cafe-artistes': { ...E, adult: 10 },
  'tls-copains-abord': { ...E, adult: 25 },
};

export const toulouseTransit: Transit = {
  network: 'Tisséo : métro, tram, bus et téléphérique',
  currency: 'EUR',
  single: { label: 'Ticket 1 voyage (1 h, correspondances incluses)', adult: 1.9, child: 0.95, childFrom: 5, childUntil: 10 },
  day: { label: 'Pass 24 h', adult: 7 },
  freeUnder: 5,
  howToBuy:
    "Aux distributeurs des stations de métro et de tram, dans l'application Tisséo, ou par carte sans contact directement aux valideurs.",
  tips: [
    'Ticket 1 voyage à 1,90 € depuis le 1er juillet 2026, valable 1 h avec correspondances.',
    'Gratuit avant 5 ans ; demi-tarif pour les 5-10 ans.',
    'Carnet de 10 voyages : moins cher à l’unité pour une famille.',
    'La Cité de l’espace et la Halle de la Machine se rejoignent en bus depuis le métro : comptez 30 à 40 min.',
  ],
  source: 'https://lebonbon.fr/toulouse/news/tickets-tisseo-plus-cher-1er-juillet-toulouse/',
  verifiedAt: '2026-10-29',
};
