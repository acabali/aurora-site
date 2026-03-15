import { appendJsonl, readHookInput } from "./lib.mjs";

const input = await readHookInput();
await appendJsonl("var/claude-notifications.ndjson", {
  receivedAt: new Date().toISOString(),
  payload: input
});
