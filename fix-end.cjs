const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

const lastBraceIndex = content.lastIndexOf('}');
if (lastBraceIndex !== -1) {
  content = content.substring(0, lastBraceIndex) + content.substring(lastBraceIndex + 1);
  fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
}
