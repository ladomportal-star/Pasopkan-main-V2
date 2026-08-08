import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  lang: 'en' | 'lo';
  theme?: 'light' | 'dark';
}

export function CalendarPicker({ value, onChange, lang, theme = 'light' }: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popupRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 text-adv-slate rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all text-left"
      >
        <span>
          {value ? new Date(value).toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { dateStyle: 'medium' }) : (lang === 'lo' ? 'ເລືອກວັນທີ' : 'Select Date')}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute top-full left-0 mt-2 z-50 w-72 rounded-xl p-4 shadow-xl ${theme === 'dark' ? 'bg-[#2B303A] border-zinc-700' : 'bg-white border border-gray-100'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className={`p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {currentMonth.toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                type="button"
                onClick={nextMonth}
                className={`p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className={`text-center text-[10px] font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
              {days.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = value === dateStr;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all
                      ${isSelected ? 'border border-adv-orange bg-adv-orange/10 text-adv-orange' :
                        (theme === 'dark' ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100')}
                    `}
                  >
                    {String(day).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
