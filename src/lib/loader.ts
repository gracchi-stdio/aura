import type { DataStore, Loader, LoaderContext } from "astro/loaders";
import { NoteSchema, TagStatsSchema, type VaultConfig } from "@/types";
import { getFileContent, getVaultStructure } from "./github";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import wikiLinkPlugin from "remark-wiki-link";
import { tagManager } from "./tags";
import {
  parseContentTags,
  remarkGrid,
  remarkObsidianEmbed,
  slugify,
  getSlugFromPath,
} from "@/utils";
import { getConfig } from "./config";
import { eventManager } from "./events";
import { v4 as uuidv4 } from "uuid";
import remarkGfm from "remark-gfm";
import type { Context } from "vm";
import remarkHTMLComment from "remark-remove-comments";
const { vaults } = getConfig();

type ContentMapEntry = {
  content: string;
  path: string;
  name: string;
  slug: string;
  frontmatter: Record<string, any>;
};

function getSlug(repo: string, path: string): string {
  let slug = getSlugFromPath(path.replace(/\.md$/, ""));
  if (slug.endsWith("index")) slug = slug.replace("index", "");
  return vaults.length > 1
    ? `/${slugify(repo)}/${slug.replace(/\index$/, "")}`
    : "/" + slug;
}

async function processVault(vault: VaultConfig, context: Context) {
  const { store, parseData, generateDigest, logger } = context;
  logger.info(`Loading content from ${vault.repo}`);

  const contentMap = new Map<string, ContentMapEntry>();
  const files = await getVaultStructure(vault);
  const markdownFiles = files.filter(
    (f) => f.type === "file" && f.path.endsWith(".md"),
  );

  await Promise.all(
    markdownFiles.map(async (file) => {
      const content = await getFileContent(vault, file.path);
      const name = file.name.replace(/\.md$/, "");
      if (content) {
        const { data, content: body } = matter(content);
        contentMap.set(name, {
          content: body,
          frontmatter: data,
          path: file.path,
          slug: getSlug(vault.repo, file.path),
          name,
        });
      }
    }),
  );

  await Promise.all(
    Array.from(contentMap.entries()).map(async ([fileName, entry]) => {
      const slug = getSlug(vault.repo, entry.path);
      const tags = [
        ...new Set([
          ...(entry.frontmatter?.tags || []),
          ...parseContentTags(entry.content),
        ]),
      ];

      const uuid = uuidv4();
      const { frontmatter } = entry;
      const parsedData = await parseData({
        id: uuid,
        data: {
          ...frontmatter,
          path: entry.path,
          uuid,
          tags: tags,
          repo: vault.repo,
          createdAt: frontmatter?.createdAt || null,
          updatedAt: frontmatter?.updatedAt || null,
          draft: frontmatter?.draft,
          slug,
          shortTitle: frontmatter?.shortTitle || frontmatter?.title,
          title: frontmatter.title || entry.name || "Untitled",
        },
      });

      const digest = generateDigest(entry.content);

      const permalinks = Array.from(contentMap.keys());
      const processedContent = await unified()
        .use(remarkParse)

        .use(remarkObsidianEmbed, {
          getContent: (fileName) => contentMap.get(fileName)?.content || null,
          maxDepth: 3,
        })
        .use(remarkGfm)
        .use(remarkHTMLComment)
        .use(wikiLinkPlugin, {
          permalinks,
          aliasDivider: "|",
          hrefTemplate: (permalink: string) => contentMap.get(permalink)?.slug,
        })
        .use(remarkGrid)
        .use(remarkRehype, {
          allowDangerousHtml: true,
          handlers: {
            image(_, node) {
              const url = node.url;
              if (/\.(mp4|webm|ogg|mov)$/.test(url)) {
                return {
                  type: "element",
                  tagName: "video",
                  properties: {
                    controls: true,
                    className: ["w-full", "max-h-96"],
                    src: url,
                  },
                  children: [],
                };
              }
              return {
                type: "element",
                tagName: "img",
                properties: { src: url, alt: node.alt },
                children: [],
              };
            },
          },
        })
        .use(remarkGrid)
        .use(rehypeStringify)
        .process(entry.content);

      const html = processedContent.toString();

      store.set({
        id: uuid,
        data: parsedData,
        body: entry.content,
        digest,
        rendered: {
          html,
          metadata: {
            frontmatter: parsedData,
          },
        },
      });
    }),
  );

  logger.info(`Completed loading repo: ${vault.repo}`);
}

export function githubLoader(): Loader {
  return {
    name: "github-loader",
    load: async (context: LoaderContext): Promise<void> => {
      const { store } = context;
      store.clear();

      await Promise.all(vaults.map((vault) => processVault(vault, context)));

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
