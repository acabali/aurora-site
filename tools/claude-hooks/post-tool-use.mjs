import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { appendJsonl, extractPath, getAgeMs, writeJson } from "./lib.mjs";

const execFileAsync = promisify(execFile);
const BUILD_THROTTLE_MS = 30_000;

// Trigger build validation when these files change
function shouldValidateBuild(filePath) {
  return (
    /^src\//.test(filePath) ||
    /^api\//.test(filePath) ||
    filePath === "astro.config.mjs" ||
    filePath === "tsconfig.json" ||
    filePath === "package.json"
  );
}

const input = await readHookInput();
const filePath = extractPath(input);

await appendJsonl("var/claude-post-tool.ndjson", {
  checkedAt: new Date().toISOString(),
  toolName: input?.tool_name || input?.toolName || null,
  filePath: filePath || null
});

if (!filePath) {
  process.exit(0);
}

// Validate JSON files after editing
if (filePath.endsWith(".json")) {
  await execFileAsync(process.execPath, ["-e", `JSON.parse(require("fs").readFileSync(${JSON.stringify(filePath)}, "utf8"))`], {
    cwd: process.cwd()
  }).catch((error) => {
    console.error(String(error));
  });
}

const normalizedPath = filePath.replace(/\\/g, "/");
if (shouldValidateBuild(normalizedPath)) {
  const age = await getAgeMs(".claude/state/last-post-edit-build.json");
  if (age > BUILD_THROTTLE_MS) {
    await execFileAsync("npm", ["run", "build"], {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 2 * 1024 * 1024
    }).catch((error) => {
      console.error(String(error));
    });
    await appendJsonl("var/claude-post-edit-builds.ndjson", {
      checkedAt: new Date().toISOString(),
      filePath: normalizedPath
    });
    await writeJson(".claude/state/last-post-edit-build.json", {
      checkedAt: new Date().toISOString(),
      filePath: normalizedPath
    });
  }
}
