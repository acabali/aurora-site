import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  redirects: {
    "/en/demo": "/demo",
    "/es/demo": "/demo",
  },
});
