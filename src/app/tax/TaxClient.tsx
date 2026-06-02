'use client';

import React from 'react';
import Link from 'next/link';
import { usePlan } from '@/lib/store';
import {
  TAX_REGIONS, estimateAnnualTax, statusOf,
  ASSUMED_PROFIT_MARGIN, UAE_CT_REGISTRATION_TURNOVER, UAE_CT_FREE_THRESHOLD,
} from '@/lib/engine';
import { Card, Disclaimer } from '@/components/keel/ui';
import { IconCalendar } from '@/components/keel/icons';
import { Dock } from '@/components/keel/Dock';
import { KEEL_OPEN_ADD, KEEL_OPEN_ASSISTANT } from '@/components/keel/GlobalOverlays';

// ── Local helpers ─────────────────────────────────────────────────────────────

function cur(n: number, ccy: string): string {
  return ccy + ' ' + Math.round(n).toLocaleString('en-US');
}
function approxAED(n: number): string {
  return '≈ AED ' + Math.round(n).toLocaleString('en-US');
}

const REGION_FLAG: Record<string, string> = {
  AE: '🇦🇪', SA: '🇸🇦', QA: '🇶🇦', KW: '🇰🇼', EG: '🇪🇬', JO: '🇯🇴',
};

const MARGIN_PCT = Math.round(ASSUMED_PROFIT_MARGIN * 100);

// ── Turnover gauge (UAE Corporate Tax only) ─────────────────────────────────

function TurnoverCard({ turnover, limit, name }: { turnover: number; limit: number; name: string }) {
  const pct = Math.min(100, Math.round((turnover / limit) * 100));
  const barColor = pct >= 100 ? 'var(--clay)' : pct >= 70 ? 'var(--gold)' : 'var(--pine)';
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span className="smallcaps">Tracked turnover · this year</span>
      </div>
      <div className="serif tnum" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: 1 }}>{cur(turnover, 'AED')}</div>
      <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', margin: '16px 0 8px' }}>
        <div style={{ width: pct + '%', height: '100%', background: barColor, borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
        <span><b style={{ color: 'var(--ink)' }}>{pct}%</b> of the {name} line</span>
        <span>{cur(limit, 'AED')}</span>
      </div>
    </Card>
  );
}

// ── UAE Corporate Tax card ──────────────────────────────────────────────────

function CorporateTaxCard({ turnover }: { turnover: number }) {
  const st = statusOf(UAE_CT_REGISTRATION_TURNOVER, turnover);
  const color = st === 'over' ? 'var(--clay)' : st === 'near' ? 'var(--gold)' : 'var(--muted)';
  const label = st === 'over' ? 'Now due' : st === 'near' ? 'Heads up' : 'Not yet';
  const msg = st === 'over'
    ? 'Over the AED 1M turnover line — Corporate Tax registration applies. File 9% on profit above AED 375k.'
    : st === 'near'
      ? 'Approaching the AED 1M turnover line where Corporate Tax starts to apply.'
      : "Doesn't apply yet — you're under the AED 1M turnover line for sole freelancers.";
  const annual = estimateAnnualTax(turnover, { taxMode: 'uae_ct' });
  return (
    <Card style={{ opacity: st === 'clear' ? 0.92 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Corporate Tax</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>over {cur(UAE_CT_REGISTRATION_TURNOVER, 'AED')} turnover</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color, background: 'var(--surface-2)', padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />{label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{msg}</p>
      {st === 'over' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
            {approxAED(annual)} a year, very roughly, on profit above {cur(UAE_CT_FREE_THRESHOLD, 'AED')} (assuming ~{MARGIN_PCT}% margin).
          </div>
          <Disclaimer style={{ marginTop: 9 }}>Estimate — not tax advice.</Disclaimer>
        </div>
      )}
    </Card>
  );
}

// ── Flat-rate income tax card ────────────────────────────────────────────────

function FlatTaxCard({ turnover, rate, locationLabel }: { turnover: number; rate: number; locationLabel?: string }) {
  const annual = estimateAnnualTax(turnover, { taxMode: 'flat', taxFlatRate: rate });
  const monthly = Math.round(annual / 12);
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Income tax set-aside</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
            {rate}% flat{locationLabel ? ` · ${locationLabel}` : ''}
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--gold)', background: 'var(--surface-2)', padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />Set aside
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        You told us you pay tax at {rate}%. Keel sets a little aside each month so filing season isn&apos;t a shock.
      </p>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
          {approxAED(annual)} a year ({approxAED(monthly)}/month), at {rate}% of your tracked income.
        </div>
        <Disclaimer style={{ marginTop: 9 }}>Based on the rate you set — an estimate, not tax advice.</Disclaimer>
      </div>
    </Card>
  );
}

// ── No-tax calm state ─────────────────────────────────────────────────────────

function NoTaxCard() {
  return (
    <Card style={{ textAlign: 'center', padding: '34px 22px' }}>
      <span style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--pine-soft)', color: 'var(--pine)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <IconCalendar size={26} />
      </span>
      <div className="serif" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>No tax set aside</div>
      <p style={{ margin: '0 auto', maxWidth: 270, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        You told us you don&apos;t pay income tax here, so Keel leaves it out of your plan. You can turn this on anytime in your profile.
      </p>
    </Card>
  );
}

// ── Zakat ─────────────────────────────────────────────────────────────────────

function ZakatItem({ ccy, wealth }: { ccy: string; wealth: number }) {
  const annual = wealth * 0.025;
  const monthly = Math.round(annual / 12);
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--zakat-soft)', color: 'var(--zakat)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 15 }}>Z</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Zakat</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>2.5% of wealth held a lunar year</div>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--zakat)', background: 'var(--surface-2)', padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>Set aside</span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        Due once your zakatable wealth stays above the nisab for a full lunar year. Keel sets a little aside each month so it&apos;s ready.
      </p>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
          ≈ {cur(annual, ccy)} this year ({cur(monthly, ccy)}/month), on roughly {cur(wealth, ccy)} of wealth.
        </div>
        <Disclaimer style={{ marginTop: 9 }}>Estimate — not tax or financial advice.</Disclaimer>
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function TaxClient() {
  const { profile, plan } = usePlan();
  const region = profile.region;
  const turnover = plan.taxTurnover;
  const zakatOn = profile.zakatOn;
  const zakatableWealth = profile.zakatableWealth ?? 0;

  const taxRegion = TAX_REGIONS[region];
  const ccy = taxRegion?.currency ?? 'AED';
  const label = taxRegion?.label ?? region;
  const flag = REGION_FLAG[region] ?? '';

  const taxMode = profile.taxMode ?? 'none';
  // Zakat is offered in GCC (AE/SA/QA/KW) — a religious obligation, independent of income tax.
  const gcc = region === 'AE' || region === 'SA' || region === 'QA' || region === 'KW';
  const showZakat = zakatOn && gcc && zakatableWealth > 0;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
          <Link href="/dashboard" style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--hairline)',
          }}>
            <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
              <path d="M9 2 2 9l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="serif" style={{ fontSize: 24, color: 'var(--ink)' }}>
            Tax &amp; registrations {flag && <span style={{ fontSize: 20 }}>{flag}</span>}
          </div>
        </div>
        <div style={{ padding: '0 18px 6px', marginTop: -2 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--muted)' }}>
            What you told us applies to you in {label} — Keel watches the lines so you don&apos;t have to.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 18px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {plan.interpretations.taxMeaning && (
            <div className="rise">
              <div style={{ background: 'var(--gold-soft)', borderRadius: 'var(--r-card)', padding: '14px var(--pad)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontWeight: 600, color: 'var(--gold)', marginRight: 6 }}>Tax note</span>
                {plan.interpretations.taxMeaning}
              </div>
            </div>
          )}

          {taxMode === 'uae_ct' && (
            <>
              <div className="rise"><TurnoverCard turnover={turnover} limit={UAE_CT_REGISTRATION_TURNOVER} name="Corporate Tax" /></div>
              <div className="rise" style={{ animationDelay: '60ms' }}><CorporateTaxCard turnover={turnover} /></div>
            </>
          )}

          {taxMode === 'flat' && (
            <div className="rise"><FlatTaxCard turnover={turnover} rate={profile.taxFlatRate ?? 0} locationLabel={profile.taxLocationLabel} /></div>
          )}

          {taxMode === 'none' && (
            <div className="rise" style={{ paddingTop: 6 }}><NoTaxCard /></div>
          )}

          {showZakat && (
            <div className="rise" style={{ animationDelay: '110ms' }}>
              <ZakatItem ccy={ccy} wealth={zakatableWealth} />
            </div>
          )}

          <p className="rise" style={{ animationDelay: '160ms', margin: '2px 8px 0', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', textAlign: 'center' }}>
            {taxMode === 'none'
              ? 'Nothing to file here right now. You can turn tax on anytime in your profile.'
              : 'Keel surfaces a line only when it applies to you — so this stays quiet until it matters.'}
          </p>
        </div>
      </div>

      <Dock
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
        onAdd={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
        onAssistant={() => window.dispatchEvent(new Event(KEEL_OPEN_ASSISTANT))}
      />
    </div>
  );
}
