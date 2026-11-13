import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Icon } from '../components.jsx';
import { ModuleSwitch, ProductOf, moduleOf } from '../brand.jsx';

// One responsive shell for every module: sidebar on desktop, drawer on phones.
// `links` are the live modules this person can open; `items` is the module's own menu.
export default function Shell({ module, items, links, accountPath, rootPath, hideUnlinked = false }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const mod = moduleOf(module);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = items.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))
    || (pathname.startsWith(accountPath) ? { label: 'Password' } : null);

  return (
    <div className="shell" data-module={module}>
      <header className="mbar">
        <button className="icon-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>{Icon.menu}</button>
        <img className="mbar-logo" src={mod.icon} alt={mod.name} />
        <div className="mbar-title">{current?.label || mod.name}</div>
      </header>
      <div className={`scrim ${open ? 'on' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`side ${open ? 'open' : ''}`} aria-label="Menu">
        <div className="side-top">
          <ModuleSwitch current={module} links={links} hideUnlinked={hideUnlinked} />
          <button className="icon-btn side-close" aria-label="Close menu" onClick={() => setOpen(false)}>{Icon.close}</button>
        </div>
        <nav className="nav" aria-label="Main">
          {items.map((i, n) => (i.sep
            ? <div key={n} className="nav-sep" />
            : (
              <NavLink key={i.to} to={i.to} end={i.end}>
                {i.icon}
                {i.label}
              </NavLink>
            )))}
        </nav>
        <div className="side-foot">
          <ProductOf className="side-product" />
          <div className="small" style={{ fontWeight: 600 }}>{user.name}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <Link to={accountPath} className="small">Password</Link>
            <button className="link-btn small" onClick={logout}>Log out</button>
          </div>
        </div>
      </aside>
      <main className="main" key={rootPath}>
        <Outlet />
      </main>
    </div>
  );
}
