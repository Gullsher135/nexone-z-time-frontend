import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Spinner } from '../components.jsx';

// Opened by scanning the office QR code with the phone camera.
export default function Scan() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true });
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const token = params.get('t');
    if (!token) {
      setState({ error: 'This link has no QR code in it. Scan the code shown at the office again.' });
      return;
    }
    api
      .post('/attendance/punch', { method: 'qr', qrToken: token })
      .then((r) => setState({ result: r }))
      .catch((e) => setState({ error: e.message }));
  }, [params]);

  return (
    <div className="auth-main" style={{ minHeight: '100vh' }}>
      <div className="auth-card stack" style={{ textAlign: 'center' }}>
        {state.loading && <Spinner />}
        {state.result && (
          <>
            <h2>{state.result.message}</h2>
            <p className="muted">Your attendance has been recorded.</p>
          </>
        )}
        {state.error && (
          <>
            <h2>Could not record attendance</h2>
            <div className="alert bad" role="alert">{state.error}</div>
          </>
        )}
        {!state.loading && <Link className="btn primary" to="/time">Go to my day</Link>}
      </div>
    </div>
  );
}
