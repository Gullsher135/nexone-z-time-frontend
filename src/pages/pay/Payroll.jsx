import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal } from '../../components.jsx';
import { METHOD_LABEL, monthLabel, rs, todayKey } from '../../lib/format.js';

function Adjust({ slip, onClose, onSaved }) {
  const toast = useToast();
  const [items, setItems] = useState(slip.items.map((i) => ({ ...i })));
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try { await api.patch(`/pay/payslips/${slip._id}`, { items: items.map((i) => ({ label: i.label, amount: Number(i.amount) })) }); toast('Payslip updated'); onSaved(); } catch (e) { toast(e.message, 'bad'); setBusy(false); }
  }
  return (
    <Modal title={`Adjust: ${slip.user.name}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
      <div className="stack">
        <p className="muted small">Add a bonus (positive amount) or a deduction (negative amount, for example -500 for an advance).</p>
        {items.map((i, n) => (
          <div className="ins-row two" key={n}>
            <input type="text" placeholder="e.g. Eid bonus" value={i.label} onChange={(e) => setItems(items.map((x, k) => (k === n ? { ...x, label: e.target.value } : x)))} aria-label="Name" />
            <input type="number" placeholder="Rs" value={i.amount} onChange={(e) => setItems(items.map((x, k) => (k === n ? { ...x, amount: e.target.value } : x)))} aria-label="Amount" />
            <button type="button" className="btn sm ghost" onClick={() => setItems(items.filter((_, k) => k !== n))}>Remove</button>
          </div>
        ))}
        <div><button className="btn sm" onClick={() => setItems([...items, { label: '', amount: '' }])}>Add line</button></div>
      </div>
    </Modal>
  );
}

function PayModal({ slip, onClose, onSaved }) {
  const toast = useToast();
  const [method, setMethod] = useState('bank');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { await api.post(`/pay/payslips/${slip._id}/pay`, { method }); toast('Marked as paid'); onSaved(); } catch (e) { toast(e.message, 'bad'); setBusy(false); }
  }
  return (
    <Modal title="Mark salary as paid" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={go} disabled={busy}>{busy ? 'Saving...' : `Paid ${rs(slip.net)}`}</button></>}>
      <p><b>{slip.user.name}</b>, {monthLabel(slip.month)}: net <b>{rs(slip.net)}</b>. After this the payslip is locked and the employee can see it.</p>
      <Field label="Paid by"><select value={method} onChange={(e) => setMethod(e.target.value)}>{Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
    </Modal>
  );
}

export default function Payroll() {
  const toast = useToast();
  const [month, setMonth] = useState(todayKey().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [adj, setAdj] = useState(null);
  const [paying, setPaying] = useState(null);
  const state = useAsync(() => api.get(`/pay/payroll?month=${month}`), [month]);
  const d = state.data;

  async function generate() {
    setBusy(true);
    try {
      const r = await api.post('/pay/payroll/generate', { month });
      toast(`Payroll ready: ${r.created} new, ${r.updated} refreshed`);
      state.reload();
    } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); }
  }
  async function remove(s) {
    if (!window.confirm(`Delete the draft payslip for ${s.user.name}?`)) return;
    try { await api.del(`/pay/payslips/${s._id}`); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head"><div><h1>Payroll</h1><p className="sub">Salaries worked out from attendance. Review, adjust, then mark each one paid.</p></div></div>
      <div className="tools" style={{ marginBottom: 14 }}>
        <input type="month" value={month} max={todayKey().slice(0, 7)} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
        <button className="btn primary" onClick={generate} disabled={busy}>{busy ? 'Working...' : d?.items.length ? 'Refresh drafts' : 'Generate payroll'}</button>
      </div>
      <Loading state={state}>
        {d && (d.items.length === 0 ? <div className="panel"><Empty title={`No payslips for ${monthLabel(month)}`}>Set salaries first, then press Generate payroll.</Empty></div> : (
          <>
            <div className="panel kpis" style={{ marginBottom: 16 }}>
              <div className="kpi"><div className="v">{rs(d.totalNet)}</div><div className="l">Total net payable</div></div>
              <div className="kpi"><div className="v">{rs(d.paidNet)}</div><div className="l">Paid so far</div></div>
              <div className="kpi"><div className="v">{d.items.filter((i) => i.status === 'paid').length}/{d.items.length}</div><div className="l">Salaries paid</div></div>
            </div>
            <div className="panel table-wrap">
              <table className="table cards">
                <thead><tr><th>Person</th><th className="r">Days</th><th className="r">Gross</th><th className="r">Deductions</th><th className="r">Net</th><th>Status</th><th className="r"> </th></tr></thead>
                <tbody>{d.items.map((s) => (
                  <tr key={s._id}>
                    <td className="full"><div className="title" style={{ fontWeight: 600 }}>{s.user.name}</div><div className="muted small">{s.user.code}</div></td>
                    <td className="r">{s.paidDays}/{s.workingDays}{s.absentDays ? <span className="muted small"> ({s.absentDays} absent)</span> : ''}</td>
                    <td className="r num">{rs(s.gross)}</td>
                    <td className="r num">{rs(s.deductions)}</td>
                    <td className="r num"><b>{rs(s.net)}</b></td>
                    <td>{s.status === 'paid' ? <span className="chip ok">Paid</span> : <span className="chip warn">Draft</span>}</td>
                    <td className="r">
                      {s.status === 'draft' && <><button className="btn sm" onClick={() => setAdj(s)}>Adjust</button>{' '}<button className="btn sm primary" onClick={() => setPaying(s)}>Mark paid</button>{' '}<button className="btn sm ghost" onClick={() => remove(s)}>Delete</button></>}
                      <a className="btn sm" href={`/print/payslip/${s._id}`} target="_blank" rel="noreferrer">Payslip</a>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>Drafts can be refreshed any time (for example after attendance is corrected). Paid payslips never change.</p>
          </>
        ))}
      </Loading>
      {adj && <Adjust slip={adj} onClose={() => setAdj(null)} onSaved={() => { setAdj(null); state.reload(); }} />}
      {paying && <PayModal slip={paying} onClose={() => setPaying(null)} onSaved={() => { setPaying(null); state.reload(); }} />}
    </>
  );
}
