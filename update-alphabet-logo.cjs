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

const newSvgContent = `<g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 4v16" />
                  <path d="M9 4h5.5a4.5 4.5 0 0 1 0 9H9" fill="currentColor" fillOpacity="0.2" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Swap the SVG Graphic
    content = content.replace(/<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    
    // 2. Adjust typography styling for "Pasop"
    content = content.replace(/font-extrabold tracking-wide text-white uppercase/g, 'font-medium tracking-tight text-white');
    // Adjust styling for "kan" (remove gradient, make it just text)
    content = content.replace(/font-black tracking-wider bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent uppercase/g, 'font-medium tracking-tight text-white');
    
    // Replace text content
    content = content.replace(/>PASOP<\/span>/g, '>Pasop</span>');
    content = content.replace(/>KAN<\/span>/g, '>kan</span>');

    // 3. Update icon colors
    content = content.replace(/text-orange-400 group-hover:text-pink-400/g, 'text-rose-500 group-hover:text-rose-400');
    content = content.replace(/text-orange-400 transition-colors/g, 'text-rose-500 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Alphabet logo in', file);
    }
  });
});
