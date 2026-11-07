import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal } from '../../components.jsx';
import { fmtDate } from '../../lib/format.js';

function BatchForm({ batch, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: batch?.name || '', course: batch?.course || '', instructor: batch?.instructor || '',
    schedule: batch?.schedule || '', startDate: batch?.startDate || '', endDate: batch?.endDate || '',
    isActive: batch?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (batch) await api.patch(`/batches/${batch._id}`, form);
      else await api.post('/batches', form);
      toast(batch ? 'Batch updated' : 'Batch created');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={batch ? 'Edit batch' : 'New batch'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="batch-form" disabled={busy}>{busy ? 'Saving...' : 'Save batch'}</button></>}>
      <form id="batch-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <div className="form-grid">
          <Field label="Batch name"><input type="text" value={form.name} onChange={set('name')} required placeholder="AI Batch 2" /></Field>
          <Field label="Course"><input type="text" value={form.course} onChange={set('course')} placeholder="AI and Programming" /></Field>
          <Field label="Instructor"><input type="text" value={form.instructor} onChange={set('instructor')} /></Field>
          <Field label="Class timing"><input type="text" value={form.schedule} onChange={set('schedule')} placeholder="Mon to Fri, 4 to 6 pm" /></Field>
          <Field label="Start date"><input type="date" value={form.startDate} onChange={set('startDate')} /></Field>
          <Field label="End date"><input type="date" value={form.endDate} onChange={set('endDate')} /></Field>
          <label className="check full"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Batch is running</label>
        </div>
      </form>
    </Modal>
  );
}

export default function Batches() {
  const toast = useToast();
  const state = useAsync(() => api.get('/batches'), []);
  const [editing, setEditing] = useState(null); // null | 'new' | batch

  async function remove(b) {
    if (!window.confirm(`Delete ${b.name}?`)) return;
    try {
      await api.del(`/batches/${b._id}`);
      toast('Batch deleted');
      state.reload();
    } catch (e) {
      toast(e.message, 'bad');
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Batches</h1>
          <p className="sub">Groups of students taught together. Class attendance is taken per batch.</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}>New batch</button>
      </div>

      <div className="panel table-wrap">
        <Loading state={state}>
          {state.data && (state.data.items.length === 0 ? (
            <Empty title="No batches yet">Create a batch, then add students to it from the People page.</Empty>
          ) : (
            <table className="table">
              <thead><tr><th>Batch</th><th>Instructor</th><th>Timing</th><th>Dates</th><th>Students</th><th>Status</th><th /></tr></thead>
              <tbody>
                {state.data.items.map((b) => (
                  <tr key={b._id}>
                    <td><div style={{ fontWeight: 600 }}>{b.name}</div><div className="muted small">{b.course}</div></td>
                    <td>{b.instructor || '-'}</td>
                    <td>{b.schedule || '-'}</td>
                    <td className="nowrap small">{b.startDate ? fmtDate(b.startDate) : '-'}{b.endDate && ` to ${fmtDate(b.endDate)}`}</td>
                    <td>{b.studentCount}</td>
                    <td><span className={`chip ${b.isActive ? 'ok' : 'muted'}`}>{b.isActive ? 'Running' : 'Finished'}</span></td>
                    <td className="r nowrap">
                      <button className="btn sm" onClick={() => setEditing(b)}>Edit</button>{' '}
                      <button className="btn sm danger" onClick={() => remove(b)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </Loading>
      </div>

      {editing && (
        <BatchForm batch={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); state.reload(); }} />
      )}
    </div>
  );
}
