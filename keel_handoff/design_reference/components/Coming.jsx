// Coming.jsx — "What's coming": expected income on a timeline.
// Everything here is TRACKED by default but only counts toward the plan
// when you switch it on — and counting unconfirmed money warns you.
const { useState: useComing } = React;

// Amounts are in each item's OWN currency (amt + ccy). The plan/totals are
// always shown in the home currency (AED), converted and marked approximate.
const COMING_ITEMS = [
  { id: 'nw', date: 'Thu · Jun 5',  who: 'Northwind Studio', note: 'Invoice #142 · net-15', amt: 2450, ccy: 'USD', conf: 'likely',      counted: false },
  { id: 'at', date: 'Fri · Jun 12', who: 'Atlas Co — retainer', note: 'Recurring · auto-pays', amt: 5500, ccy: 'AED', conf: 'confirmed', counted: true  },
  { id: 'pod',date: 'Wed · Jun 18', who: 'Podcast edit', note: 'Verbal yes, no PO yet',      amt: 600,  ccy: 'EUR', conf: 'unconfirmed', counted: false },
  { id: 'mk', date: 'Thu · Jun 26', who: 'Marketplace payout', note: 'Est. from last 3 mo', amt: 310,  ccy: 'USD', conf: 'likely',      counted: false },
  { id: 'ws', date: 'Wed · Jul 2',  who: 'Workshop fee', note: 'Proposal out',               amt: 3300, ccy: 'AED', conf: 'unconfirmed', counted: false },
];

const CONF = {
  confirmed:   { label: 'Confirmed',   color: 'var(--mint)' },
  likely:      { label: 'Likely',      color: 'var(--gold)' },
  unconfirmed: { label: 'Unconfirmed', color: 'var(--clay)' },
};

// Money that has actually LANDED — the real history the paycheck is built from.
// (Expected items, once marked received, join this set in the Received view.)
const RECEIVED_ITEMS = [
  { id: 'r1', date: 'Wed · May 28', who: 'Atlas Co — retainer', note: 'Received in full', amt: 5500, ccy: 'AED' },
  { id: 'r2', date: 'Tue · May 20', who: 'Brightside Films',    note: 'Invoice #138',     amt: 1800, ccy: 'USD' },
  { id: 'r3', date: 'Fri · May 9',  who: 'Workshop fee',        note: 'Paid on the day',  amt: 2200, ccy: 'AED' },
];

function ConfPill({ conf }) {
  const c = CONF[conf];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  );
}

function CountToggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: on ? 'var(--pine)' : 'var(--surface-2)', position: 'relative',
      transition: 'background 0.3s ease', flexShrink: 0,
      boxShadow: on ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: 3, width: 21, height: 21, borderRadius: '50%',
        background: on ? 'var(--on-pine)' : 'var(--surface)', boxShadow: 'var(--shadow-sm)',
        transform: on ? 'translateX(19px)' : 'translateX(0)',
        transition: 'transform 0.32s cubic-bezier(0.5,1.3,0.5,1)',
      }} />
    </button>
  );
}

function TimelineItem({ item, counted, onToggle, received, onReceive, historical, last }) {
  const isReceived = historical || received;
  const warn = !isReceived && counted && item.conf !== 'confirmed';
  const amtColor = isReceived ? 'var(--mint)' : counted ? 'var(--pine)' : 'var(--ink)';
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {/* rail */}
      <div style={{ position: 'relative', width: 14, flexShrink: 0 }}>
        {!last && <div style={{ position: 'absolute', left: 6, top: 18, bottom: -18, width: 2, background: 'var(--hairline)' }} />}
        <div style={{
          width: 14, height: 14, borderRadius: '50%', marginTop: 4,
          background: isReceived ? 'var(--mint)' : counted ? 'var(--pine)' : 'var(--surface)',
          border: isReceived || counted ? 'none' : '2px solid var(--hairline)',
          boxShadow: isReceived ? '0 0 0 3px var(--mint-soft)' : counted ? '0 0 0 3px var(--pine-soft)' : 'none',
          transition: 'all 0.3s ease',
        }} />
      </div>
      {/* card */}
      <div style={{ flex: 1, paddingBottom: 18 }}>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, letterSpacing: 0.2, marginBottom: 6 }}>{item.date}</div>
        <div style={{
          background: 'var(--surface)', borderRadius: 16, padding: '14px 15px',
          boxShadow: 'var(--shadow-sm)',
          borderLeft: `3px solid ${isReceived ? 'var(--mint)' : counted ? 'var(--pine)' : 'transparent'}`,
          transition: 'border-color 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', paddingTop: 2 }}>{item.who}</span>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="serif tnum" style={{ fontSize: 19, color: amtColor, whiteSpace: 'nowrap' }}>
                {item.ccy === 'AED'
                  ? <Cur n={item.amt} />
                  : <React.Fragment>{fmtFx(item.amt, item.ccy)}<span style={{ fontSize: '0.52em', fontWeight: 600, color: 'var(--muted)', marginLeft: 4, letterSpacing: 0.3 }}>{item.ccy}</span></React.Fragment>}
              </div>
              {item.ccy !== 'AED' && (
                <div className="tnum" style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{approxAED(toAED(item.amt, item.ccy))}</div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{item.note}</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }}>
            {isReceived ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--mint)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="var(--mint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Received
              </span>
            ) : <ConfPill conf={item.conf} />}
            {!isReceived && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: counted ? 'var(--pine)' : 'var(--muted)' }}>
                  {counted ? 'In the plan' : 'Count it'}
                </span>
                <CountToggle on={counted} onClick={onToggle} />
              </div>
            )}
            {isReceived && !historical && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>in your history</span>
            )}
          </div>

          {warn && (
            <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--clay)', fontSize: 13, lineHeight: 1.3 }}>⚠</span>
              <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--clay)' }}>
                You're counting money that isn't confirmed — a no-show would leave your plan short.
              </span>
            </div>
          )}

          {/* expected → received: the legible transition */}
          {!isReceived && (
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--hairline)' }}>
              <button onClick={onReceive} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--pine)', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, padding: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="var(--pine)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                It landed — mark as received
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComingScreen({ counted, toggle, received, markReceived }) {
  const [view, setView] = React.useState('expected');
  const aedOf = (i) => toAED(i.amt, i.ccy);
  // expected = not-yet-received items
  const expectedItems = COMING_ITEMS.filter(i => !received[i.id]);
  const countedItems = expectedItems.filter(i => counted[i.id]);
  const countedTotal = countedItems.reduce((s, i) => s + aedOf(i), 0);
  const expectedTotal = expectedItems.reduce((s, i) => s + aedOf(i), 0);
  const countedForeign = countedItems.some(i => i.ccy !== 'AED');
  const anyForeign = expectedItems.some(i => i.ccy !== 'AED');
  // received = the marked expected items + the historical landed payments
  const receivedFromExpected = COMING_ITEMS.filter(i => received[i.id]);
  const receivedItems = [...receivedFromExpected, ...RECEIVED_ITEMS];
  const receivedTotal = receivedItems.reduce((s, i) => s + aedOf(i), 0);
  const receivedForeign = receivedItems.some(i => i.ccy !== 'AED');

  const Approx = ({ on }) => on ? <span style={{ fontSize: '0.5em', fontWeight: 400, marginRight: 3, verticalAlign: 'middle' }}>≈</span> : null;

  const list = view === 'plan' ? countedItems : view === 'received' ? receivedItems : expectedItems;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* summary */}
      <div className="rise"><Card>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="smallcaps" style={{ fontSize: 10.5, minHeight: 30 }}>Counted in<br/>your plan</div>
            <div className="serif tnum" style={{ fontSize: 32, color: 'var(--pine)', lineHeight: 1, marginTop: 6 }}><Approx on={countedForeign} /><Cur n={countedTotal} /></div>
          </div>
          <div style={{ width: 1, background: 'var(--hairline)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="smallcaps" style={{ fontSize: 10.5, minHeight: 30 }}>If it<br/>all lands</div>
            <div className="serif tnum" style={{ fontSize: 32, color: 'var(--muted)', lineHeight: 1, marginTop: 6 }}><Approx on={anyForeign} /><Cur n={expectedTotal} /></div>
          </div>
        </div>
        <p style={{ margin: '15px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
          Keel plans only with money you've <span style={{ color: 'var(--ink)', fontWeight: 600 }}>counted</span> — so a no-show never breaks your month.
        </p>
        {anyForeign && (
          <Disclaimer style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--hairline)' }}>
            Foreign amounts converted at today's rate — approximate, not a locked figure.
          </Disclaimer>
        )}
      </Card></div>

      <div className="rise" style={{ animationDelay: '70ms' }}>
        <Segmented value={view} onChange={setView}
          options={[{ value: 'expected', label: 'Expected' }, { value: 'plan', label: 'In plan' }, { value: 'received', label: 'Received' }]} />
      </div>

      {/* received: a small "landed so far" line above the history */}
      {view === 'received' && receivedItems.length > 0 && (
        <div className="rise" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Landed recently</span>
          <span className="serif tnum" style={{ fontSize: 19, color: 'var(--mint)' }}><Approx on={receivedForeign} /><Cur n={receivedTotal} /></span>
        </div>
      )}

      {/* timeline */}
      <div className="rise" style={{ animationDelay: '140ms' }}>
        {list.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '30px 22px' }}>
            <div className="serif" style={{ fontSize: 19, color: 'var(--ink)', marginBottom: 5 }}>
              {view === 'received' ? 'Nothing logged yet' : view === 'plan' ? 'Nothing counted yet' : 'Nothing expected'}
            </div>
            <p style={{ margin: '0 auto', maxWidth: 240, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              {view === 'received'
                ? 'When a payment lands, mark it received — it builds the history your paycheck is read from.'
                : view === 'plan'
                ? "Switch on the payments you're sure about and they'll show up in your plan."
                : 'Add an invoice or gig you’re expecting and it’ll appear here.'}
            </p>
          </Card>
        ) : (
          <div style={{ paddingTop: 4 }}>
            {list.map((it, i) => {
              const historical = view === 'received' && RECEIVED_ITEMS.some(r => r.id === it.id);
              return (
                <TimelineItem key={it.id} item={it}
                  counted={!!counted[it.id]} onToggle={() => toggle(it.id)}
                  received={view === 'received'} historical={historical}
                  onReceive={() => markReceived(it.id)} last={i === list.length - 1} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ComingScreen, COMING_ITEMS, RECEIVED_ITEMS });
