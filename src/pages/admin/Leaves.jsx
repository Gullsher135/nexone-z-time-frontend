import { useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Empty, Field, Loading, Modal } from '../../components.jsx';
import { daysInclusive, fmtDate } from '../../lib/format.js';

const TONE = { pending: 'warn', approved: 'ok', rejected: 'bad' };
const LABEL = { pending: 'Waiting', approved: 'Approved', rejected: 'Rejected' };

export default function AdminLeaves() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const state = useAsync(() => api.get(`/leaves${qs({ status })}`), [status]);
  const [review, setReview] = useState(null); // { leave, decision }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.patch(`/leaves/${review.leave._id}/review`, { status: review.decision, reviewNote: note });
      toast(review.decision === 'approved' ? 'Leave approved' : 'Leave rejected');
      setReview(null);
      setNote('');
      state.reload();
    } catch (e) {
      toast(e.message, 'bad');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Leave requests</h1>
          <p className="sub">Approved leave days are not counted as absences in reports.</p>
        </div>
        <div className="tools">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="pending">Waiting for approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <Loading state={state}>
          {state.data && (state.data.items.length === 0 ? (
            <Empty title="No leave requests here">{status === 'pending' ? 'Nothing is waiting for your approval.' : 'Nothing matches this filter.'}</Empty>
          ) : state.data.items.map((l) => {
            const n = daysInclusive(l.fromDate, l.toDate);
            return (
              <div className="list-row" key={l._id}>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>
                    {l.user?.name} <span className="tag">{l.user?.role}</span>
                  </div>
                  <div className="small">
                    {fmtDate(l.fromDate)}{l.toDate !== l.fromDate && ` to ${fmtDate(l.toDate)}`} · {n} day{n > 1 ? 's' : ''} · {l.type}
                  </div>
                  <div className="muted small">{l.reason}</div>
                  {l.reviewNote && <div className="small">Note: {l.reviewNote}</div>}
                </div>
                <span className={`chip ${TONE[l.status]}`}>{LABEL[l.status]}</span>
                {l.status === 'pending' ? (
                  <div className="row">
                    <button className="btn sm primary" onClick={() => { setReview({ leave: l, decision: 'approved' }); setNote(''); }}>Approve</button>
                    <button className="btn sm danger" onClick={() => { setReview({ leave: l, decision: 'rejected' }); setNote(''); }}>Reject</button>
                  </div>
                ) : (
                  <button className="btn sm" onClick={() => { setReview({ leave: l, decision: l.status === 'approved' ? 'rejected' : 'approved' }); setNote(''); }}>
                    Change to {l.status === 'approved' ? 'rejected' : 'approved'}
                  </button>
                )}
              </div>
            );
          }))}
        </Loading>
      </div>

      {review && (
        <Modal title={review.decision === 'approved' ? 'Approve leave' : 'Reject leave'} onClose={() => setReview(null)}
          footer={<><button className="btn" onClick={() => setReview(null)}>Cancel</button>
            <button className={`btn ${review.decision === 'approved' ? 'primary' : 'danger'}`} onClick={submit} disabled={busy}>
              {review.decision === 'approved' ? 'Approve' : 'Reject'}
            </button></>}>
          <p style={{ marginBottom: 14 }}>
            {review.leave.user?.name}, {fmtDate(review.leave.fromDate)}
            {review.leave.toDate !== review.leave.fromDate && ` to ${fmtDate(review.leave.toDate)}`}
          </p>
          <Field label="Note for the requester (optional)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
