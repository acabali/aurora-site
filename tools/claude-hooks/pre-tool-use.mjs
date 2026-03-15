import path from "node:path";

import { extractPath, readHookInput, reply, resolveProjectPath } from "./lib.mjs";

// Files that require explicit user approval before modification
const protectedPaths = new Set([
  ".env.local",
  ".env.vercel",
  ".env.example",
  ".claude/settings.json",
  "vercel.json",
  "package.json",
  "pnpm-lock.yaml"
]);

// Paths outside this repo that must never be touched
const forbiddenAbsolutePrefixes = [
  "/Users/adriano.main/Aurora"
];

function normalizeRelative(filePath) {
  const absolute = path.resolve(filePath);
  const projectRoot = resolveProjectPath();
  return path.relative(projectRoot, absolute);
}

function isProtectedPath(filePath) {
  const relative = normalizeRelative(filePath);
  return protectedPaths.has(relative) || relative.startsWith(".env.") || relative.startsWith("supabase/migrations/");
}

function isForbiddenPath(filePath) {
  const absolute = path.resolve(filePath);
  return forbiddenAbsolutePrefixes.some((prefix) => absolute.startsWith(prefix));
}

function isDangerousCommand(command) {
  return /(git\s+reset\s+--hard|git\s+checkout\s+--|rm\s+-rf|rm\s+-f|dropdb|truncate\s+-s\s+0)/.test(command);
}

function isCommitLikeCommand(command) {
  return /(git\s+commit|git\s+push|gh\s+pr\s+(create|merge)|npm\s+publish|pnpm\s+publish|vercel\s+--prod)/.test(command);
}

const input = await readHookInput();
const toolName = input?.tool_name || input?.toolName || "";

if (toolName === "Bash") {
  const command = input?.tool_input?.command || "";

  if (isDangerousCommand(command)) {
    reply({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Blocked dangerous shell command in Aurora Site protected workflow."
      }
    });
    process.exit(0);
  }

  if (isCommitLikeCommand(command)) {
    reply({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: "Commit-like or deploy action detected. Run npm run build and verify before proceeding."
      }
    });
    process.exit(0);
  }

  process.exit(0);
}

if (toolName === "Edit" || toolName === "Write" || toolName === "MultiEdit") {
  const filePath = extractPath(input);

  if (filePath && isForbiddenPath(filePath)) {
    reply({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Blocked: attempting to write outside aurora-site to protected path: ${filePath}`
      }
    });
    process.exit(0);
  }

  if (filePath && isProtectedPath(filePath)) {
    reply({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `Protected Aurora Site file requires explicit approval: ${normalizeRelative(filePath)}`
      }
    });
  }
}
