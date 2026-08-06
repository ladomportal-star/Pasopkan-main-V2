const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
            walk(file, function(err, res) {
              results = results.concat(res);
              next();
            });
          } else {
            next();
          }
        } else {
          if (file.match(/\.(tsx|ts)$/)) {
            results.push(file);
          }
          next();
        }
      });
    }
    next();
  });
};

const newSvgContent = `<g stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M4 6h16v12H4z" />
                  <path d="M10 6v12" strokeDasharray="3 3" />
                  <path d="M16 10l-4 4M12 10l4 4M14 9v6M11 12h6" strokeWidth="1.5" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG
    content = content.replace(/<g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    content = content.replace(/<g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">[\s\S]*?<\/g>/g, newSvgContent);
    // Generic fallback just in case
    content = content.replace(/<g.*?strokeLinecap="round".*?>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Neo-Brutalist (Bold, chunky, Monospace/Sans hybrid feel)
    content = content.replace(/font-serif text-2xl font-light tracking-wide text-white/g, 'font-sans text-2xl font-black tracking-tighter text-white');
    content = content.replace(/font-serif text-2xl font-medium tracking-widest text-amber-500/g, 'font-sans text-2xl font-black tracking-tight text-lime-400');
    
    // Catch cases matching other sizes
    content = content.replace(/font-serif font-light tracking-wide text-white/g, 'font-sans font-black tracking-tighter text-white');
    content = content.replace(/font-serif font-medium tracking-widest text-amber-500/g, 'font-sans font-black tracking-tight text-lime-400');

    // 3. Update Text
    content = content.replace(/>Pasop<\/span>/g, '>PASOP</span>');
    content = content.replace(/>kan\.<\/span>/g, '>KAN</span>');

    // 4. Update the coloring to Acid Lime (perfect for dark mode brutalism)
    content = content.replace(/text-amber-500 group-hover:text-amber-400/g, 'text-lime-400 group-hover:text-lime-300');
    content = content.replace(/text-amber-500 transition-colors/g, 'text-lime-400 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Neo-Brutalist logo in', file);
    }
  });
});
