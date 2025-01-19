import { getConfig } from "@/lib/config";
import { githubLoader } from "@/lib/loader";
import { defineCollection } from "astro:content";

const { vaults } = getConfig();
export const collections = vaults.reduce(
  (acc, vault) => ({
    ...acc,
    [vault.repo]: defineCollection({
      loader: githubLoader({ vault }),
    }),
  }),
  {},
);
