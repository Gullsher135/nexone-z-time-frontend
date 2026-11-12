import Shell from './Shell.jsx';
import { Icon } from '../components.jsx';

const items = [
  { to: '/hub', label: 'Hub home', icon: Icon.home, end: true },
  { sep: true },
  { to: '/admin/crew', label: 'Notices', icon: Icon.leave, end: true },
  { to: '/admin/crew/tasks', label: 'Tasks', icon: Icon.check },
  { to: '/admin/crew/letters', label: 'Letters', icon: Icon.book },
  { to: '/admin/crew/policy', label: 'Leave policy', icon: Icon.gear },
  { to: '/admin/people', label: 'People', icon: Icon.people },
  { to: '/admin/leaves', label: 'Leave requests', icon: Icon.leave },
];

export default function AdminCrewLayout() {
  return <Shell module="crew" items={items} links={{ time: '/admin', learn: '/admin/learn', crew: '/admin/crew', pay: '/admin/pay', flow: '/admin/flow' }} accountPath="/admin/account" rootPath="admincrew" />;
}
