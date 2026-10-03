import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { toSrt, toVtt } from '../utils/subtitles.js';

const router = Router();
router.use(requireAuth);

// GET /api/download/:jobId?type=video|srt|vtt|audio  (token may be passed as ?token= for plain links)
router.get('/:id', (req, res) => {
  const j = db.prepare('SELECT j.*, v.title, v.filename FROM jobs j JOIN videos v ON v.id=j.video_id WHERE j.id=? AND j.user_id=?').get(Number(req.params.id), req.user.id);
  if (!j) return res.status(404).json({ error: 'Job not found.' });
  if (j.status !== 'completed') return res.status(409).json({ error: 'This translation is not finished yet.' });
  const type = String(req.query.type || 'video');
  const base = `${j.title.replace(/[^\w.-]+/g, '_')}-${j.target_language}`;
  const inline = req.query.inline === '1';

  if (type === 'srt' || type === 'vtt') {
    const row = db.prepare('SELECT data FROM subtitles WHERE job_id=?').get(j.id);
    if (!row) return res.status(404).json({ error: 'Subtitles not found.' });
    const segs = JSON.parse(row.data);
    res.type(type === 'srt' ? 'application/x-subrip' : 'text/vtt');
    if (!inline) res.attachment(`${base}.${type}`);
    return res.send(type === 'srt' ? toSrt(segs) : toVtt(segs));
  }
  if (type === 'audio') {
    if (!j.audio_path || !fs.existsSync(j.audio_path)) return res.status(404).json({ error: j.demo ? 'Demo mode does not generate audio. Connect a text-to-speech provider to enable it.' : 'No translated audio was created for this job.' });
    return inline ? res.sendFile(j.audio_path) : res.download(j.audio_path, `${base}.mp3`);
  }
  if (type === 'video') {
    // Demo mode has no rendered output, so the original video is served with subtitles attached separately.
    const file = j.video_path && fs.existsSync(j.video_path) ? j.video_path : path.resolve('uploads', j.filename);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'The video file is no longer available.' });
    return inline ? res.sendFile(file) : res.download(file, `${base}${path.extname(file)}`);
  }
  res.status(400).json({ error: 'Unknown download type.' });
});

export default router;
