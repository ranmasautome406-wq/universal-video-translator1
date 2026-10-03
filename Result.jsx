import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Download, Pencil, Columns2, Languages, Info } from 'lucide-react';
import { api, authedUrl } from '../services/api.js';
import { langName } from '../utils/languages.js';
import { fmtDuration } from '../utils/format.js';
import { useVideoJobs } from '../hooks/useVideoJobs.js';
import ProcessingPanel from '../components/ProcessingPanel.jsx';
import SubtitlePlayer from '../components/SubtitlePlayer.jsx';
import { DemoTag, ErrorNote, Spinner } from '../components/ui.jsx';

export default function Result() {
  const { videoId } = useParams();
  const [sp, setSp] = useSearchParams();
  const { video, jobs, loading, error } = useVideoJobs(videoId);
  const [segments, setSegments] = useState([]);

  const active = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
  const done = jobs.filter((j) => j.status === 'completed');
  const failed = jobs.filter((j) => j.status === 'failed');
  const job = done.find((j) => String(j.id) === sp.get('job')) || done[0];

  useEffect(() => {
    if (!job) return;
    api(`/api/subtitles/${job.id}`).then((d) => setSegments(d.segments)).catch(() => setSegments([]));
  }, [job?.id]);

  if (loading) return <Spinner />;
  if (error && !video) return <section className="container-x py-12"><ErrorNote>{error}</ErrorNote><Link to="/dashboard" className="btn-ghost mt-4">Back to dashboard</Link></section>;

  const dl = (type) => authedUrl(`/api/download/${job.id}?type=${type}`);
  const btn = 'btn-ghost';

  return (
    <section className="container-x max-w-4xl space-y-6 py-10 sm:py-14">
      {active.length > 0 && <ProcessingPanel jobs={active} />}
      {failed.map((j) => (
        <ErrorNote key={j.id}>{langName(j.targetLanguage)} failed: {j.error || 'Something went wrong while processing your video. Please try again.'} <Link to={`/translate?video=${videoId}`} className="underline">Try again</Link></ErrorNote>
      ))}

      {job && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">Translation Complete 🎉</h1>
            {job.demo && <DemoTag />}
          </div>
          {done.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Translated language">
              {done.map((j) => (
                <button key={j.id} aria-pressed={j.id === job.id} onClick={() => setSp({ job: j.id })}
                  className={`min-h-[40px] rounded-full border px-4 text-sm ${j.id === job.id ? 'border-brand bg-brand/20 text-white' : 'border-white/15 text-slate-300 hover:bg-white/5'}`}>{langName(j.targetLanguage)}</button>
              ))}
            </div>
          )}
          <SubtitlePlayer key={job.id} src={authedUrl(`/api/download/${job.id}?type=video&inline=1`)} segments={segments} />
          {job.demo && (
            <p className="flex items-start gap-2 text-sm text-slate-400"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Demo Mode: this is your original video with sample subtitles. Connect AI providers to get real transcripts and dubbed audio.</p>
          )}
          <dl className="glass grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-400">Original language</dt><dd className="mt-1 font-medium text-white">{langName(job.detectedLanguage || job.sourceLanguage)}</dd></div>
            <div><dt className="text-slate-400">Translated language</dt><dd className="mt-1 font-medium text-white">{langName(job.targetLanguage)}</dd></div>
            <div><dt className="text-slate-400">Duration</dt><dd className="mt-1 font-medium text-white">{fmtDuration(video?.duration)}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <a className="btn-primary" href={dl('video')} download><Download className="h-4 w-4" aria-hidden="true" /> Download Video</a>
            <a className={btn} href={dl('srt')} download aria-label="Download subtitles as SRT">Subtitles · SRT</a>
            <a className={btn} href={dl('vtt')} download aria-label="Download subtitles as VTT">Subtitles · VTT</a>
            {job.hasAudio
              ? <a className={btn} href={dl('audio')} download><Download className="h-4 w-4" aria-hidden="true" /> Download Audio</a>
              : <button className={btn} disabled title="Translated audio needs a voice mode and a text-to-speech provider.">Download Audio</button>}
          </div>
          {!job.hasAudio && <p className="-mt-3 text-xs text-slate-500">Audio is created in the voice modes once a text-to-speech provider is connected.</p>}
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-5">
            <Link to={`/editor/${job.id}`} className={btn}><Pencil className="h-4 w-4" aria-hidden="true" /> Edit subtitles</Link>
            <Link to={`/compare/${job.id}`} className={btn}><Columns2 className="h-4 w-4" aria-hidden="true" /> Compare</Link>
            <Link to={`/translate?video=${videoId}`} className={btn}><Languages className="h-4 w-4" aria-hidden="true" /> Translate Into Another Language</Link>
          </div>
        </>
      )}
      {!job && !active.length && !failed.length && <p className="text-slate-400">No translations yet. <Link to={`/translate?video=${videoId}`} className="text-brand-soft underline">Start one</Link>.</p>}
    </section>
  );
}
