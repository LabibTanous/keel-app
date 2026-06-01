// AffordApp.jsx — shell for "Can I afford this?": back header, scroll body,
// and Tweaks. Mirrors PaycheckApp so both lift into Claude Code alike.
const { useState: useAffApp, useEffect: useAffAppEffect } = React;

const AFFORD_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A",
  "demo": "ask"
}/*EDITMODE-END*/;

// demo presets so each state is reviewable without typing
const AFFORD_DEMO = {
  ask:     { amount: 0,     item: '',                  loading: false },
  fits:    { amount: 2400,  item: 'a flight home',      loading: false },
  dips:    { amount: 8000,  item: 'a new camera',       loading: false },
  break:   { amount: 20000, item: 'a MacBook + lens kit', loading: false },
  loading: { amount: 8000,  item: 'a new camera',       loading: true  },
};

function AffordHeader() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
        <a href="keel-home.html" style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--hairline)',
        }}>
          <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2 2 9l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
        <div className="serif" style={{ fontSize: 24, color: 'var(--ink)' }}>Can I afford this?</div>
      </div>
      <div style={{ padding: '0 18px 6px', marginTop: -2 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--muted)' }}>
          Not "is the money in my account?" — but "does this still leave the month working?"
        </p>
      </div>
    </div>
  );
}

function AffApp() {
  const [t, setTweak] = useTweaks(AFFORD_TWEAKS);
  const [amount, setAmount] = useAffApp(AFFORD_DEMO[AFFORD_TWEAKS.demo].amount);
  const [item, setItem] = useAffApp(AFFORD_DEMO[AFFORD_TWEAKS.demo].item);
  const [loading, setLoading] = useAffApp(AFFORD_DEMO[AFFORD_TWEAKS.demo].loading);
  const isDark = t.theme === 'dark';

  // demo tweak drives the scenario; typing afterwards just overrides amount/item
  useAffAppEffect(() => {
    const d = AFFORD_DEMO[t.demo] || AFFORD_DEMO.ask;
    setAmount(d.amount); setItem(d.item); setLoading(d.loading);
  }, [t.demo]);

  // typing should clear the loading shim so the verdict can show
  const onAmount = (v) => { setAmount(v); if (loading) setLoading(false); };
  const onItem = (v) => { setItem(v); };

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{
          position: 'relative', height: '100%',
          background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        }}>
          <AffordHeader />
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 18px 40px' }}>
            <AffordScreen amount={amount} item={item} setAmount={onAmount} setItem={onItem} loading={loading} />
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
        <TweakSelect label="Show" value={t.demo}
          options={[
            { value: 'ask', label: 'Empty — ask' },
            { value: 'fits', label: 'Fits the plan' },
            { value: 'dips', label: 'Dips into buffer' },
            { value: 'break', label: 'Would break the plan' },
            { value: 'loading', label: 'Loading' },
          ]}
          onChange={(v) => setTweak('demo', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AffApp />);
