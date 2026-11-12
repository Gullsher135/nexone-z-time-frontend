import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useAuth } from '../../lib/auth.jsx';
import { Empty, Loading } from '../../components.jsx';
import { fmtDate, fmtDuration, hhmmFromIso, to12h } from '../../lib/format.js';
import { PriorityChip, ago } from './shared.jsx';

export default function CrewHome() {
  const { user } = useAuth();
  const state = useAsync(() => api.get('/crew/home'), []);
  const d = state.data;
  const rec = d?.today;
  const status = !rec ? { tone: 'muted', text: 'Not checked in yet', cta: 'Check in' }
    : rec.checkOut ? { tone: 'ok', text: `Done for today (${to12h(hhmmFromIso(rec.checkIn))} to ${to12h(hhmmFromIso(rec.checkOut))})`, cta: 'View' }
      : { tone: rec.status === 'late' ? 'warn' : 'ok', text: `Checked in at ${to12h(hhmmFromIso(rec.checkIn))}${rec.status === 'late' ? ' (late)' : ''}`, cta: 'Check out' };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hello, {user.name.split(' ')[0]}</h1>
          <p className="sub">{user.designation || (user.role === 'intern' ? 'Intern' : 'Employee')} at NexoneZ Software House</p>
        </div>
      </div>
      <Loading state={state}>
        {d && (
          <>
            <div className={`today-card alert ${status.tone === 'muted' ? '' : status.tone}`} style={status.tone === 'muted' ? { background: 'var(--muted-t)' } : undefined}>
              <div className="grow"><b>Today</b><div>{status.text}</div></div>
              <Link className="btn primary" to="/time">{status.cta}</Link>
            </div>

            <div className="panel kpis" style={{ margin: '20px 0' }}>
              <div className="kpi"><div className="v">{d.stats.openTasks}</div><div className="l">Open tasks</div></div>
              <div className="kpi"><div className="v">{d.stats.unreadNotices}</div><div className="l">Unread notices</div></div>
              <div className="kpi"><div className="v">{d.stats.presentDays}</div><div className="l">Days present this month</div></div>
              <div className="kpi"><div className="v">{fmtDuration(d.stats.workMinutes)}</div><div className="l">Hours this month</div></div>
            </div>

            <div className="dash-grid">
              <div className="panel">
                <div className="panel-head"><h2>My tasks</h2><Link to="/tasks" className="small">All tasks</Link></div>
                {d.tasks.length === 0 ? <div className="panel-pad muted">No open tasks. Enjoy the calm.</div> : d.tasks.map((t) => (
                  <Link key={t._id} to="/tasks" className="list-row row-link">
                    <div className="grow"><div style={{ fontWeight: 600 }}>{t.title}</div><div className="muted small">{t.dueDate ? `Due ${fmtDate(t.dueDate)}` : 'No deadline'}</div></div>
                    {t.overdue && <span className="chip bad">Overdue</span>}<PriorityChip p={t.priority} />
                  </Link>
                ))}
              </div>
              <div className="panel">
                <div className="panel-head"><h2>Notices</h2><Link to="/notices" className="small">All notices</Link></div>
                {d.notices.length === 0 ? <div className="panel-pad muted">No notices.</div> : d.notices.map((n) => (
                  <Link key={n._id} to="/notices" className="list-row row-link">
                    <div className="grow"><div style={{ fontWeight: n.read ? 500 : 700 }}>{n.pinned && <span className="tag" style={{ marginRight: 6 }}>Pinned</span>}{n.title}</div><div className="muted small">{ago(n.createdAt)}</div></div>
                    {!n.read && <span className="chip info">New</span>}
                  </Link>
                ))}
              </div>
            </div>

            <div className="dash-grid" style={{ marginTop: 20 }}>
              <div className="panel">
                <div className="panel-head"><h2>My leave this year</h2><Link to="/time/leaves" className="small">Request leave</Link></div>
                {[['casual', 'Casual leave'], ['sick', 'Sick leave']].map(([k, label]) => {
                  const b = d.balance[k];
                  const pct = b.quota ? Math.min(100, Math.round(((b.used + b.pending) / b.quota) * 100)) : 0;
                  return (
                    <div className="panel-pad bal" key={k}>
                      <div className="row"><b className="grow">{label}</b><span className="num"><b>{b.left}</b> of {b.quota} days left</span></div>
                      <div className="pbar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
                      <div className="muted small">{b.used} used{b.pending ? `, ${b.pending} waiting for approval` : ''}</div>
                    </div>
                  );
                })}
              </div>
              <div className="panel">
                <div className="panel-head"><h2>Team on leave today</h2></div>
                {d.onLeaveToday.length === 0 ? <div className="panel-pad muted">Everyone is available.</div> : d.onLeaveToday.map((n) => <div className="list-row" key={n}>{n}</div>)}
              </div>
            </div>
          </>
        )}
      </Loading>
    </>
  );
}
