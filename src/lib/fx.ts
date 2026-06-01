// Placeholder FX rates — update with live rates before production
// Source: approximate rates as of 2026-06. Not financial advice.
export const FX_RATES: Record<string, number> = {
  AED: 1,
  USD: 3.6725,
  EUR: 3.97,
  GBP: 4.65,
  SAR: 0.979,
  QAR: 1.0083,
  KWD: 11.95,
  BHD: 9.75,
  OMR: 9.54,
  EGP: 0.073,
  JOD: 5.18,
};

export function toAED(amount: number, currency: string): number {
  return amount * (FX_RATES[currency] ?? 1);
}

export function formatFx(amount: number, currency: string): string {
  const rounded = Math.round(amount).toLocaleString('en-US');
  if (currency === 'AED' || currency === 'SAR' || currency === 'QAR') return `${currency} ${rounded}`;
  if (currency === 'USD') return `$${rounded}`;
  if (currency === 'EUR') return `€${rounded}`;
  if (currency === 'GBP') return `£${rounded}`;
  return `${currency} ${rounded}`;
}

export function approxAED(amount: number): string {
  return `≈ AED ${Math.round(amount).toLocaleString('en-US')}`;
}
