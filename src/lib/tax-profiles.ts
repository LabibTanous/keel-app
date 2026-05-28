export interface TaxProfile {
  region: string
  flag: string
  currency: string
  currencySymbol: string
  hasIncomeTax: boolean
  hasSelfEmploymentTax: boolean
  hasVAT: boolean
  hasZakat: boolean
  reservePercent: number
  incomeRanges?: { upTo: number; rate: number }[]
  selfEmploymentRate?: number
  vatRate?: number
  vatThreshold?: number
  zakatRate?: number
  quarterlyPayments: boolean
  disclaimer: string
  breakdown: { label: string; rate: string; note?: string }[]
}

export const TAX_PROFILES: Record<string, TaxProfile> = {
  US: {
    region: "United States",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    hasIncomeTax: true,
    hasSelfEmploymentTax: true,
    hasVAT: false,
    hasZakat: false,
    reservePercent: 30,
    incomeRanges: [
      { upTo: 11600, rate: 10 },
      { upTo: 47150, rate: 12 },
      { upTo: 100525, rate: 22 },
      { upTo: 191950, rate: 24 },
      { upTo: 9999999, rate: 32 },
    ],
    selfEmploymentRate: 15.3,
    quarterlyPayments: true,
    disclaimer: "Estimate only. Rates vary by state. Consult a CPA for exact advice.",
    breakdown: [
      { label: "Federal income tax", rate: "10–32%", note: "Depends on income bracket" },
      { label: "Self-employment tax", rate: "15.3%", note: "Social Security + Medicare" },
      { label: "State income tax", rate: "0–13%", note: "Varies by state" },
    ],
  },
  GB: {
    region: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    currencySymbol: "£",
    hasIncomeTax: true,
    hasSelfEmploymentTax: true,
    hasVAT: true,
    hasZakat: false,
    reservePercent: 28,
    incomeRanges: [
      { upTo: 12570, rate: 0 },
      { upTo: 50270, rate: 20 },
      { upTo: 125140, rate: 40 },
      { upTo: 9999999, rate: 45 },
    ],
    selfEmploymentRate: 9,
    vatRate: 20,
    vatThreshold: 90000,
    quarterlyPayments: false,
    disclaimer: "Estimate only. Tax year Apr–Apr. Consult HMRC or an accountant.",
    breakdown: [
      { label: "Income tax", rate: "0–45%", note: "Personal allowance £12,570" },
      { label: "National Insurance (Class 4)", rate: "9%", note: "On profits over £12,570" },
      { label: "VAT", rate: "20%", note: "Only if turnover exceeds £90,000" },
    ],
  },
  AE: {
    region: "UAE / GCC",
    flag: "🇦🇪",
    currency: "AED",
    currencySymbol: "AED",
    hasIncomeTax: false,
    hasSelfEmploymentTax: false,
    hasVAT: true,
    hasZakat: true,
    reservePercent: 10,
    vatRate: 5,
    vatThreshold: 375000,
    zakatRate: 2.5,
    quarterlyPayments: false,
    disclaimer: "No personal income tax in UAE. VAT applies if turnover exceeds AED 375,000. Zakat is a personal religious obligation.",
    breakdown: [
      { label: "Personal income tax", rate: "0%", note: "UAE has no personal income tax" },
      { label: "VAT (if business registered)", rate: "5%", note: "Mandatory over AED 375K turnover" },
      { label: "Zakat (optional / religious)", rate: "2.5%", note: "On nisab-exceeding savings held 1 lunar year" },
      { label: "Corporate tax (if applicable)", rate: "9%", note: "On business profits over AED 375,000" },
    ],
  },
  SA: {
    region: "Saudi Arabia",
    flag: "🇸🇦",
    currency: "SAR",
    currencySymbol: "SAR",
    hasIncomeTax: false,
    hasSelfEmploymentTax: false,
    hasVAT: true,
    hasZakat: true,
    reservePercent: 18,
    vatRate: 15,
    vatThreshold: 375000,
    zakatRate: 2.5,
    quarterlyPayments: false,
    disclaimer: "No personal income tax in KSA. VAT 15% applies to businesses. Zakat is mandatory for Saudi nationals on business activity.",
    breakdown: [
      { label: "Personal income tax", rate: "0%", note: "No personal income tax" },
      { label: "VAT", rate: "15%", note: "Applies to business transactions" },
      { label: "Zakat", rate: "2.5%", note: "Mandatory on business/wealth for Saudi nationals" },
    ],
  },
  CA: {
    region: "Canada",
    flag: "🇨🇦",
    currency: "CAD",
    currencySymbol: "CAD",
    hasIncomeTax: true,
    hasSelfEmploymentTax: true,
    hasVAT: true,
    hasZakat: false,
    reservePercent: 30,
    incomeRanges: [
      { upTo: 55867, rate: 15 },
      { upTo: 111733, rate: 20.5 },
      { upTo: 154906, rate: 26 },
      { upTo: 220000, rate: 29 },
      { upTo: 9999999, rate: 33 },
    ],
    selfEmploymentRate: 9.9,
    vatRate: 5,
    vatThreshold: 30000,
    quarterlyPayments: true,
    disclaimer: "Federal rates only. Add provincial tax (6–17%). Consult a CPA.",
    breakdown: [
      { label: "Federal income tax", rate: "15–33%" },
      { label: "CPP contributions", rate: "~9.9%", note: "Self-employed pay both portions" },
      { label: "Provincial tax", rate: "6–17%", note: "Varies by province" },
      { label: "GST/HST (if registered)", rate: "5–15%", note: "Mandatory over CAD 30,000/yr" },
    ],
  },
  AU: {
    region: "Australia",
    flag: "🇦🇺",
    currency: "AUD",
    currencySymbol: "AUD",
    hasIncomeTax: true,
    hasSelfEmploymentTax: false,
    hasVAT: true,
    hasZakat: false,
    reservePercent: 27,
    incomeRanges: [
      { upTo: 18200, rate: 0 },
      { upTo: 45000, rate: 19 },
      { upTo: 120000, rate: 32.5 },
      { upTo: 180000, rate: 37 },
      { upTo: 9999999, rate: 45 },
    ],
    vatRate: 10,
    vatThreshold: 75000,
    quarterlyPayments: true,
    disclaimer: "Estimate only. Medicare levy (2%) applies. Consult an accountant.",
    breakdown: [
      { label: "Income tax", rate: "0–45%", note: "Tax-free threshold AUD 18,200" },
      { label: "Medicare levy", rate: "2%", note: "Applies to most taxpayers" },
      { label: "GST (if registered)", rate: "10%", note: "Mandatory over AUD 75,000 turnover" },
    ],
  },
  DE: {
    region: "Germany",
    flag: "🇩🇪",
    currency: "EUR",
    currencySymbol: "€",
    hasIncomeTax: true,
    hasSelfEmploymentTax: false,
    hasVAT: true,
    hasZakat: false,
    reservePercent: 35,
    vatRate: 19,
    vatThreshold: 22000,
    quarterlyPayments: true,
    disclaimer: "Estimate only. Includes solidarity surcharge. Consult a Steuerberater.",
    breakdown: [
      { label: "Income tax (Einkommensteuer)", rate: "14–45%", note: "Progressive rate" },
      { label: "Solidarity surcharge", rate: "5.5%", note: "On income tax above threshold" },
      { label: "VAT (Mehrwertsteuer)", rate: "19%", note: "Kleinunternehmer rule: exempt under €22K" },
      { label: "Health + pension (if liable)", rate: "~14–20%", note: "For Pflichtversicherung members" },
    ],
  },
  IN: {
    region: "India",
    flag: "🇮🇳",
    currency: "INR",
    currencySymbol: "₹",
    hasIncomeTax: true,
    hasSelfEmploymentTax: false,
    hasVAT: true,
    hasZakat: false,
    reservePercent: 20,
    incomeRanges: [
      { upTo: 300000, rate: 0 },
      { upTo: 700000, rate: 5 },
      { upTo: 1000000, rate: 10 },
      { upTo: 1200000, rate: 15 },
      { upTo: 1500000, rate: 20 },
      { upTo: 9999999, rate: 30 },
    ],
    vatRate: 18,
    vatThreshold: 2000000,
    quarterlyPayments: true,
    disclaimer: "New tax regime rates (FY 2024-25). Consult a CA for your specific situation.",
    breakdown: [
      { label: "Income tax", rate: "0–30%", note: "New regime, FY 2024-25" },
      { label: "GST (if registered)", rate: "18%", note: "For most services; threshold ₹20L" },
      { label: "Advance tax", rate: "Quarterly", note: "Required if liability > ₹10,000" },
    ],
  },
  PH: {
    region: "Philippines",
    flag: "🇵🇭",
    currency: "PHP",
    currencySymbol: "₱",
    hasIncomeTax: true,
    hasSelfEmploymentTax: false,
    hasVAT: true,
    hasZakat: false,
    reservePercent: 20,
    incomeRanges: [
      { upTo: 250000, rate: 0 },
      { upTo: 400000, rate: 15 },
      { upTo: 800000, rate: 20 },
      { upTo: 2000000, rate: 25 },
      { upTo: 8000000, rate: 30 },
      { upTo: 9999999, rate: 35 },
    ],
    vatRate: 12,
    vatThreshold: 3000000,
    quarterlyPayments: true,
    disclaimer: "Freelancers may opt for 8% flat tax on gross receipts over ₹250K. Consult a CPA.",
    breakdown: [
      { label: "Income tax", rate: "0–35%", note: "Or 8% flat option for freelancers" },
      { label: "VAT / Percentage tax", rate: "12% / 3%", note: "VAT if >₱3M; 3% otherwise" },
      { label: "Quarterly filing", rate: "Required", note: "BIR Form 1701Q" },
    ],
  },
}

export const REGIONS = Object.entries(TAX_PROFILES).map(([code, profile]) => ({
  code,
  label: `${profile.flag} ${profile.region}`,
  flag: profile.flag,
  region: profile.region,
}))

export function calculateReserve(
  monthlyIncome: number,
  regionCode: string,
  isMuslim?: boolean
): {
  reserveAmount: number
  reservePercent: number
  breakdown: { label: string; amount: number; percent: number }[]
} {
  const profile = TAX_PROFILES[regionCode]
  if (!profile) return { reserveAmount: 0, reservePercent: 0, breakdown: [] }

  const breakdown: { label: string; amount: number; percent: number }[] = []
  let totalPercent = 0

  if (profile.hasIncomeTax && profile.incomeRanges) {
    const annualIncome = monthlyIncome * 12
    let taxableIncome = annualIncome
    let tax = 0
    for (const range of profile.incomeRanges) {
      if (taxableIncome <= 0) break
      const slice = Math.min(taxableIncome, range.upTo - (profile.incomeRanges[profile.incomeRanges.indexOf(range) - 1]?.upTo ?? 0))
      tax += slice * (range.rate / 100)
      taxableIncome -= slice
    }
    const effectiveRate = (tax / annualIncome) * 100
    const monthlyTax = tax / 12
    breakdown.push({ label: "Income tax", amount: monthlyTax, percent: effectiveRate })
    totalPercent += effectiveRate
  }

  if (profile.hasSelfEmploymentTax && profile.selfEmploymentRate) {
    const seAmount = (monthlyIncome * profile.selfEmploymentRate) / 100
    breakdown.push({ label: "Self-employment tax", amount: seAmount, percent: profile.selfEmploymentRate })
    totalPercent += profile.selfEmploymentRate
  }

  if (profile.hasZakat && isMuslim) {
    const annualIncome = monthlyIncome * 12
    const nisab = 5000
    if (annualIncome > nisab) {
      const zakatAmount = (monthlyIncome * (profile.zakatRate ?? 2.5)) / 100
      breakdown.push({ label: "Zakat", amount: zakatAmount, percent: profile.zakatRate ?? 2.5 })
      totalPercent += profile.zakatRate ?? 2.5
    }
  }

  const reserveAmount = (monthlyIncome * Math.min(totalPercent, 45)) / 100

  return {
    reserveAmount,
    reservePercent: Math.round(Math.min(totalPercent, 45)),
    breakdown,
  }
}
