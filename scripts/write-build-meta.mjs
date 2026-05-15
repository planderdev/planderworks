import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const builtAt = new Date().toISOString();

let commit = 'local';

try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  commit = 'local';
}

const version = `${commit}-${builtAt}`;

mkdirSync('public', { recursive: true });
writeFileSync(
  'public/build-meta.json',
  `${JSON.stringify({ version, commit, builtAt }, null, 2)}\n`,
);
