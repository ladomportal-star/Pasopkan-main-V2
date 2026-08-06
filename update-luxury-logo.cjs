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

const newSvgContent = `<g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="3" width="14" height="18" rx="7" />
                  <circle cx="12" cy="10" r="2" fill="currentColor" />
                  <path d="M12 14v4" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG group
    content = content.replace(/<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">[\s\S]*?<\/g>/g, newSvgContent);
    // Also try without fill="none" just to be safe
    content = content.replace(/<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    
    // 2. Adjust Typography classes for Luxury Editorial font-serif
    content = content.replace(/font-sans text-2xl font-black tracking-tighter text-white/g, 'font-serif text-2xl font-light tracking-wide text-white');
    content = content.replace(/font-sans text-2xl font-bold tracking-widest text-emerald-400/g, 'font-serif text-2xl font-medium tracking-widest text-amber-500');
    
    // Catch cases without text-2xl if they exist
    content = content.replace(/font-sans font-black tracking-tighter/g, 'font-serif font-light tracking-wide');
    content = content.replace(/font-sans font-bold tracking-widest text-emerald-400/g, 'font-serif font-medium tracking-widest text-amber-500');

    // 3. Update the actual text casing for the display
    content = content.replace(/>PASOP<\/span>/g, '>Pasop</span>');
    content = content.replace(/>KAN<\/span>/g, '>kan.</span>');

    // 4. Update the coloring to Luxury Gold/Champagne
    content = content.replace(/text-emerald-400 group-hover:text-emerald-300/g, 'text-amber-500 group-hover:text-amber-400');
    content = content.replace(/text-emerald-400 transition-colors/g, 'text-amber-500 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Luxury Editorial logo in', file);
    }
  });
});
