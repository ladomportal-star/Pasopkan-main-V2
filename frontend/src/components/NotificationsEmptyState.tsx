import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Bell, Sparkles, CheckCircle2, Compass, Calendar, Ticket, Tag, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NotificationsEmptyStateProps {
  filter?: 'all' | 'unread';
  hasAnyNotifications?: boolean;
  onViewAll?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function NotificationsEmptyState({
  filter = 'all',
  hasAnyNotifications = false,
  onViewAll,
  onRefresh,
  isRefreshing = false
}: NotificationsEmptyStateProps) {
  const { lang } = useLanguage();

  const isUnreadFilter = filter === 'unread';

  const t = {
    en: {
      headline: isUnreadFilter ? "You're All Caught Up!" : "No New Notifications",
      subheadline: isUnreadFilter 
        ? "No unread alerts waiting for you. All your updates have been reviewed."
        : "You don't have any notifications right now. Pull down to check for new updates, or explore upcoming events.",
      pillReminders: "Event Reminders",
      pillTickets: "Ticket Updates",
      pillDeals: "Special Offers",
      exploreBtn: "Explore Activities",
      viewAllBtn: "View All Notifications",
      refreshBtn: "Check Server Updates",
      allClearBadge: "All Clear",
      pullHint: "Tip: Pull down or drag to refresh list anytime"
    },
    lo: {
      headline: isUnreadFilter ? "ກວດເບິ່ງຄົບຖ້ວນແລ້ວ!" : "ຍັງບໍ່ມີການແຈ້ງເຕືອນໃໝ່",
      subheadline: isUnreadFilter
        ? "ບໍ່ມີການແຈ້ງເຕືອນທີ່ຍັງບໍ່ໄດ້ອ່ານ. ທ່ານໄດ້ກວດສອບທຸກລາຍການຮຽບຮ້ອຍແລ້ວ."
        : "ທ່ານບໍ່ມີລາຍການແຈ້ງເຕືອນໃນເວລານີ້. ດຶງລົງເພື່ອໂຫຼດອັບເດດຈາກເຊີບເວີ ຫຼື ຄົ້ນຫາກິດຈະກຳໃໝ່.",
      pillReminders: "ການເຕືອນກິດຈະກຳ",
      pillTickets: "ອັບເດດປີ້ເຂົ້າຊົມ",
      pillDeals: "ໂປຣໂມຊັ່ນພິເສດ",
      exploreBtn: "ຄົ້ນຫາກິດຈະກຳ",
      viewAllBtn: "ເບິ່ງການແຈ້ງເຕືອນທັງໝົດ",
      refreshBtn: "ກວດສອບອັບເດດຈາກເຊີບເວີ",
      allClearBadge: "ອັບເດດຄົບແລ້ວ",
      pullHint: "ຄຳແນະນຳ: ດຶງລົງເພື່ອໂຫຼດຂໍ້ມູນໃໝ່ໄດ້ທຸກເວລາ"
    }
  }[lang];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white border border-gray-100 rounded-3xl md:rounded-[2.5rem] p-8 md:p-14 flex flex-col items-center text-center shadow-sm relative overflow-hidden"
    >
      {/* Soft warm decorative background aura */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Animated illustration centerpiece */}
      <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
        {/* Concentric outer ring */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-orange-50/80 to-amber-50/40 border border-orange-200/50 flex items-center justify-center relative shadow-inner">
          {/* Subtle animated pulsed glow ring */}
          <div className="absolute inset-0 rounded-full border border-orange-300/30 animate-ping opacity-25" style={{ animationDuration: '3s' }} />

          {/* Floating animated bell */}
          <motion.div
            animate={{ 
              y: [0, -6, 0],
              rotate: [0, -4, 4, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white shadow-lg shadow-orange-500/10 border border-orange-100 flex items-center justify-center text-adv-orange z-10"
          >
            <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-adv-orange drop-shadow-sm" />
          </motion.div>
        </div>

        {/* Floating Sparkle Badge */}
        <motion.div
          animate={{
            y: [0, -4, 0],
            scale: [1, 1.06, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5
          }}
          className="absolute -top-2 -right-2 sm:-top-1 sm:-right-1 bg-amber-400 text-white p-2 rounded-full shadow-md border-2 border-white z-20 flex items-center justify-center"
          title={t.allClearBadge}
        >
          <Sparkles className="w-4 h-4 text-white fill-white" />
        </motion.div>

        {/* Floating Checkmark Pill */}
        <motion.div
          animate={{
            y: [0, 4, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
          className="absolute -bottom-2 -left-2 bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-md border-2 border-white text-[11px] font-extrabold z-20 flex items-center gap-1"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">{t.allClearBadge}</span>
        </motion.div>
      </div>

      {/* Typography */}
      <h3 className="text-xl sm:text-2xl font-extrabold text-adv-slate tracking-tight mb-2 sm:mb-3 max-w-md">
        {t.headline}
      </h3>
      <p className="text-gray-400 font-medium text-xs sm:text-sm max-w-md leading-relaxed mb-6 sm:mb-8">
        {t.subheadline}
      </p>

      {/* Helpful feature pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-8 max-w-lg">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50/70 border border-orange-100 text-adv-slate text-[11px] sm:text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-adv-orange" />
          {t.pillReminders}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/70 border border-blue-100 text-adv-slate text-[11px] sm:text-xs font-semibold">
          <Ticket className="w-3.5 h-3.5 text-blue-500" />
          {t.pillTickets}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/70 border border-amber-100 text-adv-slate text-[11px] sm:text-xs font-semibold">
          <Tag className="w-3.5 h-3.5 text-amber-500" />
          {t.pillDeals}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-adv-slate hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md shadow-adv-slate/10 hover:shadow-lg transition-all active:scale-95"
        >
          <Compass className="w-4 h-4 text-adv-orange" />
          <span>{t.exploreBtn}</span>
        </Link>

        {isUnreadFilter && hasAnyNotifications && onViewAll && (
          <button
            onClick={onViewAll}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-adv-slate text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
          >
            <span>{t.viewAllBtn}</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-adv-orange text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t.refreshBtn}</span>
          </button>
        )}
      </div>

      {/* Subtle pull-to-refresh hint */}
      <p className="text-[11px] text-gray-400 mt-6 font-medium">
        {t.pullHint}
      </p>
    </motion.div>
  );
}
