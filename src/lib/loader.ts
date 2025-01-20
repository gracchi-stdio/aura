import type { Loader, LoaderContext } from "astro/loaders";
import type { VaultConfig } from "./types";
import { getFileContent, getVaultStructure } from "./github";
import matter from "gray-matter";
import { z } from "astro:content";
import { unified } from "unified";
import remarkParse from "node_modules/remark-parse/lib";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import wikiLinkPlugin from "remark-wiki-link";

export interface GithubLoaderOptions {
  vault: VaultConfig;
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

      const fileMap = new Map(
        files
          .filter((f) => f.type === "file" && f.path.endsWith(".md"))
          .map((f) => [
            f.name.replace(".md", "").toLowerCase(),
            f.path.replace(".md", ""),
          ]),
      );

      const permalinks = markdownFiles.map((f) => f.path);

      for (const file of markdownFiles) {
        const content = await getFileContent(vault, file.path);
        if (!content) continue;

        const { data: frontmatter, content: body } = matter(content);

        const isIndex = file.name.split("/").pop() === "index.md";
        const slug = file.path.replace(/\.md$/, "").replace(/\s+/g, "-");

        const parsedData = await parseData({
          id: file.name.split("/").pop() || file.name,
          data: {
            ...frontmatter,
            tags: frontmatter.tags || [],
            isIndex,
            createdAt: frontmatter.createdAt || null,
            updatedAt: frontmatter.updatedAt || null,
            slug,
            title: frontmatter.title || file.name.replace(/\.md$/, ""),
          },
        });

        const digest = generateDigest(content);

        const processContent = await unified()
          .use(remarkParse, { gfm: true })
          .use(wikiLinkPlugin, {
            permalinks,
            aliasDivider: "|",
            hrefTemplate: (permalink: string) =>
              `/${vault.repo}/${fileMap.get(permalink)}`,
          })
          .use(remarkRehype)
          .use(rehypeStringify)
          .process(body);

        const html = processContent.toString();

        store.set({
          id: file.path,
          data: parsedData,
          body,
          digest,
          rendered: {
            html,
            metadata: {
              frontmatter: parsedData,
            },
          },
        });
      }
    },
    schema: async () =>
      z.object({
        title: z.string(),
        isIndex: z.boolean(),
        slug: z.string(),
        createdAt: z.date().nullable().optional(),
        updatedAt: z.date().nullable().optional(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().default(true),
      }),
  };
}
