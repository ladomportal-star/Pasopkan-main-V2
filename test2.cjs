const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');
console.log(content.substring(content.indexOf('const handleCommentSubmit'), content.indexOf('  useEffect(() => {', content.indexOf('const handleCommentSubmit'))));
