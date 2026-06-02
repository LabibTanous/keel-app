'use client';

import React, { useState } from 'react';
import { usePlan } from '@/lib/store';
import { Card, Disclaimer, Switch } from '@/components/keel/ui';
import { Dock } from '@/components/keel/Dock';

// ── Sub-components ─────────────────────────────────────────────────────────────

function Chevron() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
      <path d="M1 1l6 6-6 6" stroke="var(--muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

interface RowProps {
  label: string;
  value?: string;
  onClick?: () => void;
  last?: boolean;
  danger?: boolean;
}

function Row({ label, value, onClick, last, danger }: RowProps) {
  const inner = (
    <>
      <span style={{ flex: 1, fontSize: 15.5, color: danger ? 'var(--clay)' : 'var(--ink)', fontWeight: danger ? 600 : 400 }}>{label}</span>
      {value && <span className="tnum" style={{ fontSize: 14.5, color: 'var(--muted)' }}>{value}</span>}
      {onClick && <Chevron />}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', minHeight: 52,
          borderTop: last ? 'none' : '1px solid var(--hairline)',
          cursor: 'pointer', width: '100%', background: 'none', border: 'none',
          fontFamily: 'var(--font-ui)', textAlign: 'left',
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', minHeight: 52,
        borderTop: last ? 'none' : '1px solid var(--hairline)',
        cursor: 'default',
      }}
    >
      {inner}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  sub?: string;
  on: boolean;
  onChange: () => void;
  last?: boolean;
}

function ToggleRow({ label, sub, on, onChange, last }: ToggleRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0',
      borderTop: last ? 'none' : '1px solid var(--hairline)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      <Switch on={on} onClick={onChange} />
    </div>
  );
}

interface GroupProps {
  header: string;
  children: React.ReactNode;
}

function Group({ header, children }: GroupProps) {
  return (
    <div>
      <div className="smallcaps" style={{ margin: '0 6px 9px' }}>{header}</div>
      <Card style={{ padding: '2px var(--pad)' }}>{children}</Card>
    </div>
  );
}

// ── Notification sheet ─────────────────────────────────────────────────────────

interface NotifSheetProps {
  open: boolean;
  notif: Record<string, boolean>;
  toggleNotif: (k: string) => void;
  onClose: () => void;
}

function NotifSheet({ open, notif, toggleNotif, onClose }: NotifSheetProps) {
  const rows: [string, string, string | null][] = [
    ['signals', 'Heads-up signals', "Quiet stretches & what's coming"],
    ['lean',    'Lean-month alerts', 'When income runs light'],
    ['invoice', 'Invoice reminders', "Nudge clients who're late"],
    ['goal',    'Goal milestones',   null],
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, pointerEvents: open ? 'auto' : 'none' }}>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(20,25,21,0.32)', opacity: open ? 1 : 0, transition: 'opacity 0.25s', border: 'none', cursor: 'pointer', width: '100%', height: '100%', padding: 0 }}
      />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--bg)',
        borderRadius: '26px 26px 0 0', padding: '12px 18px 28px',
        transform: open ? 'translateY(0)' : 'translateY(900px)',
        transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--hairline)', margin: '0 auto 14px' }} />
        <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>Notifications</div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: '2px var(--pad)', marginTop: 8 }}>
          {rows.map(([k, label, sub], i) => (
            <ToggleRow
              key={k}
              label={label}
              sub={sub ?? undefined}
              on={!!notif[k]}
              onChange={() => toggleNotif(k)}
              last={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings sheet ─────────────────────────────────────────────────────────────

interface SheetCfg {
  title: string;
  options?: string[];
  input?: boolean;
  unit?: string;
  rec?: string;
  recLabel?: string;
  placeholder?: string;
  info?: string;
  confirm?: string;
  fmt?: (v: string) => string;
  onConfirm?: () => void;
}

interface SettingsSheetProps {
  cfg: SheetCfg | null;
  current?: string;
  onPick: (val: string) => void;
  onClose: () => void;
}

function SettingsSheet({ cfg, current, onPick, onClose }: SettingsSheetProps) {
  const open = !!cfg;
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, pointerEvents: open ? 'auto' : 'none' }}>
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(20,25,21,0.32)', opacity: open ? 1 : 0, transition: 'opacity 0.25s', border: 'none', cursor: 'pointer', width: '100%', height: '100%', padding: 0 }}
      />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--bg)',
        borderRadius: '26px 26px 0 0', padding: '12px 18px 30px',
        transform: open ? 'translateY(0)' : 'translateY(900px)',
        transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--hairline)', margin: '0 auto 16px' }} />
        {cfg && (
          <div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: cfg.info ? 6 : 14 }}>{cfg.title}</div>
            {cfg.info && <p style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{cfg.info}</p>}

            {cfg.input && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 13, padding: '4px 16px', marginBottom: 12 }}>
                  <input
                    ref={inputRef}
                    aria-label={cfg.title}
                    type="number"
                    inputMode="decimal"
                    defaultValue={current ? String(current).replace(/[^0-9.]/g, '') : ''}
                    placeholder={cfg.placeholder}
                    className="focus-ring"
                    style={{ flex: 1, border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--ink)', padding: '10px 0', width: '100%' }}
                  />
                  <span style={{ fontSize: 15, color: 'var(--muted)' }}>{cfg.unit}</span>
                </div>
                {cfg.rec && cfg.recLabel && (
                  <button
                    type="button"
                    onClick={() => { if (inputRef.current) inputRef.current.value = cfg.rec!; }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 16, cursor: 'pointer',
                      background: 'var(--pine-soft)', color: 'var(--pine)', border: 'none', borderRadius: 999,
                      padding: '7px 13px', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
                    }}
                  >★ Recommended · {cfg.recLabel}</button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const raw = inputRef.current?.value || cfg.rec || '';
                    onPick(cfg.fmt ? cfg.fmt(raw) : raw);
                  }}
                  style={{
                    width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer',
                    background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
                    fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
                  }}
                >Save</button>
              </div>
            )}

            {cfg.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cfg.options.map(o => (
                  <button
                    type="button"
                    key={o}
                    onClick={() => onPick(o)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      background: o === current ? 'var(--pine-soft)' : 'var(--surface)', cursor: 'pointer',
                      border: '1px solid var(--hairline)', borderRadius: 12, padding: '14px 15px',
                      fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
                      color: o === current ? 'var(--pine)' : 'var(--ink)',
                    }}
                  >
                    {o}
                    {o === current && (
                      <svg width="15" height="12" viewBox="0 0 14 11" fill="none">
                        <path d="M1 6l4 4 8-9" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {cfg.confirm && (
              <button
                type="button"
                onClick={() => { cfg.onConfirm?.(); onClose(); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'center', padding: '15px', borderRadius: 14,
                  background: 'var(--clay)', color: '#fff', fontSize: 15.5, fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', marginBottom: 8,
                }}
              >{cfg.confirm}</button>
            )}

            {!cfg.options && !cfg.input && !cfg.confirm && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, cursor: 'pointer',
                  background: 'var(--pine)', color: 'var(--on-pine)',
                  border: 'none', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
                }}
              >Close</button>
            )}

            {!cfg.options && !cfg.input && cfg.confirm && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, cursor: 'pointer',
                  background: 'none', color: 'var(--muted)',
                  border: 'none', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
                }}
              >Cancel</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProfileClient() {
  const { profile, plan, setProfile, reset } = usePlan();

  const [notif, setNotif] = useState({ signals: true, lean: true, invoice: true, goal: false });
  const [notifOpen, setNotifOpen] = useState(false);
  const [sheetCfg, setSheetCfg] = useState<SheetCfg | null>(null);
  const [currentVal, setCurrentVal] = useState<string | undefined>(undefined);
  const [darkMode, setDarkMode] = useState(false);

  const toggleNotif = (k: string) => setNotif(n => ({ ...n, [k]: !n[k as keyof typeof n] }));

  const gcc = profile.region === 'AE' || profile.region === 'SA';
  const regionLabel = profile.region === 'AE' ? 'UAE · AED' : profile.region === 'SA' ? 'Saudi Arabia · SAR' : profile.region;

  function openSheet(cfg: SheetCfg, cur?: string) {
    setSheetCfg(cfg);
    setCurrentVal(cur);
  }

  function onPick(val: string) {
    if (sheetCfg?.title === 'Region & currency') {
      const regionMap: Record<string, string> = {
        'UAE · AED': 'AE',
        'Saudi Arabia · SAR': 'SA',
      };
      const newRegion = regionMap[val] ?? profile.region;
      setProfile({ ...profile, region: newRegion });
    } else if (sheetCfg?.title === 'Monthly essentials') {
      const n = parseFloat(val.replace(/[^0-9.]/g, ''));
      if (!isNaN(n)) setProfile({ ...profile, essentials: n });
    } else if (sheetCfg?.title === 'Buffer target') {
      const n = parseFloat(val.replace(/[^0-9.]/g, ''));
      if (!isNaN(n)) setProfile({ ...profile, targetMonths: n });
    } else if (sheetCfg?.title === 'Appearance') {
      const isDark = val === 'Dark';
      setDarkMode(isDark);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
    setSheetCfg(null);
  }

  const onNotifCount = Object.values(notif).filter(Boolean).length;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '64px 18px 132px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Identity */}
          <div className="rise" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{
              width: 62, height: 62, borderRadius: '50%', flexShrink: 0,
              background: 'var(--pine)', color: 'var(--on-pine)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500,
            }}>K</div>
            <div>
              <div className="serif" style={{ fontSize: 23, color: 'var(--ink)', lineHeight: 1.1 }}>Your profile</div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 3 }}>
                {regionLabel} · {plan.paycheck.toLocaleString('en-US')} AED/mo paycheck
              </div>
            </div>
          </div>

          {/* Your plan */}
          <div className="rise" style={{ animationDelay: '60ms' }}>
            <Group header="Your plan">
              <Row
                label="Region & currency"
                value={regionLabel}
                onClick={() => openSheet({
                  title: 'Region & currency',
                  options: ['UAE · AED', 'Saudi Arabia · SAR'],
                }, regionLabel)}
                last
              />
              <Row
                label="Monthly essentials"
                value={`AED ${profile.essentials.toLocaleString('en-US')}`}
                onClick={() => openSheet({
                  title: 'Monthly essentials',
                  input: true, unit: 'AED', rec: String(profile.essentials), recLabel: `AED ${profile.essentials.toLocaleString('en-US')}`,
                  placeholder: 'e.g. 3000',
                  fmt: (v) => v,
                }, String(profile.essentials))}
              />
              <Row
                label="Buffer target"
                value={`${profile.targetMonths} month${profile.targetMonths !== 1 ? 's' : ''}`}
                onClick={() => openSheet({
                  title: 'Buffer target',
                  input: true, unit: 'months', rec: '3', recLabel: '3 months',
                  placeholder: 'e.g. 3',
                  fmt: (v) => v + (v === '1' ? ' month' : ' months'),
                }, String(profile.targetMonths))}
              />
              {gcc && (
                <ToggleRow
                  label="Zakat set-aside"
                  sub={profile.zakatOn ? '2.5% of zakatable wealth, set aside monthly' : 'Set aside Zakat as part of your plan'}
                  on={profile.zakatOn}
                  onChange={() => setProfile({ ...profile, zakatOn: !profile.zakatOn })}
                />
              )}
            </Group>
            <Disclaimer style={{ margin: '11px 6px 0' }}>
              Tax{gcc ? ' and Zakat' : ''} figures are estimates you can refine — not tax or financial advice.
            </Disclaimer>
          </div>

          {/* Preferences */}
          <div className="rise" style={{ animationDelay: '120ms' }}>
            <Group header="Preferences">
              <Row
                label="Appearance"
                value={darkMode ? 'Dark' : 'Light'}
                onClick={() => openSheet({
                  title: 'Appearance',
                  options: ['Light', 'Dark'],
                }, darkMode ? 'Dark' : 'Light')}
                last
              />
            </Group>
          </div>

          {/* Notifications */}
          <div className="rise" style={{ animationDelay: '180ms' }}>
            <Group header="Notifications">
              <Row
                label="Manage notifications"
                value={`${onNotifCount} on`}
                onClick={() => setNotifOpen(true)}
                last
              />
            </Group>
          </div>

          {/* Data */}
          <div className="rise" style={{ animationDelay: '240ms' }}>
            <Group header="Data">
              <Row
                label="Reset to demo"
                onClick={() => openSheet({
                  title: 'Reset to demo data?',
                  info: 'This will replace all your income history and settings with the demo data.',
                  confirm: 'Reset to demo',
                  onConfirm: () => reset(),
                })}
                last
              />
              <Row
                label="Sign out"
                danger
                onClick={() => openSheet({
                  title: 'Sign out of Keel?',
                  info: 'You can log back in whenever you like.',
                  confirm: 'Sign out',
                  onConfirm: () => {
                    import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/' }));
                  },
                })}
              />
            </Group>
          </div>

          <div className="rise" style={{ animationDelay: '300ms', textAlign: 'center', fontSize: 12, color: 'var(--muted)', paddingBottom: 4 }}>
            Keel · made calm
          </div>
        </div>
      </div>

      <Dock
        active="home"
        onAdd={() => {}}
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
      />

      <NotifSheet open={notifOpen} notif={notif} toggleNotif={toggleNotif} onClose={() => setNotifOpen(false)} />
      <SettingsSheet cfg={sheetCfg} current={currentVal} onPick={onPick} onClose={() => setSheetCfg(null)} />
    </div>
  );
}
