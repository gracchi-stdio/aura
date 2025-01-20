// src/lib/utils.ts
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
