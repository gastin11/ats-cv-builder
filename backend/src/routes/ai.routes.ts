import type { FastifyInstance } from 'fastify';
import { cvDocumentSchema } from '../../../shared/cv-schema/cv.schema.js';
import {
  AiUnavailableError,
  REWRITE_MODES,
  generateSummary,
  improveText,
  suggestCvImprovements,
  type RewriteMode,
} from '../services/ai.service.js';

export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  const handleError = (request: { log: { warn: (o: object, m: string) => void } }, reply: any, err: unknown) => {
    request.log.warn({ err: (err as Error).message }, 'ai request failed');
    const status = err instanceof AiUnavailableError ? 503 : 502;
    return reply.code(status).send({ success: false, error: (err as Error).message });
  };

  app.post('/api/ai/improve', async (request, reply) => {
    const body = (request.body ?? {}) as {
      text?: unknown;
      mode?: unknown;
      section?: unknown;
      context?: unknown;
      language?: unknown;
    };
    if (typeof body.text !== 'string' || body.text.trim().length === 0) {
      return reply.code(400).send({ success: false, error: 'Field "text" is required.' });
    }
    if (body.text.length > 4000) {
      return reply.code(400).send({ success: false, error: 'Text is too long (max 4000 characters).' });
    }
    const mode = (typeof body.mode === 'string' && (REWRITE_MODES as readonly string[]).includes(body.mode)
      ? body.mode
      : 'professional') as RewriteMode;

    try {
      const result = await improveText({
        text: body.text,
        mode,
        language: typeof body.language === 'string' && ['en', 'id'].includes(body.language) ? body.language : undefined,
        section: typeof body.section === 'string' ? body.section : undefined,
        context: typeof body.context === 'string' ? body.context.slice(0, 4000) : undefined,
      });
      return { success: true, ...result };
    } catch (err) {
      return handleError(request, reply, err);
    }
  });

  app.post('/api/ai/suggestions', async (request, reply) => {
    const parsed = cvDocumentSchema.safeParse((request.body as { cv?: unknown })?.cv);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Body must be { "cv": <CVDocument> }.' });
    }
    try {
      const suggestions = await suggestCvImprovements(parsed.data, parsed.data.settings.language);
      return { success: true, suggestions };
    } catch (err) {
      return handleError(request, reply, err);
    }
  });

  app.post('/api/ai/summary', async (request, reply) => {
    const parsed = cvDocumentSchema.safeParse((request.body as { cv?: unknown })?.cv);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Body must be { "cv": <CVDocument> }.' });
    }
    try {
      const result = await generateSummary(parsed.data, parsed.data.settings.language);
      return { success: true, ...result };
    } catch (err) {
      return handleError(request, reply, err);
    }
  });
}
