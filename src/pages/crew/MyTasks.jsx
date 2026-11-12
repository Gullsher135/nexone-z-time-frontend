import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Loading, Tabs } from '../../components.jsx';
import { fmtDate } from '../../lib/format.js';
import { PriorityChip, STATUS_LABEL, ago } from './shared.jsx';

export function TaskCard({ t, onChange, admin = false }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function move(status) {
    setBusy(true);
    try { await api.post(`/crew/tasks/${t._id}/status`, { status }); onChange(); } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); }
  }
  async function comment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try { await api.post(`/crew/tasks/${t._id}/comments`, { text }); setText(''); onChange(); } catch (err) { toast(err.message, 'bad'); }
  }

  return (
    <div className={`task ${t.status}`}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <b className="grow title">{t.title}</b>
        {t.overdue && <span className="chip bad">Overdue</span>}
        <PriorityChip p={t.priority} />
        <span className={`chip ${t.status === 'done' ? 'ok' : t.status === 'doing' ? 'info' : 'muted'}`}>{STATUS_LABEL[t.status]}</span>
      </div>
      <div className="muted small">
        {admin && t.assignee ? `${t.assignee.name} · ` : ''}{t.dueDate ? `Due ${fmtDate(t.dueDate, true)}` : 'No deadline'}{t.createdBy?.name ? ` · from ${t.createdBy.name}` : ''}
      </div>
      {t.description && <p className="prose small">{t.description}</p>}
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {t.status === 'todo' && <button className="btn sm primary" disabled={busy} onClick={() => move('doing')}>Start</button>}
        {t.status === 'doing' && <button className="btn sm primary" disabled={busy} onClick={() => move('done')}>Mark done</button>}
        {t.status === 'doing' && <button className="btn sm" disabled={busy} onClick={() => move('todo')}>Back to to do</button>}
        {t.status === 'done' && <button className="btn sm" disabled={busy} onClick={() => move('doing')}>Reopen</button>}
        <button className="btn sm ghost" onClick={() => setOpen(!open)} aria-expanded={open}>Comments ({t.comments?.length || 0})</button>
      </div>
      {open && (
        <div className="comments">
          {(t.comments || []).map((c) => <div key={c._id} className="comment"><b>{c.author?.name || 'Someone'}</b> <span className="muted small">{ago(c.at)}</span><div>{c.text}</div></div>)}
          <form className="row" onSubmit={comment}>
            <input type="text" className="grow" placeholder="Add a comment or update" value={text} onChange={(e) => setText(e.target.value)} aria-label="Comment" maxLength={1000} />
            <button className="btn sm">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function MyTasks() {
  const [tab, setTab] = useState('open');
  const state = useAsync(() => api.get('/crew/tasks/mine'), []);
  const items = (state.data?.items || []).filter((t) => (tab === 'open' ? t.status !== 'done' : t.status === 'done'));
  const open = (state.data?.items || []).filter((t) => t.status !== 'done').length;

  return (
    <>
      <div className="page-head"><div><h1>My tasks</h1><p className="sub">Work assigned to you. Update the status as you go.</p></div></div>
      <Tabs tabs={[{ value: 'open', label: `Open (${open})` }, { value: 'done', label: 'Done' }]} value={tab} onChange={setTab} />
      <Loading state={state}>
        {state.data && (items.length === 0
          ? <div className="panel"><Empty title={tab === 'open' ? 'No open tasks' : 'Nothing finished yet'}>{tab === 'open' ? 'When the admin assigns you work, it shows up here.' : 'Completed tasks are kept here.'}</Empty></div>
          : <div className="stack">{items.map((t) => <TaskCard key={t._id} t={t} onChange={state.reload} />)}</div>)}
      </Loading>
    </>
  );
}
