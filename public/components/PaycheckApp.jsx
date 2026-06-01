// PaycheckApp.jsx — shell for "Set your paycheck": nav header, scroll body,
// sticky save bar, and Tweaks. Mirrors Home so both lift into Claude Code alike.
const { useState: usePayApp } = React;

const PAY_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A",
  "history": "full",
  "loading": false
}/*EDITMODE-END*/;

function PayHeader({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
      <a href="keel-home.html" style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--hairline)',
      }}>
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2 2 9l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </a>
      <div className="serif" style={{ fontSize: 24, color: 'var(--ink)' }}>{title}</div>
    </div>
  );
}

function PayApp() {
  const [t, setTweak] = useTweaks(PAY_TWEAKS);
  const [wage, setWage] = usePayApp(SUGGESTED);
  const isDark = t.theme === 'dark';
  const hasHistory = t.history !== 'none';
  const confidence = t.history === 'thin' ? 'low' : 'high';

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{
          position: 'relative', height: '100%',
          background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        }}>
          <PayHeader title="Set your paycheck" />
          <div style={{ padding: '0 18px 6px', marginTop: -2 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--muted)' }}>
              The amount you pay yourself every month — steady, whatever your work brings in.
            </p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 18px 120px' }}>
            {t.loading
              ? <ScreenSkeleton hero={false} cards={3} />
              : <PaycheckScreen wage={wage} setWage={setWage} hasHistory={hasHistory} confidence={confidence} />}
          </div>

          {/* sticky save bar */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
            padding: '14px 18px 30px',
            background: 'linear-gradient(to top, var(--bg) 62%, transparent)',
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <button onClick={() => setWage(SUGGESTED)} disabled={!hasHistory} style={{
              background: 'none', border: 'none', cursor: hasHistory ? 'pointer' : 'default',
              color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
              opacity: hasHistory ? 1 : 0.4, whiteSpace: 'nowrap',
            }}>Reset</button>
            <button onClick={() => { window.location.href = 'keel-home.html'; }} style={{
              flex: 1, padding: '15px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
              background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
              fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
              boxShadow: '0 6px 18px rgba(31,77,58,0.28)',
            }}>{hasHistory ? 'Use this paycheck' : 'Add your first income'}</button>
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
        <TweakSection label="State" />
        <TweakSelect label="Income history" value={t.history}
          options={[{ value: 'full', label: 'Full history' }, { value: 'thin', label: 'Thin — low confidence' }, { value: 'none', label: 'None — empty' }]}
          onChange={(v) => setTweak('history', v)} />
        <TweakToggle label="Loading" value={t.loading}
          onChange={(v) => setTweak('loading', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PayApp />);
