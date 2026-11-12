import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useAuth } from '../../lib/auth.jsx';
import { useToast } from '../../lib/toast.jsx';
import { fmtDate } from '../../lib/format.js';
import { Cover, Empty, Field, Loading, Modal, ProgressBar, Tabs, LEVEL_LABEL } from '../../components.jsx';

const TABS = [
  { value: 'content', label: 'Lessons' },
  { value: 'students', label: 'Students' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'quizzes', label: 'Quizzes' },
  { value: 'updates', label: 'Updates' },
  { value: 'details', label: 'Details' },
];
const LESSON_TYPES = [
  { value: 'reading', label: 'Reading' },
  { value: 'video', label: 'Video link' },
  { value: 'link', label: 'Web link' },
  { value: 'file', label: 'File link' },
];
const swap = (arr, i, j) => {
  const a = [...arr];
  if (j < 0 || j >= a.length) return a;
  [a[i], a[j]] = [a[j], a[i]];
  return a;
};

// ---------- Lessons ----------
function Curriculum({ course, reload }) {
  const toast = useToast();
  const [sections, setSections] = useState(() => JSON.parse(JSON.stringify(course.sections || [])));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null); // lesson being edited, as "s-l"

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = (fn) => { setSections((s) => fn(JSON.parse(JSON.stringify(s)))); setDirty(true); };

  async function save() {
    setBusy(true);
    try {
      await api.put(`/lms/courses/${course._id}/curriculum`, { sections });
      toast('Lessons saved');
      setDirty(false);
      reload();
    } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); }
  }

  return (
    <div className="stack">
      {sections.length === 0 && <div className="panel"><Empty title="No lessons yet">Add a section (a chapter or week), then add lessons inside it.</Empty></div>}
      {sections.map((s, si) => (
        <div className="panel" key={s._id || `n${si}`}>
          <div className="panel-head">
            <input className="inline-title" type="text" value={s.title} placeholder="Section title" aria-label="Section title" onChange={(e) => change((x) => { x[si].title = e.target.value; return x; })} />
            <div className="row" style={{ gap: 4 }}>
              <button className="btn sm ghost" aria-label="Move section up" disabled={si === 0} onClick={() => change((x) => swap(x, si, si - 1))}>Up</button>
              <button className="btn sm ghost" aria-label="Move section down" disabled={si === sections.length - 1} onClick={() => change((x) => swap(x, si, si + 1))}>Down</button>
              <button className="btn sm ghost" onClick={() => { if (!s.lessons.length || window.confirm('Delete this section and its lessons?')) change((x) => { x.splice(si, 1); return x; }); }}>Delete</button>
            </div>
          </div>
          {s.lessons.map((l, li) => {
            const key = `${si}-${li}`;
            return (
              <div className="lesson-edit" key={l._id || `n${li}`}>
                <div className="list-row">
                  <button className="lesson-toggle grow" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>
                    <span className="tag">{LESSON_TYPES.find((t) => t.value === l.type)?.label || 'Reading'}</span>
                    <span className="title">{l.title || 'Untitled lesson'}</span>
                  </button>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn sm ghost" aria-label="Move lesson up" disabled={li === 0} onClick={() => change((x) => { x[si].lessons = swap(x[si].lessons, li, li - 1); return x; })}>Up</button>
                    <button className="btn sm ghost" aria-label="Move lesson down" disabled={li === s.lessons.length - 1} onClick={() => change((x) => { x[si].lessons = swap(x[si].lessons, li, li + 1); return x; })}>Down</button>
                    <button className="btn sm ghost" onClick={() => change((x) => { x[si].lessons.splice(li, 1); return x; })}>Remove</button>
                  </div>
                </div>
                {open === key && (
                  <div className="form-grid lesson-form">
                    <Field label="Lesson title" full><input type="text" value={l.title} onChange={(e) => change((x) => { x[si].lessons[li].title = e.target.value; return x; })} /></Field>
                    <Field label="Type">
                      <select value={l.type || 'reading'} onChange={(e) => change((x) => { x[si].lessons[li].type = e.target.value; return x; })}>
                        {LESSON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Minutes"><input type="number" min="0" value={l.durationMin ?? ''} onChange={(e) => change((x) => { x[si].lessons[li].durationMin = e.target.value ? Number(e.target.value) : undefined; return x; })} /></Field>
                    {(l.type || 'reading') !== 'reading' && (
                      <Field label="Link" full hint={l.type === 'video' ? 'A YouTube, Vimeo or Google Drive video link.' : 'Starts with https://'}>
                        <input type="url" value={l.url || ''} onChange={(e) => change((x) => { x[si].lessons[li].url = e.target.value; return x; })} placeholder="https://" />
                      </Field>
                    )}
                    <Field label={(l.type || 'reading') === 'reading' ? 'Lesson text' : 'Notes (optional)'} full>
                      <textarea rows={(l.type || 'reading') === 'reading' ? 9 : 3} value={l.content || ''} onChange={(e) => change((x) => { x[si].lessons[li].content = e.target.value; return x; })} />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
          <div className="panel-pad" style={{ paddingTop: 12 }}>
            <button className="btn sm" onClick={() => { change((x) => { x[si].lessons.push({ title: '', type: 'reading' }); return x; }); setOpen(`${si}-${s.lessons.length}`); }}>Add lesson</button>
          </div>
        </div>
      ))}
      <div className="row save-bar">
        <button className="btn" onClick={() => change((x) => { x.push({ title: `Section ${x.length + 1}`, lessons: [] }); return x; })}>Add section</button>
        <div className="grow" />
        {dirty && <span className="muted small">Unsaved changes</span>}
        <button className="btn primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving...' : 'Save lessons'}</button>
      </div>
    </div>
  );
}

// ---------- Students ----------
function EnrollModal({ course, onClose, onDone }) {
  const toast = useToast();
  const pool = useAsync(() => api.get('/lms/pool'), []);
  const [batchId, setBatchId] = useState('');
  const [picked, setPicked] = useState(new Set());
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useMemo(() => (pool.data?.students || []).filter((s) => !q || `${s.name} ${s.code} ${s.rollNo || ''}`.toLowerCase().includes(q.toLowerCase())), [pool.data, q]);
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function go() {
    setBusy(true);
    try {
      const r = await api.post(`/lms/courses/${course._id}/enroll`, { studentIds: [...picked], batchId: batchId || undefined });
      toast(`${r.added} enrolled${r.skipped ? `, ${r.skipped} already in the course` : ''}`);
      onDone();
    } catch (e) { toast(e.message, 'bad'); setBusy(false); }
  }

  return (
    <Modal wide title="Enrol students" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={go} disabled={busy || (!picked.size && !batchId)}>{busy ? 'Enrolling...' : 'Enrol'}</button></>}>
      <Loading state={pool}>
        <div className="stack">
          <Field label="Whole batch" hint="Everyone in the batch is enrolled. You can also tick individual students below.">
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              <option value="">No batch</option>
              {pool.data?.batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </Field>
          <input type="search" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
          <div className="pick-list">
            {list.length === 0 && <div className="muted small" style={{ padding: 12 }}>No students found.</div>}
            {list.map((s) => (
              <label key={s._id} className="pick-row">
                <input type="checkbox" checked={picked.has(s._id)} onChange={() => toggle(s._id)} />
                <span className="grow"><b>{s.name}</b><span className="muted small"> {s.batch?.name || 'No batch'}{s.rollNo ? ` · Roll ${s.rollNo}` : ''}</span></span>
                <span className="muted small">{s.code}</span>
              </label>
            ))}
          </div>
          <div className="muted small">{picked.size} selected</div>
        </div>
      </Loading>
    </Modal>
  );
}

function Students({ course }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/students`), [course._id]);

  async function remove(e) {
    if (!window.confirm(`Remove ${e.student.name} from this course? Their progress will be lost.`)) return;
    try { await api.del(`/lms/courses/${course._id}/enroll/${e.student._id}`); toast('Removed'); state.reload(); } catch (err) { toast(err.message, 'bad'); }
  }
  async function issue(e) {
    try { const r = await api.post(`/lms/courses/${course._id}/enroll/${e.student._id}/certificate`); toast(`Certificate ${r.certificate.code} issued`); state.reload(); } catch (err) { toast(err.message, 'bad'); }
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="grow muted">{state.data ? `${state.data.items.length} enrolled` : ''}</div>
        <button className="btn primary" onClick={() => setAdding(true)}>Enrol students</button>
      </div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? (
          <div className="panel"><Empty title="No students yet">Enrol a whole batch or pick students one by one.</Empty></div>
        ) : (
          <div className="panel table-wrap">
            <table className="table cards">
              <thead><tr><th>Student</th><th>Progress</th><th>Certificate</th><th className="r"> </th></tr></thead>
              <tbody>
                {state.data.items.map((e) => (
                  <tr key={e._id}>
                    <td className="full"><div className="title" style={{ fontWeight: 600 }}>{e.student.name}</div><div className="muted small">{e.student.code}</div></td>
                    <td style={{ minWidth: 150 }}><div className="small num">{e.progress}%</div><ProgressBar value={e.progress} label={`${e.student.name} progress`} /></td>
                    <td>{e.certificate ? <span className="tag">{e.certificate}</span> : <span className="muted">-</span>}</td>
                    <td className="r">
                      {!e.certificate && <button className="btn sm" onClick={() => issue(e)}>Issue certificate</button>}{' '}
                      <button className="btn sm ghost" onClick={() => remove(e)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Loading>
      {adding && <EnrollModal course={course} onClose={() => setAdding(false)} onDone={() => { setAdding(false); state.reload(); }} />}
    </>
  );
}

// ---------- Assignments ----------
function AssignmentForm({ course, item, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ title: item?.title || '', instructions: item?.instructions || '', dueDate: item?.dueDate || '', maxPoints: item?.maxPoints ?? 100, allowLate: item?.allowLate ?? true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { ...f, dueDate: f.dueDate || undefined, maxPoints: Number(f.maxPoints) };
    try {
      if (item) await api.patch(`/lms/assignments/${item._id}`, body); else await api.post(`/lms/courses/${course._id}/assignments`, body);
      toast('Assignment saved');
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal wide title={item ? 'Edit assignment' : 'New assignment'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="assign-form" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
      <form id="assign-form" onSubmit={save} className="form-grid">
        {error && <div className="alert bad full" role="alert">{error}</div>}
        <Field label="Title" full><input type="text" value={f.title} onChange={set('title')} required autoFocus /></Field>
        <Field label="Instructions" full><textarea rows={6} value={f.instructions} onChange={set('instructions')} /></Field>
        <Field label="Due date"><input type="date" value={f.dueDate} onChange={set('dueDate')} /></Field>
        <Field label="Total marks"><input type="number" min="1" value={f.maxPoints} onChange={set('maxPoints')} required /></Field>
        <label className="check full"><input type="checkbox" checked={f.allowLate} onChange={(e) => setF((x) => ({ ...x, allowLate: e.target.checked }))} /> Accept late work (it is marked as late)</label>
      </form>
    </Modal>
  );
}

function Submissions({ assignment, onClose }) {
  const toast = useToast();
  const state = useAsync(() => api.get(`/lms/assignments/${assignment._id}/submissions`), [assignment._id]);
  const [edit, setEdit] = useState({});
  async function grade(s) {
    const v = edit[s._id] || {};
    try {
      await api.patch(`/lms/submissions/${s._id}/grade`, { grade: v.grade ?? s.grade, feedback: v.feedback ?? s.feedback });
      toast('Marks saved');
      setEdit((x) => { const n = { ...x }; delete n[s._id]; return n; });
      state.reload();
    } catch (e) { toast(e.message, 'bad'); }
  }
  return (
    <Modal wide title={`Submissions: ${assignment.title}`} onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <Empty title="Nothing submitted yet" /> : (
          <div className="stack">
            {state.data.items.map((s) => {
              const v = edit[s._id] || {};
              return (
                <div className="sub-card" key={s._id}>
                  <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <b className="grow">{s.student?.name}</b>
                    {s.late && <span className="chip warn">Late</span>}
                    {s.gradedAt ? <span className="chip ok">{s.grade}/{assignment.maxPoints}</span> : <span className="chip muted">Not marked</span>}
                  </div>
                  <div className="muted small">Submitted {new Date(s.submittedAt).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })}</div>
                  {s.text && <p className="sub-text">{s.text}</p>}
                  {s.link && <p><a href={s.link} target="_blank" rel="noreferrer noopener">{s.link}</a></p>}
                  <div className="grade-row">
                    <Field label={`Marks (of ${assignment.maxPoints})`}><input type="number" min="0" max={assignment.maxPoints} value={v.grade ?? s.grade ?? ''} onChange={(e) => setEdit((x) => ({ ...x, [s._id]: { ...v, grade: e.target.value } }))} /></Field>
                    <Field label="Feedback"><input type="text" value={v.feedback ?? s.feedback ?? ''} onChange={(e) => setEdit((x) => ({ ...x, [s._id]: { ...v, feedback: e.target.value } }))} /></Field>
                    <button className="btn primary" onClick={() => grade(s)} disabled={(v.grade ?? s.grade) === undefined || (v.grade ?? s.grade) === ''}>Save marks</button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </Loading>
    </Modal>
  );
}

function Assignments({ course }) {
  const toast = useToast();
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/assignments`), [course._id]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  async function remove(a) {
    if (!window.confirm(`Delete "${a.title}" and all submissions?`)) return;
    try { await api.del(`/lms/assignments/${a._id}`); toast('Deleted'); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}><div className="grow" /><button className="btn primary" onClick={() => setEditing('new')}>New assignment</button></div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No assignments">Give students practical work and mark it here.</Empty></div> : (
          <div className="panel">
            {state.data.items.map((a) => (
              <div className="list-row" key={a._id}>
                <div className="grow">
                  <div className="title" style={{ fontWeight: 600 }}>{a.title}</div>
                  <div className="muted small">{a.dueDate ? `Due ${fmtDate(a.dueDate, true)}` : 'No deadline'} · {a.maxPoints} marks · {a.submissions} submitted, {a.graded} marked</div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn sm primary" onClick={() => setViewing(a)}>Mark work</button>
                  <button className="btn sm" onClick={() => setEditing(a)}>Edit</button>
                  <button className="btn sm ghost" onClick={() => remove(a)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </Loading>
      {editing && <AssignmentForm course={course} item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); state.reload(); }} />}
      {viewing && <Submissions assignment={viewing} onClose={() => { setViewing(null); state.reload(); }} />}
    </>
  );
}

// ---------- Quizzes ----------
const blankQ = () => ({ text: '', options: ['', '', '', ''], correctIndex: 0, points: 1 });

function QuizForm({ course, item, onClose, onSaved }) {
  const toast = useToast();
  const full = useAsync(() => (item ? api.get(`/lms/quizzes/${item._id}`) : Promise.resolve(null)), [item?._id]);
  const [f, setF] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (f) return;
    if (!item) setF({ title: '', description: '', maxAttempts: 1, published: true, questions: [blankQ()] });
    else if (full.data) { const q = full.data.quiz; setF({ title: q.title, description: q.description || '', maxAttempts: q.maxAttempts, published: q.published, questions: q.questions.map((x) => ({ ...x })) }); }
  }, [full.data, item, f]);

  const upQ = (i, patch) => setF((x) => ({ ...x, questions: x.questions.map((q, n) => (n === i ? { ...q, ...patch } : q)) }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { ...f, maxAttempts: Number(f.maxAttempts), questions: f.questions.map((q) => ({ ...q, options: q.options.filter((o) => o.trim()), points: Number(q.points) || 1 })) };
    // correct answer must still point at the same option after blanks are dropped
    body.questions = f.questions.map((q) => {
      const kept = q.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
      return { _id: q._id, text: q.text, points: Number(q.points) || 1, options: kept.map((x) => x.o), correctIndex: kept.findIndex((x) => x.i === q.correctIndex) };
    });
    try {
      if (item) await api.patch(`/lms/quizzes/${item._id}`, body); else await api.post(`/lms/courses/${course._id}/quizzes`, body);
      toast('Quiz saved');
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal wide title={item ? 'Edit quiz' : 'New quiz'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="quiz-form" disabled={busy || !f}>{busy ? 'Saving...' : 'Save quiz'}</button></>}>
      {!f ? <Loading state={full}><div /></Loading> : (
        <form id="quiz-form" onSubmit={save} className="stack">
          {error && <div className="alert bad" role="alert">{error}</div>}
          <div className="form-grid">
            <Field label="Quiz title" full><input type="text" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required autoFocus /></Field>
            <Field label="Attempts allowed" hint="0 means unlimited."><input type="number" min="0" max="20" value={f.maxAttempts} onChange={(e) => setF({ ...f, maxAttempts: e.target.value })} /></Field>
            <label className="check"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Visible to students</label>
          </div>
          {f.questions.map((q, i) => (
            <div className="q-card" key={q._id || i}>
              <div className="row"><b className="grow">Question {i + 1}</b>
                <button type="button" className="btn sm ghost" disabled={f.questions.length === 1} onClick={() => setF({ ...f, questions: f.questions.filter((_, n) => n !== i) })}>Remove</button></div>
              <Field label="Question"><input type="text" value={q.text} onChange={(e) => upQ(i, { text: e.target.value })} required /></Field>
              {q.options.map((o, oi) => (
                <div className="opt-row" key={oi}>
                  <input type="radio" name={`c${i}`} checked={q.correctIndex === oi} onChange={() => upQ(i, { correctIndex: oi })} aria-label={`Option ${oi + 1} is correct`} />
                  <input type="text" value={o} placeholder={`Option ${oi + 1}`} onChange={(e) => upQ(i, { options: q.options.map((x, n) => (n === oi ? e.target.value : x)) })} aria-label={`Option ${oi + 1}`} />
                </div>
              ))}
              <div className="muted small">Select the circle next to the correct answer. Leave unused options empty.</div>
            </div>
          ))}
          <div><button type="button" className="btn" onClick={() => setF({ ...f, questions: [...f.questions, blankQ()] })}>Add question</button></div>
        </form>
      )}
    </Modal>
  );
}

function Attempts({ quiz, onClose }) {
  const state = useAsync(() => api.get(`/lms/quizzes/${quiz._id}/attempts`), [quiz._id]);
  return (
    <Modal title={`Results: ${quiz.title}`} onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <Empty title="No attempts yet" /> : (
          <div>{state.data.items.map((a) => (
            <div className="list-row" key={a._id}><div className="grow"><b>{a.student?.name}</b><div className="muted small">{new Date(a.submittedAt).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })}</div></div><span className="tag num">{a.score}/{a.maxScore}</span></div>
          ))}</div>
        ))}
      </Loading>
    </Modal>
  );
}

function Quizzes({ course }) {
  const toast = useToast();
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/quizzes`), [course._id]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  async function remove(q) {
    if (!window.confirm(`Delete "${q.title}" and all results?`)) return;
    try { await api.del(`/lms/quizzes/${q._id}`); toast('Deleted'); state.reload(); } catch (e) { toast(e.message, 'bad'); }
  }
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}><div className="grow" /><button className="btn primary" onClick={() => setEditing('new')}>New quiz</button></div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No quizzes">Multiple-choice quizzes are marked automatically.</Empty></div> : (
          <div className="panel">{state.data.items.map((q) => (
            <div className="list-row" key={q._id}>
              <div className="grow"><div className="title" style={{ fontWeight: 600 }}>{q.title} {!q.published && <span className="chip muted">Hidden</span>}</div>
                <div className="muted small">{q.questionCount} questions · {q.totalPoints} marks · {q.attempts} attempts</div></div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn sm" onClick={() => setViewing(q)}>Results</button>
                <button className="btn sm" onClick={() => setEditing(q)}>Edit</button>
                <button className="btn sm ghost" onClick={() => remove(q)}>Delete</button>
              </div>
            </div>
          ))}</div>
        ))}
      </Loading>
      {editing && <QuizForm course={course} item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); state.reload(); }} />}
      {viewing && <Attempts quiz={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

// ---------- Updates ----------
function Updates({ course }) {
  const toast = useToast();
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/announcements`), [course._id]);
  const [f, setF] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  async function post(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.post(`/lms/courses/${course._id}/announcements`, f); setF({ title: '', body: '' }); toast('Posted'); state.reload(); } catch (err) { toast(err.message, 'bad'); } finally { setBusy(false); }
  }
  async function remove(a) {
    try { await api.del(`/lms/announcements/${a._id}`); state.reload(); } catch (err) { toast(err.message, 'bad'); }
  }
  return (
    <div className="stack">
      <form className="panel panel-pad stack" onSubmit={post}>
        <Field label="Title"><input type="text" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required placeholder="Tomorrow's class starts at 10am" /></Field>
        <Field label="Message"><textarea rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        <div><button className="btn primary" disabled={busy}>{busy ? 'Posting...' : 'Post to students'}</button></div>
      </form>
      <Loading state={state}>
        {state.data && state.data.items.length > 0 && (
          <div className="panel">{state.data.items.map((a) => (
            <div className="list-row" key={a._id}>
              <div className="grow"><div style={{ fontWeight: 600 }}>{a.title}</div>{a.body && <div className="small">{a.body}</div>}
                <div className="muted small">{a.author?.name} · {new Date(a.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium' })}</div></div>
              <button className="btn sm ghost" onClick={() => remove(a)}>Delete</button>
            </div>
          ))}</div>
        )}
      </Loading>
    </div>
  );
}

// ---------- Details ----------
function Details({ course, reload, base }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const staff = useAsync(() => (user.role === 'admin' ? api.get('/lms/staff') : Promise.resolve({ items: [] })), []);
  const [f, setF] = useState({
    title: course.title, category: course.category || '', level: course.level, summary: course.summary || '', description: course.description || '',
    durationWeeks: course.durationWeeks ?? '', color: course.color ?? 0, autoCertificate: course.autoCertificate !== false,
    instructors: (course.instructors || []).map((i) => i._id),
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save(extra = {}) {
    setBusy(true);
    try {
      const body = { ...f, durationWeeks: f.durationWeeks === '' ? undefined : Number(f.durationWeeks), color: Number(f.color), ...extra };
      if (user.role !== 'admin') delete body.instructors;
      await api.patch(`/lms/courses/${course._id}`, body);
      toast('Saved');
      reload();
    } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); }
  }
  async function destroy() {
    if (!window.confirm('Delete this course with all lessons, assignments, quizzes and student progress? This cannot be undone.')) return;
    try { await api.del(`/lms/courses/${course._id}`); toast('Course deleted'); navigate(base); } catch (e) { toast(e.message, 'bad'); }
  }
  const live = course.status === 'published';

  return (
    <div className="stack">
      <div className={`alert ${live ? 'ok' : 'warn'}`}>
        {live ? 'This course is live. Enrolled students can see it.' : 'This course is a draft. Students cannot see it until you publish.'}
        {' '}<button className="btn sm" style={{ marginLeft: 8 }} onClick={() => save({ status: live ? 'draft' : 'published' })} disabled={busy}>{live ? 'Move back to draft' : 'Publish course'}</button>
      </div>
      <form className="panel panel-pad form-grid" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Course title" full><input type="text" value={f.title} onChange={set('title')} required /></Field>
        <Field label="Category"><input type="text" value={f.category} onChange={set('category')} /></Field>
        <Field label="Level"><select value={f.level} onChange={set('level')}>{Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Duration (weeks)"><input type="number" min="0" value={f.durationWeeks} onChange={set('durationWeeks')} /></Field>
        <Field label="Colour">
          <div className="swatches">{[0, 1, 2, 3, 4, 5].map((c) => <button type="button" key={c} className={`swatch cc-${c} ${Number(f.color) === c ? 'on' : ''}`} aria-label={`Colour ${c + 1}`} onClick={() => setF((x) => ({ ...x, color: c }))} />)}</div>
        </Field>
        <Field label="Short summary" full><input type="text" value={f.summary} onChange={set('summary')} maxLength={240} /></Field>
        <Field label="About this course" full><textarea rows={5} value={f.description} onChange={set('description')} /></Field>
        <label className="check full"><input type="checkbox" checked={f.autoCertificate} onChange={(e) => setF((x) => ({ ...x, autoCertificate: e.target.checked }))} /> Issue a certificate automatically when a student finishes every lesson</label>
        {user.role === 'admin' && (
          <Field label="Instructors" full hint="Staff chosen here can manage this course, mark work and post updates.">
            <div className="pick-list">
              {(staff.data?.items || []).map((s) => (
                <label key={s._id} className="pick-row">
                  <input type="checkbox" checked={f.instructors.includes(s._id)} onChange={() => setF((x) => ({ ...x, instructors: x.instructors.includes(s._id) ? x.instructors.filter((i) => i !== s._id) : [...x.instructors, s._id] }))} />
                  <span className="grow"><b>{s.name}</b> <span className="muted small">{s.designation || s.role}</span></span>
                </label>
              ))}
              {staff.data && staff.data.items.length === 0 && <div className="muted small" style={{ padding: 12 }}>No staff yet.</div>}
            </div>
          </Field>
        )}
        <div className="full row"><button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save details'}</button><div className="grow" />
          {user.role === 'admin' && <button type="button" className="btn ghost" onClick={destroy}>Delete course</button>}</div>
      </form>
    </div>
  );
}

export default function CourseManage({ teach = false }) {
  const { id } = useParams();
  const base = teach ? '/teach' : '/admin/learn';
  const [tab, setTab] = useState('content');
  const state = useAsync(() => api.get(`/lms/courses/${id}`), [id]);
  const c = state.data?.course;

  return (
    <>
      <p className="small" style={{ marginBottom: 10 }}><Link to={base}>All courses</Link></p>
      <Loading state={state}>
        {c && (
          <>
            <div className="course-head">
              <Cover course={c} big />
              <div className="grow">
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <span className={`chip ${c.status === 'published' ? 'ok' : 'muted'}`}>{c.status === 'published' ? 'Live' : 'Draft'}</span>
                  <span className="tag">{c.code}</span>
                  {c.category && <span className="tag">{c.category}</span>}
                </div>
                <h1 style={{ marginTop: 6 }}>{c.title}</h1>
                <p className="muted">{LEVEL_LABEL[c.level]}{c.durationWeeks ? ` · ${c.durationWeeks} weeks` : ''} · {state.data.lessonCount} lessons</p>
              </div>
            </div>
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {tab === 'content' && <Curriculum key={JSON.stringify(c.sections.map((s) => s._id))} course={c} reload={state.reload} />}
            {tab === 'students' && <Students course={c} />}
            {tab === 'assignments' && <Assignments course={c} />}
            {tab === 'quizzes' && <Quizzes course={c} />}
            {tab === 'updates' && <Updates course={c} />}
            {tab === 'details' && <Details course={c} reload={state.reload} base={base} />}
          </>
        )}
      </Loading>
    </>
  );
}
