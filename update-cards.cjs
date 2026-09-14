const fs = require('fs');

function updateCard(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Update motion.div animation parameters
  // EventCard has initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
  // LandscapeEventCard has initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
  
  // For LandscapeEventCard
  content = content.replace(
    /initial=\{\{ opacity: 0, y: 20 \}\}\n\s*whileInView=\{\{ opacity: 1, y: 0 \}\}/,
    `initial={{ opacity: 0, y: 16, scale: 0.98 }}\n      whileInView={{ opacity: 1, y: 0, scale: 1 }}\n      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}`
  );
  
  // For EventCard
  content = content.replace(
    /initial=\{\{ opacity: 0, y: 12 \}\}\n\s*whileInView=\{\{ opacity: 1, y: 0 \}\}\n\s*viewport=\{\{ once: true \}\}\n\s*transition=\{\{ duration: 0.3, delay: index \* 0.03 \}\}/,
    `initial={{ opacity: 0, y: 16, scale: 0.98 }}\n      whileInView={{ opacity: 1, y: 0, scale: 1 }}\n      viewport={{ once: true, margin: "-20px" }}\n      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}`
  );

  // Update hover image scaling and transition speed to be smoother
  // duration-700 ease-out -> duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
  content = content.replace(
    'transition-transform duration-700 ease-out',
    'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
  );

  content = content.replace(
    'transition-transform duration-700 group-hover:scale-105',
    'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105'
  );

  fs.writeFileSync(file, content);
}

updateCard('Frontend/src/components/EventCard.tsx');
updateCard('Frontend/src/components/LandscapeEventCard.tsx');
