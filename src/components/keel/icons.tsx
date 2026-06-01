'use client';
// icons.tsx — Keel icons ported from icons.jsx

import React from 'react';

interface IconProps {
  size?: number;
  fill?: boolean;
  sw?: number;
  style?: React.CSSProperties;
  vb?: number;
  children?: React.ReactNode;
  d?: string;
}

export function Icon({ d, size = 24, fill = false, sw = 1.7, children, vb = 24, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      fill="none"
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {d && (
        <path
          d={d}
          stroke={fill ? 'none' : 'currentColor'}
          fill={fill ? 'currentColor' : 'none'}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {children}
    </svg>
  );
}

export const IconHome = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p} d="M4 11.5 12 5l8 6.5M6 10v9h12v-9" />
);

export const IconComing = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p} d="M5 7h14M5 12h14M5 17h9" />
);

export const IconGoal = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth={p.sw || 1.7} />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={p.sw || 1.7} />
  </Icon>
);

export const IconProfile = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth={p.sw || 1.7} />
    <path
      d="M5.5 19c0-3.3 2.9-5.5 6.5-5.5S18.5 15.7 18.5 19"
      stroke="currentColor"
      strokeWidth={p.sw || 1.7}
      strokeLinecap="round"
    />
  </Icon>
);

export const IconPlus = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p} d="M12 6v12M6 12h12" sw={p.sw || 2.2} />
);

export const IconForward = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p} d="M7 17 17 7M9 7h8v8" />
);

export const IconBack = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p} d="M4 9a8 8 0 1 1-1 6M4 5v4h4" />
);

export const IconSpark = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p} d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" sw={1.5} />
);

export const IconAfford = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p}>
    <path
      d="M11.5 3.5H20.5V12.5L12 21 3 12 11.5 3.5Z"
      stroke="currentColor"
      strokeWidth={p.sw || 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="8" r="1.5" stroke="currentColor" strokeWidth={p.sw || 1.7} />
  </Icon>
);

export const IconCalendar = (p: Omit<IconProps, 'd'>) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth={p.sw || 1.7} />
    <path
      d="M3.5 9.5H20.5M8 3.2V6.2M16 3.2V6.2"
      stroke="currentColor"
      strokeWidth={p.sw || 1.7}
      strokeLinecap="round"
    />
    <path
      d="M7.8 14l1.6 1.6 3-3.2"
      stroke="currentColor"
      strokeWidth={p.sw || 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export function KeelMark({ size = 26 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: 'var(--pine)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 16 16" fill="none">
        <path d="M2.5 5H13.5" stroke="var(--on-pine)" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M3.6 5.4Q8 14 12.4 5.4"
          stroke="var(--on-pine)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 2.4V5" stroke="var(--on-pine)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
