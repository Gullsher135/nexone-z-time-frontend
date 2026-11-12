import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { Loading } from '../components.jsx';

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
  return <Certificate code={code} />;
}

function Certificate({ code }) {
  const state = useAsync(() => api.get(`/lms/verify/${encodeURIComponent(code)}`), [code]);
  const c = state.data;
  return (
    <div className="verify-wrap">
      <Loading state={{ ...state, error: '' }}>
        {state.error && (
          <div className="auth-card stack">
            <h2>Certificate not found</h2>
            <p className="muted">No certificate matches the code <b>{code}</b>. Check the code and try again.</p>
            <Link className="btn" to="/verify">Try another code</Link>
          </div>
        )}
        {c && (
          <>
            <div className="verified-bar no-print"><span className="chip ok">Verified</span> This certificate is genuine and was issued by NexoneZ Software House.
              <button className="btn sm primary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>Print or save as PDF</button></div>
            <div className="cert" role="document" aria-label="Certificate of completion">
              <div className="cert-inner">
                <div className="cert-logos"><img src="/hub-icon.svg" alt="" /><img src="/learn-icon.svg" alt="" /></div>
                <div className="cert-org">NEXONEZ SOFTWARE HOUSE · KOHAT</div>
                <h1>Certificate of Completion</h1>
                <p className="cert-lead">This is to certify that</p>
                <div className="cert-name">{c.student}</div>
                <p className="cert-lead">has successfully completed the course</p>
                <div className="cert-course">{c.course}</div>
                <div className="cert-foot">
                  <div><b>{fmt(c.issuedAt)}</b><span>Date of issue</span></div>
                  <div className="cert-seal" aria-hidden="true"><img src="/hub-icon.svg" alt="" /></div>
                  <div><b>{c.code}</b><span>Certificate ID</span></div>
                </div>
                <div className="cert-verify">Verify at {window.location.host}/verify/{c.code}</div>
              </div>
            </div>
          </>
        )}
      </Loading>
    </div>
  );
}
