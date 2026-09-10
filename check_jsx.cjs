const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('Frontend/src/pages/Account.tsx', 'utf8');

try {
  babel.transformSync(code, {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'Account.tsx',
    ast: false,
    code: false
  });
  console.log("Babel parse successful");
} catch (e) {
  console.log("Babel error:", e.message);
}
