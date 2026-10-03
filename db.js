import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', plan TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, filename TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0,
  original_language TEXT, target_languages TEXT NOT NULL DEFAULT '[]',
  duration REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'uploaded',
  output_url TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_language TEXT, detected_language TEXT, target_language TEXT NOT NULL,
  mode TEXT NOT NULL, voice_style TEXT NOT NULL DEFAULT 'natural',
  status TEXT NOT NULL DEFAULT 'queued', step INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0, demo INTEGER NOT NULL DEFAULT 0,
  error TEXT, video_path TEXT, audio_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), started_at TEXT, finished_at TEXT
);
CREATE TABLE IF NOT EXISTS subtitles (
  job_id INTEGER PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  data TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER, minutes REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const defaults = { free_monthly_limit: '3', pro_monthly_limit: '50', business_monthly_limit: '500' };
for (const [k, v] of Object.entries(defaults)) {
  db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').run(k, v);
}

export const getSetting = (k) => db.prepare('SELECT value FROM settings WHERE key=?').get(k)?.value;
export function log(level, message) {
  try { db.prepare('INSERT INTO logs(level,message) VALUES(?,?)').run(level, String(message).slice(0, 500)); } catch { /* ignore */ }
  if (level === 'error') console.error(`[${level}] ${message}`);
}
