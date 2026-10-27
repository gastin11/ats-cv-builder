import { config } from '../config.js';
import type { CVDocument } from '../../../shared/cv-schema/cv.schema.js';

export type TranslateTarget = 'en' | 'id';

const ID_MARKERS = /\b(dan|dengan|untuk|yang|dalam|pada|serta|sebagai|dari|ke|di|adalah|mengembangkan|melakukan|membuat|merancang|meningkatkan)\b/gi;
const EN_MARKERS = /\b(the|and|with|for|of|in|to|developed|managed|designed|created|improved|led|built)\b/gi;

/** Heuristic language detection for a block of CV text. */
export function detectLanguage(texts: string[]): TranslateTarget {
  let id = 0;
  let en = 0;
  for (const match of texts.join(' ').matchAll(ID_MARKERS)) id++;
  for (const match of texts.join(' ').matchAll(EN_MARKERS)) en++;
  return id > en ? 'id' : 'en';
}

interface TranslateArgs {
  text: string;
  source: TranslateTarget;
  target: TranslateTarget;
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.translate.timeoutMs);
  try {
    const response = await fetch(url, init);
    if (!response.ok) throw new Error(`Translation provider HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

type Provider = { name: string; translate: (a: TranslateArgs) => Promise<string> };

/** Free MyMemory API (no key; an email raises the quota to 50k chars/day). */
const myMemoryProvider: Provider = {
  name: 'mymemory',
  translate: async ({ text, source, target }) => {
    const url = new URL(config.translate.endpoint);
    url.searchParams.set('q', text.slice(0, 500));
    url.searchParams.set('langpair', `${source}|${target}`);
    if (config.translate.email) url.searchParams.set('de', config.translate.email);
    const payload = (await fetchJson(url.toString())) as {
      responseData?: { translatedText?: string };
      responseDetails?: string;
      quotaFinished?: boolean;
    };
    const translated = payload.responseData?.translatedText;
    if (typeof translated !== 'string' || translated.length === 0) {
      throw new Error(payload.responseDetails || 'Translation provider returned an empty result.');
    }
    // MyMemory reports exhausted quota inside a 200 response
    if (payload.quotaFinished === true || /MYMEMORY WARNING/i.test(translated)) {
      throw new Error('Translation daily quota reached.');
    }
    // MyMemory sometimes echoes the input wrapped in quotes
    return translated.replace(/^"|"$/g, '').trim();
  },
};

/** Unofficial Google mirror endpoint - good quality, no key, used as fallback. */
const googleMirrorProvider: Provider = {
  name: 'google-mirror',
  translate: async ({ text, source, target }) => {
    const url = new URL(config.translate.googleEndpoint);
    url.searchParams.set('client', 'dict-chrome-ex');
    url.searchParams.set('sl', source);
    url.searchParams.set('tl', target);
    url.searchParams.set('q', text.slice(0, 500));
    const payload = (await fetchJson(url.toString())) as unknown;
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      throw new Error('Google mirror returned an unexpected response.');
    }
    const translated = payload[0]
      .map((seg: unknown) => (Array.isArray(seg) ? String(seg[0] ?? '') : ''))
      .join('');
    if (!translated.trim()) throw new Error('Google mirror returned an empty result.');
    return translated.trim();
  },
};

/** DeepL API Free (500k chars/month) - enabled when DEEPL_API_KEY is set. */
const deeplProvider: Provider = {
  name: 'deepl',
  translate: async ({ text, source, target }) => {
    if (!config.translate.deeplApiKey) throw new Error('DEEPL_API_KEY not configured.');
    const payload = (await fetchJson('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `DeepL-Auth-Key ${config.translate.deeplApiKey}`,
      },
      body: JSON.stringify({
        text: [text.slice(0, 500)],
        target_lang: target.toUpperCase(),
        source_lang: source.toUpperCase() === 'ID' ? 'ID' : 'EN',
      }),
    })) as { translations?: Array<{ text?: string }> };
    const translated = payload.translations?.[0]?.text;
    if (!translated?.trim()) throw new Error('DeepL returned an empty result.');
    return translated.trim();
  },
};

function activeProviders(): Provider[] {
  const providers: Provider[] = [myMemoryProvider, googleMirrorProvider];
  if (config.translate.deeplApiKey) providers.push(deeplProvider);
  return providers;
}

/** Translate one text by trying each configured provider in order. */
async function translateOne({ text, source, target }: TranslateArgs): Promise<string> {
  const errors: string[] = [];
  for (const provider of activeProviders()) {
    try {
      return await provider.translate({ text: text.slice(0, 500), source, target });
    } catch (err) {
      errors.push(`${provider.name}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }
  throw new Error(errors.join(' | ') || 'All translation providers failed.');
}

/** Translate a list of texts, deduplicating identical strings and running small batches. */
export async function translateBatch(texts: string[], source: TranslateTarget, target: TranslateTarget): Promise<string[]> {
  if (source === target) return texts;
  const unique = [...new Set(texts.filter((t) => t.trim()))];
  const results = new Map<string, string>();
  const queue = [...unique];
  const BATCH = 4;

  let failures = 0;
  while (queue.length > 0) {
    const chunk = queue.splice(0, BATCH);
    const settled = await Promise.allSettled(
      chunk.map((text) => translateOne({ text, source, target })),
    );
    settled.forEach((outcome, index) => {
      const original = chunk[index];
      if (outcome.status === 'fulfilled' && outcome.value) {
        results.set(original, outcome.value);
      } else {
        // On failure keep the original text rather than dropping content
        results.set(original, original);
        failures++;
      }
    });
  }

  // If nothing at all was translated the provider is unavailable (quota,
  // network) - fail loudly so the UI can tell the user instead of silently
  // returning the untranslated document.
  if (unique.length > 0 && failures >= unique.length) {
    throw new Error('Translation provider unavailable (daily quota may be reached).');
  }

  return texts.map((t) => (t.trim() && results.get(t)) || t);
}

/**
 * Translate the translatable content of a CV (summary, titles, bullets,
 * details, skill group labels) while keeping proper nouns like company names,
 * locations, links and technical skill terms untouched.
 */
export async function translateCv(cv: CVDocument, target: TranslateTarget): Promise<CVDocument> {
  const texts: string[] = [
    cv.personal.professionalTitle,
    cv.summary,
    ...cv.experience.flatMap((e) => [e.jobTitle, e.employmentType, ...e.bullets]),
    ...cv.education.flatMap((e) => [e.degree, ...e.details]),
    ...cv.projects.flatMap((p) => [p.role, ...p.bullets]),
    ...cv.organizations.flatMap((o) => [o.role, ...o.bullets]),
    ...cv.awards.flatMap((a) => [a.title, a.description, a.issuer]),
    ...cv.skills.map((g) => g.label),
    ...cv.additional.flatMap((a) => [a.title, ...a.items]),
  ].filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

  const source = detectLanguage(texts);
  if (source === target) return cv;

  const translated = await translateBatch(texts, source, target);
  const map = new Map<string, string>();
  texts.forEach((original, i) => map.set(original, translated[i]));

  const t = (value: string): string => (value.trim() ? (map.get(value) ?? value) : value);

  return {
    ...cv,
    personal: { ...cv.personal, professionalTitle: t(cv.personal.professionalTitle) },
    summary: t(cv.summary),
    experience: cv.experience.map((e) => ({
      ...e,
      jobTitle: t(e.jobTitle),
      employmentType: t(e.employmentType),
      bullets: e.bullets.map((b) => t(b)),
    })),
    education: cv.education.map((e) => ({
      ...e,
      degree: t(e.degree),
      details: e.details.map((d) => t(d)),
    })),
    projects: cv.projects.map((p) => ({
      ...p,
      role: t(p.role),
      bullets: p.bullets.map((b) => t(b)),
    })),
    organizations: cv.organizations.map((o) => ({
      ...o,
      role: t(o.role),
      bullets: o.bullets.map((b) => t(b)),
    })),
    awards: cv.awards.map((a) => ({
      ...a,
      title: t(a.title),
      description: t(a.description),
      issuer: t(a.issuer),
    })),
    skills: cv.skills.map((g) => ({ ...g, label: t(g.label) })),
    additional: cv.additional.map((a) => ({
      ...a,
      title: t(a.title),
      items: a.items.map((i) => t(i)),
    })),
    settings: { ...cv.settings, language: target },
  };
}
