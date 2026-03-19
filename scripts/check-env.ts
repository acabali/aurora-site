import { validateAuroraEnv } from "./lib/repo-runtime.ts";

try {
  validateAuroraEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
