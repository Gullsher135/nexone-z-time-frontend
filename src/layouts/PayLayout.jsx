import Shell from './Shell.jsx';
import { Icon } from '../components.jsx';

const items = [
  { to: '/hub', label: 'Hub home', icon: Icon.home, end: true },
  { sep: true },
  { to: '/admin/pay', label: 'Overview', icon: Icon.chart, end: true },
  { to: '/admin/pay/fees', label: 'Student fees', icon: Icon.book },
  { to: '/admin/pay/payroll', label: 'Payroll', icon: Icon.leave },
  { to: '/admin/pay/salaries', label: 'Salaries', icon: Icon.people },
];

export default function PayLayout() {
  return <Shell module="pay" items={items} links={{ time: '/admin', learn: '/admin/learn', crew: '/admin/crew', pay: '/admin/pay', flow: '/admin/flow' }} accountPath="/admin/account" rootPath="pay" />;
}
