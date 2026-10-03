import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Eye, Trash2, Film, Clock, Languages, HardDrive } from 'lucide-react';
import { api, authedUrl } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { langName } from '../utils/languages.js';
import { fmtDate, fmtDuration, fmtSize } from '../utils/format.js';
import { ErrorNote, Spinner, StatusBadge, VideoThumb } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { api('/api/videos').then((d) => setVideos(d.videos)).catch((e) => setError(e.message)); }, []);

  const remove = async (v) => {
    if (!window.confirm(`Delete "${v.title}" and all of its translations? This can't be undone.`)) return;
    setBusyId(v.id);
    try { await api(`/api/videos/${v.id}`, { method: 'DELETE' }); setVideos((vs) => vs.filter((x) => x.id !== v.id)); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  };

  if (!videos && !error) return <Spinner />;
  const list = videos || [];
  const done = list.filter((v) => v.status === 'completed');
  const stats = [
    [Film, 'Videos Translated', done.length],
    [Clock, 'Minutes Processed', Math.round((done.reduce((a, v) => a + v.duration, 0) / 60) * 10) / 10],
    [Languages, 'Languages Used', new Set(list.flatMap((v) => v.targetLanguages)).size],
    [HardDrive, 'Storage Used', fmtSize(list.reduce((a, v) => a + v.size, 0))],
  ];

  return (
    <section className="container-x py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back, {user.name.split(' ')[0]}!</h1>
        <Link to="/translate" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Translate New Video</Link>
      </div>
      {error && <div className="mt-5"><ErrorNote>{error}</ErrorNote></div>}

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([Icon, label, val]) => (
          <div key={label} className="glass p-4">
            <Icon className="h-5 w-5 text-brand-soft" aria-hidden="true" />
            <dd className="mt-2 font-display text-2xl font-semibold text-white">{val}</dd>
            <dt className="text-xs text-slate-400 sm:text-sm">{label}</dt>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-xl font-semibold">Recent projects</h2>
      {list.length === 0 ? (
        <div className="glass mt-4 p-10 text-center">
          <p className="text-slate-300">You haven't translated anything yet.</p>
          <Link to="/translate" className="btn-primary mt-4">Upload your first video</Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => {
            const first = v.jobs.find((j) => j.status === 'completed');
            const langs = [...new Set(v.jobs.map((j) => j.target_language))];
            return (
              <li key={v.id} className="glass overflow-hidden">
                <Link to={`/projects/${v.id}`} className="block aspect-video" aria-label={`Open ${v.title}`}><VideoThumb videoId={v.id} className="h-full w-full" /></Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-base font-semibold" title={v.title}>{v.title}</h3>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {v.originalLanguage ? langName(v.originalLanguage) : 'Language pending'} → {langs.length ? langs.map(langName).join(', ') : '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{fmtDate(v.createdAt)} · {fmtDuration(v.duration)} · {fmtSize(v.size)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/projects/${v.id}`} className="btn-ghost !min-h-[40px] !px-3"><Eye className="h-4 w-4" aria-hidden="true" /> View</Link>
                    {first
                      ? <a href={authedUrl(`/api/download/${first.id}?type=video`)} download className="btn-ghost !min-h-[40px] !px-3"><Download className="h-4 w-4" aria-hidden="true" /> Download</a>
                      : <button className="btn-ghost !min-h-[40px] !px-3" disabled title="Available once a translation completes"><Download className="h-4 w-4" aria-hidden="true" /> Download</button>}
                    <button className="btn-ghost !min-h-[40px] !px-3 text-red-300" onClick={() => remove(v)} disabled={busyId === v.id}><Trash2 className="h-4 w-4" aria-hidden="true" /> Delete</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
