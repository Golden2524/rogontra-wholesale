import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

test('storefront build creates a public API runtime configuration', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'rogontra-storefront-build-'));
  const child = spawn(process.execPath, ['backend/scripts/build-storefront.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ROGONTRA_API_BASE_URL: 'https://api.example.com/api/v1',
      ROGONTRA_STOREFRONT_OUTPUT_DIR: outputDirectory
    },
    stdio: 'pipe'
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });

  assert.equal(exitCode, 0);
  assert.equal(
    await readFile(join(outputDirectory, 'runtime-config.js'), 'utf8'),
    'window.ROGONTRA_API_BASE_URL = "https://api.example.com/api/v1";\n'
  );
  assert.match(await readFile(join(outputDirectory, 'index.html'), 'utf8'), /Rogontra Wholesale/);

  await rm(outputDirectory, { recursive: true, force: true });
});
