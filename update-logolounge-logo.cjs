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

const newSvgContent = `<g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 21V5a2 2 0 0 1 2-2h4.5a5.5 5.5 0 0 1 0 11H7" />
                  <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the inner SVG using a generic group tag matcher
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, newSvgContent);

    // 2. Adjust Typography to Modern LogoLounge (lowercase, bold sans + regular sans)
    content = content.replace(/font-serif text-2xl font-black tracking-widest text-white uppercase/g, 'font-sans text-2xl font-bold tracking-tight text-white');
    content = content.replace(/font-serif text-2xl font-medium tracking-wide text-rose-500 uppercase/g, 'font-sans text-2xl font-normal tracking-tight text-zinc-400');
    
    // Catch-alls for other usages that don't have text-2xl
    content = content.replace(/font-serif font-black tracking-widest text-white uppercase/g, 'font-sans font-bold tracking-tight text-white');
    content = content.replace(/font-serif font-medium tracking-wide text-rose-500 uppercase/g, 'font-sans font-normal tracking-tight text-zinc-400');

    // 3. Update Text Casing to minimalist lowercase
    content = content.replace(/>PASOP<\/span>/gi, '>pasop</span>');
    content = content.replace(/>KAN<\/span>/gi, '>kan</span>');

    // 4. Transform Vintage Rose to Bold Studio Orange (Signature design agency spot color)
    content = content.replace(/text-rose-600 group-hover:text-rose-500/g, 'text-orange-500 group-hover:text-amber-400');
    content = content.replace(/text-rose-600 transition-colors/g, 'text-orange-500 transition-colors');
    content = content.replace(/text-rose-500/g, 'text-orange-500'); // Clean up any remaining
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to LogoLounge aesthetic in', file);
    }
  });
});
