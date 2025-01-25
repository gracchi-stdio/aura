// src/plugins/remark-grid.ts
import { visit } from "unist-util-visit";
import type { Parent } from "unist";
import type { Root, RootContent } from "mdast";
import type { Image } from "mdast";
import { type } from "os";
import { unified } from "unified";
import remarkParse from "node_modules/remark-parse/lib";

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
            className: "grid grid-cols-2 md:grid-cols-4 gap-4",
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
  resolveContent: (path: string) => Promise<string | null>;
}

export function remarkObsidianEmbed(options: RemarkEmbedOptions) {
  const embedRegex = /!\[\[(.*?)(?:\|(.*?))?\]\]/g;

  return async (tree: Root) => {
    const promises: Promise<void>[] = [];

    visit(tree, "text", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;

      const matches = Array.from(node.value.matchAll(embedRegex));
      if (matches.length === 0) return;

      let lastIndex = 0;
      const newNodes: RootContent[] = [];

      for (const match of matches) {
        const [fullMatch, path] = match;
        console.log("match", fullMatch, path);
        const start = match.index;

        if (start > lastIndex) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIndex, start),
          });
        }

        const promise = (async () => {
          const content = await options.resolveContent(path);
          if (!content) {
            newNodes.push({
              type: "text",
              value: `Failed to embed: ${path}`,
            });
            return;
          }

          const embeddedTree = unified().use(remarkParse).parse(content);

          newNodes.push(...embeddedTree?.children);
        })();

        promises.push(promise);
        lastIndex = start + fullMatch.length;
      }

      if (lastIndex < node.value.length) {
        newNodes.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      console.log("new ", newNodes);
      parent.children.splice(index, 1, ...newNodes);
    });

    await Promise.all(promises);
  };
}
