import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { cvDocumentSchema } from '../../../shared/cv-schema/cv.schema.js';
import { parseDocx } from '../services/docx-parser.service.js';
import { parsePdfText } from '../services/pdf-parser.service.js';
import { runOcr } from '../services/ocr.service.js';
import { parseTextToCv } from '../services/cv-parser.service.js';
import { sanitizeFilename, validateUploadedFile } from '../utils/files.js';
import { translateCv, type TranslateTarget } from '../services/translation.service.js';
import { refineImportedCv } from '../services/ai.service.js';

const OCR_DISCLOSURE =
  'This file will be processed by the third-party OCR service (OCR.Space) when no text layer is available. The application itself does not store your CV.';

async function maybeRefineWithAi(
  parsed: ReturnType<typeof parseTextToCv>,
  request: { log: { warn: (o: object, m: string) => void } },
): Promise<{ cv: typeof parsed.cv; aiRefined: boolean }> {
  // Light AI cleanup: only when the heuristic parse was not fully confident
  // and the AI provider is configured. Never fails the import.
  if (parsed.confidence === 'high' || !config.ai.baseUrl || !config.ai.apiKey || !config.ai.model) {
    return { cv: parsed.cv, aiRefined: false };
  }
  try {
    const refined = await refineImportedCv(parsed.cv);
    return { cv: refined.cv, aiRefined: refined.refined };
  } catch (err) {
    request.log.warn({ err: (err as Error).message }, 'ai refine failed');
    return { cv: parsed.cv, aiRefined: false };
  }
}

export async function registerImportRoutes(app: FastifyInstance): Promise<void> {
  const getUpload = async (request: any) => {
    const data = await request.file({ limits: { fileSize: config.maxFileMb.doc * 1024 * 1024 } });
    if (!data) return { error: 'Multipart file field is required (field name "file").' } as const;
    const buffer = await data.toBuffer();
    return { data, buffer } as const;
  };

  const parseResult = (blocksOrText: Parameters<typeof parseTextToCv>[0], sourceType: string) => {
    const parsed = parseTextToCv(blocksOrText);
    return {
      success: true,
      sourceType,
      // Full raw text is returned for the review UI; the backend does not log it.
      text: typeof blocksOrText === 'string' ? blocksOrText : blocksOrText.map((b) => b.text).join('\n'),
      cv: parsed.cv,
      reviews: parsed.reviews,
      confidence: parsed.confidence,
    };
  };

  app.post('/api/import/docx', async (request, reply) => {
    const uploaded = await getUpload(request);
    if ('error' in uploaded) return reply.code(400).send({ success: false, error: uploaded.error });

    const { data, buffer } = uploaded;
    const filename = sanitizeFilename(data.filename);
    const validation = await validateUploadedFile(filename, data.mimetype, buffer, config.maxFileMb.doc * 1024 * 1024);
    if (!validation.ok) return reply.code(400).send({ success: false, error: validation.reason });
    if (validation.kind !== 'docx') {
      return reply.code(400).send({ success: false, error: 'This endpoint accepts .docx files only. Use /api/import/pdf for PDFs.' });
    }

    try {
      const { blocks } = await parseDocx(buffer);
      const parsed = parseTextToCv(blocks);
      const refined = await maybeRefineWithAi(parsed, request);
      return {
        success: true,
        sourceType: 'docx',
        text: blocks.map((b) => b.text).join('\n'),
        cv: refined.cv,
        reviews: parsed.reviews,
        confidence: parsed.confidence,
        aiRefined: refined.aiRefined,
      };
    } catch (err) {
      request.log.warn({ err: (err as Error).message }, 'docx import failed');
      return reply.code(422).send({
        success: false,
        error: 'We could not read this file. It may be corrupted or password-protected.',
      });
    }
  });

  app.post('/api/import/pdf', async (request, reply) => {
    const uploaded = await getUpload(request);
    if ('error' in uploaded) return reply.code(400).send({ success: false, error: uploaded.error });

    const { data, buffer } = uploaded;
    const filename = sanitizeFilename(data.filename);
    const validation = await validateUploadedFile(filename, data.mimetype, buffer, config.maxFileMb.doc * 1024 * 1024);
    if (!validation.ok) return reply.code(400).send({ success: false, error: validation.reason });
    if (validation.kind !== 'pdf') {
      return reply.code(400).send({ success: false, error: 'This endpoint accepts .pdf files only. Use /api/import/docx for DOCX.' });
    }

    let parsedText;
    try {
      parsedText = await parsePdfText(buffer);
    } catch (err) {
      request.log.warn({ err: (err as Error).message }, 'pdf import failed');
      const message = /password/i.test((err as Error).message)
        ? 'This PDF is password-protected. Remove the password and try again.'
        : 'We could not read this PDF. It may be corrupted.';
      return reply.code(422).send({ success: false, error: message });
    }

    const sufficient =
      parsedText.charsPerPage.length > 0 &&
      parsedText.charsPerPage.reduce((a, b) => a + b, 0) >= config.pdfMinTextChars &&
      Math.max(...parsedText.charsPerPage, 0) > 40;

    if (!sufficient) {
      // Scanned PDF: no usable text layer. Client decides whether to call /api/ocr
      // with the same file; the editor's existing data is untouched.
      return reply.code(200).send({
        success: true,
        sourceType: 'pdf',
        text: parsedText.text,
        pageCount: parsedText.pageCount,
        requiresOcr: true,
        ocrDisclosure: OCR_DISCLOSURE,
      });
    }

    const parsed = parseTextToCv(parsedText.text);
    const refined = await maybeRefineWithAi(parsed, request);
    return {
      success: true,
      sourceType: 'pdf',
      text: parsedText.text,
      pageCount: parsedText.pageCount,
      cv: refined.cv,
      reviews: parsed.reviews,
      confidence: parsed.confidence,
      requiresOcr: false,
      aiRefined: refined.aiRefined,
    };
  });

  app.post('/api/ocr', async (request, reply) => {
    const uploaded = await getUpload(request);
    if ('error' in uploaded) return reply.code(400).send({ success: false, error: uploaded.error });

    const { data, buffer } = uploaded;
    const filename = sanitizeFilename(data.filename);
    const validation = await validateUploadedFile(filename, data.mimetype, buffer, config.maxFileMb.image * 1024 * 1024);
    if (!validation.ok) return reply.code(400).send({ success: false, error: validation.reason });
    if (validation.kind === 'docx') {
      return reply.code(400).send({ success: false, error: 'OCR accepts PDF and image files (.pdf, .png, .jpg) only.' });
    }

    let pageCount: number | undefined;
    if (validation.kind === 'pdf') {
      try {
        pageCount = (await parsePdfText(buffer)).pageCount;
      } catch (err) {
        if (/password/i.test((err as Error).message)) {
          return reply.code(422).send({ success: false, error: 'This PDF is password-protected. Remove the password and try again.' });
        }
        // Continue to OCR; pdfjs may still fail where OCR.Space succeeds.
      }
    }

    try {
      const result = await runOcr({ buffer, filename, kind: validation.kind!, pageCount });
      const parsed = parseTextToCv(result.text);
      const refined = await maybeRefineWithAi(parsed, request);
      return {
        success: true,
        sourceType: validation.kind,
        engine: result.engine,
        text: result.text,
        cv: refined.cv,
        reviews: parsed.reviews,
        confidence: parsed.confidence,
        requiresReview: true,
        aiRefined: refined.aiRefined,
      };
    } catch (err) {
      request.log.warn({ err: (err as Error).message }, 'ocr failed');
      return reply.code(502).send({
        success: false,
        error:
          (err as Error).message ||
          'We could not extract enough text from this document. Try a clearer file, a higher-resolution scan, or manual entry.',
      });
    }
  });

  // Translate the translatable content of an imported CV between EN and ID.
  app.post('/api/translate', async (request, reply) => {
    const body = (request.body ?? {}) as { cv?: unknown; target?: unknown };
    const parsed = cvDocumentSchema.safeParse(body.cv);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Body must be { "cv": <CVDocument>, "target": "en" | "id" }.' });
    }
    const target = body.target === 'id' || body.target === 'en' ? body.target : null;
    if (!target) {
      return reply.code(400).send({ success: false, error: 'Field "target" must be "en" or "id".' });
    }

    try {
      const cv = await translateCv(parsed.data, target as TranslateTarget);
      return { success: true, cv };
    } catch (err) {
      request.log.warn({ err: (err as Error).message }, 'translation failed');
      return reply.code(502).send({
        success: false,
        error: 'Translation is temporarily unavailable. You can still apply the original imported content.',
      });
    }
  });
}
