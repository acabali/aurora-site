import { appendJsonl, readHookInput } from "./lib.mjs";

const input = await readHookInput();
await appendJsonl("var/claude-config-changes.ndjson", {
  changedAt: new Date().toISOString(),
  payload: input
});
