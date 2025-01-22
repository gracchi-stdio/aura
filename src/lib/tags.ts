import type { z } from "astro/zod";
import { NoteSchema } from "@/types";

type TagInfo = {
  count: number;
  notes: z.infer<typeof NoteSchema>[];
};

type TagStats = {
  vaultTags: Record<string, string[]>;
  tags: Record<string, TagInfo>;
};

class TagManager {
  private tagMap: Map<string, TagInfo> = new Map();
  private vaultTags: Map<string, Set<string>> = new Map();

  addNote(repo: string, note: z.infer<typeof NoteSchema>) {
    const tags = note.tags || [];
    // initalize vault tags if needed
    if (!this.vaultTags.has(repo)) {
      this.vaultTags.set(repo, new Set());
    }

    tags.forEach((tag: string) => {
      this.vaultTags.get(repo)?.add(tag);

      // Update global tag info
      const tagInfo = this.tagMap.get(tag) || { count: 0, notes: [] };
      tagInfo.count++;
      tagInfo.notes.push(note);
      this.tagMap.set(tag, tagInfo);
    });
  }

  getVaultTags(repo: string): string[] {
    return Array.from(this.vaultTags.get(repo) || []).sort();
  }

  getTagInfo(tag: string): TagInfo {
    return this.tagMap.get(tag) || { count: 0, notes: [] };
  }

  getAllTags(): string[] {
    return Array.from(this.tagMap.keys()).sort();
  }

  getTagStats(): TagStats {
    return {
      vaultTags: Object.fromEntries(
        Array.from(this.vaultTags.entries()).map(([vault, tags]) => [
          vault,
          Array.from(tags).sort(),
        ]),
      ),
      tags: Object.fromEntries(this.tagMap),
    };
  }

  clear() {
    this.tagMap.clear();
    this.vaultTags.clear();
  }
}

export const tagManager = new TagManager();
