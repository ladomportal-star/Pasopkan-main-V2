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
                  <rect x="4" y="3" width="5" height="18" rx="2.5" />
                  <path d="M8 3h7a7 7 0 0 1 0 14H8v-4h7a3 3 0 0 0 0-6H8V3z" fillOpacity="0.4" />
                  <circle cx="18" cy="18" r="2.5" fill="currentColor" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Replace the SVG Graphic
    content = content.replace(/<g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    // Also catch any left-over variants
    content = content.replace(/<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    
    // Adjust Typography to 2024 Dribbble aesthetic (bold + thin paired lowercase)
    content = content.replace(/className="[^"]*text-2xl font-medium tracking-tight text-white[^"]*">Pasop<\/span>/g, 'className="font-sans text-2xl font-bold tracking-tight text-white">pasop</span>');
    content = content.replace(/className="[^"]*text-2xl font-medium tracking-tight text-white[^"]*">kan<\/span>/g, 'className="font-sans text-2xl font-light tracking-tight text-zinc-400">kan</span>');

    // For smaller headers/footer if it's text-xl or text-lg
    content = content.replace(/>Pasop<\/span>/g, '>pasop</span>');
    content = content.replace(/>kan<\/span>/g, '>kan</span>');
    
    content = content.replace(/font-medium tracking-tight text-white drop-shadow-sm/g, 'font-light tracking-tight text-zinc-400 drop-shadow-sm'); // for 'kan'
    
    // Ensure 'pasop' is bold
    content = content.replace(/font-medium tracking-tight text-white">pasop/g, 'font-bold tracking-tight text-white">pasop');

    // Update icon colors to a deep modern tech gradient/shift (Indigo -> Sky)
    content = content.replace(/text-rose-500 group-hover:text-rose-400/g, 'text-indigo-500 group-hover:text-sky-400');
    content = content.replace(/text-rose-500 transition-colors/g, 'text-indigo-500 transition-colors');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Dribbble 2024 logo in', file);
    }
  });
});
