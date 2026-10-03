import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Languages, AudioLines, Captions, Layers, ShieldCheck, Check, Upload } from 'lucide-react';
import HeroPreview from '../components/HeroPreview.jsx';
import { LANGUAGES, POPULAR } from '../utils/languages.js';

const STEPS = [
  ['Upload your video', 'MP4, MOV, AVI, MKV or WEBM. Drag it in or browse.'],
  ['Pick languages', 'Let us detect the spoken language, then choose one or more targets.'],
  ['We transcribe and translate', 'Speech becomes text, then text becomes your target language.'],
  ['Review and download', 'Edit subtitles, preview the result, and export video, SRT, VTT or audio.'],
];

const FEATURES = [
  [Mic, 'AI Speech Recognition', 'Automatically convert spoken words into accurate text.'],
  [Languages, 'Smart Translation', 'Translate speech into multiple languages.'],
  [AudioLines, 'AI Voice Dubbing', 'Generate natural translated speech.'],
  [Captions, 'Automatic Subtitles', 'Generate synchronized subtitles.'],
  [Layers, 'Multi-Language Support', 'Translate one video into many languages.'],
  [ShieldCheck, 'Privacy', "Uploaded videos are processed securely and deleted according to your configured retention policy."],
];

const REACH = ['hi', 'mr', 'es', 'ja', 'fr', 'de', 'ta', 'ar'];

export default function Landing() {
  const [picked, setPicked] = useState(['hi', 'mr', 'es', 'ja', 'fr']);
  const toggle = (c) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const sorted = [...LANGUAGES].sort((a, b) => (POPULAR.includes(b.code) - POPULAR.includes(a.code)) || a.name.localeCompare(b.name));

  return (
    <>
      <section className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-rise">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Translate Any Video.<br />Speak Every Language.
          </h1>
          <p className="mt-5 max-w-lg text-base text-slate-400 sm:text-lg">
            AI-powered video translation with subtitles, voice dubbing, and automatic speech recognition.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/translate" className="btn-primary"><Upload className="h-4 w-4" aria-hidden="true" /> Translate Video</Link>
            <Link to="/#how-it-works" className="btn-ghost">Watch Demo</Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">No card needed. Demo mode works without any AI keys.</p>
        </div>
        <div className="animate-rise [animation-delay:120ms]"><HeroPreview /></div>
      </section>

      <section id="how-it-works" className="container-x py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
        <p className="mt-2 max-w-xl text-slate-400">Four steps from raw upload to a video anyone can follow.</p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="glass p-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">{i + 1}</span>
              <h3 className="mt-4 text-base font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="container-x py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">Everything in one pipeline</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, t, d]) => (
            <article key={t} className="glass p-5">
              <Icon className="h-6 w-6 text-brand-soft" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="glass grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Translate Once. Reach Everyone.</h2>
            <p className="mt-3 text-slate-400">Pick several target languages and each one is processed as its own job, so you can review and download them separately.</p>
            <p className="mt-5 text-sm text-slate-400">Original: <span className="text-white">English</span></p>
            <Link to="/translate" className="btn-primary mt-5">Translate into {picked.length} {picked.length === 1 ? 'language' : 'languages'}</Link>
          </div>
          <div role="group" aria-label="Choose target languages" className="flex flex-wrap gap-2">
            {REACH.map((c) => {
              const l = LANGUAGES.find((x) => x.code === c);
              const on = picked.includes(c);
              return (
                <button key={c} type="button" aria-pressed={on} onClick={() => toggle(c)}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm transition ${on ? 'border-brand bg-brand/20 text-white' : 'border-white/15 text-slate-300 hover:bg-white/5'}`}>
                  {on && <Check className="h-4 w-4" aria-hidden="true" />}{l.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="languages" className="container-x py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">{LANGUAGES.length} languages, with more on the way</h2>
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {sorted.map((l) => (
            <li key={l.code} className={`rounded-xl border px-3 py-2.5 text-sm ${POPULAR.includes(l.code) ? 'border-brand/40 bg-brand/10 text-white' : 'border-white/10 text-slate-300'}`}>{l.name}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-500">Highlighted languages are the most popular.</p>
      </section>

      <section id="about" className="container-x py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">About</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Universal Video Translator connects speech recognition, translation and voice synthesis behind one simple upload. Each AI provider is swappable, so you can start in demo mode and plug in the services you prefer when you are ready.
        </p>
        <Link to="/register" className="btn-primary mt-6">Create a free account</Link>
      </section>
    </>
  );
}
