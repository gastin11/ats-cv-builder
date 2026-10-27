import { config } from '../config.js';
import { cvDocumentSchema, type CVDocument } from '../../../shared/cv-schema/cv.schema.js';

export const REWRITE_MODES = [
  'professional',
  'concise',
  'achievement-focused',
  'technical',
  'business-focused',
  'ats-friendly',
] as const;
export type RewriteMode = (typeof REWRITE_MODES)[number];

const FACTUALITY_SYSTEM_PROMPT = `You are the writing assistant embedded in an ATS CV Builder web app.

Scope: you ONLY help with CV/resume writing for this tool - improving bullets, summaries, wording, structure and ATS alignment. If the input is not CV content, say in the JSON "suggestion" field (one short sentence) that you can only help with CV writing.

Rules:
1. Never invent facts.
2. Never invent metrics.
3. Never invent employers.
4. Never invent job titles.
5. Never invent dates.
6. Never invent technologies.
7. Preserve the user's factual meaning.
8. If information is missing, state it in "missing_information" instead of inventing it.
9. Prefer concise professional CV language.
10. Return suggestions the user can accept or reject.
11. Stay on topic: no career advice outside the CV, no greetings, no questions back.
12. Be brief: "suggestion" max 40 words, "reason" max 25 words, at most 3 "missing_information" items.

Response language: write ALL human-readable text ("suggestion", "reason", "missing_information", "message") in the language given in the language instruction below, regardless of the language of the input text.

Answer with a single JSON object and nothing else (no markdown fences, no prose).`;

const REFINEMENT_SYSTEM_PROMPT = `You are a data-cleanup assistant for an ATS CV Builder. A heuristic parser extracted CV data into JSON, but some values may sit in the wrong fields.

Task: return the SAME JSON with ONLY structural corrections:
- Move values into their correct fields (e.g. a city/country sitting in "jobTitle" belongs in "location"; a degree name in "location" belongs in "degree"; a role in "location" belongs in "jobTitle").
- Fix obviously wrong label assignments between skill groups.
- Merge a continuation fragment into its previous bullet only when it is clearly the same sentence split by the parser.

Strict rules:
- Keep every existing fact and wording VERBATIM: do not translate, rewrite, shorten, expand, or invent anything.
- Do not delete entries or fields; keep the exact same JSON structure and field names.
- Keep the "settings" object exactly as given.

Answer with the corrected JSON object only - no markdown fences, no prose.`;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  id: 'Indonesian (Bahasa Indonesia)',
};

function languageInstruction(language?: string): string {
  const name = LANGUAGE_NAMES[language ?? 'en'] ?? 'English';
  return `Response language: ${name}.`;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
  }
}

async function callProvider(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  useJsonFormat = true,
): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);

  const makeBody = (jsonFormat: boolean) =>
    JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
      ...(jsonFormat ? { response_format: { type: 'json_object' } } : {}),
    });

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: makeBody(useJsonFormat),
      signal: controller.signal,
    });

    // If provider rejected response_format with 400 Bad Request, retry without it
    if (!response.ok && response.status === 400 && useJsonFormat) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: makeBody(false),
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`AI provider HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string; reasoning_content?: string }; finish_reason?: string }>;
    };
    const choice = payload.choices?.[0];
    const content = choice?.message?.content ?? '';
    // Some reasoning models stream their answer into reasoning_content and may
    // return empty content when the token budget is exhausted.
    const fallback = choice?.message?.reasoning_content ?? '';
    const text = content.trim() || fallback.trim();
    if (!text) {
      throw new Error(
        `AI provider returned an empty response (finish_reason: ${choice?.finish_reason ?? 'unknown'}).`,
      );
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('AI request timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Chat completion with automatic failover to the backup provider. */
export async function chatJson(messages: ChatMessage[], maxTokens = config.ai.maxTokens): Promise<string> {
  const attempts: Array<() => Promise<string>> = [];
  if (config.ai.baseUrl && config.ai.apiKey && config.ai.model) {
    attempts.push(() => callProvider(config.ai.baseUrl, config.ai.apiKey, config.ai.model, messages, maxTokens));
  }
  if (config.ai.backupBaseUrl && config.ai.backupApiKey && config.ai.backupModel) {
    attempts.push(() =>
      callProvider(config.ai.backupBaseUrl, config.ai.backupApiKey, config.ai.backupModel, messages, maxTokens),
    );
  }
  if (attempts.length === 0) {
    throw new AiUnavailableError('AI assistance is not configured on this server.');
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
    }
  }
  throw new AiUnavailableError(
    `AI suggestions are temporarily unavailable. Your CV content is still available; you can continue editing manually. (${lastError instanceof Error ? lastError.message : 'unknown error'})`,
  );
}

/**
 * Run a JSON-structured AI request; if the model returns unparsable JSON,
 * retry once with an explicit correction message.
 */
async function chatJsonStrict(
  messages: ChatMessage[],
  maxTokens: number,
  parse: (raw: string) => unknown,
): Promise<unknown> {
  try {
    return parse(await chatJson(messages, maxTokens));
  } catch (err) {
    if (!(err instanceof Error) || !/JSON/i.test(err.message)) throw err;
    // Truncated or malformed output: retry once with double budget + brevity instruction
    return parse(
      await chatJson(
        [
          ...messages,
          { role: 'assistant', content: 'My previous response was not valid JSON.' },
          {
            role: 'user',
            content: 'Return ONLY one valid JSON object matching the requested schema. No markdown fences, no prose, no trailing text. Keep it SHORT: fewer items and shorter strings so it fits the response limit.',
          },
        ],
        maxTokens * 2,
      ),
    );
  }
}

/** Escape raw control characters inside JSON string literals (common model output bug). */
function repairJson(json: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (const ch of json) {
    if (inString) {
      if (escaped) {
        escaped = false;
        out += ch;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        out += ch;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else out += ch;
      continue;
    }
    if (ch === '"') inString = true;
    out += ch;
  }
  return out;
}

export function cleanAiResponseText(text: string): string {
  let cleaned = text.trim();
  // Strip <think>...</think> blocks from reasoning models (Qwen, DeepSeek, etc.)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // If model ran out of tokens while still inside <think>, strip the unclosed block
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '').trim();
  return cleaned;
}

export function extractJson(text: string): unknown {
  const cleaned = cleanAiResponseText(text);

  // 1. Check for markdown code fences
  const fenceMatches = [...cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fenceMatches) {
    const candidate = match[1].trim();
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        return JSON.parse(repairJson(candidate));
      } catch {
        const innerStart = candidate.indexOf('{');
        const innerEnd = candidate.lastIndexOf('}');
        if (innerStart !== -1 && innerEnd > innerStart) {
          try {
            return JSON.parse(candidate.slice(innerStart, innerEnd + 1));
          } catch {
            // continue searching
          }
        }
      }
    }
  }

  // 2. Scan for balanced { ... } JSON objects
  let depth = 0;
  let inString = false;
  let escaped = false;
  let currentStart = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      if (depth === 0) currentStart = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && currentStart !== -1) {
          const candidate = cleaned.slice(currentStart, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            try {
              return JSON.parse(repairJson(candidate));
            } catch {
              // Not valid, continue looking
            }
          }
          currentStart = -1;
        }
      }
    }
  }

  // 3. Fallback: try outermost braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        return JSON.parse(repairJson(candidate));
      } catch {
        // Fall through
      }
    }
  }

  throw new Error('AI response did not contain JSON.');
}

export interface ImproveResult {
  original: string;
  suggestion: string;
  reason: string;
  missing_information: string[];
}

const MODE_INSTRUCTIONS: Record<RewriteMode, string> = {
  professional: 'Use polished, formal professional language.',
  concise: 'Make it as short as possible while keeping every fact.',
  'achievement-focused': 'Emphasize outcomes and impact. If a metric is missing, do not invent one — instead list it in missing_information.',
  technical: 'Use precise technical terminology consistent with the technologies actually mentioned.',
  'business-focused': 'Emphasize business value and stakeholders without inventing numbers.',
  'ats-friendly': 'Use standard CV vocabulary and strong action verbs; avoid jargon, symbols and passive voice.',
};

/**
 * AI-assisted cleanup for heuristic CV extraction: fixes structural
 * misassignments (values in the wrong fields) without touching any content.
 * Falls back to the original CV when the AI is unavailable or its output is
 * unusable, so imports never degrade.
 */
export async function refineImportedCv(cv: CVDocument): Promise<{ cv: CVDocument; refined: boolean }> {
  const originalJson = JSON.stringify(cv);
  // Skip very large documents - refinement is a cleanup pass, not a rewrite.
  if (originalJson.length > 12000) return { cv, refined: false };

  const raw = await chatJsonStrict(
    [
      { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
      { role: 'user', content: `${languageInstruction(cv.settings.language)}

Extracted CV JSON:
${originalJson}` },
    ],
    3000,
    extractJson,
  );

  let refined: CVDocument;
  try {
    refined = cvDocumentSchema.parse(raw);
  } catch {
    return { cv, refined: false };
  }

  // Safety net: reject results that lost more than a third of their content
  const before = originalJson.length;
  const after = JSON.stringify(refined).length;
  if (after < before * 0.66) return { cv, refined: false };

  return { cv: refined, refined: true };
}

export async function improveText(input: {
  text: string;
  mode?: RewriteMode;
  section?: string;
  context?: string;
  language?: string;
}): Promise<ImproveResult> {
  const mode = input.mode ?? 'professional';
  const userPrompt = `Rewrite one CV ${input.section ?? 'text'} entry.

Mode: ${mode}. ${MODE_INSTRUCTIONS[mode]}

${input.context ? `Context from the rest of the CV (do not add facts beyond it):\n${input.context}\n` : ''}
Original text:
"""
${input.text}
"""

Return JSON exactly in this shape:
{"original": string, "suggestion": string, "reason": string, "missing_information": string[]}
"missing_information" must list any data the user should provide to strengthen the entry (e.g. a measurable result) — never fabricate it.

${languageInstruction(input.language)}`;

  try {
    const parsed = (await chatJsonStrict(
      [
        { role: 'system', content: FACTUALITY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      config.ai.maxTokens,
      extractJson,
    )) as Partial<ImproveResult>;
    return {
      original: typeof parsed.original === 'string' && parsed.original ? parsed.original : input.text,
      suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : '',
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      missing_information: Array.isArray(parsed.missing_information)
        ? parsed.missing_information.filter((m): m is string => typeof m === 'string')
        : [],
    };
  } catch (err) {
    // If strict JSON parsing failed, attempt to recover plain text rewrite from AI
    try {
      const raw = cleanAiResponseText(
        await chatJson(
          [
            { role: 'system', content: FACTUALITY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          config.ai.maxTokens,
        ),
      );
      const cleanedSuggestion = raw
        .replace(/^```[a-z]*\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^(?:berikut\s+(?:adalah\s+)?(?:saran|perbaikan|revisi)[^:\n]*:?|here\s+is\s+the\s+(?:suggested|improved)[^:\n]*:?)/i, '')
        .trim();
      if (cleanedSuggestion) {
        return {
          original: input.text,
          suggestion: cleanedSuggestion,
          reason: 'Perbaikan dari AI',
          missing_information: [],
        };
      }
    } catch {
      // ignore secondary fallback error and throw original
    }
    throw err;
  }
}

export interface CvSuggestion {
  section: string;
  target: string;
  type: string;
  message: string;
}

/** High-level improvement suggestions across the whole CV (keyword/structure oriented). */
export async function suggestCvImprovements(cv: CVDocument, language?: string): Promise<CvSuggestion[]> {
  // Token diet: cap long content so big CVs stay within a small budget.
  const trim = (s: string, max: number) => (s.length > max ? `${s.slice(0, max)}...` : s);
  const cvDigest = {
    personal: { fullName: cv.personal.fullName, professionalTitle: cv.personal.professionalTitle },
    summary: trim(cv.summary, 600),
    education: cv.education.slice(0, 6).map((e) => ({ degree: trim(e.degree, 120), institution: trim(e.institution, 120) })),
    experience: cv.experience.slice(0, 8).map((e) => ({
      jobTitle: trim(e.jobTitle, 120),
      company: trim(e.company, 120),
      bullets: e.bullets.slice(0, 4).map((b) => trim(b, 200)),
    })),
    projects: cv.projects.slice(0, 6).map((p) => ({ name: trim(p.name, 120), bullets: p.bullets.slice(0, 3).map((b) => trim(b, 200)) })),
    skills: cv.skills.slice(0, 4).map((g) => ({ label: trim(g.label, 40), skills: g.skills.slice(0, 15) })),
  };

  const userPrompt = `Analyze the following CV content and give up to 5 concrete, actionable writing suggestions (pick the most impactful ones).

${languageInstruction(language)}

Return JSON exactly in this shape:
{"suggestions": [{"section": string, "target": string, "type": string, "message": string}]}
- "section": CV section name (e.g. "experience")
- "target": which entry/bullet/field the suggestion refers to (quote its beginning)
- "type": one of "strong-verb" | "passive-voice" | "repetition" | "measurable-impact" | "conciseness" | "consistency" | "keyword"
- "message": the actionable suggestion. If a measurable result is missing, tell the user which metric they could add — never fabricate numbers.

CV content:
${JSON.stringify(cvDigest)}`;

  const parsed = (await chatJsonStrict(
    [
      { role: 'system', content: FACTUALITY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    3000,
    extractJson,
  )) as { suggestions?: unknown };
  if (!Array.isArray(parsed.suggestions)) return [];
  return parsed.suggestions
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      section: typeof s.section === 'string' ? s.section : '',
      target: typeof s.target === 'string' ? s.target : '',
      type: typeof s.type === 'string' ? s.type : 'general',
      message: typeof s.message === 'string' ? s.message : '',
    }))
    .filter((s) => s.message);
}

/** Draft a professional summary strictly from the facts already in the CV. */
export async function generateSummary(cv: CVDocument, language?: string): Promise<ImproveResult> {
  const facts = {
    personal: { fullName: cv.personal.fullName, professionalTitle: cv.personal.professionalTitle },
    education: cv.education.map((e) => `${e.degree} ${e.institution}`.trim()),
    experience: cv.experience.map((e) => ({ role: e.jobTitle, company: e.company, bullets: e.bullets.slice(0, 3) })),
    projects: cv.projects.map((p) => p.name),
    skills: cv.skills.flatMap((g) => g.skills).slice(0, 25),
  };

  const userPrompt = `Write a 2-4 sentence professional CV summary using ONLY these facts:
${JSON.stringify(facts)}

Return JSON exactly in this shape:
{"original": "", "suggestion": string, "reason": string, "missing_information": string[]}
${languageInstruction(language)}. If key facts are missing, list them in missing_information instead of inventing them. `;

  try {
    const parsed = (await chatJsonStrict(
      [
        { role: 'system', content: FACTUALITY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      config.ai.maxTokens,
      extractJson,
    )) as Partial<ImproveResult>;
    return {
      original: '',
      suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : '',
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      missing_information: Array.isArray(parsed.missing_information)
        ? parsed.missing_information.filter((m): m is string => typeof m === 'string')
        : [],
    };
  } catch (err) {
    try {
      const raw = cleanAiResponseText(
        await chatJson(
          [
            { role: 'system', content: FACTUALITY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          config.ai.maxTokens,
        ),
      );
      const cleanedSummary = raw
        .replace(/^```[a-z]*\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^(?:berikut\s+(?:adalah\s+)?ringkasan[^:\n]*:?|here\s+is\s+the\s+summary[^:\n]*:?)/i, '')
        .trim();
      if (cleanedSummary) {
        return {
          original: '',
          suggestion: cleanedSummary,
          reason: 'Ringkasan profesional dari AI',
          missing_information: [],
        };
      }
    } catch {
      // Fall through to throw original error
    }
    throw err;
  }
}
