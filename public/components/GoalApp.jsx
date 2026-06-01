// GoalApp.jsx — shell for the Goal tab: header, body, dock, Tweaks.
const { useState: useGoalApp } = React;

const GOAL_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A",
  "progress": "on track",
  "hasGoal": true,
  "taxStatus": "approaching",
  "loading": false
}/*EDITMODE-END*/;

function GoalApp() {
  const [t, setTweak] = useTweaks(GOAL_TWEAKS);
  const [adding, setAdding] = useGoalApp(false);
  const [asst, setAsst] = useGoalApp(false);
  const isDark = t.theme === 'dark';
  const behind = t.progress === 'behind';

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{ position: 'relative', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '60px 18px 132px' }}>
            <div style={{ textAlign: 'center', margin: '6px 0 22px' }}>
              <div className="serif" style={{ fontSize: 33, color: 'var(--ink)', lineHeight: 1.05 }}>Saving</div>
              <p style={{ margin: '9px auto 0', maxWidth: 280, fontSize: 13.5, lineHeight: 1.45, color: 'var(--muted)' }}>
                What you're climbing toward — and the big costs on the way.
              </p>
            </div>
            {t.loading ? <ScreenSkeleton hero cards={2} /> : t.hasGoal ? <GoalScreen behind={behind} taxStatus={t.taxStatus} /> : <GoalEmpty />}
          </div>

          <Dock active="goal" onAdd={() => setAdding(true)} onAssistant={() => setAsst(true)}
            links={{ home: 'keel-home.html', coming: 'keel-coming.html', goal: 'keel-goal.html' }} />
          <AddFlow open={adding} onClose={() => setAdding(false)} />
          <Assistant open={asst} onClose={() => setAsst(false)} />
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['light', 'dark']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Primary tone" value={t.primaryTone} options={['#1F4D3A', '#16382A', '#2E5E45']} onChange={(v) => setTweak('primaryTone', v)} />
        <TweakSection label="State" />
        <TweakRadio label="Progress" value={t.progress} options={['on track', 'behind']} onChange={(v) => setTweak('progress', v)} />
        <TweakToggle label="Has a goal" value={t.hasGoal} onChange={(v) => setTweak('hasGoal', v)} />
        <TweakToggle label="Loading" value={t.loading} onChange={(v) => setTweak('loading', v)} />
        <TweakSelect label="Tax heads-up" value={t.taxStatus}
          options={['none', 'clear', 'approaching', 'due']}
          onChange={(v) => setTweak('taxStatus', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<GoalApp />);
