const { existsSync, copyFileSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');

const envFiles = [
  { example: 'apps/server/.env.example', target: 'apps/server/.env' },
  { example: 'apps/web/.env.example', target: 'apps/web/.env.local' },
  { example: 'apps/mobile/.env.example', target: 'apps/mobile/.env' },
];

let created = 0;
let skipped = 0;

for (const { example, target } of envFiles) {
  const examplePath = join(root, example);
  const targetPath = join(root, target);

  if (!existsSync(examplePath)) {
    console.log(`  skip  ${example} (no example file)`);
    continue;
  }

  if (existsSync(targetPath)) {
    console.log(`  exists  ${target}`);
    skipped++;
  } else {
    copyFileSync(examplePath, targetPath);
    console.log(`  created  ${target}`);
    created++;
  }
}

console.log(`\nDone: ${created} created, ${skipped} already existed.`);
console.log('Edit the .env files with your actual values before running dev servers.');
