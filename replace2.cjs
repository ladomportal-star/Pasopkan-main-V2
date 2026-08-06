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
  
  // We want to replace "bg-purple-500 hover:bg-purple-400" with "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400"
  let newContent = content.replace(/bg-purple-500 hover:bg-purple-400/g, 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400');
  newContent = newContent.replace(/bg-purple-500 text-white font-bold hover:bg-purple-400/g, 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400');
  newContent = newContent.replace(/bg-purple-500 text-white hover:bg-purple-400/g, 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400');
  newContent = newContent.replace(/bg-purple-500 px-4 py-2 text-sm font-bold text-white hover:bg-purple-400/g, 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-bold text-white hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
