import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { fmtDate, todayKey } from '../../lib/format.js';
import { Cover, Empty, Field, Loading, Modal, ProgressBar, Tabs, LEVEL_LABEL } from '../../components.jsx';
import ProgressDetail from './ProgressDetail.jsx';

function embedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.endsWith('youtube.com') && u.searchParams.get('v')) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}`;
    if (u.hostname.endsWith('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}`;
    if (u.hostname === 'drive.google.com') return url.replace(/\/view.*$/, '/preview');
  } catch { /* not a valid link */ }
  return null;
}

function Lessons({ data, course, reload }) {
  const toast = useToast();
  const flat = useMemo(() => course.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, section: s.title }))), [course]);
  const done = useMemo(() => new Set(data.enrollment.completedLessons), [data]);
  const [current, setCurrent] = useState(() => data.enrollment.lastLesson || flat[0]?._id);
  const [busy, setBusy] = useState(false);
  const lesson = flat.find((l) => String(l._id) === String(current)) || flat[0];
  const idx = flat.indexOf(lesson);
  const isDone = lesson && done.has(String(lesson._id));

  async function toggle(goNext) {
    setBusy(true);
    try {
      const r = await api.post(`/lms/courses/${course._id}/progress`, { lessonId: lesson._id, done: !isDone });
      if (r.certificate && !data.enrollment.certificate) toast('Course completed. Your certificate is ready!');
      await reload();
      if (goNext && !isDone && flat[idx + 1]) setCurrent(flat[idx + 1]._id);
    } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); }
  }

  if (!flat.length) return <div className="panel"><Empty title="No lessons yet">Your instructor has not added lessons to this course.</Empty></div>;
  const embed = lesson.url ? embedUrl(lesson.url) : null;

  return (
    <div className="player">
      <nav className="outline panel" aria-label="Course outline">
        {course.sections.map((s) => (
          <div key={s._id}>
            <div className="outline-sec">{s.title}</div>
            {s.lessons.map((l) => (
              <button key={l._id} className={`outline-item ${String(l._id) === String(lesson._id) ? 'on' : ''}`} onClick={() => setCurrent(l._id)}>
                <span className={`dot ${done.has(String(l._id)) ? 'done' : ''}`} aria-hidden="true">{done.has(String(l._id)) ? '✓' : ''}</span>
                <span className="grow">{l.title}</span>
                <span className="sr-only">{done.has(String(l._id)) ? 'completed' : 'not completed'}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <article className="lesson panel panel-pad">
        <div className="muted small">{lesson.section} · Lesson {idx + 1} of {flat.length}{lesson.durationMin ? ` · ${lesson.durationMin} min` : ''}</div>
        <h2 style={{ margin: '4px 0 14px' }}>{lesson.title}</h2>
        {embed && <div className="video"><iframe src={embed} title={lesson.title} allow="fullscreen; picture-in-picture" allowFullScreen loading="lazy" /></div>}
        {lesson.url && !embed && <p><a className="btn" href={lesson.url} target="_blank" rel="noreferrer noopener">Open {lesson.type === 'file' ? 'file' : 'link'}</a></p>}
        {lesson.content && <div className="prose">{lesson.content}</div>}
        <div className="row lesson-actions">
          <button className="btn" disabled={idx === 0} onClick={() => setCurrent(flat[idx - 1]._id)}>Previous</button>
          <div className="grow" />
          {isDone
            ? <button className="btn" onClick={() => toggle(false)} disabled={busy}>Mark as not done</button>
            : <button className="btn primary" onClick={() => toggle(true)} disabled={busy}>{idx < flat.length - 1 ? 'Complete and continue' : 'Complete course'}</button>}
          {isDone && idx < flat.length - 1 && <button className="btn primary" onClick={() => setCurrent(flat[idx + 1]._id)}>Next</button>}
        </div>
      </article>
    </div>
  );
}

function SubmitModal({ a, onClose, onDone }) {
  const toast = useToast();
  const [text, setText] = useState(a.submission?.text || '');
  const [link, setLink] = useState(a.submission?.link || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function go(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { await api.post(`/lms/assignments/${a._id}/submit`, { text, link }); toast('Submitted'); onDone(); } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal wide title={a.title} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" form="sub-form" disabled={busy}>{busy ? 'Submitting...' : a.submission ? 'Resubmit' : 'Submit'}</button></>}>
      {a.instructions && <div className="prose" style={{ marginBottom: 16 }}>{a.instructions}</div>}
      <form id="sub-form" onSubmit={go} className="stack">
        {error && <div className="alert bad" role="alert">{error}</div>}
        <Field label="Your answer"><textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <Field label="Link to your work (optional)" hint="GitHub repository, Google Drive file or a live site."><input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></Field>
      </form>
    </Modal>
  );
}

function Assignments({ course }) {
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/assignments`), [course._id]);
  const [open, setOpen] = useState(null);
  return (
    <Loading state={state}>
      {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No assignments">Nothing to submit in this course yet.</Empty></div> : (
        <div className="panel">{state.data.items.map((a) => {
          const s = a.submission;
          const overdue = a.dueDate && a.dueDate < todayKey();
          return (
            <div className="list-row" key={a._id}>
              <div className="grow">
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div className="muted small">{a.dueDate ? `Due ${fmtDate(a.dueDate, true)}` : 'No deadline'} · {a.maxPoints} marks</div>
                {s?.gradedAt && s.feedback && <div className="small" style={{ marginTop: 4 }}>Feedback: {s.feedback}</div>}
              </div>
              {s?.gradedAt ? <span className="chip ok">{s.grade}/{a.maxPoints}</span> : s ? <span className="chip info">Submitted{s.late ? ' (late)' : ''}</span> : <span className={`chip ${overdue ? 'bad' : 'warn'}`}>{overdue ? 'Overdue' : 'To do'}</span>}
              {!s?.gradedAt && <button className="btn sm primary" onClick={() => setOpen(a)} disabled={overdue && !a.allowLate && !s}>{s ? 'Edit' : 'Start'}</button>}
            </div>
          );
        })}</div>
      ))}
      {open && <SubmitModal a={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); state.reload(); }} />}
    </Loading>
  );
}

function QuizTake({ quizId, onClose, onDone }) {
  const toast = useToast();
  const state = useAsync(() => api.get(`/lms/quizzes/${quizId}`), [quizId]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = state.data?.quiz;

  async function submit() {
    setBusy(true);
    try {
      const r = await api.post(`/lms/quizzes/${quizId}/attempt`, { answers: q.questions.map((_, i) => answers[i] ?? -1) });
      setResult(r);
    } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); }
  }

  return (
    <Modal wide title={q?.title || 'Quiz'} onClose={result ? onDone : onClose}
      footer={result ? <button className="btn primary" onClick={onDone}>Done</button> : <><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={submit} disabled={busy || !q}>{busy ? 'Submitting...' : 'Submit answers'}</button></>}>
      <Loading state={state}>
        {q && (result ? (
          <div className="stack">
            <div className="alert ok" style={{ fontSize: 18 }}>You scored <b>{result.attempt.score}</b> out of <b>{result.attempt.maxScore}</b>.{result.attemptsLeft != null && ` Attempts left: ${result.attemptsLeft}.`}</div>
            {q.questions.map((qq, i) => (
              <div className="q-card" key={qq._id}>
                <b>{i + 1}. {qq.text}</b>
                {qq.options.map((o, oi) => {
                  const r = result.review[i];
                  const cls = oi === r.correctIndex ? 'right' : oi === r.chosen ? 'wrong' : '';
                  return <div key={oi} className={`opt-review ${cls}`}>{o}{oi === r.correctIndex && ' (correct)'}{oi === r.chosen && oi !== r.correctIndex && ' (your answer)'}</div>;
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="stack">
            {q.description && <p className="muted">{q.description}</p>}
            {q.questions.map((qq, i) => (
              <fieldset className="q-card" key={qq._id}>
                <legend>{i + 1}. {qq.text}</legend>
                {qq.options.map((o, oi) => (
                  <label key={oi} className={`opt-pick ${answers[i] === oi ? 'on' : ''}`}>
                    <input type="radio" name={`q${i}`} checked={answers[i] === oi} onChange={() => setAnswers((a) => ({ ...a, [i]: oi }))} /> {o}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        ))}
      </Loading>
    </Modal>
  );
}

function Quizzes({ course, refresh }) {
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/quizzes`), [course._id]);
  const [taking, setTaking] = useState(null);
  return (
    <Loading state={state}>
      {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No quizzes">There are no quizzes in this course yet.</Empty></div> : (
        <div className="panel">{state.data.items.map((q) => {
          const out = q.maxAttempts && q.attemptsUsed >= q.maxAttempts;
          return (
            <div className="list-row" key={q._id}>
              <div className="grow"><div style={{ fontWeight: 600 }}>{q.title}</div>
                <div className="muted small">{q.questionCount} questions · {q.totalPoints} marks · {q.maxAttempts ? `${q.attemptsUsed}/${q.maxAttempts} attempts used` : 'Unlimited attempts'}</div></div>
              {q.best != null && <span className="chip ok">Best {q.best}/{q.maxScore}</span>}
              <button className="btn sm primary" disabled={out} onClick={() => setTaking(q._id)}>{out ? 'No attempts left' : q.attemptsUsed ? 'Try again' : 'Start'}</button>
            </div>
          );
        })}</div>
      ))}
      {taking && <QuizTake quizId={taking} onClose={() => setTaking(null)} onDone={() => { setTaking(null); state.reload(); refresh?.(); }} />}
    </Loading>
  );
}

// Attendance + assignment marks + quiz marks, with the weak areas called out.
function MyProgress({ course }) {
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/my-progress`), [course._id]);
  return <Loading state={state}>{state.data && <ProgressDetail data={state.data} />}</Loading>;
}

function Updates({ course }) {
  const state = useAsync(() => api.get(`/lms/courses/${course._id}/announcements`), [course._id]);
  return (
    <Loading state={state}>
      {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No updates">Announcements from your instructor appear here.</Empty></div> : (
        <div className="panel">{state.data.items.map((a) => (
          <div className="list-row" key={a._id}><div className="grow"><div style={{ fontWeight: 600 }}>{a.title}</div>{a.body && <div className="small">{a.body}</div>}
            <div className="muted small">{a.author?.name} · {new Date(a.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium' })}</div></div></div>
        ))}</div>
      ))}
    </Loading>
  );
}

export default function CoursePlayer() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(sp.get('tab') || 'lessons');
  const state = useAsync(() => api.get(`/lms/courses/${id}`), [id]);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  const d = state.data;
  const c = d?.course;

  return (
    <>
      <p className="small" style={{ marginBottom: 10 }}><Link to="/learn/courses">My courses</Link></p>
      <Loading state={state}>
        {c && (
          <>
            <div className="course-head">
              <Cover course={c} big />
              <div className="grow">
                <h1>{c.title}</h1>
                <p className="muted">{LEVEL_LABEL[c.level]}{c.durationWeeks ? ` · ${c.durationWeeks} weeks` : ''}{c.instructors?.length ? ` · ${c.instructors.map((i) => i.name).join(', ')}` : ''}</p>
                <div className="row" style={{ gap: 12, marginTop: 8 }}>
                  <div className="grow" style={{ maxWidth: 360 }}><ProgressBar value={d.enrollment.progress} label="Course progress" /></div>
                  <b className="num">{d.enrollment.progress}%</b>
                  <button className="btn sm" onClick={() => setTab('progress')}>See breakdown</button>
                  {d.enrollment.certificate && <Link className="btn sm primary" to={`/verify/${d.enrollment.certificate.code}`}>View certificate</Link>}
                </div>
              </div>
            </div>
            <Tabs tabs={[{ value: 'lessons', label: 'Lessons' }, { value: 'assignments', label: 'Assignments' }, { value: 'quizzes', label: 'Quizzes' }, { value: 'progress', label: 'My progress' }, { value: 'updates', label: 'Updates' }]} value={tab} onChange={setTab} />
            {tab === 'lessons' && <Lessons data={d} course={c} reload={state.reload} />}
            {tab === 'assignments' && <Assignments course={c} />}
            {tab === 'quizzes' && <Quizzes course={c} refresh={state.reload} />}
            {tab === 'progress' && <MyProgress course={c} />}
            {tab === 'updates' && <Updates course={c} />}
          </>
        )}
      </Loading>
    </>
  );
}
