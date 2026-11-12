import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal } from '../../components.jsx';
import { longDate, SEVERITY_LABEL } from '../../documents.jsx';

const TYPE = { internship: 'Internship certificate', experience: 'Experience letter', warning: 'Warning / notice' };
const SEV_TONE = { notice: 'info', warning: 'warn', final: 'bad' };

function IssueModal({ preset, onClose, onSaved }) {
  const toast = useToast();
  const people = useAsync(() => api.get('/users?role=employee,intern&limit=500'), []);
  const [type, setType] = useState(preset?.type || 'experience');
  const [userId, setUserId] = useState(preset?.userId || '');
  const [f, setF] = useState({ designation: '', from: '', to: '', grade: '', remark: '', severity: 'warning', subject: '', reason: '' });
  const [projectIds, setProjectIds] = useState([]);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function pick(id, t = type) {
    setUserId(id);
    setInfo(null);
    setProjectIds([]);
    if (!id) return;
    try {
      const r = await api.get(`/docs/suggest/${id}`);
      setInfo(r);
      const u = r.user;
      setF((x) => ({ ...x, designation: u.designation || '', from: (t === 'internship' ? u.internship?.startDate : u.joiningDate) || '', to: t === 'internship' ? u.internship?.endDate || '' : '' }));
    } catch (e) { setError(e.message); }
  }
  // when opened from the "ready to issue" list
  useEffect(() => { if (preset?.userId) pick(preset.userId, preset.type); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = (people.data?.items || []).filter((u) => (type === 'internship' ? u.role === 'intern' : type === 'warning' ? u.isActive : true));
  const showProjects = type !== 'warning' && info?.projects?.length > 0;

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const body = { type, userId, ...f, projectIds };
      const r = await api.post('/docs/letters', body);
      toast('Issued');
      onSaved(r.letter);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal wide title="Issue a letter" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="lt-form" disabled={busy || !userId}>{busy ? 'Issuing...' : 'Issue'}</button></>}>
      <form id="lt-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <div className="grid2">
          <Field label="Type"><select value={type} onChange={(e) => { setType(e.target.value); pick('', e.target.value); }}>{Object.entries(TYPE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Person"><select value={userId} onChange={(e) => pick(e.target.value)} required><option value="">Choose...</option>{list.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role}{u.isActive ? '' : ', left'})</option>)}</select></Field>
        </div>
        {userId && info && type !== 'warning' && (
          <>
            <div className="grid2">
              <Field label="Designation"><input type="text" value={f.designation} onChange={set('designation')} placeholder="e.g. Full-stack developer" /></Field>
              <Field label="Performance" hint="Optional."><select value={f.grade} onChange={set('grade')}><option value="">Not stated</option>{info.grades.map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="From"><input type="date" value={f.from} onChange={set('from')} required /></Field>
              <Field label={type === 'experience' ? 'To' : 'To (end of internship)'} hint={type === 'experience' ? 'Leave empty if the person is still working here.' : null}><input type="date" value={f.to} onChange={set('to')} required={type === 'internship'} /></Field>
            </div>
            {showProjects && (
              <div><b>Projects to mention</b> <span className="muted small">(taken from NexoneZ Flow)</span>
                <div className="checks" style={{ marginTop: 6 }}>{info.projects.map((p) => (
                  <label key={p._id} className="check"><input type="checkbox" checked={projectIds.includes(p._id)} onChange={() => setProjectIds(projectIds.includes(p._id) ? projectIds.filter((x) => x !== p._id) : [...projectIds, p._id])} />{p.name}<span className="muted small"> {p.cardsDone} tasks done</span></label>
                ))}</div></div>
            )}
            <Field label="Remark" hint="Optional. A line about their work. Leave empty for the standard wording."><textarea rows="3" value={f.remark} onChange={set('remark')} maxLength={1500} /></Field>
          </>
        )}
        {userId && type === 'warning' && (
          <>
            <Field label="How serious"><div className="seg">{Object.entries(SEVERITY_LABEL).map(([v, l]) => <button type="button" key={v} className={f.severity === v ? 'on' : ''} onClick={() => setF({ ...f, severity: v })}>{l}</button>)}</div></Field>
            <Field label="Subject"><input type="text" value={f.subject} onChange={set('subject')} placeholder="e.g. Repeated late arrival" maxLength={140} required /></Field>
            <Field label="What happened" hint="Be specific: dates, what was expected and what happened. The person sees this in their portal."><textarea rows="5" value={f.reason} onChange={set('reason')} maxLength={3000} required /></Field>
          </>
        )}
        {userId && !info && !error && <p className="muted">Loading details...</p>}
      </form>
    </Modal>
  );
}

export default function AdminLetters() {
  const toast = useToast();
  const [type, setType] = useState('');
  const [issue, setIssue] = useState(null);
  const state = useAsync(() => api.get(`/docs/letters${type ? `?type=${type}` : ''}`), [type]);
  const elig = useAsync(() => api.get('/docs/eligible'), []);
  const reload = () => { state.reload(); elig.reload(); };

  async function revoke(l) {
    const reason = window.prompt(`Why are you revoking this ${TYPE[l.type].toLowerCase()} for ${l.person.name}?`);
    if (!reason) return;
    try { await api.post(`/docs/letters/${l._id}/revoke`, { reason }); toast('Revoked'); reload(); } catch (e) { toast(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head"><div><h1>Letters and certificates</h1><p className="sub">Internship certificates, experience letters and warnings. Certificates and experience letters have a QR code anyone can scan to check they are real.</p></div><button className="btn primary" onClick={() => setIssue({})}>Issue a letter</button></div>

      {elig.data?.items.length > 0 && (
        <div className="alert warn" style={{ marginBottom: 16 }}>
          <b>Internship finished:</b> these interns are ready for a certificate.
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{elig.data.items.map((u) => <button key={u._id} className="btn sm" onClick={() => setIssue({ type: 'internship', userId: u._id })}>{u.name} (ended {longDate(u.internship.endDate)})</button>)}</div>
        </div>
      )}

      <div className="tools" style={{ marginBottom: 14 }}>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type filter"><option value="">All letters</option>{Object.entries(TYPE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="Nothing issued yet">Press Issue a letter to create the first one.</Empty></div> : (
          <div className="panel table-wrap">
            <table className="table cards">
              <thead><tr><th>Person</th><th>Document</th><th>Date</th><th>Status</th><th className="r"> </th></tr></thead>
              <tbody>{state.data.items.map((l) => (
                <tr key={l._id}>
                  <td className="full"><div className="title" style={{ fontWeight: 600 }}>{l.person.name}</div><div className="muted small">{l.person.code} · {l.refNo}</div></td>
                  <td>{TYPE[l.type]}{l.type === 'warning' && <> <span className={`chip ${SEV_TONE[l.data.severity]}`}>{SEVERITY_LABEL[l.data.severity]}</span><div className="muted small">{l.data.subject}</div></>}</td>
                  <td>{longDate(l.issuedAt)}</td>
                  <td>{l.status === 'revoked' ? <span className="chip bad">Revoked</span> : l.type === 'warning' ? (l.acknowledgedAt ? <span className="chip ok">Acknowledged</span> : <span className="chip warn">Not yet read</span>) : <span className="chip ok">Issued</span>}</td>
                  <td className="r"><a className="btn sm" href={`/print/letter/${l._id}`} target="_blank" rel="noreferrer">View</a>{l.status === 'issued' && <>{' '}<button className="btn sm ghost" onClick={() => revoke(l)}>Revoke</button></>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ))}
      </Loading>
      {issue && <IssueModal preset={issue.userId ? issue : null} onClose={() => setIssue(null)} onSaved={() => { setIssue(null); reload(); }} />}
    </>
  );
}
