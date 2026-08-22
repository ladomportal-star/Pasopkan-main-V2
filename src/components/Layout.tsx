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
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex-1 bg-white text-adv-slate selection:bg-adv-orange/30 font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-20 lg:pt-24 pb-0 flex flex-col overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
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
