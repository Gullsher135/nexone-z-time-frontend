import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading } from '../../components.jsx';
import { ago } from './shared.jsx';

export default function Notices() {
  const state = useAsync(() => api.get('/crew/notices'), []);
  const items = state.data?.items || [];
  const unread = items.filter((n) => !n.read).length;

  async function read(n) {
    if (n.read) return;
    await api.post(`/crew/notices/${n._id}/read`).catch(() => {});
    state.reload();
  }
  async function all() { await api.post('/crew/notices/read-all').catch(() => {}); state.reload(); }

  return (
    <>
      <div className="page-head">
        <div><h1>Notices</h1><p className="sub">Announcements from the management of NexoneZ.</p></div>
        {unread > 0 && <button className="btn" onClick={all}>Mark all as read</button>}
      </div>
      <Loading state={state}>
        {state.data && (items.length === 0 ? <div className="panel"><Empty title="No notices">Company announcements will appear here.</Empty></div> : (
          <div className="stack">{items.map((n) => (
            <article key={n._id} className={`panel panel-pad notice ${n.read ? '' : 'unread'}`}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {n.pinned && <span className="tag">Pinned</span>}
                <h3 className="grow">{n.title}</h3>
                {!n.read && <span className="chip info">New</span>}
              </div>
              <div className="muted small">{n.author ? `${n.author} · ` : ''}{ago(n.createdAt)}</div>
              {n.body && <p className="prose" style={{ marginTop: 8 }}>{n.body}</p>}
              {!n.read && <div style={{ marginTop: 10 }}><button className="btn sm" onClick={() => read(n)}>Mark as read</button></div>}
            </article>
          ))}</div>
        ))}
      </Loading>
    </>
  );
}
