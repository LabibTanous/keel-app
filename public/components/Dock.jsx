// Dock — floating bottom navigation with a center add-action.
function Dock({ active = 'home', onAdd, onAssistant, links = {} }) {
  const tabs = [
    ['home', 'Home', IconHome],
    ['coming', 'Income', IconComing],
    ['goal', 'Saving', IconGoal],
    ['adviser', 'Adviser', IconSpark],
  ];
  const left = tabs.slice(0, 2), right = tabs.slice(2);
  const Tab = ([key, label, I]) => {
    const inner = (
      <React.Fragment>
        <I size={23} sw={active === key ? 2 : 1.7} />
        <span style={{ fontSize: 10.5, fontWeight: active === key ? 600 : 500, letterSpacing: 0.1 }}>{label}</span>
      </React.Fragment>
    );
    const sty = {
      background: 'none', border: 'none', cursor: links[key] ? 'pointer' : 'default',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '6px 4px', flex: 1, minWidth: 0, textDecoration: 'none',
      color: active === key ? 'var(--pine)' : 'var(--muted)',
      fontFamily: 'var(--font-ui)',
    };
    return links[key]
      ? <a key={key} href={links[key]} style={sty}>{inner}</a>
      : <button key={key} onClick={key === 'adviser' ? onAssistant : undefined} style={{ ...sty, cursor: key === 'adviser' ? 'pointer' : sty.cursor }}>{inner}</button>;
  };
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 22, zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        background: 'var(--surface)', borderRadius: 'var(--r-pill)',
        boxShadow: 'var(--shadow)', padding: '6px 10px',
        border: '1px solid var(--hairline)',
      }}>
        {left.map(Tab)}
        <div style={{ width: 56, flexShrink: 0 }} />
        {right.map(Tab)}
      </div>
      {/* center add */}
      <button onClick={onAdd} style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        bottom: 6, width: 60, height: 60, borderRadius: '50%',
        background: 'var(--pine)', color: 'var(--on-pine)',
        border: '3px solid var(--bg)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 18px rgba(31,77,58,0.35)',
      }}>
        <IconPlus size={26} />
      </button>
    </div>
  );
}
Object.assign(window, { Dock });
