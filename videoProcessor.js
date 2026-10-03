import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { config } from '../utils/config.js';

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err = (err + d).slice(-2000)));
    p.on('error', () => reject(Object.assign(new Error('FFmpeg is not installed or not on PATH.'), { code: 'FFMPEG_MISSING' })));
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(Object.assign(new Error('FFmpeg failed.'), { code: 'FFMPEG_FAILED', detail: err }))));
  });
}

let cached;
export async function checkFfmpeg() {
  if (cached !== undefined) return cached;
  try { await run(config.ffmpegPath, ['-version']); await run(config.ffprobePath, ['-version']); cached = true; }
  catch { cached = false; }
  return cached;
}

export async function getMetadata(file) {
  const out = await run(config.ffprobePath, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
  const j = JSON.parse(out);
  const hasAudio = (j.streams || []).some((s) => s.codec_type === 'audio');
  return { duration: Number(j.format?.duration) || 0, hasAudio };
}

export const extractAudio = (video, outWav) =>
  run(config.ffmpegPath, ['-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-f', 'wav', outWav]);

export const makeThumbnail = (video, outJpg) =>
  run(config.ffmpegPath, ['-y', '-ss', '1', '-i', video, '-frames:v', '1', '-vf', 'scale=480:-2', outJpg]);

/** Place each TTS clip at its subtitle start time and mix into one track. */
export async function buildDubTrack(clips, outMp3) {
  if (!clips.length) throw new Error('No audio clips to combine.');
  const inputs = clips.flatMap((c) => ['-i', c.file]);
  const delays = clips.map((c, i) => `[${i}:a]adelay=${Math.round(c.start * 1000)}|${Math.round(c.start * 1000)}[a${i}]`);
  const mix = clips.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${clips.length}:normalize=0[out]`;
  await run(config.ffmpegPath, ['-y', ...inputs, '-filter_complex', [...delays, mix].join(';'), '-map', '[out]', outMp3]);
}

/** Mux final video: optional replacement audio + optional soft subtitles (mp4 / mov_text). */
export async function exportVideo({ video, audio, srt, out }) {
  const args = ['-y', '-i', video];
  if (audio) args.push('-i', audio);
  if (srt) args.push('-i', srt);
  args.push('-map', '0:v:0');
  if (audio) args.push('-map', '1:a:0'); else args.push('-map', '0:a:0?');
  if (srt) args.push('-map', `${audio ? 2 : 1}:0`, '-c:s', 'mov_text');
  args.push('-c:v', 'copy', '-c:a', 'aac', '-shortest', out);
  await run(config.ffmpegPath, args);
}

export const rm = (...files) => Promise.all(files.filter(Boolean).map((f) => fs.rm(f, { force: true, recursive: true })));
export const outDir = () => path.resolve('outputs');
