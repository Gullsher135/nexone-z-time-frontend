import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal, Tabs } from '../../components.jsx';
import { ROLE_LABEL } from '../../lib/format.js';

function Credentials({ info, onClose }) {
  const toast = useToast();
  const text = `NexoneZ Hub (teacher portal)\nEmail: ${info.email}\nTemporary password: ${info.password}\nYou will be asked to choose your own password after logging in.`;
  return (
    <Modal title="Teacher login details" onClose={onClose} footer={<button className="btn primary" onClick={onClose}>Done</button>}>
      <div className="stack">
        <div className="alert warn">Copy these details now. The temporary password is not shown again.</div>
        <div className="panel panel-pad">
          <div className="muted small">Name</div><div style={{ fontWeight: 600 }}>{info.name}</div>
          <div className="muted small" style={{ marginTop: 10 }}>Email (login)</div><div style={{ fontWeight: 600 }}>{info.email}</div>
          <div className="muted small" style={{ marginTop: 10 }}>Temporary password</div>
          <div className="num" style={{ fontWeight: 600, fontSize: 20 }}>{info.password}</div>
        </div>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(text); toast('Copied'); }}>Copy login details</button>
      </div>
    </Modal>
  );
}

// The courses a teacher teaches, as a checklist.
function CourseChecklist({ courses, value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  if (!courses.length) return <div className="muted small">No courses yet. Create a course first, then assign it here.</div>;
  return (
    <div className="pick-list">
      {courses.map((c) => (
        <label key={c._id} className="pick-row">
          <input type="checkbox" checked={value.includes(c._id)} onChange={() => toggle(c._id)} />
          <span className="grow"><b>{c.title}</b> <span className="muted small">{c.code}</span></span>
          {c.status !== 'published' && <span className="chip muted">Draft</span>}
        </label>
      ))}
    </div>
  );
}

function AddTeacher({ data, onClose, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState('new');
  const [f, setF] = useState({ name: '', email: '', phone: '', designation: '', password: '', userId: '' });
  const [courseIds, setCourseIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    if (mode === 'existing' && !f.userId) return setError('Choose the employee first.');
    setBusy(true);
    try {
      const body = mode === 'existing' ? { mode, userId: f.userId, courseIds } : { mode, ...f, password: f.password || undefined, courseIds };
      const r = await api.post('/lms/teachers', body);
      if (r.tempPassword) onDone({ name: f.name, email: f.email.toLowerCase().trim(), password: r.tempPassword });
      else { toast(`${r.teacher.name} can now teach. Their login has not changed.`); onDone(); }
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal wide title="Add teacher" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="teacher-form" disabled={busy}>{busy ? 'Saving...' : mode === 'new' ? 'Create teacher login' : 'Make teacher'}</button></>}>
      <div className="stack">
      <Tabs tabs={[{ value: 'new', label: 'New person' }, { value: 'existing', label: 'Existing employee' }]} value={mode} onChange={(v) => { setMode(v); setError(''); }} />
      <form id="teacher-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        {mode === 'new' ? (
          <>
            <p className="muted">For someone who does not work here yet. They get their own login that opens only the teacher portal.</p>
            <div className="form-grid">
              <Field label="Full name" full><input type="text" value={f.name} onChange={set('name')} required autoFocus /></Field>
              <Field label="Email (their login)"><input type="email" value={f.email} onChange={set('email')} required /></Field>
              <Field label="Phone"><input type="tel" value={f.phone} onChange={set('phone')} /></Field>
              <Field label="Designation"><input type="text" value={f.designation} onChange={set('designation')} placeholder="Web development teacher" /></Field>
              <Field label="Password" hint="Leave empty to generate a temporary one. They must change it at first login."><input type="text" value={f.password} onChange={set('password')} minLength={8} autoComplete="off" /></Field>
            </div>
          </>
        ) : (
          <>
            <p className="muted">For someone who already works here as an employee or intern. No new login is created: they keep signing in the way they do now, and the teacher portal appears for them.</p>
            <Field label="Employee">
              <select value={f.userId} onChange={set('userId')} required>
                <option value="">Choose an employee</option>
                {data.candidates.map((u) => <option key={u._id} value={u._id}>{u.name} · {u.code}{u.designation ? ` · ${u.designation}` : ''}</option>)}
              </select>
            </Field>
            {data.candidates.length === 0 && <div className="muted small">Every active employee and intern is already a teacher.</div>}
          </>
        )}
        <Field label="Courses to teach" hint="Optional. You can change this any time.">
          <CourseChecklist courses={data.courses} value={courseIds} onChange={setCourseIds} />
        </Field>
      </form>
      </div>
    </Modal>
  );
}

function EditCourses({ teacher, courses, onClose, onDone }) {
  const toast = useToast();
  const [ids, setIds] = useState(teacher.courses.map((c) => c._id));
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try { await api.put(`/lms/teachers/${teacher._id}/courses`, { courseIds: ids }); toast('Courses updated'); onDone(); } catch (e) { toast(e.message, 'bad'); setBusy(false); }
  }
  return (
    <Modal title={`Courses of ${teacher.name}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
      <CourseChecklist courses={courses} value={ids} onChange={setIds} />
    </Modal>
  );
}

export default function Teachers() {
  const toast = useToast();
  const state = useAsync(() => api.get('/lms/teachers'), []);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creds, setCreds] = useState(null);
  const d = state.data;

  async function resetPassword(t) {
    if (!window.confirm(`Create a new temporary password for ${t.name}? Their current password will stop working.`)) return;
    try { const r = await api.post(`/users/${t._id}/reset-password`, {}); setCreds({ name: t.name, email: t.email, password: r.tempPassword }); } catch (e) { toast(e.message, 'bad'); }
  }
  async function toggleActive(t) {
    try { await api.post(`/users/${t._id}/${t.isActive ? 'deactivate' : 'activate'}`); toast(t.isActive ? 'Teacher deactivated' : 'Teacher activated'); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  async function removeAccess(t) {
    if (!window.confirm(`Take teacher access away from ${t.name}? They stay an employee with the same login, but lose their courses here.`)) return;
    try { await api.del(`/lms/teachers/${t._id}`); toast('Teacher access removed'); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Teachers</h1>
          <p className="sub">Add the people who teach and give them courses. Certificates stay with the admin.</p>
        </div>
        <button className="btn primary" onClick={() => setAdding(true)} disabled={!d}>Add teacher</button>
      </div>

      <Loading state={state}>
        {d && (d.items.length === 0 ? (
          <div className="panel"><Empty title="No teachers yet">Use "Add teacher" to create a login for a new teacher, or give an existing employee teacher access.</Empty></div>
        ) : (
          <div className="panel table-wrap">
            <table className="table cards">
              <thead><tr><th>Teacher</th><th>Account</th><th>Courses</th><th>Status</th><th className="r"> </th></tr></thead>
              <tbody>
                {d.items.map((t) => (
                  <tr key={t._id}>
                    <td className="full"><div className="title" style={{ fontWeight: 600 }}>{t.name}</div><div className="muted small">{t.code}{t.email ? ` · ${t.email}` : ''}</div></td>
                    <td>
                      {t.type === 'new' ? <span className="chip info">Teacher login</span> : <span className="chip muted">{ROLE_LABEL[t.role]}</span>}
                      {t.designation && <div className="muted small">{t.designation}</div>}
                    </td>
                    <td style={{ minWidth: 180 }}>
                      {t.courses.length === 0 ? <span className="muted">None yet</span> : <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{t.courses.map((c) => <span key={c._id} className="tag">{c.title}</span>)}</div>}
                    </td>
                    <td><span className={`chip ${t.isActive ? 'ok' : 'muted'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="r">
                      <button className="btn sm primary" onClick={() => setEditing(t)}>Courses</button>{' '}
                      {t.type === 'new' && <button className="btn sm" onClick={() => resetPassword(t)}>Reset password</button>}{' '}
                      {t.type === 'new'
                        ? <button className="btn sm ghost" onClick={() => toggleActive(t)}>{t.isActive ? 'Deactivate' : 'Activate'}</button>
                        : <button className="btn sm ghost" onClick={() => removeAccess(t)}>Remove access</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Loading>

      {adding && <AddTeacher data={d} onClose={() => setAdding(false)} onDone={(c) => { setAdding(false); if (c) setCreds(c); state.reload(); }} />}
      {editing && <EditCourses teacher={editing} courses={d.courses} onClose={() => setEditing(null)} onDone={() => { setEditing(null); state.reload(); }} />}
      {creds && <Credentials info={creds} onClose={() => setCreds(null)} />}
    </>
  );
}
