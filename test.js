const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');
console.log(content.substring(content.indexOf('// Check Firestore tickets collection'), content.indexOf('// Fallback to localStorage for mock/offline session')));
