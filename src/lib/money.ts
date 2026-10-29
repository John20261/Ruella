import type { Currency } from '@/content/types';

/**
 * Conversion en euros pour le budget. Taux indicatif (couronne tchèque, octobre 2026) :
 * le budget est une estimation, pas une facture.
 */
export const EUR_PER: Record<Currency, number> = { EUR: 1, CZK: 1 / 24.4 };

export function toEUR(amount: number, currency: Currency): number {
  return amount * EUR_PER[currency];
}

/** « 12 € », « 1 240 € », « 7,50 € ». */
export function formatEUR(amount: number, decimals = amount < 20 && amount % 1 !== 0 ? 2 : 0): string {
  const n = decimals ? amount.toFixed(decimals) : String(Math.round(amount));
  const [int, dec] = n.split('.');
  const spaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${spaced}${dec ? `,${dec}` : ''} €`;
}

/** Montant dans la monnaie locale : « 300 CZK », « 9 € ». */
export function formatLocal(amount: number, currency: Currency): string {
  if (currency === 'EUR') return formatEUR(amount, amount % 1 ? 2 : 0);
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${currency}`;
}
