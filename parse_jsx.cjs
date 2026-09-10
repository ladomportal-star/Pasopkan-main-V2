const fs = require('fs');

const code = fs.readFileSync('Frontend/src/pages/Account.tsx', 'utf8');

let stack = [];
let i = 0;

let startIdx = code.indexOf("{selectedEvent && (");
i = startIdx;
let limit = code.indexOf(")}", code.indexOf("          <div className={activeTab === 'payouts' ? 'block' : 'hidden'}>") - 50);

while (i < limit) {
  if (code.substr(i, 2) === "/*") {
    i = code.indexOf("*/", i) + 2;
    continue;
  }
  if (code.substr(i, 2) === "//") {
    i = code.indexOf("\n", i) + 1;
    continue;
  }
  // Simplified matching for tags
  if (code[i] === '<' && code[i+1] && code[i+1].match(/[a-zA-Z\/]/)) {
    let tagMatch = code.substring(i).match(/^<\/?([a-zA-Z0-9\.]+)[^>]*(\/?)>/);
    if (tagMatch) {
      let fullTag = tagMatch[0];
      let tagName = tagMatch[1];
      let isClosing = fullTag.startsWith("</");
      let isSelfClosing = fullTag.endsWith("/>") || ["img", "input", "br", "hr"].includes(tagName.toLowerCase());
      
      if (!isSelfClosing) {
        if (isClosing) {
          if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
            stack.pop();
          } else {
            console.log("Mismatch closing", tagName, "expected", stack[stack.length - 1]?.tag, "around line", code.substring(0, i).split('\n').length);
          }
        } else {
          stack.push({tag: tagName, line: code.substring(0, i).split('\n').length});
        }
      }
      i += fullTag.length;
      continue;
    }
  }
  i++;
}

console.log("Open tags at 1905:");
for (let s of stack) {
  console.log(s.tag, "at line", s.line);
}
