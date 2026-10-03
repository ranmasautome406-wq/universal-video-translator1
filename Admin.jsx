import { useCallback, useEffect, useState } from 'react';
import { Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { langName } from '../utils/languages.js';
import { fmtDate, fmtSize } from '../utils/format.js';
import { ErrorNote, Spinner, StatusBadge } from '../components/ui.jsx';

const TABS = ['Users', 'Jobs', 'Logs', 'Settings'];
const th = 'whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-slate-400';
const td = 'px-3 py-2.5 text-sm';

function Table({ head, children, empty }) {
  return (
    <div className="glass overflow-x-auto">
      <table className="w-full min-w-[34rem]">
        <thead className="border-b border-white/10"><tr>{head.map((h) => <th key={h} scope="col" className={th}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-center text-sm text-slate-400">Nothing here yet.</p>}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('Users');
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({});
  const [limits, setLimits] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const loadStats = useCallback(() => api('/api/admin/stats').then(setStats).catch((e) => setError(e.message)), []);
  useEffect(() => { loadStats(); api('/api/admin/settings').then((d) => setLimits(d.limits)).catch((e) => setError(e.message)); }, [loadStats]);
  useEffect(() => {
    const path = { Users: 'users', Jobs: 'jobs', Logs: 'logs' }[tab];
    if (path) api(`/api/admin/${path}`).then((d) => setData((x) => ({ ...x, [tab]: d[path] }))).catch((e) => setError(e.message));
  }, [tab]);

  const setPlan = async (u, plan) => {
    try { await api(`/api/admin/users/${u.id}`, { method: 'PUT', body: { plan } }); setData((d) => ({ ...d, Users: d.Users.map((x) => (x.id === u.id ? { ...x, plan } : x)) })); }
    catch (e) { setError(e.message); }
  };
  const delJob = async (j) => {
    if (!window.confirm(`Delete job #${j.id}?`)) return;
    try { await api(`/api/admin/jobs/${j.id}`, { method: 'DELETE' }); setData((d) => ({ ...d, Jobs: d.Jobs.filter((x) => x.id !== j.id) })); loadStats(); }
    catch (e) { setError(e.message); }
  };
  const saveLimits = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    try { await api('/api/admin/settings', { method: 'PUT', body: { limits } }); setMsg('Limits saved.'); }
    catch (err) { setError(err.message); }
  };

  if (!stats && !error) return <Spinner />;
  const cards = stats ? [['Total Users', stats.totalUsers], ['Total Videos', stats.totalVideos], ['Processing Time', `${stats.processingMinutes} min`], ['Storage Used', fmtSize(stats.storageBytes)], ['Translation Jobs', stats.translationJobs], ['Failed Jobs', stats.failedJobs]] : [];
  const Flag = ({ ok, label }) => <li className="flex items-center gap-2">{ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : <XCircle className="h-4 w-4 text-slate-500" aria-hidden="true" />}{label}<span className="sr-only">{ok ? ': yes' : ': no'}</span></li>;

  return (
    <section className="container-x py-10 sm:py-14">
      <h1 className="text-2xl font-semibold sm:text-3xl">Admin</h1>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {stats && (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {cards.map(([l, v]) => <div key={l} className="glass p-4"><dd className="font-display text-xl font-semibold text-white">{v}</dd><dt className="mt-1 text-xs text-slate-400">{l}</dt></div>)}
          </dl>
          <div className="glass mt-4 p-4 text-sm">
            <h2 className="mb-2 font-semibold">System status</h2>
            <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Flag ok={stats.system.demoMode} label="Demo mode" />
              <Flag ok={stats.system.ffmpeg} label="FFmpeg installed" />
              <Flag ok={stats.system.keysConfigured.openai} label="OpenAI key" />
              <Flag ok={stats.system.keysConfigured.deepl} label="DeepL key" />
              <Flag ok={stats.system.keysConfigured.elevenlabs} label="ElevenLabs key" />
            </ul>
          </div>
        </>
      )}

      <div role="tablist" aria-label="Admin sections" className="mt-8 flex gap-1 overflow-x-auto border-b border-white/10">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`min-h-[44px] whitespace-nowrap border-b-2 px-4 text-sm ${tab === t ? 'border-brand text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      <div role="tabpanel" className="mt-4">
        {tab === 'Users' && data.Users && (
          <Table head={['ID', 'Name', 'Email', 'Role', 'Plan', 'Joined']} empty={!data.Users.length}>
            {data.Users.map((u) => (
              <tr key={u.id}><td className={td}>{u.id}</td><td className={td}>{u.name}</td><td className={td}>{u.email}</td><td className={td}>{u.role}</td>
                <td className={td}><select aria-label={`Plan for ${u.email}`} className="input !w-auto !py-1.5" value={u.plan} onChange={(e) => setPlan(u, e.target.value)}><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></td>
                <td className={td}>{fmtDate(u.created_at)}</td></tr>
            ))}
          </Table>
        )}
        {tab === 'Jobs' && data.Jobs && (
          <Table head={['ID', 'Video', 'User', 'Language', 'Status', 'Created', '']} empty={!data.Jobs.length}>
            {data.Jobs.map((j) => (
              <tr key={j.id}><td className={td}>{j.id}</td><td className={`${td} max-w-[12rem] truncate`}>{j.title}</td><td className={td}>{j.email}</td><td className={td}>{langName(j.target_language)}</td>
                <td className={td}><StatusBadge status={j.status} />{j.demo ? <span className="ml-1 text-xs text-slate-500">demo</span> : null}</td><td className={td}>{fmtDate(j.created_at)}</td>
                <td className={td}><button className="btn-ghost !min-h-[36px] !px-2.5 text-red-300" onClick={() => delJob(j)} aria-label={`Delete job ${j.id}`}><Trash2 className="h-4 w-4" /></button></td></tr>
            ))}
          </Table>
        )}
        {tab === 'Logs' && data.Logs && (
          <Table head={['Time', 'Level', 'Message']} empty={!data.Logs.length}>
            {data.Logs.map((l) => <tr key={l.id}><td className={`${td} whitespace-nowrap text-slate-400`}>{l.created_at}</td><td className={td}><span className={l.level === 'error' ? 'text-red-300' : 'text-slate-300'}>{l.level}</span></td><td className={td}>{l.message}</td></tr>)}
          </Table>
        )}
        {tab === 'Settings' && limits && (
          <form onSubmit={saveLimits} className="glass max-w-md space-y-4 p-5">
            <h2 className="font-semibold">Monthly video limits</h2>
            {['free', 'pro', 'business'].map((p) => (
              <div key={p}><label className="label capitalize" htmlFor={`lim-${p}`}>{p} plan</label>
                <input id={`lim-${p}`} type="number" min={0} className="input" value={limits[p]} onChange={(e) => setLimits({ ...limits, [p]: e.target.value })} /></div>
            ))}
            <button className="btn-primary">Save limits</button>
            <p role="status" className="text-sm text-emerald-300">{msg}</p>
          </form>
        )}
        {!['Settings'].includes(tab) && !data[tab] && <Spinner />}
      </div>
    </section>
  );
}
