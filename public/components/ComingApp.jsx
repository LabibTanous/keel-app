// ComingApp.jsx — shell for "What's coming": header, timeline body, dock, Tweaks.
const { useState: useComingApp } = React;

const COMING_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A",
  "hasItems": true,
  "loading": false
}/*EDITMODE-END*/;

function ComingEmpty() {
  return (
    <div className="rise" style={{ paddingTop: 8 }}>
      <Card style={{ textAlign: 'center', padding: '34px 22px' }}>
        <div style={{
          height: 90, borderRadius: 14, marginBottom: 18,
          background: 'repeating-linear-gradient(135deg, var(--surface-2) 0 10px, transparent 10px 20px)',
          border: '1px dashed var(--hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)',
        }}>expected income</div>
        <div className="serif" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Nothing on the horizon</div>
        <p style={{ margin: '0 auto', maxWidth: 250, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          Add an invoice, a gig, or a payment you're expecting. Keel will track it — and only plan with it when you say so.
        </p>
      </Card>
    </div>
  );
}

function ComingApp() {
  const [t, setTweak] = useTweaks(COMING_TWEAKS);
  const initCounted = {};
  COMING_ITEMS.forEach(i => { initCounted[i.id] = i.counted; });
  const [counted, setCounted] = useComingApp(initCounted);
  const [received, setReceived] = useComingApp({});
  const [adding, setAdding] = useComingApp(false);
  const [asst, setAsst] = useComingApp(false);
  const isDark = t.theme === 'dark';
  const toggle = (id) => setCounted(c => ({ ...c, [id]: !c[id] }));
  const markReceived = (id) => setReceived(r => ({ ...r, [id]: true }));

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{ position: 'relative', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '60px 18px 132px' }}>
            <div style={{ textAlign: 'center', margin: '6px 0 22px' }}>
              <div className="serif" style={{ fontSize: 33, color: 'var(--ink)', lineHeight: 1.05 }}>What's coming</div>
              <p style={{ margin: '9px auto 0', maxWidth: 280, fontSize: 13.5, lineHeight: 1.45, color: 'var(--muted)' }}>
                Money you expect — track it freely, count it only when you're sure.
              </p>
            </div>
            {t.loading
              ? <ScreenSkeleton hero={false} cards={3} />
              : t.hasItems
              ? <ComingScreen counted={counted} toggle={toggle} received={received} markReceived={markReceived} />
              : <ComingEmpty />}
          </div>

          <Dock active="coming" onAdd={() => setAdding(true)} onAssistant={() => setAsst(true)} links={{ home: 'keel-home.html', coming: 'keel-coming.html', goal: 'keel-goal.html' }} />
          <AddFlow open={adding} onClose={() => setAdding(false)} />
          <Assistant open={asst} onClose={() => setAsst(false)} />
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['light', 'dark']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Primary tone" value={t.primaryTone} options={['#1F4D3A', '#16382A', '#2E5E45']} onChange={(v) => setTweak('primaryTone', v)} />
        <TweakSection label="State" />
        <TweakToggle label="Has expected income" value={t.hasItems} onChange={(v) => setTweak('hasItems', v)} />
        <TweakToggle label="Loading" value={t.loading} onChange={(v) => setTweak('loading', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ComingApp />);
