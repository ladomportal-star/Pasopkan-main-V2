import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath, URL } from 'node:url';
import pg from 'pg';

// Own temporary cluster only. Never reads DATABASE_URL or touches an existing server.
const root = fileURLToPath(new URL('../', import.meta.url));
const bin = process.env.POSTGRES_BIN || (process.platform === 'win32' ? 'C:/Program Files/PostgreSQL/18/bin' : '');
const command = name => bin ? path.join(bin, name + (process.platform === 'win32' ? '.exe' : '')) : name;
const dir = mkdtempSync(path.join(os.tmpdir(), 'pasopkan-prisma-'));
const socket = net.createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
let started = false;
try {
  execFileSync(command('initdb'), ['-D', dir, '-U', 'prisma_test', '-A', 'trust', '--encoding=UTF8', '--no-locale'], { stdio: 'pipe', windowsHide: true });
  execFileSync(command('pg_ctl'), ['-D', dir, '-l', path.join(dir, 'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { stdio: 'ignore', windowsHide: true, timeout: 30000 });
  started = true;
  const url = `postgresql://prisma_test@127.0.0.1:${port}/postgres`;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    for (const folder of readdirSync(path.join(root, 'prisma/migrations')).sort()) {
      if (folder.endsWith('.toml')) continue;
      await client.query(readFileSync(path.join(root, 'prisma/migrations', folder, 'migration.sql'), 'utf8'));
    }
  } finally { await client.end(); }
  const child = spawn(process.execPath, [path.join(root, 'node_modules/tsx/dist/cli.mjs'), '--test', 'tests/prisma/schema.test.ts'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
    env: { ...process.env, NODE_ENV: 'test', PRISMA_TEST_DATABASE_URL: url },
  });
  process.exitCode = await new Promise(resolve => child.on('exit', code => resolve(code ?? 1)));
  if (process.exitCode === 0) {
    const suite = spawn(process.execPath, [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run'], {
      cwd: root, stdio: 'inherit', windowsHide: true,
      env: { ...process.env, NODE_ENV: 'test', PRISMA_TEST_DATABASE_URL: url },
    });
    process.exitCode = await new Promise(resolve => suite.on('exit', code => resolve(code ?? 1)));
  }
} finally {
  if (started) execFileSync(command('pg_ctl'), ['-D', dir, '-m', 'fast', '-w', 'stop'], { stdio: 'pipe', windowsHide: true });
  console.log(`Temporary test cluster directory: ${dir}; started: ${started}.`);
}
