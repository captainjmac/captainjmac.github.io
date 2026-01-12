import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const mode = process.argv[2] || 'dev';

const templatePath = join(rootDir, 'index.template.html');
const outputPath = join(rootDir, 'index.html');

const template = readFileSync(templatePath, 'utf-8');

let html;
if (mode === 'dev') {
  html = template
    .replace('{{VITE_ICON}}', '/vite.svg')
    .replace('{{VITE_HEAD}}', '')
    .replace('{{VITE_ENTRY}}', '<script type="module" src="/src/main.tsx"></script>');
} else {
  // Production mode - note: actual values will be injected by Vite during build
  html = template
    .replace('{{VITE_ICON}}', '/isotube/vite.svg')
    .replace('{{VITE_HEAD}}', '')
    .replace('{{VITE_ENTRY}}', '<script type="module" src="/isotube/src/main.tsx"></script>');
}

writeFileSync(outputPath, html);
console.log(`Generated ${mode} index.html`);
