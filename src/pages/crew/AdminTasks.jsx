import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal, Tabs } from '../../components.jsx';
import { TaskCard } from './MyTasks.jsx';
import { todayKey } from '../../lib/format.js';

function TaskForm({ item, people, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ title: item?.title || '', description: item?.description || '', assignee: item?.assignee?._id || '', priority: item?.priority || 'medium', dueDate: item?.dueDate || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { ...f, dueDate: f.dueDate || undefined };
    try { if (item) await api.patch(`/crew/tasks/${item._id}`, body); else await api.post('/crew/tasks', body); toast('Task saved'); onSaved(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal wide title={item ? 'Edit task' : 'New task'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="task-form" disabled={busy}>{busy ? 'Saving...' : 'Save task'}</button></>}>
      <form id="task-form" onSubmit={save} className="form-grid">
        {error && <div className="alert bad full" role="alert">{error}</div>}
        <Field label="Task" full><input type="text" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required autoFocus /></Field>
        <Field label="Details" full><textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Assign to"><select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} required><option value="">Choose a person</option>{people.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></Field>
        <Field label="Priority"><select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
        <Field label="Due date"><input type="date" value={f.dueDate} min={todayKey()} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
      </form>
    </Modal>
  );
}

export default function AdminTasks() {
  const toast = useToast();
  const [tab, setTab] = useState('open');
  const [who, setWho] = useState('');
  const [editing, setEditing] = useState(null);
  const state = useAsync(() => api.get(`/crew/tasks${who ? `?assignee=${who}` : ''}`), [who]);
  const team = useAsync(() => api.get('/crew/team'), []);
  const people = (team.data?.items || []).filter((p) => p.role !== 'admin');
  const items = (state.data?.items || []).filter((t) => (tab === 'open' ? t.status !== 'done' : t.status === 'done'));

  async function remove(t) {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try { await api.del(`/crew/tasks/${t._id}`); toast('Deleted'); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head"><div><h1>Tasks</h1><p className="sub">Assign work to employees and interns and follow it to done.</p></div><button className="btn primary" onClick={() => setEditing('new')}>New task</button></div>
      <Tabs tabs={[{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }]} value={tab} onChange={setTab} />
      <div className="tools" style={{ marginBottom: 14 }}>
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by person"><option value="">Everyone</option>{people.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>
      </div>
      <Loading state={state}>
        {state.data && (items.length === 0 ? <div className="panel"><Empty title={tab === 'open' ? 'No open tasks' : 'Nothing completed yet'}>Use "New task" to assign work.</Empty></div> : (
          <div className="stack">{items.map((t) => (
            <div key={t._id}>
              <TaskCard t={t} onChange={state.reload} admin />
              <div className="row" style={{ gap: 6, marginTop: 6 }}><button className="btn sm" onClick={() => setEditing(t)}>Edit</button><button className="btn sm ghost" onClick={() => remove(t)}>Delete</button></div>
            </div>
          ))}</div>
        ))}
      </Loading>
      {editing && <TaskForm item={editing === 'new' ? null : editing} people={people} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); state.reload(); }} />}
    </>
  );
}
