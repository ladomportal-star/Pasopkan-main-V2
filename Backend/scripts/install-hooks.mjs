// Cross-platform git hook wiring. Runs on `npm install` (prepare).
// The repo has no root package.json, so we point git at Backend/.husky
// from wherever git's root is. No-op outside a git checkout (e.g. CI tarball).
import { execSync } from "node:child_process";

try {
  execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  execSync("git config core.hooksPath Backend/.husky", { stdio: "ignore" });
  console.log("git hooks: core.hooksPath -> Backend/.husky");
} catch {
  // not a git repo, or git unavailable — skip silently
}
