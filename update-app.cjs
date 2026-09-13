const fs = require('fs');
let content = fs.readFileSync('Frontend/src/App.tsx', 'utf-8');

if (!content.includes('import Terms')) {
  content = content.replace("import About from './pages/About';", "import About from './pages/About';\nimport Terms from './pages/Terms';\nimport Privacy from './pages/Privacy';");
}

if (!content.includes('path="terms"')) {
  content = content.replace('<Route path="about" element={<About />} />', '<Route path="about" element={<About />} />\n          <Route path="terms" element={<Terms />} />\n          <Route path="privacy" element={<Privacy />} />');
}

fs.writeFileSync('Frontend/src/App.tsx', content);
