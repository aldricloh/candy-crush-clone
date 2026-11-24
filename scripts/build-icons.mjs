// Regenerates the PNG app icons in public/icons from assets/icon.svg.
// Usage: npm i -D sharp && node scripts/build-icons.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const src = await readFile(new URL('../assets/icon.svg', import.meta.url), 'utf8');
const out = new URL('../public/icons/', import.meta.url);
await mkdir(out, { recursive: true });

// "any" purpose icons get rounded corners baked in; maskable/apple icons stay full-bleed.
const rounded = src
  .replace('<defs>', '<defs><clipPath id="rr"><rect width="512" height="512" rx="114"/></clipPath>')
  .replace(/<\/defs>([\s\S]*)<\/svg>/, '</defs><g clip-path="url(#rr)">$1</g></svg>');

const render = (svg, size, name) =>
  sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 512) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(new URL(name, out).pathname);

await Promise.all([
  render(rounded, 192, 'icon-192.png'),
  render(rounded, 512, 'icon-512.png'),
  render(src, 192, 'maskable-192.png'),
  render(src, 512, 'maskable-512.png'),
  render(src, 180, 'apple-touch-icon.png'),
  render(rounded, 32, 'favicon-32.png'),
]);
await writeFile(new URL('../public/favicon.svg', import.meta.url), rounded);
console.log('icons written to public/icons');
