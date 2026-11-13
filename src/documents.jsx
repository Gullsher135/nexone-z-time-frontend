import { QRCodeSVG } from 'qrcode.react';

// Who signs official documents. Change here if the signatory changes.
export const SIGNATORY = { name: 'Gulsher Malik', title: 'CEO, NexoneZ Software House' };
export const ADDRESS = 'Yousuf Plaza, Gate #3, Kohat';
export const verifyUrl = (code) => `${window.location.origin}/verify/${code}`;

export function longDate(v) {
  if (!v) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00Z`) : new Date(v);
  return d.toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'long', year: 'numeric' });
}
const first = (n = '') => n.split(/\s+/)[0] || n;

function Signature() {
  return (
    <div className="sig">
      <div className="sig-script">{SIGNATORY.name}</div>
      <div className="sig-line" />
      <b>{SIGNATORY.name}</b>
      <span>{SIGNATORY.title}</span>
    </div>
  );
}

function Seal() {
  return (
    <div className="seal" aria-hidden="true">
      <div className="seal-in"><img src="/nexonez-icon.png" alt="" /></div>
    </div>
  );
}

// ============ Landscape certificate (course completion, internship) ============
export function Certificate({ title, subtitle, lead, name, body, highlight, note, issuedAt, code, label = 'Certificate ID' }) {
  return (
    <div className="cert2" role="document" aria-label={title}>
      <div className="cert2-frame">
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <img className="cert2-wm" src="/nexonez-icon.png" alt="" />
        <div className="cert2-body">
          <header className="cert2-head">
            <img src="/nexonez-icon.png" alt="NexoneZ" />
            <div><b>NEXONEZ</b><span>SOFTWARE HOUSE · KOHAT</span></div>
          </header>
          <h1>{title}</h1>
          {subtitle && <div className="cert2-sub">{subtitle}</div>}
          <p className="cert2-lead">{lead}</p>
          <div className="cert2-name">{name}</div>
          <p className="cert2-text">{body}</p>
          {highlight && <div className="cert2-hl">{highlight}</div>}
          {note && <p className="cert2-note">{note}</p>}
          <footer className="cert2-foot">
            <div className="cert2-qr">
              {code && <QRCodeSVG value={verifyUrl(code)} size={256} level="M" bgColor="#ffffff" fgColor="#1e1b4b" style={{ width: '100%', height: '100%' }} />}
              <span>Scan to verify</span>
            </div>
            <div className="cert2-meta">
              <div><span>Date of issue</span><b>{longDate(issuedAt)}</b></div>
              <div><span>{label}</span><b>{code}</b></div>
            </div>
            <Seal />
            <Signature />
          </footer>
        </div>
      </div>
    </div>
  );
}

export function internshipProps(l) {
  const d = l.data || {};
  const p = l.person || {};
  const work = (d.projects || []).map((x) => x.name);
  return {
    title: 'Certificate of Internship',
    subtitle: 'AWARDED WITH APPRECIATION',
    lead: 'This certificate is proudly presented to',
    name: p.name,
    body: <>for successfully completing an internship{d.designation ? <> as <b>{d.designation}</b></> : null} at NexoneZ Software House, from <b>{longDate(d.from)}</b> to <b>{longDate(d.to)}</b>{d.grade ? <>, with <b>{d.grade.toLowerCase()}</b> performance</> : null}.</>,
    note: work.length ? `Worked on: ${work.join(', ')}` : d.remark,
    issuedAt: l.issuedAt,
    code: l.code,
  };
}

// ============ Portrait letter (experience letter, warning) ============
const SEV = {
  notice: { title: 'Notice', closing: 'This notice is issued for your information and will be kept in your record. Please make sure the matter is not repeated.' },
  warning: { title: 'Warning Letter', closing: 'Please treat this as a formal warning. If this conduct is repeated, the company will take further disciplinary action under its policy.' },
  final: { title: 'Final Warning', closing: 'This is a final warning. Any further violation may lead to the termination of your services without further notice.' },
};
export const SEVERITY_LABEL = { notice: 'Notice', warning: 'Warning', final: 'Final warning' };

function Letterhead() {
  return (
    <header className="lh">
      <img src="/nexonez-icon.png" alt="NexoneZ" />
      <div className="grow"><b>NexoneZ Software House</b><span>Software development, training and IT services</span></div>
      <div className="lh-addr">{ADDRESS}</div>
    </header>
  );
}

export function LetterSheet({ letter: l }) {
  const d = l.data || {};
  const p = l.person || {};
  const fn = first(p.name);
  const warning = l.type === 'warning';
  return (
    <div className="letter" role="document">
      <div className="letter-main">
        <Letterhead />
        <div className="lh-bar" />
        <div className="letter-meta"><span>Ref: <b>{l.refNo}</b></span><span>Date: <b>{longDate(l.issuedAt)}</b></span></div>

        {warning ? (
          <>
            <div className="letter-to"><b>{p.name}</b><br />{p.designation || (p.role === 'intern' ? 'Intern' : 'Employee')}<br />Staff ID: {p.code}</div>
            <h2 className="letter-subject">Subject: {d.subject}</h2>
            <div className={`letter-tag ${d.severity}`}>{SEV[d.severity].title}</div>
            <p>Dear {fn},</p>
            {String(d.reason || '').split(/\n+/).map((t, i) => <p key={i}>{t}</p>)}
            <p>{SEV[d.severity].closing}</p>
            <p>You are requested to acknowledge this letter through your NexoneZ Crew portal. You may add your explanation there.</p>
          </>
        ) : (
          <>
            <h2 className="letter-title">Experience Letter</h2>
            <p className="letter-twim">TO WHOM IT MAY CONCERN</p>
            <p>This is to certify that <b>{p.name}</b> (Staff ID {p.code}) {d.to ? 'worked' : 'has been working'} with NexoneZ Software House as <b>{d.designation || p.designation || 'a team member'}</b> from <b>{longDate(d.from)}</b> {d.to ? <>to <b>{longDate(d.to)}</b></> : 'to date'}.</p>
            {d.projects?.length > 0 && (
              <>
                <p>During this period {fn} contributed to the following projects:</p>
                <table className="letter-table">
                  <thead><tr><th>Project</th><th>Client</th><th>Role</th><th className="r">Tasks completed</th></tr></thead>
                  <tbody>{d.projects.map((x, i) => <tr key={i}><td>{x.name}</td><td>{x.client || 'Internal'}</td><td>{x.role}</td><td className="r">{x.cardsDone}</td></tr>)}</tbody>
                </table>
              </>
            )}
            <p>{d.remark || `We found ${fn} sincere, hardworking and professional in the performance of duties.`}</p>
            <p>We wish {fn} every success in future endeavours. This letter is issued on request, without any liability on the company.</p>
          </>
        )}

        <div className="letter-sign"><Signature /></div>

        {warning && (
          <div className="letter-ack">
            {l.acknowledgedAt
              ? <><b>Acknowledged by {p.name}</b> on {longDate(l.acknowledgedAt)}.{l.reply && <div className="letter-reply"><span>Reply:</span> {l.reply}</div>}</>
              : <span className="muted">Not yet acknowledged by the employee.</span>}
          </div>
        )}
      </div>
      <footer className="letter-foot">
        {l.code && (
          <div className="letter-qr">
            <QRCodeSVG value={verifyUrl(l.code)} size={256} level="M" bgColor="#ffffff" fgColor="#1e1b4b" style={{ width: 64, height: 64 }} />
            <div><b>Scan to verify</b><span>{l.code}</span></div>
          </div>
        )}
        <div className="grow letter-note">{warning ? 'Confidential. Issued to the named person only.' : 'This letter can be verified by scanning the QR code or at the verification page of NexoneZ.'}<br />NexoneZ Software House · {ADDRESS}</div>
      </footer>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Course completion certificate (NexoneZ Learn). Everything is sized in cqw so it scales with its box.
// ---------------------------------------------------------------------------
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i));

function CertArt() {
  return (
    <svg className="nzc-art" viewBox="0 0 1536 1024" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="nzc-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ece6ff" /></linearGradient>
        <linearGradient id="nzc-pu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a1bb8" /><stop offset="1" stopColor="#7b4dff" /></linearGradient>
        <linearGradient id="nzc-go" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c9962b" /><stop offset=".5" stopColor="#f6dc86" /><stop offset="1" stopColor="#c9962b" /></linearGradient>
      </defs>
      <rect width="1536" height="1024" fill="url(#nzc-bg)" />
      {/* soft wave lines */}
      <g fill="none" stroke="#7c5cf0" strokeWidth="1.2" opacity=".16">
        {lines(16, (i) => <path key={`l${i}`} d={`M0 ${640 + i * 11} C 280 ${560 + i * 14}, 520 ${900 + i * 6}, 900 ${760 + i * 16}`} />)}
        {lines(16, (i) => <path key={`r${i}`} d={`M1536 ${380 + i * 11} C 1330 ${330 + i * 12}, 1180 ${560 + i * 8}, 1010 ${700 + i * 13}`} />)}
      </g>
      {/* top left corner */}
      <polygon points="0,0 300,0 0,225" fill="#160a5c" />
      <polygon points="300,0 392,0 0,292 0,225" fill="#4a24d6" />
      <polygon points="392,0 440,0 0,330 0,292" fill="#a58bff" />
      <line x1="0" y1="338" x2="454" y2="0" stroke="url(#nzc-go)" strokeWidth="3.5" />
      {/* top right tag */}
      <polygon points="1090,0 1536,0 1536,330" fill="url(#nzc-pu)" opacity=".92" />
      <polygon points="1205,0 1536,0 1536,98 1262,98" fill="#160a5c" />
      {/* bottom right corner */}
      <polygon points="1536,1024 1236,1024 1536,799" fill="#160a5c" />
      <polygon points="1236,1024 1144,1024 1536,732 1536,799" fill="#4a24d6" />
      <polygon points="1144,1024 1096,1024 1536,694 1536,732" fill="#a58bff" />
      <line x1="1536" y1="686" x2="1082" y2="1024" stroke="url(#nzc-go)" strokeWidth="3.5" />
      {/* inner frame */}
      <path d="M46 22 H1490 L1514 46 V978 L1490 1002 H46 L22 978 V46 Z" fill="none" stroke="#4a24d6" strokeWidth="2.2" />
    </svg>
  );
}

function CertSeal() {
  const rim = lines(240, (i) => {
    const a = (i / 240) * Math.PI * 2;
    const r = 84 + 4.5 * Math.cos(a * 28);
    return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  const leaf = (side) => lines(9, (i) => {
    const a = (side * (28 + i * 15) + 90) * (Math.PI / 180); // sweep up each side of the badge
    const x = 100 + 56 * Math.cos(a);
    const y = 100 + 56 * Math.sin(a);
    return <ellipse key={`${side}${i}`} cx={x} cy={y} rx="3.2" ry="8" fill="#b57e12" opacity=".85" transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} />;
  });
  return (
    <svg className="nzc-seal" viewBox="0 0 200 250" aria-hidden="true">
      <defs>
        <radialGradient id="nzc-gold" cx=".35" cy=".3" r=".9"><stop offset="0" stopColor="#fff3b8" /><stop offset=".55" stopColor="#f0bf45" /><stop offset="1" stopColor="#b8821a" /></radialGradient>
      </defs>
      <polygon points="64,150 112,170 90,244 74,226 52,238" fill="#4a24d6" stroke="#e2b550" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="136,150 88,170 110,244 126,226 148,238" fill="#3a1bb8" stroke="#e2b550" strokeWidth="3" strokeLinejoin="round" />
      <polygon points={rim} fill="url(#nzc-gold)" stroke="#a9761a" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#a9761a" strokeWidth="2.4" />
      <circle cx="100" cy="100" r="66" fill="#f8dc80" opacity=".55" />
      {leaf(1)}{leaf(-1)}
      <polygon points="100,62 133,81 133,119 100,138 67,119 67,81" fill="#fbf9ff" stroke="#1b1464" strokeWidth="5" strokeLinejoin="round" />
      <image href="/nexonez-icon.png" x="74" y="72" width="52" height="56" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

const CalendarIcon = () => (
  <svg viewBox="0 0 32 32" className="nzc-cal" aria-hidden="true" fill="none" stroke="#4a24d6" strokeWidth="2.2" strokeLinecap="round">
    <rect x="4" y="6" width="24" height="22" rx="4" />
    <path d="M4 13h24M10 3v6M22 3v6" />
    {[10, 16, 22].flatMap((x) => [18, 23].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.1" fill="#4a24d6" stroke="none" />))}
  </svg>
);

export function CompletionCertificate({ name, course, category, issuedAt, code }) {
  const long = course.length > 52 ? '1.6cqw' : course.length > 34 ? '1.95cqw' : '2.3cqw';
  return (
    <div className="nzc" role="img" aria-label={`Certificate of completion for ${name}, ${course}`}>
      <CertArt />
      <div className="nzc-tagline">Learn <i>•</i> Build <i>•</i> Grow</div>
      <div className="nzc-content">
        <div className="nzc-brand">
          <img src="/nexonez-icon.png" alt="" />
          <div className="nzc-brand-text"><b>Nexone<span>Z</span></b><span>Software House &amp; Training Institute</span></div>
        </div>
        <h1>Certificate</h1>
        <div className="nzc-of"><i />OF COMPLETION<i /></div>
        <p className="nzc-lead">This is to certify that</p>
        <div className="nzc-name" style={{ fontSize: name.length > 26 ? '5.2cqw' : '7cqw' }}>{name}</div>
        <p className="nzc-txt">has successfully completed the requirements of</p>
        <div className="nzc-course" style={{ fontSize: long }}>{course}</div>
        {category && (
          <>
            <p className="nzc-txt">and demonstrated exceptional skills and dedication in the field of</p>
            <div className="nzc-field">{category}</div>
          </>
        )}
        <p className="nzc-note">We appreciate your hard work and commitment towards learning and innovation.<br />Keep up the great work!</p>
      </div>
      <div className="nzc-foot">
        <div className="nzc-left">
          <div className="nzc-qr">
            {code && <QRCodeSVG value={verifyUrl(code)} size={256} level="M" bgColor="#ffffff" fgColor="#1b1464" style={{ width: '100%', height: '100%' }} />}
            <span>Scan to verify</span>
          </div>
          <div className="nzc-date">
            <div className="nzc-date-row"><CalendarIcon /><div><small>Date of Issue:</small><b>{longDate(issuedAt)}</b></div></div>
            <div className="nzc-id">Certificate ID: {code}</div>
          </div>
        </div>
        <CertSeal />
        <div className="nzc-sign">
          <img src="/signature.png" alt={`Signature of ${SIGNATORY.name}`} />
          <div className="nzc-sign-line" />
          <b>CEO, NexoneZ</b>
        </div>
      </div>
    </div>
  );
}
