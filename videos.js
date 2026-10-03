import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { db } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadVideo } from '../middleware/upload.js';
import * as vp from '../services/videoProcessor.js';

const router = Router();
router.use(requireAuth);

const shape = (v) => ({
  id: v.id, title: v.title, size: v.size, duration: v.duration, status: v.status,
  originalLanguage: v.original_language, targetLanguages: JSON.parse(v.target_languages),
  createdAt: v.created_at, outputUrl: v.output_url,
  sourceUrl: `/api/videos/${v.id}/source`,
});

router.post('/upload', (req, res, next) => {
  uploadVideo(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File is too large. Check the maximum size and try again.' });
      return next(err);
    }
    if (!req.file) return res.status(400).json({ error: 'Choose a video file to upload.' });
    const file = req.file;
    let duration = 0;
    if (await vp.checkFfmpeg()) {
      try {
        const meta = await vp.getMetadata(file.path);
        duration = meta.duration;
        if (!meta.hasAudio) { await vp.rm(file.path); return res.status(422).json({ error: 'This video has no audio track to translate.' }); }
      } catch { await vp.rm(file.path); return res.status(422).json({ error: 'This file could not be read as a video.' }); }
    }
    // Without FFmpeg, fall back to the browser-reported duration (display only, clamped).
    if (!duration) duration = Math.min(Math.max(Number(req.body?.duration) || 0, 0), 86400);
    const title = path.parse(file.originalname).name.replace(/[^\w\s.-]/g, '').slice(0, 100) || 'Untitled video';
    const id = db.prepare('INSERT INTO videos(user_id,title,filename,size,duration) VALUES(?,?,?,?,?)')
      .run(req.user.id, title, file.filename, file.size, duration).lastInsertRowid;
    res.status(201).json({ video: shape(db.prepare('SELECT * FROM videos WHERE id=?').get(id)), ffmpeg: duration > 0 });
  });
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM videos WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  const jobs = db.prepare('SELECT id,video_id,target_language,status,demo FROM jobs WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  res.json({ videos: rows.map((v) => ({ ...shape(v), jobs: jobs.filter((j) => j.video_id === v.id) })) });
});

const own = (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id=? AND user_id=?').get(Number(req.params.id), req.user.id);
  if (!v) res.status(404).json({ error: 'Video not found.' });
  return v;
};

router.get('/:id', (req, res) => { const v = own(req, res); if (v) res.json({ video: shape(v) }); });

router.get('/:id/source', (req, res) => {
  const v = own(req, res);
  if (v) res.sendFile(path.resolve('uploads', v.filename)); // sendFile supports Range requests for seeking
});

router.delete('/:id', async (req, res) => {
  const v = own(req, res);
  if (!v) return;
  const jobs = db.prepare('SELECT video_path,audio_path FROM jobs WHERE video_id=?').all(v.id);
  await vp.rm(path.resolve('uploads', v.filename), ...jobs.flatMap((j) => [j.video_path, j.audio_path]));
  db.prepare('DELETE FROM videos WHERE id=?').run(v.id);
  res.json({ ok: true });
});

export default router;
