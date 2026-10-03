import { useEffect, useState } from 'react';
import { Play, FileVideo } from 'lucide-react';

const LINES = [
  { lang: 'English', text: 'Welcome to our channel.' },
  { lang: 'Hindi', text: 'हमारे चैनल में आपका स्वागत है।' },
  { lang: 'Spanish', text: 'Bienvenidos a nuestro canal.' },
  { lang: 'Japanese', text: '私たちのチャンネルへようこそ。' },
  { lang: 'French', text: 'Bienvenue sur notre chaîne.' },
];

// The one animated moment on the page: the same sentence cycling through languages.
export default function HeroPreview() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 2600);
    return () => clearInterval(t);
  }, []);
  const line = LINES[i];
  return (
    <figure className="glass relative overflow-hidden p-3 sm:p-4" aria-label="Preview of a video with translated subtitles">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900">
        <div className="absolute inset-0 flex items-end justify-center gap-1 px-6 pb-16 opacity-40" aria-hidden="true">
          {Array.from({ length: 32 }).map((_, k) => (
            <span key={k} className="w-1 origin-bottom animate-bar rounded-full bg-brand-soft" style={{ height: `${20 + ((k * 37) % 60)}%`, animationDelay: `${(k % 8) * 120}ms` }} />
          ))}
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur"><Play className="h-6 w-6 translate-x-0.5 fill-white text-white" aria-hidden="true" /></span>
        </div>
        <div className="absolute inset-x-3 bottom-3 text-center sm:inset-x-8">
          <p key={i} className="mx-auto inline-block max-w-full animate-fade rounded-lg bg-black/70 px-3 py-1.5 text-sm text-white sm:text-lg" aria-live="off">
            {line.text}
          </p>
          <p className="mt-1.5 text-xs text-slate-400">{line.lang}</p>
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400 sm:text-sm">
        <span className="inline-flex items-center gap-2"><FileVideo className="h-4 w-4" aria-hidden="true" /> channel-intro.mp4 · 02:34</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">Auto Detect → 5 languages</span>
      </figcaption>
    </figure>
  );
}
