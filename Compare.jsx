import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import { api, authedUrl } from '../services/api.js';
import { langName } from '../utils/languages.js';
import { DemoTag, ErrorNote, Spinner } from '../components/ui.jsx';

export default function Compare() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [segments, setSegments] = useState([]);
  const [error, setError] = useState('');
  const [pos, setPos] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [audio, setAudio] = useState('translated');
  const orig = useRef(null);
  const trans = useRef(null);

  useEffect(() => {
    Promise.all([api(`/api/translate/${jobId}/status`), api(`/api/subtitles/${jobId}`)])
      .then(([s, d]) => { setJob({ ...s.job, demo: d.demo }); setSegments(d.segments); })
      .catch((e) => setError(e.message));
  }, [jobId]);

  useEffect(() => {
    if (orig.current) orig.current.muted = audio !== 'original';
    if (trans.current) trans.current.muted = audio !== 'translated';
  }, [audio, job]);

  if (error) return <section className="container-x py-12"><ErrorNote>{error}</ErrorNote></section>;
  if (!job) return <Spinner />;

  const toggle = () => {
    const [a, b] = [orig.current, trans.current];
    if (playing) { a.pause(); b.pause(); setPlaying(false); }
    else { b.currentTime = a.currentTime; Promise.all([a.play(), b.play()]).then(() => setPlaying(true)).catch(() => setError('This video cannot be played in your browser.')); }
  };
  const seek = (v) => { orig.current.currentTime = v; trans.current.currentTime = v; setT(v); };
  const cur = segments.find((s) => t >= s.start && t < s.end);
  const originalSrc = authedUrl(`/api/videos/${job.videoId}/source`);
  const translatedSrc = authedUrl(`/api/download/${job.id}?type=video&inline=1`);

  return (
    <section className="container-x max-w-4xl py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">Before and after</h1>
        {job.demo && <DemoTag />}
      </div>
      <p className="mt-2 text-sm text-slate-400">Drag the slider to reveal the original on the left and {langName(job.targetLanguage)} on the right.</p>

      <div className="relative mt-5 aspect-video select-none overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video ref={orig} src={originalSrc} crossOrigin="anonymous" playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain"
          onTimeUpdate={(e) => { setT(e.currentTarget.currentTime); const b = trans.current; if (b && Math.abs(b.currentTime - e.currentTarget.currentTime) > 0.3) b.currentTime = e.currentTarget.currentTime; }}
          onEnded={() => setPlaying(false)} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <video ref={trans} src={translatedSrc} crossOrigin="anonymous" playsInline preload="metadata" className="h-full w-full object-contain" />
          {cur && <p className="absolute inset-x-3 bottom-4 text-center"><span className="inline-block rounded-md bg-black/75 px-3 py-1 text-sm text-white sm:text-base">{cur.translated || cur.text}</span></p>}
        </div>
        <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">Original</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">{langName(job.targetLanguage)}</span>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold text-ink-950 shadow-lg" aria-hidden="true">⇄</span>
        </div>
        <input type="range" min={0} max={100} step="0.5" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Comparison slider"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={toggle}>{playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? 'Pause' : 'Play both'}</button>
        <input type="range" min={0} max={orig.current?.duration || 0} step="0.1" value={t} onChange={(e) => seek(Number(e.target.value))} aria-label="Seek" className="min-w-[8rem] flex-1 accent-brand" />
        <label className="flex items-center gap-2 text-sm text-slate-300">Audio
          <select className="input !w-auto !py-2" value={audio} onChange={(e) => setAudio(e.target.value)}>
            <option value="translated">Translated</option><option value="original">Original</option><option value="off">Muted</option>
          </select></label>
      </div>
      {job.demo && <p className="mt-3 text-sm text-slate-500">Demo Mode: both sides show the same footage; the right side adds sample subtitles.</p>}
      <Link to={`/projects/${job.videoId}?job=${job.id}`} className="btn-ghost mt-6">Back to video</Link>
    </section>
  );
}
