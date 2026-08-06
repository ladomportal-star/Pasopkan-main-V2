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
                  <rect x="3" y="6" width="18" height="12" rx="3" fill="currentColor" fillOpacity="0.2" />
                  <path d="M9 11h.01M15 11h.01" strokeWidth="3" />
                  <path d="M10.5 14.5c.5 1 2.5 1 3 0" />
                  <path d="M12 2v2M19 5l-1.5 1.5M5 5l1.5 1.5" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. Swap out the SVG Graphic for the "Happy Ticket / Sparkle" icon
    content = content.replace(/<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    
    // 2. Adjust typography styling for a bouncier, more joyful feel
    content = content.replace(/font-bold tracking-tight text-white/g, 'font-extrabold tracking-wide text-white');
    content = content.replace(/font-black tracking-tight bg-gradient-to-r from-violet-500 to-fuchsia-500/g, 'font-black tracking-wider bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500');
    
    // 3. Update icon and hover colors across the app
    content = content.replace(/text-violet-500 group-hover:text-fuchsia-500/g, 'text-orange-400 group-hover:text-pink-400');
    content = content.replace(/text-violet-500 transition-colors/g, 'text-orange-400 transition-colors');
    
    // 4. Catch any leftover gradient references
    content = content.replace(/from-violet-500 to-fuchsia-500/g, 'from-yellow-400 via-orange-500 to-pink-500');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Enjoy logo in', file);
    }
  });
});
