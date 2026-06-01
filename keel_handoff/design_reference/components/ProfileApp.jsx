// ProfileApp.jsx — shell for the You/Profile tab.
const { useState: useProfileApp } = React;

const PROFILE_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryTone": "#1F4D3A"
}/*EDITMODE-END*/;

function ProfileApp() {
  const [t, setTweak] = useTweaks(PROFILE_TWEAKS);
  const [adding, setAdding] = useProfileApp(false);
  const [notif, setNotif] = useProfileApp({ signals: true, lean: true, invoice: true, goal: false });
  const [vals, setVals] = useProfileApp({ buffer: '3 months', tax: '9%', region: 'United Arab Emirates · AED', payday: '1st of month' });
  const [zakatOn, setZakatOn] = useProfileApp(true);
  const [editing, setEditing] = useProfileApp(null);
  const [notifOpen, setNotifOpen] = useProfileApp(false);
  const [asst, setAsst] = useProfileApp(false);
  const isDark = t.theme === 'dark';
  const toggleNotif = (k) => setNotif(n => ({ ...n, [k]: !n[k] }));
  const onPick = (val) => {
    if (editing === 'appearance') setTweak('theme', val.toLowerCase());
    else setVals(v => ({ ...v, [editing]: val }));
    setEditing(null);
  };
  const current = editing === 'appearance' ? (t.theme === 'dark' ? 'Dark' : 'Light') : vals[editing];
  // Zakat is a GCC-native set-aside — the row only appears where it applies.
  const GCC = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];
  const gcc = GCC.some((c) => vals.region.startsWith(c));

  return (
    <div className="keel" data-theme={t.theme} style={{ '--pine': t.primaryTone }}>
      <IOSDevice dark={isDark}>
        <div className="stage" style={{ position: 'relative', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '64px 18px 132px' }}>
            <ProfileScreen notif={notif} toggleNotif={toggleNotif} theme={t.theme} vals={vals} onEdit={setEditing} onNotif={() => setNotifOpen(true)} gcc={gcc} zakatOn={zakatOn} toggleZakat={() => setZakatOn(z => !z)} />
          </div>

          <Dock active="profile" onAdd={() => setAdding(true)} onAssistant={() => setAsst(true)}
            links={{ home: 'keel-home.html', coming: 'keel-coming.html', goal: 'keel-goal.html' }} />
          <AddFlow open={adding} onClose={() => setAdding(false)} />
          <Assistant open={asst} onClose={() => setAsst(false)} />
          <SettingsSheet sheetKey={editing} current={current} onPick={onPick} onClose={() => setEditing(null)} />
          <NotifSheet open={notifOpen} notif={notif} toggleNotif={toggleNotif} onClose={() => setNotifOpen(false)} />
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['light', 'dark']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Primary tone" value={t.primaryTone} options={['#1F4D3A', '#16382A', '#2E5E45']} onChange={(v) => setTweak('primaryTone', v)} />
        <TweakSection label="State" />
        <TweakSelect label="Region" value={vals.region}
          options={['United Arab Emirates · AED', 'Saudi Arabia · SAR', 'Egypt · EGP', 'Jordan · JOD']}
          onChange={(v) => setVals(s => ({ ...s, region: v }))} />
        <TweakToggle label="Zakat enabled" value={zakatOn} onChange={() => setZakatOn(z => !z)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProfileApp />);
