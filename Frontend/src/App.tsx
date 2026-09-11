/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from './context/ThemeContext';

// Import pages statically to guarantee zero dynamic chunk fetching errors
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import EditProfile from './pages/EditProfile';
import Notifications from './pages/Notifications';
import LanguageSettings from './pages/LanguageSettings';
import Security from './pages/Security';
import UpdatePassword from './pages/UpdatePassword';
import PaymentMethods from './pages/PaymentMethods';
import Help from './pages/Help';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/Login';
import Register from './pages/Register';
import PastEvents from './pages/PastEvents';
import CategoryEvents from './pages/CategoryEvents';
import Contact from './pages/Contact';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import StaffScanner from './pages/StaffScanner';

// A wrapper to animate individual standalone pages
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
    className="flex-1 flex flex-col w-full h-full min-h-screen"
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  // Define which paths are standalone (they don't use the main Layout component)
  const standalonePaths = ['/admin', '/create', '/staff-scanner', '/login', '/register'];
  
  // Keep the same key for all layout routes so that the top-level AnimatePresence
  // doesn't unmount the entire layout, allowing the inner AnimatePresence in Layout.tsx to handle it.
  const isLayoutRoute = !standalonePaths.includes(location.pathname);
  const routeKey = isLayoutRoute ? 'layout' : location.pathname;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        <Route 
          path="/" 
          element={
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col w-full min-h-screen"
            >
              <Layout />
            </motion.div>
          }
        >
          <Route index element={<Home />} />
          <Route path="event/:id" element={<EventDetails />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="account" element={<Account />} />
          <Route path="past-events" element={<PastEvents />} />
          <Route path="category/:categoryId" element={<CategoryEvents />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="language" element={<LanguageSettings />} />
          <Route path="security" element={<Security />} />
          <Route path="security/2fa" element={<UpdatePassword />} />
          <Route path="security/password" element={<UpdatePassword />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="help" element={<Help />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
        </Route>
        
        {/* Standalone Pages */}
        <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
        <Route path="/create" element={<PageTransition><CreateEvent /></PageTransition>} />
        <Route path="/staff-scanner" element={<PageTransition><StaffScanner /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <div className="pb-16 md:pb-0 min-h-screen flex flex-col bg-white text-adv-slate transition-colors duration-300">
            <AnimatedRoutes />
            <BottomNav />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
