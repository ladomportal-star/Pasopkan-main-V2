import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, MapPin, ChevronRight, Inbox, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LaoEvent } from '../data/events';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { fromBackendEvent } from '../lib/eventPayload';
import SEO from '../components/SEO';

const translations = {
  en: {
    back: 'Back',
    title: 'Past Events Attended',
    clearHistory: 'Clear History',
    restoreHistory: 'Restore Sample History',
    noPastEventsTitle: 'No Past Events Yet',
    noPastEventsDesc: 'Your past event history is currently empty. Once you purchase tickets and attend an experience, it will be beautifully recorded here.',
    exploreUpcoming: 'Explore Upcoming Events',
    loading: 'Loading your event history...',
    clearedSuccess: 'History cleared',
    restoredSuccess: 'Sample history restored',
    viewEvent: 'View Event',
  },
  lo: {
    back: 'ກັບຄືນ',
    title: 'ກິດຈະກຳທີ່ຜ່ານມາ',
    clearHistory: 'ລຶບປະຫວັດ',
    restoreHistory: 'ກູ້ຄືນປະຫວັດຕົວຢ່າງ',
    noPastEventsTitle: 'ຍັງບໍ່ມີກິດຈະກຳທີ່ຜ່ານມາ',
    noPastEventsDesc: 'ປະຫວັດການເຂົ້າຮ່ວມກິດຈະກຳຂອງທ່ານແມ່ນວ່າງເປົ່າ. ເມື່ອທ່ານຊື້ປີ້ ແລະ ເຂົ້າຮ່ວມກິດຈະກຳ, ມັນຈະຖືກບັນທຶກໄວ້ຢູ່ນີ້.',
    exploreUpcoming: 'ຄົ້ນຫາກິດຈະກຳທີ່ຈະມາເຖິງ',
    loading: 'ກຳລັງໂຫຼດປະຫວັດກິດຈະກຳ...',
    clearedSuccess: 'ລຶບປະຫວັດສຳເລັດແລ້ວ',
    restoredSuccess: 'ກູ້ຄືນປະຫວັດຕົວຢ່າງສຳເລັດແລ້ວ',
    viewEvent: 'ເບິ່ງກິດຈະກຳ',
  }
};

export default function PastEvents() {
  const navigate = useNavigate();
  
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  const [isLoading, setIsLoading] = useState(true);
  const [pastEvents, setPastEvents] = useState<LaoEvent[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setPastEvents([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const load = async () => {
      const res = await api.listOrders();
      const orders = (res.data?.tickets ?? []) as any[];
      const attended = orders.filter((o) => o.status === 'confirmed' || o.status === 'paid');

      const uniqueEventIds = Array.from(new Set(attended.map((o) => String(o.eventId))));
      const eventResults = await Promise.all(uniqueEventIds.map((id) => api.getEvent(id)));
      const today = new Date().toISOString().split('T')[0];

      const events: LaoEvent[] = eventResults
        .map((r) => (r.data?.event ? fromBackendEvent(r.data.event) : null))
        .filter((e): e is LaoEvent => {
          if (!e) return false;
          const checkDate = e.endDate || e.date;
          return !!checkDate && checkDate < today;
        });

      if (!cancelled) {
        setPastEvents(events);
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-2 sm:pt-3 pb-8 md:pb-12 animate-pulse flex flex-col items-center">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gray-200"></div>
            <div className="w-64 h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl">
                <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex gap-3">
                    <div className="w-1/4 h-3 bg-gray-100 rounded"></div>
                    <div className="w-1/3 h-3 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-2 sm:pt-3 pb-8 md:pb-12">
      <SEO
        title={t.title}
        description="View your past event attendance history and leave verified reviews for experiences in Laos."
        noindex={true}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white text-adv-slate hover:bg-gray-50 hover:text-adv-orange transition-all border border-gray-200 shadow-xs hover:shadow-sm cursor-pointer"
              title={t.back}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-adv-slate">{t.title}</h1>
          </div>
          
        </div>

        <AnimatePresence mode="wait">
          {pastEvents.length > 0 ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-gray-100 rounded-3xl p-3 sm:p-4 shadow-sm space-y-1"
            >
              {pastEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl hover:bg-gray-50/50 transition-all group border border-transparent hover:border-gray-100 bg-white">
                    <Link
                      to={`/event/${event.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:scale-[1.03] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-50 text-gray-500 group-hover:bg-adv-orange/10 group-hover:text-adv-orange transition-colors">
                            {event.category || 'Event'}
                          </span>
                        </div>
                        <h4 className="text-adv-slate font-bold truncate group-hover:text-adv-orange transition-colors text-sm sm:text-base">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-adv-orange transition-colors" />
                            {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Action Button: View Event */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pl-20 sm:pl-0">
                      <button
                        onClick={() => navigate(`/event/${event.id}`, { state: { from: location.pathname + location.search } })}
                        className="h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black bg-slate-800 text-black hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                      >
                        <span>{t.viewEvent}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center relative overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              
              {/* Illustrative Icon Container */}
              <div className="relative mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50/60 rounded-full flex items-center justify-center text-adv-orange shadow-inner border border-orange-100/50">
                  <Inbox className="w-10 h-10 sm:w-12 sm:h-12 text-adv-orange stroke-[1.5]" />
                </div>
                <motion.div 
                  animate={{ y: [0, -6, 0] }} 
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1 bg-white p-2 rounded-2xl shadow-md border border-gray-50 flex items-center justify-center text-amber-500"
                >
                  <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
                </motion.div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-adv-slate mb-3">{t.noPastEventsTitle}</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm mb-8 font-medium">
                {t.noPastEventsDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-adv-orange text-black px-7 py-3.5 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {t.exploreUpcoming}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
