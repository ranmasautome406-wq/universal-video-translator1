import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db, getSetting, log } from '../utils/db.js';
import { config } from '../utils/config.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { checkFfmpeg, rm } from '../services/videoProcessor.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (_req, res) => {
  const c = (sql) => db.prepare(sql).get().c;
  res.json({
    totalUsers: c('SELECT COUNT(*) c FROM users'),
    totalVideos: c('SELECT COUNT(*) c FROM videos'),
    processingMinutes: Math.round(c('SELECT COALESCE(SUM(minutes),0) c FROM usage') * 10) / 10,
    storageBytes: c('SELECT COALESCE(SUM(size),0) c FROM videos'),
    translationJobs: c('SELECT COUNT(*) c FROM jobs'),
    failedJobs: c("SELECT COUNT(*) c FROM jobs WHERE status='failed'"),
    system: { demoMode: config.demoMode, ffmpeg: await checkFfmpeg(), providers: config.providers,
      keysConfigured: { openai: !!config.keys.openai, deepl: !!config.keys.deepl, elevenlabs: !!config.keys.elevenlabs } },
  });
});

router.get('/users', (_req, res) => res.json({ users: db.prepare('SELECT id,name,email,role,plan,created_at FROM users ORDER BY id DESC LIMIT 200').all() }));

router.put('/users/:id', (req, res) => {
  const { plan, role } = req.body || {};
  const id = Number(req.params.id);
  if (plan && !['free', 'pro', 'business'].includes(plan)) return res.status(400).json({ error: 'Invalid plan.' });
  if (role && !['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
  if (id === req.user.id && role && role !== 'admin') return res.status(400).json({ error: "You can't remove your own admin role." });
  if (plan) db.prepare('UPDATE users SET plan=? WHERE id=?').run(plan, id);
  if (role) db.prepare('UPDATE users SET role=? WHERE id=?').run(role, id);
  res.json({ ok: true });
});

router.get('/jobs', (_req, res) => res.json({ jobs: db.prepare('SELECT j.id,j.status,j.progress,j.target_language,j.mode,j.demo,j.error,j.created_at,u.email,v.title FROM jobs j JOIN users u ON u.id=j.user_id JOIN videos v ON v.id=j.video_id ORDER BY j.id DESC LIMIT 200').all() }));

router.delete('/jobs/:id', async (req, res) => {
  const j = db.prepare('SELECT * FROM jobs WHERE id=?').get(Number(req.params.id));
  if (!j) return res.status(404).json({ error: 'Job not found.' });
  await rm(j.video_path, j.audio_path);
  db.prepare('DELETE FROM jobs WHERE id=?').run(j.id);
  log('info', `Admin ${req.user.email} deleted job ${j.id}`);
  res.json({ ok: true });
});

router.get('/logs', (_req, res) => res.json({ logs: db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 200').all() }));

router.get('/settings', (_req, res) => res.json({ limits: { free: Number(getSetting('free_monthly_limit')), pro: Number(getSetting('pro_monthly_limit')), business: Number(getSetting('business_monthly_limit')) } }));

router.put('/settings', (req, res) => {
  const limits = req.body?.limits || {};
  for (const plan of ['free', 'pro', 'business']) {
    if (limits[plan] === undefined) continue;
    const n = Number(limits[plan]);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return res.status(400).json({ error: `Invalid limit for ${plan}.` });
    db.prepare('UPDATE settings SET value=? WHERE key=?').run(String(n), `${plan}_monthly_limit`);
  }
  res.json({ ok: true });
});

export default router;
