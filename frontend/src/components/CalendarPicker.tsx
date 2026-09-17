import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Check } from 'lucide-react';

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  lang: 'en' | 'lo';
  theme?: 'light' | 'dark';
  minDate?: Date | string;
  align?: 'auto' | 'left' | 'right';
}

export function CalendarPicker({ value, onChange, lang, theme = 'light', minDate, align = 'auto' }: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });
  const [isMobile, setIsMobile] = useState(false);

  const minDateObj = useMemo(() => {
    if (!minDate) return null;
    const d = typeof minDate === 'string' ? new Date(minDate) : new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minDate]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value);
    if (minDate) return typeof minDate === 'string' ? new Date(minDate) : new Date(minDate);
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const isSmall = window.innerWidth < 640;
    setIsMobile(isSmall);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 380;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const spaceBelow = screenHeight - rect.bottom;
      const spaceAbove = rect.top;
      let placement: 'top' | 'bottom' = 'bottom';
      let top = rect.bottom + 6;

      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        placement = 'top';
        top = Math.max(10, rect.top - popoverHeight - 6);
      }

      let left = rect.left;
      if (align === 'right') {
        left = rect.right - popoverWidth;
      } else if (align === 'auto') {
        if (rect.left + popoverWidth > screenWidth - 16) {
          left = rect.right - popoverWidth;
        }
      }

      left = Math.max(12, Math.min(left, screenWidth - popoverWidth - 12));
      setCoords({ top, left, placement });
    }
  }, [align]);

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
      if (value) setCurrentMonth(new Date(value));
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isPrevDisabled = useMemo(() => {
    if (!minDateObj) return false;
    const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const minMonthDate = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);
    return prevMonthDate.getTime() < minMonthDate.getTime();
  }, [currentMonth, minDateObj]);

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPrevDisabled) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevYear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
  };

  const nextYear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
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
    const dayDate = new Date(year, month, day, 0, 0, 0, 0);
    if (minDateObj && dayDate.getTime() < minDateObj.getTime()) return;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
  };

  const selectedFormatted = useMemo(() => {
    if (!value) return null;
    try {
      const d = new Date(value);
      return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [value, lang]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between bg-white border border-gray-200 text-adv-slate rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all text-left cursor-pointer"
      >
        <span>
          {value ? new Date(value).toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { dateStyle: 'medium' }) : (lang === 'lo' ? 'ເລືອກວັນທີ' : 'Select Date')}
        </span>
        <CalendarIcon className="w-4 h-4 text-adv-orange" />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {isMobile ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black/50 z-[99998] backdrop-blur-xs flex items-center justify-center p-4 sm:hidden overflow-y-auto"
                />
              ) : null}

              <motion.div
                ref={popupRef}
                initial={{ opacity: 0, y: isMobile ? 20 : (coords.placement === 'top' ? -8 : 8), scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isMobile ? 20 : (coords.placement === 'top' ? -8 : 8), scale: 0.97 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={
                  isMobile
                    ? {
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'calc(100vw - 32px)',
                        maxWidth: '340px',
                        zIndex: 99999,
                      }
                    : {
                        position: 'fixed',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: '320px',
                        zIndex: 99999,
                      }
                }
                className={`
                  rounded-2xl shadow-2xl overflow-hidden drop-shadow-2xl
                  ${theme === 'dark' ? 'bg-[#2B303A] border border-zinc-700 text-white' : 'bg-white border border-gray-150 text-adv-slate'}
                `}
              >
                {/* Header Overview Banner */}
                <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-adv-orange text-white px-4 py-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-white/90" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/80">
                        {lang === 'lo' ? 'ເລືອກວັນທີ' : 'Select Date'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
                      title={lang === 'lo' ? 'ປິດ' : 'Close'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-1.5">
                    {selectedFormatted ? (
                      <p className="text-sm font-black text-white capitalize truncate tracking-wide">
                        {selectedFormatted}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-white/80">
                        {lang === 'lo' ? 'ກະລຸນາເລືອກວັນທີ' : 'Please select a date'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={prevYear}
                        className={`p-1 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                        title={lang === 'lo' ? 'ປີກ່ອນ' : 'Previous Year'}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={prevMonth}
                        disabled={isPrevDisabled}
                        className={`p-1 rounded-lg cursor-pointer ${
                          isPrevDisabled 
                            ? 'opacity-20 cursor-not-allowed text-gray-400' 
                            : (theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                        }`}
                        title={lang === 'lo' ? 'ເດືອນກ່ອນ' : 'Previous Month'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {currentMonth.toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { month: 'long', year: 'numeric' })}
                    </h4>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={nextMonth}
                        className={`p-1 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                        title={lang === 'lo' ? 'ເດືອນຖັດໄປ' : 'Next Month'}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextYear}
                        className={`p-1 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                        title={lang === 'lo' ? 'ປີຖັດໄປ' : 'Next Year'}
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                      <div key={d} className={`text-center text-[10px] font-extrabold ${i === 0 || i === 6 ? 'text-orange-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                      if (day === null) return <div key={`empty-${idx}`} className="h-8" />;

                      const dayDate = new Date(year, month, day, 0, 0, 0, 0);
                      const isDisabled = !!minDateObj && dayDate.getTime() < minDateObj.getTime();
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = value === dateStr;

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleDateClick(day)}
                          className={`
                            relative h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer
                            ${isDisabled
                              ? 'opacity-25 cursor-not-allowed bg-transparent text-gray-400 line-through'
                              : isSelected
                                ? 'bg-adv-orange text-white shadow-md shadow-orange-500/30 font-bold scale-105'
                                : (theme === 'dark' ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-orange-50 hover:text-adv-orange')}
                          `}
                        >
                          {String(day).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange('');
                    }}
                    className="text-gray-500 hover:text-red-500 font-bold transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-xs"
                  >
                    {lang === 'lo' ? 'ລຶບອອກ' : 'Clear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="bg-adv-orange hover:bg-orange-600 text-white px-4 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 text-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{lang === 'lo' ? 'ຕົກລົງ' : 'Done'}</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
