// ImportApp.jsx — shell + step machine for the data-setup flow.
const IMPORT_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A"
}/*EDITMODE-END*/;

const TITLES = {
  choose: 'Build your picture', upload: 'Upload statements', processing: 'One moment',
  review: 'Quick review', manual: 'Enter your data', done: 'All set',
};

function ImportApp() {
  const [t, setTweak] = useTweaks(IMPORT_TWEAKS);
  const [step, setStep] = useImp('choose');
  const [months, setMonths] = useImp(['May 2026', 'Apr 2026', 'Mar 2026']);
  const [pct, setPct] = useImp(0);
  const isDark = t.theme === 'dark';

  // JS-driven progress (CSS animation is unreliable in preview)
  useImpEffect(() => {
    if (step !== 'processing') return;
    setPct(0);
    const iv = setInterval(() => setPct(p => Math.min(100, p + 7)), 80);
    return () => clearInterval(iv);
  }, [step]);
  useImpEffect(() => {
    if (step === 'processing' && pct >= 100) {
      const tm = setTimeout(() => setStep('review'), 400);
      return () => clearTimeout(tm);
    }
  }, [pct, step]);

  const addMonth = () => setMonths(m => {
    const pool = ['Feb 2026', 'Jan 2026', 'Dec 2025', 'Nov 2025', 'Oct 2025', 'Sep 2025'];
    return [...m, pool[m.length - 3] || 'Earlier'];
  });

  const back = () => {
    if (step === 'choose' || step === 'done') { window.location.href = 'keel-profile.html'; }
    else if (step === 'review') setStep('upload');
    else setStep('choose');
  };

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{ position: 'relative', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          <ImpHeader title={TITLES[step]} onBack={back} />
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '4px 18px 44px' }}>
            {step === 'choose' && <ChooseStep go={setStep} />}
            {step === 'upload' && <UploadStep months={months} addMonth={addMonth} onAnalyze={() => setStep('processing')} />}
            {step === 'processing' && <ProcessingStep pct={pct} />}
            {step === 'review' && <ReviewStep onDone={() => setStep('done')} />}
            {step === 'manual' && <ManualStep onDone={() => setStep('done')} />}
            {step === 'done' && <DoneStep />}
          </div>
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

ReactDOM.createRoot(document.getElementById('root')).render(<ImportApp />);
