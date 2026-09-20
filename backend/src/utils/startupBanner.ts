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

interface Status {
  ok: boolean;
  detail: string;
}

const status = (s: Status, okText: string) =>
  s.ok ? paint(`${okText} ${s.detail}`.trim(), color.green) : paint(`--  ${s.detail}`, color.red);

export function printStartupBanner(info: {
  url: string;
  mode: string;
  readyMs: number;
  database: Status;
  auth: Status;
}) {
  const lines = [
    "",
    `  ${paint("Pasopkan API", color.bold, color.cyan)}  ${paint(`ready in ${info.readyMs}ms`, color.dim)}`,
    "",
    `  ${paint("Local", color.dim)}     ${info.url}`,
    `  ${paint("Mode", color.dim)}      ${info.mode}`,
    `  ${paint("Database", color.dim)}  ${status(info.database, "Connected successfully")}`,
    `  ${paint("Auth", color.dim)}      ${status(info.auth, "Supabase")}`,
    "",
  ];

  process.stdout.write(lines.join("\n") + "\n");
}
