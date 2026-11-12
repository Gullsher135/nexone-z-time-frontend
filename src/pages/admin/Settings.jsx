import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { useToast } from '../../lib/toast.jsx';
import { Field, Loading } from '../../components.jsx';
import { FULL_DAYS, fmtDate, todayKey } from '../../lib/format.js';
import { ipProblem, isPrivateIp, mapsEmbedUrl, mapsSearchUrl, validCoords } from '../../lib/net.js';

function Section({ title, hint, children, onSave, busy }) {
  return (
    <section className="panel">
      <div className="panel-head"><div><h2>{title}</h2>{hint && <p className="muted small">{hint}</p>}</div></div>
      <div className="panel-pad stack">
        {children}
        <div><button className="btn primary" onClick={onSave} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></div>
      </div>
    </section>
  );
}

function fmtAgo(d) {
  if (!d) return 'never';
  const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

export default function Settings() {
  const toast = useToast();
  const state = useAsync(() => api.get('/settings'), []);
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState('');
  const [newHoliday, setNewHoliday] = useState({ date: todayKey(), name: '' });
  const myIp = useAsync(() => api.get('/settings/my-ip'), []);
  const [mapLink, setMapLink] = useState('');
  const [finding, setFinding] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [ipError, setIpError] = useState('');

  useEffect(() => {
    if (state.data) {
      const x = state.data.settings;
      setS({
        weekendDays: x.weekendDays || [],
        holidays: x.holidays || [],
        office: { name: x.office?.name || '', lat: x.office?.lat ?? '', lng: x.office?.lng ?? '', radiusMeters: x.office?.radiusMeters ?? 150, enforceGeofence: !!x.office?.enforceGeofence },
        allowedIps: (x.allowedIps || []).join('\n'),
        enforceIp: !!x.enforceIp,
        autoIpEnabled: !!x.autoIpEnabled,
        autoIp: x.autoIp || null,
        officeSyncKey: x.officeSyncKey || '',
        requireQr: !!x.requireQr,
      });
    }
  }, [state.data]);

  async function save(key, body) {
    setBusy(key);
    try {
      await api.put('/settings', body);
      toast('Settings saved');
      state.reload();
    } catch (e) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  }

  async function makeKey() {
    try {
      const r = await api.post('/settings/office-sync-key');
      setS((x) => ({ ...x, officeSyncKey: r.settings.officeSyncKey }));
      toast('New office link created');
    } catch (e) {
      toast(e.message, 'bad');
    }
  }
  const copyText = async (t) => { try { await navigator.clipboard.writeText(t); } catch { window.prompt('Copy this link', t); } };

  function useMyLocation() {
    if (!navigator.geolocation) return toast('This device cannot share its location', 'bad');
    navigator.geolocation.getCurrentPosition(
      (p) => setS((x) => ({ ...x, office: { ...x.office, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) } })),
      () => toast('Location is blocked. Allow location access and try again.', 'bad'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function findOnMap() {
    if (!mapLink.trim()) return toast('Paste a Google Maps link or coordinates first', 'bad');
    setFinding(true);
    try {
      const r = await api.post('/settings/resolve-map', { link: mapLink.trim() });
      setS((x) => ({ ...x, office: { ...x.office, lat: r.lat, lng: r.lng } }));
      toast(`Location found: ${r.lat}, ${r.lng}. Press Save to keep it.`);
      setMapLink('');
    } catch (e) {
      toast(e.message, 'bad');
    } finally {
      setFinding(false);
    }
  }

  const ipList = () => s.allowedIps.split('\n').map((v) => v.trim()).filter(Boolean);
  function addIp(value) {
    const list = ipList();
    if (!list.includes(value)) setS((x) => ({ ...x, allowedIps: [...list, value].join('\n') }));
  }
  function addManualIp() {
    const problem = ipProblem(newIp);
    setIpError(problem);
    if (problem) return;
    addIp(newIp.trim());
    setNewIp('');
    toast('IP added to the list. Press Save to keep it.');
  }
  const privateLines = s ? ipList().filter((v) => isPrivateIp(v.replace(/\*$/, ''))) : [];

  const toggleDay = (d) => setS((x) => ({ ...x, weekendDays: x.weekendDays.includes(d) ? x.weekendDays.filter((v) => v !== d) : [...x.weekendDays, d] }));
  const setOffice = (k) => (e) => setS((x) => ({ ...x, office: { ...x.office, [k]: e.target.value } }));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="sub">Rules for working days and how people may check in.</p>
        </div>
      </div>
      <Loading state={state}>
        {s && (
          <div className="stack" style={{ maxWidth: 760 }}>
            <Section title="Working week" hint="Weekly days off. Nobody is marked absent on these days." busy={busy === 'week'}
              onSave={() => save('week', { weekendDays: s.weekendDays })}>
              <div className="row wrap" style={{ gap: 18 }}>
                {FULL_DAYS.map((d, i) => (
                  <label key={d} className="check"><input type="checkbox" checked={s.weekendDays.includes(i)} onChange={() => toggleDay(i)} /> {d}</label>
                ))}
              </div>
            </Section>

            <Section title="Holidays" hint="Public holidays and office closures." busy={busy === 'holidays'}
              onSave={() => save('holidays', { holidays: s.holidays })}>
              <div>
                {s.holidays.length === 0 && <p className="muted">No holidays added.</p>}
                {[...s.holidays].sort((a, b) => a.date.localeCompare(b.date)).map((h) => (
                  <div className="holiday-row" key={h.date}>
                    <span style={{ fontWeight: 600, minWidth: 130 }}>{fmtDate(h.date, true)}</span>
                    <span className="grow">{h.name}</span>
                    <button className="btn sm" onClick={() => setS((x) => ({ ...x, holidays: x.holidays.filter((v) => v.date !== h.date) }))}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="row wrap">
                <input type="date" value={newHoliday.date} onChange={(e) => setNewHoliday((h) => ({ ...h, date: e.target.value }))} style={{ width: 170 }} aria-label="Holiday date" />
                <input type="text" value={newHoliday.name} placeholder="Holiday name" onChange={(e) => setNewHoliday((h) => ({ ...h, name: e.target.value }))} style={{ width: 220 }} aria-label="Holiday name" />
                <button className="btn" onClick={() => {
                  if (!newHoliday.date) return;
                  setS((x) => ({ ...x, holidays: [...x.holidays.filter((v) => v.date !== newHoliday.date), { date: newHoliday.date, name: newHoliday.name || 'Holiday' }] }));
                  setNewHoliday({ date: todayKey(), name: '' });
                }}>Add holiday</button>
              </div>
              <p className="muted small">Remember to press Save after adding or removing holidays.</p>
            </Section>

            <Section title="Office location check" hint="When on, the Check in button works only within the radius below. Scanning the QR code is not affected." busy={busy === 'geo'}
              onSave={() => save('geo', { office: s.office })}>
              <div className="stepbox">
                <div className="stepbox-title">Set the office location from Google Maps <span className="muted small">(works from anywhere, you do not need to be at the office)</span></div>
                <ol className="steps">
                  <li>
                    Open Google Maps and find your office pin.{' '}
                    <a className="btn sm" target="_blank" rel="noopener noreferrer"
                      href={mapsSearchUrl(validCoords(s.office.lat, s.office.lng) ? `${s.office.lat},${s.office.lng}` : (s.office.name || 'NexoneZ Software House'))}>
                      Open Google Maps
                    </a>
                  </li>
                  <li>Tap your office pin, press <b>Share</b> and <b>Copy link</b>. (On a computer you can also copy the link from the address bar, or right-click the pin and click the numbers to copy them.)</li>
                  <li>Paste it here and press <b>Get location</b>.</li>
                </ol>
                <div className="row wrap">
                  <input type="text" className="grow" style={{ minWidth: 220 }} value={mapLink} placeholder="https://maps.app.goo.gl/...  or  33.5651, 71.4429"
                    onChange={(e) => setMapLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && findOnMap()} aria-label="Google Maps link or coordinates" />
                  <button className="btn primary" onClick={findOnMap} disabled={finding}>{finding ? 'Finding...' : 'Get location'}</button>
                </div>
              </div>
              <div className="form-grid">
                <Field label="Office name"><input type="text" value={s.office.name} onChange={setOffice('name')} /></Field>
                <Field label="Allowed distance (meters)"><input type="number" min="20" value={s.office.radiusMeters} onChange={setOffice('radiusMeters')} /></Field>
                <Field label="Latitude"><input type="number" step="any" value={s.office.lat} onChange={setOffice('lat')} /></Field>
                <Field label="Longitude"><input type="number" step="any" value={s.office.lng} onChange={setOffice('lng')} /></Field>
              </div>
              {validCoords(s.office.lat, s.office.lng) ? (
                <div className="map-preview">
                  <iframe title="Office location preview" src={mapsEmbedUrl(s.office.lat, s.office.lng)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  <div className="row wrap">
                    <a className="btn sm" target="_blank" rel="noopener noreferrer" href={mapsSearchUrl(`${s.office.lat},${s.office.lng}`)}>Open this spot in Google Maps</a>
                    <span className="muted small">Check that the pin is on your office, then press Save.</span>
                  </div>
                </div>
              ) : (
                <p className="muted small">No location set yet. Use the steps above, or type the latitude and longitude.</p>
              )}
              <div className="row wrap">
                <button className="btn ghost" onClick={useMyLocation}>Use my current location</button>
                <span className="muted small">Only if you are standing at the office right now.</span>
              </div>
              <label className="check"><input type="checkbox" checked={s.office.enforceGeofence} onChange={(e) => setS((x) => ({ ...x, office: { ...x.office, enforceGeofence: e.target.checked } }))} /> Require staff to be at the office to check in</label>
            </Section>

            <Section title="Office network check" hint="Allow the Check in button only from your office internet connection." busy={busy === 'ip'}
              onSave={() => save('ip', { allowedIps: s.allowedIps, enforceIp: s.enforceIp, autoIpEnabled: s.autoIpEnabled })}>
              <div className="stepbox">
                <div className="stepbox-title">Keep the office address updated automatically (recommended)</div>
                <p className="small">
                  Office internet often gets a new address after a restart, or on some days. With this on, a device that stays at the office (a PC, laptop or old phone) opens a private link
                  and tells the server the office&apos;s current address every minute. Staff keep passing the network check without you changing anything. No login and no QR code are needed.
                </p>
                <label className="check"><input type="checkbox" checked={s.autoIpEnabled} onChange={(e) => setS((x) => ({ ...x, autoIpEnabled: e.target.checked }))} /> Update the office IP automatically from a device at the office</label>
                {s.autoIpEnabled && (
                  <div style={{ marginTop: 10 }}>
                    <div className="small">
                      {s.autoIp?.ip
                        ? <>Current office address: <b className="num">{s.autoIp.ip}</b>, last reported {fmtAgo(s.autoIp.seenAt)}.</>
                        : <>No device has reported yet.</>}
                    </div>
                    {s.officeSyncKey ? (
                      <>
                        <div className="small" style={{ marginTop: 10 }}>Open this link <b>on the office device</b> and leave the page open:</div>
                        <input type="text" readOnly value={`${window.location.origin}/office-sync/${s.officeSyncKey}`} onFocus={(e) => e.target.select()} aria-label="Office device link" style={{ marginTop: 6 }} />
                        <div className="row wrap" style={{ marginTop: 8 }}>
                          <button className="btn sm primary" onClick={() => copyText(`${window.location.origin}/office-sync/${s.officeSyncKey}`).then(() => toast('Link copied'))}>Copy link</button>
                          <button className="btn sm" onClick={makeKey}>Make a new link</button>
                        </div>
                        <p className="muted small" style={{ marginTop: 6 }}>Keep this link private. If someone else gets it, press <b>Make a new link</b> and open the new one at the office. The old one stops working.</p>
                      </>
                    ) : (
                      <div className="row wrap" style={{ marginTop: 8 }}><button className="btn sm primary" onClick={makeKey}>Create the office link</button></div>
                    )}
                    <p className="muted small" style={{ marginTop: 6 }}>Remember to press <b>Save</b> below after turning this on.</p>
                  </div>
                )}
              </div>
              <div className="stepbox">
                <div className="stepbox-title">Or add a fixed office internet address by hand (works from anywhere)</div>
                <p className="small">
                  Staff are checked against the <b>public IP address</b> of the office internet connection, not the Wi-Fi name and not the router login address (such as 192.168.1.1).
                  On the router, open <b>Status, Internet or WAN</b> and copy the <b>IP Address</b> shown there. It must not start with 192.168, 10., 172.16 to 172.31 or 100.64 to 100.127.
                </p>
                <div className="row wrap">
                  <input type="text" style={{ width: 230 }} value={newIp} placeholder="e.g. 203.0.113.25" aria-label="Office public IP address"
                    onChange={(e) => { setNewIp(e.target.value); setIpError(''); }} onKeyDown={(e) => e.key === 'Enter' && addManualIp()} />
                  <button className="btn primary" onClick={addManualIp}>Add IP</button>
                </div>
                {ipError && <div className="alert bad" role="alert" style={{ marginTop: 10 }}>{ipError}</div>}
              </div>
              <div className="alert info">
                <div>The connection you are using right now: <b className="num">{myIp.data?.ip || (myIp.loading ? 'checking...' : 'unknown')}</b></div>
                <div className="small" style={{ marginTop: 4 }}>
                  Use <b>Add my current IP</b> only when you are on the office Wi-Fi. If you are somewhere else, add the office address with the box above instead.
                </div>
                {myIp.data?.isPrivate && (
                  <div className="small" style={{ marginTop: 4 }}>
                    This is a private address, so the server cannot see your real internet IP. Redeploy the latest backend on Render, or you are running it on your own computer.
                    {myIp.data.seen && <div className="muted" style={{ marginTop: 4, wordBreak: 'break-all' }}>Server sees: {myIp.data.seen.peer || '-'} · forwarded: {myIp.data.seen.forwardedFor || '-'} · edge: {myIp.data.seen.cf || '-'}</div>}
                  </div>
                )}
                <div style={{ marginTop: 10 }} className="row wrap">
                  <button className="btn sm" disabled={!myIp.data?.ip} onClick={() => addIp(myIp.data.ip)}>Add my current IP</button>
                  <button className="btn sm ghost" onClick={myIp.reload}>Check again</button>
                </div>
              </div>
              <Field label="Allowed IP addresses (added by hand)" hint="One per line. Use * at the end to match a range, such as 203.0.113.*. An office internet connection can change its address now and then unless you ask your internet provider for a fixed (static) IP; if staff are refused at the office, add the new address.">
                <textarea value={s.allowedIps} onChange={(e) => setS((x) => ({ ...x, allowedIps: e.target.value }))} placeholder="203.0.113.25" />
              </Field>
              {privateLines.length > 0 && (
                <div className="alert bad" role="alert">
                  {privateLines.join(', ')} {privateLines.length > 1 ? 'are private addresses' : 'is a private address'} and will never match. Replace {privateLines.length > 1 ? 'them' : 'it'} with the public IP of the internet connection.
                </div>
              )}
              <label className="check"><input type="checkbox" checked={s.enforceIp} onChange={(e) => setS((x) => ({ ...x, enforceIp: e.target.checked }))} /> Require the office network to check in</label>
              <p className="muted small">When on, people who are not on the office network cannot use the Check in button. They can still scan the office QR code unless you turn on QR only.</p>
            </Section>

            <Section title="QR code only" hint="The strictest option. The Check in button is turned off and everyone must scan the Office QR page." busy={busy === 'qr'}
              onSave={() => save('qr', { requireQr: s.requireQr })}>
              <label className="check"><input type="checkbox" checked={s.requireQr} onChange={(e) => setS((x) => ({ ...x, requireQr: e.target.checked }))} /> Allow check-in only by scanning the QR code</label>
            </Section>
          </div>
        )}
      </Loading>
    </div>
  );
}
