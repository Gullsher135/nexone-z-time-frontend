import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal, ProgressBar } from '../../components.jsx';
import { fmtDate, METHOD_LABEL, rs, todayKey } from '../../lib/format.js';

const TONE = { paid: 'ok', due: 'info', overdue: 'bad' };
const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' };

function addMonths(key, n) {
  const d = new Date(`${key}T12:00:00`);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function PlanForm({ studentId, account, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ courseFee: account?.courseFee ?? '', discount: account?.discount ?? 0, note: account?.note || '' });
  const [ins, setIns] = useState(account?.installments?.map((i) => ({ ...i })) || []);
  const [gen, setGen] = useState({ n: 3, start: todayKey() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = Math.max(0, (Number(f.courseFee) || 0) - (Number(f.discount) || 0));
  const sum = ins.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  function generate() {
    const n = Math.max(1, Math.min(24, Number(gen.n) || 1));
    const each = Math.floor(total / n);
    setIns(Array.from({ length: n }, (_, i) => ({ label: `Installment ${i + 1}`, dueDate: addMonths(gen.start, i), amount: i === n - 1 ? total - each * (n - 1) : each })));
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/pay/fees/${studentId}`, { courseFee: Number(f.courseFee), discount: Number(f.discount) || 0, note: f.note, installments: ins.map((i) => ({ ...i, amount: Number(i.amount) })) });
      toast('Fee plan saved');
      onSaved();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <form className="stack" onSubmit={save}>
      {error && <div className="alert bad" role="alert">{error}</div>}
      <div className="form-grid">
        <Field label="Course fee (Rs)"><input type="number" min="1" value={f.courseFee} onChange={(e) => setF({ ...f, courseFee: e.target.value })} required /></Field>
        <Field label="Discount (Rs)"><input type="number" min="0" value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} /></Field>
        <div className="full"><b>Total to pay: {rs(total)}</b></div>
        <Field label="Split into" hint="Equal monthly installments. You can edit each one after.">
          <div className="row" style={{ gap: 8 }}>
            <input type="number" min="1" max="24" value={gen.n} onChange={(e) => setGen({ ...gen, n: e.target.value })} style={{ width: 80 }} aria-label="Number of installments" />
            <input type="date" value={gen.start} onChange={(e) => setGen({ ...gen, start: e.target.value })} aria-label="First due date" />
            <button type="button" className="btn" onClick={generate} disabled={!total}>Create</button>
          </div>
        </Field>
      </div>
      {ins.map((i, n) => (
        <div className="ins-row" key={n}>
          <input type="text" value={i.label || ''} onChange={(e) => setIns(ins.map((x, k) => (k === n ? { ...x, label: e.target.value } : x)))} aria-label="Label" />
          <input type="date" value={i.dueDate} onChange={(e) => setIns(ins.map((x, k) => (k === n ? { ...x, dueDate: e.target.value } : x)))} aria-label="Due date" required />
          <input type="number" min="1" value={i.amount} onChange={(e) => setIns(ins.map((x, k) => (k === n ? { ...x, amount: e.target.value } : x)))} aria-label="Amount" required />
          <button type="button" className="btn sm ghost" onClick={() => setIns(ins.filter((_, k) => k !== n))}>Remove</button>
        </div>
      ))}
      {ins.length > 0 && <div className={sum === total ? 'muted small' : 'small'} style={{ color: sum === total ? undefined : 'var(--bad)' }}>Installments add up to {rs(sum)} of {rs(total)}</div>}
      <Field label="Note"><input type="text" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={500} /></Field>
      <div><button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save fee plan'}</button></div>
    </form>
  );
}

function PaymentForm({ studentId, balance, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ amount: '', date: todayKey(), method: 'cash', reference: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.post(`/pay/fees/${studentId}/payments`, { ...f, amount: Number(f.amount) });
      toast(`Receipt ${r.payment.receiptNo} created`);
      onSaved(r.payment);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <form className="stack" onSubmit={save}>
      {error && <div className="alert bad" role="alert">{error}</div>}
      <div className="form-grid">
        <Field label={`Amount received (Rs), ${rs(balance)} outstanding`}><input type="number" min="1" max={balance} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required autoFocus /></Field>
        <Field label="Date"><input type="date" value={f.date} max={todayKey()} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
        <Field label="Method"><select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Reference (optional)" hint="Bank or wallet transaction ID."><input type="text" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>
      </div>
      <div className="row" style={{ gap: 8 }}><button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save and create receipt'}</button>
        {balance > 0 && <button type="button" className="btn" onClick={() => setF({ ...f, amount: String(balance) })}>Full balance</button>}</div>
    </form>
  );
}

function Ledger({ studentId, onClose, onChanged }) {
  const toast = useToast();
  const state = useAsync(() => api.get(`/pay/fees/${studentId}`), [studentId]);
  const d = state.data;
  const [view, setView] = useState('pay');
  const sm = d?.summary;
  const reload = () => { state.reload(); onChanged(); };

  async function voidPay(p) {
    if (!window.confirm(`Remove receipt ${p.receiptNo} (${rs(p.amount)})? Do this only if it was entered by mistake.`)) return;
    try { await api.del(`/pay/payments/${p._id}`); toast('Payment removed'); reload(); } catch (e) { toast(e.message, 'bad'); }
  }

  return (
    <Modal wide title={d ? d.student.name : 'Fees'} onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
      <Loading state={state}>
        {d && (
          <div className="stack">
            <div className="muted small">{d.student.code}{d.student.batch ? ` · ${d.student.batch.name}` : ''}</div>
            {sm && (
              <div className="ledger-sum">
                <div><span>Total</span><b>{rs(sm.total)}</b></div>
                <div><span>Paid</span><b>{rs(sm.paid)}</b></div>
                <div><span>Balance</span><b>{rs(sm.balance)}</b></div>
                {sm.next && <div><span>Next due</span><b>{fmtDate(sm.next.dueDate)}</b></div>}
              </div>
            )}
            {sm && <ProgressBar value={sm.total ? Math.round((sm.paid / sm.total) * 100) : 0} label="Paid" />}
            <div className="seg" role="tablist">
              <button className={view === 'pay' ? 'on' : ''} onClick={() => setView('pay')} disabled={!d.account}>Payments</button>
              <button className={view === 'plan' ? 'on' : ''} onClick={() => setView('plan')}>{d.account ? 'Fee plan' : 'Set fee plan'}</button>
            </div>
            {(view === 'plan' || !d.account) ? <PlanForm studentId={studentId} account={d.account} onSaved={() => { setView('pay'); reload(); }} />
              : (
                <>
                  {sm.balance > 0 && <PaymentForm studentId={studentId} balance={sm.balance} onSaved={(p) => { reload(); window.open(`/print/receipt/${p._id}`, '_blank'); }} />}
                  {d.account.installments.length > 0 && (
                    <div><h3 style={{ margin: '8px 0' }}>Schedule</h3>
                      {d.account.installments.map((i, n) => <div className="list-row" key={n}><div className="grow">{i.label || `Installment ${n + 1}`}</div><span className="muted small">{fmtDate(i.dueDate, true)}</span><b className="num">{rs(i.amount)}</b></div>)}</div>
                  )}
                  <div><h3 style={{ margin: '8px 0' }}>Receipts</h3>
                    {d.payments.length === 0 ? <div className="muted">No payments yet.</div> : d.payments.map((p) => (
                      <div className="list-row" key={p._id}>
                        <div className="grow"><b>{p.receiptNo}</b><div className="muted small">{fmtDate(p.date, true)} · {METHOD_LABEL[p.method]}{p.reference ? ` · ${p.reference}` : ''}</div></div>
                        <b className="num">{rs(p.amount)}</b>
                        <a className="btn sm" href={`/print/receipt/${p._id}`} target="_blank" rel="noreferrer">Print</a>
                        <button className="btn sm ghost" onClick={() => voidPay(p)}>Remove</button>
                      </div>
                    ))}</div>
                </>
              )}
          </div>
        )}
      </Loading>
    </Modal>
  );
}

export default function Fees() {
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const state = useAsync(() => api.get(`/pay/fees?status=${status}&q=${encodeURIComponent(q)}`), [status, q]);

  return (
    <>
      <div className="page-head"><div><h1>Student fees</h1><p className="sub">Fee plans, installments, payments and receipts.</p></div></div>
      <div className="tools" style={{ marginBottom: 14 }}>
        <input type="search" placeholder="Search student or ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
        <select value={status} onChange={(e) => setSp(e.target.value ? { status: e.target.value } : {})} aria-label="Filter by status">
          <option value="">All students</option><option value="overdue">Overdue</option><option value="due">Due</option><option value="paid">Fully paid</option><option value="noplan">No fee plan</option>
        </select>
      </div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No students found" /></div> : (
          <div className="panel table-wrap">
            <table className="table cards">
              <thead><tr><th>Student</th><th>Batch</th><th className="r">Total</th><th className="r">Paid</th><th className="r">Balance</th><th>Status</th><th className="r"> </th></tr></thead>
              <tbody>
                {state.data.items.map((s) => (
                  <tr key={s._id}>
                    <td className="full"><div className="title" style={{ fontWeight: 600 }}>{s.name}</div><div className="muted small">{s.code}</div></td>
                    <td>{s.batch?.name || '-'}</td>
                    <td className="r num">{s.plan ? rs(s.plan.total) : '-'}</td>
                    <td className="r num">{s.plan ? rs(s.plan.paid) : '-'}</td>
                    <td className="r num">{s.plan ? rs(s.plan.balance) : '-'}</td>
                    <td>{s.plan ? <span className={`chip ${TONE[s.plan.status]}`}>{LABEL[s.plan.status]}{s.plan.overdue ? ` ${rs(s.plan.overdue)}` : ''}</span> : <span className="chip muted">No plan</span>}</td>
                    <td className="r"><button className="btn sm primary" onClick={() => setOpen(s._id)}>{s.plan ? 'Open' : 'Set plan'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Loading>
      {open && <Ledger studentId={open} onClose={() => setOpen(null)} onChanged={state.reload} />}
    </>
  );
}
