import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'prisma/migrations/20261006000000_initial');
if (existsSync(path.join(target, 'migration.sql'))) throw new Error('Initial migration already exists; do not overwrite migration history.');
const sql = execFileSync(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), 'migrate', 'diff', '--from-empty', '--to-schema', 'prisma/schema.prisma', '--script'], { cwd: root, encoding: 'utf8' });
mkdirSync(target, { recursive: true });
writeFileSync(path.join(target, 'migration.sql'), sql);
