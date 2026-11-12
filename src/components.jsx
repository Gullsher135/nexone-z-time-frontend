import { useEffect, useState } from 'react';
import { STATUS, hhmmToMin, nowMinutes, to12h } from './lib/format.js';

export function Spinner() {
  return <div className="center-pad"><div className="spinner" aria-label="Loading" /></div>;
}

export function Loading({ state, children }) {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error && !state.data) return <div className="alert bad">{state.error}</div>;
  return children;
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.na;
  return <span className={`chip ${s.tone}`}>{s.label}</span>;
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, full }) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} className={value === t.value ? 'on' : ''} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

const RANGE_START = 7 * 60;
const RANGE_END = 21 * 60;
const pct = (min) => Math.min(100, Math.max(0, ((min - RANGE_START) / (RANGE_END - RANGE_START)) * 100));

// The day as one line (7am to 9pm): the shaded band is the shift, the solid bar is the time spent present.
export function PresenceStrip({ checkIn, checkOut, shift, live = false, big = false }) {
  const [now, setNow] = useState(nowMinutes());
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => setNow(nowMinutes()), 30000);
    return () => clearInterval(t);
  }, [live]);

  const inMin = hhmmToMin(checkIn);
  const outMin = hhmmToMin(checkOut);
  const s = hhmmToMin(shift?.start);
  const e = hhmmToMin(shift?.end);
  const isLive = live && inMin != null && outMin == null;
  const end = outMin ?? (isLive ? Math.max(now, inMin) : null);

  const label = checkIn
    ? `Present from ${to12h(checkIn)}${checkOut ? ` to ${to12h(checkOut)}` : ' (still in)'}`
    : 'No entry recorded';

  return (
    <div className={`strip ${big ? 'big' : ''}`} role="img" aria-label={label} title={label}>
      <div className="track" />
      {s != null && e != null && <div className="shift" style={{ left: `${pct(s)}%`, width: `${pct(e) - pct(s)}%` }} />}
      {inMin != null && end != null && end >= inMin && (
        <div className={`on ${isLive ? 'live' : ''}`} style={{ left: `${pct(inMin)}%`, width: `${pct(end) - pct(inMin)}%` }} />
      )}
      {inMin != null && end == null && <div className="dot" style={{ left: `${pct(inMin)}%` }} />}
      {big && (
        <div className="ticks">
          {[8, 10, 12, 14, 16, 18, 20].map((h) => (
            <span key={h} className="tick" style={{ left: `${pct(h * 60)}%` }}>{h % 12 || 12}{h >= 12 ? 'p' : 'a'}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// Phones show tables as cards. Each cell gets its column title so the card can label every value.
export function TableLabels() {
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll('table.cards').forEach((t) => {
        const heads = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
        t.querySelectorAll('tbody tr').forEach((tr) => {
          [...tr.children].forEach((td, i) => {
            const label = heads[i] || '';
            if (td.getAttribute('data-label') !== label) td.setAttribute('data-label', label);
          });
        });
      });
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.getElementById('root'), { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}

export const Icon = {
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  people: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.4c2 .7 3.5 2.4 3.5 5.6" /></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" /><path d="M4 19a2 2 0 002 2h13" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12l3 3 5-6" /></svg>,
  leave: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  qr: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" /></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>,
};

export function ProgressBar({ value = 0, label }) {
  return (
    <div className="pbar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}>
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// The coloured tile every course card and course header uses.
export function Cover({ course, big = false }) {
  const initials = (course.title || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <div className={`cover cc-${course.color ?? 0} ${big ? 'big' : ''}`} aria-hidden="true"><span>{initials}</span></div>;
}

export const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
