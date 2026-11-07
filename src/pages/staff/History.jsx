import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Loading, StatusChip } from '../../components.jsx';
import { fmtDate, fmtDuration, fmtMonth, thisMonth, to12h } from '../../lib/format.js';

export default function History() {
  const [month, setMonth] = useState(thisMonth());
  const state = useAsync(() => api.get(`/attendance/me?month=${month}`), [month]);

  return (
    <div className="stack">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>My attendance</h1>
          <p className="sub">{fmtMonth(month)}</p>
        </div>
        <div className="tools">
          <input type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        </div>
      </div>

      <Loading state={state}>
        {state.data && (
          <>
            <div className="panel panel-pad">
              <div className="stat-line">
                <span><b>{state.data.summary.present}</b> days present</span>
                <span><b>{state.data.summary.late}</b> late</span>
                <span><b>{state.data.summary.absent}</b> absent</span>
                <span><b>{state.data.summary.leave}</b> on leave</span>
                <span><b>{fmtDuration(state.data.summary.totalWorkMinutes)}</b> worked</span>
                {state.data.summary.attendancePercent != null && <span><b>{state.data.summary.attendancePercent}%</b> attendance</span>}
              </div>
            </div>

            <div className="panel table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Hours</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {state.data.rows
                    .filter((r) => r.status !== 'na' && r.status !== 'upcoming')
                    .reverse()
                    .map((r) => (
                      <tr key={r.date} style={r.off && !r.checkIn ? { color: 'var(--ink-3)' } : undefined}>
                        <td className="nowrap">{fmtDate(r.date)}{r.holiday && <span className="muted small"> · {r.holiday}</span>}</td>
                        <td><StatusChip status={r.status} />{r.lateMinutes > 0 && <span className="muted small"> {r.lateMinutes}m</span>}</td>
                        <td className="nowrap">{r.checkIn ? to12h(r.checkIn) : '-'}</td>
                        <td className="nowrap">
                          {r.checkOut ? to12h(r.checkOut) : r.missedCheckout ? <span className="chip warn">No check-out</span> : '-'}
                        </td>
                        <td className="nowrap">{r.workMinutes ? fmtDuration(r.workMinutes) : '-'}</td>
                        <td className="muted small">{r.note || ''}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Loading>
    </div>
  );
}
