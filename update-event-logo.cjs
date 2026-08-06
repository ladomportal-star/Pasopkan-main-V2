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
                  <path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9Z" />
                  <path d="M10 7v10" strokeDasharray="4 4" opacity="0.5" />
                  <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" opacity="0.8" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG using a generic group tag matcher
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to modern ticketing
    content = content.replace(/font-sans text-2xl font-bold tracking-tight text-white capitalize/g, 'font-sans text-2xl font-extrabold tracking-tight text-white uppercase');
    content = content.replace(/font-sans text-2xl font-bold tracking-tight text-emerald-400 capitalize/g, 'font-sans text-2xl font-extrabold tracking-tight text-emerald-400 uppercase');
    
    // Catch-alls for other usages that don't have text-2xl
    content = content.replace(/font-sans font-bold tracking-tight text-white capitalize/g, 'font-sans font-extrabold tracking-tight text-white uppercase');
    content = content.replace(/font-sans font-bold tracking-tight text-emerald-400 capitalize/g, 'font-sans font-extrabold tracking-tight text-emerald-400 uppercase');

    // 3. Update Text Casing to UPPERCASE
    content = content.replace(/>Pasop<\/span>/gi, '>PASOP</span>');
    content = content.replace(/>Kan<\/span>/gi, '>KAN</span>');

    // also for lowercase variant if we came from organic
    content = content.replace(/>pasop<\/span>/gi, '>PASOP</span>');
    content = content.replace(/>kan<\/span>/gi, '>KAN</span>');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Event aesthetic in', file);
    }
  });
});
