import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, User, Plus, Search, Shield, Moon, Sun, Menu, X, Compass, Globe, Activity, MapPin, Zap, Lightbulb, Mountain, PartyPopper, Bell, Calendar, Info, Star, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import SearchModal from './SearchModal';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

const translations = {
  en: {
    concerts: 'Concerts',
    sports: 'Adventure and Tour',
    workshop: 'Workshops',
    festivals: 'Festivals',
    voucher: 'Vouchers',
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
    voucher: 'Voucher',
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
    message: 'Your Nam Ha Trekking starts in 48 hours. Don\'t forget your water bottle!',
    time: '2 hours ago',
    type: 'upcomingEvent',
    icon: Calendar,
    isUnread: true
  },
  {
    id: 2,
    title: 'New Policy Updated',
    message: 'We have updated our refund policy for all workshops. Please review it.',
    time: '5 hours ago',
    type: 'noted',
    icon: Info,
    isUnread: true,
    image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=2574&auto=format&fit=crop'
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
        <div className="mx-auto flex h-20 lg:h-24 max-w-[1400px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Brand/Logo Section */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center shrink-0">
              <img 
                src="/pasopkan_logo.png" 
                alt="Pasopkan Logo" 
                className="h-16 sm:h-20 lg:h-24 w-auto object-contain transition-transform duration-300 hover:scale-[1.03]" 
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
              <Link to="/create" className="flex items-center gap-2 text-adv-orange hover:text-orange-600 transition-colors">
                <Plus className="w-4 h-4" />
                {t.createEvent}
              </Link>
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


            <div className="flex items-center gap-1 lg:gap-3">
              <button 
                onClick={toggleLanguage}
                className="hover:text-adv-orange p-2 transition-colors text-sm font-bold animate-fade-in"
              >
                {lang === 'lo' ? 'LA' : lang.toUpperCase()}
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 transition-all rounded-full ${isNotificationsOpen ? 'bg-orange-50 text-adv-orange' : 'text-adv-slate hover:text-adv-orange hover:bg-gray-50'}`}
                  title={t.notifications}
                >
                  <div className="relative">
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                </button>

                {isNotificationsOpen && (
                  <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-4 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[70] animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] sm:max-h-none flex flex-col">
                    <div className="p-4 sm:p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                      <h3 className="font-bold text-adv-slate">{t.notifications}</h3>
                      {hasUnread && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] uppercase tracking-widest font-black text-adv-orange hover:underline"
                        >
                          {t.markAsRead}
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto hide-scrollbar flex-1">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => handleNotifClick(notif)}
                              className={`p-4 sm:p-5 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group ${notif.isUnread ? 'bg-orange-50/30' : ''}`}
                            >
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center ${
                                notif.type === 'upcomingEvent' ? 'bg-blue-50 text-blue-500' :
                                'bg-orange-50 text-adv-orange'
                              }`}>
                                <notif.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                  <h4 className={`text-xs sm:text-sm font-bold truncate ${notif.isUnread ? 'text-adv-slate' : 'text-gray-500'}`}>
                                    {notif.title}
                                  </h4>
                                  <span className="text-[9px] sm:text-[10px] text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1 leading-relaxed">
                                  {notif.message}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {notif.isUnread && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-adv-orange shrink-0" />
                                )}
                                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-adv-orange transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 sm:p-12 text-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-gray-400">{t.noNotifications}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Link 
                to="/dashboard" 
                className="hidden md:block p-2 text-adv-slate hover:text-adv-orange transition-all"
                title={t.myTickets}
              >
                <Ticket className="w-5 h-5" />
              </Link>

              <Link 
                to="/account" 
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
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 sm:p-10"
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
    </>
  );
}

const categories_list = [
  { id: 'workshop', label: 'Workshops', icon: Lightbulb },
  { id: 'sports', label: 'Adventure and Tour', icon: Mountain },
  { id: 'festival', label: 'Festivals', icon: PartyPopper },
  { id: 'voucher', label: 'Vouchers', icon: Ticket },
];

