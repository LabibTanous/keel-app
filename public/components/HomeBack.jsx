// HomeBack — the rear-view. Deliberately plain: the ordinary thing every
// other app does. Flat, gray, sans-serif numbers, no warmth. The contrast
// is the point — but it's the same shell, not a different app.
function HomeBack() {
  const cats = [
    ['Rent', 1650], ['Groceries', 410], ['Eating out', 260],
    ['Transport', 120], ['Subscriptions', 95], ['Everything else', 885],
  ];
  const total = cats.reduce((s, c) => s + c[1], 0);
  const max = Math.max(...cats.map(c => c[1]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="rise" style={{
        background: 'var(--surface)', borderRadius: 12, padding: '18px var(--pad)',
        border: '1px solid var(--hairline)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: 0.02 }}>You spent — May</div>
        <div className="tnum" style={{ fontSize: 38, fontWeight: 700, color: 'var(--ink)', marginTop: 4, letterSpacing: -0.5 }}>
          {money(total)}
        </div>
      </div>
      <div className="rise" style={{
        animationDelay: '70ms',
        background: 'var(--surface)', borderRadius: 12, padding: '6px var(--pad) 14px',
        border: '1px solid var(--hairline)',
      }}>
        {cats.map(([n, v], i) => (
          <div key={n} style={{ padding: '11px 0', borderBottom: i < cats.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13.5, color: 'var(--ink)' }}>
              <span>{n}</span>
              <span className="tnum" style={{ color: 'var(--muted)' }}>{money(v)}</span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(v/max)*100}%`, height: '100%', background: 'var(--muted)', opacity: 0.5, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
      <p className="rise" style={{ animationDelay: '140ms', margin: '4px 6px 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
        That's what already happened. Keel is built for what's next —
        <span style={{ color: 'var(--ink)' }}> swing back to looking forward.</span>
      </p>
    </div>
  );
}
Object.assign(window, { HomeBack });
