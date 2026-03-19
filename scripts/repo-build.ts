import {
  runRepoSmoke,
  runSiteBuild,
  validateAuroraBackend,
  validateAuroraEnv,
} from "./lib/repo-runtime.ts";

async function main(): Promise<void> {
  validateAuroraEnv();
  await validateAuroraBackend();
  await runRepoSmoke();
  await runSiteBuild();
  console.log("[repo] build pipeline OK");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
