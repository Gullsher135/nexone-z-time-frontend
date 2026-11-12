import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useAuth } from '../../lib/auth.jsx';
import { Cover, Empty, Loading, ProgressBar } from '../../components.jsx';
import { fmtDate } from '../../lib/format.js';

export function CourseCards({ items }) {
  return (
    <div className="course-grid">
      {items.map((c) => (
        <Link key={c._id} to={`/learn/course/${c._id}`} className="course-card">
          <Cover course={c} />
          <div className="cc-body">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {c.completed ? <span className="chip ok">Completed</span> : <span className="chip info">{c.progress}% done</span>}
              {c.category && <span className="tag">{c.category}</span>}
            </div>
            <h3>{c.title}</h3>
            {c.summary && <p className="muted small">{c.summary}</p>}
            <ProgressBar value={c.progress} label={`${c.title} progress`} />
            <div className="cc-meta small muted"><span>{c.lessonCount} lessons</span></div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function StudentHome() {
  const { user } = useAuth();
  const state = useAsync(() => api.get('/lms/my/overview'), []);
  const d = state.data;
  const avg = d && d.courses.length ? Math.round(d.courses.reduce((a, c) => a + c.progress, 0) / d.courses.length) : 0;
  const next = d?.courses.find((c) => !c.completed);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hello, {user.name.split(' ')[0]}</h1>
          <p className="sub">{next ? `Pick up where you left off: ${next.title}.` : 'Your learning at NexoneZ Software House, all in one place.'}</p>
        </div>
        {next && <Link className="btn primary" to={`/learn/course/${next._id}`}>Continue learning</Link>}
      </div>
      <Loading state={state}>
        {d && (
          <>
            <div className="panel kpis" style={{ marginBottom: 20 }}>
              <div className="kpi"><div className="v">{d.courses.length}</div><div className="l">Courses</div></div>
              <div className="kpi"><div className="v">{avg}%</div><div className="l">Average progress</div></div>
              <div className="kpi"><div className="v">{d.pending.length}</div><div className="l">Assignments to do</div></div>
              <div className="kpi"><div className="v">{d.certificates}</div><div className="l">Certificates</div></div>
            </div>

            {d.courses.length === 0 ? (
              <div className="panel"><Empty title="No courses yet">When your instructor enrols you in a course, it shows up here.</Empty></div>
            ) : (
              <>
                <h2 className="sec-title">My courses</h2>
                <CourseCards items={d.courses} />
              </>
            )}

            <div className="dash-grid" style={{ marginTop: 24 }}>
              <div className="panel">
                <div className="panel-head"><h2>To do</h2></div>
                {d.pending.length === 0 ? <div className="panel-pad muted">Nothing due. Well done.</div> : d.pending.map((a) => (
                  <Link key={a._id} to={`/learn/course/${a.course}?tab=assignments`} className="list-row row-link">
                    <div className="grow"><div style={{ fontWeight: 600 }}>{a.title}</div><div className="muted small">{a.courseTitle}</div></div>
                    {a.dueDate ? <span className={`chip ${a.overdue ? 'bad' : 'warn'}`}>{a.overdue ? 'Overdue' : `Due ${fmtDate(a.dueDate)}`}</span> : <span className="chip muted">No deadline</span>}
                  </Link>
                ))}
              </div>
              <div className="panel">
                <div className="panel-head"><h2>Updates</h2></div>
                {d.announcements.length === 0 ? <div className="panel-pad muted">No announcements.</div> : d.announcements.map((a) => (
                  <div key={a._id} className="list-row"><div className="grow"><div style={{ fontWeight: 600 }}>{a.title}</div>{a.body && <div className="small">{a.body}</div>}<div className="muted small">{a.courseTitle}</div></div></div>
                ))}
              </div>
            </div>
          </>
        )}
      </Loading>
    </>
  );
}
