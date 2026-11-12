import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading, ProgressBar } from '../../components.jsx';
import { fmtDate } from '../../lib/format.js';
import { PROJECT_STATUS, PROJECT_TONE } from './shared.jsx';

export default function FlowHome() {
  const ov = useAsync(() => api.get('/flow/overview'), []);
  const pr = useAsync(() => api.get('/flow/projects?status=active'), []);
  const o = ov.data;
  return (
    <>
      <div className="page-head"><div><h1>NexoneZ Flow</h1><p className="sub">Client projects, task boards and delivery.</p></div><Link to="/admin/flow/projects?new=1" className="btn primary">New project</Link></div>
      <Loading state={ov}>
        {o && (
          <>
            <div className="panel kpis" style={{ marginBottom: 20 }}>
              <div className="kpi"><div className="v">{o.byStatus.active}</div><div className="l">Active projects</div></div>
              <div className="kpi"><div className="v">{o.openCards}</div><div className="l">Open cards</div></div>
              <div className="kpi"><div className="v" style={o.overdueCards ? { color: 'var(--bad)' } : null}>{o.overdueCards}</div><div className="l">Overdue cards</div></div>
              <div className="kpi"><div className="v">{o.clients}</div><div className="l">Clients</div></div>
            </div>
            {o.lateProjects.length > 0 && <div className="alert warn" style={{ marginBottom: 16 }}><b>Past deadline:</b> {o.lateProjects.map((p) => <span key={p._id}><Link to={`/admin/flow/projects/${p._id}`}>{p.name}</Link> (due {fmtDate(p.dueDate, true)}) </span>)}</div>}
          </>
        )}
      </Loading>
      <div className="panel">
        <div className="panel-head"><h2>Active projects</h2><Link to="/admin/flow/projects" className="small">All projects</Link></div>
        <Loading state={pr}>
          {pr.data && (pr.data.items.length === 0 ? <Empty title="No active projects">Create a project and set its status to Active.</Empty> : pr.data.items.map((p) => (
            <Link key={p._id} to={`/admin/flow/projects/${p._id}`} className="list-row linkrow">
              <div className="grow"><b>{p.name}</b><div className="muted small">{p.code}{p.client ? ` · ${p.client.name}` : ''}{p.dueDate ? ` · due ${fmtDate(p.dueDate, true)}` : ''}</div></div>
              <div style={{ width: 120 }}><ProgressBar value={p.progress.percent} label={`${p.name} progress`} /><div className="muted small">{p.progress.done}/{p.progress.total} done</div></div>
              <span className={`chip ${PROJECT_TONE[p.status]}`}>{PROJECT_STATUS[p.status]}</span>
            </Link>
          )))}
        </Loading>
      </div>
    </>
  );
}
