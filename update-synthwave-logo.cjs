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

const newSvgContent = `<g stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16" stroke="url(#synthwaveGrad)" />
                  <path d="M8 7v10" stroke="url(#synthwaveGrad)" />
                  <path d="M16 7v10" stroke="url(#synthwaveGrad)" />
                  <path d="M4 10v4" stroke="url(#synthwaveGrad)" />
                  <path d="M20 10v4" stroke="url(#synthwaveGrad)" />
                  <defs>
                    <linearGradient id="synthwaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG
    content = content.replace(/<g.*?stroke.*?>(?:.|\n)*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Retro Synthwave Lineup (Italic, dynamic)
    content = content.replace(/font-sans text-2xl font-black tracking-tighter text-white/g, 'font-sans text-2xl font-bold italic tracking-wide text-white');
    content = content.replace(/font-sans text-2xl font-black tracking-tight text-lime-400/g, 'font-sans text-2xl font-bold italic tracking-widest bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent');
    
    content = content.replace(/font-sans font-black tracking-tighter text-white/g, 'font-sans font-bold italic tracking-wide text-white');
    content = content.replace(/font-sans font-black tracking-tight text-lime-400/g, 'font-sans font-bold italic tracking-widest bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent');

    // 4. Update the coloring to Cyan / Fuchsia elements
    content = content.replace(/text-lime-400 group-hover:text-lime-300/g, 'text-cyan-400 group-hover:text-fuchsia-400');
    content = content.replace(/text-lime-400 transition-colors/g, 'text-cyan-400 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Synthwave logo in', file);
    }
  });
});
