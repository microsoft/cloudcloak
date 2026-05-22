import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const manifestPath = resolve(repoRoot, 'manifest.json');
const devManifestPath = resolve(repoRoot, 'dist', 'manifest.dev.json');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const localPatterns = [
    'http://localhost:4173/*',
    'http://127.0.0.1:4173/*'
];

manifest.host_permissions = [...manifest.host_permissions, ...localPatterns];
manifest.web_accessible_resources = manifest.web_accessible_resources.map((resource) => ({
    ...resource,
    matches: [...resource.matches, ...localPatterns]
}));

await mkdir(resolve(repoRoot, 'dist'), { recursive: true });
await writeFile(devManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await copyFile(devManifestPath, resolve(repoRoot, 'dist', 'manifest.json'));

console.log(`Created dev manifest at ${devManifestPath}`);
