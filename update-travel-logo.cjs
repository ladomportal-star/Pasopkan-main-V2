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
                  <circle cx="12" cy="12" r="10" opacity="0.5" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" opacity="0.8"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG using a generic group tag matcher
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Travel/Explore (Bold, clean, Capitalize)
    content = content.replace(/font-sans text-2xl font-semibold tracking-normal text-white lowercase/g, 'font-sans text-2xl font-bold tracking-tight text-white capitalize');
    content = content.replace(/font-sans text-2xl font-medium tracking-normal text-emerald-400 lowercase/g, 'font-sans text-2xl font-bold tracking-tight text-emerald-400 capitalize');
    
    // Catch-alls for other usages that don't have text-2xl
    content = content.replace(/font-sans font-semibold tracking-normal text-white lowercase/g, 'font-sans font-bold tracking-tight text-white capitalize');
    content = content.replace(/font-sans font-medium tracking-normal text-emerald-400 lowercase/g, 'font-sans font-bold tracking-tight text-emerald-400 capitalize');

    // 3. Update Text Casing to Capitalize
    content = content.replace(/>pasop<\/span>/gi, '>Pasop</span>');
    content = content.replace(/>kan<\/span>/gi, '>Kan</span>');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Travel aesthetic in', file);
    }
  });
});
