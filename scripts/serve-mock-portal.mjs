import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
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
        const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
        const filePath = resolve(root, `.${requestPath}`);
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
