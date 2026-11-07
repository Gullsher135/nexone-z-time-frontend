import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Icon } from '../components.jsx';
import { ProductOf, TimeBrand } from '../brand.jsx';

const items = [
  { to: '/admin', label: 'Dashboard', icon: Icon.home, end: true },
  { to: '/admin/today', label: 'Daily attendance', icon: Icon.clock },
  { to: '/admin/people', label: 'People', icon: Icon.people },
  { to: '/admin/classes', label: 'Class attendance', icon: Icon.check },
  { to: '/admin/batches', label: 'Batches', icon: Icon.book },
  { to: '/admin/leaves', label: 'Leave requests', icon: Icon.leave },
  { to: '/admin/reports', label: 'Reports', icon: Icon.chart },
  { to: '/admin/qr', label: 'Office QR', icon: Icon.qr },
  { to: '/admin/settings', label: 'Settings', icon: Icon.gear },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // On phones the menu is a drawer: close it after choosing a page, and on Escape.
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
    || (pathname.startsWith('/admin/account') ? { label: 'Password' } : null);

  return (
    <div className="shell">
      <header className="mbar">
        <button className="icon-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>{Icon.menu}</button>
        <img className="mbar-logo" src="/time-icon.svg" alt="NexoneZ Time" />
        <div className="mbar-title">{current?.label || 'NexoneZ Time'}</div>
      </header>
      <div className={`scrim ${open ? 'on' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`side ${open ? 'open' : ''}`} aria-label="Menu">
        <div className="side-top">
          <TimeBrand sub="Attendance" />
          <button className="icon-btn side-close" aria-label="Close menu" onClick={() => setOpen(false)}>{Icon.close}</button>
        </div>
        <nav className="nav" aria-label="Main">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}>
              {i.icon}
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <ProductOf className="side-product" />
          <div className="small" style={{ fontWeight: 600 }}>{user.name}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <NavLink to="/admin/account" className="small">Password</NavLink>
            <button className="link-btn small" onClick={logout}>Log out</button>
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
