import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../utils/config.js';

/**
 * textToSpeech({ segments, language, voiceStyle, dir }) -> [{ start, file }]
 * Writes one mp3 per segment into `dir`; videoProcessor.buildDubTrack mixes them.
 */
const STYLE = {
  natural: { stability: 0.5, style: 0.2 },
  professional: { stability: 0.75, style: 0.0 },
  energetic: { stability: 0.3, style: 0.6 },
  calm: { stability: 0.85, style: 0.0 },
};

const providers = {
  async elevenlabs({ segments, voiceStyle, dir }) {
    const { elevenlabs: key, elevenlabsVoice: voice } = config.keys;
    if (!key || !voice) throw Object.assign(new Error('ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID not set.'), { code: 'MISSING_KEY' });
    const clips = [];
    for (let i = 0; i < segments.length; i++) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
        body: JSON.stringify({ text: segments[i].translated, model_id: 'eleven_multilingual_v2', voice_settings: { ...(STYLE[voiceStyle] || STYLE.natural), similarity_boost: 0.75 } }),
      });
      if (!res.ok) throw Object.assign(new Error('Text-to-speech request failed.'), { code: 'PROVIDER_FAILED', detail: res.status });
      const file = path.join(dir, `clip-${i}.mp3`);
      await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
      clips.push({ start: segments[i].start, file });
    }
    return clips;
  },
};

export async function textToSpeech({ segments, language, voiceStyle = 'natural', dir, demo = false }) {
  if (demo) return []; // No audio is generated in demo mode.
  const fn = providers[config.providers.tts];
  if (!fn) throw Object.assign(new Error(`Unknown TTS provider "${config.providers.tts}".`), { code: 'BAD_PROVIDER' });
  return fn({ segments, language, voiceStyle, dir });
}
