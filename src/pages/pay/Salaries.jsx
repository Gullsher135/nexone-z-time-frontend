import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Field, Loading, Modal } from '../../components.jsx';
import { ROLE_LABEL, rs } from '../../lib/format.js';

function SalaryForm({ person, onClose, onSaved }) {
  const toast = useToast();
  const [base, setBase] = useState(person.profile?.base ?? '');
  const [allow, setAllow] = useState(person.profile?.allowances?.map((a) => ({ ...a })) || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { await api.put(`/pay/salaries/${person._id}`, { base: Number(base), allowances: allow.map((a) => ({ ...a, amount: Number(a.amount) })) }); toast('Salary saved'); onSaved(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal title={`Salary: ${person.name}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="sal-form" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
      <form id="sal-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <Field label="Monthly salary (Rs)"><input type="number" min="1" value={base} onChange={(e) => setBase(e.target.value)} required autoFocus /></Field>
        <div><b>Allowances</b> <span className="muted small">(fixed amounts added every month)</span></div>
        {allow.map((a, n) => (
          <div className="ins-row two" key={n}>
            <input type="text" placeholder="e.g. Transport" value={a.label} onChange={(e) => setAllow(allow.map((x, k) => (k === n ? { ...x, label: e.target.value } : x)))} aria-label="Allowance name" />
            <input type="number" min="1" placeholder="Rs" value={a.amount} onChange={(e) => setAllow(allow.map((x, k) => (k === n ? { ...x, amount: e.target.value } : x)))} aria-label="Allowance amount" />
            <button type="button" className="btn sm ghost" onClick={() => setAllow(allow.filter((_, k) => k !== n))}>Remove</button>
          </div>
        ))}
        <div><button type="button" className="btn sm" onClick={() => setAllow([...allow, { label: '', amount: '' }])}>Add allowance</button></div>
        <p className="muted small">Absent days (no attendance and no approved leave) are deducted automatically at payroll: salary divided by the month's working days, per absent day.</p>
      </form>
    </Modal>
  );
}

export default function Salaries() {
  const state = useAsync(() => api.get('/pay/salaries'), []);
  const [edit, setEdit] = useState(null);
  return (
    <>
      <div className="page-head"><div><h1>Salaries</h1><p className="sub">Set each person's monthly salary and allowances once. Payroll uses them every month.</p></div></div>
      <Loading state={state}>
        {state.data && (
          <div className="panel table-wrap">
            <table className="table cards">
              <thead><tr><th>Person</th><th>Role</th><th className="r">Monthly salary</th><th className="r">Allowances</th><th className="r"> </th></tr></thead>
              <tbody>{state.data.items.map((p) => (
                <tr key={p._id}>
                  <td className="full"><div className="title" style={{ fontWeight: 600 }}>{p.name}</div><div className="muted small">{p.code}</div></td>
                  <td>{p.designation || ROLE_LABEL[p.role]}</td>
                  <td className="r num">{p.profile ? rs(p.profile.base) : <span className="chip warn">Not set</span>}</td>
                  <td className="r num">{p.profile ? rs(p.profile.allowances.reduce((s, a) => s + a.amount, 0)) : '-'}</td>
                  <td className="r"><button className="btn sm" onClick={() => setEdit(p)}>{p.profile ? 'Edit' : 'Set salary'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Loading>
      {edit && <SalaryForm person={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); state.reload(); }} />}
    </>
  );
}
