const fs = require('fs');

const filePaths = [
  'src/components/Footer.tsx',
  'src/components/Navbar.tsx',
  'src/pages/Register.tsx',
  'src/pages/CreateEvent.tsx',
  'src/pages/AdminDashboard.tsx',
  'src/pages/Login.tsx'
];

filePaths.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Extract the className of the SVG before replacing
  const regex = /<svg viewBox="0 0 40 40" fill="none" className="([^"]+)" xmlns="http:\/\/www.w3.org\/2000\/svg">\s*\{\/\* Modernist Prism Mark \*\/\}\s*<path d="M20 4L34 12V28L20 36L6 28V12L20 4Z"[^>]*>\s*<path [^>]*>\s*<path [^>]*>\s*<path [^>]*>\s*<circle [^>]*>\s*<\/svg>/g;

  let newContent = content.replace(regex, (match, className) => {
    return `<Logo className="${className}" />`;
  });
  
  if (content !== newContent) {
    // We need to add the import statement if it doesn't exist
    if (!newContent.includes('import Logo from')) {
      // Find the right place to add the import (after other imports)
      let depth = file.split('/').length - 1;
      let importPath = depth === 1 ? './Logo' : depth === 2 ? '../components/Logo' : '../../components/Logo';
      if (file.includes('Navbar.tsx') || file.includes('Footer.tsx')) {
        importPath = './Logo';
      } else {
        importPath = '../components/Logo';
      }
      
      const lines = newContent.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, `import Logo from '${importPath}';`);
        newContent = lines.join('\n');
      }
    }
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`No match found in ${file}`);
  }
});
