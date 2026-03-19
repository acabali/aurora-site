import { validateAuroraBackend } from "./lib/repo-runtime.ts";

validateAuroraBackend().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
