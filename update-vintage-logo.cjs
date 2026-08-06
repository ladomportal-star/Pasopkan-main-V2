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
                  <path d="M4 7C4 5.895 4.895 5 6 5H18C19.105 5 20 5.895 20 7V9C18.895 9 18 9.895 18 11C18 12.105 18.895 13 20 13V15C20 16.105 19.105 17 18 17H6C4.895 17 4 16.105 4 15V13C5.105 13 6 12.105 6 11C6 9.895 5.105 9 4 9V7Z" fill="currentColor" fillOpacity="0.1" />
                  <line x1="10" y1="5" x2="10" y2="17" strokeDasharray="2 3" />
                  <path d="M13 11h4M15 9v4" strokeWidth="1.5" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the SVG inner group
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Vintage Cinema / Old-School Festival (Serif, Wide)
    content = content.replace(/font-sans text-2xl font-bold tracking-tight text-white/g, 'font-serif text-2xl font-black tracking-widest text-white uppercase');
    content = content.replace(/font-sans text-2xl font-black tracking-tight text-purple-500/g, 'font-serif text-2xl font-medium tracking-wide text-rose-500 uppercase');
    
    // Fallbacks
    content = content.replace(/font-sans font-bold tracking-tight text-white/g, 'font-serif font-black tracking-widest text-white uppercase');
    content = content.replace(/font-sans font-black tracking-tight text-purple-500/g, 'font-serif font-medium tracking-wide text-rose-500 uppercase');

    // 3. Update Text Casing
    content = content.replace(/>Pasop<\/span>/gi, '>PASOP</span>');
    content = content.replace(/>Kan<\/span>/gi, '>KAN</span>');

    // 4. Colors to Vintage Rose/Crimson
    content = content.replace(/text-purple-500 group-hover:text-purple-400/g, 'text-rose-600 group-hover:text-rose-500');
    content = content.replace(/text-purple-500 transition-colors/g, 'text-rose-600 transition-colors');
    // Also catch -400 variations just in case
    content = content.replace(/text-purple-400/g, 'text-rose-500');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Vintage Festival logo in', file);
    }
  });
});
