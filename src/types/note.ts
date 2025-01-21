import { z } from "astro:content";

export const NoteSchema = z.object({
  title: z.string(),
  slug: z.string(),
  repo: z.string(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().default(true),
});

export const TagStatsSchema = z.object({
  vaultTags: z.record(z.array(z.string())),
  tags: z.record(
    z.object({
      count: z.number(),
      notes: z.array(z.string()),
    }),
  ),
});
