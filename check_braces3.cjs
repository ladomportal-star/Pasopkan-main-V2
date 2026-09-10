const fs = require("fs");
const lines = fs.readFileSync("Frontend/src/pages/Account.tsx", "utf8").split("\n");

let braces = 0;
let parens = 0;
for (let i = 1372; i <= 1904; i++) {
  const line = lines[i];
  for (let c of line) {
    if (c === "{") braces++;
    if (c === "}") braces--;
    if (c === "(") parens++;
    if (c === ")") parens--;
  }
  if (braces === 0 && parens === 0) {
    console.log("Closed at line", i+1);
  }
}
