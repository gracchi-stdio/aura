import { z } from "astro:content";

const NavValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([z.string(), z.record(NavValueSchema)]),
);

export const NoteSchema = z.object({
  title: z.string(),
  slug: z.string(),
  path: z.string(),
  uuid: z.string(),
  nav: z.boolean().optional(),
  hideTitle: z.boolean().optional(),
  shortTitle: z.string().nullable().optional(),
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

export type Note = z.infer<typeof NoteSchema>;
export type NavValue = z.infer<typeof NavValueSchema>;
