import { AlertCircle, Loader2 } from 'lucide-react';
import { LANGUAGES, POPULAR } from '../utils/languages.js';
import { authedUrl } from '../services/api.js';

export const ErrorNote = ({ children }) => (
  <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

export const Spinner = ({ label = 'Loading' }) => (
  <div role="status" aria-label={label} className="grid min-h-[40vh] place-items-center">
    <Loader2 className="h-7 w-7 animate-spin text-brand-soft" />
  </div>
);

const TONES = {
  completed: 'bg-emerald-500/15 text-emerald-300',
  processing: 'bg-brand/20 text-brand-soft',
  queued: 'bg-brand/20 text-brand-soft',
  uploaded: 'bg-slate-500/20 text-slate-300',
  failed: 'bg-red-500/15 text-red-300',
};
export const StatusBadge = ({ status }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${TONES[status] || TONES.uploaded}`}>{status}</span>
);

export function LanguageSelect({ id, value, onChange, includeAuto = false }) {
  const popular = LANGUAGES.filter((l) => POPULAR.includes(l.code));
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAuto && <option value="auto">Auto Detect</option>}
      <optgroup label="Popular">{popular.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</optgroup>
      <optgroup label="All languages (A–Z)">{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</optgroup>
    </select>
  );
}

export const VideoThumb = ({ videoId, className = '' }) => (
  <video className={`bg-ink-800 object-cover ${className}`} src={`${authedUrl(`/api/videos/${videoId}/source`)}#t=1`} preload="metadata" muted playsInline aria-hidden="true" tabIndex={-1} />
);

export const DemoTag = () => (
  <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-xs text-brand-soft">Demo data</span>
);
