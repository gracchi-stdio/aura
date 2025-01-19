// @ts-check
import { defineConfig, envField } from "astro/config";

import tailwind from "@astrojs/tailwind";
import yaml from "@rollup/plugin-yaml";
// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({ context: "server", access: "secret" }),
    },
  },
  vite: {
    plugins: [yaml()],
  },
});
