import type { FastifyInstance } from 'fastify';
import { cvDocumentSchema } from '../../../shared/cv-schema/cv.schema.js';
import { generateDocx } from '../services/docx-generator.service.js';
import { generatePdf } from '../services/pdf-generator.service.js';

const TEMPLATE_IDS = ['classic', 'compact', 'academic', 'professional'];

export async function registerExportRoutes(app: FastifyInstance): Promise<void> {
  const parseBody = (body: unknown): { ok: true; cv: ReturnType<typeof cvDocumentSchema.parse>; template: string } | { ok: false; error: string } => {
    if (typeof body !== 'object' || body === null || typeof (body as { cv?: unknown }).cv !== 'object') {
      return { ok: false, error: 'Body must be JSON: { "cv": <CVDocument>, "template": "classic|compact|academic|professional" }.' };
    }
    const { cv, template } = body as { cv: unknown; template?: unknown };
    const parsedCv = cvDocumentSchema.safeParse(cv);
    if (!parsedCv.success) {
      return { ok: false, error: `Invalid CV document: ${parsedCv.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 5).join('; ')}` };
    }
    // An explicitly-provided template outside the allowlist is a client error,
    // not something to silently remap: fail closed instead of falling back.
    if (typeof template !== 'undefined' && (typeof template !== 'string' || !TEMPLATE_IDS.includes(template))) {
      return { ok: false, error: 'Invalid template. Supported: classic|compact|academic|professional.' };
    }
    const templateId = typeof template === 'string' ? template : parsedCv.data.settings.template;
    parsedCv.data.settings.template = templateId as typeof parsedCv.data.settings.template;
    return { ok: true, cv: parsedCv.data, template: templateId };
  };

  app.post('/api/export/docx', async (request, reply) => {
    const body = parseBody(request.body);
    if (!body.ok) return reply.code(400).send({ success: false, error: body.error });

    try {
      const buffer = await generateDocx(body.cv);
      return reply
        .header('content-type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        .header('content-disposition', 'attachment; filename="cv.docx"')
        .send(buffer);
    } catch (err) {
      request.log.warn({ err: (err as Error).message }, 'docx export failed');
      return reply.code(500).send({ success: false, error: 'The CV could not be exported to DOCX. Your current edits are still available in this session.' });
    }
  });

  app.post('/api/export/pdf', async (request, reply) => {
    const body = parseBody(request.body);
    if (!body.ok) return reply.code(400).send({ success: false, error: body.error });

    try {
      const buffer = await generatePdf(body.cv);
      return reply
        .header('content-type', 'application/pdf')
        .header('content-disposition', 'attachment; filename="cv.pdf"')
        .send(buffer);
    } catch (err) {
      request.log.warn({ err: (err as Error).message }, 'pdf export failed');
      return reply.code(500).send({ success: false, error: (err as Error).message });
    }
  });
}
