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
                  <path d="M4 2h10l6 8-6 12H8l4-8H6L4 2z" />
                  <path d="M12 4l3 4-3 6h-2l2-4h-2l-2-6h4z" fill="#000" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Cyberpunk/Esports (Aggressive, Heavy, Slanted)
    content = content.replace(/font-serif text-2xl font-light tracking-\[0\.2em\] text-white uppercase/g, 'font-sans text-2xl font-black italic tracking-tighter text-white uppercase');
    content = content.replace(/font-serif text-2xl font-light tracking-\[0\.2em\] text-teal-400 uppercase/g, 'font-sans text-2xl font-black italic tracking-tighter text-yellow-500 uppercase');
    
    // Catch-alls for other usages that don't have text-2xl
    content = content.replace(/font-serif font-light tracking-\[0\.2em\] text-white uppercase/g, 'font-sans font-black italic tracking-tighter text-white uppercase');
    content = content.replace(/font-serif font-light tracking-\[0\.2em\] text-teal-400 uppercase/g, 'font-sans font-black italic tracking-tighter text-yellow-500 uppercase');

    // 3. Update Text Casing
    // Keeping it PASOPKAN, but making sure they stay capitalized
    content = content.replace(/>PASOP<\/span>/gi, '>PASOP</span>');
    content = content.replace(/>KAN<\/span>/gi, '>KAN</span>');

    // 4. Transform Teal to Cyberpunk Yellow
    content = content.replace(/text-teal-400 group-hover:text-teal-300/g, 'text-yellow-500 group-hover:text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]');
    content = content.replace(/text-teal-400 transition-colors/g, 'text-yellow-500 transition-colors');
    content = content.replace(/text-teal-400/g, 'text-yellow-500'); 
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Cyberpunk Esports aesthetic in', file);
    }
  });
});
