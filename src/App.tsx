/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';
import { ThemeProvider } from './ThemeContext';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Account = lazy(() => import('./pages/Account'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Security = lazy(() => import('./pages/Security'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const PaymentMethods = lazy(() => import('./pages/PaymentMethods'));
const Help = lazy(() => import('./pages/Help'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PastEvents = lazy(() => import('./pages/PastEvents'));
const CategoryEvents = lazy(() => import('./pages/CategoryEvents'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffScanner = lazy(() => import('./pages/StaffScanner'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adv-primary"></div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="pb-16 md:pb-0 min-h-screen flex flex-col bg-white text-adv-slate transition-colors duration-300">
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
            <BottomNav />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
