/* ============================================================================
   keel-theme.js — Keel's SINGLE SOURCE OF TRUTH for look & feel.

   • Want to re-skin the whole app? Edit ONLY the values in KEEL_THEME below.
     Every screen reads these as CSS variables (var(--bg), var(--pine), …).
   • Plain .js (no JSX/Babel) so it loads first and works everywhere, incl.
     Claude Code on Windows.
   • Token names map 1:1 to SwiftUI — see KeelTheme.swift in /swift for the
     matching Color set, so a SwiftUI port is a copy-paste of these hex values.

   Token  ->  CSS var        ->  SwiftUI (KeelTheme.swift)
   bg         --bg               Keel.bg
   surface    --surface          Keel.surface
   pine       --pine             Keel.pine        (primary)
   clay       --clay             Keel.clay        (attention)
   gold       --gold             Keel.gold        (goals)
   mint       --mint             Keel.mint        (positive)
   zakat      --zakat            Keel.zakat       (zakat set-aside)
   ============================================================================ */

window.KEEL_THEME = {
  font:   { display: "'Fraunces', Georgia, serif",
            ui:      "'Hanken Grotesk', system-ui, sans-serif" },
  radius: { card: '22px', pill: '999px' },
  pad:    '18px',

  themes: {
    /* ---- Warm light — Keel's signature ---- */
    light: {
      bg: '#EBE6DA', surface: '#FBFAF5', surface2: '#F2EEE2',
      ink: '#1A201C', muted: '#6B726B', hairline: 'rgba(26,32,28,0.10)',
      pine: '#1F4D3A', pineSoft: '#E3EAE2',
      clay: '#C16A3B', claySoft: '#F2E2D4',
      gold: '#A6822F', goldSoft: '#EFE6CE',
      mint: '#2FA374', mintSoft: '#DBEEE2',
      zakat: '#2E6E6B', zakatSoft: '#DAE8E6',
      onPine: '#F4F1E6', heroBg: 'var(--pine)', heroInk: 'var(--on-pine)',
      shadow:   '0 1px 2px rgba(26,32,28,0.04), 0 10px 30px rgba(26,32,28,0.07)',
      shadowSm: '0 1px 2px rgba(26,32,28,0.05), 0 4px 14px rgba(26,32,28,0.05)',
      // "looking back" — same shell, drained of warmth
      back: { surface: '#F0F0EC', surface2: '#E7E7E2', ink: '#44473F',
              muted: '#9A9C92', hairline: 'rgba(68,71,63,0.10)' },
    },
    /* ---- Warm refined dark — option, NOT mint-on-black ---- */
    dark: {
      bg: '#141915', surface: '#1E2620', surface2: '#27302A',
      ink: '#ECE7DA', muted: '#8C948B', hairline: 'rgba(236,231,218,0.10)',
      pine: '#5AA77F', pineSoft: '#233029',
      clay: '#D98A57', claySoft: '#33271F',
      gold: '#CBA94E', goldSoft: '#302A1B',
      mint: '#4FBE92', mintSoft: '#1F2E26',
      zakat: '#56A8A2', zakatSoft: '#1C2B2A',
      onPine: '#0E1611', heroBg: '#213A2D', heroInk: '#ECE7DA',
      shadow:   '0 1px 2px rgba(0,0,0,0.4), 0 12px 34px rgba(0,0,0,0.5)',
      shadowSm: '0 1px 2px rgba(0,0,0,0.4), 0 5px 16px rgba(0,0,0,0.4)',
      back: { surface: '#1C1F1C', surface2: '#23271F', ink: '#B7B9AD',
              muted: '#6E726A', hairline: 'rgba(183,185,173,0.08)' },
    },
  },
};

/* ---- injector: turns the object above into stylesheet rules ---------------- */
(function injectKeelTheme() {
  const T = window.KEEL_THEME;
  const kebab = (s) => s.replace(/[A-Z0-9]/g, (m) => '-' + m.toLowerCase());
  const vars = (obj) => Object.entries(obj)
    .filter(([k]) => k !== 'back')
    .map(([k, v]) => `--${kebab(k)}:${v};`).join('');
  const backVars = (b) => Object.entries(b)
    .map(([k, v]) => `--back-${kebab(k)}:${v};`).join('');

  let css = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');\n`;
  css += `:root{--font-display:${T.font.display};--font-ui:${T.font.ui};--r-card:${T.radius.card};--r-pill:${T.radius.pill};--pad:${T.pad};}\n`;

  for (const [name, th] of Object.entries(T.themes)) {
    css += `.keel[data-theme="${name}"]{${vars(th)}}\n`;
    css += `.keel[data-theme="${name}"] .stage{${backVars(th.back)}}\n`;
  }
  css += `.keel .stage.back{--surface:var(--back-surface);--surface-2:var(--back-surface-2);--ink:var(--back-ink);--muted:var(--back-muted);--hairline:var(--back-hairline);}\n`;

  /* static helpers (not theme-dependent) */
  css += `
*{box-sizing:border-box;}
.keel{font-family:var(--font-ui);color:var(--ink);-webkit-font-smoothing:antialiased;}
.tnum{font-variant-numeric:tabular-nums;}
.serif{font-family:var(--font-display);font-optical-sizing:auto;}
.smallcaps{font-family:var(--font-ui);font-size:11.5px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);}
@keyframes keelRise{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
.rise{opacity:0;animation:keelRise .62s cubic-bezier(.22,.61,.36,1) forwards;}
@keyframes keelPulse{0%,100%{opacity:1;}50%{opacity:.5;}}
.sk{background:var(--surface-2);border-radius:9px;animation:keelPulse 1.4s ease-in-out infinite;}
@media (prefers-reduced-motion: reduce){.rise{animation:none;opacity:1;transform:none;}.sk{animation:none;}}
`;

  const el = document.createElement('style');
  el.id = 'keel-tokens';
  el.textContent = css;
  document.head.appendChild(el);
})();
