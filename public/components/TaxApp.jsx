// TaxApp.jsx — shell for the smart tax calendar: back header, body, Tweaks.
const { useState: useTaxApp } = React;

const TAX_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A",
  "region": "United Arab Emirates",
  "turnover": "approaching",
  "zakat": true,
  "loading": false
}/*EDITMODE-END*/;

// tracked-turnover presets so each threshold state is reviewable
const TURNOVER = {
  'steady (under)':   176000,
  'approaching':      330000,
  'over VAT':         480000,
  'high (over CT)':   1150000,
};

function TaxHeader() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
        <a href="keel-goal.html" style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--hairline)',
        }}>
          <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2 2 9l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
        <div className="serif" style={{ fontSize: 24, color: 'var(--ink)' }}>Tax &amp; registrations</div>
      </div>
      <div style={{ padding: '0 18px 6px', marginTop: -2 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--muted)' }}>
          What applies to you, and when — Keel watches the lines so you don't have to.
        </p>
      </div>
    </div>
  );
}

function TaxAppRoot() {
  const [t, setTweak] = useTweaks(TAX_TWEAKS);
  const isDark = t.theme === 'dark';
  const turnover = TURNOVER[t.turnover] != null ? TURNOVER[t.turnover] : 330000;
  // Zakat is GCC-only — gate it the same way Profile does
  const gcc = t.region === 'United Arab Emirates' || t.region === 'Saudi Arabia';
  const zakat = t.zakat && gcc;

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{
          position: 'relative', height: '100%',
          background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        }}>
          <TaxHeader />
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 18px 40px' }}>
            {t.loading ? <ScreenSkeleton hero cards={2} /> : <TaxScreen region={t.region} turnover={turnover} zakat={zakat} />}
          </div>
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['light', 'dark']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Primary tone" value={t.primaryTone}
          options={['#1F4D3A', '#16382A', '#2E5E45']}
          onChange={(v) => setTweak('primaryTone', v)} />
        <TweakSection label="Situation" />
        <TweakSelect label="Region" value={t.region}
          options={['United Arab Emirates', 'Saudi Arabia', 'Egypt', 'Jordan']}
          onChange={(v) => setTweak('region', v)} />
        <TweakSelect label="Tracked turnover" value={t.turnover}
          options={['steady (under)', 'approaching', 'over VAT', 'high (over CT)']}
          onChange={(v) => setTweak('turnover', v)} />
        <TweakToggle label="Zakat enabled" value={t.zakat}
          onChange={(v) => setTweak('zakat', v)} />
        <TweakToggle label="Loading" value={t.loading}
          onChange={(v) => setTweak('loading', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<TaxAppRoot />);
