const fs = require('fs');
let content = fs.readFileSync('Frontend/src/components/BottomNav.tsx', 'utf-8');
content = content.replace('to={isAuthenticated ? "/account" : "/login"}', 'to="/account"');
fs.writeFileSync('Frontend/src/components/BottomNav.tsx', content);
