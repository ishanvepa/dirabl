import { z } from 'zod';
export const RequestSchema = z
  .object({
    entryId: z.string().uuid(),
    attemptId: z.string().uuid(),
    transcriptRevision: z.number().int().positive(),
    rawTranscript: z.string().trim().min(1).max(30000),
  })
  .strict();
// Keep generation schema simple; apply tighter limits after the model responds.
export const ModelOutputSchema = z
  .object({ title: z.string(), story: z.string(), tags: z.array(z.string()) })
  .strict();
export const OutputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    story: z.string().trim().min(1).max(40000),
    tags: z.array(z.string().trim().min(1).max(40)).min(3).max(6),
  })
  .strict();
export const ResponseSchema = OutputSchema.extend({
  entryId: z.string().uuid(),
  attemptId: z.string().uuid(),
  transcriptRevision: z.number().int().positive(),
  model: z.string().min(1).max(100),
}).strict();
export type SynthesisRequest = z.infer<typeof RequestSchema>;
export type SynthesisResponse = z.infer<typeof ResponseSchema>;
