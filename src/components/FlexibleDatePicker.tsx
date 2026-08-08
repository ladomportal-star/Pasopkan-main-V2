import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react';
import { ScrollTimePicker } from './ScrollTimePicker';

interface AvailableDate {
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
}

interface FlexibleDatePickerProps {
  availableDates: AvailableDate[];
  onChange: (dates: AvailableDate[]) => void;
  lang: 'en' | 'lo';
  theme: 'light' | 'dark';
}

export function FlexibleDatePicker({ availableDates, onChange, lang, theme }: FlexibleDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const t = {
    addSlot: lang === 'lo' ? 'ເພີ່ມຊ່ວງເວລາ' : 'Add Time Slot',
    startTime: lang === 'lo' ? 'ເວລາເລີ່ມ' : 'Start Time',
    endTime: lang === 'lo' ? 'ເວລາສິ້ນສຸດ' : 'End Time',
    selectDateMsg: lang === 'lo' ? 'ເລືອກວັນທີໃນປະຕິທິນເພື່ອເພີ່ມເວລາ' : 'Select a date on the calendar to set times',
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
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
    setSelectedDate(dateStr);
    setStartTime('09:00');
    setEndTime('17:00');
  };

  const handleSaveSlot = () => {
    if (!selectedDate || !startTime || !endTime) return;
    
    const exists = availableDates.some(d => d.date === selectedDate && d.startTime === startTime && d.endTime === endTime);
    if (!exists) {
      onChange([...availableDates, { date: selectedDate, startTime, endTime }]);
    }
  };

  const handleRemoveSlot = (dateStr: string, start: string, end: string) => {
    onChange(availableDates.filter(d => !(d.date === dateStr && d.startTime === start && d.endTime === end)));
  };

  const handleRemoveAllForDate = (dateStr: string) => {
    onChange(availableDates.filter(d => d.date !== dateStr));
    if (selectedDate === dateStr) {
      setSelectedDate(null);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#2B303A] border-zinc-700' : 'bg-gray-50/80 border-gray-200/80'} shadow-sm`}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar View */}
        <div className={`flex-1 rounded-xl p-4 ${theme === 'dark' ? 'bg-[#2B303A]' : 'bg-white shadow-sm border border-gray-100'}`}>
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
              const isSelected = selectedDate === dateStr;
              const hasEvent = availableDates.some(d => d.date === dateStr);
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative h-9 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                    ${isSelected ? 'border border-adv-orange bg-adv-orange/10 text-adv-orange' : 
                      hasEvent ? (theme === 'dark' ? 'text-white hover:bg-white/5' : 'text-gray-800 hover:bg-gray-100') : 
                      (theme === 'dark' ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100')}
                  `}
                >
                  <span>{String(day).padStart(2, '0')}</span>
                  {hasEvent && (
                    <div className="absolute bottom-1.5 w-4 h-1 rounded-full bg-adv-orange" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Settings Panel */}
        <div className="flex-1 flex flex-col min-w-[240px]">
          {selectedDate ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedDate}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl border flex-1 flex flex-col ${theme === 'dark' ? 'bg-[#363A45] border-zinc-700' : 'bg-white border-orange-100/50'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                    {new Date(selectedDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { dateStyle: 'medium' })}
                  </h5>
                  {availableDates.some(d => d.date === selectedDate) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAllForDate(selectedDate)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title={lang === 'en' ? 'Clear all slots for this date' : 'ລຶບທຸກຊ່ວງເວລາຂອງວັນທີນີ້'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-4 flex-1">
                  {/* List of existing slots for this date */}
                  {availableDates.filter(d => d.date === selectedDate).length > 0 && (
                    <div className="flex flex-col gap-2 mb-2">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">
                        {lang === 'en' ? 'Added Time Slots' : 'ຊ່ວງເວລາທີ່ເພີ່ມແລ້ວ'}
                      </span>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                        {availableDates.filter(d => d.date === selectedDate).map((slot, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border ${theme === 'dark' ? 'bg-[#2B303A] border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(slot.date, slot.startTime, slot.endTime)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-auto">
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                        {t.startTime}
                      </span>
                      <ScrollTimePicker 
                        value={startTime}
                        onChange={setStartTime}
                        placeholder="09:00"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                        {t.endTime}
                      </span>
                      <ScrollTimePicker 
                        value={endTime}
                        onChange={setEndTime}
                        placeholder="17:00"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSlot}
                      className="w-full bg-adv-orange hover:bg-orange-600 text-white py-2.5 rounded-lg font-black text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      {t.addSlot}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl ${theme === 'dark' ? 'border-zinc-700 bg-[#363A45]' : 'border-gray-200 bg-white'}`}>
              <Clock className={`w-8 h-8 mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`} />
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.selectDateMsg}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
