import Shell from './Shell.jsx';
import { Icon } from '../components.jsx';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';

// The employee portal. Teaching staff also get a link to their Learn courses.
export default function CrewLayout() {
  const teaching = useAsync(() => api.get('/lms/overview').catch(() => ({ courses: 0 })), []);
  const items = [
    { to: '/', label: 'My home', icon: Icon.home, end: true },
    { to: '/tasks', label: 'My tasks', icon: Icon.check },
    { to: '/flow', label: 'Project work', icon: Icon.book },
    { to: '/notices', label: 'Notices', icon: Icon.leave },
    { to: '/team', label: 'Team', icon: Icon.people },
    { to: '/payslips', label: 'Payslips', icon: Icon.chart },
    { to: '/profile', label: 'My profile', icon: Icon.user },
    { sep: true },
    { to: '/time', label: 'Check in / out', icon: Icon.clock, end: true },
    { to: '/time/leaves', label: 'Leave requests', icon: Icon.leave },
    { to: '/time/history', label: 'Attendance history', icon: Icon.chart },
  ];
  const links = { time: '/time', crew: '/', flow: '/flow', ...(teaching.data?.courses > 0 ? { learn: '/teach' } : {}) };
  return <Shell module="crew" items={items} links={links} accountPath="/account" rootPath="crew" />;
}
