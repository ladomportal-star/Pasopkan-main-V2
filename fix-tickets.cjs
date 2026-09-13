const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');

const regex = /className=\{\`group rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col sm:flex-row/g;
content = content.replace(regex, 'className={`group rounded-[2rem] border transition-all duration-300 overflow-hidden flex flex-col w-[280px] sm:w-[300px] shrink-0 mx-auto');

const imageRegex = /className="sm:w-36 md:w-44 h-28 sm:h-auto relative shrink-0 overflow-hidden"/g;
content = content.replace(imageRegex, 'className="aspect-[4/5] relative shrink-0 overflow-hidden"');

const listRegex = /className="space-y-3 sm:space-y-4"/g;
content = content.replace(listRegex, 'className="flex flex-wrap justify-center gap-4 sm:gap-6"');

fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
