import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Calendar, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { events } from '../data/events';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../lib/storage';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const translations = {
  en: {
    placeholder: 'Search events or cities...',
    popular: 'Trending Locations',
    trending: 'Trending Events',
    concerts: 'Concert',
    sports: 'Adventure and Tour',
    festivals: 'Festival',
    workshop: 'Workshop',
    noEvents: 'No events found matching'
  },
  lo: {
    placeholder: 'ຄົ້ນຫາກິດຈະກຳ ຫຼື ເມືອງ...',
    popular: 'ສະຖານທີ່ຍອດນິຍົມ',
    trending: 'ກິດຈະກຳຍອດຮິດ',
    concerts: 'ຄອນເສີດ',
    sports: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ',
    festivals: 'ເທດສະການ',
    workshop: 'ເວີກຊອບ',
    noEvents: 'ບໍ່ພົບກິດຈະກຳທີ່ກົງກັບ'
  }
};

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const searchEvents = (() => {
    let all = events;
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        all = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return all.filter(e => e.status !== 'pending' && e.status !== 'rejected');
  })();

  const filteredEvents = searchEvents
    .filter(event => 
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.location.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const q = query.toLowerCase();
      const aTitleMatch = a.title.toLowerCase().includes(q);
      const bTitleMatch = b.title.toLowerCase().includes(q);
      
      // Prioritize title matches
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // If both match title, prioritize those that start with the query
      if (aTitleMatch && bTitleMatch) {
        const aStarts = a.title.toLowerCase().startsWith(q);
        const bStarts = b.title.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }
      
      return 0;
    });

  const handleSelect = (id: string) => {
    navigate(`/event/${id}`, { state: { from: location.pathname + location.search } });
    onClose();
  };

  const getTranslatedCategory = (c: string) => {
    switch(c.toLowerCase()) {
      case 'concert': return t.concerts;
      case 'sports': return t.sports;
      case 'festival': return t.festivals;
      case 'workshop': return t.workshop;
      default: return c;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center px-6 py-5 border-b border-gray-100">
              <Search className="w-5 h-5 text-adv-orange shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-4 text-adv-slate font-medium placeholder:text-gray-300"
              />
              {query && (
                <button 
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 mr-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-adv-orange transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-adv-slate transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 custom-scrollbar">
              {query.trim() === '' ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-adv-orange" />
                  </div>
                  <p className="text-gray-400 font-medium text-sm">
                    {lang === 'lo' ? 'ພິມເພື່ອຄົ້ນຫາກິດຈະກຳ ຫຼື ສະຖານທີ່' : 'Type to search events or cities'}
                  </p>
                </div>
              ) : filteredEvents.length > 0 ? (
                <div className="space-y-2">
                  {filteredEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => handleSelect(event.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-orange-50/50 transition-all text-left group border border-transparent hover:border-orange-100"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-adv-slate font-extrabold truncate group-hover:text-adv-orange transition-colors text-base leading-tight">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1.5 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-adv-orange" />
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-adv-orange" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">{t.noEvents} <span className="text-adv-slate font-bold">"{query}"</span></p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
