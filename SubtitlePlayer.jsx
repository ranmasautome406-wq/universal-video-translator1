import { useEffect, useRef, useState } from 'react';
import { Captions, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { fmtClock } from '../utils/format.js';

const iconBtn = 'grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/15';

export default function SubtitlePlayer({ src, segments = [] }) {
  const box = useRef(null);
  const vid = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [subs, setSubs] = useState(true);
  const [full, setFull] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const toggle = () => { const v = vid.current; v.paused ? v.play().catch(() => setErr('This video cannot be played in your browser.')) : v.pause(); };
  const current = segments.find((s) => t >= s.start && t < s.end);

  return (
    <div ref={box} className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="relative aspect-video bg-black">
        <video
          ref={vid} src={src} playsInline preload="metadata" crossOrigin="anonymous" className="h-full w-full" onClick={toggle}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          onError={() => setErr('This video cannot be played in your browser. You can still download it.')}
        />
        {subs && current && (
          <p className="pointer-events-none absolute inset-x-3 bottom-4 text-center" aria-live="off">
            <span className="inline-block max-w-full rounded-md bg-black/75 px-3 py-1.5 text-sm text-white sm:text-lg">{current.translated || current.text}</span>
          </p>
        )}
        {err && <p role="alert" className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-sm text-red-200">{err}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0 bg-ink-900 px-2 py-1" role="group" aria-label="Video controls">
        <button className={iconBtn} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
        <span className="w-24 text-xs tabular-nums text-slate-300">{fmtClock(t)} / {fmtClock(dur)}</span>
        <input type="range" min={0} max={dur || 0} step="0.1" value={t} aria-label="Seek" className="min-w-[8rem] flex-1 accent-brand"
          onChange={(e) => { vid.current.currentTime = Number(e.target.value); }} />
        <button className={iconBtn} aria-label={muted || vol === 0 ? 'Unmute' : 'Mute'} onClick={() => { vid.current.muted = !muted; setMuted(!muted); }}>
          {muted || vol === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <input type="range" min={0} max={1} step="0.05" value={muted ? 0 : vol} aria-label="Volume" className="w-20 accent-brand"
          onChange={(e) => { const n = Number(e.target.value); vid.current.volume = n; vid.current.muted = n === 0; setVol(n); setMuted(n === 0); }} />
        <button className={`${iconBtn} ${subs ? 'bg-brand/30' : ''}`} aria-label="Toggle subtitles" aria-pressed={subs} onClick={() => setSubs(!subs)}><Captions className="h-5 w-5" /></button>
        <button className={iconBtn} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => (full ? document.exitFullscreen() : box.current.requestFullscreen?.())}>
          {full ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
