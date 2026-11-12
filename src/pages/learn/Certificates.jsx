import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading } from '../../components.jsx';

export default function Certificates() {
  const state = useAsync(() => api.get('/lms/courses'), []);
  const items = (state.data?.items || []).filter((c) => c.certificate);
  return (
    <>
      <div className="page-head"><div><h1>Certificates</h1><p className="sub">Finish every lesson of a course to earn its certificate. Anyone can verify it with its code.</p></div></div>
      <Loading state={state}>
        {state.data && (items.length === 0
          ? <div className="panel"><Empty title="No certificates yet">Complete a course and your certificate will appear here.</Empty></div>
          : <div className="panel">{items.map((c) => (
            <div className="list-row" key={c._id}>
              <div className="grow"><div style={{ fontWeight: 600 }}>{c.title}</div><div className="muted small">Certificate {c.certificate}</div></div>
              <Link className="btn primary sm" to={`/verify/${c.certificate}`}>View and print</Link>
            </div>
          ))}</div>)}
      </Loading>
    </>
  );
}
