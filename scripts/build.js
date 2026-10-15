/* Deployment-only build step: assembles the static site into ./dist.
   The application itself needs no build to run (open index.html directly). */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');

const FILES = ['index.html', 'tests.html'];
const DIRS = ['css', 'js'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of FILES) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(out, file));
}

for (const dir of DIRS) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(out, dir), { recursive: true });
}

console.log('Build complete -> ' + path.relative(root, out));