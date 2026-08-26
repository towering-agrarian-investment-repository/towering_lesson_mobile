const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name) && !file.includes('node_modules')) files.push(file);
  }
}
walk('src');
const text = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(escaped).test(text)) console.log(name);
}
