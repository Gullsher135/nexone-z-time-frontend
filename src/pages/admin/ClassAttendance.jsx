import { useEffect, useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Loading, Spinner, Tabs } from '../../components.jsx';
import { fmtDate, fmtMonth, thisMonth, todayKey } from '../../lib/format.js';

const OPTIONS = [['present', 'Present'], ['late', 'Late'], ['absent', 'Absent'], ['leave', 'Leave']];

function Sheet({ batches }) {
  const toast = useToast();
  const [batch, setBatch] = useState(batches[0]?._id || '');
  const [date, setDate] = useState(todayKey());
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const sheet = useAsync(() => (batch ? api.get(`/student-attendance${qs({ batch, date })}`) : Promise.resolve({ rows: [] })), [batch, date]);

  useEffect(() => {
    if (sheet.data) setMarks(Object.fromEntries(sheet.data.rows.map((r) => [r.student._id, r.status])));
  }, [sheet.data]);

  const rows = sheet.data?.rows || [];
  const setAll = (status) => setMarks(Object.fromEntries(rows.map((r) => [r.student._id, status])));
  const counts = OPTIONS.map(([k, l]) => [l, Object.values(marks).filter((v) => v === k).length]);
  const unmarked = rows.filter((r) => !marks[r.student._id]).length;

  async function save() {
    setSaving(true);
    try {
      await api.put('/student-attendance', {
        batch, date, records: rows.map((r) => ({ student: r.student._id, status: marks[r.student._id] || null })),
      });
      toast('Class attendance saved');
      sheet.reload();
    } catch (e) {
      toast(e.message, 'bad');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <div className="tools">
        <select value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Batch">
          {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
        <input type="date" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Class date" />
        <button className="btn" onClick={() => setAll('present')} disabled={!rows.length}>Mark everyone present</button>
      </div>

      <div className="panel">
        {sheet.loading && !sheet.data ? <Spinner /> : sheet.error ? <div className="alert bad" style={{ margin: 16 }}>{sheet.error}</div> : rows.length === 0 ? (
          <Empty title="No students in this batch">Add students from the People page, or import a list.</Empty>
        ) : (
          <>
            <div className="panel-head">
              <div>
                <h2>{fmtDate(date, true)}</h2>
                <p className="muted small">{sheet.data.marked ? 'Attendance was already taken. Changes replace it.' : 'Not taken yet.'}</p>
              </div>
              <div className="stat-line small">{counts.map(([l, n]) => <span key={l}><b>{n}</b> {l.toLowerCase()}</span>)}</div>
            </div>
            <div className="table-wrap">
              <table className="table cards">
                <thead><tr><th style={{ width: 70 }} className="hide-m">Roll</th><th>Student</th><th>Attendance</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.student._id}>
                      <td className="muted hide-m">{r.student.rollNo || '-'}</td>
                      <td className="title" style={{ fontWeight: 600 }}>{r.student.name}{r.student.rollNo && <span className="muted small show-m"> · Roll {r.student.rollNo}</span>}</td>
                      <td className="full">
                        <div className="seg" role="group" aria-label={`Attendance for ${r.student.name}`}>
                          {OPTIONS.map(([k, l]) => (
                            <button key={k} type="button" className={`${k} ${marks[r.student._id] === k ? 'on' : ''}`} aria-pressed={marks[r.student._id] === k}
                              onClick={() => setMarks((m) => ({ ...m, [r.student._id]: m[r.student._id] === k ? null : k }))}>{l}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-foot" style={{ borderRadius: '0 0 14px 14px' }}>
              {unmarked > 0 && <span className="muted small" style={{ marginRight: 'auto' }}>{unmarked} not marked</span>}
              <button className="btn primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save attendance'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Summary({ batches }) {
  const [batch, setBatch] = useState(batches[0]?._id || '');
  const [month, setMonth] = useState(thisMonth());
  const state = useAsync(() => (batch ? api.get(`/student-attendance/summary${qs({ batch, month })}`) : Promise.resolve({ items: [], classDays: 0 })), [batch, month]);

  return (
    <div className="stack">
      <div className="tools">
        <select value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Batch">
          {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
        <input type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
      </div>
      <div className="panel table-wrap">
        <Loading state={state}>
          {state.data && (state.data.items.length === 0 ? (
            <Empty title="Nothing to show">No students or no classes recorded for {fmtMonth(month)}.</Empty>
          ) : (
            <>
              <div className="panel-head"><h2>{fmtMonth(month)}</h2><span className="muted">{state.data.classDays} class days recorded</span></div>
              <table className="table cards c3">
                <thead><tr><th className="hide-m">Roll</th><th>Student</th><th>Present</th><th>Late</th><th>Absent</th><th>Leave</th><th>Attendance</th></tr></thead>
                <tbody>
                  {state.data.items.map((r) => (
                    <tr key={r.student._id}>
                      <td className="muted hide-m">{r.student.rollNo || '-'}</td>
                      <td className="title" style={{ fontWeight: 600 }}>{r.student.name}{r.student.rollNo && <span className="muted small show-m"> · Roll {r.student.rollNo}</span>}</td>
                      <td>{r.present}</td><td>{r.late}</td><td>{r.absent}</td><td>{r.leave}</td>
                      <td>
                        {r.percent == null ? '-' : (
                          <span className={`chip ${r.percent >= 85 ? 'ok' : r.percent >= 70 ? 'warn' : 'bad'}`}>{r.percent}%</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ))}
        </Loading>
      </div>
    </div>
  );
}

export default function ClassAttendance() {
  const [tab, setTab] = useState('mark');
  const batches = useAsync(() => api.get('/batches?isActive=true'), []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Class attendance</h1>
          <p className="sub">Mark students present or absent for each class, and see monthly attendance.</p>
        </div>
      </div>
      <Loading state={batches}>
        {batches.data && (batches.data.items.length === 0 ? (
          <div className="panel"><Empty title="No running batches">Create a batch first, then add students to it.</Empty></div>
        ) : (
          <>
            <Tabs tabs={[{ value: 'mark', label: 'Mark attendance' }, { value: 'summary', label: 'Monthly summary' }]} value={tab} onChange={setTab} />
            {tab === 'mark' ? <Sheet batches={batches.data.items} /> : <Summary batches={batches.data.items} />}
          </>
        ))}
      </Loading>
    </div>
  );
}
