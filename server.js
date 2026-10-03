import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import { config, assertConfig } from './utils/config.js';
import { db, log } from './utils/db.js';
import { LANGUAGES, POPULAR } from './utils/languages.js';
import { checkFfmpeg } from './services/videoProcessor.js';
import { recoverStuckJobs } from './services/jobRunner.js';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import translateRoutes from './routes/translate.js';
import subtitleRoutes from './routes/subtitles.js';
import downloadRoutes from './routes/download.js';
import adminRoutes from './routes/admin.js';

assertConfig();
['uploads', 'outputs', 'data'].forEach((d) => fs.mkdirSync(d, { recursive: true }));
recoverStuckJobs();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientOrigin.split(','), credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', async (_req, res) => {
  let dbOk = true;
  try { db.prepare('SELECT 1').get(); } catch { dbOk = false; }
  res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'ok' : 'degraded', demoMode: config.demoMode, ffmpeg: await checkFfmpeg(), maxFileMb: config.maxFileMb,
    banner: config.demoMode ? 'Demo Mode — AI providers are not connected.' : null });
});
app.get('/api/languages', (_req, res) => res.json({ languages: LANGUAGES, popular: POPULAR }));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/subtitles', subtitleRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// Never leak stack traces or internals.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.expose) return res.status(err.status || 400).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  log('error', `${err.message}`);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// Retention: delete uploads/outputs older than RETENTION_DAYS (hourly).
setInterval(() => {
  const cutoff = Date.now() - config.retentionDays * 864e5;
  for (const dir of ['uploads', 'outputs']) {
    for (const f of fs.readdirSync(dir)) {
      const p = `${dir}/${f}`;
      try { if (fs.statSync(p).mtimeMs < cutoff) fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }
}, 3600 * 1000).unref();

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}${config.demoMode ? '  (DEMO_MODE on)' : ''}`);
});
