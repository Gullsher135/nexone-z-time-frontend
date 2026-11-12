import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading, ProgressBar } from '../../components.jsx';
import { fmtDate, METHOD_LABEL, rs } from '../../lib/format.js';

const TONE = { paid: 'ok', due: 'info', overdue: 'bad' };
const LABEL = { paid: 'All paid', due: 'Payment due', overdue: 'Overdue' };

export default function MyFees() {
  const state = useAsync(() => api.get('/pay/my-fees'), []);
  const d = state.data;
  const sm = d?.summary;
  return (
    <>
      <div className="page-head"><div><h1>My fees</h1><p className="sub">Your fee plan, payments and receipts.</p></div></div>
      <Loading state={state}>
        {d && (!sm ? <div className="panel"><Empty title="No fee plan yet">The office will set up your fee plan. Ask at the front desk if you have questions.</Empty></div> : (
          <>
            <div className="panel panel-pad stack" style={{ marginBottom: 16 }}>
              <div className="row"><span className={`chip ${TONE[sm.status]}`}>{LABEL[sm.status]}</span>{sm.overdue > 0 && <b style={{ color: 'var(--bad)' }}>{rs(sm.overdue)} overdue</b>}</div>
              <div className="ledger-sum"><div><span>Total fee</span><b>{rs(sm.total)}</b></div><div><span>Paid</span><b>{rs(sm.paid)}</b></div><div><span>Balance</span><b>{rs(sm.balance)}</b></div>{sm.next && <div><span>Next due</span><b>{fmtDate(sm.next.dueDate)}</b></div>}</div>
              <ProgressBar value={sm.total ? Math.round((sm.paid / sm.total) * 100) : 0} label="Fees paid" />
            </div>
            <div className="dash-grid">
              <div className="panel"><div className="panel-head"><h2>Schedule</h2></div>
                {d.account.installments.length === 0 ? <div className="panel-pad muted">One payment of {rs(sm.total)}.</div> : d.account.installments.map((i, n) => (
                  <div className="list-row" key={n}><div className="grow">{i.label || `Installment ${n + 1}`}</div><span className="muted small">{fmtDate(i.dueDate, true)}</span><b className="num">{rs(i.amount)}</b></div>
                ))}</div>
              <div className="panel"><div className="panel-head"><h2>Receipts</h2></div>
                {d.payments.length === 0 ? <div className="panel-pad muted">No payments yet.</div> : d.payments.map((p) => (
                  <div className="list-row" key={p._id}><div className="grow"><b>{p.receiptNo}</b><div className="muted small">{fmtDate(p.date, true)} · {METHOD_LABEL[p.method]}</div></div><b className="num">{rs(p.amount)}</b><a className="btn sm" href={`/print/receipt/${p._id}`} target="_blank" rel="noreferrer">Print</a></div>
                ))}</div>
            </div>
          </>
        ))}
      </Loading>
    </>
  );
}
