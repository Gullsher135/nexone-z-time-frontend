import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading } from '../../components.jsx';
import { fmtDate, monthLabel, rs } from '../../lib/format.js';

export default function Payslips() {
  const state = useAsync(() => api.get('/pay/my-payslips'), []);
  return (
    <>
      <div className="page-head"><div><h1>Payslips</h1><p className="sub">Your salary slips, once the month's salary has been paid.</p></div></div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0 ? <div className="panel"><Empty title="No payslips yet">Your payslip appears here after your salary is paid.</Empty></div> : (
          <div className="panel">{state.data.items.map((s) => (
            <div className="list-row" key={s._id}>
              <div className="grow"><b>{monthLabel(s.month)}</b><div className="muted small">Paid {fmtDate(s.paidAt?.slice(0, 10), true)}{s.absentDays ? ` · ${s.absentDays} absent day(s)` : ''}</div></div>
              <b className="num">{rs(s.net)}</b>
              <a className="btn sm primary" href={`/print/payslip/${s._id}`} target="_blank" rel="noreferrer">View and print</a>
            </div>
          ))}</div>
        ))}
      </Loading>
    </>
  );
}
