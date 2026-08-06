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

const newSvgContent = `<g fill="currentColor" stroke="none">
                  <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" />
                  <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG using a lazy matcher for the group tag
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to a Premium "Curated Concierge" look (Ultra Wide, Mixed Weights)
    content = content.replace(/font-sans text-2xl font-bold italic tracking-wide text-white/g, 'font-sans text-2xl font-light tracking-[0.3em] text-white uppercase');
    content = content.replace(/font-sans text-2xl font-bold italic tracking-widest bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent/g, 'font-sans text-2xl font-bold tracking-[0.3em] text-indigo-400 uppercase');
    
    // Catch cases not using text-2xl
    content = content.replace(/font-sans font-bold italic tracking-wide text-white/g, 'font-sans font-light tracking-[0.3em] text-white uppercase');
    content = content.replace(/font-sans font-bold italic tracking-widest bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent/g, 'font-sans font-bold tracking-[0.3em] text-indigo-400 uppercase');

    // 3. Ensure text casing is correct (all caps for this look)
    content = content.replace(/>Pasop<\/span>/gi, '>PASOP</span>');
    content = content.replace(/>kan\.?<\/span>/gi, '>KAN</span>');

    // 4. Update the coloring to Deep Indigo/Violet (Premium vibe)
    content = content.replace(/text-cyan-400 group-hover:text-fuchsia-400/g, 'text-indigo-500 group-hover:text-indigo-400');
    content = content.replace(/text-cyan-400 transition-colors/g, 'text-indigo-500 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Premium Concierge logo in', file);
    }
  });
});
