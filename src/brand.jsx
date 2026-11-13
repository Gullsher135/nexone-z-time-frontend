import { Link } from 'react-router-dom';

// NexoneZ Time is a product of NexoneZ Software House. These two small pieces show that relationship everywhere.

// The product mark: the NexoneZ Time icon with its name.
export function TimeBrand({ sub = 'Attendance', showName = true }) {
  return (
    <div className="brand">
      <img className="brand-time" src="/time-icon.svg" alt="NexoneZ Time" />
      {showName && (
        <div>
          NexoneZ Time
          {sub && <small>{sub}</small>}
        </div>
      )}
    </div>
  );
}

// "A product of [NexoneZ icon] NexoneZ Software House"
export function ProductOf({ className = '' }) {
  return (
    <div className={`product-of ${className}`}>
      <img src="/nexonez-icon.png" alt="" />
      <span>
        A product of
        <b>NexoneZ Software House</b>
      </span>
    </div>
  );
}

// ---------- NexoneZ Hub: the platform, and the modules inside it ----------
export const MODULES = [
  { key: 'time', name: 'NexoneZ Time', short: 'Time', tag: 'Attendance', blurb: 'Attendance for staff, interns and classes.', icon: '/time-icon.svg' },
  { key: 'learn', name: 'NexoneZ Learn', short: 'Learn', tag: 'Learning', blurb: 'Courses, assignments, quizzes and certificates.', icon: '/learn-icon.svg' },
  { key: 'crew', name: 'NexoneZ Crew', short: 'Crew', tag: 'Employee portal', blurb: 'Your home at work: tasks, notices, leave balance and team.', icon: '/crew-icon.svg' },
  { key: 'pay', name: 'NexoneZ Pay', short: 'Pay', tag: 'Fees and payroll', blurb: 'Student fees, receipts, salaries and payslips.', icon: '/pay-icon.svg' },
  { key: 'flow', name: 'NexoneZ Flow', short: 'Flow', tag: 'Projects', blurb: 'Client projects, task boards and delivery.', icon: '/flow-icon.svg' },
];
export const moduleOf = (key) => MODULES.find((m) => m.key === key);

export function HubBrand({ sub = 'Software house suite' }) {
  return (
    <div className="brand">
      <img className="brand-time" src="/hub-icon.svg" alt="NexoneZ Hub" />
      <div>
        NexoneZ Hub
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

export function ModuleIcon({ m, size = 34 }) {
  if (m.icon) return <img className="mod-ico" src={m.icon} alt="" style={{ width: size, height: size }} />;
  return <span className={`mod-ico soon mod-${m.key}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>{m.short[0]}</span>;
}

// The strip at the top of every sidebar: the hub, then its modules. `links` says where each live module opens.
export function ModuleSwitch({ current, links, hideUnlinked = false }) {
  const cur = moduleOf(current);
  return (
    <div className="modswitch">
      <HubBrand sub="" />
      <div className="mods" role="navigation" aria-label="Modules">
        {MODULES.filter((m) => !hideUnlinked || links[m.key]).map((m) => {
          const to = links[m.key];
          const on = m.key === current;
          if (!to) {
            return (
              <span key={m.key} className="mod disabled" title={`${m.name} (coming soon)`} aria-label={`${m.name}, coming soon`}>
                <ModuleIcon m={m} size={30} />
              </span>
            );
          }
          return (
            <Link key={m.key} to={to} className={`mod ${on ? 'on' : ''}`} title={m.name} aria-label={m.name} aria-current={on ? 'page' : undefined}>
              <ModuleIcon m={m} size={30} />
            </Link>
          );
        })}
      </div>
      <div className="mod-now">
        <b>{cur.name}</b>
        <small>{cur.tag}</small>
      </div>
    </div>
  );
}

export function LearnBrand({ sub = 'Learning' }) {
  return (
    <div className="brand">
      <img className="brand-time" src="/learn-icon.svg" alt="NexoneZ Learn" />
      <div>
        NexoneZ Learn
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}
