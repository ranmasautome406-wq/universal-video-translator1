import fs from 'node:fs/promises';
import { config } from '../utils/config.js';
import { DEMO_SEGMENTS } from './demoData.js';

/**
 * speechToText({ audioPath, language }) -> { language, segments: [{start,end,text}] }
 * language: ISO code or 'auto'. Add a provider by adding a key to `providers`.
 */
const providers = {
  async openai({ audioPath, language }) {
    if (!config.keys.openai) throw Object.assign(new Error('OPENAI_API_KEY is not set.'), { code: 'MISSING_KEY' });
    const form = new FormData();
    form.append('file', new Blob([await fs.readFile(audioPath)]), 'audio.wav');
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    if (language && language !== 'auto') form.append('language', language);
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${config.keys.openai}` }, body: form,
    });
    if (!res.ok) throw Object.assign(new Error('Speech-to-text request failed.'), { code: 'PROVIDER_FAILED', detail: res.status });
    const j = await res.json();
    return {
      language: language && language !== 'auto' ? language : whisperName(j.language),
      segments: (j.segments || []).map((s) => ({ start: s.start, end: s.end, text: s.text.trim() })),
    };
  },
};

const NAME_TO_CODE = { english: 'en', hindi: 'hi', marathi: 'mr', gujarati: 'gu', bengali: 'bn', tamil: 'ta', telugu: 'te', kannada: 'kn', malayalam: 'ml', punjabi: 'pa', urdu: 'ur', spanish: 'es', french: 'fr', german: 'de', italian: 'it', portuguese: 'pt', russian: 'ru', japanese: 'ja', korean: 'ko', chinese: 'zh', arabic: 'ar', turkish: 'tr' };
const whisperName = (n) => NAME_TO_CODE[String(n).toLowerCase()] || String(n).toLowerCase().slice(0, 2);

export async function speechToText({ audioPath, language = 'auto', demo = false }) {
  if (demo) return { language: language === 'auto' ? 'en' : language, segments: DEMO_SEGMENTS.map(({ start, end, text }) => ({ start, end, text })) };
  const fn = providers[config.providers.stt];
  if (!fn) throw Object.assign(new Error(`Unknown STT provider "${config.providers.stt}".`), { code: 'BAD_PROVIDER' });
  return fn({ audioPath, language });
}
