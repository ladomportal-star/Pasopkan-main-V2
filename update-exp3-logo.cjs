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

const diamondSvgContent = `<g stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 12l10 10 10-10L12 2Z" fill="currentColor" fillOpacity="0.1" />
                  <path d="M12 2v20" opacity="0.4" />
                  <path d="M2 12h20" opacity="0.4" />
                  <path d="M12 7l-5 5 5 5 5-5-5-5Z" fill="currentColor" opacity="0.8" />
                </g>`;

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Replace the inner SVG using a generic group tag matcher
    content = content.replace(/<g[^>]*>[\s\S]*?<\/g>/g, diamondSvgContent);

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated to Experience diamond aesthetic in', file);
    }
  });
});
