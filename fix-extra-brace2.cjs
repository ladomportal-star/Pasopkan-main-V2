const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

content = content.replace(/      \}, 5000\);\s*\}\s*\};\s*useEffect/g, "      }, 5000);\n  };\n  useEffect");

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
