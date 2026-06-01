// Home.jsx — Keel home/dashboard. Wires tense + theme + outlook, and the
// Tweaks panel. Kept declarative so it lifts cleanly into Claude Code.
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "opensOn": "forward",
  "outlook": "on track",
  "primaryTone": "#1F4D3A",
  "zakat": true,
  "loading": false,
  "hasPlan": true,
  "calmReveal": true
}/*EDITMODE-END*/;

const OUTLOOK = {
  'running lean': {
    label: 'Running lean', dot: 'var(--clay)', track: 'var(--clay)', tracking: 11000,
    tone: 'warn', accent: 'var(--clay)', soft: 'var(--clay-soft)', lead: 'Heads up',
    signal: <span>Income's light so far — but your buffer keeps the plan whole. <b>Nothing needs to change yet.</b></span>,
  },
  'on track': {
    label: 'On track', dot: 'var(--mint)', track: 'var(--mint)', tracking: 15000,
    tone: 'calm', accent: 'var(--mint)', soft: 'var(--surface)', lead: 'Looking ahead',
    signal: <span>A quieter fortnight ahead — only <b>one invoice</b> expected. Your buffer covers the gap, so the plan holds.</span>,
  },
  'strong': {
    label: 'Strong month', dot: 'var(--gold)', track: 'var(--gold)', tracking: 21000,
    tone: 'good', accent: 'var(--gold)', soft: 'var(--gold-soft)', lead: 'Good news',
    signal: <span>Ahead of plan. The extra tops up your <b>runway buffer</b> first — next month starts steadier.</span>,
  },
};

// new user, no plan yet — warm, points straight at setup
function HomeEmpty() {
  return (
    <div className="rise" style={{ paddingTop: 4 }}>
      <div style={{
        background: 'var(--hero-bg)', color: 'var(--hero-ink)', borderRadius: 'var(--r-card)',
        padding: '24px var(--pad)', boxShadow: 'var(--shadow)', marginBottom: 14,
      }}>
        <div className="serif" style={{ fontSize: 26, lineHeight: 1.12, letterSpacing: -0.3 }}>Let's build your plan.</div>
        <p style={{ margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.55, opacity: 0.85 }}>
          A few minutes sets your steady paycheck, your honest range and what's coming — the whole forward picture.
        </p>
        <a href="keel-onboard.html" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 18,
          background: 'var(--on-pine)', color: 'var(--pine)', textDecoration: 'none',
          padding: '12px 18px', borderRadius: 'var(--r-pill)', fontSize: 14.5, fontWeight: 700,
        }}>Set up your plan <IconForward size={15} /></a>
      </div>
      <Card>
        <div className="smallcaps" style={{ marginBottom: 12 }}>What you'll get</div>
        {[['A steady paycheck', 'One amount to pay yourself, whatever the month brings'],
          ['An honest range', 'Lean / likely / strong — income as it really is'],
          ["What's coming", 'Expected income and big payments on one timeline']].map(([h, s], i) => (
          <div key={h} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '10px 0', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pine)', marginTop: 6, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{h}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{s}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function StatusPill({ outlook }) {  const o = OUTLOOK[outlook];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: 'var(--surface)', borderRadius: 'var(--r-pill)',
      padding: '7px 13px 7px 11px', boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--hairline)', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.dot }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{o.label}</span>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tense, setTense] = useState(t.opensOn);
  const [adding, setAdding] = useState(false);
  const [asst, setAsst] = useState(false);
  useEffect(() => { setTense(t.opensOn); }, [t.opensOn]);

  const isDark = t.theme === 'dark';
  const back = tense === 'back';
  const o = OUTLOOK[t.outlook] || OUTLOOK['on track'];

  const data = {
    lean: 9000, likely: 16000, strong: 23000, paycheck: 14000,
    tracking: o.tracking, trackColor: o.track,
    signal: { text: o.signal, lead: o.lead, label: o.label, tone: o.tone, accent: o.accent, soft: o.soft },
    zakat: t.zakat,
  };

  const reveal = t.calmReveal;

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className={'stage' + (back ? ' back' : '')} style={{
          position: 'relative', height: '100%',
          background: 'var(--bg)', display: 'flex', flexDirection: 'column',
          transition: 'background 0.5s ease',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '60px 18px 132px' }}>
            {/* slim identity row — wordmark + at-a-glance status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, minHeight: 34 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <a href="keel-profile.html" aria-label="Your profile" style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--pine)', color: 'var(--on-pine)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0,
                  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: 0.3,
                }}>MO</a>
                <span className="serif" style={{ fontSize: 21, color: 'var(--ink)', letterSpacing: 0.2 }}>Keel</span>
              </span>
              {t.hasPlan && !back && <StatusPill outlook={t.outlook} />}
            </div>

            {/* signature toggle */}
            {t.hasPlan && (
              <div style={{ marginBottom: 18 }}>
                <TenseToggle tense={tense} onChange={setTense} />
              </div>
            )}

            {/* content */}
            {!t.hasPlan ? (
              <HomeEmpty />
            ) : t.loading ? (
              <ScreenSkeleton hero cards={2} />
            ) : (
              <div key={(reveal ? 'r-' : 'n-') + tense} style={reveal ? undefined : { animation: 'none' }}>
                <NoReveal off={!reveal}>
                  {back ? <HomeBack /> : <HomeForward data={data} />}
                </NoReveal>
              </div>
            )}
          </div>

          <Dock active="home" onAdd={() => setAdding(true)} onAssistant={() => setAsst(true)} links={{ home: 'keel-home.html', coming: 'keel-coming.html', goal: 'keel-goal.html' }} />
          <AddFlow open={adding} onClose={() => setAdding(false)} />
          <Assistant open={asst} onClose={() => setAsst(false)} />
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['light', 'dark']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Primary tone" value={t.primaryTone}
          options={['#1F4D3A', '#16382A', '#2E5E45']}
          onChange={(v) => setTweak('primaryTone', v)} />
        <TweakSection label="Home" />
        <TweakRadio label="Opens on" value={t.opensOn} options={['forward', 'back']}
          onChange={(v) => setTweak('opensOn', v)} />
        <TweakSelect label="Month outlook" value={t.outlook}
          options={['running lean', 'on track', 'strong']}
          onChange={(v) => setTweak('outlook', v)} />
        <TweakToggle label="Zakat set-aside" value={t.zakat}
          onChange={(v) => setTweak('zakat', v)} />
        <TweakSection label="State" />
        <TweakToggle label="Has a plan" value={t.hasPlan}
          onChange={(v) => setTweak('hasPlan', v)} />
        <TweakToggle label="Loading" value={t.loading}
          onChange={(v) => setTweak('loading', v)} />
        <TweakToggle label="Calm reveal" value={t.calmReveal}
          onChange={(v) => setTweak('calmReveal', v)} />
      </TweaksPanel>
    </div>
  );
}

// disables the .rise animation when calm reveal is off
function NoReveal({ off, children }) {
  if (!off) return children;
  return <div style={{ }} ref={(el) => {
    if (el) el.querySelectorAll('.rise').forEach(n => { n.style.animation = 'none'; n.style.opacity = 1; });
  }}>{children}</div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
