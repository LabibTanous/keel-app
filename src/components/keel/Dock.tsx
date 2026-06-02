'use client';

/**
 * Dock.tsx — Keel bottom navigation bar.
 * TypeScript port of keel_handoff/design_reference/components/Dock.jsx.
 *
 * RESPONSIVE: fixed to viewport bottom — not absolute inside a fake phone.
 * Inner pill is max-width 480px centered. Center + button floats above.
 */

import React from 'react';
import Link from 'next/link';
import { IconHome, IconComing, IconGoal, IconSpark, IconPlus } from './icons';

type TabKey = 'home' | 'coming' | 'goal' | 'adviser';

interface DockProps {
  /** Currently active tab key. */
  active?: TabKey;
  /** Called when the center + button is tapped. */
  onAdd?: () => void;
  /** Called when the Adviser tab is tapped (if no link provided). */
  onAssistant?: () => void;
  /** Map of tab key → href for Next.js Link navigation. */
  links?: Partial<Record<TabKey, string>>;
}

type TabDef = [TabKey, string, React.ComponentType<{ size?: number; sw?: number }>];

const TABS: TabDef[] = [
  ['home',    'Home',    IconHome],
  ['coming',  'Income',  IconComing],
  ['goal',    'Goals',   IconGoal],
  ['adviser', 'Adviser', IconSpark],
];

export function Dock({ active = 'home', onAdd, onAssistant, links = {} }: DockProps): React.ReactElement {
  const left  = TABS.slice(0, 2);
  const right = TABS.slice(2);

  function renderTab([key, label, IconComp]: TabDef): React.ReactElement {
    const isActive = active === key;

    const tabStyle: React.CSSProperties = {
      background: 'none',
      border: 'none',
      cursor: links[key] ? 'pointer' : (key === 'adviser' ? 'pointer' : 'default'),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '6px 4px',
      flex: 1,
      minWidth: 0,
      textDecoration: 'none',
      color: isActive ? 'var(--pine)' : 'var(--muted)',
      fontFamily: 'var(--font-ui)',
    };

    const inner = (
      <>
        <IconComp size={23} sw={isActive ? 2 : 1.7} />
        <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, letterSpacing: 0.1 }}>{label}</span>
      </>
    );

    if (links[key]) {
      return (
        <Link key={key} href={links[key]!} style={tabStyle}>
          {inner}
        </Link>
      );
    }

    return (
      <button
        type="button"
        key={key}
        onClick={key === 'adviser' ? onAssistant : undefined}
        style={{ ...tabStyle, cursor: key === 'adviser' ? 'pointer' : 'default' }}
      >
        {inner}
      </button>
    );
  }

  return (
    /* Outer wrapper: fixed to viewport bottom, full width */
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',  // let through clicks except on the pill itself
    }}>
      {/* Inner pill — max 480px, centered */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        padding: '0 16px 14px',
        pointerEvents: 'auto',
      }}>
        {/* Pill bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface)',
          borderRadius: 'var(--r-pill)',
          boxShadow: 'var(--shadow)',
          padding: '6px 10px',
          border: '1px solid var(--hairline)',
        }}>
          {left.map(renderTab)}
          {/* spacer for center button */}
          <div style={{ width: 56, flexShrink: 0 }} />
          {right.map(renderTab)}
        </div>

        {/* Center + button — pine circle, sits above the pill */}
        <button
          type="button"
          onClick={onAdd}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 20,       // sits above pill bottom edge
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--pine)',
            color: 'var(--on-pine)',
            border: '3px solid var(--bg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(31,77,58,0.35)',
          }}
        >
          <IconPlus size={26} />
        </button>
      </div>
    </div>
  );
}
