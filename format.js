export function fmtSize(b = 0) {
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}
export function fmtClock(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, r = s % 60;
  const mm = String(m).padStart(2, '0'), ss = String(r).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
export const fmtDuration = (s) => (s > 0 ? fmtClock(s) : '—');
export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
// Editor timestamps: HH:MM:SS.mmm
export function fmtStamp(sec) {
  const ms = Math.round(Math.max(0, sec) * 1000);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
}
export function parseStamp(str) {
  const m = String(str).trim().match(/^(?:(\d+):)?(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return NaN;
  const [, a, b, c] = m;
  // "1:02" => min:sec ; "1:02:03" => h:m:s
  if (a !== undefined && b === undefined) return Number(a) * 60 + Number(c);
  return (Number(a || 0) * 3600) + (Number(b || 0) * 60) + Number(c);
}
