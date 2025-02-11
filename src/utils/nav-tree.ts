import type { NavItem, NavTree } from "@/types/nav";
import type { CollectionEntry } from "astro:content";
import { merge } from "ts-deepmerge";
import { slugify } from ".";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
const { vaults } = getConfig();
const singleVaultMode = vaults.length === 1;

export function buildNavTree(
  collection: CollectionEntry<"obsidianNotes">[],
): NavTree {
  let tree: NavTree = {};

  tree = collection.reduce((acc, entry) => {
    const { data } = entry;

    const segments = data.path.split("/");
    // the folders starting with '_' are hidden
    if (segments.some((part) => part.startsWith("_"))) return acc;
    if (!entry.data?.nav) return acc;

    const last = segments.pop() || "";

    let nested: NavTree = {
      [last]: {
        label: entry.data.title,
        slug: entry.data.slug,
      },
    };
    while (segments.length > 0) {
      const segment = segments.pop() || "";

      nested = {
        [segment.toLowerCase()]: { label: segment, children: nested },
      };
    }

    return merge(acc, {
      [slugify(entry.data.repo)]: { label: entry.data.repo, children: nested },
    });
  }, tree);

  return tree;
}

export function getRelativeTree(
  mainTree: NavTree,
  currentPath: string,
): NavTree {
  let relNav: NavTree = mainTree;
  let currSegs = currentPath.split("/");
  if (singleVaultMode) currSegs = [slugify(vaults[0].repo), ...currSegs];
  currSegs.pop();

  if (Object.keys(mainTree).length === 0) {
    logger.debug("getRelativeTree - Main tree is empty, returning empty nav.");
    return {}; // Return empty nav if mainTree is empty
  }

  for (const seg of currSegs) {
    if (relNav && relNav[seg]) {
      // Check if relNav is still valid and segment exists in children
      relNav = relNav[seg]?.children; // Move to the next level only if segment is found
      logger.debug("relNavTree:", relNav, seg);
    } else {
      return relNav || {}; // If segment not found, return the current level or empty object if relNav became null
    }
  }

  return relNav;
}
