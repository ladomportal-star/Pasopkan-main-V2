const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/emerald/g, 'purple');
  newContent = newContent.replace(/bg-purple-500 text-zinc-950/g, 'bg-purple-500 text-white');
  newContent = newContent.replace(/text-zinc-950 bg-purple-500/g, 'text-white bg-purple-500');
  newContent = newContent.replace(/text-zinc-950 hover:bg-purple-400/g, 'text-white hover:bg-purple-400');
  newContent = newContent.replace(/hover:bg-purple-400 text-zinc-950/g, 'hover:bg-purple-400 text-white');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
