import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScrollTimePickerProps {
  value: string; // e.g. "09:00" or "18:30"
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ScrollTimePicker: React.FC<ScrollTimePickerProps> = ({
  value,
  onChange,
  placeholder = '00:00',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse current value or default to "00:00"
  const parseTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) {
      return { hour: '00', minute: '00' };
    }
    const [h, m] = timeStr.split(':');
    const hourNum = parseInt(h, 10);
    const minNum = parseInt(m, 10);
    const validH = isNaN(hourNum) ? '00' : String(Math.min(23, Math.max(0, hourNum))).padStart(2, '0');
    const validM = isNaN(minNum) ? '00' : String(Math.min(59, Math.max(0, minNum))).padStart(2, '0');
    return { hour: validH, minute: validM };
  };

  const initialParsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(initialParsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialParsed.minute);

  const containerRef = useRef<HTMLDivElement>(null);
  const hourColumnRef = useRef<HTMLDivElement>(null);
  const minuteColumnRef = useRef<HTMLDivElement>(null);

  // Update internal state if value prop changes externally
  useEffect(() => {
    const { hour, minute } = parseTime(value);
    setSelectedHour(hour);
    setSelectedMinute(minute);
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll active item into view when picker opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hourElem = document.getElementById(`time-hour-${selectedHour}`);
        if (hourElem && hourColumnRef.current) {
          hourColumnRef.current.scrollTop = hourElem.offsetTop - 80;
        }
        const minElem = document.getElementById(`time-min-${selectedMinute}`);
        if (minElem && minuteColumnRef.current) {
          minuteColumnRef.current.scrollTop = minElem.offsetTop - 80;
        }
      }, 50);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleConfirm = () => {
    const formatted = `${selectedHour}:${selectedMinute}`;
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button / Input Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-white border border-gray-200 text-adv-slate rounded-xl px-4 py-3 text-sm transition-all cursor-pointer ${
          isOpen ? 'ring-4 ring-adv-orange/10 border-adv-orange' : 'hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-adv-orange shrink-0" />
          <span className={`font-mono font-medium ${value ? 'text-adv-slate font-bold' : 'text-gray-400'}`}>
            {value || placeholder}
          </span>
        </div>
      </button>

      {/* Time Picker Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-[200px] overflow-hidden select-none"
          >
            {/* Main Picker Dual Columns matching screenshot */}
            <div className="grid grid-cols-2 h-60 bg-white">
              {/* Hours Column */}
              <div
                ref={hourColumnRef}
                className="overflow-y-auto py-2 px-1 text-center scroll-smooth border-r border-gray-150 space-y-0.5 custom-scrollbar"
                style={{ scrollbarWidth: 'thin' }}
              >
                {hoursList.map((h) => {
                  const isSelected = h === selectedHour;
                  return (
                    <div
                      id={`time-hour-${h}`}
                      key={`hour-${h}`}
                      onClick={() => setSelectedHour(h)}
                      className={`py-2 text-sm font-sans cursor-pointer transition-colors rounded-lg ${
                        isSelected
                          ? 'bg-orange-50 text-adv-orange font-bold scale-105'
                          : 'text-gray-700 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      {h}
                    </div>
                  );
                })}
              </div>

              {/* Minutes Column */}
              <div
                ref={minuteColumnRef}
                className="overflow-y-auto py-2 px-1 text-center scroll-smooth space-y-0.5 custom-scrollbar"
                style={{ scrollbarWidth: 'thin' }}
              >
                {minutesList.map((m) => {
                  const isSelected = m === selectedMinute;
                  return (
                    <div
                      id={`time-min-${m}`}
                      key={`min-${m}`}
                      onClick={() => setSelectedMinute(m)}
                      className={`py-2 text-sm font-sans cursor-pointer transition-colors rounded-lg ${
                        isSelected
                          ? 'bg-orange-50 text-adv-orange font-bold scale-105'
                          : 'text-gray-700 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer with OK Button matching screenshot */}
            <div className="border-t border-gray-150 p-2 flex justify-end bg-gray-50/50">
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-adv-orange hover:text-white hover:border-adv-orange text-gray-500 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScrollTimePicker;
