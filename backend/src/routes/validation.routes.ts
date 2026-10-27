import type { FastifyInstance } from 'fastify';
import { cvDocumentSchema } from '../../../shared/cv-schema/cv.schema.js';
import { validateCv } from '../services/cv-validator.service.js';

export async function registerValidationRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/validate', async (request, reply) => {
    const parsed = cvDocumentSchema.safeParse((request.body as { cv?: unknown })?.cv);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: `Invalid CV document: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 5).join('; ')}`,
      });
    }
    return { success: true, ...validateCv(parsed.data) };
  });
}
