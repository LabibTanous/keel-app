'use client';

/**
 * GoalChart.tsx — Calm climbing trajectory chart.
 * TypeScript port of keel_handoff/design_reference/components/GoalChart.jsx.
 *
 * Pure SVG, W=320 H=140 via viewBox (renders at 100% width).
 * Exact algorithm preserved from GoalChart.jsx.
 */

import React from 'react';
import { money } from './ui';

interface GoalChartProps {
  /** Amount saved so far (AED). */
  saved: number;
  /** Target amount (AED). */
  target: number;
  /** Projected completion label e.g. "Mar 2026". */
  projLabel: string;
  /** True when projection is behind schedule (draws clay instead of pine). */
  behind?: boolean;
}

export function GoalChart({ saved, target, projLabel, behind = false }: GoalChartProps): React.ReactElement {
  const W = 320, H = 140, pad = 6;

  // Domain bounds — exact algorithm from source
  const lo = Math.min(saved, target) * 0.55;
  const hi = target * 1.06;

  const yOf = (v: number): number =>
    H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);

  // History line: 6 fractions from lo → saved, occupying left 44% of width
  const histFractions = [0.30, 0.45, 0.58, 0.66, 0.80, 1] as const;
  const hist = histFractions.map((f, i, a) => ({
    x: (i / (a.length - 1)) * (W * 0.44),
    v: lo + (saved - lo) * f,
  }));

  const nowX = W * 0.44;
  const nowY = yOf(saved);
  const endX = W - pad;
  const endY = yOf(target);

  // Path strings
  const histPath = hist
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${yOf(p.v).toFixed(1)}`)
    .join(' ');

  const areaPath = `${histPath} L${nowX} ${H - pad} L0 ${H - pad} Z`;

  // Gentle cubic-bezier projection from nowX → endX
  const cx = (nowX + endX) / 2;
  const projPath = `M${nowX} ${nowY} C ${cx} ${nowY}, ${cx} ${endY}, ${endX} ${endY}`;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Target line — gold dashed */}
        <line
          x1="0" y1={yOf(target)}
          x2={W} y2={yOf(target)}
          stroke="var(--gold)" strokeWidth="1" strokeDasharray="2 4" opacity="0.7"
        />

        {/* Saved area fill */}
        <path d={areaPath} fill="var(--pine-soft)" />

        {/* Solid history line */}
        <path
          d={histPath}
          fill="none"
          stroke="var(--pine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dashed projection */}
        <path
          d={projPath}
          fill="none"
          stroke={behind ? 'var(--clay)' : 'var(--pine)'}
          strokeWidth="2.5"
          strokeDasharray="3 5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* "You are here" dot */}
        <circle cx={nowX} cy={nowY} r="6" fill="var(--pine)" stroke="var(--surface)" strokeWidth="3" />

        {/* Target node */}
        <circle cx={endX} cy={endY} r="4.5" fill="var(--gold)" />
      </svg>

      {/* Target label — positioned above the gold line on the right */}
      <div style={{
        position: 'absolute',
        top: yOf(target) - 26,
        right: 0,
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--gold)',
      }}>
        Target {money(target)}
      </div>

      {/* Footer labels */}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)' }}>
        <span>You are here</span>
        <span style={{ color: behind ? 'var(--clay)' : 'var(--ink)', fontWeight: 600 }}>{projLabel}</span>
      </div>
    </div>
  );
}
