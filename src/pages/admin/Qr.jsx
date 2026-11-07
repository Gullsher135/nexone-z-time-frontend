import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api.js';
import { nowParts } from '../../lib/format.js';

export default function Qr() {
  const [qr, setQr] = useState(null);
  const [left, setLeft] = useState(60);
  const [error, setError] = useState('');
  const [time, setTime] = useState(nowParts());
  const expiresAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer;
    async function load() {
      try {
        const r = await api.get('/attendance/qr');
        if (cancelled) return;
        setQr(r.token);
        setError('');
        expiresAt.current = Date.now() + r.expiresInMs;
        timer = setTimeout(load, Math.max(1500, r.expiresInMs - 500));
      } catch (e) {
        if (cancelled) return;
        setError(e.message);
        timer = setTimeout(load, 5000);
      }
    }
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(nowParts());
      setLeft(Math.max(0, Math.round((expiresAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const url = qr ? `${window.location.origin}/scan?t=${qr}` : '';
  const h12 = time.h % 12 || 12;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Office QR</h1>
          <p className="sub">Keep this page open on a screen at the office entrance.</p>
        </div>
      </div>
      <div className="panel kiosk">
        <div className="clock">{h12}:{String(time.m).padStart(2, '0')}<small>{time.h >= 12 ? 'pm' : 'am'}</small></div>
        {error && <div className="alert bad" role="alert">{error}</div>}
        <div className="qr-frame">
          {qr ? <QRCodeSVG value={url} size={280} level="M" fgColor="#16143a" /> : <div style={{ width: 280, height: 280 }} className="center-pad"><div className="spinner" /></div>}
        </div>
        <div className="countdown" aria-hidden="true"><i style={{ width: `${(left / 60) * 100}%` }} /></div>
        <p style={{ maxWidth: 420 }}>
          Open your phone camera and scan this code to check in or out. The code changes every minute, so a photo of it will not work.
        </p>
      </div>
    </div>
  );
}
