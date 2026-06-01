// ui.jsx — shared primitives used across every Keel screen.
// Kept tiny and dependency-free so screens compose from the same parts.
const money  = (n) => 'AED ' + Math.round(n).toLocaleString('en-US');
const moneyK = (n) => 'AED ' + (n / 1000).toFixed(1).replace('.0', '') + 'k';
const amt    = (n) => Math.round(n).toLocaleString('en-US');  // bare figure, no currency

// ── multi-currency ─────────────────────────────────────────────────────────
// Freelancers here get paid by foreign clients. Items carry their own currency;
// the plan is always shown in the home currency (AED) with converted figures
// VISIBLY marked approximate ("≈ AED 9,000") — never as if exact.
const CCY = {
  AED: { sym: 'AED', code: 'AED', rate: 1 },
  USD: { sym: '$',   code: 'USD', rate: 3.6725 },
  EUR: { sym: '€',   code: 'EUR', rate: 3.95 },
  GBP: { sym: '£',   code: 'GBP', rate: 4.62 },
  SAR: { sym: 'SAR', code: 'SAR', rate: 0.979 },
};
const toAED = (n, ccy) => (n * (CCY[ccy] ? CCY[ccy].rate : 1));
// native-currency formatting: "$2,450", "€600", "AED 5,500"
const fmtFx = (n, ccy) => {
  const c = CCY[ccy] || CCY.AED;
  const v = Math.round(n).toLocaleString('en-US');
  return (ccy === 'AED' || ccy === 'SAR') ? `${c.sym} ${v}` : `${c.sym}${v}`;
};
// "≈ AED 9,000" — the approximate marker, used everywhere a foreign figure is converted
const approxAED = (n) => '≈ AED ' + Math.round(n).toLocaleString('en-US');

// Big upcoming payments (outflows) — shared so the forward Home and the Saving
// screen read from one source. `pos` is the timeline position used on Goal.
const BIG_PAYMENTS = [
  { id: 'tax', m: 'Jul', pos: 0.13, name: 'Quarterly taxes',  amt: 10500, status: 'set'    },
  { id: 'sw',  m: 'Sep', pos: 0.42, name: 'Annual software',  amt: 2000,  status: 'saving' },
  { id: 'ins', m: 'Nov', pos: 0.70, name: 'Health insurance', amt: 4800,  status: 'saving' },
  { id: 'lap', m: 'Dec', pos: 0.87, name: 'New laptop',       amt: 9000,  status: 'soon'   },
];
const PAY_STATUS = {
  set:    { label: 'Set aside',  color: 'var(--mint)' },
  saving: { label: 'Saving',     color: 'var(--gold)' },
  soon:   { label: 'Not yet',    color: 'var(--clay)' },
};

// Quiet, tasteful disclaimer — present but unobtrusive. Used wherever tax/Zakat
// estimates or converted (FX) figures appear.
function Disclaimer({ children, style }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)', ...style }}>
      <svg width="13" height="13" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1.5, opacity: 0.6 }}>
        <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
      </svg>
      <span>{children || 'Estimate — not tax or financial advice.'}</span>
    </div>
  );
}

// ── skeletons — calm loading state, shared across screens ───────────────────
function Sk({ w = '100%', h = 13, r = 8, mb = 0, style }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, marginBottom: mb, ...style }} />;
}
// a Card-shaped skeleton: optional big number, then a few lines
function SkCard({ big = false, lines = 3, style }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: 'var(--pad)', ...style }}>
      <Sk w={96} h={11} mb={big ? 16 : 14} />
      {big && <Sk w={170} h={34} r={10} mb={18} />}
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} w={i === lines - 1 ? '70%' : '100%'} mb={i === lines - 1 ? 0 : 10} />
      ))}
    </div>
  );
}
// a column of skeleton cards — drop in while a screen is mid-fetch
function ScreenSkeleton({ hero = true, cards = 2 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {hero && (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: '22px var(--pad) 24px' }}>
          <Sk w={80} h={11} mb={14} /><Sk w={200} h={40} r={12} mb={16} /><Sk w="55%" />
        </div>
      )}
      {Array.from({ length: cards }).map((_, i) => <SkCard key={i} lines={i === 0 ? 4 : 3} />)}
    </div>
  );
}

// Big-figure currency: renders "AED" smaller than the amount. Drop inside any
// sized text span (uses em units so it scales to the parent font-size).
function Cur({ n }) {
  return (
    <React.Fragment>
      <span style={{ fontSize: '0.5em', fontWeight: 400, opacity: 0.6, marginRight: '0.16em', letterSpacing: 0 }}>AED</span>{amt(n)}
    </React.Fragment>
  );
}

function Card({ children, style, tint, className = '' }) {
  return (
    <div className={className} style={{
      background: tint || 'var(--surface)',
      borderRadius: 'var(--r-card)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--pad)',
      ...style,
    }}>{children}</div>
  );
}

// Segmented control — quiet, pill-shaped. Thumb positioned by left% (robust).
function Segmented({ options, value, onChange }) {
  const n = options.length;
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  return (
    <div style={{
      position: 'relative', display: 'flex',
      background: 'var(--surface-2)', borderRadius: 'var(--r-pill)', padding: 4,
    }}>
      <div style={{
        position: 'absolute', top: 4, bottom: 4,
        left: `calc(${(idx * 100) / n}% + 4px)`,
        width: `calc(${100 / n}% - 8px)`,
        background: 'var(--surface)', borderRadius: 'var(--r-pill)',
        boxShadow: 'var(--shadow-sm)',
      }} />
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, position: 'relative', zIndex: 2, background: 'none', border: 'none',
          cursor: 'pointer', padding: '8px 6px', fontFamily: 'var(--font-ui)',
          fontSize: 13.5, fontWeight: 600,
          color: o.value === value ? 'var(--ink)' : 'var(--muted)',
          transition: 'color 0.3s ease',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

Object.assign(window, { money, moneyK, amt, Cur, Card, Segmented, Switch, CCY, toAED, fmtFx, approxAED, Disclaimer, BIG_PAYMENTS, PAY_STATUS, Sk, SkCard, ScreenSkeleton });

// Pill switch — pixel translate (percentage transitions freeze in this env).
function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: on ? 'var(--pine)' : 'var(--surface-2)', position: 'relative',
      boxShadow: on ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: 3, width: 21, height: 21, borderRadius: '50%',
        background: on ? 'var(--on-pine)' : 'var(--surface)', boxShadow: 'var(--shadow-sm)',
        transform: on ? 'translateX(19px)' : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.5,1.3,0.5,1)',
      }} />
    </button>
  );
}
