#!/usr/bin/env node
/**
 * Frees the dev server's port before `tsx watch` binds to it, so a leftover
 * process from a previous run (crashed reload, an old terminal left open,
 * running `npm run dev` twice) never blocks startup with EADDRINUSE.
 * Runs automatically as the `predev` script — no manual `taskkill`/`kill`
 * needed anymore.
 */
import { execSync } from "node:child_process";

const port = process.env.PORT || 3000;

function killOnWindows(port) {
  const out = execSync(`netstat -ano -p tcp`, { encoding: "utf8" });
  const pids = new Set();
  for (const line of out.split("\n")) {
    // "  TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   12345"
    const match = line.match(/^\s*TCP\s+\S*:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i);
    if (match && Number(match[1]) === Number(port)) pids.add(match[2]);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
      console.log(`[free-port] stopped leftover process on port ${port} (pid ${pid})`);
    } catch {
      // already gone — fine
    }
  }
}

function killOnUnix(port) {
  let pids = "";
  try {
    pids = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
  } catch {
    return; // nothing listening, or lsof unavailable — either way, nothing to do
  }
  for (const pid of pids.split("\n").filter(Boolean)) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      console.log(`[free-port] stopped leftover process on port ${port} (pid ${pid})`);
    } catch {
      // already gone — fine
    }
  }
}

try {
  if (process.platform === "win32") killOnWindows(port);
  else killOnUnix(port);
} catch (err) {
  // Never block dev startup over a best-effort cleanup step.
  console.warn(`[free-port] skipped: ${err.message}`);
}
