export const PRIORITY = { low: { label: 'Low', tone: 'muted' }, medium: { label: 'Medium', tone: 'info' }, high: { label: 'High', tone: 'bad' } };
export const STATUS_LABEL = { todo: 'To do', doing: 'In progress', done: 'Done' };

export function PriorityChip({ p }) {
  const x = PRIORITY[p] || PRIORITY.medium;
  return <span className={`chip ${x.tone}`}>{x.label}</span>;
}

export const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short' });
};
