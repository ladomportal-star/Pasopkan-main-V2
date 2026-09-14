const fs = require('fs');
const content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');
let depth = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') depth--;
  }
  if (depth === 0 && line.includes('}')) {
     console.log(`Depth became 0 at line ${i + 1}: ${line}`);
  }
}
