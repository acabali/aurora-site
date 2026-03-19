import { validateAuroraBackend, validateAuroraEnv } from "./lib/repo-runtime.ts";

async function main(): Promise<void> {
  validateAuroraEnv();
  await validateAuroraBackend();
  console.log("[repo] check OK");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
