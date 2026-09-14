const fs = require('fs');
let content = fs.readFileSync('Frontend/src/components/Layout.tsx', 'utf-8');

const oldVariants = `  const pageVariants = {
    initial: (dir: number) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!isMobile || dir === 0) return { opacity: 0, y: 15, x: 0 };
      if (dir === 1) return { opacity: 0, x: 100, y: 0 }; 
      if (dir === -1) return { opacity: 0, x: -100, y: 0 }; 
      return { opacity: 0, y: 15, x: 0 };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] }
    },
    exit: (dir: number) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!isMobile || dir === 0) return { opacity: 0, y: -15, x: 0 };
      if (dir === 1) return { opacity: 0, x: -100, y: 0 }; 
      if (dir === -1) return { opacity: 0, x: 100, y: 0 }; 
      return { opacity: 0, y: -15, x: 0 };
    }
  };`;

const newVariants = `  const pageVariants = {
    initial: (dir: number) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!isMobile || dir === 0) return { opacity: 0, y: 12, scale: 0.995, filter: 'blur(2px)' };
      if (dir === 1) return { opacity: 0, x: 50, scale: 0.995 }; 
      if (dir === -1) return { opacity: 0, x: -50, scale: 0.995 }; 
      return { opacity: 0, y: 12, scale: 0.995, filter: 'blur(2px)' };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    },
    exit: (dir: number) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!isMobile || dir === 0) return { opacity: 0, y: -8, scale: 0.995, filter: 'blur(2px)', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };
      if (dir === 1) return { opacity: 0, x: -50, scale: 0.995, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }; 
      if (dir === -1) return { opacity: 0, x: 50, scale: 0.995, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }; 
      return { opacity: 0, y: -8, scale: 0.995, filter: 'blur(2px)', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };
    }
  };`;

content = content.replace(oldVariants, newVariants);
fs.writeFileSync('Frontend/src/components/Layout.tsx', content);
