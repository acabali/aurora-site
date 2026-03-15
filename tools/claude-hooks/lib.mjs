import { appendFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

export function resolveProjectPath(...parts) {
  return path.resolve(projectDir, ...parts);
}

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

export async function appendJsonl(relativePath, value) {
  const filePath = resolveProjectPath(relativePath);
  await ensureDir(path.dirname(filePath));
  await appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

export async function writeJson(relativePath, value) {
  const filePath = resolveProjectPath(relativePath);
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readJson(relativePath) {
  try {
    const filePath = resolveProjectPath(relativePath);
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function getAgeMs(relativePath) {
  try {
    const filePath = resolveProjectPath(relativePath);
    const info = await stat(filePath);
    return Date.now() - info.mtimeMs;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function reply(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

export function extractPath(input) {
  return (
    input?.tool_input?.file_path ||
    input?.tool_input?.path ||
    input?.tool_input?.target_file ||
    input?.tool_input?.filename ||
    null
  );
}
