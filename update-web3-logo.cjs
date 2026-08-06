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

const newSvgContent = `<g stroke="currentColor" strokeWidth="1.5" fill="none">
                  <circle cx="12" cy="12" r="10" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" fill="currentColor" fillOpacity="0.1" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" fill="currentColor" fillOpacity="0.1" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the SVG inner group
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Modern Web3 / Fintech (thicker, tighter, lowercase)
    content = content.replace(/font-sans text-2xl font-light tracking-\[0\.3em\] text-white uppercase/g, 'font-sans text-2xl font-extrabold tracking-tighter text-white');
    content = content.replace(/font-sans text-2xl font-bold tracking-\[0\.3em\] text-indigo-400 uppercase/g, 'font-sans text-2xl font-extrabold tracking-tighter text-blue-500');
    
    // Fallbacks
    content = content.replace(/font-sans font-light tracking-\[0\.3em\] text-white uppercase/g, 'font-sans font-extrabold tracking-tighter text-white');
    content = content.replace(/font-sans font-bold tracking-\[0\.3em\] text-indigo-400 uppercase/g, 'font-sans font-extrabold tracking-tighter text-blue-500');

    // 3. Update Text Casing
    content = content.replace(/>PASOP<\/span>/gi, '>pasop</span>');
    content = content.replace(/>KAN<\/span>/gi, '>kan</span>');

    // 4. Colors to Web3 "Hyper Blue"
    content = content.replace(/text-indigo-500 group-hover:text-indigo-400/g, 'text-blue-500 group-hover:text-cyan-400');
    content = content.replace(/text-indigo-500 transition-colors/g, 'text-blue-500 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Web3 Global logo in', file);
    }
  });
});
