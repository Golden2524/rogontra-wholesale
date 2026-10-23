import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const projectRoot = process.cwd();
const outputDirectory = process.env.ROGONTRA_STOREFRONT_OUTPUT_DIR ?? join(projectRoot, 'dist');
const apiBaseUrl = process.env.ROGONTRA_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('ROGONTRA_API_BASE_URL is required to build the storefront.');
}

const parsedApiUrl = new URL(apiBaseUrl);
if (parsedApiUrl.protocol !== 'https:' || !parsedApiUrl.pathname.endsWith('/api/v1')) {
  throw new Error('ROGONTRA_API_BASE_URL must be an HTTPS URL ending in /api/v1.');
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const sourceEntries = await readdir(projectRoot, { withFileTypes: true });
const staticDirectories = new Set(['data', 'images', 'scripts', 'styles']);

await Promise.all(
  sourceEntries
    .filter(
      (entry) =>
        (entry.isFile() && (entry.name.endsWith('.html') || entry.name === 'robots.txt')) ||
        (entry.isDirectory() && staticDirectories.has(entry.name))
    )
    .map((entry) =>
      cp(join(projectRoot, entry.name), join(outputDirectory, entry.name), { recursive: true })
    )
);

await writeFile(
  join(outputDirectory, 'runtime-config.js'),
  `window.ROGONTRA_API_BASE_URL = ${JSON.stringify(parsedApiUrl.href.replace(/\/$/, ''))};\n`,
  'utf8'
);

console.log(`Built static storefront for ${parsedApiUrl.origin}.`);
