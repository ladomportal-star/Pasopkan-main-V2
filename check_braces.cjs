const fs = require("fs");
const code = fs.readFileSync("Frontend/src/pages/Account.tsx", "utf8");

let startIdx = code.indexOf("{selectedEvent && (");
let limit = code.indexOf(")}", code.indexOf("          <div className=\"max-w-4xl mx-auto space-y-4 sm:space-y-8\">") - 150);

let braces = 0;
let parens = 0;
for (let i = startIdx; i <= limit + 1; i++) {
  if (code[i] === "{") braces++;
  if (code[i] === "}") braces--;
  if (code[i] === "(") parens++;
  if (code[i] === ")") parens--;
}
console.log("Braces:", braces, "Parens:", parens);
