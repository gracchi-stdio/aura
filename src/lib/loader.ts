import type { Loader, LoaderContext } from "astro/loaders";
import type { VaultConfig } from "./types";
import { getFileContent, getVaultStructure } from "./github";
import matter from "gray-matter";
import { render, z } from "astro:content";

export interface GithubLoaderOptions {
  vault: VaultConfig;
}

interface GitHubEntry {
  id: string;
  slug: string;
  body: string;
  data: Record<string, unknown>;
}

export function githubLoader(options: GithubLoaderOptions): Loader {
  const { vault } = options;
  return {
    name: "github-loader",
    load: async ({
      store,
      parseData,
      generateDigest,
      logger,
    }: LoaderContext): Promise<void> => {
      logger.info(`Loading content from ${vault.repo}`);

      store.clear();

      const files = await getVaultStructure(vault);
      const markdownFiles = files.filter(
        (file) => file.type === "file" && file.path.endsWith(".md"),
      );

      for (const file of markdownFiles) {
        const content = await getFileContent(vault, file.path);
        if (!content) continue;

        const { data: frontmatter, content: body } = matter(content);

        const slug = file.path.replace(/\.md$/, "").replace(/\s+/g, "-");
        const parsedData = await parseData({
          id: file.path,
          data: {
            ...frontmatter,
            title: frontmatter.title || file.name.replace(/\.md$/, ""),
          },
        });

        const digest = generateDigest(content);

        store.set({
          id: file.path,
          data: parsedData,
          body,
          digest,
        });
      }
    },
    schema: async () =>
      z.object({
        title: z.string(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().default(true),
      }),
  };
}
