const fs = require('fs');
let content = fs.readFileSync('Frontend/src/App.tsx', 'utf-8');

const oldTrans = `<motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}`;

const newTrans = `<motion.div
    initial={{ opacity: 0, y: 10, scale: 0.995, filter: 'blur(2px)' }}
    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -8, scale: 0.995, filter: 'blur(2px)' }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`;

content = content.replace(oldTrans, newTrans);
fs.writeFileSync('Frontend/src/App.tsx', content);
