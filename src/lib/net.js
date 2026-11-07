// Small helpers for the office network and location settings.

const v4 = /^(\d{1,3})(\.\d{1,3}){3}$/;

export function ipProblem(raw) {
  const v = String(raw).trim();
  if (!v) return 'Type an IP address first.';
  const body = v.endsWith('*') ? v.slice(0, -1) : v;
  const looksV4 = v.endsWith('*') ? /^\d{1,3}(\.\d{1,3}){0,2}\.$/.test(body) : v4.test(v);
  const looksV6 = v.includes(':') && /^[0-9a-f:]+$/i.test(body) && (v.endsWith('*') ? body.endsWith(':') : true);
  if (!looksV4 && !looksV6) return 'That is not a valid IP address. Use a form like 203.0.113.25 or 203.0.113.*';
  if (looksV4 && body.split('.').filter(Boolean).some((n) => Number(n) > 255)) return 'Each part of an IP address must be between 0 and 255.';
  if (looksV4 && isPrivateIp(body)) {
    return 'This looks like a private address from inside your network (the router page address). The server cannot see those. Use the public IP address of your internet connection instead.';
  }
  return '';
}

export function isPrivateIp(ip) {
  const p = String(ip).split('.').map((n) => Number(n));
  if (p.length < 2 || p.some((n) => Number.isNaN(n))) return false;
  const [a, b] = p;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
}

export const validCoords = (lat, lng) => {
  const a = Number(lat);
  const b = Number(lng);
  return lat !== '' && lng !== '' && lat != null && lng != null && Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180;
};

export const mapsSearchUrl = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
export const mapsEmbedUrl = (lat, lng) => `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
