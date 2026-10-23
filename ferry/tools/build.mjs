// `npm run build`: copy the film into dist/ (no bundling needed; it is plain browser JS).
import { cp, rm, mkdir } from 'node:fs/promises';

const out = 'dist';
await rm(out, { recursive: true, force: true });
await mkdir(out);
for (const p of ['index.html', 'css', 'js', 'audio']) await cp(p, `${out}/${p}`, { recursive: true });
console.log('built dist/ — upload its contents to any static host');
