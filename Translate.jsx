import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UploadCloud, FileVideo, Loader2, Check, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { LANGUAGES, POPULAR } from '../utils/languages.js';
import { fmtDuration, fmtSize } from '../utils/format.js';
import { useVideoMeta } from '../hooks/useVideoMeta.js';
import { ErrorNote, LanguageSelect, Spinner, VideoThumb } from '../components/ui.jsx';

const EXT = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
const MODES = [['subtitles', 'Subtitles Only', 'Translated captions as SRT, VTT and on the video.'], ['voice', 'Voice Translation', 'Dubbed audio track (Pro plan).'], ['both', 'Subtitles + Voice', 'Captions and dubbed audio (Pro plan).']];
const VOICES = [['natural', 'Natural'], ['professional', 'Professional'], ['energetic', 'Energetic'], ['calm', 'Calm']];
const ordered = [...LANGUAGES].sort((a, b) => (POPULAR.includes(b.code) - POPULAR.includes(a.code)) || a.name.localeCompare(b.name));

export default function Translate() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const existingId = sp.get('video');
  const inputRef = useRef(null);

  const [maxMb, setMaxMb] = useState(500);
  const [file, setFile] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(!!existingId);
  const [drag, setDrag] = useState(false);
  const [source, setSource] = useState('auto');
  const [targets, setTargets] = useState(['hi']);
  const [mode, setMode] = useState('subtitles');
  const [voice, setVoice] = useState('natural');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [pct, setPct] = useState(0);
  const meta = useVideoMeta(file);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '';
    fetch(`${base}/api/health`).then((r) => r.json()).then((d) => d.maxFileMb && setMaxMb(d.maxFileMb)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!existingId) return;
    api(`/api/videos/${existingId}`).then((d) => setExisting(d.video)).catch((e) => setError(e.message)).finally(() => setLoadingExisting(false));
  }, [existingId]);

  const pick = (f) => {
    setError('');
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!EXT.includes(ext)) return setError('Unsupported format. Use MP4, MOV, AVI, MKV or WEBM.');
    if (f.size > maxMb * 1024 * 1024) return setError(`File is too large. The maximum size is ${maxMb} MB.`);
    if (f.size === 0) return setError('This file is empty.');
    setFile(f);
  };
  const toggle = (c) => setTargets((t) => (t.includes(c) ? t.filter((x) => x !== c) : [...t, c]));

  const submit = async () => {
    setError('');
    if (!file && !existing) return setError('Choose a video to translate.');
    if (!targets.length) return setError('Choose at least one target language.');
    try {
      let videoId = existing?.id;
      if (!videoId) {
        setBusy('Uploading video…'); setPct(0);
        const form = new FormData();
        form.append('duration', String(Math.round(meta.duration || 0)));
        form.append('video', file);
        const up = await api('/api/videos/upload', { method: 'POST', form, onProgress: setPct });
        videoId = up.video.id;
      }
      setBusy('Starting translation…');
      await api('/api/translate', { method: 'POST', body: { videoId, sourceLanguage: source, targetLanguages: targets, mode, voiceStyle: voice } });
      navigate(`/projects/${videoId}`);
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  };

  if (loadingExisting) return <Spinner />;
  const hasVideo = file || existing;

  return (
    <section className="container-x max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-semibold">Translate a video</h1>
      <p className="mt-2 text-slate-400">Upload a video, choose languages, and we'll do the rest.</p>
      <div className="mt-6 space-y-6">
        {error && <ErrorNote>{error}{/Pro and Business/.test(error) && <> <Link to="/pricing" className="underline">See plans</Link></>}</ErrorNote>}

        {!hasVideo ? (
          <div
            role="button" tabIndex={0} aria-label="Upload a video. Drop a file here or press Enter to browse."
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            className={`glass grid cursor-pointer place-items-center border-2 border-dashed px-6 py-14 text-center transition ${drag ? 'border-brand bg-brand/10' : 'border-white/15 hover:border-brand/60'}`}
          >
            <UploadCloud className={`h-12 w-12 text-brand-soft ${drag ? 'scale-110' : ''} transition`} aria-hidden="true" />
            <p className="mt-4 text-xl font-semibold text-white">Drop your video here</p>
            <p className="mt-1 text-slate-400">or click to browse</p>
            <p className="mt-4 text-xs text-slate-500">MP4, MOV, AVI, MKV, WEBM · up to {maxMb} MB</p>
            <input ref={inputRef} type="file" hidden accept=".mp4,.mov,.avi,.mkv,.webm,video/*" onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
          </div>
        ) : (
          <div className="glass flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="grid aspect-video w-full shrink-0 place-items-center overflow-hidden rounded-xl bg-ink-800 sm:w-52">
              {existing ? <VideoThumb videoId={existing.id} className="h-full w-full" />
                : meta.thumb ? <img src={meta.thumb} alt="Video thumbnail" className="h-full w-full object-cover" />
                : <FileVideo className="h-8 w-8 text-slate-500" aria-label="No preview available" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{existing ? existing.title : file.name}</p>
              <p className="mt-1 text-sm text-slate-400">{fmtSize(existing ? existing.size : file.size)} · {fmtDuration(existing ? existing.duration : meta.duration)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!existing && <>
                  <button type="button" className="btn-ghost !min-h-[40px]" onClick={() => inputRef.current?.click()} disabled={!!busy}><RefreshCw className="h-4 w-4" aria-hidden="true" /> Replace</button>
                  <button type="button" className="btn-ghost !min-h-[40px]" onClick={() => setFile(null)} disabled={!!busy}><Trash2 className="h-4 w-4" aria-hidden="true" /> Remove</button>
                  <input ref={inputRef} type="file" hidden accept=".mp4,.mov,.avi,.mkv,.webm,video/*" onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
                </>}
                {existing && <Link to="/translate" className="btn-ghost !min-h-[40px]">Upload a different video</Link>}
              </div>
            </div>
          </div>
        )}

        <div className="glass space-y-6 p-5 sm:p-6">
          <div>
            <label htmlFor="src" className="label">Source language</label>
            <LanguageSelect id="src" value={source} onChange={setSource} includeAuto />
          </div>
          <fieldset>
            <legend className="label">Target languages <span className="font-normal text-slate-500">(choose one or more)</span></legend>
            <div className="flex flex-wrap gap-2">
              {ordered.map((l) => {
                const on = targets.includes(l.code);
                return (
                  <button key={l.code} type="button" aria-pressed={on} onClick={() => toggle(l.code)}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm transition ${on ? 'border-brand bg-brand/20 text-white' : 'border-white/15 text-slate-300 hover:bg-white/5'}`}>
                    {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}{l.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Translation mode</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map(([v, name, desc]) => (
                <label key={v} className={`cursor-pointer rounded-xl border p-3 text-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-brand-soft ${mode === v ? 'border-brand bg-brand/10' : 'border-white/10 hover:bg-white/5'}`}>
                  <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} className="sr-only" />
                  <span className="block font-medium text-white">{name}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{desc}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={mode === 'subtitles'} className={mode === 'subtitles' ? 'opacity-50' : ''}>
            <legend className="label">Voice style {mode === 'subtitles' && <span className="font-normal text-slate-500">(used with voice modes)</span>}</legend>
            <div className="flex flex-wrap gap-2">
              {VOICES.map(([v, name]) => (
                <label key={v} className={`cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-brand-soft ${voice === v ? 'border-brand bg-brand/20 text-white' : 'border-white/15 text-slate-300'}`}>
                  <input type="radio" name="voice" value={v} checked={voice === v} onChange={() => setVoice(v)} className="sr-only" />{name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {busy && (
          <div role="status" className="text-sm text-slate-300">
            <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}{busy.startsWith('Uploading') && ` ${pct}%`}</p>
            {busy.startsWith('Uploading') && <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div>}
          </div>
        )}
        <button type="button" className="btn-primary w-full !py-4 text-base" onClick={submit} disabled={!!busy || !hasVideo}>🚀 Translate Video</button>
      </div>
    </section>
  );
}
