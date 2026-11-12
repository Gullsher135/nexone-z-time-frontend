export const PROJECT_STATUS = { planning: 'Planning', active: 'Active', on_hold: 'On hold', completed: 'Completed' };
export const PROJECT_TONE = { planning: 'muted', active: 'info', on_hold: 'warn', completed: 'ok' };
export const COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];
export const NEXT = { todo: 'doing', doing: 'review', review: 'done' };
export const NEXT_LABEL = { todo: 'Start', doing: 'Send to review', review: 'Mark done' };
export const PRIORITY_TONE = { low: 'muted', medium: 'info', high: 'bad' };
export const isLate = (due, status) => !!due && status !== 'done' && due < new Date().toISOString().slice(0, 10);
export const initials = (n = '?') => n.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export function Avatar({ name, size = 26 }) {
  return <span className="avatar" title={name} style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials(name)}</span>;
}
