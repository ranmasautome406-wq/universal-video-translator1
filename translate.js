import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db, getSetting } from '../utils/db.js';
import { config } from '../utils/config.js';
import { isLang } from '../utils/languages.js';
import { requireAuth } from '../middleware/auth.js';
import { runJob, STEPS } from '../services/jobRunner.js';

const router = Router();
router.use(requireAuth);
const MODES = ['subtitles', 'voice', 'both'];
const VOICES = ['natural', 'professional', 'energetic', 'calm'];
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please wait a minute.' } });

const shapeJob = (j) => {
  const started = j.started_at ? new Date(j.started_at.replace(' ', 'T') + 'Z').getTime() : null;
  let eta = null;
  if (j.status === 'processing' && started && j.progress > 3) {
    const elapsed = (Date.now() - started) / 1000;
    eta = Math.max(0, Math.round((elapsed / j.progress) * (100 - j.progress)));
  }
  return {
    id: j.id, videoId: j.video_id, status: j.status, step: j.step, steps: STEPS, progress: j.progress,
    etaSeconds: eta, sourceLanguage: j.source_language, detectedLanguage: j.detected_language,
    targetLanguage: j.target_language, mode: j.mode, voiceStyle: j.voice_style,
    demo: !!j.demo, error: j.error, hasVideo: !!j.video_path, hasAudio: !!j.audio_path,
  };
};

router.get('/modes', (_req, res) => res.json({ demoMode: config.demoMode, message: config.demoMode ? 'Demo Mode — AI providers are not connected.' : null }));

router.post('/', limiter, (req, res) => {
  const { videoId, sourceLanguage = 'auto', targetLanguages, mode = 'subtitles', voiceStyle = 'natural' } = req.body || {};
  const video = db.prepare('SELECT * FROM videos WHERE id=? AND user_id=?').get(Number(videoId), req.user.id);
  if (!video) return res.status(404).json({ error: 'Video not found.' });
  const targets = [...new Set(Array.isArray(targetLanguages) ? targetLanguages : [])];
  if (!targets.length || targets.length > 10 || !targets.every(isLang)) return res.status(400).json({ error: 'Choose 1–10 valid target languages.' });
  if (sourceLanguage !== 'auto' && !isLang(sourceLanguage)) return res.status(400).json({ error: 'Invalid source language.' });
  if (!MODES.includes(mode) || !VOICES.includes(voiceStyle)) return res.status(400).json({ error: 'Invalid mode or voice style.' });
  if (sourceLanguage !== 'auto' && targets.includes(sourceLanguage) && targets.length === 1) return res.status(400).json({ error: 'Source and target language are the same.' });
  if (mode !== 'subtitles' && req.user.plan === 'free' && req.user.role !== 'admin') return res.status(402).json({ error: 'Voice dubbing is available on Pro and Business plans.' });

  const limit = Number(getSetting(`${req.user.plan}_monthly_limit`)) || 0;
  const used = db.prepare("SELECT COUNT(DISTINCT video_id) c FROM jobs WHERE user_id=? AND created_at >= date('now','start of month')").get(req.user.id).c;
  const alreadyCounted = db.prepare("SELECT 1 FROM jobs WHERE video_id=? AND created_at >= date('now','start of month')").get(video.id);
  if (!alreadyCounted && used >= limit && req.user.role !== 'admin') return res.status(429).json({ error: `You've reached your monthly limit of ${limit} videos.` });

  if (!config.demoMode) {
    const missing = [];
    if (!config.keys.openai && (config.providers.stt === 'openai' || config.providers.translation === 'openai')) missing.push('OPENAI_API_KEY');
    if (config.providers.translation === 'deepl' && !config.keys.deepl) missing.push('DEEPL_API_KEY');
    if (mode !== 'subtitles' && !(config.keys.elevenlabs && config.keys.elevenlabsVoice)) missing.push('ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID');
    if (missing.length) return res.status(503).json({ error: `This feature requires API configuration: ${missing.join(', ')}. Enable DEMO_MODE to try the workflow.` });
  }

  const ins = db.prepare('INSERT INTO jobs(video_id,user_id,source_language,target_language,mode,voice_style,demo) VALUES(?,?,?,?,?,?,?)');
  const ids = targets.map((t) => ins.run(video.id, req.user.id, sourceLanguage, t, mode, voiceStyle, config.demoMode ? 1 : 0).lastInsertRowid);
  db.prepare("UPDATE videos SET status='processing', target_languages=? WHERE id=?").run(JSON.stringify(targets), video.id);
  // Jobs run in-process; swap for a queue (BullMQ etc.) when scaling.
  ids.forEach((id) => setImmediate(() => runJob(id)));
  res.status(202).json({ jobs: ids.map((id) => shapeJob(db.prepare('SELECT * FROM jobs WHERE id=?').get(id))) });
});

router.get('/video/:videoId', (req, res) => {
  const rows = db.prepare('SELECT * FROM jobs WHERE video_id=? AND user_id=? ORDER BY id').all(Number(req.params.videoId), req.user.id);
  res.json({ jobs: rows.map(shapeJob) });
});

router.get('/:id/status', (req, res) => {
  const j = db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=?').get(Number(req.params.id), req.user.id);
  if (!j) return res.status(404).json({ error: 'Job not found.' });
  res.json({ job: shapeJob(j) });
});

export default router;
