// Profile.jsx — grouped settings. Calm, adult, no gamification.
// Switch comes from ui.jsx (loaded first).
function Group({ header, children }) {
  return (
    <div>
      <div className="smallcaps" style={{ margin: '0 6px 9px' }}>{header}</div>
      <Card style={{ padding: '2px var(--pad)' }}>{children}</Card>
    </div>
  );
}

function Chevron() {
  return <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}><path d="M1 1l6 6-6 6" stroke="var(--muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" /></svg>;
}

function Row({ label, value, href, onClick, last, danger }) {
  const tappable = href || onClick;
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', minHeight: 52,
      borderTop: last === 'first' ? 'none' : '1px solid var(--hairline)',
    }}>
      <span style={{ flex: 1, fontSize: 15.5, color: danger ? 'var(--clay)' : 'var(--ink)', fontWeight: danger ? 600 : 400 }}>{label}</span>
      {value && <span className="tnum" style={{ fontSize: 14.5, color: 'var(--muted)' }}>{value}</span>}
      {tappable && <Chevron />}
    </div>
  );
  return href
    ? <a href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>
    : <div onClick={onClick} style={{ cursor: 'pointer' }}>{inner}</div>;
}

function ToggleRow({ label, sub, on, onChange, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: last === 'first' ? 'none' : '1px solid var(--hairline)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      <Switch on={on} onClick={onChange} />
    </div>
  );
}

// ---- settings picker / confirm sheet ----
const PROFILE_SETTINGS = {
  buffer:     { title: 'Buffer target', input: true, unit: 'months', rec: '3', recLabel: '3 months', placeholder: 'e.g. 3', fmt: (v) => v + (v === '1' ? ' month' : ' months') },
  tax:        { title: 'Tax set-aside', input: true, unit: '%', rec: '9', recLabel: '9%', placeholder: 'e.g. 9', info: 'UAE corporate tax is 9% on annual profit above AED 375,000. Many freelancers fall under that line — set aside what fits your situation.', fmt: (v) => v + '%' },
  region:     { title: 'Region & currency', options: ['United Arab Emirates · AED', 'Saudi Arabia · SAR', 'Qatar · QAR', 'Kuwait · KWD', 'Bahrain · BHD', 'Oman · OMR', 'Egypt · EGP', 'Jordan · JOD'] },
  payday:     { title: 'Pay yourself on', options: ['1st of month', '15th of month', 'Last working day', 'When I get paid'] },
  appearance: { title: 'Appearance', options: ['Light', 'Dark'] },
  help:       { title: 'Help & guides', info: 'Guides, FAQs and a way to reach a human would live here.' },
  privacy:    { title: 'Privacy & data', info: 'Your data stays yours — export or delete it anytime.' },
  signout:    { title: 'Sign out of Keel?', info: 'You can log back in whenever you like.', confirm: 'Sign out', confirmHref: 'keel-welcome.html' },
};

function SettingsSheet({ sheetKey, current, onPick, onClose }) {
  const cfg = sheetKey ? PROFILE_SETTINGS[sheetKey] : null;
  const open = !!sheetKey;
  const inputRef = React.useRef(null);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,25,21,0.32)', opacity: open ? 1 : 0 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--bg)',
        borderRadius: '26px 26px 0 0', padding: '12px 18px 30px',
        transform: open ? 'translateY(0)' : 'translateY(900px)', boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--hairline)', margin: '0 auto 16px' }} />
        {cfg && (
          <div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: cfg.info ? 6 : 14 }}>{cfg.title}</div>
            {cfg.info && <p style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{cfg.info}</p>}
            {cfg.input && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 13, padding: '4px 16px', marginBottom: 12 }}>
                  <input key={sheetKey} ref={inputRef} type="number" inputMode="decimal"
                    defaultValue={current ? String(current).replace(/[^0-9.]/g, '') : ''} placeholder={cfg.placeholder}
                    style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--ink)', padding: '10px 0', width: '100%' }} />
                  <span style={{ fontSize: 15, color: 'var(--muted)' }}>{cfg.unit}</span>
                </div>
                <button onClick={() => { if (inputRef.current) inputRef.current.value = cfg.rec; }} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 16, cursor: 'pointer',
                  background: 'var(--pine-soft)', color: 'var(--pine)', border: 'none', borderRadius: 999,
                  padding: '7px 13px', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
                }}>★ Recommended · {cfg.recLabel}</button>
                <button onClick={() => onPick(cfg.fmt(String(inputRef.current && inputRef.current.value ? inputRef.current.value : cfg.rec)))} style={{
                  width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer',
                  background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
                }}>Save</button>
              </div>
            )}
            {cfg.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cfg.options.map(o => (
                  <button key={o} onClick={() => onPick(o)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                    background: o === current ? 'var(--pine-soft)' : 'var(--surface)', cursor: 'pointer',
                    border: '1px solid var(--hairline)', borderRadius: 12, padding: '14px 15px',
                    fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
                    color: o === current ? 'var(--pine)' : 'var(--ink)',
                  }}>
                    {o}
                    {o === current && <svg width="15" height="12" viewBox="0 0 14 11" fill="none"><path d="M1 6l4 4 8-9" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                ))}
              </div>
            )}
            {cfg.confirm && (
              <a href={cfg.confirmHref} style={{
                display: 'block', textAlign: 'center', padding: '15px', borderRadius: 14, textDecoration: 'none',
                background: 'var(--clay)', color: '#fff', fontSize: 15.5, fontWeight: 700, marginBottom: 8,
              }}>{cfg.confirm}</a>
            )}
            {!cfg.options && !cfg.input && (
              <button onClick={onClose} style={{
                width: '100%', padding: '14px', borderRadius: 14, cursor: 'pointer',
                background: cfg.confirm ? 'none' : 'var(--pine)', color: cfg.confirm ? 'var(--muted)' : 'var(--on-pine)',
                border: 'none', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
              }}>{cfg.confirm ? 'Cancel' : 'Close'}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileScreen({ notif, toggleNotif, theme, vals, onEdit, onNotif, gcc, zakatOn, toggleZakat }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* identity */}
      <div className="rise" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{
          width: 62, height: 62, borderRadius: '50%', flexShrink: 0,
          background: 'var(--pine)', color: 'var(--on-pine)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500,
        }}>MO</div>
        <div>
          <div className="serif" style={{ fontSize: 23, color: 'var(--ink)', lineHeight: 1.1 }}>Maya Okonkwo</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 3 }}>Freelance motion designer · steady since Jan</div>
        </div>
      </div>

      <div className="rise" style={{ animationDelay: '60ms' }}>
        <Group header="Account">
          <Row label="Name" value="Maya Okonkwo" last="first" />
          <Row label="Email" value="maya@okonkwo.studio" />
          <Row label="Bank data & import" value="2 linked" href="keel-import.html" />
        </Group>
      </div>

      <div className="rise" style={{ animationDelay: '120ms' }}>
        <Group header="Your plan">
          <Row label="Steady paycheck" value="AED 14,000/mo" href="keel-paycheck.html" last="first" />
          <Row label="Buffer target" value={vals.buffer} onClick={() => onEdit('buffer')} />
          <Row label="Tax set-aside" value={vals.tax} onClick={() => onEdit('tax')} />
          {gcc && (
            <ToggleRow
              label="Zakat set-aside"
              sub={zakatOn ? '2.5% of zakatable wealth, set aside monthly' : 'Set aside Zakat as part of your plan'}
              on={zakatOn} onChange={toggleZakat} />
          )}
        </Group>
        <Disclaimer style={{ margin: '11px 6px 0' }}>
          Tax{gcc ? ' and Zakat' : ''} figures are estimates you can refine — not tax or financial advice.
        </Disclaimer>
      </div>

      <div className="rise" style={{ animationDelay: '180ms' }}>
        <Group header="Preferences">
          <Row label="Region & currency" value={vals.region} onClick={() => onEdit('region')} last="first" />
          <Row label="Pay yourself on" value={vals.payday} onClick={() => onEdit('payday')} />
          <Row label="Appearance" value={theme === 'dark' ? 'Dark' : 'Light'} onClick={() => onEdit('appearance')} />
        </Group>
      </div>

      <div className="rise" style={{ animationDelay: '240ms' }}>
        <Group header="Notifications">
          <Row label="Manage notifications" value={Object.values(notif).filter(Boolean).length + ' on'} onClick={onNotif} last="first" />
        </Group>
      </div>

      <div className="rise" style={{ animationDelay: '300ms' }}>
        <Group header="Support">
          <Row label="Help & guides" onClick={() => onEdit('help')} last="first" />
          <Row label="Privacy & data" onClick={() => onEdit('privacy')} />
          <Row label="Sign out" danger onClick={() => onEdit('signout')} />
        </Group>
      </div>

      <div className="rise" style={{ animationDelay: '340ms', textAlign: 'center', fontSize: 12, color: 'var(--muted)', paddingBottom: 4 }}>
        Keel · v1.0 · made calm
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen, SettingsSheet, NotifSheet });

function NotifSheet({ open, notif, toggleNotif, onClose }) {
  const rows = [
    ['signals', 'Heads-up signals', "Quiet stretches & what's coming"],
    ['lean', 'Lean-month alerts', 'When income runs light'],
    ['invoice', 'Invoice reminders', "Nudge clients who're late"],
    ['goal', 'Goal milestones', null],
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,25,21,0.32)', opacity: open ? 1 : 0 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--bg)',
        borderRadius: '26px 26px 0 0', padding: '12px 18px 28px',
        transform: open ? 'translateY(0)' : 'translateY(900px)', boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--hairline)', margin: '0 auto 14px' }} />
        <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>Notifications</div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: '2px var(--pad)', marginTop: 8 }}>
          {rows.map(([k, label, sub], i) => (
            <ToggleRow key={k} label={label} sub={sub} on={notif[k]} onChange={() => toggleNotif(k)} last={i === 0 ? 'first' : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
