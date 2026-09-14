const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

const regex = /      \}, 5000\);\n    \}\n  \};\n  useEffect/g;
content = content.replace(regex, "      }, 5000);\n  };\n  useEffect");

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
