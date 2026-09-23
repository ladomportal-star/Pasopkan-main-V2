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
import { useLanguage } from '../context/LanguageContext';
import LandscapeEventCard from '../components/LandscapeEventCard';
import { safeStorage } from '../lib/storage';
import { getHomeHeroSettings, HomeHeroSettings, DEFAULT_HOME_HERO_SETTINGS } from '../lib/siteSettings';
import SEO from '../components/SEO';
import HomeBlogSection from '../components/HomeBlogSection';

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
    vouchers: 'Voucher and Booking',
    popularEvents: 'Popular Events',
    popularEventsSub: 'Top 5 best-selling events',
    notifications: 'Notifications'
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
    vouchers: 'Voucher ແລະ ການຈອງ',
    popularEvents: 'ກິດຈະກຳຍອດນິຍົມ',
    popularEventsSub: '5 ອັນດັບທີ່ຂາຍປີ້ໄດ້ຫຼາຍທີ່ສຸດ',
    notifications: 'ການແຈ້ງເຕືອນ'
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

// Calculate total sold tickets for sorting popular events accurately (Top 5)
export const getEventTicketsSold = (event: LaoEvent): number => {
  let soldCount = 0;

  // Real tickets from user purchases in safeStorage / localStorage
  try {
    const rawTickets = safeStorage.getItem('pasopkan_user_tickets') || (typeof localStorage !== 'undefined' ? localStorage.getItem('pasopkan_user_tickets') : null);
    if (rawTickets) {
      const tickets = JSON.parse(rawTickets);
      if (Array.isArray(tickets)) {
        const userBought = tickets
          .filter((t: any) => t?.event?.id === event.id || t?.eventId === event.id)
          .reduce((sum: number, t: any) => sum + (Number(t?.quantity) || 1), 0);
        soldCount += userBought;
      }
    }
  } catch (e) {
    // ignore
  }

  // Base sales from config or event attributes
  const baseSalesConfig: Record<string, number> = {
    '1': 420,
    '2': 48,
    '3': 85,
    '4': 62,
    '5': 310,
    '6': 540,
    '7': 15,
    '8': 35,
    '9': 110,
    '10': 24,
  };

  if (baseSalesConfig[event.id]) {
    soldCount += baseSalesConfig[event.id];
  } else if (typeof (event as any).ticketsSold === 'number' && (event as any).ticketsSold > 0) {
    soldCount += (event as any).ticketsSold;
  } else if (typeof event.purchases === 'number' && event.purchases > 0) {
    soldCount += event.purchases;
  } else {
    const stats = getEventStats(event);
    soldCount += stats.purchases;
  }

  return soldCount;
};

const LandscapeEventCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex flex-col bg-white border border-gray-150/60 rounded-2xl sm:rounded-[2rem] shadow-xs shrink-0 w-[200px] sm:w-[240px] md:w-[280px] overflow-hidden">
      {/* Image header skeleton */}
      <div className="aspect-[4/5] bg-gray-100 animate-pulse" />

      {/* Body container */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Location skeleton */}
        <div className="w-1/3 h-3 bg-gray-150 rounded-md animate-pulse mb-2" />

        {/* Title skeleton */}
        <div className="space-y-1.5 mb-3 h-9 sm:h-11 md:h-12">
          <div className="w-11/12 h-3.5 bg-gray-150 rounded-md animate-pulse" />
          <div className="w-2/3 h-3.5 bg-gray-150 rounded-md animate-pulse" />
        </div>

        {/* Footer skeleton */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-150 flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-2 bg-gray-150 rounded-md animate-pulse" />
            <div className="w-20 h-4 bg-gray-150 rounded-md animate-pulse" />
          </div>
          <div className="w-14 sm:w-20 h-6 sm:h-8 bg-gray-150 rounded-lg sm:rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const CategoryRowSkeleton: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex flex-col mb-0">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-adv-slate leading-none">
          {title}
        </h3>
        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <div className="w-16 sm:w-20 h-3.5 sm:h-4 bg-gray-150 rounded-md animate-pulse" />
          <div className="flex items-center gap-2 hidden">
            {/* Nav buttons removed from skeleton header, they appear inside carousel area now */}
          </div>
        </div>
      </div>

      {/* Horizontal List */}
      <div className="flex overflow-x-auto pb-0 sm:pb-1 -ml-5 -mr-4 pl-5 sm:mx-0 sm:pl-0 hide-scrollbar gap-3 sm:gap-6 snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-0">
        {[1, 2, 3, 4].map((n) => (
          <LandscapeEventCardSkeleton key={n} />
        ))}
        <div className="w-1 shrink-0 sm:hidden"></div>
      </div>
    </div>
  );
};

const CategoryRow: React.FC<{ category: string, events: LaoEvent[], title: string }> = ({ category, events, title }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const categoryId = categoryToId[category] || category.toLowerCase();
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // If the content doesn't overflow the container at all, hide both buttons
      if (scrollWidth <= clientWidth + 5) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }
      // Require a larger scroll amount to confirm intentional scrolling
      if (scrollLeft > 50) {
        setHasScrolled(true);
      } else if (scrollLeft <= 10) {
        setHasScrolled(false);
      }
      
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    // Re-check after a short delay to account for layout shifts/image loads
    const timeout = setTimeout(checkScroll, 150);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkScroll);
    }
  }, [events]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      if (direction === 'right') setHasScrolled(true);
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      // Call checkScroll slightly after the scroll animation starts
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="flex flex-col mb-0 relative">
      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-adv-slate leading-none">
          {title}
        </h3>
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <Link 
            to={`/category/${categoryId}`}
            className="text-[10px] sm:text-xs font-black text-adv-orange hover:text-black transition-colors uppercase tracking-wider sm:tracking-widest inline-flex items-center gap-1 group/btn"
          >
            <span>{lang === 'en' ? 'See More' : 'ເບິ່ງເພີ່ມເຕີມ'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
      
      <div className="relative group/carousel">
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto overflow-y-hidden pb-0 sm:pb-1 -ml-5 -mr-4 pl-5 sm:mx-0 sm:pl-0 hide-scrollbar gap-3 sm:gap-6 snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-0 scroll-smooth hardware-accelerated"
        >
          {events.map((event, index) => (
            <LandscapeEventCard 
              key={event.id} 
              event={event} 
              index={index}
            />
          ))}
          <div className="w-1 shrink-0 sm:hidden"></div>
        </div>
        
        {/* Nav Buttons overlay */}
        {canScrollLeft && hasScrolled && (
          <button 
            onClick={() => scroll('left')} 
            className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 z-50 hidden sm:flex w-12 h-12 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-adv-slate hover:bg-white hover:text-adv-orange hover:border-adv-orange/30 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 hover:scale-105 cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-current" />
          </button>
        )}
        
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')} 
            className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 z-50 hidden sm:flex w-12 h-12 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-adv-slate hover:bg-white hover:text-adv-orange hover:border-adv-orange/30 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 hover:scale-105 cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-current" />
          </button>
        )}
      </div>
    </div>
  );
}

const PopularEventsRow: React.FC<{
  popularEvents: { event: LaoEvent; ticketsSold: number }[];
  title: string;
}> = ({ popularEvents, title }) => {
  const { lang } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollWidth <= clientWidth + 5) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }
      if (scrollLeft > 50) {
        setHasScrolled(true);
      } else if (scrollLeft <= 10) {
        setHasScrolled(false);
      }
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const timeout = setTimeout(checkScroll, 150);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkScroll);
    }
  }, [popularEvents]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      if (direction === 'right') setHasScrolled(true);
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="flex flex-col mb-0 relative">
      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-adv-slate leading-none">
            {title}
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-orange-100 text-adv-orange border border-orange-200/80 uppercase tracking-wider shrink-0">
            <Flame className="w-3.5 h-3.5 fill-adv-orange text-adv-orange" />
            {lang === 'lo' ? '5 ອັນດັບສູງສຸດ' : 'Top 5'}
          </span>
        </div>
      </div>
      
      <div className="relative group/carousel">
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex lg:grid lg:grid-cols-5 overflow-x-auto overflow-y-hidden pb-0 sm:pb-1 -ml-5 -mr-4 pl-5 sm:mx-0 sm:pl-0 lg:mx-0 lg:pl-0 lg:overflow-visible hide-scrollbar gap-3 sm:gap-6 lg:gap-4 xl:gap-5 snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-0 scroll-smooth hardware-accelerated"
        >
          {popularEvents.map(({ event, ticketsSold }, index) => (
            <LandscapeEventCard 
              key={event.id} 
              event={event} 
              index={index}
              rank={index + 1}
              ticketsSold={ticketsSold}
              className="shrink-0 w-[200px] sm:w-[240px] md:w-[280px] lg:w-full"
            />
          ))}
          <div className="w-1 shrink-0 sm:hidden"></div>
        </div>
        
        {/* Nav Buttons overlay */}
        {canScrollLeft && hasScrolled && (
          <button 
            onClick={() => scroll('left')} 
            className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 z-50 hidden sm:flex lg:hidden w-12 h-12 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-adv-slate hover:bg-white hover:text-adv-orange hover:border-adv-orange/30 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 hover:scale-105 cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-current" />
          </button>
        )}
        
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')} 
            className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 z-50 hidden sm:flex lg:hidden w-12 h-12 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-adv-slate hover:bg-white hover:text-adv-orange hover:border-adv-orange/30 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 hover:scale-105 cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-current" />
          </button>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedEvents, setFetchedEvents] = useState<LaoEvent[]>([]);
  const { lang } = useLanguage();
  const t = translations[lang];

  const [heroSettings, setHeroSettings] = useState<HomeHeroSettings>(DEFAULT_HOME_HERO_SETTINGS);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setTouchEndX(null);
    if ('touches' in e) {
      setTouchStartX(e.targetTouches[0].clientX);
    } else {
      setTouchStartX((e as React.MouseEvent).clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      setTouchEndX(e.targetTouches[0].clientX);
    } else if (touchStartX !== null) {
      setTouchEndX((e as React.MouseEvent).clientX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 35;
    
    // heroSlides isn't defined here yet, but we can compute it inside the effect or use a functional update
    if (distance > minSwipeDistance) {
      setCurrentImageIndex((prev) => (prev + 1) % Math.max(1, (heroSettings.slides?.length || DEFAULT_HOME_HERO_SETTINGS.slides.length)));
    } else if (distance < -minSwipeDistance) {
      setCurrentImageIndex((prev) => {
        const len = Math.max(1, (heroSettings.slides?.length || DEFAULT_HOME_HERO_SETTINGS.slides.length));
        return prev === 0 ? len - 1 : prev - 1;
      });
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Fetch dynamic hero settings from Firestore / LocalStorage
  useEffect(() => {
    let isMounted = true;
    getHomeHeroSettings()
      .then((settings) => {
        if (isMounted && settings && settings.slides && settings.slides.length > 0) {
          setHeroSettings(settings);
        }
      })
      .catch((err) => {
        console.error('Failed to load dynamic hero settings:', err);
      });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<HomeHeroSettings>;
      if (customEvent.detail?.slides?.length) {
        setHeroSettings(customEvent.detail);
      }
    };

    window.addEventListener('pasopkan_home_hero_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('pasopkan_home_hero_updated', handleUpdate);
    };
  }, []);

  const heroSlides = heroSettings.slides && heroSettings.slides.length > 0
    ? heroSettings.slides
    : DEFAULT_HOME_HERO_SETTINGS.slides;

  // Preload appropriately sized images
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const width = isMobile ? '600' : '2070';
    heroSlides.forEach((slide) => {
      if (slide.imageUrl) {
        const img = new Image();
        if (slide.imageUrl.includes('images.unsplash.com')) {
          img.src = `${slide.imageUrl}&w=${width}`;
        } else {
          img.src = slide.imageUrl;
        }
      }
    });
  }, [heroSlides]);

  // Image slider timer based on configurable slideIntervalSeconds
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const intervalMs = (heroSettings.slideIntervalSeconds || 5) * 1000;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroSlides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [heroSlides.length, heroSettings.slideIntervalSeconds]);

  useEffect(() => {
    setIsLoading(true);
    let allEvents = events;
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((e: any) => e.id));
          allEvents = [...parsed, ...events.filter(e => !existingIds.has(e.id))];
        }
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
      const checkDate = evt.endDate || evt.bookingEndDate || evt.date;
      return (!checkDate || checkDate >= todayStr) && evt.status !== 'pending' && evt.status !== 'rejected';
    });

    setFetchedEvents(activeEvents);
    setIsLoading(false);
  }, []);

  // Top 5 Popular Events sorted by tickets sold the most
  const popularEvents = React.useMemo(() => {
    if (!fetchedEvents || fetchedEvents.length === 0) return [];

    return [...fetchedEvents]
      .map(event => ({
        event,
        ticketsSold: getEventTicketsSold(event)
      }))
      .sort((a, b) => b.ticketsSold - a.ticketsSold)
      .slice(0, 5);
  }, [fetchedEvents]);

  const categoryTitles: Record<string, Record<'en' | 'lo', string>> = {
    'Sports': { en: 'Adventure and Tour', lo: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ' },
    'Festival': { en: 'Festivals', lo: 'ເທດສະການ' },
    'Workshop': { en: 'Workshops', lo: 'ເວີກຊັອບ' },
    'Voucher': { en: 'Voucher and Booking', lo: 'Voucher ແລະ ການຈອງ' }
  };

  const categories = ['Workshop', 'Sports', 'Festival', 'Voucher'];

  const currentSlide = heroSlides[currentImageIndex] || heroSlides[0];
  const isUnsplash = currentSlide?.imageUrl?.includes('images.unsplash.com');

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={lang === 'lo' ? 'ໜ້າຫຼັກ - ຄົ້ນພົບກິດຈະກຳ ແລະ ງານເທດສະການ' : 'Home - Discover Events & Experiences in Laos'}
        description={lang === 'lo' ? 'ຄົ້ນພົບ ແລະ ຈອງປີ້ງານກິດຈະກຳ, ເວີກຊັອບ, ກິລາ ແລະ ເທດສະການຊັ້ນນຳໃນປະເທດລາວ' : 'Explore and book tickets for the best workshops, outdoor adventures, festivals, and cultural events across Laos.'}
      />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-2 sm:pt-3">
        <section 
          className="relative h-[220px] sm:h-[360px] landscape:h-[260px] lg:h-[1080px] flex flex-col justify-center items-center overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] touch-pan-y select-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={() => {
            if (touchStartX !== null) handleTouchEnd();
          }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentSlide?.id || currentSlide?.imageUrl || currentImageIndex}
                src={isUnsplash ? `${currentSlide.imageUrl}&w=1200` : currentSlide.imageUrl}
                srcSet={isUnsplash ? `${currentSlide.imageUrl}&w=600 600w, 
                         ${currentSlide.imageUrl}&w=1200 1200w, 
                         ${currentSlide.imageUrl}&w=2070 2000w` : undefined}
                sizes="(max-width: 768px) 600px, (max-width: 1200px) 1200px, 100vw"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "linear" }}
                className="absolute inset-0 w-full h-full object-cover"
                alt={currentSlide?.title_en || 'Hero Background'}
                fetchPriority="high"
              />
            </AnimatePresence>
          </div>

          {/* Carousel Pagination Dots inside image */}
          <div 
            className="absolute bottom-2.5 sm:bottom-4 left-0 right-0 z-20 flex items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/30 backdrop-blur-xs">
              {heroSlides.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentImageIndex 
                      ? 'w-4 sm:w-5 bg-adv-orange' 
                      : 'w-1 sm:w-1.5 bg-white/70 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Category Icons Navigation - Hidden in desktop mode (md and up) as requested, available on mobile for touch navigation */}
      <section className="md:hidden max-w-7xl mx-auto px-5 sm:px-8 mt-5 sm:mt-6 mb-2">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between sm:justify-center overflow-x-auto hide-scrollbar sm:gap-12 pb-1 max-w-2xl mx-auto"
        >
           {[
             { id: 'workshop', label: t.workshops, icon: Lightbulb },
             { id: 'sports', label: t.adventure, icon: Mountain },
             { id: 'festival', label: t.festivals, icon: PartyPopper },
             { id: 'voucher', label: t.vouchers, icon: Ticket },
           ].map((cat, idx) => (
             <motion.div
               key={cat.id}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.05 }}
               className="shrink-0"
             >
               <Link 
                 to={`/category/${cat.id}`}
                 className="flex flex-col items-center gap-2 sm:gap-3 group relative"
               >
                  <div className="w-[64px] h-[64px] xs:w-[72px] xs:h-[72px] sm:w-[88px] sm:h-[88px] rounded-[1.25rem] sm:rounded-[1.75rem] bg-orange-50 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:bg-adv-orange group-hover:shadow-lg group-hover:shadow-adv-orange/30">
                     <cat.icon strokeWidth={1.5} className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-adv-orange group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="text-center w-full max-w-[72px] sm:max-w-[96px]">
                     <span className="block text-[10px] xs:text-[11px] sm:text-xs font-bold text-gray-800 leading-tight group-hover:text-adv-orange transition-colors duration-300">
                       {cat.label}
                     </span>
                  </div>
               </Link>
             </motion.div>
           ))}
        </motion.div>
      </section>

      <section id="events-section" className="pl-5 pr-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-0 mt-6 sm:mt-8 md:mt-10">
        <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
          {/* Popular Events Section - sorted by ticket sold the most (Top 5) */}
          {isLoading ? (
            <CategoryRowSkeleton 
              title={lang === 'lo' ? 'ກິດຈະກຳຍອດນິຍົມ' : 'Popular Events'} 
            />
          ) : (
            popularEvents.length > 0 && (
              <PopularEventsRow 
                popularEvents={popularEvents}
                title={lang === 'lo' ? 'ກິດຈະກຳຍອດນິຍົມ' : 'Popular Events'}
              />
            )
          )}

          {isLoading ? (
            categories.map((category) => (
              <CategoryRowSkeleton 
                key={category} 
                title={categoryTitles[category][lang]} 
              />
            ))
          ) : (
            categories.map((category) => {
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
            })
          )}
        </div>
      </section>
      
      {/* Blog & Event Stories Section under every section category */}
      <HomeBlogSection />
    </div>
  );
}
