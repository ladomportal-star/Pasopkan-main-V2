import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, Calendar, Tag, MapPin, History, ChevronDown, X } from 'lucide-react';
import { events, LaoEvent } from '../data/events';
import EventCard from '../components/EventCard';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../lib/storage';
import SEO from '../components/SEO';

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
    allCategories: 'Categories',
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
    allCategories: 'ໝວດໝູ່',
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
      en: { Sports: 'Adventure & Sports', Workshop: 'Workshops', Festival: 'Festivals', Voucher: 'Voucher and Booking' },
      lo: { Sports: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ', Workshop: 'ເວີກຊອບ', Festival: 'ເທດສະການ', Voucher: 'Voucher ແລະ ການຈອງ' }
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

  const translatedCat = getTranslatedCategory(categoryName);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-3 sm:pt-6 pb-8 sm:pb-12">
      <SEO
        title={`${translatedCat} Events`}
        description={`Explore upcoming and featured ${translatedCat} events, workshops, and experiences across Laos on Pasopkan.`}
        keywords={[translatedCat, 'Laos Events', 'Pasopkan', 'Tickets', categoryName]}
      />
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* Top Header Row with Back link */}
        <div className="flex items-center justify-between mb-3 sm:mb-5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-adv-orange transition-colors text-xs sm:text-sm font-bold">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t.backToHome}
          </Link>
        </div>

        {/* Simplified Category Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-gray-200/70">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-adv-slate tracking-tight">
              {getTranslatedCategory(categoryName)}
            </h1>
          </div>

          {/* Simple Inline Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
            {/* Price Filter Pill */}
            <div className="relative shrink-0">
              <select 
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className={`appearance-none rounded-full pl-3.5 pr-7 py-1.5 text-xs font-bold outline-none cursor-pointer transition-all ${
                  priceFilter !== 'all' 
                    ? 'bg-adv-orange text-white shadow-xs font-black' 
                    : 'bg-white text-gray-700 hover:bg-gray-100/80 border border-gray-200'
                }`}
              >
                <option value="all" className="text-gray-900 bg-white">{t.priceAll}</option>
                <option value="free" className="text-gray-900 bg-white">{t.priceFree}</option>
                <option value="under100k" className="text-gray-900 bg-white">{t.priceUnder100k}</option>
                <option value="100k-500k" className="text-gray-900 bg-white">{t.price100k_500k}</option>
                <option value="over500k" className="text-gray-900 bg-white">{t.priceOver500k}</option>
              </select>
              <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${priceFilter !== 'all' ? 'text-white' : 'text-gray-400'}`} />
            </div>

            {/* Location Filter Pill */}
            <div className="relative shrink-0">
              <select 
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className={`appearance-none rounded-full pl-3.5 pr-7 py-1.5 text-xs font-bold outline-none cursor-pointer transition-all ${
                  locationFilter !== 'all' 
                    ? 'bg-adv-orange text-white shadow-xs font-black' 
                    : 'bg-white text-gray-700 hover:bg-gray-100/80 border border-gray-200'
                }`}
              >
                <option value="all" className="text-gray-900 bg-white">{t.locationAll}</option>
                {locations.map(loc => (
                  <option key={loc} value={loc} className="text-gray-900 bg-white">{loc}</option>
                ))}
              </select>
              <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${locationFilter !== 'all' ? 'text-white' : 'text-gray-400'}`} />
            </div>

            {/* Clear Filters Button */}
            {(priceFilter !== 'all' || locationFilter !== 'all') && (
              <button
                onClick={() => { setPriceFilter('all'); setLocationFilter('all'); }}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-adv-orange bg-white hover:bg-gray-50 px-2.5 py-1.5 rounded-full border border-gray-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.clearFilters}</span>
              </button>
            )}
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 opacity-90">
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
