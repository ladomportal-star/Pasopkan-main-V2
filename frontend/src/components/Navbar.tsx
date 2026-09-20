import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, User, Plus, Search, Shield, Moon, Sun, Menu, X, Compass, Globe, Activity, MapPin, Zap, Lightbulb, Mountain, PartyPopper, Bell, Calendar, Info, Star, ChevronRight, ArrowLeft , ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import Logo from './Logo';
import SearchModal from './SearchModal';
import OtpInput from './OtpInput';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

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

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Upcoming Adventure!',
    titleLo: 'ການຜະຈົນໄພໃກ້ເຂົ້າມາແລ້ວ!',
    message: 'Your Nam Ha Trekking starts in 48 hours. Don\'t forget your water bottle!',
    messageLo: 'ການຍ່າງປ່າ ນ້ຳຮາ ຈະເລີ່ມຂຶ້ນໃນອີກ 48 ຊົ່ວໂມງ. ຢ່າລືມກະຕຸກນ້ຳຂອງທ່ານ!',
    time: '2 hours ago',
    timeLo: '2 ຊົ່ວໂມງກ່ອນ',
    type: 'upcomingEvent',
    icon: Calendar,
    isUnread: true
  },
  {
    id: 2,
    title: 'New Policy Updated',
    titleLo: 'ອັບເດດນະໂຍບາຍໃໝ່',
    message: 'We have updated our refund policy for all workshops. Please review it.',
    messageLo: 'ພວກເຮົາໄດ້ອັບເດດນະໂຍບາຍການຄືນເງິນສຳລັບທຸກເວີກຊັອບ. ກະລຸນາກວດສອບ.',
    time: '5 hours ago',
    timeLo: '5 ຊົ່ວໂມງກ່ອນ',
    type: 'noted',
    icon: Info,
    isUnread: true,
    image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=2574&auto=format&fit=crop'
  },
  {
    id: 3,
    title: 'Ticket Confirmed',
    titleLo: 'ຢືນຢັນປີ້ສຳເລັດແລ້ວ',
    message: 'Booking #PK-8921 for Vang Vieng Music Festival has been confirmed.',
    messageLo: 'ການຈອງ #PK-8921 ສຳລັບ ບຸນດົນຕີ ວັງວຽງ ໄດ້ຮັບການຢືນຢັນແລ້ວ.',
    time: '1 day ago',
    timeLo: '1 ມື້ກ່ອນ',
    type: 'ticket',
    icon: Ticket,
    isUnread: true
  },
  {
    id: 4,
    title: 'Special Flash Sale',
    titleLo: 'ໂປຣໂມຊັ່ນພິເສດ Flash Sale',
    message: 'Get 20% discount on all cultural tours in Luang Prabang this weekend.',
    messageLo: 'ຮັບສ່ວນຫຼຸດ 20% ສຳລັບການທ່ອງທ່ຽວວັດທະນະທຳທັງໝົດໃນ ຫຼວງພະບາງ ທ້າຍອາທິດນີ້.',
    time: '2 days ago',
    timeLo: '2 ມື້ກ່ອນ',
    type: 'promo',
    icon: Star,
    isUnread: false
  },
  {
    id: 5,
    title: 'Organizer Verification',
    titleLo: 'ການກວດສອບຜູ້ຈັດງານ',
    message: 'Your organizer verification documents have been successfully approved.',
    messageLo: 'ເອກະສານຢືນຢັນຕົວຕົນຜູ້ຈັດງານຂອງທ່ານໄດ້ຮັບການອະນຸມັດຮຽບຮ້ອຍແລ້ວ.',
    time: '3 days ago',
    timeLo: '3 ມື້ກ່ອນ',
    type: 'verified',
    icon: ShieldCheck,
    isUnread: false
  },
  {
    id: 6,
    title: 'System Maintenance',
    titleLo: 'ແຈ້ງປັບປຸງລະບົບ',
    message: 'Scheduled platform maintenance on Sunday at 02:00 AM ICT.',
    messageLo: 'ການບຳລຸງຮັກສາລະບົບຕາມກຳນົດເວລາໃນວັນອາທິດ ເວລາ 02:00 ໂມງເຊົ້າ.',
    time: '5 days ago',
    timeLo: '5 ມື້ກ່ອນ',
    type: 'system',
    icon: AlertCircle,
    isUnread: false
  }
];

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const hasUnread = notifications.some(n => n.isUnread);
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();



  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  
  // Auth/OTP modal state
  const [showAuthOtpModal, setShowAuthOtpModal] = useState(false);
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authOtpError, setAuthOtpError] = useState('');
  const [authOtpCountdown, setAuthOtpCountdown] = useState(0);
  const expectedAuthOtp = '123456';

  const [authTwoFaCode, setAuthTwoFaCode] = useState('');
  const [authTwoFaError, setAuthTwoFaError] = useState('');
  const expectedTwoFa = '987654';

  const [isVerifyingAuthOtp, setIsVerifyingAuthOtp] = useState(false);

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
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
  };

  const handleNotifClick = (notif: any) => {
    setSelectedNotif(notif);
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, isUnread: false } : n));
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
              <button onClick={() => setShowAuthOtpModal(true)} className="flex items-center gap-2 text-adv-orange hover:text-orange-600 transition-colors">
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
                            const NotifIcon = notif.icon || Bell;
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
                                    {lang === 'lo' && notif.timeLo ? notif.timeLo : notif.time}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
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
                  'bg-orange-50 text-adv-orange'
                }`}>
                  <selectedNotif.icon className="w-8 h-8" />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-adv-orange mb-2 block">
                      {selectedNotif.type === 'upcomingEvent' ? t.upcomingEvent : t.noted}
                    </span>
                    <h3 className="text-2xl font-bold text-adv-slate leading-tight font-display">
                      {selectedNotif.title}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium mt-2">{selectedNotif.time}</p>
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-adv-slate leading-relaxed font-medium">
                      {selectedNotif.message}
                    </p>
                  </div>
                  
                  {selectedNotif.image && (
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => setFullscreenImage(selectedNotif.image)}
                    >
                      <div className="w-full h-48 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                        <img 
                          src={selectedNotif.image} 
                          alt="Notification attachment" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-adv-slate">PDF Policy</span>
                      </div>
                    </div>
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
              className="max-w-md w-full bg-white rounded-2xl p-5 sm:p-7 shadow-2xl border border-gray-100 text-adv-slate"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-adv-orange flex items-center justify-center mx-auto mb-3 border border-orange-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-center mb-1">
                {lang === 'lo' ? 'ຢືນຢັນຕົວຕົນເພື່ອກວດສອບ ແລະ ເຜີຍແຜ່' : 'Verify Identity to Publish'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium text-center mb-4 leading-relaxed">
                {lang === 'lo'
                  ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກ ເພື່ອຢືນຢັນການເຜີຍແຜ່ກິດຈະກຳນີ້. ການຢືນຢັນຈະຊ່ວຍໃຫ້ໝັ້ນໃຈວ່າຂໍ້ມູນປອດໄພ.'
                  : 'Enter the 6-digit OTP and 2FA codes to securely access the organizer center.'}
              </p>

              <div className="mb-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block text-center mb-2">
                    {lang === 'lo' ? 'ລະຫັດຢືນຢັນ OTP 6 ຫຼັກ' : '6-Digit SMS OTP Code'}
                  </label>
                  
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

                  <div className="mt-4 flex flex-col items-center">
                    {authOtpCountdown > 0 ? (
                      <span className="text-xs text-gray-400 font-bold">
                        {lang === 'lo' ? `ສົ່ງໃໝ່ໃນ ${authOtpCountdown} ວິນາທີ` : `Resend in ${authOtpCountdown}s`}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setAuthOtpCountdown(60);
                          setAuthOtpError('');
                        }}
                        className="text-xs text-adv-orange font-bold hover:underline"
                      >
                        {lang === 'lo' ? 'ສົ່ງລະຫັດໃໝ່' : 'Resend OTP Code'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block text-center mb-2">
                    {lang === 'lo' ? 'ລະຫັດ 2FA 6 ຫຼັກ' : '6-Digit 2FA Code (Authenticator)'}
                  </label>
                  
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
                  <div className="mt-5 flex justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setAuthOtpCode(expectedAuthOtp);
                        setAuthOtpError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full text-[10px] font-bold transition-colors"
                    >
                      <Info className="w-3 h-3" />
                      OTP: {expectedAuthOtp}
                    </button>
                    <button
                      onClick={() => {
                        setAuthTwoFaCode(expectedTwoFa);
                        setAuthTwoFaError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full text-[10px] font-bold transition-colors"
                    >
                      <Info className="w-3 h-3" />
                      2FA: {expectedTwoFa}
                    </button>
                  </div>
                </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAuthOtpModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>                
                <button
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
                    await new Promise(r => setTimeout(r, 1000));
                    setIsVerifyingAuthOtp(false);
                    setShowAuthOtpModal(false);
                    navigate('/create'); // Navigate to create page
                  }}
                  disabled={authOtpCode.length < 6 || authTwoFaCode.length < 6 || isVerifyingAuthOtp}
                  className="flex-1 py-3 bg-adv-orange hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex justify-center items-center gap-2"
                >
                  {isVerifyingAuthOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    lang === 'lo' ? 'ຢືນຢັນ' : 'Verify'
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

