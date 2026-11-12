import { useEffect, useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal, Tabs } from '../../components.jsx';
import { ROLE_LABEL, fmtDate, to12h, todayKey } from '../../lib/format.js';

const TABS = [
  { value: 'employee', label: 'Employees' },
  { value: 'intern', label: 'Interns' },
  { value: 'student', label: 'Students' },
  { value: 'admin', label: 'Admins' },
];

function Credentials({ info, onClose }) {
  const toast = useToast();
  const text = `NexoneZ Hub\nEmail: ${info.email}\nTemporary password: ${info.password}\nYou will be asked to choose your own password after logging in.`;
  return (
    <Modal title="Login details" onClose={onClose} footer={<button className="btn primary" onClick={onClose}>Done</button>}>
      <div className="stack">
        <div className="alert warn">Copy these details now. The temporary password is not shown again.</div>
        <div className="panel panel-pad">
          <div className="muted small">Name</div><div style={{ fontWeight: 600 }}>{info.name}</div>
          <div className="muted small" style={{ marginTop: 10 }}>Email</div><div style={{ fontWeight: 600 }}>{info.email}</div>
          <div className="muted small" style={{ marginTop: 10 }}>Temporary password</div>
          <div className="num" style={{ fontWeight: 600, fontSize: 20 }}>{info.password}</div>
        </div>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(text); toast('Copied'); }}>Copy login details</button>
      </div>
    </Modal>
  );
}

function PersonForm({ role, person, batches, onClose, onSaved }) {
  const toast = useToast();
  const p = person;
  const [f, setF] = useState({
    name: p?.name || '', email: p?.email || '', phone: p?.phone || '', cnic: p?.cnic || '',
    designation: p?.designation || '', department: p?.department || '',
    joiningDate: p?.joiningDate || todayKey(),
    shiftStart: p?.shift?.start || '09:00', shiftEnd: p?.shift?.end || '18:00', grace: p?.shift?.graceMinutes ?? 15,
    internStart: p?.internship?.startDate || todayKey(), internEnd: p?.internship?.endDate || '', mentor: p?.internship?.mentor || '',
    batch: p?.batch?._id || p?.batch || '', rollNo: p?.rollNo || '', admissionDate: p?.admissionDate || todayKey(),
    guardianName: p?.guardianName || '', guardianPhone: p?.guardianPhone || '',
    password: '', createLogin: false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const staff = role !== 'student';

  async function save(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const body = { role, name: f.name, email: f.email || undefined, phone: f.phone, cnic: f.cnic };
    if (staff) {
      Object.assign(body, {
        designation: f.designation, department: f.department, joiningDate: f.joiningDate,
        shift: { start: f.shiftStart, end: f.shiftEnd, graceMinutes: Number(f.grace) },
      });
      if (!p && f.password) body.password = f.password;
    }
    if (role === 'intern') body.internship = { startDate: f.internStart, endDate: f.internEnd || undefined, mentor: f.mentor };
    if (role === 'student') {
      if (!p && f.createLogin) { body.createLogin = true; if (f.password) body.password = f.password; }
      Object.assign(body, { batch: f.batch || undefined, rollNo: f.rollNo, admissionDate: f.admissionDate, guardianName: f.guardianName, guardianPhone: f.guardianPhone });
    }
    try {
      if (p) {
        const { role: _r, ...rest } = body;
        await api.patch(`/users/${p._id}`, rest);
        if (role === 'student' && f.password) {
          const r = await api.post(`/users/${p._id}/reset-password`, { password: f.password });
          toast('Changes saved and login set');
          onSaved({ name: f.name, email: f.email, password: r.tempPassword });
        } else {
          toast('Changes saved');
          onSaved();
        }
      } else {
        const r = await api.post('/users', body);
        toast(`${ROLE_LABEL[role]} added`);
        onSaved(r.tempPassword ? { name: r.user.name, email: r.user.email, password: r.tempPassword } : null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal wide title={`${p ? 'Edit' : 'Add'} ${ROLE_LABEL[role].toLowerCase()}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="person-form" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
      <form id="person-form" className="stack" onSubmit={save}>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <div className="form-grid">
          <Field label="Full name"><input type="text" value={f.name} onChange={set('name')} required /></Field>
          <Field label={staff ? 'Email (used to log in)' : 'Email (needed for a learning login)'}><input type="email" value={f.email} onChange={set('email')} required={staff} /></Field>
          <Field label="Phone"><input type="tel" value={f.phone} onChange={set('phone')} /></Field>
          <Field label="CNIC (optional)"><input type="text" value={f.cnic} onChange={set('cnic')} placeholder="00000-0000000-0" /></Field>

          {staff && (
            <>
              <Field label="Designation"><input type="text" value={f.designation} onChange={set('designation')} placeholder={role === 'intern' ? 'Web development intern' : 'Full-stack developer'} /></Field>
              <Field label="Department"><input type="text" value={f.department} onChange={set('department')} /></Field>
              <Field label="Joining date"><input type="date" value={f.joiningDate} onChange={set('joiningDate')} /></Field>
              {!p && <Field label="Password" hint="Leave empty to generate a temporary one."><input type="text" value={f.password} onChange={set('password')} minLength={8} autoComplete="off" /></Field>}
              <Field label="Shift starts"><input type="time" value={f.shiftStart} onChange={set('shiftStart')} /></Field>
              <Field label="Shift ends"><input type="time" value={f.shiftEnd} onChange={set('shiftEnd')} /></Field>
              <Field label="On-time window (minutes)" hint="Arrival within this many minutes of shift start is not late."><input type="number" min="0" max="120" value={f.grace} onChange={set('grace')} /></Field>
            </>
          )}

          {role === 'intern' && (
            <>
              <Field label="Internship starts"><input type="date" value={f.internStart} onChange={set('internStart')} /></Field>
              <Field label="Internship ends" hint="Login stops after this date."><input type="date" value={f.internEnd} onChange={set('internEnd')} /></Field>
              <Field label="Mentor" full><input type="text" value={f.mentor} onChange={set('mentor')} /></Field>
            </>
          )}

          {role === 'student' && (
            <>
              <Field label="Batch">
                <select value={f.batch} onChange={set('batch')} required>
                  <option value="">Choose a batch</option>
                  {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Roll number"><input type="text" value={f.rollNo} onChange={set('rollNo')} /></Field>
              <Field label="Admission date"><input type="date" value={f.admissionDate} onChange={set('admissionDate')} /></Field>
              {!p && (
                <label className="check full"><input type="checkbox" checked={f.createLogin} onChange={(e) => setF((x) => ({ ...x, createLogin: e.target.checked }))} /> Give this student a login for NexoneZ Learn (needs email)</label>
              )}
              {p && (
                <Field label="Login password" hint={f.email ? 'Optional. Type a password (8+ characters) to give this student a login or change it. Leave empty to keep as is.' : 'Add the email above first, then you can set a password.'} full><input type="text" value={f.password} onChange={set('password')} minLength={8} autoComplete="off" disabled={!f.email} /></Field>
              )}
              {!p && f.createLogin && (
                <Field label="Password" hint="Leave empty to generate a temporary one." full><input type="text" value={f.password} onChange={set('password')} minLength={8} autoComplete="off" /></Field>
              )}
              <Field label="Parent or guardian"><input type="text" value={f.guardianName} onChange={set('guardianName')} /></Field>
              <Field label="Guardian phone"><input type="tel" value={f.guardianPhone} onChange={set('guardianPhone')} /></Field>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}

function parseCsv(text) {
  const rows = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
    const out = []; let cur = ''; let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  });
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.toLowerCase());
  const hasHeader = head.some((h) => h === 'name');
  const idx = (names, fallback) => {
    const i = head.findIndex((h) => names.includes(h));
    return hasHeader ? i : fallback;
  };
  const iName = idx(['name'], 0);
  const iRoll = idx(['roll', 'rollno', 'roll no', 'roll number'], 1);
  const iPhone = idx(['phone', 'mobile'], 2);
  const iEmail = idx(['email'], 3);
  return (hasHeader ? rows.slice(1) : rows).map((r) => ({
    name: r[iName] || '', rollNo: iRoll >= 0 ? r[iRoll] : '', phone: iPhone >= 0 ? r[iPhone] : '', email: iEmail >= 0 ? r[iEmail] : '',
  }));
}

function ImportModal({ batches, onClose, onDone }) {
  const toast = useToast();
  const [batch, setBatch] = useState(batches[0]?._id || '');
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = parseCsv(text);

  async function readFile(e) {
    const file = e.target.files?.[0];
    if (file) setText(await file.text());
  }

  async function run() {
    setError('');
    setBusy(true);
    try {
      const r = await api.post('/users/import-students', { batch, students: rows });
      setResult(r);
      toast(`${r.created} students added`);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal wide title="Import students" onClose={onClose}
      footer={result ? <button className="btn primary" onClick={onClose}>Done</button> : (
        <><button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={run} disabled={busy || !rows.length || !batch}>{busy ? 'Importing...' : `Import ${rows.length} students`}</button></>
      )}>
      {result ? (
        <div className="stack">
          <div className="alert ok">{result.created} students added.</div>
          {result.errors.length > 0 && (
            <div className="alert warn">
              {result.errors.length} rows were skipped:
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {result.errors.slice(0, 10).map((e, i) => <li key={i}>Row {e.row}{e.name ? ` (${e.name})` : ''}: {e.message}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="stack">
          {error && <div className="alert bad" role="alert">{error}</div>}
          <Field label="Add to batch">
            <select value={batch} onChange={(e) => setBatch(e.target.value)}>
              {batches.length === 0 && <option value="">Create a batch first</option>}
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Upload a CSV file" hint="Columns: name, roll no, phone, email. A header row is optional; only name is required.">
            <input type="file" accept=".csv,text/csv,text/plain" onChange={readFile} />
          </Field>
          <Field label="Or paste rows here">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'name,roll no,phone\nAyesha Khan,1,0300 1234567\nBilal Ahmed,2,0311 7654321'} style={{ minHeight: 120, fontFamily: 'inherit' }} />
          </Field>
          {rows.length > 0 && <p className="muted small">{rows.length} students found. First: {rows[0].name || '(no name)'}.</p>}
        </div>
      )}
    </Modal>
  );
}

export default function People() {
  const toast = useToast();
  const [role, setRole] = useState('employee');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [editing, setEditing] = useState(null);   // null | 'new' | person
  const [creds, setCreds] = useState(null);
  const [importing, setImporting] = useState(false);
  const [batchFilter, setBatchFilter] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const batches = useAsync(() => api.get('/batches'), []);
  const state = useAsync(() => api.get(`/users${qs({ role, q: debounced, limit: 300, batch: role === 'student' ? batchFilter : '' })}`), [role, debounced, batchFilter]);
  const batchList = batches.data?.items || [];

  async function toggle(u) {
    try {
      await api.post(`/users/${u._id}/${u.isActive ? 'deactivate' : 'activate'}`);
      toast(u.isActive ? 'Deactivated. History is kept.' : 'Activated');
      state.reload();
    } catch (e) { toast(e.message, 'bad'); }
  }
  async function reset(u) {
    if (!window.confirm(`Create a new temporary password for ${u.name}?`)) return;
    try {
      const r = await api.post(`/users/${u._id}/reset-password`);
      setCreds({ name: u.name, email: u.email, password: r.tempPassword });
    } catch (e) { toast(e.message, 'bad'); }
  }
  async function remove(u) {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.del(`/users/${u._id}`);
      toast('Deleted');
      state.reload();
    } catch (e) {
      if (!/history/i.test(e.message)) return toast(e.message, 'bad');
      // Has attendance history: offer to deactivate (keeps history) or delete everything.
      if (window.confirm(`${u.name} has attendance history.\n\nPress OK to DELETE PERMANENTLY, including all attendance and leave records (reports will change).\n\nPress Cancel to keep the history (you can use Deactivate instead).`)) {
        try {
          await api.del(`/users/${u._id}?force=true`);
          toast('Deleted with all records');
          state.reload();
        } catch (e2) { toast(e2.message, 'bad'); }
      }
    }
  }

  const detail = (u) => {
    if (u.role === 'student') return `${u.batch?.name || 'No batch'}${u.rollNo ? ` · Roll ${u.rollNo}` : ''}`;
    const shift = `${to12h(u.shift?.start)} to ${to12h(u.shift?.end)}`;
    if (u.role === 'intern') return `${u.designation || 'Intern'} · until ${u.internship?.endDate ? fmtDate(u.internship.endDate, true) : 'not set'}`;
    return `${u.designation || ROLE_LABEL[u.role]}${u.role === 'employee' ? ` · ${shift}` : ''}`;
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>People</h1>
          <p className="sub">Add, edit and deactivate employees, interns, students and admins.</p>
        </div>
        <div className="tools">
          {role === 'student' && <button className="btn" onClick={() => setImporting(true)}>Import students</button>}
          <button className="btn primary" onClick={() => setEditing('new')}>Add {ROLE_LABEL[role].toLowerCase()}</button>
        </div>
      </div>

      <Tabs tabs={TABS} value={role} onChange={(v) => { setRole(v); setQ(''); setBatchFilter(''); }} />
      <div className="tools" style={{ marginBottom: 14 }}>
        <input type="search" placeholder="Search by name, email, phone or ID" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 280 }} aria-label="Search" />
        {role === 'student' && (
          <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} aria-label="Batch">
            <option value="">All batches</option>
            {batchList.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
      </div>

      <div className="panel table-wrap">
        <Loading state={state}>
          {state.data && (state.data.items.length === 0 ? (
            <Empty title={`No ${ROLE_LABEL[role].toLowerCase()}s found`}>{q ? 'Try a different search.' : `Use "Add ${ROLE_LABEL[role].toLowerCase()}" to create the first one.`}</Empty>
          ) : (
            <table className="table cards">
              <thead><tr><th>Name</th><th>Contact</th><th>Details</th><th>Status</th><th /></tr></thead>
              <tbody>
                {state.data.items.map((u) => (
                  <tr key={u._id} style={!u.isActive ? { opacity: 0.6 } : undefined}>
                    <td><div style={{ fontWeight: 600 }}>{u.name}</div><div className="muted small">{u.code}</div></td>
                    <td className="full"><div>{u.email || '-'}</div><div className="muted small">{u.phone}</div></td>
                    <td className="small">{detail(u)}</td>
                    <td><span className={`chip ${u.isActive ? 'ok' : 'muted'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="r nowrap">
                      <button className="btn sm" onClick={() => setEditing(u)}>Edit</button>{' '}
                      {(u.role !== 'student' || u.email) && <button className="btn sm" onClick={() => reset(u)}>{u.role === 'student' ? 'Login / reset password' : 'Reset password'}</button>}{' '}
                      <button className="btn sm" onClick={() => toggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>{' '}
                      <button className="btn sm danger" onClick={() => remove(u)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </Loading>
      </div>
      {state.data && <p className="muted small" style={{ marginTop: 10 }}>{state.data.total} in total</p>}

      {editing && (
        <PersonForm
          role={editing === 'new' ? role : editing.role}
          person={editing === 'new' ? null : editing}
          batches={batchList}
          onClose={() => setEditing(null)}
          onSaved={(c) => { setEditing(null); if (c) setCreds(c); state.reload(); batches.reload(); }}
        />
      )}
      {creds && <Credentials info={creds} onClose={() => setCreds(null)} />}
      {importing && <ImportModal batches={batchList} onClose={() => setImporting(false)} onDone={() => { state.reload(); batches.reload(); }} />}
    </div>
  );
}
