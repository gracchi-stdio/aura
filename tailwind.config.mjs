/** @type {import('tailwindcss').Config} */

import theme from "tailwindcss/defaultTheme";

const defaultTheme = require("tailwindcss/defaultTheme");
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            ".prose .footnotes li": {
              fontSize: theme.fontSize.sm[0],
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  safelist: ["sr-only", "text-sm", "text-xs"],
};
