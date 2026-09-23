import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, User, Plus, Search, Shield, Moon, Sun, Menu, X, Compass, Globe, Activity, MapPin, Zap, Lightbulb, Mountain, PartyPopper, Bell, Calendar, Info, Star, ChevronRight, ArrowLeft, ShieldCheck, AlertCircle, Loader2, Clock, RotateCw, Check, ShieldAlert, KeyRound, Settings } from 'lucide-react';
import Logo from './Logo';
import SearchModal from './SearchModal';
import OtpInput from './OtpInput';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications, timeAgo } from '../context/NotificationsContext';
import type { AppNotification } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { safeStorage } from '../lib/storage';

const translations = {
  en: {
    concerts: 'Concerts',
    sports: 'Adventure and Tour',
    workshop: 'Workshops',
    festivals: 'Festivals',
    voucher: 'Voucher and Booking',
    createEvent: 'Create Event',
    search: 'Search destinations...',
    myTickets: 'My Tickets',
    account: 'Account',
    admin: 'Admin',
    switchLanguage: 'Language',
    toggleTheme: 'Appearance',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    markAsRead: 'Mark all as read',
    notificationDetails: 'Notification Details',
    close: 'Close',
    upcomingEvent: 'Upcoming Event',
    noted: 'Noted'
  },
  lo: {
    concerts: 'ຄອນເສີດ',
    sports: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ',
    workshop: 'ເວີກຊອບ',
    festivals: 'ເທດສະການ',
    voucher: 'Voucher ແລະ ການຈອງ',
    createEvent: 'ສ້າງກິດຈະກຳ',
    search: 'ຄົ້ນຫາ...',
    myTickets: 'ປີ້ຂອງຂ້ອຍ',
    account: 'ບັນຊີ',
    admin: 'ແອດມິນ',
    switchLanguage: 'ພາສາ',
    toggleTheme: 'ໂໝດສະແດງຜົນ',
    notifications: 'ການແຈ້ງເຕືອນ',
    noNotifications: 'ບໍ່ມີການແແຈ້ງເຕືອນໃໝ່',
    markAsRead: 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ',
    notificationDetails: 'ລາຍລະອຽດການແຈ້ງເຕືອນ',
    close: 'ປິດ',
    upcomingEvent: 'ກິດຈະກຳໃໝ່',
    noted: 'ບັນທຶກແລ້ວ'
  }
};

function getNavbarNotifIcon(notif: any): React.ComponentType<{ className?: string }> {
  if (typeof notif?.icon === 'function') {
    return notif.icon;
  }
  if (notif?.icon && typeof notif.icon === 'object' && (notif.icon.$$typeof || notif.icon.render)) {
    return notif.icon;
  }
  const status = notif?.status;
  const type = notif?.type;
  if (status === 'approved' || type === 'verified') return ShieldCheck;
  if (status === 'rejected') return AlertCircle;
  if (type === 'upcomingEvent') return Calendar;
  if (type === 'ticket') return Ticket;
  if (type === 'promo') return Star;
  if (type === 'noted') return Info;
  if (type === 'system') return AlertCircle;
  return Bell;
}

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const notificationRef = useRef<HTMLDivElement>(null);

  const hasUnread = unreadCount > 0;
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();



  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  
  // Auth/OTP & 2FA modal state
  const [showTwoFaRequiredModal, setShowTwoFaRequiredModal] = useState(false);
  const [showAuthOtpModal, setShowAuthOtpModal] = useState(false);
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authOtpError, setAuthOtpError] = useState('');
  const [authOtpCountdown, setAuthOtpCountdown] = useState(0);
  const [otpSentFeedback, setOtpSentFeedback] = useState(false);
  const expectedAuthOtp = '123456';

  const [authTwoFaCode, setAuthTwoFaCode] = useState('');
  const [authTwoFaError, setAuthTwoFaError] = useState('');
  const expectedTwoFa = '987654';

  const [isVerifyingAuthOtp, setIsVerifyingAuthOtp] = useState(false);

  const handleCreateEventClick = () => {
    const is2FaEnabled = safeStorage.getItem('user_2fa_enabled') === 'true';
    if (!is2FaEnabled) {
      setShowTwoFaRequiredModal(true);
      return;
    }

    setAuthOtpCountdown(60);
    setAuthOtpCode('');
    setAuthOtpError('');
    setAuthTwoFaCode('');
    setAuthTwoFaError('');
    setOtpSentFeedback(false);
    setShowAuthOtpModal(true);
  };

  const handleResendOtp = () => {
    setAuthOtpCountdown(60);
    setAuthOtpError('');
    setOtpSentFeedback(true);
    setTimeout(() => setOtpSentFeedback(false), 3000);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authOtpCountdown > 0) {
      timer = setTimeout(() => setAuthOtpCountdown(authOtpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [authOtpCountdown]);

  const t = translations[lang];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    void markAllRead();
  };

  const handleNotifClick = (notif: AppNotification) => {
    setSelectedNotif(notif);
    if (notif.isUnread) void markRead(notif.id);
    setIsNotificationsOpen(false); // Close dropdown when opening detail
  };

  return (
    <>
      <nav className="fixed top-0 z-[60] w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="mx-auto flex h-16 sm:h-20 lg:h-24 max-w-[1400px] items-center justify-between px-3 sm:px-8 lg:px-12">
          {/* Brand/Logo Section */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center shrink-0">
              <img 
                src="/pasopkan_logo.png" 
                alt="Pasopkan Logo" 
                className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-transform duration-300 hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-adv-slate/70">
              <Link to="/category/workshop" className="hover:text-adv-orange transition-colors">{t.workshop}</Link>
              <Link to="/category/sports" className="hover:text-adv-orange transition-colors">{t.sports}</Link>
              <Link to="/category/festival" className="hover:text-adv-orange transition-colors">{t.festivals}</Link>
              <Link to="/category/voucher" className="hover:text-adv-orange transition-colors">{t.voucher}</Link>
              <div className="w-px h-4 bg-gray-200 mx-2" />
              <button onClick={handleCreateEventClick} className="flex items-center gap-2 text-adv-orange hover:text-orange-600 transition-colors font-bold cursor-pointer">
                <Plus className="w-4 h-4" />
                {t.createEvent}
              </button>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-2 lg:gap-6">
            {/* Search Trigger */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="lg:flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-all group hidden md:flex min-w-[200px]"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-medium">{t.search}</span>
            </button>

            {/* Mobile Search Trigger */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-adv-slate hover:text-adv-orange transition-all rounded-full hover:bg-gray-50"
              title={t.search}
            >
              <Search className="w-5 h-5" />
            </button>


            <div className="flex items-center gap-1.5 lg:gap-3">
              <PWAInstallButton variant="nav" />

              <Link 
                to={isAuthenticated ? "/dashboard" : "/login"} 
                className="hidden md:block p-2 text-adv-slate hover:text-adv-orange transition-all"
                title={t.myTickets}
              >
                <Ticket className="w-5 h-5" />
              </Link>

              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 text-adv-slate hover:text-adv-orange transition-all relative rounded-full hover:bg-gray-50 cursor-pointer"
                  title={t.notifications}
                  aria-label={t.notifications}
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-adv-orange rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-adv-orange" />
                          <h3 className="font-bold text-sm text-adv-slate">{t.notifications}</h3>
                        </div>
                        {hasUnread && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-bold text-adv-orange hover:text-orange-600 transition-colors"
                          >
                            {t.markAsRead}
                          </button>
                        )}
                      </div>

                      <div 
                        className={`overflow-y-auto overscroll-contain divide-y divide-gray-50 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent] ${
                          notifications.length > 4 ? 'max-h-[295px]' : 'max-h-none'
                        }`}
                      >
                        {notifications.length === 0 ? (
                          <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange mb-2.5 shadow-sm">
                              <Bell className="w-5 h-5 text-adv-orange" />
                            </div>
                            <p className="text-xs font-bold text-adv-slate mb-0.5">
                              {lang === 'lo' ? 'ຍັງບໍ່ມີການແຈ້ງເຕືອນໃໝ່' : 'No new notifications'}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {t.noNotifications}
                            </p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const NotifIcon = getNavbarNotifIcon(notif);
                            return (
                              <div
                                key={notif.id}
                                onClick={() => handleNotifClick(notif)}
                                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 ${
                                  notif.isUnread ? 'bg-orange-50/30' : ''
                                }`}
                              >
                                <div className="w-8 h-8 rounded-xl bg-orange-100/60 text-adv-orange flex items-center justify-center shrink-0 mt-0.5">
                                  <NotifIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-bold text-adv-slate truncate">
                                      {lang === 'lo' && notif.titleLo ? notif.titleLo : notif.title}
                                    </p>
                                    {notif.isUnread && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-adv-orange shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                                    {lang === 'lo' && notif.messageLo ? notif.messageLo : notif.message}
                                  </p>
                                  <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                                    {timeAgo(notif.createdAt, lang)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/70">
                        <Link 
                          to="/notifications" 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-xs font-bold text-gray-500 hover:text-adv-orange transition-colors px-1 py-0.5"
                        >
                          {lang === 'lo' ? 'ເບິ່ງທັງໝົດ' : 'View All'}
                        </Link>
                        <Link 
                          to="/notifications?tab=settings" 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-adv-orange hover:text-orange-600 transition-colors px-1 py-0.5"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>{lang === 'lo' ? 'ຕັ້ງຄ່າ' : 'Settings'}</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link 
                to={isAuthenticated ? "/account" : "/login"} 
                className="hidden sm:block p-2 text-adv-slate hover:text-adv-orange transition-all"
                title={t.account}
              >
                <User className="w-5 h-5" />
              </Link>
              

            </div>
          </div>
        </div>
      </nav>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Notification Detail Slide-over */}
      <AnimatePresence>
        {selectedNotif && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotif(null)}
              className="fixed inset-0 bg-adv-slate/20 backdrop-blur-sm z-[100]"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedNotif(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-adv-slate" />
                  </button>
                  <h2 className="font-bold text-lg text-adv-slate">{t.notificationDetails}</h2>
                </div>
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mb-8 ${
                  selectedNotif.type === 'upcomingEvent' ? 'bg-blue-50 text-blue-500' :
                  selectedNotif.type === 'verified' || selectedNotif.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                  selectedNotif.status === 'rejected' ? 'bg-red-50 text-red-600' :
                  'bg-orange-50 text-adv-orange'
                }`}>
                  {(() => {
                    const ModalIcon = getNavbarNotifIcon(selectedNotif);
                    return <ModalIcon className="w-8 h-8" />;
                  })()}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-adv-orange mb-2 block">
                      {selectedNotif.status === 'approved' || selectedNotif.type === 'verified'
                        ? (lang === 'lo' ? 'ກິດຈະກຳໄດ້ຮັບອະນຸມັດ' : 'Event Approved')
                        : selectedNotif.status === 'rejected'
                        ? (lang === 'lo' ? 'ກິດຈະກຳຖືກປະຕິເສດ' : 'Event Rejected')
                        : selectedNotif.type === 'upcomingEvent' ? t.upcomingEvent : t.noted}
                    </span>
                    <h3 className="text-2xl font-bold text-adv-slate leading-tight font-display">
                      {lang === 'lo' && selectedNotif.titleLo ? selectedNotif.titleLo : selectedNotif.title}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium mt-2">{timeAgo(selectedNotif.createdAt, lang)}</p>
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-adv-slate leading-relaxed font-medium">
                      {lang === 'lo' && selectedNotif.messageLo ? selectedNotif.messageLo : selectedNotif.message}
                    </p>
                  </div>

                  {selectedNotif.rejectionReason && (
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider">
                          {lang === 'lo' ? 'ເຫດຜົນການປະຕິເສດ' : 'Rejection Reason'}
                        </h5>
                        <p className="text-xs text-red-700 mt-1">{selectedNotif.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {selectedNotif.link && (
                    <Link
                      to={selectedNotif.link}
                      onClick={() => setSelectedNotif(null)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-adv-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-colors shadow-sm"
                    >
                      <span>{lang === 'lo' ? 'ເບິ່ງລາຍລະອຽດໃນບັນຊີ' : 'View in Account'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                  
                  {selectedNotif.type === 'upcomingEvent' && (
                    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-600 mb-1">Event Preparation</h4>
                        <p className="text-xs text-blue-400 leading-relaxed font-medium">
                          Make sure to check the local weather and have your digital ticket ready for scanning.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-8">
                    <button 
                      onClick={() => setSelectedNotif(null)}
                      className="w-full py-4 bg-adv-slate text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-adv-slate/10"
                    >
                      {t.close}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Overlay */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 sm:p-10 overflow-y-auto"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={fullscreenImage}
              alt="Fullscreen attachment"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>


      {/* 2FA Setup Required Modal */}
      <AnimatePresence>
        {showTwoFaRequiredModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setShowTwoFaRequiredModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-adv-slate"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>
              
              <div className="text-center mb-5">
                <span className="inline-block px-3 py-1 bg-amber-100/70 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full mb-2">
                  {lang === 'lo' ? 'ຄວາມປອດໄພຜູ້ຈັດງານ' : 'Organizer Security Required'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-adv-slate">
                  {lang === 'lo' ? 'ຈຳເປັນຕ້ອງຕັ້ງຄ່າ 2FA ກ່ອນ' : '2FA Setup Required'}
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                  {lang === 'lo'
                    ? 'ເພື່ອຄວາມປອດໄພຂອງບັນຊີຜູ້ຈັດງານ, ລາຍຮັບຈາກປີ້ ແລະ ຂໍ້ມູນກິດຈະກຳ, ທ່ານຕ້ອງຕັ້ງຄ່າການຢືນຢັນຕົວຕົນ 2 ຂັ້ນຕອນ (2FA) ກ່ອນຈຶ່ງຈະສາມາດສ້າງກິດຈະກຳໄດ້.'
                    : 'To protect your organizer credentials, ticket revenue, and attendee check-ins, you must set up Two-Factor Authentication (2FA) before creating events.'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6 space-y-2.5 text-xs text-gray-600">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>{lang === 'lo' ? 'ປົກປ້ອງບັນຊີທະນາຄານ ແລະ ລາຍຮັບ' : 'Protects payout bank accounts & ticket revenue'}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>{lang === 'lo' ? 'ປ້ອງກັນການສ້າງກິດຈະກຳປອມແປງ' : 'Prevents unauthorized event publishing'}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>{lang === 'lo' ? 'ໃຊ້ງານງ່າຍຜ່ານ Google Authenticator ຫຼື Authy' : 'Works with Google Authenticator or Authy'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTwoFaRequiredModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTwoFaRequiredModal(false);
                    navigate('/security/2fa');
                  }}
                  className="flex-1 py-3 bg-adv-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{lang === 'lo' ? 'ຕັ້ງຄ່າ 2FA ດຽວນີ້' : 'Set Up 2FA Now'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth / OTP Modal */}
      <AnimatePresence>
        {showAuthOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setShowAuthOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-100 text-adv-slate"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-adv-orange flex items-center justify-center mx-auto mb-3 border border-orange-100 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-center mb-1">
                {lang === 'lo' ? 'ຢືນຢັນຕົວຕົນເພື່ອສ້າງກິດຈະກຳ' : 'Verify Identity to Create Event'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium text-center mb-4 leading-relaxed">
                {lang === 'lo'
                  ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກ ແລະ ລະຫັດ 2FA ເພື່ອຢືນຢັນຕົວຕົນກ່ອນເຂົ້າສູ່ໜ້າສ້າງກິດຈະກຳ.'
                  : 'Enter the 6-digit OTP and 2FA codes to securely access the event creation center.'}
              </p>

              {/* SMS OTP Code Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    {lang === 'lo' ? 'ລະຫັດຢືນຢັນ OTP 6 ຫຼັກ' : '6-Digit SMS OTP Code'}
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">
                    {lang === 'lo' ? 'ສົ່ງໄປຍັງເບີໂທຂອງທ່ານ' : 'Sent to registered phone'}
                  </span>
                </div>
                
                <OtpInput
                  length={6}
                  autoFocus={true}
                  value={authOtpCode}
                  onChange={(val) => {
                    setAuthOtpCode(val);
                    setAuthOtpError('');
                  }}
                  error={!!authOtpError}
                />

                {authOtpError && (
                  <div className="text-red-500 text-xs font-bold mt-2 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{authOtpError}</span>
                  </div>
                )}

                {/* OTP 60s Countdown & Send Again Button */}
                <div className="mt-3 flex flex-col items-center">
                  {authOtpCountdown > 0 ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-150 rounded-full text-xs font-medium text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-adv-orange animate-pulse" />
                      <span>
                        {lang === 'lo'
                          ? `ສົ່ງລະຫັດໃໝ່ໃນ ${authOtpCountdown} ວິນາທີ`
                          : `Resend code in ${authOtpCountdown}s`}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-adv-orange rounded-full text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{lang === 'lo' ? 'ສົ່ງອີກຄັ້ງ' : 'Send again'}</span>
                    </button>
                  )}

                  {otpSentFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'lo' ? 'ສົ່ງລະຫັດ OTP ໃໝ່ສຳເລັດແລ້ວ!' : 'New OTP code sent successfully!'}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 2FA Code Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    {lang === 'lo' ? 'ລະຫັດ 2FA 6 ຫຼັກ' : '6-Digit 2FA Code'}
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <Check className="w-2.5 h-2.5" />
                    {lang === 'lo' ? 'ຕັ້ງຄ່າ 2FA ແລ້ວ' : '2FA Active'}
                  </span>
                </div>
                
                <OtpInput
                  length={6}
                  autoFocus={false}
                  value={authTwoFaCode}
                  onChange={(val) => {
                    setAuthTwoFaCode(val);
                    setAuthTwoFaError('');
                  }}
                  error={!!authTwoFaError}
                />

                {authTwoFaError && (
                  <div className="text-red-500 text-xs font-bold mt-2 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{authTwoFaError}</span>
                  </div>
                )}
                
                {/* Demo Helper Pill */}
                <div className="mt-4 flex justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthOtpCode(expectedAuthOtp);
                      setAuthOtpError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Info className="w-3 h-3 text-adv-orange" />
                    OTP: {expectedAuthOtp}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTwoFaCode(expectedTwoFa);
                      setAuthTwoFaError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Info className="w-3 h-3 text-adv-orange" />
                    2FA: {expectedTwoFa}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAuthOtpModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>                
                <button
                  type="button"
                  onClick={async () => {
                    let hasError = false;
                    if (authOtpCode !== expectedAuthOtp) {
                      setAuthOtpError(lang === 'lo' ? 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ' : 'Invalid OTP code');
                      hasError = true;
                    }
                    if (authTwoFaCode !== expectedTwoFa) {
                      setAuthTwoFaError(lang === 'lo' ? 'ລະຫັດ 2FA ບໍ່ຖືກຕ້ອງ' : 'Invalid 2FA code');
                      hasError = true;
                    }
                    if (hasError) return;

                    setIsVerifyingAuthOtp(true);
                    await new Promise(r => setTimeout(r, 800));
                    setIsVerifyingAuthOtp(false);
                    setShowAuthOtpModal(false);
                    navigate('/create');
                  }}
                  disabled={authOtpCode.length < 6 || authTwoFaCode.length < 6 || isVerifyingAuthOtp}
                  className="flex-1 py-3 bg-adv-orange hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex justify-center items-center gap-2 shadow-md cursor-pointer"
                >
                  {isVerifyingAuthOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    lang === 'lo' ? 'ຢືນຢັນ & ສືບຕໍ່' : 'Verify & Continue'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const categories_list = [
  { id: 'workshop', label: 'Workshops', icon: Lightbulb },
  { id: 'sports', label: 'Adventure and Tour', icon: Mountain },
  { id: 'festival', label: 'Festivals', icon: PartyPopper },
  { id: 'voucher', label: 'Voucher and Booking', icon: Ticket },
];

