import { ProgressBar } from '../../components.jsx';
import { fmtDate } from '../../lib/format.js';

// The three things a student's course progress is made of.
export const PART_LABEL = { attendance: 'Attendance', assignments: 'Assignments', quizzes: 'Quizzes' };
export const PART_SHORT = { attendance: 'Attend.', assignments: 'Assign.', quizzes: 'Quiz' };

const ASSIGNMENT_STATUS = {
  graded: { cls: 'ok', text: (i) => `${i.grade}/${i.maxPoints}` },
  submitted: { cls: 'info', text: () => 'Waiting for marks' },
  missing: { cls: 'bad', text: () => 'Not submitted (0)' },
  pending: { cls: 'muted', text: (i) => (i.dueDate ? `Due ${fmtDate(i.dueDate)}` : 'No deadline') },
};

function PartHead({ title, part }) {
  const has = part.percent !== null;
  return (
    <>
      <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
        <h3 className="grow" style={{ margin: 0 }}>{title}</h3>
        {has && part.weak && <span className="chip bad">Weak</span>}
        {has && !part.weak && <span className="chip ok">On track</span>}
        {!has && <span className="chip muted">No data yet</span>}
      </div>
      <div className="pd-num num">{has ? `${part.percent}%` : '-'}</div>
      <div className={part.weak ? 'pd-weak' : ''}><ProgressBar value={has ? part.percent : 0} label={`${title} score`} /></div>
    </>
  );
}

// Used by the student ("My progress" tab) and by teachers (one student's details).
export default function ProgressDetail({ data }) {
  const { progress: p, lessons, batch } = data;
  const { attendance: a, assignments: s, quizzes: q } = p.parts;
  const weak = Object.keys(p.parts).filter((k) => p.parts[k].weak).sort((x, y) => p.parts[x].percent - p.parts[y].percent);

  return (
    <div className="stack">
      <div className="panel panel-pad">
        <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="muted small">Overall progress</div>
            <div className="pd-big num">{p.overall}%</div>
          </div>
          <div className="grow" style={{ minWidth: 220 }}>
            <ProgressBar value={p.overall} label="Overall progress" />
            <p className="muted small" style={{ marginTop: 8 }}>
              Attendance, assignment marks and quiz marks count equally. A part with nothing to measure yet is left out.
            </p>
          </div>
        </div>
        {!p.hasData && <div className="alert warn" style={{ marginTop: 12 }}>There is nothing to measure yet. Progress appears once classes are marked, work is graded or quizzes are published.</div>}
        {weak.length > 0 && <div className="alert bad" style={{ marginTop: 12 }}>Needs attention: {weak.map((k, i) => <span key={k}>{i > 0 && ', '}<b>{PART_LABEL[k]}</b> ({p.parts[k].percent}%)</span>)}. Anything below {p.weakBelow}% is flagged as weak.</div>}
        {p.hasData && weak.length === 0 && <div className="alert ok" style={{ marginTop: 12 }}>All measured areas are at {p.weakBelow}% or above.</div>}
      </div>

      <div className="pd-grid">
        <div className="panel panel-pad pd-card">
          <PartHead title="Attendance" part={a} />
          {a.total === 0 ? (
            <p className="muted small">{batch ? `No classes marked yet for ${batch.name}.` : 'This student is not in a batch of this course, so no attendance is counted.'}</p>
          ) : (
            <>
              <dl className="facts-list">
                <div><dt>Present</dt><dd>{a.present}</dd></div>
                <div><dt>Late</dt><dd>{a.late}</dd></div>
                <div><dt>Absent</dt><dd>{a.absent}</dd></div>
                <div><dt>On leave (not counted)</dt><dd>{a.leave}</dd></div>
              </dl>
              {batch && <p className="muted small">Batch: {batch.name}</p>}
              {a.recentAbsences.length > 0 && <p className="small"><b>Recent absences:</b> {a.recentAbsences.map((d) => fmtDate(d)).join(', ')}</p>}
            </>
          )}
        </div>

        <div className="panel panel-pad pd-card">
          <PartHead title="Assignments" part={s} />
          {s.total === 0 ? <p className="muted small">No assignments in this course yet.</p> : (
            <>
              <p className="muted small">{s.possible > 0 ? `${s.earned} of ${s.possible} marks earned on ${s.counted} marked or missed.` : 'Nothing marked yet.'}</p>
              <div className="pd-list">
                {s.items.map((i) => {
                  const st = ASSIGNMENT_STATUS[i.status];
                  return (
                    <div className="pd-item" key={i._id}>
                      <span className="grow">{i.title}{i.late && <span className="muted small"> (late)</span>}</span>
                      <span className={`chip ${st.cls}`}>{st.text(i)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="panel panel-pad pd-card">
          <PartHead title="Quizzes" part={q} />
          {q.total === 0 ? <p className="muted small">No quizzes in this course yet.</p> : (
            <>
              <p className="muted small">{q.earned} of {q.possible} marks, using the best attempt of each quiz. A quiz not attempted counts as 0.</p>
              <div className="pd-list">
                {q.items.map((i) => (
                  <div className="pd-item" key={i._id}>
                    <span className="grow">{i.title}</span>
                    {i.status === 'attempted'
                      ? <span className="chip ok">{i.best}/{i.maxScore}{i.attempts > 1 ? ` · ${i.attempts} tries` : ''}</span>
                      : <span className="chip bad">Not attempted</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="muted small">Lessons completed: {lessons.done} of {lessons.total}. Lessons are tracked separately and are not part of the percentage above.</p>
    </div>
  );
}
