import { config } from '../config.js';

export interface OcrResult {
  text: string;
  engine: number;
}

interface OcrSpaceResponse {
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean | string;
  ErrorMessage?: string | string[];
  ParsedResults?: Array<{ ParsedText?: string; ErrorMessage?: string }>;
  ProcessingTimeInMilliseconds?: string;
}

class OcrError extends Error {
  constructor(
    message: string,
    public readonly status: 'config' | 'limit' | 'provider' | 'empty',
  ) {
    super(message);
  }
}

function errorMessages(err: OcrSpaceResponse['ErrorMessage']): string[] {
  if (!err) return [];
  return Array.isArray(err) ? err : [err];
}

async function callOcrSpace(
  buffer: Buffer,
  filename: string,
  filetype: 'PDF' | 'PNG' | 'JPG',
  engine: number,
): Promise<OcrResult> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)]);
  form.append('file', blob, filename);
  form.append('apikey', config.ocr.apiKey);
  form.append('OCREngine', String(engine));
  form.append('language', config.ocr.language);
  form.append('isTable', 'False');
  form.append('isCreateSearchablePdf', 'False');
  form.append('detectOrientation', 'True');
  form.append('filetype', filetype);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ocr.timeoutMs);

  let response: Response;
  try {
    response = await fetch(config.ocr.endpoint, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === 'AbortError' ? 'timed out' : 'network error';
    throw new OcrError(`OCR provider request ${reason}. Please try again.`, 'provider');
  } finally {
    clearTimeout(timer);
  }

  let payload: OcrSpaceResponse;
  try {
    payload = (await response.json()) as OcrSpaceResponse;
  } catch {
    throw new OcrError(`OCR provider returned an invalid response (HTTP ${response.status}).`, 'provider');
  }

  if (payload.IsErroredOnProcessing === true || payload.IsErroredOnProcessing === 'true') {
    const msgs = errorMessages(payload.ErrorMessage);
    const joined = msgs.join('; ') || 'unknown OCR error';
    if (/api key|invalid key/i.test(joined)) {
      throw new OcrError('OCR service rejected the API key. Check OCR_SPACE_API_KEY.', 'config');
    }
    if (/exceeded|limit|quota/i.test(joined)) {
      throw new OcrError('OCR service usage limit reached. Try again later.', 'limit');
    }
    throw new OcrError(`OCR failed: ${joined}`, 'provider');
  }

  const text = (payload.ParsedResults ?? [])
    .map((r) => (r.ParsedText ?? '').replace(/\r\n/g, '\n'))
    .join('\n')
    .trim();

  if (!text) {
    throw new OcrError('OCR produced no readable text from this document.', 'empty');
  }

  return { text, engine };
}

export interface OcrInput {
  buffer: Buffer;
  filename: string;
  kind: 'pdf' | 'png' | 'jpg';
  pageCount?: number;
}

/**
 * Run OCR through OCR.Space (backend-mediated, in-memory only).
 * Uses the default engine first and the fallback engine when the default
 * fails or returns nothing.
 */
export async function runOcr(input: OcrInput): Promise<OcrResult> {
  if (!config.ocr.apiKey) {
    throw new OcrError('OCR is not configured (missing OCR_SPACE_API_KEY).', 'config');
  }

  const maxBytes = config.ocr.maxFileMb * 1024 * 1024;
  if (input.buffer.byteLength > maxBytes) {
    throw new OcrError(
      `File exceeds the OCR provider limit of ${config.ocr.maxFileMb} MB. Use a smaller or clearer scan.`,
      'limit',
    );
  }
  if (input.kind === 'pdf' && typeof input.pageCount === 'number' && input.pageCount > config.ocr.maxPdfPages) {
    throw new OcrError(
      `PDF has ${input.pageCount} pages but the OCR provider accepts at most ${config.ocr.maxPdfPages}. Try a text-based PDF or manual entry.`,
      'limit',
    );
  }

  const filetype = input.kind === 'pdf' ? 'PDF' : input.kind === 'png' ? 'PNG' : 'JPG';

  try {
    return await callOcrSpace(input.buffer, input.filename, filetype, config.ocr.defaultEngine);
  } catch (primaryErr) {
    const fallbackable =
      primaryErr instanceof OcrError && (primaryErr.status === 'empty' || primaryErr.status === 'provider');
    if (fallbackable && config.ocr.fallbackEngine !== config.ocr.defaultEngine) {
      try {
        return await callOcrSpace(input.buffer, input.filename, filetype, config.ocr.fallbackEngine);
      } catch {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}
