import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Field, Loading } from '../../components.jsx';

export default function AdminPolicy() {
  const toast = useToast();
  const state = useAsync(() => api.get('/settings'), []);
  const [f, setF] = useState(null);
  const q = state.data?.settings?.leaveQuota;
  const cur = f || { casual: q?.casual ?? 10, sick: q?.sick ?? 8 };
  async function save(e) {
    e.preventDefault();
    try { await api.put('/settings', { leaveQuota: { casual: Number(cur.casual), sick: Number(cur.sick) } }); toast('Leave policy saved'); setF(null); state.reload(); } catch (err) { toast(err.message, 'bad'); }
  }
  return (
    <>
      <div className="page-head"><div><h1>Leave policy</h1><p className="sub">Yearly leave days for each person. Employees see what is left on their home page.</p></div></div>
      <Loading state={state}>
        <form className="panel panel-pad form-grid" style={{ maxWidth: 560 }} onSubmit={save}>
          <Field label="Casual leave (days per year)"><input type="number" min="0" max="366" value={cur.casual} onChange={(e) => setF({ ...cur, casual: e.target.value })} /></Field>
          <Field label="Sick leave (days per year)"><input type="number" min="0" max="366" value={cur.sick} onChange={(e) => setF({ ...cur, sick: e.target.value })} /></Field>
          <p className="muted small full">Only working days count: weekly off days and holidays set in Time, Settings are skipped. Requests waiting for approval are also held against the balance.</p>
          <div className="full"><button className="btn primary">Save policy</button></div>
        </form>
      </Loading>
    </>
  );
}
