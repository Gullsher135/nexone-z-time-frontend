import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal } from '../../components.jsx';
import { ago } from './shared.jsx';

function NoticeForm({ item, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ title: item?.title || '', body: item?.body || '', audience: item?.audience || 'all', pinned: !!item?.pinned });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { if (item) await api.patch(`/crew/notices/${item._id}`, f); else await api.post('/crew/notices', f); toast('Notice saved'); onSaved(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal wide title={item ? 'Edit notice' : 'New notice'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="notice-form" disabled={busy}>{busy ? 'Saving...' : 'Publish'}</button></>}>
      <form id="notice-form" onSubmit={save} className="form-grid">
        {error && <div className="alert bad full" role="alert">{error}</div>}
        <Field label="Title" full><input type="text" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required autoFocus /></Field>
        <Field label="Message" full><textarea rows={6} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        <Field label="Who sees it"><select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}><option value="all">All staff</option><option value="employee">Employees only</option><option value="intern">Interns only</option></select></Field>
        <label className="check"><input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} /> Pin to the top</label>
      </form>
    </Modal>
  );
}

export default function AdminNotices() {
  const toast = useToast();
  const state = useAsync(() => api.get('/crew/notices'), []);
  const [editing, setEditing] = useState(null);
  async function remove(n) {
    if (!window.confirm(`Delete "${n.title}"?`)) return;
    try { await api.del(`/crew/notices/${n._id}`); toast('Deleted'); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  return (
    <>
      <div className="page-head"><div><h1>Notices</h1><p className="sub">Announcements shown on every employee's home page.</p></div><button className="btn primary" onClick={() => setEditing('new')}>New notice</button></div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No notices yet">Post holiday news, policy changes or reminders.</Empty></div> : (
          <div className="panel">{state.data.items.map((n) => (
            <div className="list-row" key={n._id}>
              <div className="grow"><div style={{ fontWeight: 600 }}>{n.pinned && <span className="tag" style={{ marginRight: 6 }}>Pinned</span>}{n.title}</div>
                <div className="muted small">{n.audience === 'all' ? 'All staff' : `${n.audience}s`} · {ago(n.createdAt)} · read by {n.readCount}</div></div>
              <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setEditing(n)}>Edit</button><button className="btn sm ghost" onClick={() => remove(n)}>Delete</button></div>
            </div>
          ))}</div>
        ))}
      </Loading>
      {editing && <NoticeForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); state.reload(); }} />}
    </>
  );
}
