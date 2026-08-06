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

const newSvgContent = `<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" fill="none" />
                  <path d="M12 5l-5 9h10z" fill="currentColor" fillOpacity="0.2" />
                  <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
                  <path d="M4 16h16" />
                  <path d="M6 19h12" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Replace the SVG graphic inside the logo with the Adventure Badge
    content = content.replace(/<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    
    // 2. Tweak texts to feel more rugged/dynamic (making it bold and italic)
    const pasopRegex = /className="font-sans (text-[a-z0-9]+) font-semibold tracking-\[[^\]]+\] text-white uppercase"/g;
    content = content.replace(pasopRegex, 'className="font-sans $1 font-bold tracking-[0.2em] text-white uppercase"');
    
    const kanRegex = /className="font-sans (text-[a-z0-9]+) font-black tracking-[a-z]+ bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500/g;
    content = content.replace(kanRegex, 'className="font-sans $1 font-black italic tracking-widest bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500');
    
    // 3. Replace icon colors across the board (amber/rose to emerald/cyan)
    content = content.replace(/text-amber-500/g, 'text-emerald-500');
    content = content.replace(/group-hover:text-rose-500/g, 'group-hover:text-cyan-500');
    
    // 4. Just in case there are random instances of the gradient anywhere else
    content = content.replace(/from-amber-400 via-orange-500 to-rose-500/g, 'from-emerald-400 via-teal-500 to-cyan-500');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated adventure logo in', file);
    }
  });
});
