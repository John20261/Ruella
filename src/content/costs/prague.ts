import type { Cost, Meal, Transit } from '../types';

/**
 * Prix à Prague (couronnes tchèques). `estimate: true` = ordre de grandeur, non relu sur une source officielle.
 * Lieux absents de cette liste : gratuits (rues, places, extérieurs, églises sans billet).
 */
const E = { currency: 'CZK', estimate: true } as const;
const V = { currency: 'CZK' } as const;

export const pragueCosts: Record<string, Cost> = {
  'prg-musee-lego': { ...E, adult: 290, child: 190, freeUnder: 4, childUntil: 14 },
  'prg-musee-miniatures': { ...E, adult: 200, child: 100 },
  'prg-chateau': { ...V, adult: 450, child: 300, childUntil: 16, group: 'prg-castle' },
  'prg-ruelle-or': { ...V, adult: 450, child: 300, childUntil: 16, group: 'prg-castle' },
  'prg-karel-zeman': { ...V, adult: 300, child: 190, childUntil: 17 },
  'prg-musee-technique': { ...E, adult: 350, child: 200 },
  'prg-musee-national': { ...E, adult: 300, child: 0, childUntil: 14 },
  'prg-tour-poudre': { ...E, adult: 170, child: 110 },
  'prg-klementinum': { ...V, adult: 380, child: 230 },
  'prg-hotel-de-ville': { ...E, adult: 300, child: 200 },
  'prg-saint-nicolas': { ...E, adult: 150, child: 100 },
  'prg-bibliotheque-strahov': { ...V, adult: 220, child: 110 },
  'prg-petrin-tour': { ...V, adult: 250, child: 170, childUntil: 15 },
  'prg-labyrinthe-miroirs': { ...V, adult: 150, child: 100, childUntil: 15 },
  'prg-tour-zizkov': { ...V, adult: 300, child: 250 },
  'prg-musee-mucha': { ...V, adult: 300, child: 220 },
  'prg-musee-kafka': { ...V, adult: 300, child: 220 },
  'prg-josefov': { ...V, adult: 600, child: 200, freeUnder: 7, childUntil: 15, group: 'prg-jewish-museum' },
  'prg-synagogue-espagnole': { ...V, adult: 600, child: 200, freeUnder: 7, childUntil: 15, group: 'prg-jewish-museum' },
  'prg-cimetiere-juif': { ...V, adult: 600, child: 200, freeUnder: 7, childUntil: 15, group: 'prg-jewish-museum' },
  'prg-dessins-terezin': { ...V, adult: 600, child: 200, freeUnder: 7, childUntil: 15, group: 'prg-jewish-museum' },
  'prg-synagogue-vieille-nouvelle': { ...E, adult: 250, child: 170 },
  'prg-musee-communisme': { ...E, adult: 380, child: 290 },
  'prg-tour-pont-vieille-ville': { ...E, adult: 200, child: 140 },
  'prg-musee-kampa': { ...E, adult: 300, child: 150 },
  'prg-zoo': { ...V, adult: 330, child: 250, freeUnder: 3, childUntil: 15 },
  'prg-palais-lobkowicz': { ...E, adult: 330, child: 250 },
  'prg-jardin-vrtba': { ...V, adult: 150, child: 110 },
  'prg-choco-cafe': { ...E, adult: 120, child: 100, freeUnder: 0 },
  'prg-funiculaire-petrin': { ...E, adult: 60, child: 0, childUntil: 14 },
};

/** Repas moyen par personne (plat + boisson), en couronnes. */
export const pragueMeals: Record<string, Meal> = {
  'prg-lokal-bile-kuzelky': { ...E, adult: 350 },
  'prg-u-pinkasu': { ...E, adult: 400 },
  'prg-cafe-louvre': { ...E, adult: 400 },
  'prg-lokal-dlouha': { ...E, adult: 350 },
  'prg-kantyna': { ...E, adult: 400 },
  'prg-cafe-savoy': { ...E, adult: 450 },
  'prg-u-fleku': { ...E, adult: 500 },
  'prg-havelska-koruna': { ...E, adult: 220 },
  'prg-sisters': { ...E, adult: 150 },
  'prg-nase-maso': { ...E, adult: 280 },
  'prg-u-kroka': { ...E, adult: 400 },
  'prg-kuchyn': { ...E, adult: 400 },
  'prg-kolkovna': { ...E, adult: 450 },
  'prg-eska': { ...E, adult: 450 },
  'prg-pho-tuan-lan': { ...E, adult: 220 },
  'prg-mysak': { ...E, adult: 180 },
  'prg-vytopna': { ...E, adult: 400 },
  'prg-pivovar-strahov': { ...E, adult: 450 },
  'prg-cafe-slavia': { ...E, adult: 350 },
  'prg-ovocny-svetozor': { ...E, adult: 120 },
  'prg-maitrea': { ...E, adult: 300 },
  'prg-country-life': { ...E, adult: 220 },
  'prg-u-medvidku': { ...E, adult: 400 },
  'prg-letensky-zamecek': { ...E, adult: 250 },
  'prg-mincovna': { ...E, adult: 500 },
};

export const pragueTransit: Transit = {
  network: 'PID : métro, tram, bus et funiculaire',
  currency: 'CZK',
  single: { label: 'Billet 90 min', adult: 46, child: 0, childFrom: 6, childUntil: 14 },
  day: { label: 'Pass 24 h', adult: 140, child: 0 },
  freeUnder: 15,
  howToBuy:
    "Le plus simple et le moins cher : l'application officielle PID Lítačka. On y paie par carte, Apple Pay ou Google Pay, on active le billet juste avant de monter, et on montre son QR code en cas de contrôle. Sinon : distributeurs dans le métro et à certains arrêts (billet papier à composter au premier passage, un peu plus cher).",
  apps: [
    {
      name: 'PID Lítačka',
      what: 'L’application officielle des transports de Prague : billets 30 min, 90 min, 24 h et 72 h, itinéraires, position des trams en direct, en anglais.',
      ios: 'https://apps.apple.com/cz/app/pid-l%C3%ADta%C4%8Dka/id983071129',
      android: 'https://play.google.com/store/apps/details?id=cz.dpp.praguepublictransport',
      tickets: true,
    },
  ],
  tips: [
    'Billets moins chers dans l’application PID Lítačka que sur papier (36 CZK contre 39 CZK pour 30 min, 46 CZK contre 50 CZK pour 90 min).',
    'Installez l’application et enregistrez votre carte bancaire avant de partir : achat en dix secondes à l’arrêt.',
    'Les enfants de 6 à 14 ans voyagent gratuitement avec une pièce d’identité ; avant 6 ans, gratuit avec un adulte.',
    'Le funiculaire de Petřín accepte les pass 24 h et 72 h, pas les billets 30 et 90 min.',
    'Pass 72 h : 340 CZK, rentable dès 8 trajets.',
  ],
  source: 'https://pid.cz/en/new-pid-tariff-from-1-january-2026-dont-pay-more-than-you-have-to/',
  verifiedAt: '2026-10-29',
};
