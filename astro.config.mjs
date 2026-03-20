import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  redirects: {
    "/es": "/",
    "/en/demo": "/demo",
    "/es/demo": "/demo",
  },
});
