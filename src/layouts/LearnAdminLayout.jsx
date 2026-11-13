import Shell from './Shell.jsx';
import { Icon } from '../components.jsx';
import { useAuth } from '../lib/auth.jsx';

// Admin (all courses) and teaching staff (only their own) share the same Learn management pages.
export default function LearnAdminLayout({ teach = false }) {
  const { user } = useAuth();
  const base = teach ? '/teach' : '/admin/learn';
  const isAdmin = user.role === 'admin';
  const teacherOnly = user.role === 'teacher'; // a teacher login has nothing but this portal
  const items = [
    ...(isAdmin ? [{ to: '/hub', label: 'Hub home', icon: Icon.home, end: true }, { sep: true }] : []),
    { to: base, label: teach ? 'My courses' : 'Courses', icon: Icon.book, end: true },
    ...(teach ? [{ to: '/teach/attendance', label: 'Class attendance', icon: Icon.check }] : []),
    ...(isAdmin ? [{ to: '/admin/learn/teachers', label: 'Teachers', icon: Icon.user }, { to: '/admin/people', label: 'Students and staff', icon: Icon.people }] : []),
  ];
  let links;
  if (isAdmin) links = { time: '/admin', learn: '/admin/learn', crew: '/admin/crew', pay: '/admin/pay', flow: '/admin/flow' };
  else if (teacherOnly) links = { learn: '/teach' };
  else links = { time: '/time', learn: '/teach', crew: '/', flow: '/flow' };
  const accountPath = isAdmin ? '/admin/account' : teacherOnly ? '/teach/account' : '/account';
  return <Shell module="learn" items={items} links={links} accountPath={accountPath} rootPath={base} hideUnlinked={teacherOnly} />;
}
