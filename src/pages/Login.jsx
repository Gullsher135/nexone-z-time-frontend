import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Field } from '../components.jsx';
import { ProductOf } from '../brand.jsx';

const home = (u) => (u.role === 'admin' ? '/hub' : u.role === 'student' ? '/learn' : u.role === 'teacher' ? '/teach' : '/');

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || home(user)} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      const dest = location.state?.from || home(u);
      navigate(u.mustChangePassword ? (u.role === 'admin' ? '/admin/account' : u.role === 'student' ? '/learn/account' : u.role === 'teacher' ? '/teach/account' : '/account') : dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-side">
        <div className="auth-brand">
          <img src="/hub-icon.svg" alt="NexoneZ Hub" />
          <span>NexoneZ Hub</span>
        </div>
        <div>
          <h1>One place to run the whole software house.</h1>
          <p>Attendance, learning and more, built by NexoneZ for the people who work and study here.</p>
          <div className="auth-mods">
            <span><img src="/time-icon.svg" alt="" />Time</span>
            <span><img src="/learn-icon.svg" alt="" />Learn</span>
          </div>
        </div>
        <ProductOf className="on-dark" />
      </section>
      <section className="auth-main">
        <form className="auth-card stack" onSubmit={submit}>
          <div>
            <h2>Log in to NexoneZ Hub</h2>
            <p className="muted">Staff and students: use the email and password given to you by the admin.</p>
          </div>
          {error && <div className="alert bad" role="alert">{error}</div>}
          <Field label="Email">
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus={!window.matchMedia('(max-width: 720px)').matches} />
          </Field>
          <Field label="Password">
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <button className="btn primary" style={{ width: '100%', padding: '11px' }} disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </section>
    </div>
  );
}
