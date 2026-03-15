import { appendJsonl, readHookInput, writeJson } from "./lib.mjs";

const input = await readHookInput();

await appendJsonl("var/claude-instructions-loaded.ndjson", {
  loadedAt: new Date().toISOString(),
  payload: input
});

await writeJson(".claude/state/last-instructions-load.json", {
  loadedAt: new Date().toISOString()
});
