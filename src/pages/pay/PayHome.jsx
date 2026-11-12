import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading } from '../../components.jsx';
import { monthLabel, rs } from '../../lib/format.js';

export default function PayHome() {
  const ov = useAsync(() => api.get('/pay/overview'), []);
  const od = useAsync(() => api.get('/pay/fees?status=overdue'), []);
  const o = ov.data;
  return (
    <>
      <div className="page-head"><div><h1>NexoneZ Pay</h1><p className="sub">Student fees, receipts, salaries and payslips.</p></div></div>
      <Loading state={ov}>
        {o && (
          <>
            <div className="panel kpis" style={{ marginBottom: 20 }}>
              <div className="kpi"><div className="v">{rs(o.collectedThisMonth)}</div><div className="l">Collected this month</div></div>
              <div className="kpi"><div className="v">{rs(o.outstanding)}</div><div className="l">Fees outstanding</div></div>
              <div className="kpi"><div className="v">{o.overdueCount}</div><div className="l">Students overdue ({rs(o.overdueAmount)})</div></div>
              <div className="kpi"><div className="v">{o.payrollPaid}/{o.payrollTotal}</div><div className="l">Salaries paid, {monthLabel(o.payrollMonth)}</div></div>
            </div>
            {o.withoutPlan > 0 && <div className="alert warn" style={{ marginBottom: 16 }}>{o.withoutPlan} students have no fee plan yet. <Link to="/admin/pay/fees?status=noplan">Set them up</Link></div>}
          </>
        )}
      </Loading>
      <div className="panel">
        <div className="panel-head"><h2>Overdue fees</h2><Link to="/admin/pay/fees?status=overdue" className="small">Open list</Link></div>
        <Loading state={od}>
          {od.data && (od.data.items.length === 0 ? <Empty title="Nobody is overdue">All students are up to date.</Empty> : od.data.items.slice(0, 8).map((s) => (
            <div className="list-row" key={s._id}>
              <div className="grow"><div style={{ fontWeight: 600 }}>{s.name}</div><div className="muted small">{s.batch?.name || 'No batch'} · {s.code}</div></div>
              <span className="chip bad">{rs(s.plan.overdue)} overdue</span>
            </div>
          )))}
        </Loading>
      </div>
    </>
  );
}
