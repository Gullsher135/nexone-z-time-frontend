import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { Loading } from '../components.jsx';
import { Certificate, internshipProps, longDate } from '../documents.jsx';

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'long', year: 'numeric' });

function Lookup() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  return (
    <div className="verify-wrap">
      <form className="auth-card stack" onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate(`/verify/${encodeURIComponent(code.trim())}`); }}>
        <img src="/learn-icon.svg" alt="NexoneZ Learn" width="48" height="48" style={{ borderRadius: 12 }} />
        <div><h2>Verify a certificate</h2><p className="muted">Enter the code printed on the certificate, for example NZ-1A2B3C4D.</p></div>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="NZ-XXXXXXXX" aria-label="Certificate code" autoFocus />
        <button className="btn primary" style={{ width: '100%' }}>Verify</button>
      </form>
    </div>
  );
}

export default function Verify() {
  const { code } = useParams();
  if (!code) return <Lookup />;
  return /^NZL-/i.test(code) ? <LetterCheck code={code} /> : <CourseCertificate code={code} />;
}

function NotFound({ code }) {
  return (
    <div className="auth-card stack">
      <h2>Document not found</h2>
      <p className="muted">No certificate or letter matches the code <b>{code}</b>. Check the code and try again.</p>
      <Link className="btn" to="/verify">Try another code</Link>
    </div>
  );
}

function CourseCertificate({ code }) {
  const state = useAsync(() => api.get(`/lms/verify/${encodeURIComponent(code)}`), [code]);
  const c = state.data;
  return (
    <div className="verify-wrap cert-page">
      <Loading state={{ ...state, error: '' }}>
        {state.error && <NotFound code={code} />}
        {c && (
          <>
            <div className="verified-bar no-print"><span className="chip ok">Verified</span> This certificate is genuine and was issued by NexoneZ Software House.
              <button className="btn sm primary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>Print or save as PDF</button></div>
            <Certificate
              title="Certificate of Completion" subtitle="NEXONEZ LEARN" lead="This certificate is proudly presented to" name={c.student}
              body="for successfully completing the course" highlight={c.course} issuedAt={c.issuedAt} code={c.code}
            />
          </>
        )}
      </Loading>
    </div>
  );
}

const TYPE_LABEL = { internship: 'Internship certificate', experience: 'Experience letter' };

function LetterCheck({ code }) {
  const state = useAsync(() => api.get(`/docs/verify/${encodeURIComponent(code)}`), [code]);
  const v = state.data;
  return (
    <div className="verify-wrap cert-page">
      <Loading state={{ ...state, error: '' }}>
        {state.error && <NotFound code={code} />}
        {v && v.revoked && (
          <div className="auth-card stack"><span className="chip bad">Revoked</span><h2>This document is no longer valid</h2><p className="muted">{TYPE_LABEL[v.type]} <b>{v.code}</b> was issued by NexoneZ Software House but has since been withdrawn.</p></div>
        )}
        {v && v.valid && v.type === 'internship' && (
          <>
            <div className="verified-bar no-print"><span className="chip ok">Verified</span> This certificate is genuine and was issued by NexoneZ Software House.
              <button className="btn sm primary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>Print or save as PDF</button></div>
            <Certificate {...internshipProps({ person: { name: v.name }, data: { designation: v.designation, from: v.from, to: v.to, grade: v.grade, projects: (v.projects || []).map((name) => ({ name })) }, issuedAt: v.issuedAt, code: v.code })} />
          </>
        )}
        {v && v.valid && v.type === 'experience' && (
          <div className="auth-card stack">
            <span className="chip ok">Verified</span>
            <h2>Experience letter is genuine</h2>
            <p className="muted">NexoneZ Software House issued this letter.</p>
            <dl className="doc-grid">
              <div><dt>Name</dt><dd>{v.name}</dd></div>
              <div><dt>Designation</dt><dd>{v.designation || '-'}</dd></div>
              <div><dt>Period</dt><dd>{longDate(v.from)} to {v.to ? longDate(v.to) : 'present'}</dd></div>
              <div><dt>Issued</dt><dd>{longDate(v.issuedAt)}</dd></div>
              <div><dt>Reference</dt><dd>{v.refNo}</dd></div>
              {v.projects?.length > 0 && <div><dt>Projects</dt><dd>{v.projects.join(', ')}</dd></div>}
            </dl>
          </div>
        )}
      </Loading>
    </div>
  );
}
