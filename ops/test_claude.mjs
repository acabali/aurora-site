import { auroraClaude } from "../src/lib/aurora/claude.ts";

async function main() {

  const r = await auroraClaude(
    "Respond ONLY with: CLAUDE_CONNECTED"
  );

  console.log(JSON.stringify(r, null, 2));

}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
