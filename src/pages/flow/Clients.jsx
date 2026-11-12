import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal } from '../../components.jsx';

function ClientForm({ client, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ name: client?.name || '', company: client?.company || '', email: client?.email || '', phone: client?.phone || '', notes: client?.notes || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { client ? await api.patch(`/flow/clients/${client._id}`, f) : await api.post('/flow/clients', f); toast('Client saved'); onSaved(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal title={client ? 'Edit client' : 'New client'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="cl-form" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
      <form id="cl-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <Field label="Contact name"><input type="text" value={f.name} onChange={set('name')} required autoFocus /></Field>
        <Field label="Company (optional)"><input type="text" value={f.company} onChange={set('company')} /></Field>
        <div className="grid2"><Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field><Field label="Phone"><input type="tel" value={f.phone} onChange={set('phone')} /></Field></div>
        <Field label="Notes"><textarea rows="3" value={f.notes} onChange={set('notes')} /></Field>
      </form>
    </Modal>
  );
}

export default function Clients() {
  const toast = useToast();
  const state = useAsync(() => api.get('/flow/clients'), []);
  const [edit, setEdit] = useState(null);
  async function remove(c) {
    if (!window.confirm(`Delete client ${c.name}?`)) return;
    try { await api.del(`/flow/clients/${c._id}`); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  return (
    <>
      <div className="page-head"><div><h1>Clients</h1><p className="sub">The people and companies you build projects for.</p></div><button className="btn primary" onClick={() => setEdit({})}>New client</button></div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No clients yet">Add your first client, then create a project for them.</Empty></div> : (
          <div className="panel table-wrap">
            <table className="table cards">
              <thead><tr><th>Client</th><th>Contact</th><th className="r">Projects</th><th className="r"> </th></tr></thead>
              <tbody>{state.data.items.map((c) => (
                <tr key={c._id}>
                  <td className="full"><div className="title" style={{ fontWeight: 600 }}>{c.name}</div><div className="muted small">{c.company}</div></td>
                  <td>{c.phone || '-'}<div className="muted small">{c.email}</div></td>
                  <td className="r">{c.projects}{c.activeProjects ? <span className="muted small"> ({c.activeProjects} active)</span> : ''}</td>
                  <td className="r"><button className="btn sm" onClick={() => setEdit(c)}>Edit</button>{' '}<button className="btn sm ghost" onClick={() => remove(c)}>Delete</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ))}
      </Loading>
      {edit && <ClientForm client={edit._id ? edit : null} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); state.reload(); }} />}
    </>
  );
}
