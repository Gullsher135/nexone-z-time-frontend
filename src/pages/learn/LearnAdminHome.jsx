import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useAuth } from '../../lib/auth.jsx';
import { useToast } from '../../lib/toast.jsx';
import { Cover, Empty, Field, Loading, Modal, LEVEL_LABEL } from '../../components.jsx';

function CreateCourse({ onClose, onCreated }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', category: '', level: 'beginner', summary: '', durationWeeks: '', color: 0 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/lms/courses', { ...f, durationWeeks: f.durationWeeks ? Number(f.durationWeeks) : undefined, color: Number(f.color) });
      toast('Course created. Add lessons next.');
      onCreated(r.course);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal wide title="New course" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="course-form" disabled={busy}>{busy ? 'Creating...' : 'Create course'}</button></>}>
      <form id="course-form" onSubmit={save} className="form-grid">
        {error && <div className="alert bad full" role="alert">{error}</div>}
        <Field label="Course title" full><input type="text" value={f.title} onChange={set('title')} placeholder="Full-stack web development" required autoFocus /></Field>
        <Field label="Category"><input type="text" value={f.category} onChange={set('category')} placeholder="Web development" /></Field>
        <Field label="Level">
          <select value={f.level} onChange={set('level')}>
            {Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Duration (weeks)"><input type="number" min="0" value={f.durationWeeks} onChange={set('durationWeeks')} /></Field>
        <Field label="Colour">
          <div className="swatches">
            {[0, 1, 2, 3, 4, 5].map((c) => (
              <button type="button" key={c} className={`swatch cc-${c} ${Number(f.color) === c ? 'on' : ''}`} aria-label={`Colour ${c + 1}`} aria-pressed={Number(f.color) === c} onClick={() => setF((x) => ({ ...x, color: c }))} />
            ))}
          </div>
        </Field>
        <Field label="Short summary" full hint="One line shown on the course card."><input type="text" value={f.summary} onChange={set('summary')} maxLength={240} /></Field>
      </form>
    </Modal>
  );
}

export default function LearnAdminHome({ teach = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = teach ? '/teach' : '/admin/learn';
  const [creating, setCreating] = useState(false);
  const stats = useAsync(() => api.get('/lms/overview'), []);
  const state = useAsync(() => api.get('/lms/courses'), []);
  const s = stats.data;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{teach ? 'My courses' : 'NexoneZ Learn'}</h1>
          <p className="sub">{teach ? 'Courses assigned to you. Open one to teach, mark work and post updates.' : 'Courses, lessons, assignments, quizzes and certificates for your students.'}</p>
        </div>
        {user.role === 'admin' && <button className="btn primary" onClick={() => setCreating(true)}>New course</button>}
      </div>

      {s && (
        <div className="panel kpis" style={{ marginBottom: 20 }}>
          <div className="kpi"><div className="v">{s.courses}</div><div className="l">Courses ({s.published} live)</div></div>
          <div className="kpi"><div className="v">{s.students}</div><div className="l">Students learning</div></div>
          <div className="kpi"><div className="v">{s.toGrade}</div><div className="l">Waiting for marks</div></div>
          <div className="kpi"><div className="v">{s.certificates}</div><div className="l">Certificates issued</div></div>
        </div>
      )}

      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? (
          <div className="panel"><Empty title="No courses yet">{teach ? 'The admin has not assigned a course to you yet.' : 'Use "New course" to create the first one.'}</Empty></div>
        ) : (
          <div className="course-grid">
            {state.data.items.map((c) => (
              <button key={c._id} className="course-card" onClick={() => navigate(`${base}/${c._id}`)}>
                <Cover course={c} />
                <div className="cc-body">
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <span className={`chip ${c.status === 'published' ? 'ok' : 'muted'}`}>{c.status === 'published' ? 'Live' : 'Draft'}</span>
                    {c.category && <span className="tag">{c.category}</span>}
                  </div>
                  <h3>{c.title}</h3>
                  <p className="muted small">{c.summary || `${LEVEL_LABEL[c.level]} course`}</p>
                  <div className="cc-meta small muted"><span>{c.lessonCount} lessons</span><span>{c.studentCount} students</span></div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </Loading>

      {creating && <CreateCourse onClose={() => setCreating(false)} onCreated={(c) => navigate(`${base}/${c._id}`)} />}
    </>
  );
}
