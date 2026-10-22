import express from 'express';
import { RequestSchema } from '../../shared/synthesis.js';
import { normalizeOutput, SynthesisError } from './services/openaiSynthesis.js';
export type Synthesizer = (
  transcript: string,
) => Promise<{ title: string; story: string; tags: string[]; model: string }>;
export function createApp(synthesize: Synthesizer, now = () => Date.now()) {
  const app = express();
  app.disable('x-powered-by');
  // Local-only MVP. No proxy trust; never expose this server publicly.
  app.use(express.json({ limit: '128kb' }));
  let windowStart = now(),
    requests = 0;
  const clients = new Map<string, { start: number; count: number }>();
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.post('/api/journal/synthesize', async (req, res) => {
    const input = RequestSchema.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message:
            'Supply a nonempty transcript of at most 30,000 characters and valid entry metadata.',
        },
      });
      return;
    }
    const time = now();
    if (time - windowStart >= 86400000) {
      windowStart = time;
      requests = 0;
      clients.clear();
    }
    const ip = req.ip || 'local';
    const client = clients.get(ip) ?? { start: time, count: 0 };
    if (time - client.start >= 60000) {
      client.start = time;
      client.count = 0;
    }
    if (requests >= 100 || client.count >= 6) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Local usage limit reached. Please try again later.',
        },
      });
      return;
    }
    client.count++;
    requests++;
    clients.set(ip, client);
    try {
      const result = await synthesize(input.data.rawTranscript);
      const output = normalizeOutput({
        title: result.title,
        story: result.story,
        tags: result.tags,
      });
      res.json({
        entryId: input.data.entryId,
        attemptId: input.data.attemptId,
        transcriptRevision: input.data.transcriptRevision,
        model: result.model,
        ...output,
      });
    } catch (error) {
      const safe =
        error instanceof SynthesisError
          ? error
          : new SynthesisError(
              'SYNTHESIS_UNAVAILABLE',
              502,
              'Synthesis is unavailable right now. Please try again.',
            );
      res.status(safe.status).json({ error: { code: safe.code, message: safe.message } });
    }
  });
  app.use(
    (
      _error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Invalid or oversized JSON request.' },
      });
    },
  );
  return app;
}
