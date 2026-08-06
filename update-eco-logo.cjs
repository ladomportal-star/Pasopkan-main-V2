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
                  <path d="M7 2h3c4.97 0 9 4.03 9 9s-4.03 9-9 9H7c-1.66 0-3-1.34-3-3V5c0-1.66 1.34-3 3-3z" opacity="0.3" />
                  <path d="M10 5H7v14h3c3.87 0 7-3.13 7-7s-3.13-7-7-7z" />
                  <circle cx="11" cy="12" r="2" fill="#000" opacity="0.5" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG using a generic group tag matcher
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Organic/Approachable B2C (Friendly, rounded, soft weights)
    content = content.replace(/font-sans text-2xl font-black italic tracking-tighter text-white uppercase/g, 'font-sans text-2xl font-semibold tracking-normal text-white lowercase');
    content = content.replace(/font-sans text-2xl font-black italic tracking-tighter text-yellow-500 uppercase/g, 'font-sans text-2xl font-medium tracking-normal text-emerald-400 lowercase');
    
    // Catch-alls for other usages that don't have text-2xl
    content = content.replace(/font-sans font-black italic tracking-tighter text-white uppercase/g, 'font-sans font-semibold tracking-normal text-white lowercase');
    content = content.replace(/font-sans font-black italic tracking-tighter text-yellow-500 uppercase/g, 'font-sans font-medium tracking-normal text-emerald-400 lowercase');

    // 3. Update Text Casing to Friendly Lowercase
    content = content.replace(/>PASOP<\/span>/gi, '>pasop</span>');
    content = content.replace(/>KAN<\/span>/gi, '>kan</span>');

    // 4. Transform Cyberpunk colors to Lush Organic Greens
    content = content.replace(/text-yellow-500 group-hover:text-yellow-400 drop-shadow-\[.*?\]/g, 'text-emerald-400 group-hover:text-emerald-300 drop-shadow-sm');
    content = content.replace(/text-yellow-500 group-hover:text-yellow-400/g, 'text-emerald-400 group-hover:text-emerald-300');
    content = content.replace(/text-yellow-500 transition-colors/g, 'text-emerald-400 transition-colors');
    content = content.replace(/text-yellow-500/g, 'text-emerald-400'); 
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Organic Wellness aesthetic in', file);
    }
  });
});
