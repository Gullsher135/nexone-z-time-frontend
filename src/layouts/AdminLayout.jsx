import { NavLink, Outlet } from 'react-router-dom';
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
  return (
    <div className="shell">
      <aside className="side">
        <TimeBrand sub="Attendance" />
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
