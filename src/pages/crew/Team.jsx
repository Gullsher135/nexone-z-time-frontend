import { useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading } from '../../components.jsx';
import { ROLE_LABEL } from '../../lib/format.js';

export default function Team() {
  const [q, setQ] = useState('');
  const state = useAsync(() => api.get('/crew/team'), []);
  const items = useMemo(() => (state.data?.items || []).filter((p) => !q || `${p.name} ${p.designation || ''} ${p.department || ''}`.toLowerCase().includes(q.toLowerCase())), [state.data, q]);
  return (
    <>
      <div className="page-head"><div><h1>Team</h1><p className="sub">Everyone at NexoneZ Software House.</p></div></div>
      <div className="tools" style={{ marginBottom: 14 }}><input type="search" placeholder="Search by name, role or department" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search team" style={{ minWidth: 280 }} /></div>
      <Loading state={state}>
        {state.data && (items.length === 0 ? <div className="panel"><Empty title="Nobody found" /></div> : (
          <div className="team-grid">{items.map((p) => (
            <div className="panel panel-pad person" key={p._id}>
              <div className="avatar" aria-hidden="true">{p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</div>
              <div className="grow"><b>{p.name}</b>
                <div className="muted small">{p.designation || ROLE_LABEL[p.role]}{p.department ? ` · ${p.department}` : ''}</div>
                {p.email && <a className="small" href={`mailto:${p.email}`}>{p.email}</a>}</div>
            </div>
          ))}</div>
        ))}
      </Loading>
    </>
  );
}
