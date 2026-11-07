const TZ = 'Asia/Karachi';

export const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
export const thisMonth = () => todayKey().slice(0, 7);

export function nowParts() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { h: get('hour') % 24, m: get('minute'), s: get('second') };
}

export const nowMinutes = () => {
  const { h, m } = nowParts();
  return h * 60 + m;
};

export const hhmmToMin = (s) => {
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

export function to12h(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function fmtDuration(mins) {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES = DAYS;
export const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(key, withYear = false) {
  if (!key) return '';
  const [y, m, d] = key.split('-').map(Number);
  const wd = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${wd} ${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

export function fmtMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function daysInclusive(from, to) {
  return Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000) + 1;
}

export const STATUS = {
  present: { label: 'Present', tone: 'ok' },
  late: { label: 'Late', tone: 'warn' },
  absent: { label: 'Absent', tone: 'bad' },
  leave: { label: 'On leave', tone: 'info' },
  off: { label: 'Day off', tone: 'muted' },
  not_in: { label: 'Not in yet', tone: 'muted' },
  upcoming: { label: 'Upcoming', tone: 'muted' },
  na: { label: '-', tone: 'muted' },
};

export const ROLE_LABEL = { admin: 'Admin', employee: 'Employee', intern: 'Intern', student: 'Student' };

const hhmmFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
export const hhmmFromIso = (iso) => (iso ? hhmmFmt.format(new Date(iso)).replace('24:', '00:') : null);
