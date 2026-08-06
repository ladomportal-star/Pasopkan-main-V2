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
          if (file.match(/\.(tsx|ts|jsx|js)$/)) {
            results.push(file);
          }
          next();
        }
      });
    }
    next();
  });
};

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Replace complex triple gradients
    content = content.replace(/from-indigo-500 via-purple-500 to-pink-500/g, 'from-emerald-500 via-emerald-400 to-teal-400');
    content = content.replace(/from-indigo-400 via-purple-400 to-pink-400/g, 'from-emerald-400 via-emerald-300 to-teal-300');
    content = content.replace(/from-cyan-400 via-fuchsia-500 to-purple-600/g, 'from-teal-400 via-emerald-500 to-green-600');
    
    // Replace standalone colors where they exist in classes
    content = content.replace(/purple-([1-9]00)/g, 'emerald-$1');
    content = content.replace(/indigo-([1-9]00)/g, 'teal-$1');
    content = content.replace(/pink-([1-9]00)/g, 'green-$1');
    content = content.replace(/fuchsia-([1-9]00)/g, 'emerald-$1');
    content = content.replace(/cyan-([1-9]00)/g, 'teal-$1');
    content = content.replace(/rose-([1-9]00)/g, 'emerald-$1');
    content = content.replace(/orange-([1-9]00)/g, 'emerald-$1');
    content = content.replace(/amber-([1-9]00)/g, 'emerald-$1');
    content = content.replace(/yellow-([1-9]00)/g, 'emerald-$1');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated theme colors in', file);
    }
  });
});
