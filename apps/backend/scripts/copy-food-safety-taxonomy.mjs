import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = resolve(process.cwd(), 'data/ingredient-taxonomy-supplement-v1.json');
const destination = resolve(process.cwd(), 'dist/data/ingredient-taxonomy-supplement-v1.json');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log(`Copied food safety taxonomy to ${destination}`);
