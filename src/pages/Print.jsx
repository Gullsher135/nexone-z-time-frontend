import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { Loading } from '../components.jsx';
import { fmtDate, METHOD_LABEL, monthLabel, rs } from '../lib/format.js';
import { Certificate, LetterSheet, internshipProps } from '../documents.jsx';

function Sheet({ title, children, meta }) {
  return (
    <div className="print-page">
      <div className="no-print print-bar"><button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button></div>
      <div className="doc">
        <header className="doc-head">
          <img src="/hub-icon.svg" alt="" />
          <div className="grow"><b>NexoneZ Software House</b><div className="muted small">Yousuf Plaza, Gate #3, Kohat</div></div>
          <div className="doc-title"><h1>{title}</h1>{meta}</div>
        </header>
        {children}
        <footer className="doc-foot">This is a computer-generated document from NexoneZ Hub.</footer>
      </div>
    </div>
  );
}

export function Receipt() {
  const { id } = useParams();
  const state = useAsync(() => api.get(`/pay/payments/${id}`), [id]);
  const r = state.data?.receipt;
  const sm = state.data?.summary;
  return (
    <Loading state={state}>
      {r && (
        <Sheet title="Fee receipt" meta={<div className="small">No. <b>{r.receiptNo}</b><br />Date {fmtDate(r.date, true)}</div>}>
          <dl className="doc-grid">
            <div><dt>Received from</dt><dd>{r.student.name}</dd></div>
            <div><dt>Student ID</dt><dd>{r.student.code}</dd></div>
            {r.student.batch && <div><dt>Batch</dt><dd>{r.student.batch.name}</dd></div>}
            <div><dt>Payment method</dt><dd>{METHOD_LABEL[r.method]}{r.reference ? ` (${r.reference})` : ''}</dd></div>
          </dl>
          <div className="doc-amount"><span>Amount received</span><b>{rs(r.amount)}</b></div>
          {sm && <table className="doc-table"><tbody>
            <tr><td>Total fee</td><td className="r">{rs(sm.total)}</td></tr>
            <tr><td>Total paid to date</td><td className="r">{rs(sm.paid)}</td></tr>
            <tr><td><b>Remaining balance</b></td><td className="r"><b>{rs(sm.balance)}</b></td></tr>
          </tbody></table>}
          <div className="doc-sign"><span>Received by {r.receivedBy?.name || 'NexoneZ'}</span><span>Signature / stamp</span></div>
        </Sheet>
      )}
    </Loading>
  );
}

export function PayslipDoc() {
  const { id } = useParams();
  const state = useAsync(() => api.get(`/pay/payslips/${id}`), [id]);
  const s = state.data?.payslip;
  return (
    <Loading state={state}>
      {s && (
        <Sheet title="Payslip" meta={<div className="small"><b>{monthLabel(s.month)}</b><br />{s.status === 'paid' ? `Paid ${fmtDate(s.paidAt?.slice(0, 10), true)}` : 'Draft'}</div>}>
          <dl className="doc-grid">
            <div><dt>Employee</dt><dd>{s.user.name}</dd></div>
            <div><dt>Staff ID</dt><dd>{s.user.code}</dd></div>
            <div><dt>Designation</dt><dd>{s.user.designation || s.user.role}</dd></div>
            <div><dt>Attendance</dt><dd>{s.paidDays} of {s.workingDays} working days{s.absentDays ? ` (${s.absentDays} absent)` : ''}</dd></div>
          </dl>
          <table className="doc-table">
            <thead><tr><th>Earnings</th><th className="r">Rs</th></tr></thead>
            <tbody>
              <tr><td>Basic salary</td><td className="r">{rs(s.base).slice(3)}</td></tr>
              {s.allowances.map((a, i) => <tr key={i}><td>{a.label}</td><td className="r">{rs(a.amount).slice(3)}</td></tr>)}
              {s.items.filter((i) => i.amount > 0).map((a, i) => <tr key={i}><td>{a.label}</td><td className="r">{rs(a.amount).slice(3)}</td></tr>)}
            </tbody>
            <thead><tr><th>Deductions</th><th className="r">Rs</th></tr></thead>
            <tbody>
              {s.absentDeduction > 0 && <tr><td>Absent days ({s.absentDays} x {rs(s.perDay).slice(3)})</td><td className="r">{rs(s.absentDeduction).slice(3)}</td></tr>}
              {s.items.filter((i) => i.amount < 0).map((a, i) => <tr key={i}><td>{a.label}</td><td className="r">{rs(-a.amount).slice(3)}</td></tr>)}
              {s.deductions === 0 && <tr><td className="muted">None</td><td className="r">0</td></tr>}
            </tbody>
          </table>
          <div className="doc-amount"><span>Net salary{s.method ? ` (${METHOD_LABEL[s.method]})` : ''}</span><b>{rs(s.net)}</b></div>
          <div className="doc-sign"><span>Prepared by NexoneZ Hub</span><span>Employee signature</span></div>
        </Sheet>
      )}
    </Loading>
  );
}

export function LetterDoc() {
  const { id } = useParams();
  const state = useAsync(() => api.get(`/docs/letters/${id}`), [id]);
  const l = state.data?.letter;
  return (
    <Loading state={state}>
      {l && (
        <div className={l.type === 'internship' ? 'letter-wrap cert-page' : 'letter-wrap letter-page'}>
          <div className="no-print print-bar"><button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button>{l.status === 'revoked' && <span className="chip bad" style={{ marginLeft: 10 }}>Revoked</span>}</div>
          {l.type === 'internship' ? <div className="cert-center"><Certificate {...internshipProps(l)} /></div> : <LetterSheet letter={l} />}
        </div>
      )}
    </Loading>
  );
}
