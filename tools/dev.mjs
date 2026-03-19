import { spawn } from "node:child_process";

const inheritedEnv = { ...process.env };
const isInnerVercelCommand = inheritedEnv.AURORA_SITE_VERCEL_DEV === "1";

const command = isInnerVercelCommand ? "astro" : "vercel";
const args = isInnerVercelCommand
  ? ["dev", "--port", inheritedEnv.PORT ?? "4321"]
  : ["dev", "--listen", "4321"];

const env = isInnerVercelCommand
  ? inheritedEnv
  : {
      ...inheritedEnv,
      AURORA_SITE_VERCEL_DEV: "1",
    };

const child = spawn(command, args, {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
