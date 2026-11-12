import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Field, Loading, Modal, ProgressBar } from '../../components.jsx';
import { fmtDate, rs } from '../../lib/format.js';
import { ProjectForm } from './Projects.jsx';
import { Avatar, COLUMNS, NEXT, NEXT_LABEL, PRIORITY_TONE, PROJECT_STATUS, PROJECT_TONE, isLate } from './shared.jsx';

function CardForm({ project, item, onClose, onSaved }) {
  const toast = useToast();
  const team = [...(project.lead ? [project.lead] : []), ...project.members.filter((m) => m._id !== project.lead?._id)];
  const [f, setF] = useState({ title: item?.title || '', description: item?.description || '', assignee: item?.assignee?._id || '', priority: item?.priority || 'medium', dueDate: item?.dueDate || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { item ? await api.patch(`/flow/items/${item._id}`, f) : await api.post(`/flow/projects/${project._id}/items`, f); toast('Card saved'); onSaved(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal title={item ? 'Edit card' : 'New card'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="cd-form" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
      <form id="cd-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <Field label="What needs to be done"><input type="text" value={f.title} onChange={set('title')} required autoFocus /></Field>
        <Field label="Details"><textarea rows="3" value={f.description} onChange={set('description')} /></Field>
        <div className="grid2">
          <Field label="Assign to"><select value={f.assignee} onChange={set('assignee')}><option value="">Nobody yet</option>{team.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}</select></Field>
          <Field label="Priority"><select value={f.priority} onChange={set('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
          <Field label="Due date"><input type="date" value={f.dueDate} onChange={set('dueDate')} /></Field>
        </div>
        {team.length === 0 && <div className="alert warn">Add people to the project team first, then you can assign cards.</div>}
      </form>
    </Modal>
  );
}

function CardDetail({ item, project, canManage, me, onClose, onChanged, onEdit }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const mine = item.assignee?._id === me;
  const canMove = canManage || mine;
  async function move(status) {
    try { await api.post(`/flow/items/${item._id}/status`, { status }); onChanged(); } catch (e) { toast(e.message, 'bad'); }
  }
  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try { await api.post(`/flow/items/${item._id}/comments`, { text }); setText(''); onChanged(); } catch (err) { toast(err.message, 'bad'); }
  }
  async function remove() {
    if (!window.confirm('Delete this card?')) return;
    try { await api.del(`/flow/items/${item._id}`); onChanged(); onClose(); } catch (e) { toast(e.message, 'bad'); }
  }
  return (
    <Modal title={item.title} onClose={onClose} footer={canManage && <><button className="btn ghost" onClick={remove}>Delete</button><button className="btn" onClick={onEdit}>Edit</button></>}>
      <div className="stack">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className={`chip ${PRIORITY_TONE[item.priority]}`}>{item.priority} priority</span>
          {isLate(item.dueDate, item.status) && <span className="chip bad">Overdue</span>}
          <span className="muted small">{item.assignee ? `Assigned to ${item.assignee.name}` : 'Not assigned'}{item.dueDate ? ` · due ${fmtDate(item.dueDate, true)}` : ''}</span>
        </div>
        {item.description && <p className="prose">{item.description}</p>}
        {canMove && <div><div className="muted small" style={{ marginBottom: 6 }}>Move to</div><div className="seg">{COLUMNS.map((c) => <button key={c.key} type="button" className={item.status === c.key ? 'on' : ''} onClick={() => item.status !== c.key && move(c.key)}>{c.label}</button>)}</div></div>}
        <div className="comments">
          <b>Comments ({item.comments.length})</b>
          {item.comments.map((c) => <div key={c._id} className="comment"><b>{c.author?.name || 'Someone'}</b> <span className="muted small">{new Date(c.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span><div>{c.text}</div></div>)}
          <form className="row" onSubmit={send}><input type="text" className="grow" placeholder="Add an update" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} aria-label="Comment" /><button className="btn sm">Send</button></form>
        </div>
      </div>
    </Modal>
  );
}

export default function Board() {
  const { id } = useParams();
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const base = admin ? '/admin/flow' : '/flow';
  const nav = useNavigate();
  const toast = useToast();
  const state = useAsync(() => api.get(`/flow/projects/${id}`), [id]);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const d = state.data;
  const current = d && open ? d.items.find((i) => i._id === open) : null;

  async function quick(item) {
    try { await api.post(`/flow/items/${item._id}/status`, { status: NEXT[item.status] }); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  async function setStatus(status) {
    try { await api.patch(`/flow/projects/${id}`, { status }); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  async function removeProject() {
    if (!window.confirm(`Delete ${d.project.name} and all its cards? This cannot be undone.`)) return;
    try { await api.del(`/flow/projects/${id}`); nav(`${base}/projects`); } catch (e) { toast(e.message, 'bad'); }
  }

  return (
    <Loading state={state}>
      {d && (
        <>
          <div className="page-head">
            <div>
              <div className="muted small"><Link to={`${base}/projects`}>Projects</Link> / {d.project.code}</div>
              <h1>{d.project.name}</h1>
              <p className="sub">{d.project.client ? d.project.client.name : 'Internal project'}{d.project.lead ? ` · Lead ${d.project.lead.name}` : ''}{d.project.dueDate ? ` · Deadline ${fmtDate(d.project.dueDate, true)}` : ''}{admin && d.project.budget ? ` · Budget ${rs(d.project.budget)}` : ''}</p>
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {admin ? <select value={d.project.status} onChange={(e) => setStatus(e.target.value)} aria-label="Project status">{Object.entries(PROJECT_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> : <span className={`chip ${PROJECT_TONE[d.project.status]}`}>{PROJECT_STATUS[d.project.status]}</span>}
              {d.canManage && d.project.status !== 'completed' && <button className="btn primary" onClick={() => setForm({})}>Add card</button>}
              {admin && <button className="btn" onClick={() => setEditing(true)}>Edit project</button>}
            </div>
          </div>
          <div className="panel panel-pad stack" style={{ marginBottom: 16 }}>
            <div className="row small"><b className="grow">{d.project.progress.percent}% complete</b><span className="muted">{d.project.progress.done} of {d.project.progress.total} cards{d.project.progress.overdue ? `, ${d.project.progress.overdue} overdue` : ''}</span></div>
            <ProgressBar value={d.project.progress.percent} label="Project progress" />
            {d.project.description && <p className="prose small" style={{ margin: 0 }}>{d.project.description}</p>}
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}><span className="muted small">Team:</span>{d.project.members.length === 0 ? <span className="muted small">nobody yet</span> : d.project.members.map((m) => <span key={m._id} className="chip muted"><Avatar name={m.name} size={18} /> {m.name}</span>)}</div>
          </div>
          <div className="board">
            {COLUMNS.map((col) => {
              const cards = d.items.filter((i) => i.status === col.key);
              return (
                <section key={col.key} className={`col col-${col.key}`} aria-label={col.label}>
                  <h3>{col.label} <span className="count">{cards.length}</span></h3>
                  {cards.length === 0 && <div className="col-empty muted small">Nothing here</div>}
                  {cards.map((i) => {
                    const mine = i.assignee?._id === user._id;
                    const canMove = (d.canManage || mine) && NEXT[i.status];
                    return (
                      <div key={i._id} className={`kcard ${isLate(i.dueDate, i.status) ? 'late' : ''}`}>
                        <button type="button" className="kcard-main" onClick={() => setOpen(i._id)}>
                          <span className={`dot ${i.priority}`} aria-label={`${i.priority} priority`} />
                          <b>{i.title}</b>
                        </button>
                        <div className="kcard-meta">
                          {i.assignee ? <Avatar name={i.assignee.name} /> : <span className="muted small">Unassigned</span>}
                          <span className="grow" />
                          {i.dueDate && <span className={`small ${isLate(i.dueDate, i.status) ? 'late-t' : 'muted'}`}>{fmtDate(i.dueDate)}</span>}
                          {i.comments.length > 0 && <span className="muted small">{i.comments.length} comment{i.comments.length > 1 ? 's' : ''}</span>}
                        </div>
                        {canMove && <button className="btn sm kcard-go" onClick={() => quick(i)}>{NEXT_LABEL[i.status]}</button>}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
          {admin && <p style={{ marginTop: 24 }}><button className="btn ghost sm" onClick={removeProject}>Delete this project</button></p>}
          {current && !form && <CardDetail item={current} project={d.project} canManage={d.canManage} me={user._id} onClose={() => setOpen(null)} onChanged={state.reload} onEdit={() => setForm(current)} />}
          {form && <CardForm project={d.project} item={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); state.reload(); }} />}
          {editing && <ProjectForm project={d.project} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); state.reload(); }} />}
        </>
      )}
    </Loading>
  );
}
