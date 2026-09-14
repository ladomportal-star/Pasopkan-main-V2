const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');
content = content.replace('if (isLoading) {', 'if (isLoading || loading) {');
fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
