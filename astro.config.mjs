// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import pagefind from "astro-pagefind";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: [/\/pagefind\/pagefind\.js/],
      },
    },
  },

  integrations: [react(), pagefind()],
});
