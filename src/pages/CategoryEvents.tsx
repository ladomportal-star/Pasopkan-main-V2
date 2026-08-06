import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, Calendar, Tag, MapPin, History } from 'lucide-react';
import { events, LaoEvent } from '../data/events';
import EventCard from '../components/EventCard';
import { useLanguage } from '../LanguageContext';
import { safeStorage } from '../lib/storage';

const translations = {
  en: {
    allEventsIn: 'All events in',
    noEvents: 'No events found matching your criteria.',
    backToHome: 'Back to Home',
    filters: 'Filters',
    dateAll: 'All Dates',
    dateUpcoming: 'Upcoming',
    datePast: 'Past Events',
    priceAll: 'All Prices',
    priceFree: 'Free',
    priceUnder100k: 'Under 100k LAK',
    price100k_500k: '100k - 500k LAK',
    priceOver500k: 'Over 500k LAK',
    noMatchingTitle: 'No matching events',
    clearFilters: 'Clear Filters',
    locationAll: 'All Locations',
    activeUpcomingTitle: 'Active & Upcoming Events',
    pastEventsTitle: 'Past Events',
  },
  lo: {
    allEventsIn: 'ກິດຈະກຳທັງໝົດໃນ',
    noEvents: 'ບໍ່ພົບກິດຈະກຳທີ່ກົງກັບເງື່ອນໄຂຂອງທ່ານ.',
    backToHome: 'ກັບຄືນໜ້າຫຼັກ',
    filters: 'ຕົວກັ່ນຕອງ',
    dateAll: 'ທຸກວັນທີ',
    dateUpcoming: 'ທີ່ຈະມາເຖິງ',
    datePast: 'ກິດຈະກຳຜ່ານມາແລ້ວ',
    priceAll: 'ທຸກລາຄາ',
    priceFree: 'ຟຣີ',
    priceUnder100k: 'ຕ່ຳກວ່າ 100,000 ກີບ',
    price100k_500k: '100k - 500k ກີບ',
    priceOver500k: 'ຫຼາຍກວ່າ 500,000 ກີບ',
    noMatchingTitle: 'ບໍ່ພົບກິດຈະກຳ',
    clearFilters: 'ລຶບຕົວກັ່ນຕອງ',
    locationAll: 'ທຸກສະຖານທີ່',
    activeUpcomingTitle: 'ກິດຈະກຳທີ່ກຳລັງດຳເນີນ / ຈະມາເຖິງ',
    pastEventsTitle: 'ກິດຈະກຳທີ່ຜ່ານມາແລ້ວ',
  }
};

type DateFilter = 'all' | 'upcoming' | 'past';
type PriceFilter = 'all' | 'free' | 'under100k' | '100k-500k' | 'over500k';

export default function CategoryEvents() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [isLoading, setIsLoading] = useState(true);
  const [categoryEvents, setCategoryEvents] = useState<LaoEvent[]>([]);

  // Filter states
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Normalize category for comparison
  const categoryName = categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1).toLowerCase() : '';

  // Extract unique locations from the category events
  const locations = useMemo(() => {
    const locs = categoryEvents.map(e => e.location);
    return Array.from(new Set(locs)).filter(Boolean);
  }, [categoryEvents]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let allEvents: LaoEvent[] = [...events];
      try {
        const saved = safeStorage.getItem('organizer_events');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const eventMap = new Map<string, LaoEvent>(events.map(e => [e.id, e]));
            parsed.forEach((e: LaoEvent) => {
              if (e && e.id) eventMap.set(e.id, e);
            });
            allEvents = Array.from(eventMap.values());
          }
        }
      } catch (err) {
        console.error("Error parsing saved organizer events", err);
      }

      const filtered = allEvents.filter(e => 
        e.category && 
        e.category.toLowerCase() === categoryId?.toLowerCase() && 
        e.status !== 'pending' && 
        e.status !== 'rejected'
      );
      setCategoryEvents(filtered);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [categoryId]);

  const getTranslatedCategory = (cat: string) => {
    const catTranslations: Record<string, any> = {
      en: { Concert: 'Concerts', Sports: 'Adventure & Sports', Workshop: 'Workshops', Festival: 'Festivals', Voucher: 'Vouchers' },
      lo: { Concert: 'ຄອນເສີດ', Sports: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ', Workshop: 'ເວີກຊອບ', Festival: 'ເທດສະການ', Voucher: 'Voucher' }
    };
    return catTranslations[lang][cat] || cat;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Counts for upcoming vs past in this category
  const counts = useMemo(() => {
    let upcomingCount = 0;
    let pastCount = 0;
    categoryEvents.forEach(e => {
      const checkDate = e.endDate || e.date;
      if (checkDate < todayStr) {
        pastCount++;
      } else {
        upcomingCount++;
      }
    });
    return { upcomingCount, pastCount, totalCount: categoryEvents.length };
  }, [categoryEvents, todayStr]);

  const displayedEvents = useMemo(() => {
    const list = categoryEvents.filter(event => {
      const checkDate = event.endDate || event.date;
      const isPast = checkDate < todayStr;

      // Date filtering
      if (dateFilter === 'upcoming' && isPast) return false;
      if (dateFilter === 'past' && !isPast) return false;

      // Price filtering
      if (priceFilter !== 'all') {
        const prices = event.ticketTiers?.map(t => t.price) || [0];
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        
        switch (priceFilter) {
          case 'free':
            if (minPrice > 0) return false;
            break;
          case 'under100k':
            if (minPrice === 0 || minPrice >= 100000) return false;
            break;
          case '100k-500k':
            if (minPrice < 100000 || minPrice > 500000) return false;
            break;
          case 'over500k':
            if (minPrice <= 500000) return false;
            break;
        }
      }

      // Location filtering
      if (locationFilter !== 'all' && event.location !== locationFilter) {
        return false;
      }

      return true;
    });

    // Sort upcoming events first (ascending date), then past events (descending date)
    return list.sort((a, b) => {
      const dateA = a.endDate || a.date;
      const dateB = b.endDate || b.date;
      const isPastA = dateA < todayStr;
      const isPastB = dateB < todayStr;

      if (!isPastA && isPastB) return -1; // Upcoming first
      if (isPastA && !isPastB) return 1;  // Past later

      if (!isPastA && !isPastB) {
        return dateA.localeCompare(dateB); // Upcoming ascending
      }
      return dateB.localeCompare(dateA); // Past descending (most recent past first)
    });
  }, [categoryEvents, dateFilter, priceFilter, locationFilter, todayStr]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming: LaoEvent[] = [];
    const past: LaoEvent[] = [];

    displayedEvents.forEach(event => {
      const checkDate = event.endDate || event.date;
      if (checkDate < todayStr) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [displayedEvents, todayStr]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-6 pb-12 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-32 h-6 bg-gray-200 rounded mb-8"></div>
          <div className="w-64 h-12 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 h-[400px]">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="w-20 h-6 bg-gray-200 rounded-full mb-4"></div>
                  <div className="w-full h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="w-3/4 h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-4 sm:pt-6 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-adv-orange transition-colors mb-5 sm:mb-8 text-xs sm:text-sm font-bold">
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t.backToHome}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-adv-slate uppercase tracking-tight">
            {getTranslatedCategory(categoryName)}
          </h1>

          {/* Filter Controls - Mobile Scrollable & Extremely Compact */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-1 sm:flex-wrap shrink-0 select-none">
            <div className="flex items-center gap-1.5 text-gray-400 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest">{t.filters}</span>
            </div>
            
            <div className="relative shrink-0">
              <div className="absolute inset-y-0 left-2.5 sm:left-3 flex items-center pointer-events-none">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              </div>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="appearance-none bg-white border border-gray-200 text-adv-slate rounded-full pl-8 pr-9 py-2 sm:pl-9 sm:pr-10 sm:py-2.5 outline-none focus:ring-2 focus:ring-adv-orange text-xs sm:text-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <option value="all">{t.dateAll}</option>
                <option value="upcoming">{t.dateUpcoming}</option>
                <option value="past">{t.datePast}</option>
              </select>
              <div className="absolute inset-y-0 right-2.5 sm:right-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="relative shrink-0">
              <div className="absolute inset-y-0 left-2.5 sm:left-3 flex items-center pointer-events-none">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              </div>
              <select 
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className="appearance-none bg-white border border-gray-200 text-adv-slate rounded-full pl-8 pr-9 py-2 sm:pl-9 sm:pr-10 sm:py-2.5 outline-none focus:ring-2 focus:ring-adv-orange text-xs sm:text-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <option value="all">{t.priceAll}</option>
                <option value="free">{t.priceFree}</option>
                <option value="under100k">{t.priceUnder100k}</option>
                <option value="100k-500k">{t.price100k_500k}</option>
                <option value="over500k">{t.priceOver500k}</option>
              </select>
              <div className="absolute inset-y-0 right-2.5 sm:right-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="relative shrink-0">
              <div className="absolute inset-y-0 left-2.5 sm:left-3 flex items-center pointer-events-none">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              </div>
              <select 
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-adv-slate rounded-full pl-8 pr-9 py-2 sm:pl-9 sm:pr-10 sm:py-2.5 outline-none focus:ring-2 focus:ring-adv-orange text-xs sm:text-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <option value="all">{t.locationAll}</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 sm:right-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {displayedEvents.length > 0 ? (
          <div className="border-t border-gray-150/60 pt-5 sm:pt-8 space-y-10 sm:space-y-12">
            {/* Active & Upcoming Events Section */}
            {upcomingEvents.length > 0 && (
              <div>
                {pastEvents.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <h2 className="text-sm sm:text-base font-extrabold text-adv-slate uppercase tracking-wider">
                      {t.activeUpcomingTitle}
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8">
                  {upcomingEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Split Divider Line between Active and Past Events */}
            {upcomingEvents.length > 0 && pastEvents.length > 0 && (
              <div className="relative my-8 sm:my-12">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t-2 border-dashed border-gray-300/80" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#F9FAFB] px-4 py-2 sm:px-6 sm:py-2.5 rounded-full border border-gray-200 shadow-sm text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    {t.pastEventsTitle}
                  </span>
                </div>
              </div>
            )}

            {/* Past Events Section */}
            {pastEvents.length > 0 && (
              <div>
                {upcomingEvents.length === 0 && (
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <History className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm sm:text-base font-extrabold text-adv-slate uppercase tracking-wider">
                      {t.pastEventsTitle}
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8 opacity-90">
                  {pastEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index + upcomingEvents.length} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 border-t border-gray-150/60 mt-5">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 border border-gray-100">
              <Filter className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-adv-slate mb-1">{t.noMatchingTitle}</h3>
            <p className="text-gray-500 text-xs max-w-md mx-auto">{t.noEvents}</p>
            <button 
              onClick={() => { setDateFilter('all'); setPriceFilter('all'); setLocationFilter('all'); }}
              className="mt-5 px-5 py-2 rounded-full bg-adv-orange/10 text-adv-orange hover:bg-adv-orange/20 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              {t.clearFilters}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
