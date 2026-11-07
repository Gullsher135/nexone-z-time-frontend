import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { ProductOf, TimeBrand } from '../brand.jsx';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="staff-shell">
      <header className="topbar">
        <div className="topbar-in">
          <TimeBrand sub="" />
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>Today</NavLink>
            <NavLink to="/history">History</NavLink>
            <NavLink to="/leaves">Leave</NavLink>
            <NavLink to="/account">Account</NavLink>
          </nav>
          <div className="grow" />
          <span className="muted small nowrap">{user.name}</span>
          <button className="btn sm" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="staff-main">
        <Outlet />
      </main>
      <footer className="staff-foot">
        <ProductOf />
      </footer>
    </div>
  );
}
