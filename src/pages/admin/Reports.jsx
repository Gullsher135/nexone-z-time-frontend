import { useState } from 'react';
import { api, downloadFile, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Loading, Modal, Spinner, StatusChip } from '../../components.jsx';
import { fmtDate, fmtDuration, fmtMonth, thisMonth, to12h } from '../../lib/format.js';

function Detail({ person, month, onClose }) {
  const state = useAsync(() => api.get(`/reports/user/${person._id}?month=${month}`), [person._id, month]);
  return (
    <Modal wide title={`${person.name} · ${fmtMonth(month)}`} onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
      {state.loading && !state.data ? <Spinner /> : state.error ? <div className="alert bad">{state.error}</div> : (
        <div className="stack">
          <div className="stat-line">
            <span><b>{state.data.summary.present}</b> present</span>
            <span><b>{state.data.summary.late}</b> late</span>
            <span><b>{state.data.summary.absent}</b> absent</span>
            <span><b>{state.data.summary.leave}</b> on leave</span>
            <span><b>{fmtDuration(state.data.summary.totalWorkMinutes)}</b> worked</span>
            {state.data.summary.avgCheckIn && <span>usually in at <b>{to12h(state.data.summary.avgCheckIn)}</b></span>}
          </div>
          <div className="table-wrap">
            <table className="table cards c3">
              <thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Hours</th><th>Note</th></tr></thead>
              <tbody>
                {state.data.rows.filter((r) => !['na', 'upcoming'].includes(r.status)).map((r) => (
                  <tr key={r.date} style={r.off && !r.checkIn ? { color: 'var(--ink-3)' } : undefined}>
                    <td className="nowrap">{fmtDate(r.date)}</td>
                    <td className="full"><StatusChip status={r.status} />{r.lateMinutes > 0 && <span className="muted small"> {r.lateMinutes}m</span>}</td>
                    <td className="nowrap">{r.checkIn ? to12h(r.checkIn) : '-'}</td>
                    <td className="nowrap">{r.checkOut ? to12h(r.checkOut) : r.missedCheckout ? <span className="chip warn">No check-out</span> : '-'}</td>
                    <td className="nowrap">{r.workMinutes ? fmtDuration(r.workMinutes) : '-'}</td>
                    <td className="muted small">{r.note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Reports() {
  const toast = useToast();
  const [month, setMonth] = useState(thisMonth());
  const [role, setRole] = useState('');
  const [detail, setDetail] = useState(null);
  const state = useAsync(() => api.get(`/reports/summary${qs({ month, role })}`), [month, role]);

  async function download(kind) {
    try {
      await downloadFile(`/reports/export${qs({ month, role, detail: kind })}`, `attendance-${month}${kind ? '-daily' : ''}.csv`);
    } catch (e) {
      toast(e.message, 'bad');
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="sub">Monthly attendance for employees and interns. Select a person to see every day.</p>
        </div>
        <div className="tools">
          <input type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
            <option value="">Employees and interns</option>
            <option value="employee">Employees</option>
            <option value="intern">Interns</option>
          </select>
          <button className="btn" onClick={() => download('')}>Download summary (CSV)</button>
          <button className="btn" onClick={() => download('daily')}>Download daily (CSV)</button>
        </div>
      </div>

      <div className="panel table-wrap">
        <Loading state={state}>
          {state.data && (state.data.items.length === 0 ? (
            <Empty title="No staff yet">Add employees or interns on the People page.</Empty>
          ) : (
            <table className="table cards c3">
              <thead>
                <tr><th>Person</th><th>Days</th><th>Present</th><th>Late</th><th>Absent</th><th>Leave</th><th>Hours</th><th>Usually in</th><th>Attendance</th></tr>
              </thead>
              <tbody>
                {state.data.items.map(({ user, summary: s }) => (
                  <tr key={user._id} className="clickable" onClick={() => setDetail(user)} tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setDetail(user)}>
                    <td><div style={{ fontWeight: 600 }}>{user.name}</div><div className="muted small">{user.role === 'intern' ? 'Intern' : user.designation || 'Employee'}</div></td>
                    <td>{s.workingDaysElapsed}</td>
                    <td>{s.present}</td>
                    <td>{s.late}{s.missedCheckouts > 0 && <span className="muted small" title="Days without a check-out"> · {s.missedCheckouts} open</span>}</td>
                    <td>{s.absent}</td>
                    <td>{s.leave}</td>
                    <td className="nowrap">{fmtDuration(s.totalWorkMinutes)}</td>
                    <td className="nowrap">{s.avgCheckIn ? to12h(s.avgCheckIn) : '-'}</td>
                    <td>
                      {s.attendancePercent == null ? '-' : (
                        <span className={`chip ${s.attendancePercent >= 90 ? 'ok' : s.attendancePercent >= 75 ? 'warn' : 'bad'}`}>{s.attendancePercent}%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </Loading>
      </div>

      {detail && <Detail person={detail} month={month} onClose={() => setDetail(null)} />}
    </div>
  );
}
