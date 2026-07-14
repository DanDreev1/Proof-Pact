import { z } from "zod";

export const createProofSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
});

export const createProofUploadIntentSchema = createProofSchema.extend({
  videoName: z.string().trim().min(1).max(255),
  videoType: z.string().trim().startsWith("video/"),
  videoSize: z.coerce.number().int().positive().max(200 * 1024 * 1024),
});

export type CreateProofInput = z.infer<typeof createProofSchema>;
