import matter from "gray-matter";
import { getFileContent, getVaultStructure, isMarkdownFile } from "./github";
import type { NoteFrontmatter, VaultConfig } from "./types";
import { getConfig, getDefaultVaultConfig } from "./config";

const DEFAULT_CONFIG: VaultConfig = {
  owner: "Kavehrafie",
  repo: "unboundedTerritories",
  branch: "main",
};

export async function getAllNotes(
  config: VaultConfig = DEFAULT_CONFIG,
): Promise<NoteFrontmatter[]> {
  try {
    const files = await getVaultStructure(config);

    const mdFiles = files.filter(
      (file) => file.type === "file" && isMarkdownFile(file.path),
    );

    const notes: NoteFrontmatter[] = [];

    for (const file of mdFiles) {
      const content = await getFileContent(config, file.path);

      if (!content) continue;

      const {
        data: {
          title,
          publishedAt,
          createdAt,
          updatedAt,
          tags,
          ...restOfFrontmatter
        },
      } = matter(content);

      const slug = file.path.replace(/\.md$/, "").replace(/\s+/g, "-");
      const isIndex = file.path.endsWith("index.md");

      const note: NoteFrontmatter = {
        slug,
        path: file.path,
        title: title ?? file.name.replace(/\.md$/, ""),
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        createdAt: createdAt ? new Date(createdAt) : null,
        updatedAt: updatedAt ? new Date(updatedAt) : null,

        tags: tags || [],
        ...restOfFrontmatter,
        isIndex,
      };

      notes.push(note);
    }

    return notes.sort((a, b) => {
      if (a.isIndex !== b.isIndex) return a.isIndex ? -1 : 1;
      if (a.publishedAt && b.publishedAt)
        return b.publishedAt.getTime() - a.publishedAt.getTime();
      return a.title.localeCompare(b.title);
    });
  } catch (error) {
    console.error(`Error processing notes:`, error);

    return [];
  }
}
