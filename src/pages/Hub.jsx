import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { HubBrand, MODULES, ModuleIcon, ProductOf } from '../brand.jsx';

const LINKS = { time: '/admin', learn: '/admin/learn', crew: '/admin/crew', pay: '/admin/pay', flow: '/admin/flow' };

export default function Hub() {
  const { user, logout } = useAuth();
  return (
    <div className="hub">
      <header className="hub-top">
        <HubBrand />
        <div className="grow" />
        <span className="muted small nowrap user-name">{user.name}</span>
        <Link to="/admin/account" className="btn sm">Password</Link>
        <button className="btn sm" onClick={logout}>Log out</button>
      </header>
      <main className="hub-main">
        <h1>Welcome, {user.name.split(' ')[0]}</h1>
        <p className="muted">Choose a module. More are on the way.</p>
        <div className="hub-grid">
          {MODULES.map((m) => {
            const to = LINKS[m.key];
            const body = (
              <>
                <ModuleIcon m={m} size={52} />
                <div className="grow">
                  <h3>{m.name}</h3>
                  <p className="muted small">{m.blurb}</p>
                </div>
                {m.soon ? <span className="chip muted">Soon</span> : <span className="hub-go" aria-hidden="true">Open</span>}
              </>
            );
            return to
              ? <Link key={m.key} to={to} className="hub-card">{body}</Link>
              : <div key={m.key} className="hub-card disabled" aria-disabled="true">{body}</div>;
          })}
        </div>
      </main>
      <footer className="staff-foot"><ProductOf /></footer>
    </div>
  );
}
