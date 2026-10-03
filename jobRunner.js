import path from 'node:path';
import fs from 'node:fs/promises';
import { db, log } from '../utils/db.js';
import { config } from '../utils/config.js';
import { toSrt } from '../utils/subtitles.js';
import { speechToText } from './speechToText.js';
import { translation } from './translation.js';
import { textToSpeech } from './textToSpeech.js';
import * as vp from './videoProcessor.js';

export const STEPS = ['Uploading Video', 'Extracting Audio', 'Detecting Speech', 'Generating Transcript', 'Translating Text', 'Generating Voice', 'Synchronizing Video', 'Finalizing Video'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const setProgress = (id, step, progress) =>
  db.prepare("UPDATE jobs SET step=?, progress=?, status='processing' WHERE id=?").run(step, progress, id);
const pct = (step) => Math.round((step / STEPS.length) * 100);

async function demoRun(job) {
  const segments = await translation({ target: job.target_language, demo: true });
  for (let s = 0; s < STEPS.length; s++) {
    // Several small ticks per step so the progress bar moves smoothly.
    for (let t = 0; t < 4; t++) {
      setProgress(job.id, s, Math.min(99, pct(s) + Math.round((t / 4) * (100 / STEPS.length))));
      await sleep(config.demoStepMs / 4);
    }
  }
  db.prepare('INSERT OR REPLACE INTO subtitles(job_id,data) VALUES(?,?)').run(job.id, JSON.stringify(segments));
  return { detected: job.source_language === 'auto' ? 'en' : job.source_language, videoPath: null, audioPath: null };
}

async function realRun(job, video) {
  const input = path.resolve('uploads', video.filename);
  const work = path.resolve('outputs', `job-${job.id}`);
  await fs.mkdir(work, { recursive: true });
  try {
    if (!(await vp.checkFfmpeg())) throw Object.assign(new Error('FFmpeg is not installed.'), { code: 'FFMPEG_MISSING' });

    setProgress(job.id, 1, pct(1));
    const wav = path.join(work, 'audio.wav');
    await vp.extractAudio(input, wav);

    setProgress(job.id, 2, pct(2));
    const stt = await speechToText({ audioPath: wav, language: job.source_language });
    setProgress(job.id, 3, pct(3));
    if (!stt.segments.length) throw Object.assign(new Error('No speech detected.'), { code: 'NO_SPEECH' });

    setProgress(job.id, 4, pct(4));
    const translated = stt.language === job.target_language
      ? stt.segments.map((s) => ({ ...s, translated: s.text }))
      : await translation({ segments: stt.segments, source: stt.language, target: job.target_language });
    db.prepare('INSERT OR REPLACE INTO subtitles(job_id,data) VALUES(?,?)').run(job.id, JSON.stringify(translated));

    let audioPath = null;
    const wantsVoice = job.mode !== 'subtitles';
    if (wantsVoice) {
      setProgress(job.id, 5, pct(5));
      const clips = await textToSpeech({ segments: translated, language: job.target_language, voiceStyle: job.voice_style, dir: work });
      audioPath = path.resolve('outputs', `job-${job.id}.mp3`);
      await vp.buildDubTrack(clips, audioPath);
    }

    setProgress(job.id, 6, pct(6));
    const srtPath = path.join(work, 'subs.srt');
    await fs.writeFile(srtPath, toSrt(translated));
    const videoPath = path.resolve('outputs', `job-${job.id}.mp4`);
    await vp.exportVideo({
      video: input, audio: audioPath, out: videoPath,
      srt: job.mode !== 'voice' ? srtPath : null,
    });
    setProgress(job.id, 7, pct(7));
    return { detected: stt.language, videoPath, audioPath };
  } finally {
    await vp.rm(work);
  }
}

function friendlyError(e) {
  switch (e.code) {
    case 'FFMPEG_MISSING': return 'FFmpeg is not installed on the server. See the README for setup steps.';
    case 'FFMPEG_FAILED': return 'The video could not be processed. Try a different file.';
    case 'MISSING_KEY': return 'This feature needs an API key. Add it in backend/.env or enable DEMO_MODE.';
    case 'NO_SPEECH': return 'No speech was found in this video.';
    case 'PROVIDER_FAILED': return 'The AI provider returned an error. Please try again.';
    default: return 'Something went wrong while processing your video. Please try again.';
  }
}

export async function runJob(jobId) {
  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(jobId);
  const video = db.prepare('SELECT * FROM videos WHERE id=?').get(job.video_id);
  db.prepare("UPDATE jobs SET status='processing', started_at=datetime('now') WHERE id=?").run(jobId);
  try {
    const r = job.demo ? await demoRun(job) : await realRun(job, video);
    db.prepare("UPDATE jobs SET status='completed', step=?, progress=100, detected_language=?, video_path=?, audio_path=?, finished_at=datetime('now') WHERE id=?")
      .run(STEPS.length - 1, r.detected, r.videoPath, r.audioPath, jobId);
    db.prepare('INSERT INTO usage(user_id,job_id,minutes) VALUES(?,?,?)').run(job.user_id, jobId, (video.duration || 0) / 60);
    db.prepare("UPDATE videos SET status='completed', original_language=? WHERE id=?").run(r.detected, video.id);
    log('info', `Job ${jobId} completed${job.demo ? ' (demo)' : ''}`);
  } catch (e) {
    log('error', `Job ${jobId} failed: ${e.code || ''} ${e.message} ${e.detail ?? ''}`);
    db.prepare("UPDATE jobs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?").run(friendlyError(e), jobId);
    db.prepare("UPDATE videos SET status='failed' WHERE id=?").run(video.id);
  }
}

/** On startup, jobs left mid-flight by a restart are marked failed. */
export function recoverStuckJobs() {
  db.prepare("UPDATE jobs SET status='failed', error='The server restarted during processing. Please start again.' WHERE status IN ('queued','processing')").run();
}
