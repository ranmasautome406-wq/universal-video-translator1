import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../utils/config.js';

export const UPLOAD_DIR = path.resolve('uploads');
const ALLOWED_EXT = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm']);
const ALLOWED_MIME = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/avi']);

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  // Never trust the client filename: random name, extension from allow-list only.
  filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: config.maxFileMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
      return cb(Object.assign(new Error('Unsupported format. Use MP4, MOV, AVI, MKV or WEBM.'), { status: 415, expose: true }));
    }
    cb(null, true);
  },
}).single('video');
