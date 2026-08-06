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

const newSvgContent = `<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" />
                  <path d="M2 12h20" />
                  <path d="M12 2L2 12l10 10 10-10Z" />
                  <circle cx="12" cy="12" r="5" strokeDasharray="2 2" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG using a generic group tag matcher
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Elegant Boutique / High-End Fashion (Ultra Thin Serif, wide tracking)
    content = content.replace(/font-sans text-2xl font-bold tracking-tight text-white/g, 'font-serif text-2xl font-light tracking-[0.2em] text-white uppercase');
    content = content.replace(/font-sans text-2xl font-normal tracking-tight text-zinc-400/g, 'font-serif text-2xl font-light tracking-[0.2em] text-teal-400 uppercase');
    
    // Catch-alls for other usages that don't have text-2xl
    content = content.replace(/font-sans font-bold tracking-tight text-white/g, 'font-serif font-light tracking-[0.2em] text-white uppercase');
    content = content.replace(/font-sans font-normal tracking-tight text-zinc-400/g, 'font-serif font-light tracking-[0.2em] text-teal-400 uppercase');

    // 3. Update Text Casing to Uppercase
    content = content.replace(/>pasop<\/span>/gi, '>PASOP</span>');
    content = content.replace(/>kan<\/span>/gi, '>KAN</span>');

    // 4. Transform Studio Orange to a Calming, Elegant Teal/Sage hue
    content = content.replace(/text-orange-500 group-hover:text-amber-400/g, 'text-teal-400 group-hover:text-teal-300');
    content = content.replace(/text-orange-500 transition-colors/g, 'text-teal-400 transition-colors');
    // Ensure all remaining oranges are stripped out
    content = content.replace(/text-orange-500/g, 'text-teal-400'); 
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Boutique aesthetic in', file);
    }
  });
});
