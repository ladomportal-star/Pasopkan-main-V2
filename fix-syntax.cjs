const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');

const regex = /                          \}\`\}>\n                            theme === 'dark' \? 'text-zinc-100' : 'text-adv-slate'\n                          \}\`\}>/g;
content = content.replace(regex, '                          }`}>');

fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
