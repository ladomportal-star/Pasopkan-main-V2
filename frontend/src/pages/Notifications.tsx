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
  SlidersHorizontal,
  RefreshCw,
  Settings,
  Mail,
  Smartphone,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import NotificationsEmptyState from '../components/NotificationsEmptyState';
import PullToRefresh from '../components/PullToRefresh';
import { safeStorage } from '../lib/storage';
import { useNotifications, timeAgo } from '../context/NotificationsContext';
import { AppNotification } from '../types';

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
};

const translations = {
  en: {
    backToAccount: 'Back to Account',
    notifications: 'Notifications',
    allTab: 'All',
    unreadTab: 'Unread',
    settingsTab: 'Settings',
    markAllRead: 'Mark all as read',
    allMarkedRead: 'All notifications marked as read',
    clearAll: 'Clear all',
    clearedAll: 'All notifications cleared',

    preferencesTitle: 'Notification Settings',
    preferencesDesc: 'Manage how and when you receive notifications across Pasopkan',
    deliveryChannels: 'Delivery Channels',
    deliveryChannelsDesc: 'Choose where and how you want to receive notifications',
    pushNotif: 'Push Notifications',
    pushNotifDesc: 'Get alerts on your device for event reminders.',
    emailNotif: 'Email Notifications',
    emailNotifDesc: 'Receive updates about your upcoming events.',
    settingsUpdated: 'Settings updated',
    saveSettings: 'Save Preferences',
    savedSettings: 'Notification preferences saved!',
    quickSettings: 'Configure Settings',

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
    settingsTab: 'ຕັ້ງຄ່າການແຈ້ງເຕືອນ',
    markAllRead: 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ',
    allMarkedRead: 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດຮຽບຮ້ອຍ',
    clearAll: 'ລຶບທັງໝົດ',
    clearedAll: 'ລຶບການແຈ້ງເຕືອນທັງໝົດແລ້ວ',

    preferencesTitle: 'ຕັ້ງຄ່າການແຈ້ງເຕືອນ',
    preferencesDesc: 'ຈັດການວິທີ ແລະ ເວລາທີ່ທ່ານຕ້ອງການຮັບການແຈ້ງເຕືອນຕ່າງໆ ໃນ Pasopkan',
    deliveryChannels: 'ຊ່ອງທາງການຮັບແຈ້ງເຕືອນ',
    deliveryChannelsDesc: 'ເລືອກຊ່ອງທາງທີ່ທ່ານຕ້ອງການຮັບຂ່າວສານ ແລະ ການແຈ້ງເຕືອນ',
    pushNotif: 'ການແຈ້ງເຕືອນໃນມືຖື',
    pushNotifDesc: 'ຮັບການແຈ້ງເຕືອນໃນອຸປະກອນຂອງທ່ານສຳລັບການເຕືອນກິດຈະກຳ.',
    emailNotif: 'ການແຈ້ງເຕືອນຜ່ານອີເມວ',
    emailNotifDesc: 'ຮັບຂໍ້ມູນອັບເດດກ່ຽວກັບກິດຈະກຳທີ່ຈະມາເຖິງຂອງທ່ານ.',
    settingsUpdated: 'ອັບເດດການຕັ້ງຄ່າສຳເລັດແລ້ວ',
    saveSettings: 'ບັນທຶກການຕັ້ງຄ່າ',
    savedSettings: 'ບັນທຶກການຕັ້ງຄ່າການແຈ້ງເຕືອນສຳເລັດແລ້ວ!',
    quickSettings: 'ຕັ້ງຄ່າການແຈ້ງເຕືອນ',

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

  // Tab is kept in the URL (?tab=settings) so a link into settings works directly.
  const queryTab = searchParams.get('tab');
  const initialTab = queryTab === 'settings' ? 'settings' : queryTab === 'unread' ? 'unread' : 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'settings' && activeTab !== 'settings') setActiveTab('settings');
    else if (tabParam === 'unread' && activeTab !== 'unread') setActiveTab('unread');
    else if (tabParam === 'all' && activeTab !== 'all') setActiveTab('all');
  }, [searchParams]);

  const handleTabChange = (newTab: 'all' | 'unread' | 'settings') => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Delivery-channel preferences are a local-only setting (no backend table yet).
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = safeStorage.getItem('pasopkan_notification_preferences');
      if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse notification preferences', e);
    }
    return DEFAULT_PREFERENCES;
  });

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

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        safeStorage.setItem('pasopkan_notification_preferences', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save notification preferences', e);
      }
      triggerToast(t.settingsUpdated);
      return updated;
    });
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
        title={`${activeTab === 'settings' ? t.preferencesTitle : t.notifications} | Pasopkan`}
        description="View and configure notification preferences on Pasopkan."
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
              {activeTab === 'settings' ? <Settings className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-adv-slate">
                  {activeTab === 'settings' ? t.preferencesTitle : t.notifications}
                </h1>
                {activeTab !== 'settings' && unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-adv-orange text-white text-xs font-bold shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
                {activeTab === 'settings'
                  ? t.preferencesDesc
                  : lang === 'lo'
                    ? 'ຕິດຕາມຂ່າວສານ, ການຈອງ ແລະ ກິດຈະກຳຂອງທ່ານ'
                    : 'Stay informed about your events, bookings, and activities'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeTab !== 'settings' && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        {activeTab !== 'settings' && (
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

              <button
                onClick={() => handleTabChange('settings')}
                // Only rendered while activeTab !== 'settings' (this whole block is guarded
                // above), so this button is never the active one - no ternary needed here.
                className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white text-gray-500 hover:text-adv-slate border border-gray-100 hover:border-gray-200"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t.settingsTab}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastRefreshedAt && (
                <span className="hidden md:inline text-[11px] text-gray-400 font-medium">
                  {t.lastUpdated} {lastRefreshedAt}
                </span>
              )}
              <button
                onClick={() => handleTabChange('settings')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-adv-orange transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="inline">{t.quickSettings}</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications List or Empty State */}
        {activeTab !== 'settings' && (
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
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-sm">
              <div className="mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-base sm:text-lg font-bold text-adv-slate flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-adv-orange" />
                  {t.deliveryChannels}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">{t.deliveryChannelsDesc}</p>
              </div>

              <div className="divide-y divide-gray-50">
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-adv-orange flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-adv-slate leading-snug">{t.pushNotif}</h4>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed mt-0.5">{t.pushNotifDesc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.pushEnabled}
                      onChange={() => handleTogglePref('pushEnabled')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-adv-orange"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-adv-slate leading-snug">{t.emailNotif}</h4>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed mt-0.5">{t.emailNotifDesc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.emailEnabled}
                      onChange={() => handleTogglePref('emailEnabled')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-adv-orange"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => triggerToast(t.savedSettings)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{t.saveSettings}</span>
              </button>
            </div>
          </motion.div>
        )}
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
