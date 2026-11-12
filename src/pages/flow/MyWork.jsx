import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Loading } from '../../components.jsx';
import { fmtDate } from '../../lib/format.js';
import { COLUMNS, NEXT, NEXT_LABEL, PRIORITY_TONE } from './shared.jsx';

export default function MyWork() {
  const toast = useToast();
  const state = useAsync(() => api.get('/flow/my-work'), []);
  async function quick(i) {
    try { await api.post(`/flow/items/${i._id}/status`, { status: NEXT[i.status] }); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  const label = Object.fromEntries(COLUMNS.map((c) => [c.key, c.label]));
  return (
    <>
      <div className="page-head"><div><h1>My work</h1><p className="sub">Cards assigned to you across all projects.</p></div></div>
      <Loading state={state}>
        {state.data && (
          <div className="dash-grid">
            <div className="panel"><div className="panel-head"><h2>Open cards ({state.data.items.length})</h2></div>
              {state.data.items.length === 0 ? <Empty title="Nothing assigned">New cards from your projects will show up here.</Empty> : state.data.items.map((i) => (
                <div className="list-row" key={i._id}>
                  <div className="grow">
                    <Link to={`/flow/projects/${i.project._id}`}><b>{i.title}</b></Link>
                    <div className="muted small">{i.project.name} · {label[i.status]}{i.dueDate ? ` · due ${fmtDate(i.dueDate, true)}` : ''}</div>
                  </div>
                  {i.overdue && <span className="chip bad">Overdue</span>}
                  <span className={`chip ${PRIORITY_TONE[i.priority]}`}>{i.priority}</span>
                  {NEXT[i.status] && <button className="btn sm primary" onClick={() => quick(i)}>{NEXT_LABEL[i.status]}</button>}
                </div>
              ))}
            </div>
            <div className="panel"><div className="panel-head"><h2>My projects</h2><Link to="/flow/projects" className="small">All</Link></div>
              {state.data.projects.length === 0 ? <div className="panel-pad muted">You are not on a project yet.</div> : state.data.projects.map((p) => (
                <Link key={p._id} to={`/flow/projects/${p._id}`} className="list-row linkrow"><div className="grow"><b>{p.name}</b><div className="muted small">{p.code}{p.dueDate ? ` · due ${fmtDate(p.dueDate, true)}` : ''}</div></div></Link>
              ))}
            </div>
          </div>
        )}
      </Loading>
    </>
  );
}
