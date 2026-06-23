const fs = require('fs');
const path = require('path');

function resolveConflicts(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('<<<<<<< HEAD')) return false;
  
  let result = '';
  let lines = content.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    let line = lines[i];
    if (line.trim().startsWith('<<<<<<< HEAD')) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('=======')) i++;
      if (i < lines.length) i++;
      let newBlock = [];
      while (i < lines.length && !lines[i].trim().startsWith('>>>>>>>')) {
        newBlock.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      result += newBlock.join('\n') + '\n';
    } else {
      result += line + '\n';
      i++;
    }
  }
  
  fs.writeFileSync(filePath, result);
  console.log('Fixed:', filePath);
  return true;
}

function walk(dir) {
  let fixed = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixed += walk(full);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      if (resolveConflicts(full)) fixed++;
    }
  }
  return fixed;
}

const total = walk('./src');
console.log('Total files fixed:', total);
