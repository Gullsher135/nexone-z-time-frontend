import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal, ProgressBar } from '../../components.jsx';
import { fmtDate, rs } from '../../lib/format.js';
import { PROJECT_STATUS, PROJECT_TONE } from './shared.jsx';

// Create or edit a project (admin only).
export function ProjectForm({ project, onClose, onSaved }) {
  const toast = useToast();
  const clients = useAsync(() => api.get('/flow/clients'), []);
  const team = useAsync(() => api.get('/crew/team'), []);
  const staff = (team.data?.items || []).filter((u) => ['admin', 'employee', 'intern'].includes(u.role));
  const [f, setF] = useState({
    name: project?.name || '', description: project?.description || '', client: project?.client?._id || '', status: project?.status || 'planning',
    startDate: project?.startDate || '', dueDate: project?.dueDate || '', budget: project?.budget || '', lead: project?.lead?._id || '',
    members: (project?.members || []).map((m) => m._id),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (id) => setF({ ...f, members: f.members.includes(id) ? f.members.filter((x) => x !== id) : [...f.members, id] });
  async function save(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const body = { ...f, budget: Number(f.budget) || 0, client: f.client || null, lead: f.lead || null };
      const r = project ? await api.patch(`/flow/projects/${project._id}`, body) : await api.post('/flow/projects', body);
      toast('Project saved');
      onSaved(r.project);
    } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal wide title={project ? 'Edit project' : 'New project'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="pj-form" disabled={busy}>{busy ? 'Saving...' : 'Save project'}</button></>}>
      <form id="pj-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <Field label="Project name"><input type="text" value={f.name} onChange={set('name')} required autoFocus /></Field>
        <Field label="Description"><textarea rows="3" value={f.description} onChange={set('description')} /></Field>
        <div className="grid2">
          <Field label="Client"><select value={f.client} onChange={set('client')}><option value="">No client (internal)</option>{(clients.data?.items || []).map((c) => <option key={c._id} value={c._id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}</select></Field>
          <Field label="Status"><select value={f.status} onChange={set('status')}>{Object.entries(PROJECT_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Start date"><input type="date" value={f.startDate} onChange={set('startDate')} /></Field>
          <Field label="Deadline"><input type="date" value={f.dueDate} onChange={set('dueDate')} /></Field>
          <Field label="Budget (Rs)" hint="Only you can see this."><input type="number" min="0" value={f.budget} onChange={set('budget')} /></Field>
          <Field label="Project lead" hint="The lead can add and edit cards."><select value={f.lead} onChange={set('lead')}><option value="">No lead</option>{staff.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select></Field>
        </div>
        <div><b>Team</b> <span className="muted small">(who can see this project and take cards)</span></div>
        <div className="checks">{staff.map((u) => <label key={u._id} className="check"><input type="checkbox" checked={f.members.includes(u._id)} onChange={() => toggle(u._id)} />{u.name}<span className="muted small"> {u.designation || u.role}</span></label>)}</div>
      </form>
    </Modal>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const base = admin ? '/admin/flow' : '/flow';
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(admin && sp.get('new') === '1');
  const state = useAsync(() => api.get(`/flow/projects${status ? `?status=${status}` : ''}`), [status]);
  return (
    <>
      <div className="page-head"><div><h1>Projects</h1><p className="sub">{admin ? 'Every project, with progress from its task board.' : 'Projects you are part of.'}</p></div>{admin && <button className="btn primary" onClick={() => setCreating(true)}>New project</button>}</div>
      <div className="tools" style={{ marginBottom: 14 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter"><option value="">All projects</option>{Object.entries(PROJECT_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No projects here">{admin ? 'Press New project to create one.' : 'You have not been added to a project yet.'}</Empty></div> : (
          <div className="proj-grid">
            {state.data.items.map((p) => (
              <Link key={p._id} to={`${base}/projects/${p._id}`} className="panel proj-card">
                <div className="row"><span className="muted small grow">{p.code}</span><span className={`chip ${PROJECT_TONE[p.status]}`}>{PROJECT_STATUS[p.status]}</span></div>
                <h3>{p.name}</h3>
                <div className="muted small">{p.client ? p.client.name : 'Internal project'}{p.lead ? ` · Lead ${p.lead.name}` : ''}</div>
                <ProgressBar value={p.progress.percent} label={`${p.name} progress`} />
                <div className="row small"><span className="muted grow">{p.progress.done} of {p.progress.total} cards done</span>{p.progress.overdue > 0 && <span className="chip bad">{p.progress.overdue} overdue</span>}</div>
                <div className="muted small">{p.dueDate ? `Deadline ${fmtDate(p.dueDate, true)}` : 'No deadline'}{admin && p.budget ? ` · ${rs(p.budget)}` : ''}</div>
              </Link>
            ))}
          </div>
        ))}
      </Loading>
      {creating && <ProjectForm onClose={() => setCreating(false)} onSaved={(p) => { setCreating(false); nav(`${base}/projects/${p._id}`); }} />}
    </>
  );
}
