import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundlePath = path.join(__dirname, 'server.bundle.js');

const isTsx = process.execArgv.some((arg) => arg.includes('tsx')) || process.env.__TSX_SPAWNED === '1';

if (isTsx) {
  await import('./server/serverApp.ts');
} else if (fs.existsSync(bundlePath)) {
  await import('./server.bundle.js');
} else {
  const child = spawn(process.execPath, ['--import', 'tsx', __filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, __TSX_SPAWNED: '1' }
  });
  child.on('exit', (code) => process.exit(code ?? 0));
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}
