import type { TaxProfile } from './engine';

export const TAX_PROFILES: Record<string, TaxProfile> = {
  AE: { region: 'AE', currency: 'AED', currencySymbol: 'AED', reservePercent: 12, hasZakat: true },
  SA: { region: 'SA', currency: 'SAR', currencySymbol: 'SAR', reservePercent: 15, hasZakat: true },
  QA: { region: 'QA', currency: 'QAR', currencySymbol: 'QAR', reservePercent: 5, hasZakat: true },
  KW: { region: 'KW', currency: 'KWD', currencySymbol: 'KWD', reservePercent: 5, hasZakat: true },
  BH: { region: 'BH', currency: 'BHD', currencySymbol: 'BHD', reservePercent: 5, hasZakat: true },
  OM: { region: 'OM', currency: 'OMR', currencySymbol: 'OMR', reservePercent: 5, hasZakat: true },
  EG: { region: 'EG', currency: 'EGP', currencySymbol: 'EGP', reservePercent: 14, hasZakat: false },
  JO: { region: 'JO', currency: 'JOD', currencySymbol: 'JOD', reservePercent: 16, hasZakat: false },
  GB: { region: 'GB', currency: 'GBP', currencySymbol: '£', reservePercent: 25, hasZakat: false },
  US: { region: 'US', currency: 'USD', currencySymbol: '$', reservePercent: 25, hasZakat: false },
};

// Disclaimer: Reserve percentages are estimates for planning purposes only.
// They are NOT tax advice. Consult a qualified accountant for your actual obligations.

export function getTaxProfile(regionCode: string): TaxProfile {
  return TAX_PROFILES[regionCode] ?? TAX_PROFILES['AE'];
}

export const REGION_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  EG: 'Egypt',
  JO: 'Jordan',
  GB: 'United Kingdom',
  US: 'United States',
};

export const GCC_REGIONS = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'];

// Legacy calculateReserve — kept so existing dashboard pages still compile
export function calculateReserve(
  _monthlyIncome: number,
  regionCode: string,
  _isMuslim?: boolean
): { reserveAmount: number; reservePercent: number; breakdown: { label: string; amount: number; percent: number }[] } {
  const profile = TAX_PROFILES[regionCode];
  if (!profile) return { reserveAmount: 0, reservePercent: 0, breakdown: [] };
  return { reserveAmount: 0, reservePercent: profile.reservePercent, breakdown: [] };
}

// Backwards-compat REGIONS list used by old onboarding pages
export const REGIONS = Object.entries(TAX_PROFILES).map(([code, profile]) => ({
  code,
  label: `${code} — ${REGION_NAMES[code] ?? code}`,
  flag: '',
  region: REGION_NAMES[code] ?? code,
  currency: profile.currency,
}));
