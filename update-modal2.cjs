const fs = require('fs');
let content = fs.readFileSync('Frontend/src/components/ETicketModal.tsx', 'utf-8');

const oldModalTrans = `          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ 
            opacity: isClosing ? 0 : 1, 
            scale: isClosing ? 0.92 : 1, 
            y: isClosing ? 36 : 0 
          }}
          exit={{ opacity: 0, scale: 0.92, y: 36 }}
          transition={{ 
            type: 'spring', 
            damping: isClosing ? 28 : 25, 
            stiffness: isClosing ? 360 : 320,
            mass: 0.8
          }}`;

const newModalTrans = `          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          animate={{ 
            opacity: isClosing ? 0 : 1, 
            scale: isClosing ? 0.98 : 1, 
            y: isClosing ? 16 : 0 
          }}
          exit={{ opacity: 0, scale: 0.98, y: 16 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1]
          }}`;

content = content.replace(oldModalTrans, newModalTrans);
fs.writeFileSync('Frontend/src/components/ETicketModal.tsx', content);
