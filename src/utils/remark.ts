// src/plugins/remark-grid.ts
import { visit } from "unist-util-visit";
import type { Parent } from "unist";
import type { Root, RootContent, Text } from "mdast";
import type { Image } from "mdast";
import { type } from "os";
import { unified } from "unified";
import remarkParse from "node_modules/remark-parse/lib";
import remarkGfm from "remark-gfm";

export function remarkGrid() {
  return (tree: Root) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (typeof index === "undefined") return;
      const images = node.children.filter((child) => child.type === "image");

      if (images.length < 2) return; // no need for the remark-grid

      // check if images are consecutive
      const nodeContent = node.children
        .map((child) => {
          if (child.type === "text") return child.value;
          if (child.type === "image") return "[img]";
          return "[other]";
        })
        .join("");

      if (!/^\s*(?:\[img\]\s*)+$/.test(nodeContent)) return;

      const columns = Array.from(
        { length: Math.min(4, images.length) },
        (): Image[] => [],
      );
      images.forEach((img, idx) => {
        columns[idx % columns.length].push(img);
      });
      const masonryNode: Parent = {
        type: "containerDirective",
        data: {
          hName: "div",
          hProperties: {
            className: "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4",
          },
        },
        children: columns.map((columnImages) => ({
          type: "containerDirective",
          date: {
            hName: "div",
            hProperties: {
              className: "grid grid-4",
            },
          },
          children: columnImages.map((img) => ({
            type: "image",
            url: img.url,
            alt: img.alt || "",
            data: {
              hName: "div",
              hProperties: {
                className: "w-full aspect-auto rounded",
              },
            },
          })),
        })),
      };
      parent?.children.splice(index, 1, masonryNode as RootContent);
      return index + 1;
    });
  };
}

export interface RemarkEmbedOptions {
  getContent: (fileName: string) => string | null;
  maxDepth?: number;
}

async function processEmbeddedMarkdown(content: string): Promise<Root> {
  const processor = unified().use(remarkParse).use(remarkGfm);

  return processor.parse(content) as Root;
}

const processEmbed = async (
  node: Text,
  parent: Parent,
  index: number,
  options: RemarkEmbedOptions,
  depth = 0,
): Promise<void> => {
  if (depth >= (options.maxDepth || 5)) return;

  const parts = node.value.split(/(!?\[\[.*?\]\])/);
  const chunks = [];

  for (const part of parts) {
    const embedMatch = part.match(/^!\[\[(.*?)(?:\|(.*?))?\]\]$/);

    if (!embedMatch) {
      chunks.push({
        type: "text",
        value: part,
      });

      continue;
    }
    const [, fileName, displayText] = embedMatch;
    const embeddedContent = options.getContent(fileName);

    if (!embeddedContent) continue;

    if (displayText) {
      chunks.push({
        type: "html",
        value: `<!-- ${displayText.trim()} -->\n`,
      });
    }

    const promises: Promise<void>[] = [];
    const embeddedTree = await processEmbeddedMarkdown(embeddedContent);
    visit(embeddedTree, "text", (childNode, childIndex, childParent) => {
      if (childNode.value.includes("![[")) {
        promises.push(
          processEmbed(childNode, childParent, childIndex, options, depth + 1),
        );
      }
    });
    await Promise.all(promises);

    chunks.push(...embeddedTree.children);
  }
  parent.children.splice(index, 1, ...chunks);
};

export function remarkObsidianEmbed(options: RemarkEmbedOptions) {
  return async (tree: Root) => {
    const promises: Promise<void>[] = [];

    visit(tree, "text", (node, index, parent) => {
      if (node.value.includes("![[")) {
        promises.push(processEmbed(node, parent, index, options));
      }
    });

    await Promise.all(promises);
  };
}
