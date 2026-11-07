import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useAuth } from '../../lib/auth.jsx';
import { useToast } from '../../lib/toast.jsx';
import { Loading, PresenceStrip, StatusChip } from '../../components.jsx';
import { fmtDate, fmtDuration, nowParts, thisMonth, to12h } from '../../lib/format.js';

function Clock() {
  const [t, setT] = useState(nowParts());
  useEffect(() => {
    const id = setInterval(() => setT(nowParts()), 1000);
    return () => clearInterval(id);
  }, []);
  const h12 = t.h % 12 || 12;
  return (
    <div className="clock" aria-label="Current time">
      {h12}:{String(t.m).padStart(2, '0')}
      <small>{t.h >= 12 ? 'pm' : 'am'}</small>
    </div>
  );
}

const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('This device cannot share its location.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('Location is blocked. Allow location access for this site and try again.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

export default function Today() {
  const { user } = useAuth();
  const toast = useToast();
  const today = useAsync(() => api.get('/attendance/today'), []);
  const month = useAsync(() => api.get(`/attendance/me?month=${thisMonth()}`), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function punch(kind) {
    setBusy(true);
    setError('');
    try {
      const body = { method: 'button' };
      if (today.data.rules.needsLocation) Object.assign(body, await getPosition());
      const r = await api.post(`/attendance/${kind}`, body);
      toast(r.message);
      await Promise.all([today.reload(), month.reload()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Loading state={today}>
      {today.data && (() => {
        const { record, rules, shift, date, isOffDay, holiday } = today.data;
        const checkedIn = !!record?.checkIn;
        const checkedOut = !!record?.checkOut;
        const inT = record?.checkIn ? new Date(record.checkIn) : null;
        const hhmm = (d) => (d ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false }).format(d) : null);
        const inStr = hhmm(inT);
        const outStr = hhmm(record?.checkOut ? new Date(record.checkOut) : null);
        const s = month.data?.summary;

        return (
          <div className="stack">
            <div>
              <p className="muted">{fmtDate(date, true)}</p>
              <h1>Hello, {user.name.split(' ')[0]}</h1>
            </div>

            {isOffDay && (
              <div className="alert info">
                {holiday ? `Today is a holiday (${holiday}).` : 'Today is a day off.'} You can still check in if you are working.
              </div>
            )}

            <div className="today-grid">
              <section className="panel panel-pad stack">
                <Clock />
                <PresenceStrip big live checkIn={inStr} checkOut={outStr} shift={shift} />

                {!checkedIn && !rules.requireQr && (
                  <button className="punch" disabled={busy} onClick={() => punch('check-in')}>
                    {busy ? 'Checking in...' : 'Check in'}
                  </button>
                )}
                {checkedIn && !checkedOut && !rules.requireQr && (
                  <button className="punch out" disabled={busy} onClick={() => punch('check-out')}>
                    {busy ? 'Checking out...' : 'Check out'}
                  </button>
                )}
                {rules.requireQr && !checkedOut && (
                  <div className="alert info">
                    At the office, open your phone camera and scan the QR code on the office screen to {checkedIn ? 'check out' : 'check in'}.
                  </div>
                )}
                {checkedOut && (
                  <div className="alert ok">
                    You are done for today. Total time: <b>{fmtDuration(record.workMinutes)}</b>.
                  </div>
                )}
                {error && <div className="alert bad" role="alert">{error}</div>}
                {!checkedIn && rules.needsOfficeNetwork && !rules.requireQr && (
                  <p className="muted small">Check-in works only on the office network.</p>
                )}
                {!checkedIn && rules.needsLocation && !rules.requireQr && (
                  <p className="muted small">Check-in needs your location, and you must be at the office.</p>
                )}
              </section>

              <section className="panel panel-pad stack">
                <h2>Today</h2>
                <div className="facts">
                  <div className="fact"><div className="v">{inStr ? to12h(inStr) : '-'}</div><div className="l">Checked in</div></div>
                  <div className="fact"><div className="v">{outStr ? to12h(outStr) : '-'}</div><div className="l">Checked out</div></div>
                </div>
                <div className="row wrap">
                  {record && <StatusChip status={record.status} />}
                  {record?.lateMinutes > 0 && <span className="muted small">{record.lateMinutes} min after shift start</span>}
                </div>
                <p className="muted small">
                  Your shift is {to12h(shift.start)} to {to12h(shift.end)}. Arriving within {shift.graceMinutes} minutes of the start counts as on time.
                </p>
              </section>
            </div>

            <section className="panel panel-pad stack">
              <div className="row between wrap">
                <h2>This month</h2>
                <Link to="/history">See every day</Link>
              </div>
              {month.data ? (
                <div className="facts">
                  <div className="fact"><div className="v">{s.present}</div><div className="l">Days present</div></div>
                  <div className="fact"><div className="v">{s.late}</div><div className="l">Late arrivals</div></div>
                  <div className="fact"><div className="v">{s.absent}</div><div className="l">Absent</div></div>
                  <div className="fact"><div className="v">{s.leave}</div><div className="l">Leave</div></div>
                  <div className="fact"><div className="v">{fmtDuration(s.totalWorkMinutes)}</div><div className="l">Hours worked</div></div>
                </div>
              ) : <p className="muted">Loading...</p>}
            </section>
          </div>
        );
      })()}
    </Loading>
  );
}
