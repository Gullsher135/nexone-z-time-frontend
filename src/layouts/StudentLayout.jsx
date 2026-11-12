import Shell from './Shell.jsx';
import { Icon } from '../components.jsx';

const items = [
  { to: '/learn', label: 'My learning', icon: Icon.home, end: true },
  { to: '/learn/courses', label: 'My courses', icon: Icon.book },
  { to: '/learn/certificates', label: 'Certificates', icon: Icon.check },
  { to: '/learn/fees', label: 'My fees', icon: Icon.leave },
];

export default function StudentLayout() {
  return <Shell module="learn" items={items} links={{ learn: '/learn' }} accountPath="/learn/account" rootPath="student" />;
}
