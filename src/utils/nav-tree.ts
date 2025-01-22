import type { NavItem, NavTree } from "@/types/nav";
import type { CollectionEntry } from "astro:content";
import { merge } from "ts-deepmerge";
import { slugify } from ".";

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
        slug: `/${slugify(entry.data.repo)}/${entry.data.slug}`,
      },
    };
    while (segments.length > 0) {
      const segment = segments.pop() || "";

      nested = { [segment]: { label: segment, children: nested } };
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

  const currSegs = currentPath.split("/");
  currSegs.pop();

  currSegs.forEach((seg, idx) => {
    if (!relNav[seg]?.children) return;
    if (idx + 1 === currSegs.length) return;
    relNav = relNav[seg].children;
  });

  return relNav;
}
