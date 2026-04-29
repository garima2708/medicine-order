import { spawn } from "node:child_process";

const children = [];
let shuttingDown = false;

function startProcess(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  children.push({ name, child });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.error(
      `[runtime] ${name} exited (code=${code ?? "null"}, signal=${signal ?? "null"}). Shutting down all processes.`,
    );

    for (const entry of children) {
      if (entry.child.pid && !entry.child.killed) {
        entry.child.kill("SIGTERM");
      }
    }

    const exitCode = typeof code === "number" ? code : 1;
    setTimeout(() => process.exit(exitCode), 200);
  });
}

startProcess("web", "node", ["server.js"], {
  HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0",
  PORT: process.env.PORT ?? "3000",
});

startProcess("mcp", "./node_modules/.bin/tsx", ["src/mcp/server.ts"], {
  NODE_ENV: "production",
  MCP_HOST: process.env.MCP_HOST ?? "0.0.0.0",
  MCP_PORT: process.env.MCP_PORT ?? "3333",
});
