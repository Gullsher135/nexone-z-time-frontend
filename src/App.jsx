import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import { Spinner, TableLabels } from './components.jsx';
import Login from './pages/Login.jsx';
import Scan from './pages/Scan.jsx';
import OfficeSync from './pages/OfficeSync.jsx';
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
import Hub from './pages/Hub.jsx';
import FlowLayout from './layouts/FlowLayout.jsx';
import FlowHome from './pages/flow/FlowHome.jsx';
import Projects from './pages/flow/Projects.jsx';
import ProjectBoard from './pages/flow/Board.jsx';
import Clients from './pages/flow/Clients.jsx';
import MyWork from './pages/flow/MyWork.jsx';
import PayLayout from './layouts/PayLayout.jsx';
import PayHome from './pages/pay/PayHome.jsx';
import Fees from './pages/pay/Fees.jsx';
import Payroll from './pages/pay/Payroll.jsx';
import Salaries from './pages/pay/Salaries.jsx';
import MyFees from './pages/learn/MyFees.jsx';
import Payslips from './pages/crew/Payslips.jsx';
import { Receipt, PayslipDoc } from './pages/Print.jsx';
import CrewLayout from './layouts/CrewLayout.jsx';
import AdminCrewLayout from './layouts/AdminCrewLayout.jsx';
import CrewHome from './pages/crew/CrewHome.jsx';
import MyTasks from './pages/crew/MyTasks.jsx';
import Notices from './pages/crew/Notices.jsx';
import Team from './pages/crew/Team.jsx';
import Profile from './pages/crew/Profile.jsx';
import AdminNotices from './pages/crew/AdminNotices.jsx';
import AdminTasks from './pages/crew/AdminTasks.jsx';
import AdminPolicy from './pages/crew/AdminPolicy.jsx';
import Verify from './pages/Verify.jsx';
import LearnAdminLayout from './layouts/LearnAdminLayout.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import LearnAdminHome from './pages/learn/LearnAdminHome.jsx';
import CourseManage from './pages/learn/CourseManage.jsx';
import StudentHome from './pages/learn/StudentHome.jsx';
import MyCourses from './pages/learn/MyCourses.jsx';
import CoursePlayer from './pages/learn/CoursePlayer.jsx';
import Certificates from './pages/learn/Certificates.jsx';

function Protected({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  const isAdmin = user.role === 'admin';
  const isStudent = user.role === 'student';
  if (role === 'student') return isStudent ? <Outlet /> : <Navigate to={isAdmin ? '/hub' : '/'} replace />;
  if (isStudent) return <Navigate to="/learn" replace />;
  if (role === 'admin' && !isAdmin) return <Navigate to="/" replace />;
  if (role === 'staff' && isAdmin) return <Navigate to="/hub" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <>
    <TableLabels />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/office-sync/:key" element={<OfficeSync />} />
      <Route path="/verify" element={<Verify />} />
      <Route element={<Protected />}>
        <Route path="/print/receipt/:id" element={<Receipt />} />
        <Route path="/print/payslip/:id" element={<PayslipDoc />} />
      </Route>
      <Route path="/verify/:code" element={<Verify />} />

      <Route element={<Protected role="student" />}>
        <Route path="/learn" element={<StudentLayout />}>
          <Route index element={<StudentHome />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="course/:id" element={<CoursePlayer />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="fees" element={<MyFees />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>

      <Route element={<Protected role="staff" />}>
        <Route path="/teach" element={<LearnAdminLayout teach />}>
          <Route index element={<LearnAdminHome teach />} />
          <Route path=":id" element={<CourseManage teach />} />
        </Route>
      </Route>

      <Route element={<Protected role="staff" />}>
        <Route path="/scan" element={<Scan />} />
        <Route element={<CrewLayout />}>
          <Route index element={<CrewHome />} />
          <Route path="tasks" element={<MyTasks />} />
          <Route path="notices" element={<Notices />} />
          <Route path="team" element={<Team />} />
          <Route path="payslips" element={<Payslips />} />
          <Route path="profile" element={<Profile />} />
          <Route path="account" element={<Account />} />
        </Route>
        <Route path="/flow" element={<FlowLayout />}>
          <Route index element={<MyWork />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectBoard />} />
          <Route path="account" element={<Account />} />
        </Route>
        <Route path="/time" element={<StaffLayout />}>
          <Route index element={<Today />} />
          <Route path="history" element={<History />} />
          <Route path="leaves" element={<MyLeaves />} />
        </Route>
      </Route>

      <Route element={<Protected role="admin" />}>
        <Route path="/hub" element={<Hub />} />
        <Route path="/admin/flow" element={<FlowLayout />}>
          <Route index element={<FlowHome />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectBoard />} />
          <Route path="clients" element={<Clients />} />
        </Route>
        <Route path="/admin/pay" element={<PayLayout />}>
          <Route index element={<PayHome />} />
          <Route path="fees" element={<Fees />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="salaries" element={<Salaries />} />
        </Route>
        <Route path="/admin/crew" element={<AdminCrewLayout />}>
          <Route index element={<AdminNotices />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="policy" element={<AdminPolicy />} />
        </Route>
        <Route path="/admin/learn" element={<LearnAdminLayout />}>
          <Route index element={<LearnAdminHome />} />
          <Route path=":id" element={<CourseManage />} />
        </Route>
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
    </>
  );
}
