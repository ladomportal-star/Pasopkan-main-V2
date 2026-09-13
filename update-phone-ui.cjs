const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Login.tsx', 'utf-8');

// Update placeholders
content = content.replace(/phonePlaceholder: '\+856 20 XXXXXXXX',/g, "phonePlaceholder: '20 XXXXXXXX',");

// Update input UI
const inputUIRegex = /<div className="absolute inset-y-0 left-0 pl-3\.5 flex items-center pointer-events-none">\s*<Phone className=\{`h-5 w-5 \$\{theme === 'dark' \? 'text-zinc-500' : 'text-gray-400'\}`\} \/>\s*<\/div>\s*<input\s*id="phone"/g;

const inputUIReplacement = `<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none gap-2">
                    <Phone className={\`h-4 w-4 \${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}\`} />
                    <span className={\`text-sm font-semibold \${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}\`}>+856</span>
                  </div>
                  <input
                    id="phone"`;

content = content.replace(inputUIRegex, inputUIReplacement);

// Update input padding
const paddingRegex = /className=\{`block w-full pl-11/g;
const paddingReplacement = `className={\`block w-full pl-[88px]`;
content = content.replace(paddingRegex, paddingReplacement);

fs.writeFileSync('Frontend/src/pages/Login.tsx', content);
