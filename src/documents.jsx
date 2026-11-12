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
