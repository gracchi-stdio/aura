// src/plugins/remark-grid.ts
import { visit } from "unist-util-visit";
import type { Parent } from "unist";
import type { Plugin } from "unified";
import type { Node, Root, RootContent } from "mdast";
import value from "@/config.yml";
import type { Image } from "mdast";

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
