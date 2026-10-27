import 'dotenv/config';

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: num(process.env.PORT, 4000),
  host: process.env.HOST ?? '127.0.0.1',

  // Comma-separated allowlist, e.g. http://localhost:5173,https://app.example.com
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // Application upload limits (MB) — independent from third-party provider limits.
  maxFileMb: {
    doc: num(process.env.MAX_FILE_MB_DOC, 10),
    image: num(process.env.MAX_FILE_MB_IMAGE, 10),
  },

  ocr: {
    apiKey: process.env.OCR_SPACE_API_KEY ?? '',
    endpoint: process.env.OCR_SPACE_ENDPOINT ?? 'https://api.ocr.space/parse/image',
    defaultEngine: num(process.env.OCR_SPACE_DEFAULT_ENGINE, 2),
    fallbackEngine: num(process.env.OCR_SPACE_FALLBACK_ENGINE, 3),
    language: process.env.OCR_SPACE_LANGUAGE ?? 'auto',
    timeoutMs: num(process.env.OCR_TIMEOUT_MS, 60_000),
    // Provider limits are configurable; never hardcode business assumptions.
    maxFileMb: num(process.env.OCR_MAX_FILE_MB, 5),
    maxPdfPages: num(process.env.OCR_MAX_PDF_PAGES, 3),
  },

  ai: {
    baseUrl: process.env.AI_BASE_URL ?? '',
    apiKey: process.env.AI_API_KEY ?? '',
    model: process.env.AI_MODEL ?? '',
    backupBaseUrl: process.env.AI_BACKUP_BASE_URL ?? '',
    backupApiKey: process.env.AI_BACKUP_API_KEY ?? '',
    backupModel: process.env.AI_BACKUP_MODEL ?? '',
    timeoutMs: num(process.env.AI_TIMEOUT_MS, 45_000),
    maxTokens: num(process.env.AI_MAX_TOKENS, 2400),
  },

  // Below this character count a PDF is considered to have no usable text layer.
  pdfMinTextChars: num(process.env.PDF_MIN_TEXT_CHARS, 200),

  // Free translation API (MyMemory). No key required; an email raises the quota.
  translate: {
    endpoint: process.env.TRANSLATE_ENDPOINT ?? 'https://api.mymemory.translated.net/get',
    // Unofficial Google mirror used as automatic fallback when MyMemory fails
    googleEndpoint: process.env.TRANSLATE_GOOGLE_ENDPOINT ?? 'https://clients5.google.com/translate_a/t',
    // Optional DeepL API Free key (500k chars/month) as a final fallback
    deeplApiKey: process.env.DEEPL_API_KEY ?? '',
    email: process.env.TRANSLATE_EMAIL ?? '',
    timeoutMs: num(process.env.TRANSLATE_TIMEOUT_MS, 20_000),
  },
} as const;
