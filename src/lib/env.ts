import { z } from "astro/zod";
import { GITHUB_TOKEN } from "astro:env/server";

const envSchema = z.object({
  GITHUB_TOKEN: z.coerce.string(),
  APP_UNAVAILABLE: z.coerce
    .boolean()
    .default(false)
    .describe("Set the site in maintenance mode if `true`"),
});

export const env = envSchema.parse(import.meta.env);
