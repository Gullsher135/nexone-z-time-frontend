import Shell from './Shell.jsx';
import { Icon } from '../components.jsx';

const items = [
  { to: '/hub', label: 'Hub home', icon: Icon.home, end: true },
  { sep: true },
  { to: '/admin', label: 'Dashboard', icon: Icon.chart, end: true },
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
  return <Shell module="time" items={items} links={{ time: '/admin', learn: '/admin/learn', crew: '/admin/crew', pay: '/admin/pay', flow: '/admin/flow' }} accountPath="/admin/account" rootPath="time" />;
}
