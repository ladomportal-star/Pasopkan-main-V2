const fs = require('fs');
const file = 'Frontend/src/pages/Account.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `                                   {/* Right: Actions */}
                                   <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200/60 dark:border-zinc-850 shrink-0">`;

const newStr = `                                   {/* Right: Actions */}
                                   <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200/60 dark:border-zinc-850 shrink-0 w-full sm:w-auto">
                                     <div className={\`grid \${answerCount > 0 ? 'grid-cols-2' : 'grid-cols-1'} sm:flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto\`}>`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  content = content.replace(/w-\[138px\]/g, 'w-full sm:w-[138px]');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated Account.tsx header');
} else {
  console.log('oldStr not found');
}
