import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from '../utils/db.js';
import { config } from '../utils/config.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please wait a few minutes.' } });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, plan: u.plan });

router.post('/register', limiter, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Enter your name (2–80 characters).' });
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 100) return res.status(400).json({ error: 'Password must be 8–100 characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const role = config.adminEmail && email === config.adminEmail ? 'admin' : 'user';
  const hash = await bcrypt.hash(password, 12);
  const id = db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name, email, hash, role).lastInsertRowid;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', limiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  // Same message for unknown email and wrong password.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

// Password reset needs an email provider. Responds identically either way (no account enumeration).
router.post('/forgot-password', limiter, (_req, res) =>
  res.json({ message: 'If an account exists for that email, reset instructions will be sent once email delivery is configured.', configured: false }));

export default router;
