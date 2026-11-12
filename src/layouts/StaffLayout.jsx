import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Icon } from '../components.jsx';
import { ProductOf, TimeBrand } from '../brand.jsx';

const baseTabs = [
  { to: '/time', label: 'Today', icon: Icon.clock, end: true },
  { to: '/time/history', label: 'History', icon: Icon.chart },
  { to: '/time/leaves', label: 'Leave', icon: Icon.leave },
  { to: '/', label: 'Portal', icon: Icon.home, end: true },
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const tabs = baseTabs;
  return (
    <div className="staff-shell">
      <header className="topbar">
        <div className="topbar-in">
          <TimeBrand sub="" />
          <nav className="nav desk-nav" aria-label="Main">
            {tabs.map((t) => <NavLink key={t.to} to={t.to} end={t.end}>{t.label}</NavLink>)}
          </nav>
          <div className="grow" />
          <span className="muted small nowrap user-name">{user.name}</span>
          <button className="btn sm" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="staff-main">
        <Outlet />
      </main>
      <footer className="staff-foot">
        <ProductOf />
      </footer>
      <nav className="tabbar" aria-label="Main">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
