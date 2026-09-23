import React from 'react';
import { Users, TrendingUp, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface AccountMiniDashboardProps {
  theme: 'light' | 'dark';
  lang: 'en' | 'lo';
  totalAttendees: number;
  totalCheckedIn: number;
  totalIncome: number;
  onNavigateToEvents?: () => void;
  onNavigateToPayouts?: () => void;
  isSingleEvent?: boolean;
  eventTitle?: string;
}

export const AccountMiniDashboard: React.FC<AccountMiniDashboardProps> = ({
  theme,
  lang,
  totalAttendees,
  totalCheckedIn,
  totalIncome,
  onNavigateToEvents,
  onNavigateToPayouts,
  isSingleEvent = false,
  eventTitle
}) => {
  const checkinRate = totalAttendees > 0 
    ? Math.round((totalCheckedIn / totalAttendees) * 100) 
    : 0;

  const formattedIncome = new Intl.NumberFormat('lo-LA').format(totalIncome);

  return (
    <div className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-7 mb-6 sm:mb-8 border shadow-sm transition-all ${
      theme === 'dark' 
        ? 'bg-zinc-900 border-zinc-800/80 text-white' 
        : 'bg-white border-gray-100 text-adv-slate'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              {isSingleEvent 
                ? (lang === 'lo' ? `ສະຖິຕິ: ${eventTitle || 'ກິດຈະກຳນີ້'}` : `Metrics: ${eventTitle || 'Current Event'}`)
                : (lang === 'lo' ? 'ພາບລວມຜູ້ຈັດງານ (Mini Dashboard)' : 'Organizer Mini Dashboard')
              }
            </h3>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-400 font-medium mt-0.5">
            {isSingleEvent
              ? (lang === 'lo' ? 'ຕິດຕາມຈຳນວນຜູ້ເຂົ້າຮ່ວມ ແລະ ລາຍຮັບຈາກກິດຈະກຳນີ້' : 'Real-time attendee attendance and ticket sales income for this event')
              : (lang === 'lo' ? 'ສະຫຼຸບຈຳນວນຜູ້ເຂົ້າຮ່ວມ ແລະ ລາຍຮັບລວມທັງໝົດຈາກການຂາຍປີ້' : 'Summary of all registered attendees, check-ins, and ticket revenue')
            }
          </p>
        </div>

        {!isSingleEvent && onNavigateToEvents && (
          <button
            onClick={onNavigateToEvents}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-adv-orange hover:bg-orange-100 dark:hover:bg-orange-900/60 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>{lang === 'lo' ? 'ຈັດການກິດຈະກຳ' : 'Manage Events'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total Attendees */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          theme === 'dark' 
            ? 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700' 
            : 'bg-indigo-50/30 border-indigo-100/60 hover:border-indigo-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              {lang === 'lo' ? 'ຜູ້ເຂົ້າຮ່ວມ' : 'Attendees'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-adv-slate dark:text-white tracking-tight">
              {totalAttendees.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-400 dark:text-zinc-400">
              {lang === 'lo' ? 'ຄົນ' : 'attendees'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
            <span>{lang === 'lo' ? 'ເຊັກອິນແລ້ວ' : 'Checked In'}: {totalCheckedIn}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {totalAttendees - totalCheckedIn} {lang === 'lo' ? 'ລໍຖ້າ' : 'pending'}
            </span>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div 
          onClick={onNavigateToPayouts}
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${onNavigateToPayouts ? 'cursor-pointer group' : ''} ${
            theme === 'dark' 
              ? 'bg-zinc-950/50 border-zinc-800 hover:border-emerald-800/80' 
              : 'bg-emerald-50/30 border-emerald-100/60 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              {lang === 'lo' ? 'ລາຍໄດ້ / ລາຍຮັບ' : 'Income / Revenue'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
              {formattedIncome}
            </span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 shrink-0">
              ₭
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span>{lang === 'lo' ? 'ຈາກການຂາຍປີ້' : 'Ticket Sales'}</span>
            {onNavigateToPayouts && (
              <span className="underline font-bold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                {lang === 'lo' ? 'ເບິ່ງໃບບິນ' : 'View Payouts'}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Check-in Completion Rate */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          theme === 'dark' 
            ? 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700' 
            : 'bg-orange-50/30 border-orange-100/60 hover:border-orange-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              {lang === 'lo' ? 'ອັດຕາການເຊັກອິນ' : 'Check-in Rate'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-adv-orange flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-adv-slate dark:text-white tracking-tight">
              {checkinRate}%
            </span>
            <span className="text-xs font-bold text-gray-400 dark:text-zinc-400">
              {totalCheckedIn} / {totalAttendees}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-gray-200/70 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-adv-orange h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, checkinRate))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMiniDashboard;
