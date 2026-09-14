const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

const regex = /if\s*\(activeUser\)\s*\{\s*try\s*\{\s*const\s*reviewRef\s*=\s*doc\(collection\(db,\s*'reviews'\)\);[\s\S]*?\}, 5000\);\s*\}\s*catch\s*\(error\)\s*\{\s*handleFirestoreError\(error,\s*OperationType\.CREATE,\s*'reviews'\);\s*\}\s*\}\s*else\s*\{([\s\S]*?)\}/;

content = content.replace(regex, (match, p1) => {
  return p1.trim();
});

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
