import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal } from '../../components.jsx';
import { longDate, SEVERITY_LABEL } from '../../documents.jsx';

const TYPE = { internship: 'Internship certificate', experience: 'Experience letter', warning: 'Warning / notice' };
const SEV_TONE = { notice: 'info', warning: 'warn', final: 'bad' };

function Ack({ letter, onClose, onDone }) {
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { await api.post(`/docs/letters/${letter._id}/acknowledge`, { reply }); toast('Acknowledged'); onDone(); } catch (e) { toast(e.message, 'bad'); setBusy(false); }
  }
  return (
    <Modal title="Acknowledge this letter" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={go} disabled={busy}>{busy ? 'Saving...' : 'I have read it'}</button></>}>
      <div className="stack">
        <p><b>{letter.data.subject}</b></p>
        <p className="muted small">Acknowledging only confirms that you have read the letter. You can add your side of the story below. Management will see it.</p>
        <Field label="Your reply (optional)"><textarea rows="4" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1500} /></Field>
      </div>
    </Modal>
  );
}

export default function MyLetters() {
  const state = useAsync(() => api.get('/docs/my'), []);
  const [ack, setAck] = useState(null);
  return (
    <>
      <div className="page-head"><div><h1>My letters</h1><p className="sub">Certificates, experience letters and notices issued to you.</p></div></div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No letters yet">Your internship certificate or experience letter will appear here once issued.</Empty></div> : (
          <div className="panel">{state.data.items.map((l) => (
            <div className="list-row" key={l._id}>
              <div className="grow">
                <b>{TYPE[l.type]}</b>{l.type === 'warning' && <> <span className={`chip ${SEV_TONE[l.data.severity]}`}>{SEVERITY_LABEL[l.data.severity]}</span></>}
                <div className="muted small">{l.type === 'warning' ? l.data.subject : l.data.designation || ''} · {longDate(l.issuedAt)} · {l.refNo}</div>
              </div>
              {l.type === 'warning' && !l.acknowledgedAt && <button className="btn sm primary" onClick={() => setAck(l)}>Acknowledge</button>}
              {l.type === 'warning' && l.acknowledgedAt && <span className="chip ok">Acknowledged</span>}
              <a className="btn sm" href={`/print/letter/${l._id}`} target="_blank" rel="noreferrer">View and print</a>
            </div>
          ))}</div>
        ))}
      </Loading>
      {ack && <Ack letter={ack} onClose={() => setAck(null)} onDone={() => { setAck(null); state.reload(); }} />}
    </>
  );
}
