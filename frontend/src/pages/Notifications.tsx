import { useState } from "react";
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
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/SEO";
import NotificationsEmptyState from "../components/NotificationsEmptyState";
import PullToRefresh from "../components/PullToRefresh";
import { useNotifications, timeAgo } from "../context/NotificationsContext";

const translations = {
  en: {
    backToAccount: "Back",
    notifications: "Notifications",
    allTab: "All",
    unreadTab: "Unread",
    markAllRead: "Mark all as read",
    allMarkedRead: "All notifications marked as read",
    clearAll: "Clear all",
    clearedAll: "All notifications cleared",
    emailNotif: "Email Notifications",
    emailNotifDesc: "Receive updates about your upcoming events.",
    pushNotif: "Push Notifications",
    pushNotifDesc: "Get alerts on your device for event reminders.",
    marketingNotif: "Marketing Emails",
    marketingNotifDesc: "Receive news, special offers, and promotions.",
    settingsUpdated: "Settings updated",
    preferencesTitle: "Notification Preferences",
    preferencesDesc: "Choose how and when you want to be notified",
    refreshBtn: "Refresh",
    refreshing: "Updating...",
    refreshSuccess: "Notifications updated from server",
    refreshError: "Could not reach the server. Showing your last synced notifications.",
    lastUpdated: "Updated",
  },
  lo: {
    backToAccount: "ກັບຄືນ",
    notifications: "ການແຈ້ງເຕືອນ",
    allTab: "ທັງໝົດ",
    unreadTab: "ຍັງບໍ່ໄດ້ອ່ານ",
    markAllRead: "ໝາຍວ່າອ່ານແລ້ວທັງໝົດ",
    allMarkedRead: "ໝາຍວ່າອ່ານແລ້ວທັງໝົດຮຽບຮ້ອຍ",
    clearAll: "ລຶບທັງໝົດ",
    clearedAll: "ລຶບການແຈ້ງເຕືອນທັງໝົດແລ້ວ",
    emailNotif: "ການແຈ້ງເຕືອນຜ່ານອີເມວ",
    emailNotifDesc: "ຮັບຂໍ້ມູນອັບເດດກ່ຽວກັບກິດຈະກຳທີ່ຈະມາເຖິງຂອງທ່ານ.",
    pushNotif: "ການແຈ້ງເຕືອນໃນມືຖື",
    pushNotifDesc: "ຮັບການແຈ້ງເຕືອນໃນອຸປະກອນຂອງທ່ານສຳລັບການເຕືອນກິດຈະກຳ.",
    marketingNotif: "ອີເມວການຕະຫຼາດ",
    marketingNotifDesc: "ຮັບຂ່າວສານ, ຂໍ້ສະເໜີພິເສດ, ແລະ ໂປຣໂມຊັ່ນ.",
    settingsUpdated: "ອັບເດດການຕັ້ງຄ່າສຳເລັດແລ້ວ",
    preferencesTitle: "ການຕັ້ງຄ່າການແຈ້ງເຕືອນ",
    preferencesDesc: "ເລືອກວິທີ ແລະ ເວລາທີ່ທ່ານຕ້ອງການຮັບການແຈ້ງເຕືອນ",
    refreshBtn: "ໂຫຼດໃໝ່",
    refreshing: "ກຳລັງອັບເດດ...",
    refreshSuccess: "ອັບເດດການແຈ້ງເຕືອນຈາກເຊີບເວີສຳເລັດແລ້ວ",
    refreshError: "ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້. ສະແດງການແຈ້ງເຕືອນທີ່ຊິງຄ໌ຄັ້ງຫຼ້າສຸດ.",
    lastUpdated: "ອັບເດດເມື່ອ",
  },
};

function getNotificationIcon(type?: string) {
  switch (type) {
    case "upcomingEvent":
      return {
        icon: Calendar,
        color: "text-orange-500",
        bg: "bg-orange-50 border-orange-100",
      };
    case "ticket":
      return {
        icon: Ticket,
        color: "text-blue-500",
        bg: "bg-blue-50 border-blue-100",
      };
    case "promo":
      return {
        icon: Star,
        color: "text-amber-500",
        bg: "bg-amber-50 border-amber-100",
      };
    case "verified":
      return {
        icon: ShieldCheck,
        color: "text-emerald-500",
        bg: "bg-emerald-50 border-emerald-100",
      };
    case "system":
      return {
        icon: AlertCircle,
        color: "text-purple-500",
        bg: "bg-purple-50 border-purple-100",
      };
    default:
      return {
        icon: Info,
        color: "text-adv-orange",
        bg: "bg-orange-50 border-orange-100",
      };
  }
}

export default function Notifications() {
  const navigate = useNavigate();
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

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const lastRefreshedAt = lastRefreshedDate
    ? lastRefreshedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 2500);
  };

  const fetchNotificationsFromServer = async () => {
    const ok = await refresh();
    triggerToast(ok ? t.refreshSuccess : t.refreshError);
  };

  const handleToggleSetting = () => {
    triggerToast(t.settingsUpdated);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return n.isUnread;
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
        description="View and configure notification preferences on Pasopkan."
        noindex={true}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-16">
        {/* Navigation back */}
        <button
          onClick={() => navigate(-1)}
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
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchNotificationsFromServer}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-adv-slate text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title={t.refreshBtn}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-adv-orange ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {isRefreshing ? t.refreshing : t.refreshBtn}
              </span>
            </button>

            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-adv-slate text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-adv-orange" />
                    <span>{t.markAllRead}</span>
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

        {/* Tabs / Filter Controls */}
        <div className="flex items-center justify-between mb-5 border-b border-gray-200/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "all"
                  ? "bg-adv-slate text-white shadow-sm"
                  : "bg-white text-gray-500 hover:text-adv-slate border border-gray-100"
              }`}
            >
              <span>{t.allTab}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "all"
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("unread")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "unread"
                  ? "bg-adv-orange text-white shadow-sm"
                  : "bg-white text-gray-500 hover:text-adv-slate border border-gray-100"
              }`}
            >
              <span>{t.unreadTab}</span>
              {unreadCount > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    activeTab === "unread"
                      ? "bg-white/25 text-white"
                      : "bg-orange-100 text-adv-orange font-bold"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshedAt && (
              <span className="hidden md:inline text-[11px] text-gray-400 font-medium">
                {t.lastUpdated} {lastRefreshedAt}
              </span>
            )}

            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-adv-orange transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.preferencesTitle}</span>
              {showPreferences ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Notifications List or Empty State with Pull to Refresh */}
        <div className="mb-8">
          <PullToRefresh
            onRefresh={fetchNotificationsFromServer}
            isRefreshing={isRefreshing}
          >
            {filteredNotifications.length === 0 ? (
              <NotificationsEmptyState
                filter={activeTab}
                hasAnyNotifications={notifications.length > 0}
                onViewAll={() => setActiveTab("all")}
                onRefresh={fetchNotificationsFromServer}
                isRefreshing={isRefreshing || loading}
              />
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => {
                  const iconInfo = getNotificationIcon(notif.type);
                  const IconComponent = iconInfo.icon;
                  const titleText =
                    lang === "lo" && notif.titleLo
                      ? notif.titleLo
                      : notif.title;
                  const messageText =
                    lang === "lo" && notif.messageLo
                      ? notif.messageLo
                      : notif.message;
                  const timeText =
                    timeAgo(notif.createdAt, lang);

                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleItemClick(notif.id)}
                      className={`group p-4 sm:p-5 rounded-2xl md:rounded-3xl border transition-all cursor-pointer relative flex items-start gap-3.5 sm:gap-4 ${
                        notif.isUnread
                          ? "bg-white border-orange-200/80 shadow-sm ring-1 ring-orange-100"
                          : "bg-white/80 hover:bg-white border-gray-100 text-gray-600"
                      }`}
                    >
                      {/* Icon Badge */}
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 ${iconInfo.bg} ${iconInfo.color}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`text-sm sm:text-base font-bold truncate ${
                              notif.isUnread
                                ? "text-adv-slate"
                                : "text-gray-700"
                            }`}
                          >
                            {titleText}
                          </h4>
                          {notif.isUnread && (
                            <span className="w-2 h-2 rounded-full bg-adv-orange shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2 sm:line-clamp-none">
                          {messageText}
                        </p>
                        <span className="text-[11px] text-gray-400 font-medium mt-2 block">
                          {timeText}
                        </span>
                      </div>

                      {/* Individual Delete Action */}
                      <button
                        onClick={(e) => handleDeleteItem(e, notif.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-gray-100 absolute top-3.5 right-3.5 cursor-pointer"
                        title={lang === "lo" ? "ລຶບ" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </PullToRefresh>
        </div>

        {/* Collapsible Notification Preferences Section */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="mb-5 pb-4 border-b border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-adv-slate">
                    {t.preferencesTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">
                    {t.preferencesDesc}
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-adv-slate">
                        {t.emailNotif}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium">
                        {t.emailNotifDesc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                        onChange={handleToggleSetting}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-adv-orange"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-adv-slate">
                        {t.pushNotif}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium">
                        {t.pushNotifDesc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                        onChange={handleToggleSetting}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-adv-orange"></div>
                    </label>
                  </div>

                  {/* Marketing Emails */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-adv-slate">
                        {t.marketingNotif}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium">
                        {t.marketingNotifDesc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={handleToggleSetting}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-adv-orange"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">
                {toastMessage}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
