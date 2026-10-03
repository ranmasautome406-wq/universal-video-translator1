import { Check, Loader2, Circle } from 'lucide-react';
import { langName } from '../utils/languages.js';
import { fmtClock } from '../utils/format.js';
import { DemoTag } from './ui.jsx';

const Bar = ({ value, label }) => (
  <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label} className="h-2.5 overflow-hidden rounded-full bg-white/10">
    <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-violet transition-all duration-700" style={{ width: `${value}%` }} />
  </div>
);

function StepList({ job }) {
  const active = Math.max(job.step, 1);
  return (
    <ol className="mt-6 space-y-2.5">
      {job.steps.map((s, i) => {
        const done = i === 0 || i < active;
        const current = i === active;
        return (
          <li key={s} className={`flex items-center gap-3 text-sm ${done ? 'text-white' : current ? 'text-brand-soft' : 'text-slate-500'}`}>
            {done ? <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : current ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Circle className="h-4 w-4" aria-hidden="true" />}
            {s}{done && i === 0 ? ' ✓' : ''}
            <span className="sr-only">{done ? ' (done)' : current ? ' (in progress)' : ' (waiting)'}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function ProcessingPanel({ jobs }) {
  if (!jobs.length) return null;
  const overall = Math.round(jobs.reduce((a, j) => a + j.progress, 0) / jobs.length);
  const eta = Math.max(...jobs.map((j) => j.etaSeconds || 0));
  const single = jobs.length === 1;
  return (
    <section className="glass p-5 sm:p-8" aria-live="polite" aria-label="Translation progress">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold sm:text-2xl">Translating your video…</h2>
        {jobs.some((j) => j.demo) && <DemoTag />}
      </div>
      <p className="mt-4 font-display text-5xl font-semibold text-white">{overall}%</p>
      <div className="mt-3"><Bar value={overall} label="Overall progress" /></div>
      <p className="mt-3 text-sm text-slate-400">Estimated time remaining: {eta > 0 ? fmtClock(eta) : 'calculating…'}</p>
      {single ? <StepList job={jobs[0]} /> : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-sm"><span className="font-medium text-white">{langName(j.targetLanguage)}</span><span className="text-slate-400">{j.progress}%</span></div>
              <div className="mt-2"><Bar value={j.progress} label={`${langName(j.targetLanguage)} progress`} /></div>
              <p className="mt-2 text-xs text-slate-400">{j.steps[Math.max(j.step, 1)]}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
