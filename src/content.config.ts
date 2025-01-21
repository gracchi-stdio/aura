import { githubLoader, tagStatsLoader } from "@/lib/loader";
import { defineCollection } from "astro:content";

export const collections = {
  obsidianNotes: defineCollection({
    loader: githubLoader(),
  }),

  tagStats: defineCollection({
    loader: tagStatsLoader(),
  }),
};
