'use client';

import React from 'react';
import Link from 'next/link';
import { usePlan } from '@/lib/store';
import { TAX_REGIONS, statusOf } from '@/lib/engine';
import { Card, Disclaimer } from '@/components/keel/ui';
import { IconCalendar } from '@/components/keel/icons';
import { Dock } from '@/components/keel/Dock';
import { KEEL_OPEN_ADD, KEEL_OPEN_ASSISTANT } from '@/components/keel/GlobalOverlays';

// ── Local helpers ─────────────────────────────────────────────────────────────

function cur(n: number, ccy: string): string {
  return ccy + ' ' + Math.round(n).toLocaleString('en-US');
}

function moneyK(n: number, ccy: string): string {
  return ccy + ' ' + (n / 1000).toFixed(0) + 'k';
}

// ── Region flag emoji ─────────────────────────────────────────────────────────

const REGION_FLAG: Record<string, string> = {
  AE: '🇦🇪',
  SA: '🇸🇦',
};

// ── Threshold rules (derived from TAX_REGIONS in engine.ts) ──────────────────

interface Threshold {
  id: string;
  name: string;
  limit: number;
  clearMsg: string;
  nearMsg: string;
  overMsg: string;
  estimate: (t: number, ccy: string) => string;
}

const THRESHOLD_RULES: Record<string, Threshold[]> = {
  AE: [
    {
      id: 'vat',
      name: 'VAT registration',
      limit: 375_000,
      clearMsg: "Well under the line — nothing to do. Keel will flag it as you get close.",
      nearMsg: "Closing in on the VAT line — worth getting your paperwork ready to register.",
      overMsg: "Over the line — VAT registration is required within 30 days.",
      estimate: (t, ccy) => `≈ ${cur(t * 0.05 / 4, ccy)} of VAT to collect each quarter at 5%.`,
    },
    {
      id: 'ct',
      name: 'Corporate Tax',
      limit: 1_000_000,
      clearMsg: "Doesn't apply yet — you're under the AED 1M turnover line for sole freelancers.",
      nearMsg: "Approaching the AED 1M line where Corporate Tax starts to apply.",
      overMsg: "Now applies — register, then file 9% on profit above AED 375k.",
      estimate: (t, ccy) => `≈ ${cur(Math.max(0, (t * 0.45 - 375_000)) * 0.09, ccy)} a year, very roughly, on profit above AED 375k.`,
    },
  ],
  SA: [
    {
      id: 'vat',
      name: 'VAT registration',
      limit: 375_000,
      clearMsg: "Well under the line — nothing to do yet.",
      nearMsg: "Closing in on the VAT line — prepare to register.",
      overMsg: "Over the line — VAT registration is required.",
      estimate: (t, ccy) => `≈ ${cur(t * 0.15 / 4, ccy)} of VAT to collect each quarter at 15%.`,
    },
  ],
};

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  clear: { label: 'Not yet',  color: 'var(--muted)' },
  near:  { label: 'Heads up', color: 'var(--gold)'  },
  over:  { label: 'Now due',  color: 'var(--clay)'  },
};

// ── Turnover gauge ─────────────────────────────────────────────────────────────

interface TurnoverCardProps {
  turnover: number;
  ccy: string;
  nextLimit?: number;
  nextName?: string;
}

function TurnoverCard({ turnover, ccy, nextLimit, nextName }: TurnoverCardProps) {
  const pct = nextLimit ? Math.min(100, Math.round((turnover / nextLimit) * 100)) : 100;
  const barColor = pct >= 100 ? 'var(--clay)' : pct >= 70 ? 'var(--gold)' : 'var(--pine)';
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span className="smallcaps">Tracked turnover · last 12 months</span>
      </div>
      <div className="serif tnum" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: 1 }}>{cur(turnover, ccy)}</div>
      {nextLimit ? (
        <>
          <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', margin: '16px 0 8px' }}>
            <div style={{ width: pct + '%', height: '100%', background: barColor, borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
            <span><b style={{ color: 'var(--ink)' }}>{pct}%</b> of the {nextName} line</span>
            <span>{cur(nextLimit, ccy)}</span>
          </div>
        </>
      ) : (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
          Keel watches this against the lines that apply where you are.
        </p>
      )}
    </Card>
  );
}

// ── One obligation ─────────────────────────────────────────────────────────────

interface TaxItemProps {
  item: Threshold;
  turnover: number;
  ccy: string;
}

function TaxItem({ item, turnover, ccy }: TaxItemProps) {
  const st = statusOf(item.limit, turnover);
  const s = STATUS_STYLE[st];
  const pct = Math.min(100, Math.round((turnover / item.limit) * 100));
  const msg = st === 'over' ? item.overMsg : st === 'near' ? item.nearMsg : item.clearMsg;
  return (
    <Card style={{ opacity: st === 'clear' ? 0.92 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{item.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>over {cur(item.limit, ccy)} turnover</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: s.color,
          background: 'var(--surface-2)', padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
          {s.label}
        </span>
      </div>
      <div style={{ position: 'relative', height: 7, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', margin: '4px 0 10px' }}>
        <div style={{ width: pct + '%', height: '100%', background: s.color, borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{msg}</p>
      {st === 'over' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{item.estimate(turnover, ccy)}</div>
          <Disclaimer style={{ marginTop: 9 }} />
        </div>
      )}
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
          <span style={{
            width: 30, height: 30, borderRadius: 9, background: 'var(--zakat-soft)', color: 'var(--zakat)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontFamily: 'var(--font-display)', fontSize: 15,
          }}>Z</span>
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

export default function TaxPage() {
  const { profile, plan } = usePlan();
  const region = profile.region; // 'AE' | 'SA' | ...
  const turnover = plan.taxTurnover;
  const zakatOn = profile.zakatOn;
  const zakatableWealth = profile.zakatableWealth ?? 0;

  const taxRegion = TAX_REGIONS[region];
  const ccy = taxRegion?.currency ?? 'AED';
  const label = taxRegion?.label ?? region;
  const flag = REGION_FLAG[region] ?? '';

  const items = THRESHOLD_RULES[region] ?? [];
  const gcc = region === 'AE' || region === 'SA';
  const showZakat = zakatOn && gcc && zakatableWealth > 0;

  const surfaced = items.filter(i => statusOf(i.limit, turnover) !== 'clear');
  const nothingApplies = items.length === 0 && !showZakat;

  // gauge points at the next unmet line
  const unmet = items.filter(i => turnover < i.limit).sort((a, b) => a.limit - b.limit)[0];
  const top = items.slice().sort((a, b) => b.limit - a.limit)[0];
  const next = unmet ?? top;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
            What applies to you in {label}, and when — Keel watches the lines so you don&apos;t have to.
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 18px 100px' }}>
        {nothingApplies ? (
          <div className="rise" style={{ paddingTop: 6 }}>
            <Card style={{ textAlign: 'center', padding: '34px 22px' }}>
              <span style={{
                width: 52, height: 52, borderRadius: 16, background: 'var(--pine-soft)', color: 'var(--pine)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <IconCalendar size={26} />
              </span>
              <div className="serif" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Nothing to register here</div>
              <p style={{ margin: '0 auto', maxWidth: 250, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
                No tax lines apply in your region right now. If that changes, Keel will surface it here — early and calmly.
              </p>
            </Card>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.length > 0 && (
              <div className="rise">
                <TurnoverCard
                  turnover={turnover}
                  ccy={ccy}
                  nextLimit={next?.limit}
                  nextName={next?.name.replace(' registration', '')}
                />
              </div>
            )}

            {/* Heads-up banner when near/over */}
            {surfaced.length > 0 && (
              <div className="rise" style={{ animationDelay: '70ms' }}>
                <div style={{
                  background: 'var(--gold-soft)', borderRadius: 'var(--r-card)', padding: '15px var(--pad)',
                  display: 'flex', gap: 11, alignItems: 'flex-start',
                }}>
                  <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }}>
                    <IconCalendar size={20} />
                  </span>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
                    {surfaced.some(i => statusOf(i.limit, turnover) === 'over')
                      ? <span>A tax line needs action. Keel flagged it early so there&apos;s time to sort it calmly.</span>
                      : <span>You&apos;re approaching a tax line. Nothing&apos;s due yet — this is just an early heads-up.</span>}
                  </div>
                </div>
              </div>
            )}

            {items.map((item, i) => (
              <div key={item.id} className="rise" style={{ animationDelay: `${110 + i * 60}ms` }}>
                <TaxItem item={item} turnover={turnover} ccy={ccy} />
              </div>
            ))}

            {showZakat && (
              <div className="rise" style={{ animationDelay: `${110 + items.length * 60}ms` }}>
                <ZakatItem ccy={ccy} wealth={zakatableWealth} />
              </div>
            )}

            <p className="rise" style={{
              animationDelay: `${160 + items.length * 60}ms`,
              margin: '2px 8px 0', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', textAlign: 'center',
            }}>
              Keel surfaces a line only when it applies to you — so this stays quiet until it matters.
            </p>
          </div>
        )}
      </div>

      {/* No active tab — accessed from home */}
      <Dock
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
        onAdd={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
        onAssistant={() => window.dispatchEvent(new Event(KEEL_OPEN_ASSISTANT))}
      />
    </div>
  );
}
