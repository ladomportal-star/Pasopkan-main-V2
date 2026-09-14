import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Check } from 'lucide-react';

export interface DateInputDDMMYYYYProps {
  value: string; // "DD/MM/YYYY" or "YYYY-MM-DD"
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  lang?: 'en' | 'lo';
  className?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  align?: 'auto' | 'left' | 'right';
  disabled?: boolean;
}

export function formatToDDMMYYYY(val?: string | null): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  // Already DD/MM/YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return `${day}/${month}/${year}`;
  }

  // YYYY-MM-DD
  const yyyymmddMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}

export function parseDDMMYYYYToDate(val?: string | null): Date | null {
  if (!val) return null;
  const trimmed = val.trim();
  
  // DD/MM/YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD
  const yyyymmddMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

const LAO_MONTHS_SHORT = ['ມ.ກ.', 'ກ.ພ.', 'ມ.ນ.', 'ມ.ສ.', 'ພ.ພ.', 'ມິ.ຖ.', 'ກ.ລ.', 'ສ.ຫ.', 'ກ.ຍ.', 'ຕ.ລ.', 'ພ.ຈ.', 'ທ.ວ.'];
const LAO_MONTHS_FULL = ['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ', 'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'];
const EN_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function DateInputDDMMYYYY({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  label,
  lang = 'en',
  className = '',
  minDate,
  maxDate,
  align = 'auto',
  disabled = false
}: DateInputDDMMYYYYProps) {
  const [isOpen, setIsOpen] = useState(false);
  const formattedVal = formatToDDMMYYYY(value);
  const [displayVal, setDisplayVal] = useState(formattedVal);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // View mode: 'days' | 'months' | 'years'
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  // Floating coordinates for Portal
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setDisplayVal(formatToDDMMYYYY(value));
  }, [value]);

  const parsedDate = useMemo(() => parseDDMMYYYYToDate(value), [value]);
  const minDateObj = useMemo(() => {
    if (!minDate) return null;
    if (minDate instanceof Date) return new Date(minDate.setHours(0, 0, 0, 0));
    return parseDDMMYYYYToDate(minDate);
  }, [minDate]);

  const maxDateObj = useMemo(() => {
    if (!maxDate) return null;
    if (maxDate instanceof Date) return new Date(maxDate.setHours(23, 59, 59, 999));
    return parseDDMMYYYYToDate(maxDate);
  }, [maxDate]);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => parsedDate || minDateObj || new Date());

  useEffect(() => {
    if (parsedDate) {
      setCurrentMonth(parsedDate);
    }
  }, [parsedDate]);

  // Recalculate position relative to viewport
  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const isSmall = window.innerWidth < 640;
    setIsMobile(isSmall);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 390;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Vertical placement calculation: if below viewport, open on top
      const spaceBelow = screenHeight - rect.bottom;
      const spaceAbove = rect.top;
      let placement: 'top' | 'bottom' = 'bottom';
      let top = rect.bottom + 6;

      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        placement = 'top';
        top = Math.max(10, rect.top - popoverHeight - 6);
      }

      // Horizontal placement calculation
      let left = rect.left;
      if (align === 'right') {
        left = rect.right - popoverWidth;
      } else if (align === 'auto') {
        if (rect.left + popoverWidth > screenWidth - 16) {
          left = rect.right - popoverWidth;
        }
      }

      // Viewport safety clamp
      left = Math.max(12, Math.min(left, screenWidth - popoverWidth - 12));

      setCoords({ top, left, placement });
    }
  }, [align]);

  const openCalendar = () => {
    if (disabled) return;
    updatePosition();
    setViewMode('days');
    if (parsedDate) {
      setCurrentMonth(parsedDate);
    } else if (minDateObj) {
      setCurrentMonth(minDateObj);
    }
    setIsOpen(true);
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      openCalendar();
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside of both container and portal popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d/]/g, '');
    
    // Auto-formatting as digits are typed: DD/MM/YYYY
    const digitsOnly = input.replace(/\D/g, '');
    if (digitsOnly.length <= 2) {
      input = digitsOnly;
    } else if (digitsOnly.length <= 4) {
      input = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    } else {
      input = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    }

    setDisplayVal(input);
    onChange(input);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDisplayVal('');
    onChange('');
  };

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
  
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const setDateFromObj = (dateObj: Date, shouldClose = false) => {
    const dayStr = String(dateObj.getDate()).padStart(2, '0');
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
    const fullDate = `${dayStr}/${monthStr}/${dateObj.getFullYear()}`;
    setDisplayVal(fullDate);
    onChange(fullDate);
    if (shouldClose) {
      setIsOpen(false);
    }
  };

  // Clicking a date selects it without auto-closing (user explicitly confirms with Done or X)
  const handleDateClick = (day: number) => {
    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (minDateObj && d < minDateObj) return;
    if (maxDateObj && d > maxDateObj) return;
    setDateFromObj(d, false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Formatted date overview for header
  const formattedPreview = useMemo(() => {
    if (!parsedDate) return null;
    try {
      return parsedDate.toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  }, [parsedDate, lang]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>}
      <div className="relative flex items-center group">
        <input
          ref={inputRef}
          type="text"
          value={displayVal}
          onChange={handleTextChange}
          placeholder={placeholder}
          maxLength={10}
          disabled={disabled}
          onClick={() => {
            if (!isOpen) {
              openCalendar();
            }
          }}
          className={`w-full h-10 bg-white border border-gray-200 text-adv-slate rounded-xl pl-3.5 pr-14 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all placeholder:text-gray-400 cursor-pointer ${
            disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
          }`}
        />
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {displayVal && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title={lang === 'lo' ? 'ລຶບ' : 'Clear'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleOpen}
            disabled={disabled}
            className="p-1.5 text-gray-400 hover:text-adv-orange transition-colors cursor-pointer rounded-lg hover:bg-orange-50"
            title={lang === 'lo' ? 'ເລືອກວັນທີ' : 'Pick Date'}
          >
            <CalendarIcon className="w-4 h-4 text-adv-orange" />
          </button>
        </div>
      </div>

      {/* Calendar Portal (Always floats completely on top of all tabs, navigation bars, and cards) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile Backdrop Overlay */}
              {isMobile ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black/50 z-[99998] backdrop-blur-xs flex items-center justify-center p-4 sm:hidden overflow-y-auto"
                />
              ) : null}

              {/* Portal Floating Card */}
              <motion.div
                ref={popoverRef}
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
                className="bg-white border border-gray-150 rounded-2xl shadow-2xl overflow-hidden drop-shadow-2xl"
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
                  {/* Real-time date overview */}
                  <div className="mt-1.5">
                    {formattedPreview ? (
                      <p className="text-sm font-black text-white capitalize truncate tracking-wide">
                        {formattedPreview}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-white/80">
                        {lang === 'lo' ? 'ກະລຸນາເລືອກວັນທີ' : 'Please select a date'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Calendar Body */}
                <div className="p-4">
                  {/* Month / Year Navigator */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={prevYear}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-adv-orange transition-colors cursor-pointer"
                        title={lang === 'lo' ? 'ປີກ່ອນ' : 'Previous Year'}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-adv-orange transition-colors cursor-pointer"
                        title={lang === 'lo' ? 'ເດືອນກ່ອນ' : 'Previous Month'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Toggle month/year view mode */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                        className={`text-xs font-black px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          viewMode === 'months' ? 'bg-adv-orange text-white shadow-xs' : 'text-adv-slate hover:bg-gray-100'
                        }`}
                      >
                        {lang === 'lo' ? LAO_MONTHS_FULL[month] : EN_MONTHS_FULL[month]}
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                        className={`text-xs font-black px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          viewMode === 'years' ? 'bg-adv-orange text-white shadow-xs' : 'text-adv-slate hover:bg-gray-100'
                        }`}
                      >
                        {year}
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-adv-orange transition-colors cursor-pointer"
                        title={lang === 'lo' ? 'ເດືອນຖັດໄປ' : 'Next Month'}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextYear}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-adv-orange transition-colors cursor-pointer"
                        title={lang === 'lo' ? 'ປີຖັດໄປ' : 'Next Year'}
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Grid View */}
                  {viewMode === 'days' && (
                    <>
                      {/* Days of Week Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-extrabold text-gray-400 uppercase">
                        {lang === 'lo' 
                          ? ['ອາ', 'ຈ', 'ອ', 'ພ', 'ພຫ', 'ສຸກ', 'ເສົາ'].map((d, i) => (
                              <div key={d} className={i === 0 || i === 6 ? 'text-orange-400' : ''}>{d}</div>
                            ))
                          : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                              <div key={d} className={i === 0 || i === 6 ? 'text-orange-400' : ''}>{d}</div>
                            ))
                        }
                      </div>

                      {/* Date Numbers */}
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                          if (day === null) return <div key={`empty-${idx}`} className="h-8" />;
                          
                          const dayDate = new Date(year, month, day, 0, 0, 0, 0);
                          const isDayToday = dayDate.getTime() === today.getTime();
                          const isPastMin = minDateObj ? dayDate < minDateObj : false;
                          const isPastMax = maxDateObj ? dayDate > maxDateObj : false;
                          const isDisabled = isPastMin || isPastMax;

                          const dayStr = String(day).padStart(2, '0');
                          const monthStr = String(month + 1).padStart(2, '0');
                          const thisFormatted = `${dayStr}/${monthStr}/${year}`;
                          const isSelected = displayVal === thisFormatted;

                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleDateClick(day)}
                              className={`
                                relative h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer
                                ${isDisabled
                                  ? 'opacity-25 cursor-not-allowed text-gray-400 line-through'
                                  : isSelected
                                    ? 'bg-adv-orange text-white shadow-md shadow-orange-500/30 scale-105 z-10 font-black'
                                    : isDayToday
                                      ? 'border-2 border-adv-orange text-adv-orange hover:bg-orange-50'
                                      : 'text-gray-700 hover:bg-orange-50 hover:text-adv-orange active:scale-95'
                                }
                              `}
                            >
                              <span>{day}</span>
                              {isDayToday && !isSelected && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-adv-orange" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Quick Month Grid View */}
                  {viewMode === 'months' && (
                    <div className="grid grid-cols-3 gap-2 py-2">
                      {(lang === 'lo' ? LAO_MONTHS_SHORT : EN_MONTHS_SHORT).map((mName, mIdx) => {
                        const isCurrentM = month === mIdx;
                        return (
                          <button
                            key={mName}
                            type="button"
                            onClick={() => {
                              setCurrentMonth(new Date(year, mIdx, 1));
                              setViewMode('days');
                            }}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isCurrentM
                                ? 'bg-adv-orange text-white shadow-xs font-black'
                                : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-adv-orange'
                            }`}
                          >
                            {mName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick Year Grid View */}
                  {viewMode === 'years' && (
                    <div className="grid grid-cols-3 gap-2 py-2 max-h-52 overflow-y-auto pr-1">
                      {Array.from({ length: 12 }, (_, i) => year - 4 + i).map((yNum) => {
                        const isCurrentY = year === yNum;
                        return (
                          <button
                            key={yNum}
                            type="button"
                            onClick={() => {
                              setCurrentMonth(new Date(yNum, month, 1));
                              setViewMode('days');
                            }}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isCurrentY
                                ? 'bg-adv-orange text-white shadow-xs font-black'
                                : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-adv-orange'
                            }`}
                          >
                            {yNum}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDisplayVal('');
                      onChange('');
                    }}
                    className="text-gray-500 hover:text-red-500 font-bold transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    {lang === 'lo' ? 'ລຶບອອກ' : 'Clear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="bg-adv-orange hover:bg-orange-600 text-white px-4 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
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
