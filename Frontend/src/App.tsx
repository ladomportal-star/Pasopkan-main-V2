/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <div className="pb-16 md:pb-0 min-h-screen flex flex-col bg-white text-adv-slate transition-colors duration-300">
            <Routes>
              <Route path="/" element={<Layout />}>
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
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/create" element={<CreateEvent />} />
              <Route path="/staff-scanner" element={<StaffScanner />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
            <BottomNav />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
