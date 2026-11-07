import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading, StatusChip } from '../../components.jsx';
import { DAY_NAMES, fmtDate, to12h } from '../../lib/format.js';

export default function Dashboard() {
  const state = useAsync(() => api.get('/reports/dashboard'), []);

  return (
    <div>
      <Loading state={state}>
        {state.data && (() => {
          const d = state.data;
          const max = Math.max(1, ...d.trend.map((t) => t.present));
          const kpis = [
            { v: d.staff.present, l: 'In today' },
            { v: d.staff.late, l: 'Arrived late' },
            { v: d.staff.onLeave, l: 'On leave' },
            { v: d.staff.notIn, l: 'Not in yet' },
          ];
          return (
            <>
              <div className="page-head">
                <div>
                  <h1>Dashboard</h1>
                  <p className="sub">
                    {fmtDate(d.date, true)} · {d.staff.employees} {d.staff.employees === 1 ? 'employee' : 'employees'} and {d.staff.interns} {d.staff.interns === 1 ? 'intern' : 'interns'} on the team
                  </p>
                </div>
                <Link className="btn" to="/admin/today">Open daily attendance</Link>
              </div>

              {d.isOffDay && <div className="alert info" style={{ marginBottom: 16 }}>Today is a day off, so nobody is marked absent.</div>}

              <div className="panel kpis">
                {kpis.map((k) => (
                  <div className="kpi" key={k.l}>
                    <div className="v">{k.v}</div>
                    <div className="l">{k.l}</div>
                  </div>
                ))}
              </div>

              <div className="dash-grid">
                <div className="panel">
                  <div className="panel-head"><h2>Staff in the last 7 days</h2></div>
                  <div className="bars" style={{ paddingBottom: 14 }}>
                    {d.trend.map((t) => (
                      <div className="bar" key={t.date}>
                        <b>{t.present}</b>
                        <i style={{ height: `${(t.present / max) * 100}%` }} />
                        <span>{DAY_NAMES[new Date(`${t.date}T12:00:00+05:00`).getUTCDay()]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head"><h2>Needs attention</h2></div>
                  <div className="list-row">
                    <span>Leave requests waiting</span>
                    <Link to="/admin/leaves"><b>{d.pendingLeaves}</b> to review</Link>
                  </div>
                  <div className="list-row">
                    <span>Students in {d.students.batches} active {d.students.batches === 1 ? 'batch' : 'batches'}</span>
                    <b>{d.students.total}</b>
                  </div>
                  <div className="list-row">
                    <span>Students present today</span>
                    <Link to="/admin/classes"><b>{d.students.presentToday}</b></Link>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ marginTop: 20 }}>
                <div className="panel-head"><h2>Latest check-ins today</h2></div>
                {d.recent.length === 0 ? (
                  <Empty title="Nobody has checked in yet">Entries appear here as soon as someone checks in.</Empty>
                ) : (
                  d.recent.map((r, i) => (
                    <div className="list-row" key={i}>
                      <div className="grow">
                        <b>{r.user?.name}</b> <span className="tag">{r.user?.role}</span>
                      </div>
                      <span className="muted small nowrap">
                        in {to12h(r.checkIn)}{r.checkOut ? ` · out ${to12h(r.checkOut)}` : ''}
                      </span>
                      <StatusChip status={r.status} />
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </Loading>
    </div>
  );
}
