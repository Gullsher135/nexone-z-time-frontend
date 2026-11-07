import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading } from '../../components.jsx';
import { daysInclusive, fmtDate, todayKey } from '../../lib/format.js';

const TONE = { pending: 'warn', approved: 'ok', rejected: 'bad' };
const LABEL = { pending: 'Waiting for approval', approved: 'Approved', rejected: 'Rejected' };

export default function MyLeaves() {
  const toast = useToast();
  const list = useAsync(() => api.get('/leaves/me'), []);
  const [form, setForm] = useState({ type: 'casual', fromDate: todayKey(), toDate: todayKey(), reason: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/leaves', form);
      toast('Leave request sent');
      setForm({ type: 'casual', fromDate: todayKey(), toDate: todayKey(), reason: '' });
      list.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    try {
      await api.del(`/leaves/${id}`);
      toast('Request cancelled');
      list.reload();
    } catch (err) {
      toast(err.message, 'bad');
    }
  }

  return (
    <div className="stack">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>Leave</h1>
          <p className="sub">Ask for time off. The admin approves or rejects each request.</p>
        </div>
      </div>

      <form className="panel panel-pad stack" onSubmit={submit}>
        <h2>New request</h2>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <div className="form-grid">
          <Field label="Type">
            <select value={form.type} onChange={set('type')}>
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <div />
          <Field label="From"><input type="date" value={form.fromDate} onChange={set('fromDate')} required /></Field>
          <Field label="To"><input type="date" value={form.toDate} min={form.fromDate} onChange={set('toDate')} required /></Field>
          <Field label="Reason" full>
            <textarea value={form.reason} onChange={set('reason')} required placeholder="Tell the admin why you need leave" />
          </Field>
        </div>
        <div><button className="btn primary" disabled={busy}>{busy ? 'Sending...' : 'Send request'}</button></div>
      </form>

      <div className="panel">
        <div className="panel-head"><h2>My requests</h2></div>
        <Loading state={list}>
          {list.data && (list.data.items.length === 0 ? (
            <Empty title="No leave requests yet">Your requests will show up here.</Empty>
          ) : (
            list.data.items.map((l) => (
              <div className="list-row" key={l._id}>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>
                    {fmtDate(l.fromDate)}{l.toDate !== l.fromDate && ` to ${fmtDate(l.toDate)}`}
                    <span className="muted small"> · {daysInclusive(l.fromDate, l.toDate)} day{daysInclusive(l.fromDate, l.toDate) > 1 ? 's' : ''} · {l.type}</span>
                  </div>
                  <div className="muted small">{l.reason}</div>
                  {l.reviewNote && <div className="small">Admin note: {l.reviewNote}</div>}
                </div>
                <span className={`chip ${TONE[l.status]}`}>{LABEL[l.status]}</span>
                {l.status === 'pending' && <button className="btn sm" onClick={() => cancel(l._id)}>Cancel</button>}
              </div>
            ))
          ))}
        </Loading>
      </div>
    </div>
  );
}
