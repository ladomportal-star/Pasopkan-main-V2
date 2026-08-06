import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Zap, 
  MapPin, 
  Wind, 
  Activity,
  Globe,
  Loader2,
  Mountain,
  Music,
  Lightbulb,
  Ticket,
  PartyPopper,
  Flame,
  Eye,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { events, LaoEvent, getEventStatus } from '../data/events';
import { useLanguage } from '../LanguageContext';
import LandscapeEventCard from '../components/LandscapeEventCard';
import { safeStorage } from '../lib/storage';

const translations = {
  en: {
    heroSub: 'Discover Great Experiences',
    mainTitle: 'Your Next Adventure Awaits',
    cta: 'Book Now',
    sectionTitle: 'Popular Destinations',
    feedSub: 'Curated just for you',
    searchPlaceholder: 'Search destinations, activities...',
    searchBtn: 'Search',
    workshops: 'Workshops',
    adventure: 'Adventure and Tour',
    festivals: 'Festivals',
    vouchers: 'Vouchers'
  },
  lo: {
    heroSub: 'ຄົ້ນພົບປະສົບການທີ່ດີເລີດ',
    mainTitle: 'ປະສົບການໃໝ່ໆລໍຖ້າທ່ານຢູ່',
    cta: 'ຈອງດຽວນີ້',
    sectionTitle: 'ສະຖານທີ່ຍອດນິຍົມ',
    feedSub: 'ຄັດສັນມາເພື່ອທ່ານໂດຍສະເພາະ',
    searchPlaceholder: 'ຄົ້ນຫາສະຖານທີ່, ກິດຈະກຳ...',
    searchBtn: 'ຄົ້ນຫາ',
    workshops: 'ເວີກຊັອບ',
    adventure: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ',
    festivals: 'ເທດສະການ',
    vouchers: 'ບັດສ່ວນຫຼຸດ'
  }
};

const categoryToId: Record<string, string> = {
  'Workshop': 'workshop',
  'Sports': 'sports',
  'Festival': 'festival',
  'Voucher': 'voucher'
};

// Calculate views & purchases deterministically so that we always have high quality stats for all events
const getEventStats = (event: LaoEvent) => {
  const charSum = event.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const views = event.views || ((charSum % 800) + 400); // 400 to 1200 views
  const purchases = event.purchases || Math.round(views * (0.15 + (charSum % 15) / 100)); // 15% to 30% conversion rate
  return { views, purchases };
};

const LandscapeEventCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex flex-col bg-white border border-gray-150/60 rounded-[2rem] shadow-xs shrink-0 w-[calc(100vw-64px)] max-w-[320px] sm:w-[320px] overflow-hidden">
      {/* Image header skeleton */}
      <div className="h-44 bg-gray-100 animate-pulse" />

      {/* Body container */}
      <div className="p-4 flex flex-col flex-1">
        {/* Location skeleton */}
        <div className="w-1/3 h-3.5 bg-gray-150 rounded-md animate-pulse mb-3" />

        {/* Title skeleton */}
        <div className="space-y-2 mb-4 h-12">
          <div className="w-11/12 h-4 bg-gray-150 rounded-md animate-pulse" />
          <div className="w-2/3 h-4 bg-gray-150 rounded-md animate-pulse" />
        </div>

        {/* Footer skeleton */}
        <div className="mt-auto pt-3 border-t border-gray-150 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="w-12 h-2.5 bg-gray-150 rounded-md animate-pulse" />
            <div className="w-24 h-5 bg-gray-150 rounded-md animate-pulse" />
          </div>
          <div className="w-20 h-8 bg-gray-150 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const CategoryRowSkeleton: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex flex-col mb-0">
      {/* Row Header */}
      <div className="flex items-end justify-between mb-4 sm:mb-8">
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-adv-slate">
          {title}
        </h3>
        {/* Actions */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <div className="w-20 h-4 bg-gray-150 rounded-md animate-pulse" />
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-150 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-150 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Horizontal List */}
      <div className="flex overflow-x-auto pb-3 sm:pb-6 -mx-4 px-4 sm:-mx-8 sm:px-8 hide-scrollbar gap-6">
        {[1, 2, 3, 4].map((n) => (
          <LandscapeEventCardSkeleton key={n} />
        ))}
      </div>
    </div>
  );
};

const CategoryRow: React.FC<{ category: string, events: LaoEvent[], title: string }> = ({ category, events, title }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const categoryId = categoryToId[category] || category.toLowerCase();
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col mb-0 group">
      <div className="flex items-end justify-between mb-4 sm:mb-8">
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-adv-slate">
          {title}
        </h3>
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link 
            to={`/category/${categoryId}`}
            className="text-xs font-black text-adv-orange hover:text-black transition-colors uppercase tracking-widest flex items-center gap-1.5 group/btn"
          >
            {lang === 'en' ? 'Show More' : 'ເບິ່ງເພີ່ມເຕີມ'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => scroll('left')} 
              className="w-10 h-10 flex items-center justify-center rounded-full border border-adv-border bg-white text-adv-slate hover:bg-adv-gray transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')} 
              className="w-10 h-10 flex items-center justify-center rounded-full border border-adv-border bg-white text-adv-slate hover:bg-adv-gray transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto pb-3 sm:pb-6 -mx-4 px-4 sm:-mx-8 sm:px-8 hide-scrollbar gap-6 snap-x snap-mandatory scroll-smooth"
      >
        {events.map((event, index) => (
          <LandscapeEventCard 
            key={event.id} 
            event={event} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedEvents, setFetchedEvents] = useState<LaoEvent[]>([]);
  const { lang } = useLanguage();
  const t = translations[lang];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroImages = [
    "https://images.unsplash.com/photo-1542360663-80149f104730?auto=format&fit=crop&q=80&w=2070", // Vang Vieng Hot Air Balloons
    "https://images.unsplash.com/photo-1563725575791-537452d2427a?auto=format&fit=crop&q=80&w=2070", // Luang Prabang Alms Giving
    "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&q=80&w=2070", // Vientiane Patuxai Exploration
    "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=2070", // Luang Prabang Kuang Si Falls
    "https://images.unsplash.com/photo-1579451861283-a2239070aaa9?auto=format&fit=crop&q=80&w=2070"  // Vang Vieng Kayaking
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let allEvents = events;
      try {
        const saved = safeStorage.getItem('organizer_events');
        if (saved) {
          allEvents = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }

      // Filter out events that are expired or already in the past
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const activeEvents = allEvents.filter(evt => {
        const checkDate = evt.endDate || evt.date;
        return checkDate >= todayStr && evt.status !== 'pending' && evt.status !== 'rejected';
      });

      setFetchedEvents(activeEvents);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const categoryTitles: Record<string, Record<'en' | 'lo', string>> = {
    'Sports': { en: 'Adventure and Tour', lo: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ' },
    'Festival': { en: 'Festivals', lo: 'ເທດສະການ' },
    'Workshop': { en: 'Workshops', lo: 'ເວີກຊັອບ' },
    'Voucher': { en: 'Vouchers', lo: 'ບັດສ່ວນຫຼຸດ' }
  };

  const categories = ['Workshop', 'Sports', 'Festival', 'Voucher'];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <section className="relative h-[300px] sm:h-[450px] landscape:h-[350px] lg:h-[650px] flex flex-col justify-end pb-20 sm:pb-32 lg:pb-48 overflow-hidden">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImageIndex}
              src={heroImages[currentImageIndex]} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Hero Background"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 md:space-y-8"
          >
             <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white font-black tracking-tight uppercase leading-[0.9] landscape:text-4xl landscape:md:text-6xl">
               {t.mainTitle}
             </h1>
          </motion.div>
        </div>
      </section>

      <section className="relative -mt-6 sm:-mt-8 md:-mt-12 lg:-mt-14 z-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto mb-12 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-4 sm:p-5 md:p-10 landscape:p-4"
        >
          <div className="grid grid-cols-4 gap-2 sm:gap-8 lg:gap-12 landscape:grid-cols-4">
             {[
               { id: 'workshop', label: t.workshops, icon: Lightbulb, color: 'bg-amber-50 text-amber-600' },
               { id: 'sports', label: t.adventure, icon: Mountain, color: 'bg-orange-50 text-orange-600' },
               { id: 'festival', label: t.festivals, icon: PartyPopper, color: 'bg-purple-50 text-purple-600' },
               { id: 'voucher', label: t.vouchers, icon: Ticket, color: 'bg-emerald-50 text-emerald-600' },
             ].map((cat, idx) => (
               <motion.div
                 key={cat.id}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: idx * 0.05 }}
               >
                 <Link 
                   to={`/category/${cat.id}`}
                   className="flex flex-col items-center gap-2 md:gap-4 group relative"
                 >
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-[1.5rem] md:rounded-[2rem] ${cat.color} flex items-center justify-center transition-all duration-500 group-hover:rounded-2xl group-hover:scale-110 group-hover:shadow-lg group-active:scale-95`}>
                       <cat.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    </div>
                    <div className="text-center">
                       <span className="block text-[8px] sm:text-xs md:text-sm font-bold text-adv-slate group-hover:translate-y-[-2px] transition-transform uppercase tracking-tighter sm:tracking-normal">
                         {cat.label}
                       </span>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-adv-orange opacity-0 group-hover:opacity-100 transition-all duration-300" />
                 </Link>
               </motion.div>
             ))}
          </div>
        </motion.div>
      </section>

      <section id="events-section" className="px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-2 sm:pb-16">
        <div className="space-y-12 sm:space-y-24">
          {isLoading ? (
            <>
              {/* Skeletons for Categories list */}
              {categories.map((category) => (
                <CategoryRowSkeleton 
                  key={category} 
                  title={categoryTitles[category][lang]} 
                />
              ))}
            </>
          ) : (
            <>
              {categories.map((category) => {
                const categoryEvents = fetchedEvents.filter(e => e.category === category);
                if (categoryEvents.length === 0) return null;
                return (
                  <CategoryRow 
                    key={category}
                    category={category}
                    events={categoryEvents}
                    title={categoryTitles[category][lang]}
                  />
                );
              })}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
