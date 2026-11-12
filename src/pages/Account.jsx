import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/toast.jsx';
import { Field } from '../components.jsx';

export default function Account() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) return setError('The new password must be at least 8 characters.');
    if (form.newPassword !== form.confirm) return setError('The new passwords do not match.');
    setBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      await refresh();
      toast('Password changed');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      if (user.mustChangePassword) navigate(user.role === 'admin' ? '/hub' : user.role === 'student' ? '/learn' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-head">
        <div>
          <h1>Account</h1>
          <p className="sub">{user.name} · {user.email}</p>
        </div>
      </div>
      {user.mustChangePassword && (
        <div className="alert warn" style={{ marginBottom: 16 }}>
          You are using a temporary password. Choose your own password to continue.
        </div>
      )}
      <form className="panel panel-pad stack" onSubmit={submit}>
        <h2>Change password</h2>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <Field label="Current password">
          <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} required />
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          <input type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} required />
        </Field>
        <Field label="Confirm new password">
          <input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
        </Field>
        <button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</button>
      </form>
    </div>
  );
}
