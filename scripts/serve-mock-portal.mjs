import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)), 'mock-portal');
const port = 4173;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
};

createServer(async (req, res) => {
    try {
        const requestUrl = new URL(req.url || '/', 'http://localhost');
        const rawPathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
        const decodedPathname = decodeURIComponent(rawPathname);
        const normalizedPath = normalize(decodedPathname).replace(/^[/\\]+/, '');
        const relativePath = normalizedPath || 'index.html';
        const filePath = resolve(root, relativePath);
        const relativeToRoot = relative(root, filePath);

        if (relativeToRoot.startsWith('..') || isAbsolute(relativeToRoot)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Forbidden');
            return;
        }

        const content = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'text/plain; charset=utf-8' });
        res.end(content);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
    }
}).listen(port, () => {
    console.log(`Mock portal available at http://localhost:${port}`);
});
