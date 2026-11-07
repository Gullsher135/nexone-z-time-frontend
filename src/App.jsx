import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import { Spinner } from './components.jsx';
import Login from './pages/Login.jsx';
import Scan from './pages/Scan.jsx';
import StaffLayout from './layouts/StaffLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Today from './pages/staff/Today.jsx';
import History from './pages/staff/History.jsx';
import MyLeaves from './pages/staff/Leaves.jsx';
import Account from './pages/Account.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Board from './pages/admin/Board.jsx';
import People from './pages/admin/People.jsx';
import Batches from './pages/admin/Batches.jsx';
import ClassAttendance from './pages/admin/ClassAttendance.jsx';
import AdminLeaves from './pages/admin/Leaves.jsx';
import Reports from './pages/admin/Reports.jsx';
import Qr from './pages/admin/Qr.jsx';
import Settings from './pages/admin/Settings.jsx';

function Protected({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  const isAdmin = user.role === 'admin';
  if (role === 'admin' && !isAdmin) return <Navigate to="/" replace />;
  if (role === 'staff' && isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Protected role="staff" />}>
        <Route path="/scan" element={<Scan />} />
        <Route element={<StaffLayout />}>
          <Route index element={<Today />} />
          <Route path="history" element={<History />} />
          <Route path="leaves" element={<MyLeaves />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>

      <Route element={<Protected role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="today" element={<Board />} />
          <Route path="people" element={<People />} />
          <Route path="batches" element={<Batches />} />
          <Route path="classes" element={<ClassAttendance />} />
          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="reports" element={<Reports />} />
          <Route path="qr" element={<Qr />} />
          <Route path="settings" element={<Settings />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
