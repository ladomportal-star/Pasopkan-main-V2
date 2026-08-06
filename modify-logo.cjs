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

const oldSvgContent = `<path d="M4 4C2.89543 4 2 4.89543 2 6V9C3.10457 9 4 9.89543 4 11C4 12.1046 3.10457 13 2 13V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V13C20.8954 13 20 12.1046 20 11C20 9.89543 20.8954 9 22 9V6C22 4.89543 21.1046 4 20 4H4Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>\\n\\s*<path d="M8 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 4"/>\\n\\s*<polygon points="15,9 16.2,11.5 19,11.9 17,13.8 17.5,16.5 15,15.2 12.5,16.5 13,13.8 11,11.9 13.8,11.5" fill="currentColor" />`;

const newSvgContent = `<g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20L12 6L20 20Z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M12 6L16 13H8L12 6Z" fill="currentColor" />
                  <circle cx="17" cy="8" r="2.5" strokeWidth="2" fill="none" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Replace SVG path contents
    const svgRegex = new RegExp(oldSvgContent, 'g');
    content = content.replace(svgRegex, newSvgContent);
    
    // Alternative replacement if formatting differs
    content = content.replace(
      /<path d="M4 4C2\.89543 4 2[\s\S]*?fill="currentColor"\s*\/>/g,
      newSvgContent
    );
    
    // Replace gradient (indigo/purple/pink) with sunset vibes (amber/orange/rose)
    content = content.replace(/from-indigo-400 via-purple-500 to-pink-500/g, 'from-amber-400 via-orange-500 to-rose-500');
    
    // Replace SVG text colors
    content = content.replace(/text-purple-500 group-hover:text-pink-500/g, 'text-amber-500 group-hover:text-rose-500');
    content = content.replace(/text-purple-500 transition-colors drop-shadow-md/g, 'text-amber-500 transition-colors drop-shadow-md');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated logo in', file);
    }
  });
});
