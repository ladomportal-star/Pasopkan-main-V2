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

const newSvgContent = `<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fill="currentColor" fillOpacity="0.1" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                  <line x1="22" y1="8.5" x2="12" y2="12" />
                  <line x1="2" y1="8.5" x2="12" y2="12" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG group
    content = content.replace(/<g fill="currentColor" stroke="none">[\s\S]*?<\/g>/g, newSvgContent);
    
    // 2. Adjust Typography classes
    content = content.replace(/font-bold tracking-tight text-white/g, 'font-black tracking-tighter text-white');
    content = content.replace(/font-light tracking-tight text-zinc-400/g, 'font-bold tracking-widest text-emerald-400');

    // 3. Update the actual text casing for the display
    content = content.replace(/>pasop<\/span>/g, '>PASOP</span>');
    content = content.replace(/>kan<\/span>/g, '>KAN</span>');

    // 4. Update the coloring to a Neon Tech / Cyber vibe
    content = content.replace(/text-indigo-500 group-hover:text-sky-400/g, 'text-emerald-400 group-hover:text-emerald-300');
    content = content.replace(/text-indigo-500 transition-colors/g, 'text-emerald-400 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Tech-Brutalist logo in', file);
    }
  });
});
