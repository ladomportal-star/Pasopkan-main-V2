import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  targetTime?: string;
  lang: 'en' | 'lo';
}

const translations = {
  en: {
    startsIn: 'Starts In',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    inProgress: 'Happening Now',
    inProgressDesc: 'This activity has started and is currently in progress!',
    concluded: 'Session Concluded',
    concludedDesc: 'This session or activity is already completed.',
    invalidDate: 'No date selected',
  },
  lo: {
    startsIn: 'ຈະເລີ່ມຕົ້ນໃນອີກ',
    days: 'ວັນ',
    hours: 'ຊົ່ວໂມງ',
    minutes: 'ນາທີ',
    seconds: 'ວິນາທີ',
    inProgress: 'ກຳລັງດຳເນີນຢູ່',
    inProgressDesc: 'ກິດຈະກຳນີ້ໄດ້ເລີ່ມຂຶ້ນແລ້ວ ແລະ ກຳລັງດຳເນີນຢູ່!',
    concluded: 'ສິ້ນສຸດກິດຈະກຳ',
    concludedDesc: 'ກິດຈະກຳ ຫຼື ຮອບເວລານີ້ໄດ້ສິ້ນສຸດລົງແລ້ວ.',
    invalidDate: 'ຍັງບໍ່ໄດ້ເລືອກວັນທີ',
  }
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  targetTime = '00:00',
  lang
}) => {
  const t = translations[lang];

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    status: 'upcoming' | 'progress' | 'concluded' | 'invalid';
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: 'upcoming'
  });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(prev => ({ ...prev, status: 'invalid' }));
      return;
    }

    const calculateTimeLeft = () => {
      // Parse the date and time strings correctly
      // Format expected: YYYY-MM-DD and HH:MM
      const dateParts = targetDate.split('-');
      const timeParts = targetTime ? targetTime.split(':') : ['00', '00'];

      if (dateParts.length !== 3) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'invalid' as const };
      }

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
      const day = parseInt(dateParts[2], 10);
      const hoursStr = timeParts[0] || '00';
      const minutesStr = timeParts[1] || '00';
      const parsedHours = parseInt(hoursStr, 10);
      const parsedMinutes = parseInt(minutesStr, 10);

      const target = new Date(year, month, day, parsedHours, parsedMinutes, 0);
      const now = new Date();

      const diffMs = target.getTime() - now.getTime();

      if (diffMs > 0) {
        // Upcoming event
        const secs = Math.floor(diffMs / 1000);
        const mins = Math.floor(secs / 60);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);

        return {
          days,
          hours: hrs % 24,
          minutes: mins % 60,
          seconds: secs % 60,
          status: 'upcoming' as const
        };
      } else {
        // Event is in the past or currently running
        // Let's assume an event duration of 4 hours
        const durationThresholdMs = 4 * 60 * 60 * 1000;
        if (Math.abs(diffMs) < durationThresholdMs) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'progress' as const };
        } else {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'concluded' as const };
        }
      }
    };

    // Initial update
    setTimeLeft(calculateTimeLeft());

    // Setup 1s interval
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  if (timeLeft.status === 'invalid') {
    return (
      <div className="flex items-center gap-2 p-3.5 bg-gray-50 border border-gray-150 rounded-2xl text-xs text-gray-400 font-semibold justify-center">
        <AlertCircle className="w-4 h-4" />
        <span>{t.invalidDate}</span>
      </div>
    );
  }

  if (timeLeft.status === 'progress') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 shadow-sm"
      >
        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl relative shrink-0">
          <Clock className="w-4.5 h-4.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block leading-none mb-1">
            {t.inProgress}
          </span>
          <p className="text-xs text-emerald-800 font-bold leading-normal">
            {t.inProgressDesc}
          </p>
        </div>
      </motion.div>
    );
  }

  if (timeLeft.status === 'concluded') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex items-start gap-3 shadow-inner"
      >
        <div className="p-2 bg-gray-200/60 text-gray-400 rounded-xl shrink-0">
          <CheckCircle2 className="w-4.5 h-4.5 text-gray-500" />
        </div>
        <div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block leading-none mb-1">
            {t.concluded}
          </span>
          <p className="text-xs text-gray-400 font-semibold leading-normal">
            {t.concludedDesc}
          </p>
        </div>
      </motion.div>
    );
  }

  const formatNum = (num: number) => String(num).padStart(2, '0');

  const cards = [
    { label: t.days, val: timeLeft.days },
    { label: t.hours, val: timeLeft.hours },
    { label: t.minutes, val: timeLeft.minutes },
    { label: t.seconds, val: timeLeft.seconds },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-br from-orange-500/5 via-orange-600/[0.02] to-transparent border border-orange-100 rounded-2xl space-y-3 shadow-sm relative overflow-hidden"
    >
      {/* Visual background ambient glow */}
      <div className="absolute -right-8 -top-8 w-20 h-20 bg-adv-orange/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-adv-orange uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-adv-orange animate-pulse" />
          {t.startsIn}
        </span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          {targetDate} {targetTime}
        </span>
      </div>

      {/* Countdown Digits Grid */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, idx) => (
          <div 
            key={card.label}
            className="bg-white border border-orange-100/40 rounded-xl py-2 px-1 text-center shadow-sm relative group overflow-hidden"
          >
            {/* Hover visual accent */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <span className="block text-xl font-black text-adv-slate font-mono tracking-tight leading-none">
              {formatNum(card.val)}
            </span>
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1 scale-90">
              {card.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
