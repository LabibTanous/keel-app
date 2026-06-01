// Tax.jsx — the smart, region-and-threshold-aware tax calendar.
// It is NOT a manual list: each obligation surfaces only when it applies and
// when the user's tracked turnover approaches its line. A low earner sees a
// calm "nothing yet"; someone nearing a threshold gets an early heads-up.
//
// Rules are data, keyed by region, so other regions slot in (UAE + Saudi here).
// Every figure carries the "estimate — not tax advice" note (Disclaimer).

// ── region rulebooks ───────────────────────────────────────────────────────
const TAX_REGIONS = {
  'United Arab Emirates': {
    ccy: 'AED', vatRate: '5%',
    thresholds: [
      { id: 'vat', name: 'VAT registration', basis: 'turnover', limit: 375000,
        blurb: 'Register for VAT once taxable turnover passes this line in any rolling 12 months.',
        clearMsg: "Well under the line — nothing to do. Keel will flag it as you get close.",
        nearMsg: "Closing in on the VAT line — worth getting your paperwork ready to register.",
        overMsg: "Over the line — VAT registration is required within 30 days.",
        estimate: (t, ccy) => `≈ ${cur(t * 0.05 / 4, ccy)} of VAT to collect each quarter at 5%.` },
      { id: 'ct', name: 'Corporate Tax', basis: 'turnover', limit: 1000000,
        blurb: 'As a sole freelancer, Corporate Tax only applies above AED 1M turnover — then 9% on profit over AED 375k.',
        clearMsg: "Doesn't apply yet — you're under the AED 1M turnover line for sole freelancers.",
        nearMsg: "Approaching the AED 1M line where Corporate Tax starts to apply.",
        overMsg: "Now applies — register, then file 9% on profit above AED 375k.",
        estimate: (t, ccy) => `≈ ${cur(Math.max(0, (t * 0.45 - 375000)) * 0.09, ccy)} a year, very roughly, on profit above AED 375k.` },
    ],
  },
  'Saudi Arabia': {
    ccy: 'SAR', vatRate: '15%',
    thresholds: [
      { id: 'vat', name: 'VAT registration', basis: 'turnover', limit: 375000,
        blurb: 'Register for VAT once taxable turnover passes SAR 375k in 12 months.',
        clearMsg: "Well under the line — nothing to do yet.",
        nearMsg: "Closing in on the VAT line — prepare to register.",
        overMsg: "Over the line — VAT registration is required.",
        estimate: (t, ccy) => `≈ ${cur(t * 0.15 / 4, ccy)} of VAT to collect each quarter at 15%.` },
    ],
  },
  // Regions with no applicable rules (e.g. some markets) simply have none —
  // the calendar then shows the calm "watching" state and never the entry.
  'Egypt': { ccy: 'EGP', vatRate: null, thresholds: [] },
  'Jordan': { ccy: 'JOD', vatRate: null, thresholds: [] },
};

function cur(n, ccy) { return ccy + ' ' + Math.round(n).toLocaleString('en-US'); }

// status of one threshold given current turnover
function statusOf(limit, turnover) {
  const r = turnover / limit;
  if (r >= 1) return 'over';
  if (r >= 0.7) return 'near';
  return 'clear';
}
const STATUS = {
  clear: { label: 'Not yet',  color: 'var(--muted)' },
  near:  { label: 'Heads up', color: 'var(--gold)' },
  over:  { label: 'Now due',  color: 'var(--clay)' },
};

// ── turnover gauge: the threshold-awareness, made visible ──────────────────
function TurnoverCard({ turnover, ccy, nextLimit, nextName }) {
  const pct = nextLimit ? Math.min(100, Math.round((turnover / nextLimit) * 100)) : 100;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span className="smallcaps">Tracked turnover · last 12 months</span>
      </div>
      <div className="serif tnum" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: 1 }}>{cur(turnover, ccy)}</div>
      {nextLimit ? (
        <React.Fragment>
          <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', margin: '16px 0 8px' }}>
            <div style={{ width: pct + '%', height: '100%', background: pct >= 100 ? 'var(--clay)' : pct >= 70 ? 'var(--gold)' : 'var(--pine)', borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
            <span><b style={{ color: 'var(--ink)' }}>{pct}%</b> of the {nextName} line</span>
            <span>{cur(nextLimit, ccy)}</span>
          </div>
        </React.Fragment>
      ) : (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Keel watches this against the lines that apply where you are.</p>
      )}
    </Card>
  );
}

// ── one obligation ─────────────────────────────────────────────────────────
function TaxItem({ item, turnover, ccy }) {
  const st = statusOf(item.limit, turnover);
  const s = STATUS[st];
  const pct = Math.min(100, Math.round((turnover / item.limit) * 100));
  const msg = st === 'over' ? item.overMsg : st === 'near' ? item.nearMsg : item.clearMsg;
  return (
    <Card style={{ opacity: st === 'clear' ? 0.92 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{item.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>over {cur(item.limit, ccy)} {item.basis}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: s.color, background: 'var(--surface-2)', padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />{s.label}
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

// ── Zakat (wealth-based, GCC) — calm, always-on when enabled ────────────────
function ZakatItem({ ccy }) {
  const wealth = 60000, annual = wealth * 0.025;
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
        Due once your zakatable wealth stays above the nisab for a full lunar year. Keel sets a little aside each month so it's ready.
      </p>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>≈ {cur(annual, ccy)} this year, on roughly {cur(wealth, ccy)} of wealth.</div>
        <Disclaimer style={{ marginTop: 9 }} />
      </div>
    </Card>
  );
}

// ── the screen ──────────────────────────────────────────────────────────────
function TaxScreen({ region, turnover, zakat }) {
  const rules = TAX_REGIONS[region] || { ccy: 'AED', thresholds: [] };
  const ccy = rules.ccy;
  const items = rules.thresholds || [];
  // does anything warrant surfacing? (any threshold near/over, or zakat on)
  const surfaced = items.filter(i => statusOf(i.limit, turnover) !== 'clear');
  const nothingApplies = items.length === 0 && !zakat;

  // gauge points at the next unmet line (or the top one if all passed)
  const unmet = items.filter(i => turnover < i.limit).sort((a, b) => a.limit - b.limit)[0];
  const top = items.slice().sort((a, b) => b.limit - a.limit)[0];
  const next = unmet || top;

  if (nothingApplies) {
    return (
      <div className="rise" style={{ paddingTop: 6 }}>
        <Card style={{ textAlign: 'center', padding: '34px 22px' }}>
          <span style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--pine-soft)', color: 'var(--pine)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <IconCalendar size={26} />
          </span>
          <div className="serif" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Nothing to register here</div>
          <p style={{ margin: '0 auto', maxWidth: 250, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            No tax lines apply in your region right now. If that changes, Keel will surface it here — early and calmly.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.length > 0 && (
        <div className="rise"><TurnoverCard turnover={turnover} ccy={ccy} nextLimit={next && next.limit} nextName={next && next.name.replace(' registration', '')} /></div>
      )}

      {/* a single calm heads-up when something is near/over */}
      {surfaced.length > 0 && (
        <div className="rise" style={{ animationDelay: '70ms' }}>
          <div style={{ background: 'var(--gold-soft)', borderRadius: 'var(--r-card)', padding: '15px var(--pad)', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }}><IconCalendar size={20} /></span>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
              {surfaced.some(i => statusOf(i.limit, turnover) === 'over')
                ? <span>A tax line needs action. Keel flagged it early so there's time to sort it calmly.</span>
                : <span>You're approaching a tax line. Nothing's due yet — this is just an early heads-up.</span>}
            </div>
          </div>
        </div>
      )}

      {items.map((item, i) => (
        <div key={item.id} className="rise" style={{ animationDelay: `${110 + i * 60}ms` }}>
          <TaxItem item={item} turnover={turnover} ccy={ccy} />
        </div>
      ))}

      {zakat && (
        <div className="rise" style={{ animationDelay: `${110 + items.length * 60}ms` }}>
          <ZakatItem ccy={ccy} />
        </div>
      )}

      <p className="rise" style={{ animationDelay: `${160 + items.length * 60}ms`, margin: '2px 8px 0', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', textAlign: 'center' }}>
        Keel surfaces a line only when it applies to you — so this stays quiet until it matters.
      </p>
    </div>
  );
}

// helper for other screens: is there anything worth surfacing right now?
function taxHasSurface(region, turnover, zakat) {
  const rules = TAX_REGIONS[region] || { thresholds: [] };
  const near = (rules.thresholds || []).some(i => statusOf(i.limit, turnover) !== 'clear');
  return near || !!zakat;
}

Object.assign(window, { TaxScreen, TAX_REGIONS, statusOf, taxHasSurface });
