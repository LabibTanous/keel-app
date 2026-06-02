'use client';

/**
 * PaycheckChart.tsx — Actual income, last N months.
 * TypeScript port of keel_handoff/design_reference/components/PaycheckChart.jsx.
 *
 * Bars: clay if below wage, pine if above.
 * Dashed wage line moves with slider.
 */

import React, { useState } from 'react';
import { money } from './ui';

export interface HistoryEntry {
  m: string;
  v: number;
}

interface PaycheckChartProps {
  history: HistoryEntry[];
  wage: number;
  domainMax: number;
  underCount: number;
  months: number;
  setMonths?: (n: number) => void;
  maxMonths: number;
}

export function PaycheckChart({
  history,
  wage,
  domainMax,
  underCount,
  months,
  setMonths,
  maxMonths,
}: PaycheckChartProps): React.ReactElement {
  const H = 132;
  const linePct = (wage / domainMax) * 100;
  const [open, setOpen] = useState(false);
  const opts = ([3, 6, 9, 12] as number[]).filter((m) => m <= maxMonths);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="smallcaps">Your income</span>
        {setMonths && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'var(--surface-2)', border: 'none', borderRadius: 999, padding: '6px 12px',
                fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)',
              }}
            >
              Last {months} mo
              <svg
                width="9" height="6" viewBox="0 0 9 6" fill="none"
                style={{ transform: open ? 'rotate(180deg)' : 'none' }}
              >
                <path d="M1 1l3.5 3.5L8 1" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20, minWidth: 132,
                background: 'var(--surface)', borderRadius: 13, boxShadow: 'var(--shadow)',
                border: '1px solid var(--hairline)', padding: 4,
              }}>
                {opts.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => { setMonths(m); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      background: months === m ? 'var(--pine-soft)' : 'transparent', border: 'none', cursor: 'pointer',
                      borderRadius: 9, padding: '8px 11px', fontFamily: 'var(--font-ui)', fontSize: 13,
                      fontWeight: 600, color: months === m ? 'var(--pine)' : 'var(--ink)',
                    }}
                  >
                    {m} months
                    {months === m && (
                      <svg width="12" height="10" viewBox="0 0 14 11" fill="none">
                        <path d="M1 6l4 4 8-9" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', height: H }}>
        {/* wage line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: `${linePct}%`,
          borderTop: '2px dashed var(--pine)', transition: 'bottom 0.18s ease-out', zIndex: 2,
        }}>
          <span
            className="tnum"
            style={{
              position: 'absolute', right: 0, top: -9,
              background: 'var(--pine)', color: 'var(--on-pine)',
              fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap',
            }}
          >
            {money(wage)}
          </span>
        </div>

        {/* bars */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 7 }}>
          {history.map((d) => {
            const under = d.v < wage;
            return (
              <div
                key={d.m}
                style={{
                  flex: 1,
                  height: `${(d.v / domainMax) * 100}%`,
                  background: under ? 'var(--clay)' : 'var(--pine)',
                  opacity: under ? 0.85 : 1,
                  borderRadius: '5px 5px 3px 3px',
                  transition: 'background 0.2s ease',
                  minHeight: 4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* month labels */}
      <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
        {history.map((d) => (
          <div
            key={d.m}
            style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: 'var(--muted)', letterSpacing: 0.2 }}
          >
            {d.m}
          </div>
        ))}
      </div>

      <p style={{ margin: '15px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
        <b style={{ color: 'var(--clay)' }}>{underCount} of {history.length}</b> months came in under this paycheck —
        that&apos;s when your <span style={{ color: 'var(--ink)' }}>buffer</span> carries you.
      </p>
    </div>
  );
}
