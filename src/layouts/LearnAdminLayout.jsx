import Shell from './Shell.jsx';
import { Icon } from '../components.jsx';
import { useAuth } from '../lib/auth.jsx';

// Admin (all courses) and teaching staff (only their own) share the same Learn management pages.
export default function LearnAdminLayout({ teach = false }) {
  const { user } = useAuth();
  const base = teach ? '/teach' : '/admin/learn';
  const items = [
    ...(user.role === 'admin' ? [{ to: '/hub', label: 'Hub home', icon: Icon.home, end: true }, { sep: true }] : []),
    { to: base, label: teach ? 'My courses' : 'Courses', icon: Icon.book, end: true },
    ...(user.role === 'admin' ? [{ to: '/admin/people', label: 'Students and staff', icon: Icon.people }] : []),
  ];
  const links = user.role === 'admin' ? { time: '/admin', learn: '/admin/learn', crew: '/admin/crew', pay: '/admin/pay', flow: '/admin/flow' } : { time: '/time', learn: '/teach', crew: '/', flow: '/flow' };
  return <Shell module="learn" items={items} links={links} accountPath={user.role === 'admin' ? '/admin/account' : '/account'} rootPath={base} />;
}
