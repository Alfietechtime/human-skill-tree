#!/usr/bin/env node

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

process.chdir(root);

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === "build") {
  execSync("npm run build", { stdio: "inherit", cwd: root });
} else if (cmd === "start") {
  execSync("npm run start", { stdio: "inherit", cwd: root });
} else {
  // Default: dev mode with auto-open
  execSync("npm run dev", { stdio: "inherit", cwd: root });
}
