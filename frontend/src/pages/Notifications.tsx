import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Ticket,
  Info,
  Star,
  ShieldCheck,
  AlertCircle,
  XCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import NotificationsEmptyState from '../components/NotificationsEmptyState';
import PullToRefresh from '../components/PullToRefresh';
import { useNotifications, timeAgo } from '../context/NotificationsContext';
import { AppNotification } from '../types';

const translations = {
  en: {
    backToAccount: 'Back to Account',
    notifications: 'Notifications',
    allTab: 'All',
    unreadTab: 'Unread',
    markAllRead: 'Mark all as read',
    allMarkedRead: 'All notifications marked as read',
    clearAll: 'Clear all',
    clearedAll: 'All notifications cleared',


    refreshBtn: 'Refresh',
    refreshing: 'Updating...',
    refreshSuccess: 'Notifications updated from server',
    refreshError: 'Could not reach the server. Showing your last synced notifications.',
    lastUpdated: 'Updated',
  },
  lo: {
    backToAccount: 'ກັບຄືນໜ້າບັນຊີ',
    notifications: 'ການແຈ້ງເຕືອນ',
    allTab: 'ທັງໝົດ',
    unreadTab: 'ຍັງບໍ່ໄດ້ອ່ານ',
    markAllRead: 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ',
    allMarkedRead: 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດຮຽບຮ້ອຍ',
    clearAll: 'ລຶບທັງໝົດ',
    clearedAll: 'ລຶບການແຈ້ງເຕືອນທັງໝົດແລ້ວ',


    refreshBtn: 'ໂຫຼດໃໝ່',
    refreshing: 'ກຳລັງອັບເດດ...',
    refreshSuccess: 'ອັບເດດການແຈ້ງເຕືອນຈາກເຊີບເວີສຳເລັດແລ້ວ',
    refreshError: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້. ສະແດງການແຈ້ງເຕືອນທີ່ຊິງຄ໌ຄັ້ງຫຼ້າສຸດ.',
    lastUpdated: 'ອັບເດດເມື່ອ',
  },
};

function getNotificationIcon(type?: string, notif?: AppNotification) {
  if (notif?.status === 'rejected') {
    return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-100' };
  }
  if (notif?.status === 'approved' || type === 'verified') {
    return { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' };
  }
  switch (type) {
    case 'upcomingEvent':
      return { icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' };
    case 'ticket':
      return { icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' };
    case 'promo':
      return { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' };
    case 'system':
      return { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' };
    default:
      return { icon: Info, color: 'text-adv-orange', bg: 'bg-orange-50 border-orange-100' };
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.05, 0.4), duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useLanguage();
  const t = translations[lang];

  const {
    notifications,
    unreadCount,
    loading,
    refreshing: isRefreshing,
    lastRefreshedAt: lastRefreshedDate,
    refresh,
    markRead,
    markAllRead,
    remove,
    clearAll,
  } = useNotifications();

  // Keep the inbox filter in the URL for shareable all/unread views.
  const queryTab = searchParams.get('tab');
  const initialTab = queryTab === 'unread' ? 'unread' : 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'unread' && activeTab !== 'unread') setActiveTab('unread');
    else if (tabParam === 'all' && activeTab !== 'all') setActiveTab('all');
  }, [searchParams]);

  const handleTabChange = (newTab: 'all' | 'unread') => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const lastRefreshedAt = lastRefreshedDate
    ? lastRefreshedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };


  const fetchNotificationsFromServer = async () => {
    const ok = await refresh();
    triggerToast(ok ? t.refreshSuccess : t.refreshError);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return n.isUnread;
    return true;
  });

  const handleMarkAllRead = () => {
    void markAllRead();
    triggerToast(t.allMarkedRead);
  };

  const handleClearAll = () => {
    void clearAll();
    triggerToast(t.clearedAll);
  };

  const handleItemClick = (id: string) => {
    void markRead(id);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    void remove(id);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-8">
      <SEO
        title={`${t.notifications} | Pasopkan`}
        description="View your account notifications on Pasopkan."
        noindex={true}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-16">
        <button
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-5 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.backToAccount}</span>
        </button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-adv-orange shadow-sm shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-adv-slate">
                  {t.notifications}
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-adv-orange text-white text-xs font-bold shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
                {lang === 'lo'
                  ? 'ຕິດຕາມຂ່າວສານ, ການຈອງ ແລະ ກິດຈະກຳຂອງທ່ານ'
                  : 'Stay informed about your events, bookings, and activities'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={fetchNotificationsFromServer}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-adv-slate text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                  title={t.refreshBtn}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-adv-orange ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? t.refreshing : t.refreshBtn}</span>
                </button>

                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-adv-slate text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-adv-orange" />
                        <span className="hidden sm:inline">{t.markAllRead}</span>
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200 text-gray-400 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      title={t.clearAll}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.clearAll}</span>
                    </button>
                  </>
                )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-200/80 pb-3 gap-2 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-adv-slate text-white shadow-sm'
                    : 'bg-white text-gray-500 hover:text-adv-slate border border-gray-100 hover:border-gray-200'
                }`}
              >
                <span>{t.allTab}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {notifications.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('unread')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-adv-orange text-white shadow-sm'
                    : 'bg-white text-gray-500 hover:text-adv-slate border border-gray-100 hover:border-gray-200'
                }`}
              >
                <span>{t.unreadTab}</span>
                {unreadCount > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      activeTab === 'unread' ? 'bg-white/25 text-white' : 'bg-orange-100 text-adv-orange font-bold'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastRefreshedAt && (
                <span className="hidden md:inline text-[11px] text-gray-400 font-medium">
                  {t.lastUpdated} {lastRefreshedAt}
                </span>
              )}
            </div>
          </div>

        {/* Notifications List or Empty State */}
          <div className="mb-8">
            <PullToRefresh onRefresh={fetchNotificationsFromServer} isRefreshing={isRefreshing}>
              {filteredNotifications.length === 0 ? (
                <NotificationsEmptyState
                  filter={activeTab}
                  hasAnyNotifications={notifications.length > 0}
                  onViewAll={() => handleTabChange('all')}
                  onRefresh={fetchNotificationsFromServer}
                  isRefreshing={isRefreshing || loading}
                />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notif, index) => {
                      const iconInfo = getNotificationIcon(notif.type, notif);
                      const IconComponent = iconInfo.icon;
                      const titleText = lang === 'lo' && notif.titleLo ? notif.titleLo : notif.title;
                      const messageText = lang === 'lo' && notif.messageLo ? notif.messageLo : notif.message;
                      const timeText = timeAgo(notif.createdAt, lang);

                      return (
                        <motion.div
                          key={notif.id}
                          layout
                          custom={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          onClick={() => handleItemClick(notif.id)}
                          className={`group p-4 sm:p-5 rounded-2xl md:rounded-3xl border transition-all cursor-pointer relative flex items-start gap-3.5 sm:gap-4 ${
                            notif.isUnread
                              ? 'bg-white border-orange-200/80 shadow-sm ring-1 ring-orange-100'
                              : 'bg-white/80 hover:bg-white border-gray-100 text-gray-600'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 ${iconInfo.bg} ${iconInfo.color}`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`text-sm sm:text-base font-bold truncate ${
                                  notif.isUnread ? 'text-adv-slate' : 'text-gray-700'
                                }`}
                              >
                                {titleText}
                              </h4>
                              {notif.isUnread && (
                                <span className="w-2 h-2 rounded-full bg-adv-orange shrink-0 animate-pulse" />
                              )}
                              {notif.status === 'approved' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider shrink-0">
                                  {lang === 'lo' ? 'ອະນຸມັດແລ້ວ' : 'Approved'}
                                </span>
                              )}
                              {notif.status === 'rejected' && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider shrink-0">
                                  {lang === 'lo' ? 'ຖືກປະຕິເສດ' : 'Rejected'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2 sm:line-clamp-none">
                              {messageText}
                            </p>
                            {notif.rejectionReason && (
                              <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                                <span className="font-bold">{lang === 'lo' ? 'ເຫດຜົນ: ' : 'Reason: '}</span>
                                {notif.rejectionReason}
                              </div>
                            )}
                            <span className="text-[11px] text-gray-400 font-medium mt-2 block">{timeText}</span>
                          </div>

                          <button
                            onClick={(e) => handleDeleteItem(e, notif.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-gray-100 absolute top-3.5 right-3.5 cursor-pointer"
                            title={lang === 'lo' ? 'ລຶບ' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </PullToRefresh>
          </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
