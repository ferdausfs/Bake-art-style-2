const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes('<<<<<<< HEAD')) continue;
      
      const lines = content.split('\n');
      let out = [];
      let i = 0;
      while (i < lines.length) {
        if (lines[i].trim().startsWith('<<<<<<< HEAD')) {
          i++;
          while (i < lines.length && !lines[i].trim().startsWith('=======')) i++;
          if (i < lines.length) i++;
          while (i < lines.length && !lines[i].trim().startsWith('>>>>>>>')) {
            out.push(lines[i]);
            i++;
          }
          if (i < lines.length) i++;
        } else {
          out.push(lines[i]);
          i++;
        }
      }
      fs.writeFileSync(full, out.join('\n'));
      console.log('Fixed:', full);
    }
  }
}

walk('./src');
console.log('Done!');
