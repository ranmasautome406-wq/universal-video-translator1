import { config } from '../utils/config.js';
import { langName } from '../utils/languages.js';
import { demoTranslate } from './demoData.js';

/**
 * translation({ segments, source, target }) -> segments with `translated` added.
 */
const providers = {
  async openai({ segments, source, target }) {
    if (!config.keys.openai) throw Object.assign(new Error('OPENAI_API_KEY is not set.'), { code: 'MISSING_KEY' });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.keys.openai}` },
      body: JSON.stringify({
        model: config.openaiTranslationModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `Translate subtitle lines from ${langName(source)} to ${langName(target)}. Keep meaning and tone, keep each line short. Reply ONLY with JSON: {"lines": ["..."]} with exactly ${segments.length} items in the same order.` },
          { role: 'user', content: JSON.stringify(segments.map((s) => s.text)) },
        ],
      }),
    });
    if (!res.ok) throw Object.assign(new Error('Translation request failed.'), { code: 'PROVIDER_FAILED', detail: res.status });
    const j = await res.json();
    const lines = JSON.parse(j.choices[0].message.content).lines;
    if (!Array.isArray(lines) || lines.length !== segments.length) throw Object.assign(new Error('Translation returned unexpected output.'), { code: 'PROVIDER_FAILED' });
    return segments.map((s, i) => ({ ...s, translated: String(lines[i]) }));
  },

  async deepl({ segments, source, target }) {
    if (!config.keys.deepl) throw Object.assign(new Error('DEEPL_API_KEY is not set.'), { code: 'MISSING_KEY' });
    const host = config.keys.deepl.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
    const res = await fetch(`https://${host}/v2/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `DeepL-Auth-Key ${config.keys.deepl}` },
      body: JSON.stringify({ text: segments.map((s) => s.text), source_lang: source.toUpperCase(), target_lang: target.toUpperCase() }),
    });
    if (!res.ok) throw Object.assign(new Error('Translation request failed.'), { code: 'PROVIDER_FAILED', detail: res.status });
    const j = await res.json();
    return segments.map((s, i) => ({ ...s, translated: j.translations[i].text }));
  },
};

export async function translation({ segments, source, target, demo = false }) {
  if (demo) return demoTranslate(target);
  const fn = providers[config.providers.translation];
  if (!fn) throw Object.assign(new Error(`Unknown translation provider "${config.providers.translation}".`), { code: 'BAD_PROVIDER' });
  return fn({ segments, source, target });
}
