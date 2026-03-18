import { spawn, exec } from "child_process";
import { platform } from "os";
import { createServer } from "net";

/**
 * Find an available port, starting from the preferred one.
 * Skips ports blocked by Hyper-V or other processes.
 */
function findAvailablePort(preferred = 3000) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      if (port > preferred + 100) {
        // Give up and use a known safe port
        resolve(4321);
        return;
      }
      const server = createServer();
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(port));
      });
      server.on("error", () => tryPort(port + 1));
    };
    tryPort(preferred);
  });
}

const port = await findAvailablePort(3000);
console.log(`Starting dev server on port ${port}...`);

// Start next dev with available port, bind to 127.0.0.1 to avoid EACCES
const next = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "--port", String(port)], {
  stdio: "inherit",
  shell: true,
});

// Open browser after 2 seconds
setTimeout(() => {
  const url = `http://localhost:${port}`;
  const cmd =
    platform() === "win32" ? `start ${url}` :
    platform() === "darwin" ? `open ${url}` :
    `xdg-open ${url}`;
  exec(cmd);
}, 2000);

next.on("close", (code) => process.exit(code));
