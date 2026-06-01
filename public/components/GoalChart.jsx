// GoalChart — a calm climbing trajectory. Solid line = saved so far,
// dashed = the projection to the target & projected date. Static SVG
// (no %-transition issues); the dot marks "you are here".
function GoalChart({ saved, target, projLabel, behind }) {
  const W = 320, H = 140, pad = 6;
  const lo = Math.min(saved, target) * 0.55, hi = target * 1.06;
  const yOf = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);

  // saved history (climbs to `saved`), left ~45% of width
  const hist = [0.30, 0.45, 0.58, 0.66, 0.80, 1].map((f, i, a) => ({
    x: (i / (a.length - 1)) * (W * 0.44),
    v: lo + (saved - lo) * f,
  }));
  const nowX = W * 0.44, nowY = yOf(saved);
  const endX = W - pad, endY = yOf(target);

  const histPath = hist.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${yOf(p.v).toFixed(1)}`).join(' ');
  const areaPath = `${histPath} L${nowX} ${H - pad} L0 ${H - pad} Z`;
  // gentle curved projection
  const cx = (nowX + endX) / 2;
  const projPath = `M${nowX} ${nowY} C ${cx} ${nowY}, ${cx} ${endY}, ${endX} ${endY}`;

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* target line */}
        <line x1="0" y1={yOf(target)} x2={W} y2={yOf(target)} stroke="var(--gold)" strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
        {/* saved area + line */}
        <path d={areaPath} fill="var(--pine-soft)" />
        <path d={histPath} fill="none" stroke="var(--pine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* projection */}
        <path d={projPath} fill="none" stroke={behind ? 'var(--clay)' : 'var(--pine)'} strokeWidth="2.5" strokeDasharray="3 5" strokeLinecap="round" opacity="0.85" />
        {/* you are here */}
        <circle cx={nowX} cy={nowY} r="6" fill="var(--pine)" stroke="var(--surface)" strokeWidth="3" />
        {/* target node */}
        <circle cx={endX} cy={endY} r="4.5" fill="var(--gold)" />
      </svg>
      {/* labels */}
      <div style={{ position: 'absolute', top: yOf(target) - 26, right: 0, fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>
        Target {money(target)}
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)' }}>
        <span>You are here</span>
        <span style={{ color: behind ? 'var(--clay)' : 'var(--ink)', fontWeight: 600 }}>{projLabel}</span>
      </div>
    </div>
  );
}
Object.assign(window, { GoalChart });
