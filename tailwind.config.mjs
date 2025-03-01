/** @type {import('tailwindcss').Config} */

import theme from "tailwindcss/defaultTheme";

const defaultTheme = require("tailwindcss/defaultTheme");
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        gravitas: ["Gravitas One", ...defaultTheme.fontFamily.serif],
      },
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
  safelist: [
    "lg:text-7xl",
    "text-5xl",
    "sr-only",
    "text-sm",
    "text-xs",
    "text-right",
    "font-gravitas",
    "text-primary-content",
  ],
};
