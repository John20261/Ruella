const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function parse(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

/** « Jeudi 29 octobre » */
export function dayLong(date: string): string {
  const d = parse(date);
  const s = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** « jeu. 29 » */
export function dayShort(date: string): string {
  const d = parse(date);
  return `${DAYS[d.getDay()].slice(0, 3)}. ${d.getDate()}`;
}

/** « 29 oct. → 31 oct. » */
export function range(from: string, to: string): string {
  const a = parse(from);
  const b = parse(to);
  const m = (d: Date) => MONTHS_SHORT[d.getMonth()];
  return from === to ? `${a.getDate()} ${m(a)}` : `${a.getDate()} ${m(a)} → ${b.getDate()} ${m(b)}`;
}

/** « 9 h 30 » */
export function hour(time: string): string {
  const [h, m] = time.split(':');
  return `${Number(h)} h ${m}`;
}
