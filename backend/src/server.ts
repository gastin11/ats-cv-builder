import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import { registerImportRoutes } from './routes/import.routes.js';
import { registerExportRoutes } from './routes/export.routes.js';
import { registerAiRoutes } from './routes/ai.routes.js';
import { registerValidationRoutes } from './routes/validation.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      // Privacy: never log request bodies or file contents. Metadata only.
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTED]',
      },
    },
    bodyLimit: Math.max(config.maxFileMb.doc, config.maxFileMb.image) * 1024 * 1024 + 1024 * 512,
    trustProxy: false,
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    maxAge: 600,
  });

  await app.register(rateLimit, {
    global: true,
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    timeWindow: '1 minute',
  });

  await app.register(multipart, {
    attachFieldsToBody: false,
    limits: {
      fileSize: Math.max(config.maxFileMb.doc, config.maxFileMb.image) * 1024 * 1024,
      files: 1,
    },
  });

  app.get('/api/health', async () => ({
    status: 'ok',
    service: 'ats-cv-builder-backend',
    time: new Date().toISOString(),
    features: {
      ocrConfigured: Boolean(config.ocr.apiKey),
      aiConfigured: Boolean(config.ai.baseUrl && config.ai.apiKey && config.ai.model),
    },
  }));

  await app.register(registerImportRoutes);
  await app.register(registerExportRoutes);
  await app.register(registerAiRoutes);
  await app.register(registerValidationRoutes);

  app.setErrorHandler((rawError, request, reply) => {
    const error = rawError as Error & { statusCode?: number };
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ success: false, error: error.message });
    }
    request.log.error({ err: error.message, url: request.url }, 'unhandled error');
    return reply.code(500).send({ success: false, error: 'Internal server error.' });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ success: false, error: 'Endpoint not found.' });
  });

  return app;
}

export async function startServer(): Promise<void> {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
