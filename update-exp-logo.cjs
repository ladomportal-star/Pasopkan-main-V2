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

const newSvgContent = `<g stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" fill="currentColor" opacity="0.2"/>
                  <path d="M5 3v4M3 5h4" opacity="0.8"/>
                  <path d="M19 17v4M17 19h4" opacity="0.8"/>
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG using a generic group tag matcher
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to modern experience
    content = content.replace(/font-sans text-2xl font-extrabold tracking-tight text-white uppercase/g, 'font-sans text-2xl font-bold tracking-tight text-white capitalize');
    content = content.replace(/font-sans text-2xl font-extrabold tracking-tight text-emerald-400 uppercase/g, 'font-sans text-2xl font-bold tracking-tight text-emerald-400 capitalize');
    
    // Catch-alls for other usages that don't have text-2xl
    content = content.replace(/font-sans font-extrabold tracking-tight text-white uppercase/g, 'font-sans font-bold tracking-tight text-white capitalize');
    content = content.replace(/font-sans font-extrabold tracking-tight text-emerald-400 uppercase/g, 'font-sans font-bold tracking-tight text-emerald-400 capitalize');

    // 3. Update Text Casing to Capitalize
    content = content.replace(/>PASOP<\/span>/gi, '>Pasop</span>');
    content = content.replace(/>KAN<\/span>/gi, '>Kan</span>');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Experience aesthetic in', file);
    }
  });
});
