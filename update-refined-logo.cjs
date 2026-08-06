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
                  <path d="M15 3h-6a6 6 0 0 0 -6 6v11l4-2 4 2 4-2 4 2v-11a6 6 0 0 0 -6-6z" fill="currentColor" fillOpacity="0.15" />
                  <path d="M9 8h4a2 2 0 0 1 0 4h-4v4" strokeWidth="2.5" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // 1. New SVG Graphic (Ticket outline with a sharp 'P' inside)
    content = content.replace(/<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">[\s\S]*?<\/g>/g, newSvgContent);
    
    // 2. Adjust "PASOP" typography (Tight clean bold text)
    const pasopRegex = /className="font-sans (text-[a-z0-9]+) font-bold tracking-\[0\.2em\] text-white uppercase"/g;
    content = content.replace(pasopRegex, 'className="font-sans $1 font-bold tracking-tight text-white uppercase"');
    
    // 3. Adjust "KAN" typography (Removing the italic, bolding it up, changing gradient to Violet/Fuchsia)
    const kanRegex = /className="font-sans (text-[a-z0-9]+) font-black italic tracking-widest bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500/g;
    content = content.replace(kanRegex, 'className="font-sans $1 font-black tracking-tight bg-gradient-to-r from-violet-500 to-fuchsia-500');
    
    // 4. Change colors for the SVG graphic
    content = content.replace(/text-emerald-500 group-hover:text-cyan-500/g, 'text-violet-500 group-hover:text-fuchsia-500');
    content = content.replace(/text-emerald-500 transition-colors drop-shadow-md/g, 'text-violet-500 transition-colors drop-shadow-md');
    
    // 5. Catch any stray gradients
    content = content.replace(/from-emerald-400 via-teal-500 to-cyan-500/g, 'from-violet-500 to-fuchsia-500');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated refined logo in', file);
    }
  });
});
