// src/lib/utils.ts
export * from "./nav-tree";
export * from "./remark";

export function slugify(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1-$2") // Convert camelCase to kebab-case
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getSlugFromPath(path: string): string {
  return path.replace(/\.md$/, "").split("/").map(slugify).join("/");
}

export function parseContentTags(content: string): string[] {
  // Match hashtags that:
  // 1. Start with #
  // 2. Followed by word characters, hyphens, underscores
  // 3. Can include forward slashes for hierarchical tags
  // 4. Not inside code blocks or URLs
  const tagRegex = /(?<!`[^`]*?)#([a-zA-Z][\w-]*(?:\/[a-zA-Z][\w-]*)*)/g;
  const matches = content.match(tagRegex) || [];
  return [...new Set(matches.map((tag) => tag.slice(1)))];
}
