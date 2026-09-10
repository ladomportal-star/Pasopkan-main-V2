const fs = require('fs');

const code = fs.readFileSync('Frontend/src/pages/Account.tsx', 'utf8');

// We just need to parse the file using babel to see where the error is.
try {
  require('@babel/core').transformSync(code, {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'Account.tsx',
    ast: false,
    code: false
  });
  console.log("Babel parse successful");
} catch (e) {
  console.log("Babel error:", e.message);
}
