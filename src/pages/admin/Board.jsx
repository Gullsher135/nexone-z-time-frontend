import { useEffect, useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal, PresenceStrip, StatusChip } from '../../components.jsx';
import { fmtDate, fmtDuration, hhmmFromIso, to12h, todayKey } from '../../lib/format.js';

function EntryModal({ row, date, onClose, onSaved }) {
  const toast = useToast();
  const rec = row.record;
  const [form, setForm] = useState({
    status: rec?.status === 'absent' || rec?.status === 'leave' ? rec.status : 'present',
    checkIn: hhmmFromIso(rec?.checkIn) || '',
    checkOut: hhmmFromIso(rec?.checkOut) || '',
    note: rec?.note || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const timed = form.status === 'present';

  async function save() {
    setError('');
    setBusy(true);
    try {
      await api.post('/attendance/manual', {
        user: row.user._id,
        date,
        status: form.status,
        checkIn: timed ? form.checkIn : '',
        checkOut: timed ? form.checkOut : '',
        note: form.note,
      });
      toast('Attendance saved');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Remove this attendance record?')) return;
    try {
      await api.del(`/attendance/${rec._id}`);
      toast('Record removed');
      onSaved();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Modal
      title={`${row.user.name} · ${fmtDate(date)}`}
      onClose={onClose}
      footer={
        <>
          {rec && <button className="btn danger" onClick={remove} style={{ marginRight: 'auto' }}>Remove record</button>}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        </>
      }
    >
      <div className="stack">
        {error && <div className="alert bad" role="alert">{error}</div>}
        <div className="form-grid">
          <Field label="Status" full>
            <select value={form.status} onChange={set('status')}>
              <option value="present">Present (set entry and exit time)</option>
              <option value="absent">Absent</option>
              <option value="leave">On leave</option>
            </select>
          </Field>
          {timed && (
            <>
              <Field label="Entry time"><input type="time" value={form.checkIn} onChange={set('checkIn')} required /></Field>
              <Field label="Exit time" hint="Leave empty if the person has not left yet."><input type="time" value={form.checkOut} onChange={set('checkOut')} /></Field>
            </>
          )}
          <Field label="Reason for this change" full hint="Kept with the record, for example: forgot to check out.">
            <textarea value={form.note} onChange={set('note')} required />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default function Board() {
  const [date, setDate] = useState(todayKey());
  const [role, setRole] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const state = useAsync(() => api.get(`/attendance/board${qs({ date, role })}`), [date, role]);
  const isToday = date === todayKey();

  // Keep today's board live while the page is open.
  useEffect(() => {
    if (!isToday) return undefined;
    const id = setInterval(() => state.reload(), 30000);
    return () => clearInterval(id);
  }, [isToday, state.reload]);

  const chips = [
    ['', 'Everyone'], ['present', 'Present'], ['late', 'Late'], ['not_in', 'Not in yet'], ['absent', 'Absent'], ['leave', 'On leave'],
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Daily attendance</h1>
          <p className="sub">
            {fmtDate(date, true)}{state.data?.holiday && ` · ${state.data.holiday}`}{state.data?.isOffDay && !state.data?.holiday && ' · Day off'}
          </p>
        </div>
        <div className="tools">
          <button className="btn" onClick={() => (isToday ? state.reload() : setDate(todayKey()))}>{isToday ? 'Refresh' : 'Today'}</button>
          <input type="date" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date" />
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
            <option value="">Employees and interns</option>
            <option value="employee">Employees</option>
            <option value="intern">Interns</option>
          </select>
        </div>
      </div>

      <Loading state={state}>
        {state.data && (() => {
          const c = state.data.counts;
          const count = (k) => (k === '' ? state.data.rows.length : k === 'present' ? c.present + c.late : c[k] ?? 0);
          const rows = state.data.rows.filter((r) => !filter || r.status === filter || (filter === 'present' && r.status === 'late'));
          return (
            <>
              <div className="tabs" role="tablist" aria-label="Filter by status">
                {chips.map(([k, label]) => (
                  <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                    {label} <span className="muted">{count(k)}</span>
                  </button>
                ))}
              </div>
              <div className="panel table-wrap">
                {rows.length === 0 ? (
                  <Empty title="No one to show">Try another filter or date.</Empty>
                ) : (
                  <table className="table cards c3">
                    <thead>
                      <tr><th>Person</th><th style={{ width: '32%' }}>7 am to 9 pm</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th><th /></tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const inS = hhmmFromIso(r.record?.checkIn);
                        const outS = hhmmFromIso(r.record?.checkOut);
                        return (
                          <tr key={r.user._id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.user.name}</div>
                              <div className="muted small">{r.user.role === 'intern' ? 'Intern' : r.user.designation || 'Employee'}</div>
                            </td>
                            <td className="full"><PresenceStrip checkIn={inS} checkOut={outS} shift={r.user.shift} live={isToday} /></td>
                            <td className="nowrap">{inS ? to12h(inS) : '-'}</td>
                            <td className="nowrap">{outS ? to12h(outS) : '-'}</td>
                            <td className="nowrap">{r.record?.workMinutes ? fmtDuration(r.record.workMinutes) : '-'}</td>
                            <td className="full">
                              <StatusChip status={r.status} />
                              {r.record?.lateMinutes > 0 && <span className="muted small"> {r.record.lateMinutes}m</span>}
                              {r.record?.checkInMethod === 'manual' && <span className="muted small"> · edited</span>}
                            </td>
                            <td className="r"><button className="btn sm" onClick={() => setEditing(r)}>{r.record ? 'Edit' : 'Add entry'}</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          );
        })()}
      </Loading>

      {editing && (
        <EntryModal
          row={editing}
          date={date}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); state.reload(); }}
        />
      )}
    </div>
  );
}
