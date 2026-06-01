// Welcome.jsx — landing / auth + onboarding. Sign-out lands here; "Get started"
// runs the forward-looking onboarding, then hands off to data setup.
const { useState: useWel } = React;

const SLIDES = [
  {
    tag: 'Look forward',
    head: 'Other apps show what you spent. Keel shows what you\u2019ll spend.',
    body: 'Your home screen is a plan for the month ahead — not a recap of the month behind.',
    visual: 'tense',
  },
  {
    tag: 'A steady wage',
    head: 'Turn unsteady income into a paycheck you can count on.',
    body: 'Keel reads your real history and proposes one steady amount to pay yourself — with an honest buffer for lean months.',
    visual: 'steady',
  },
  {
    tag: 'See it coming',
    head: 'Know what\u2019s arriving — and set money aside before it lands.',
    body: 'Expected income and big payments on one timeline, so a quiet month never catches you out.',
    visual: 'timeline',
  },
];

function OnboardVisual({ kind }) {
  const box = { height: 200, borderRadius: 'var(--r-card)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' };
  if (kind === 'tense') {
    return (
      <div style={box}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', height: 110 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 54, height: 64, borderRadius: 12, background: 'var(--surface-2)' }} />
            <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>spent</span>
          </div>
          <svg width="34" height="22" viewBox="0 0 34 22" fill="none" style={{ marginBottom: 22 }}><path d="M2 11h26m0 0-8-8m8 8-8 8" stroke="var(--pine)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 54, height: 96, borderRadius: 12, background: 'var(--pine)' }} />
            <span style={{ fontSize: 10.5, color: 'var(--pine)', fontWeight: 700 }}>will spend</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'steady') {
    return (
      <div style={box}>
        <div style={{ width: '74%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64, marginBottom: 12, opacity: 0.5 }}>
            {[40, 70, 30, 85, 45, 60, 35, 75].map((h, i) => (
              <div key={i} style={{ flex: 1, height: h + '%', background: 'var(--surface-2)', borderRadius: 3 }} />
            ))}
          </div>
          <div style={{ height: 44, borderRadius: 12, background: 'var(--pine)', display: 'flex', alignItems: 'center', paddingLeft: 16, color: 'var(--on-pine)' }}>
            <span className="serif tnum" style={{ fontSize: 21 }}>AED 14,000</span>
            <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 5 }}>/mo steady</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={box}>
      <div style={{ width: '76%', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'var(--hairline)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {[['var(--mint)', 16], ['var(--gold)', 11], ['var(--clay)', 20], ['var(--pine)', 13]].map(([c, r], i) => (
            <div key={i} style={{ width: r * 2, height: r * 2, borderRadius: '50%', background: c, border: '3px solid var(--surface)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WelcomeApp() {
  const [t, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{ "theme": "light", "primaryTone": "#1F4D3A" }/*EDITMODE-END*/);
  const [view, setView] = useWel('welcome');   // 'welcome' | 0 | 1 | 2
  const isDark = t.theme === 'dark';
  const onboarding = typeof view === 'number';
  const s = onboarding ? SLIDES[view] : null;

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{ position: 'relative', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          {!onboarding ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 36px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 26 }}>
                  <KeelMark size={36} />
                  <span className="serif" style={{ fontSize: 30, color: 'var(--ink)', letterSpacing: 0.3 }}>Keel</span>
                </div>
                <div className="serif" style={{ fontSize: 40, lineHeight: 1.08, color: 'var(--ink)', letterSpacing: -0.5 }}>
                  Money that looks forward.
                </div>
                <p style={{ margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 300 }}>
                  A calm, honest plan for freelance income — steady pay, set before the money arrives.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => setView(0)} style={{
                  width: '100%', padding: '17px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                  background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700,
                }}>Get started</button>
                <a href="keel-home.html" style={{
                  width: '100%', padding: '15px', borderRadius: 'var(--r-pill)', textAlign: 'center',
                  textDecoration: 'none', color: 'var(--ink)', fontSize: 15, fontWeight: 600,
                }}>I already have an account</a>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '64px 24px 36px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a href="keel-onboard.html" style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', textDecoration: 'none' }}>Skip</a>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
                <OnboardVisual kind={s.visual} />
                <div>
                  <div className="smallcaps" style={{ color: 'var(--pine)', marginBottom: 10 }}>{s.tag}</div>
                  <div className="serif" style={{ fontSize: 28, lineHeight: 1.12, color: 'var(--ink)', letterSpacing: -0.3 }}>{s.head}</div>
                  <p style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--muted)' }}>{s.body}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  {SLIDES.map((_, i) => (
                    <div key={i} style={{ width: i === view ? 22 : 7, height: 7, borderRadius: 999, background: i === view ? 'var(--pine)' : 'var(--hairline)' }} />
                  ))}
                </div>
                {view < SLIDES.length - 1 ? (
                  <button onClick={() => setView(view + 1)} style={{
                    padding: '14px 26px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                    background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
                    fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 700,
                  }}>Continue</button>
                ) : (
                  <a href="keel-onboard.html" style={{
                    padding: '14px 22px', borderRadius: 'var(--r-pill)', textDecoration: 'none',
                    background: 'var(--pine)', color: 'var(--on-pine)', fontSize: 15, fontWeight: 700,
                  }}>Set up your plan</a>
                )}
              </div>
            </div>
          )}
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['light', 'dark']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Primary tone" value={t.primaryTone} options={['#1F4D3A', '#16382A', '#2E5E45']} onChange={(v) => setTweak('primaryTone', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WelcomeApp />);
