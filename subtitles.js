const pad = (n, l = 2) => String(n).padStart(l, '0');

function parts(sec) {
  const ms = Math.round(sec * 1000);
  return { h: Math.floor(ms / 3600000), m: Math.floor(ms / 60000) % 60, s: Math.floor(ms / 1000) % 60, ms: ms % 1000 };
}
export const srtTime = (t) => { const p = parts(t); return `${pad(p.h)}:${pad(p.m)}:${pad(p.s)},${pad(p.ms, 3)}`; };
export const vttTime = (t) => srtTime(t).replace(',', '.');

export function toSrt(segments, field = 'translated') {
  return segments.map((s, i) => `${i + 1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s[field] ?? s.text}\n`).join('\n');
}
export function toVtt(segments, field = 'translated') {
  return 'WEBVTT\n\n' + segments.map((s) => `${vttTime(s.start)} --> ${vttTime(s.end)}\n${s[field] ?? s.text}\n`).join('\n');
}

export function validateSegments(list) {
  if (!Array.isArray(list) || list.length > 5000) return null;
  const out = [];
  for (const s of list) {
    const start = Number(s.start), end = Number(s.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return null;
    out.push({ start, end, text: String(s.text ?? '').slice(0, 1000), translated: String(s.translated ?? '').slice(0, 1000) });
  }
  return out;
}
