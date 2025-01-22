import type { Loader, LoaderContext } from "astro/loaders";
import { NoteSchema, TagStatsSchema } from "@/types";
import { getFileContent, getVaultStructure } from "./github";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "node_modules/remark-parse/lib";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import wikiLinkPlugin from "remark-wiki-link";
import { tagManager } from "./tags";
import { parseContentTags, slugify } from "@/utils";
import { getConfig } from "./config";
import { eventManager } from "./events";
import { v4 as uuidv4 } from "uuid";

const { vaults } = getConfig();
export function githubLoader(): Loader {
  return {
    name: "github-loader",
    load: async ({
      store,
      parseData,
      generateDigest,
      logger,
    }: LoaderContext): Promise<void> => {
      store.clear();

      for (const vault of vaults) {
        logger.info(`Loading content from ${vault.repo}`);
        const files = await getVaultStructure(vault);
        const markdownFiles = files.filter(
          (file) => file.type === "file" && file.path.endsWith(".md"),
        );

        const fileMap = new Map(
          markdownFiles.map((f) => [
            f.name.replace(/\.md$/, "").toLowerCase(),
            f.path.replace(/\.md$/, ""),
          ]),
        );

        const permalinks = markdownFiles.map((f) => f.path);

        for (const file of markdownFiles) {
          const content = await getFileContent(vault, file.path);
          if (!content) continue;

          const { data: frontmatter, content: body } = matter(content);

          // don't publish if it is draft
          if (frontmatter.draft) continue;

          let slug = file.path
            .toLocaleLowerCase()
            .replace(/\.md$/, "")
            .replace(/\s+/g, "-");
          slug = slug === "index" ? "/" : slug.replace(/\/index$/, "");

          const uuid = uuidv4();

          const allTags = [
            ...new Set([
              ...(frontmatter.tags || []),
              ...parseContentTags(content),
            ]),
          ];

          const parsedData = await parseData({
            id: uuid,
            data: {
              ...frontmatter,
              path: file.path,
              uuid,
              tags: allTags,
              repo: vault.repo,
              createdAt: frontmatter.createdAt || null,
              updatedAt: frontmatter.updatedAt || null,
              draft: frontmatter.draft,
              slug,
              shortTitle: frontmatter.shortTitle || frontmatter.title,
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
                `/${slugify(vault.repo)}/${fileMap.get(permalink)}`,
            })
            .use(remarkRehype)
            .use(rehypeStringify)
            .process(body);

          const html = processContent.toString();

          tagManager.addNote(vault.repo, parsedData);

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
        logger.info(`Completed loading repo: ${vault.repo}`);
      }

      eventManager.emit("notes-loaded");
    },
    schema: async () => NoteSchema,
  };
}

export function tagStatsLoader() {
  return {
    name: "tag-stats-loader",
    load: async ({ store, logger }: LoaderContext) => {
      logger.info(`Waiting for notes to be processed...`);
      store.clear();

      await eventManager.waitFor("notes-loaded");

      logger.info(`Notes loaded, compiling tag stats`);
      store.set({
        id: `stats`,
        data: tagManager.getTagStats(),
      });
    },
    schema: TagStatsSchema,
  };
}
