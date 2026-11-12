import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { TimeBrand, ProductOf } from '../brand.jsx';

// Opened on a device that stays at the office (a PC, laptop or old phone). No login needed: the secret
// in the link is the key. Every minute it tells the server the office's current internet address.
export default function OfficeSync() {
  const { key } = useParams();
  const [state, setState] = useState({ status: 'connecting' });

  useEffect(() => {
    let stop = false;
    let timer;
    let lock;
    async function ping() {
      try {
        const r = await api.post(`/office-sync/${encodeURIComponent(key)}`);
        if (!stop) setState({ status: 'ok', ip: r.ip, at: new Date() });
      } catch (e) {
        if (!stop) setState((s) => ({ status: 'error', message: e.message, ip: s.ip }));
      }
      if (!stop) timer = setTimeout(ping, 60000);
    }
    ping();
    // Ask the screen to stay awake where the browser allows it.
    const wake = async () => {
      try { lock = await navigator.wakeLock?.request('screen'); } catch { /* not supported */ }
    };
    wake();
    const onVisible = () => { if (document.visibilityState === 'visible') { wake(); } };
    document.addEventListener('visibilitychange', onVisible);
    return () => { stop = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); lock?.release?.().catch(() => {}); };
  }, [key]);

  const time = state.at ? state.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <div className="auth-main" style={{ minHeight: '100dvh', flexDirection: 'column', gap: 20 }}>
      <TimeBrand sub="Office connection" />
      <div className="panel panel-pad" style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        {state.status === 'connecting' && <p>Connecting...</p>}
        {state.status === 'ok' && (
          <>
            <div className="chip ok" style={{ margin: '0 auto 12px' }}>Connected</div>
            <h1 style={{ fontSize: 22 }}>Office internet address</h1>
            <p className="num" style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>{state.ip}</p>
            <p className="muted small">Last updated {time}. It updates every minute.</p>
          </>
        )}
        {state.status === 'error' && (
          <>
            <div className="alert bad" role="alert">{state.message}</div>
            {state.ip && <p className="muted small" style={{ marginTop: 10 }}>Last known address: {state.ip}. Trying again every minute.</p>}
          </>
        )}
        <p className="small" style={{ marginTop: 16 }}>
          Leave this page open on this device while it is at the office and on the office Wi-Fi. Staff can then check in even when the office internet address changes.
        </p>
      </div>
      <ProductOf />
    </div>
  );
}
