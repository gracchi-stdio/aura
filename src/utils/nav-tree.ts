import type { NavItem, NavTree } from "@/types/nav";
import type { CollectionEntry } from "astro:content";
import { merge } from "ts-deepmerge";

export function buildNavTree(
  collection: CollectionEntry<"obsidianNotes">[],
): NavTree {
  let tree: NavTree = {};

  tree = collection.reduce((acc, entry) => {
    const { data } = entry;

    const segments = data.slug.split("/");
    // the folders starting with '_' are hidden
    if (segments.some((part) => part.startsWith("_"))) return acc;
    if (!entry.data?.nav) return acc;

    segments.pop();

    let nested: NavItem = {
      slug: data.slug,
      label: data?.shortTitle || data.title,
    };

    while (segments.length > 0) {
      nested = { label: segments.pop() || "", children: [nested] };
    }

    return merge(acc, { [entry.data.repo]: { [nested.label]: nested } });
  }, tree);

  return tree;
}

export function getRelativeTree(
  mainTree: NavTree,
  currentPath: string,
): NavTree {
  let relNav: NavTree = mainTree;

  const currSegs = currentPath.split("/");
  currSegs.pop();

  currSegs.forEach((seg, idx) => {
    if (Array.isArray(mainTree[seg])) return;
    relNav = relNav[seg];
  });

  return relNav;
}
