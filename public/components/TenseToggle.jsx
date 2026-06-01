// TenseToggle — Keel's signature switch.
// Forward (default) is warm + alive; Back is plain + drained.
// Calm spring, not bouncy.
function TenseToggle({ tense, onChange }) {
  const forward = tense === 'forward';
  const half = (active, plain) => ({
    flex: 1, position: 'relative', zIndex: 2,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '13px 13px', cursor: 'pointer',
    color: active ? (plain ? 'var(--ink)' : 'var(--on-pine)') : 'var(--muted)',
    justifyContent: 'center', whiteSpace: 'nowrap',
  });
  return (
    <div style={{
      position: 'relative', display: 'flex',
      background: 'var(--surface-2)', borderRadius: 'var(--r-pill)',
      padding: 4, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      {/* sliding thumb — transform-based so it springs smoothly (translateX %
          transitions reliably, unlike animating left/right). Calm, slight ease-out
          overshoot — not bouncy. */}
      <div style={{
        position: 'absolute', top: 4, bottom: 4, left: 4,
        width: 'calc(50% - 4px)',
        transform: forward ? 'translateX(100%)' : 'translateX(0)',
        transition: 'transform 0.44s cubic-bezier(0.34, 1.32, 0.5, 1), background 0.4s ease',
        borderRadius: 'var(--r-pill)',
        background: forward ? 'var(--pine)' : 'var(--back-surface, #DEDED8)',
        boxShadow: forward
          ? '0 2px 8px rgba(31,77,58,0.28), inset 0 1px 0 rgba(255,255,255,0.12)'
          : '0 1px 2px rgba(0,0,0,0.10)',
      }} />
      <div style={half(!forward, true)} onClick={() => onChange('back')}>
        <IconBack size={18} />
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>Spent</span>
      </div>
      <div style={half(forward, false)} onClick={() => onChange('forward')}>
        <IconForward size={18} />
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>Spending</span>
      </div>
    </div>
  );
}
Object.assign(window, { TenseToggle });
