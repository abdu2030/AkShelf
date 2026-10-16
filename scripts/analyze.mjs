import { spawn } from "node:child_process";

process.env.ANALYZE = "true";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const child = spawn(npmCmd, ["run", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ANALYZE: "true",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
