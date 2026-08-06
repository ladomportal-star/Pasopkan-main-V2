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
          if (file.match(/\.(tsx|ts|html|json)$/)) {
            results.push(file);
          }
          next();
        }
      });
    }
    next();
  });
};

walk(__dirname, function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Replace names
    content = content.replace(/Mytixket/g, 'Pasopkan');
    content = content.replace(/MyTixket/g, 'Pasopkan');
    content = content.replace(/mytixket/g, 'pasopkan');
    content = content.replace(/MYTIXKET/g, 'PASOPKAN');
    
    // Replace split logo: MY + TIXKET -> PASOP + KAN
    content = content.replace(/>\s*MY\s*<\/span>/g, '>PASOP</span>');
    content = content.replace(/>\s*TIXKET\s*<\/span>/g, '>KAN</span>');
    
    // Some formats might have newlines inside the tag and before the text. 
    // Let's use a regex that captures any amount of whitespace.
    content = content.replace(/>([\s]*)MY([\s]*)<\/span>/g, '>$1PASOP$2</span>');
    content = content.replace(/>([\s]*)TIXKET([\s]*)<\/span>/g, '>$1KAN$2</span>');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
    }
  });
});
