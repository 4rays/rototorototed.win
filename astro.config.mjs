// @ts-check
import {defineConfig, fontProviders} from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://rototorototed.win",
  output: "static",
  integrations: [mdx(), sitemap()],

  markdown: {
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha"
      },
      wrap: true
    }
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      // Lets the dev server answer on a tunnel hostname without hardcoding
      // one.
      allowedHosts:
        process.env.ASTRO_DEV_ALLOWED_HOSTS?.split(",")
          .map((host) => host.trim())
          .filter(Boolean) ?? []
    }
  },

  // Self-hosted webfont, read from @fontsource-variable/inter at build time
  // and emitted into dist/. The local provider keeps the build free of
  // network calls to font CDNs. BaseLayout.astro renders
  // <Font cssVariable="--font-inter" /> to emit the @font-face rules;
  // --font-sans points at the variable in styles.css. Japanese text stays on
  // the platform gothic stack since Inter has no CJK coverage.
  fonts: [
    {
      name: "Inter",
      cssVariable: "--font-inter",
      provider: fontProviders.local(),
      options: {
        variants: [
          {
            src: [
              "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"
            ]
          }
        ]
      }
    }
  ]
});
