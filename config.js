import 'dotenv/config';

const bool = (v, d) => (v === undefined ? d : String(v).toLowerCase() === 'true');

export const config = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: (process.env.ADMIN_EMAIL || '').toLowerCase(),
  demoMode: bool(process.env.DEMO_MODE, true),
  demoStepMs: Number(process.env.DEMO_STEP_MS) || 1500,
  maxFileMb: Number(process.env.MAX_FILE_MB) || 500,
  retentionDays: Number(process.env.RETENTION_DAYS) || 30,
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  dbPath: process.env.DB_PATH || './data/app.db',
  providers: {
    stt: process.env.STT_PROVIDER || 'openai',
    translation: process.env.TRANSLATION_PROVIDER || 'openai',
    tts: process.env.TTS_PROVIDER || 'elevenlabs',
  },
  keys: {
    openai: process.env.OPENAI_API_KEY || '',
    deepl: process.env.DEEPL_API_KEY || '',
    elevenlabs: process.env.ELEVENLABS_API_KEY || '',
    elevenlabsVoice: process.env.ELEVENLABS_VOICE_ID || '',
  },
  openaiTranslationModel: process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini',
};

export function assertConfig() {
  if (!config.jwtSecret || config.jwtSecret.length < 16) {
    throw new Error('JWT_SECRET is missing or too short. Copy .env.example to .env and set it.');
  }
}
