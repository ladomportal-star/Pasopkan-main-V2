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

const newSvgContent = `<g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <rect x="2" y="6" width="20" height="12" rx="3" fill="currentColor" fillOpacity="0.1" />
                  <polygon points="10,9 15,12 10,15" fill="currentColor" />
                  <path d="M6 6v2M6 16v2M18 6v2M18 16v2" strokeWidth="2" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the SVG inner group
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to modern Streaming / Entertainment style
    content = content.replace(/font-sans text-2xl font-extrabold tracking-tighter text-white/g, 'font-sans text-2xl font-bold tracking-tight text-white');
    content = content.replace(/font-sans text-2xl font-extrabold tracking-tighter text-blue-500/g, 'font-sans text-2xl font-black tracking-tight text-purple-500');
    
    // Fallbacks
    content = content.replace(/font-sans font-extrabold tracking-tighter text-white/g, 'font-sans font-bold tracking-tight text-white');
    content = content.replace(/font-sans font-extrabold tracking-tighter text-blue-500/g, 'font-sans font-black tracking-tight text-purple-500');

    // 3. Update Text Casing
    content = content.replace(/>pasop<\/span>/gi, '>Pasop</span>');
    content = content.replace(/>kan<\/span>/gi, '>Kan</span>');

    // 4. Colors to Electric Purple
    content = content.replace(/text-blue-500 group-hover:text-cyan-400/g, 'text-purple-500 group-hover:text-purple-400');
    content = content.replace(/text-blue-500 transition-colors/g, 'text-purple-400 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Entertainment logo in', file);
    }
  });
});
