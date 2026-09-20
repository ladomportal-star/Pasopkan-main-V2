import { env } from "../config/env.ts";

const color = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const paint = (text: string, ...codes: string[]) =>
  process.stdout.isTTY ? `${codes.join("")}${text}${color.reset}` : text;

export function printStartupBanner(info: {
  url: string;
  mode: string;
  readyMs: number;
  database: { ok: boolean; detail: string };
}) {
  const dbLine = info.database.ok
    ? paint(`Connected successfully ${info.database.detail}`, color.green)
    : paint(`--  ${info.database.detail}`, color.red);

  const lines = [
    "",
    `  ${paint("Pasopkan API", color.bold, color.cyan)}  ${paint(`ready in ${info.readyMs}ms`, color.dim)}`,
    "",
  ];

  if (env.authDevBypass) {
    lines.push(
      `  ${paint("WARN", color.red)}  AUTH_DEV_BYPASS is on - ID tokens are not verified`,
      "",
    );
  }

  lines.push(
    `  ${paint("Local", color.dim)}     ${info.url}`,
    `  ${paint("Mode", color.dim)}      ${info.mode}`,
    `  ${paint("Database", color.dim)}  ${dbLine}`,
    "",
  );

  process.stdout.write(lines.join("\n") + "\n");
}
