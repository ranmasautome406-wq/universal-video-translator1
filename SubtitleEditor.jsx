import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { langName } from '../utils/languages.js';
import { fmtStamp, parseStamp } from '../utils/format.js';
import { DemoTag, ErrorNote, Spinner } from '../components/ui.jsx';

let uid = 0;
const withKey = (s) => ({ ...s, key: ++uid });

function TimeField({ label, value, onChange }) {
  const [text, setText] = useState(fmtStamp(value));
  const [bad, setBad] = useState(false);
  useEffect(() => { setText(fmtStamp(value)); setBad(false); }, [value]);
  return (
    <label className="block text-xs text-slate-400">{label}
      <input className={`input mt-1 !py-2 font-mono ${bad ? '!border-red-400' : ''}`} value={text} aria-invalid={bad} inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { const n = parseStamp(text); if (Number.isNaN(n)) setBad(true); else { setBad(false); onChange(n); setText(fmtStamp(n)); } }} />
    </label>
  );
}

export default function SubtitleEditor() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api(`/api/translate/${jobId}/status`), api(`/api/subtitles/${jobId}`)])
      .then(([s, d]) => { setJob({ ...s.job, demo: d.demo }); setRows(d.segments.map(withKey)); })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [jobId]);

  const total = useMemo(() => Math.max(1, ...rows.map((r) => r.end)), [rows]);
  const patch = (key, p) => { setSaved(false); setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r))); };
  const add = () => {
    setSaved(false);
    const start = rows.length ? Math.max(...rows.map((r) => r.end)) + 0.5 : 0;
    setRows((rs) => [...rs, withKey({ start, end: start + 3, text: '', translated: '' })]);
  };
  const remove = (key) => { setSaved(false); setRows((rs) => rs.filter((r) => r.key !== key)); };

  const save = async () => {
    setError(''); setSaved(false);
    const bad = rows.findIndex((r) => !(r.end > r.start));
    if (bad >= 0) return setError(`Subtitle ${bad + 1}: the end time must be after the start time.`);
    setSaving(true);
    try {
      const d = await api(`/api/subtitles/${jobId}`, { method: 'PUT', body: { segments: rows.map(({ start, end, text, translated }) => ({ start, end, text, translated })) } });
      setRows(d.segments.map(withKey)); setSaved(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  if (!job) return <section className="container-x py-12"><ErrorNote>{error || 'Subtitles not found.'}</ErrorNote><Link to="/dashboard" className="btn-ghost mt-4">Back to dashboard</Link></section>;

  return (
    <section className="container-x max-w-4xl py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Subtitle editor</h1>
          <p className="mt-1 text-sm text-slate-400">{langName(job.detectedLanguage)} → {langName(job.targetLanguage)} · {rows.length} lines</p>
        </div>
        {job.demo && <DemoTag />}
      </div>
      <div className="mt-5 space-y-3">
        {error && <ErrorNote>{error}</ErrorNote>}
        {rows.length === 0 && <p className="glass p-6 text-center text-slate-400">No subtitles yet. Add the first one.</p>}
        {rows.map((r, i) => (
          <article key={r.key} className="glass p-4" aria-label={`Subtitle ${i + 1}`}>
            <div className="relative mb-3 h-1.5 rounded-full bg-white/10" aria-hidden="true">
              <span className="absolute h-full rounded-full bg-brand" style={{ left: `${(r.start / total) * 100}%`, width: `${Math.max(1, ((r.end - r.start) / total) * 100)}%` }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[9rem_9rem_1fr_1fr_auto] sm:items-start">
              <TimeField label="Start" value={r.start} onChange={(n) => patch(r.key, { start: n })} />
              <TimeField label="End" value={r.end} onChange={(n) => patch(r.key, { end: n })} />
              <label className="block text-xs text-slate-400">Original
                <textarea rows={2} className="input mt-1 !py-2" value={r.text} onChange={(e) => patch(r.key, { text: e.target.value })} /></label>
              <label className="block text-xs text-slate-400">{langName(job.targetLanguage)}
                <textarea rows={2} className="input mt-1 !py-2" value={r.translated} onChange={(e) => patch(r.key, { translated: e.target.value })} /></label>
              <button type="button" className="btn-ghost !px-3 sm:mt-5" onClick={() => remove(r.key)} aria-label={`Delete subtitle ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </article>
        ))}
      </div>
      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 bg-ink-950/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <button type="button" className="btn-ghost" onClick={add}><Plus className="h-4 w-4" aria-hidden="true" /> Add subtitle</button>
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />} Save Changes</button>
        <Link to={`/projects/${job.videoId}?job=${job.id}`} className="btn-ghost ml-auto">Back to video</Link>
        <span role="status" className="w-full text-sm text-emerald-300 sm:w-auto">{saved ? 'Changes saved.' : ''}</span>
      </div>
    </section>
  );
}
