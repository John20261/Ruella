/**
 * Recalage des horaires d'une journée (fonction « Je pars maintenant »).
 * Logique reprise du carnet HTML de Prague, testée dans schedule.test.ts.
 */

export type PlannedStop = {
  id: string;
  /** Heure prévue « HH:MM » */
  time: string;
  /** Contrainte fixe (bus, vol, retour hôtel) : ne bouge jamais. */
  fixed?: boolean;
  skipped?: boolean;
};

const MINUTES_PER_DAY = 24 * 60;

export function toMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) throw new Error(`Heure invalide : « ${time} »`);
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) throw new Error(`Heure invalide : « ${time} »`);
  return h * 60 + m;
}

export function toTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type ShiftResult<T extends PlannedStop> = {
  stops: T[];
  /** Décalage appliqué en minutes (positif = départ plus tard). */
  offset: number;
  /** Première contrainte fixe dépassée par une étape non fixe, s'il y en a une. */
  threatenedFixedStop: T | null;
};

/**
 * Décale toutes les étapes non fixes de l'écart entre le départ prévu (première étape)
 * et le nouveau départ. Les étapes fixes gardent leur heure.
 */
export function shiftDay<T extends PlannedStop>(stops: T[], newStart: string): ShiftResult<T> {
  if (stops.length === 0) return { stops: [], offset: 0, threatenedFixedStop: null };

  const offset = toMinutes(newStart) - toMinutes(stops[0].time);
  const shifted = stops.map((s) => (s.fixed || offset === 0 ? s : { ...s, time: toTime(toMinutes(s.time) + offset) }));

  let threatenedFixedStop: T | null = null;
  shifted.forEach((stop, i) => {
    if (!stop.fixed || threatenedFixedStop) return;
    const overrun = shifted
      .slice(0, i)
      .some((earlier) => !earlier.fixed && !earlier.skipped && toMinutes(earlier.time) >= toMinutes(stop.time));
    if (overrun) threatenedFixedStop = stop;
  });

  return { stops: shifted, offset, threatenedFixedStop };
}

/** Texte court affiché sous la barre « Heure de départ ». */
export function describeOffset(offset: number): string {
  if (offset === 0) return "Programme d'origine";
  const sign = offset > 0 ? '+' : '−';
  const abs = Math.abs(offset);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const text = h > 0 ? `${h} h${m > 0 ? ` ${String(m).padStart(2, '0')}` : ''}` : `${m} min`;
  return `${sign}${text} sur tout le programme`;
}
