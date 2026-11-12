import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useToast } from '../../lib/toast.jsx';
import { Field } from '../../components.jsx';
import { ROLE_LABEL, fmtDate } from '../../lib/format.js';

export default function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ phone: user.phone || '', address: user.address || '', en: user.emergencyContact?.name || '', ep: user.emergencyContact?.phone || '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch('/crew/profile', { phone: f.phone, address: f.address, emergencyContact: { name: f.en, phone: f.ep } });
      await refresh();
      toast('Profile saved');
    } catch (err) { toast(err.message, 'bad'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="page-head"><div><h1>My profile</h1><p className="sub">Your details at NexoneZ. Contact details can be updated by you.</p></div></div>
      <div className="dash-grid">
        <div className="panel panel-pad stack">
          <div className="row" style={{ gap: 14 }}>
            <div className="avatar big" aria-hidden="true">{user.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</div>
            <div><h2>{user.name}</h2><div className="muted">{user.designation || ROLE_LABEL[user.role]}</div></div>
          </div>
          <dl className="facts-list">
            <div><dt>Staff ID</dt><dd className="num">{user.code}</dd></div>
            <div><dt>Role</dt><dd>{ROLE_LABEL[user.role]}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            {user.department && <div><dt>Department</dt><dd>{user.department}</dd></div>}
            {user.joiningDate && <div><dt>Joined</dt><dd>{fmtDate(user.joiningDate, true)}</dd></div>}
            {user.shift && <div><dt>Shift</dt><dd>{user.shift.start} to {user.shift.end}</dd></div>}
            {user.internship?.endDate && <div><dt>Internship ends</dt><dd>{fmtDate(user.internship.endDate, true)}</dd></div>}
          </dl>
          <div><Link className="btn" to="/account">Change password</Link></div>
        </div>
        <form className="panel panel-pad stack" onSubmit={save}>
          <h2>Contact details</h2>
          <Field label="Phone"><input type="tel" value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Home address"><textarea rows={3} value={f.address} onChange={set('address')} maxLength={300} /></Field>
          <Field label="Emergency contact name"><input type="text" value={f.en} onChange={set('en')} /></Field>
          <Field label="Emergency contact phone"><input type="tel" value={f.ep} onChange={set('ep')} /></Field>
          <div><button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></div>
        </form>
      </div>
    </>
  );
}
