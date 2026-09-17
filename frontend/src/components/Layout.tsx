import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  const isAdminDashboard = location.pathname === '/admin';
  const isEventDetailsPage = location.pathname.startsWith('/event/');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const getDirection = (prev: string, curr: string) => {
    if (curr.startsWith('/event/') && !prev.startsWith('/event/')) return 1;
    if (!curr.startsWith('/event/') && prev.startsWith('/event/')) return -1;
    return 0;
  };

  const [pathState, setPathState] = useState({ prev: location.pathname, curr: location.pathname, dir: 0 });
  if (location.pathname !== pathState.curr) {
    setPathState({
      prev: pathState.curr,
      curr: location.pathname,
      dir: getDirection(pathState.curr, location.pathname)
    });
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  const pageVariants = {
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
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      transitionEnd: {
        transform: 'none',
        filter: 'none'
      }
    },
    exit: (dir: number) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!isMobile || dir === 0) return { opacity: 0, y: -8, scale: 0.995, filter: 'blur(2px)', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };
      if (dir === 1) return { opacity: 0, x: -50, scale: 0.995, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }; 
      if (dir === -1) return { opacity: 0, x: 50, scale: 0.995, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }; 
      return { opacity: 0, y: -8, scale: 0.995, filter: 'blur(2px)', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };
    }
  };

  return (
    <div className="flex-1 bg-white text-adv-slate selection:bg-adv-orange/30 font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-20 lg:pt-24 pb-0 flex flex-col overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            custom={pathState.dir}
            variants={pageVariants as any}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdminDashboard && !isEventDetailsPage && <Footer />}

      {/* Elegant floating Back to Top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            whileHover={{ scale: 1.08, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="fixed right-5 bottom-24 md:right-8 md:bottom-8 z-50 p-3 sm:p-3.5 rounded-full bg-adv-orange text-white shadow-lg shadow-orange-500/20 border border-white/10 hover:bg-orange-600 transition-colors focus:outline-none cursor-pointer group"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
