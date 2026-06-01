// OnboardApp.jsx — wizard shell + step machine. Calm, short, one decision per
// step; a slim progress bar; sticky Continue. Lands on the paycheck screen.
const { useState: useOb } = React;

const ONBOARD_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A",
  "startStep": 0
}/*EDITMODE-END*/;

const OB_STEPS = ['region', 'essentials', 'savings', 'income', 'ready'];

function OnboardApp() {
  const [t, setTweak] = useTweaks(ONBOARD_TWEAKS);
  const [i, setI] = useOb(ONBOARD_TWEAKS.startStep || 0);
  const [data, setData] = useOb({
    region: 'United Arab Emirates', ccy: 'AED',
    rent: '', bills: '', savings: '',
    incomes: [{ amt: '', ccy: 'AED', when: '' }, { amt: '', ccy: 'AED', when: '' }, { amt: '', ccy: 'AED', when: '' }],
  });
  React.useEffect(() => { setI(t.startStep || 0); }, [t.startStep]);
  const set = (patch) => setData(d => ({ ...d, ...patch }));
  const isDark = t.theme === 'dark';
  const step = OB_STEPS[i];
  const last = i === OB_STEPS.length - 1;

  const back = () => { if (i === 0) window.location.href = 'keel-welcome.html'; else setI(i - 1); };
  const next = () => { if (last) { window.location.href = 'keel-paycheck.html'; return; } setI(i + 1); };

  const StepView = { region: RegionStep, essentials: EssentialsStep, savings: SavingsStep, income: SeedIncomeStep, ready: ReadyStep }[step];
  const pct = ((i + 1) / OB_STEPS.length) * 100;

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{ position: 'relative', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          {/* header: back + progress */}
          <div style={{ padding: '60px 18px 6px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={back} style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--hairline)',
              background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2 2 9l7 7" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: 'var(--pine)', borderRadius: 999, transition: 'width 0.4s cubic-bezier(.4,1,.5,1)' }} />
              </div>
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{i + 1} / {OB_STEPS.length}</span>
          </div>

          {/* body */}
          <div key={step} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 18px 120px' }}>
            <div className="rise"><StepView data={data} set={set} /></div>
          </div>

          {/* sticky continue */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, padding: '14px 18px 30px',
            background: 'linear-gradient(to top, var(--bg) 64%, transparent)',
          }}>
            <button onClick={next} style={{
              width: '100%', padding: '16px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
              background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
              fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700,
              boxShadow: '0 6px 18px rgba(31,77,58,0.28)',
            }}>
              {last ? 'See your paycheck' : i === 3 ? 'Build my plan' : 'Continue'}
            </button>
          </div>
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['light', 'dark']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Primary tone" value={t.primaryTone} options={['#1F4D3A', '#16382A', '#2E5E45']} onChange={(v) => setTweak('primaryTone', v)} />
        <TweakSection label="Preview" />
        <TweakSelect label="Jump to step" value={String(t.startStep || 0)}
          options={[{ value: '0', label: '1 · Region' }, { value: '1', label: '2 · Essentials' }, { value: '2', label: '3 · Buffer' }, { value: '3', label: '4 · Seed income' }, { value: '4', label: '5 · Ready' }]}
          onChange={(v) => setTweak('startStep', parseInt(v, 10))} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<OnboardApp />);
