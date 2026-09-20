import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, ArrowRight, Gauge, Layers, Clock, Flame } from 'lucide-react';
import { LaoEvent, getEventStatus } from '../data/events';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  en: {
    capacity: 'People Joined',
    book: 'Book It',
    starting: 'Starting from',
    free: 'Free',
    pastEvent: 'Past Event',
  },
  lo: {
    capacity: 'ຜູ້ເຂົ້າຮ່ວມແລ້ວ',
    book: 'ຈອງດຽວນີ້',
    starting: 'ລາຄາເລີ່ມຕົ້ນ',
    free: 'ຟຣີ',
    pastEvent: 'ຜ່ານມາ',
  }
};

const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Vientiane, LA': { lat: 17.9757, lon: 102.6331 },
  'Vang Vieng, LA': { lat: 18.9333, lon: 102.4500 },
  'Luang Prabang, LA': { lat: 19.8901, lon: 102.1347 },
  'Luang Namtha, LA': { lat: 20.9500, lon: 101.4000 },
  'Pakse, LA': { lat: 15.1200, lon: 105.7800 }
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

interface LandscapeEventCardProps {
  event: LaoEvent;
  index: number;
  userCoords?: { lat: number; lon: number } | null;
  rank?: number;
  ticketsSold?: number;
  className?: string;
}

const LandscapeEventCard: React.FC<LandscapeEventCardProps> = ({ event, index, userCoords, rank, ticketsSold, className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const clean = dateStr.trim();
      let d: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [year, month, day] = clean.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(clean);
      }
      if (isNaN(d.getTime())) return dateStr;
      
      const dayStr = d.getDate().toString().padStart(2, '0');
      const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const yearStr = d.getFullYear();
      return `${dayStr}/${monthStr}/${yearStr}`;
    } catch {
      return dateStr || '';
    }
  };

  const getEventDateDisplay = () => {
    // If flexible date, do not show badge as requested
    if (event.dateType === 'flexible') {
      return '';
    }
    if (event.dateType === 'booking') {
      return lang === 'en' ? 'Booking Available' : 'ເປີດໃຫ້ຈອງ';
    }
    if (!event.date) return '';
    const start = formatEventDate(event.date);
    if (event.endDate && event.endDate !== event.date) {
      const end = formatEventDate(event.endDate);
      return `${start} - ${end}`;
    }
    return start;
  };

  const dateBadge = getEventDateDisplay();

  const todayStr = new Date().toISOString().split('T')[0];
  const checkDate = event.endDate || event.date;
  const isPast = checkDate ? checkDate < todayStr : false;

  const getDistanceString = () => {
    if (!userCoords) return null;
    const coords = CITY_COORDINATES[event.location];
    if (!coords) return null;
    const dist = getDistance(userCoords.lat, userCoords.lon, coords.lat, coords.lon);
    if (dist < 1) {
      return lang === 'en' ? 'Under 1 km away' : 'ຕໍ່າກວ່າ 1 ກມ';
    }
    return lang === 'en' 
      ? `${dist.toFixed(1)} km away` 
      : `${dist.toFixed(1)} ກມ ຫ່າງອອກໄປ`;
  };

  const getPriceRange = () => {
    const rawPrices = (event.ticketTiers ? event.ticketTiers.map(t => Number(String(t.price).replace(/,/g, ''))) : [0]);
    const validPrices = rawPrices.filter(p => !isNaN(p));
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    
    if (minPrice === 0 || !isFinite(minPrice)) return t.free;
    
    const currency = lang === 'lo' ? 'ກີບ' : 'Kip';
    return `${minPrice.toLocaleString()} ${currency}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      className={`group relative flex flex-col commerce-card overflow-hidden cursor-pointer snap-start rounded-2xl sm:rounded-[2rem] ${className || 'shrink-0 w-[200px] sm:w-[240px] md:w-[280px]'}`}
      onClick={() => navigate(`/event/${event.id}`, { state: { from: location.pathname + location.search } })}
    >
      {/* Visual Header */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img 
          src={event.image.includes('unsplash.com') ? event.image.replace(/w=\d+/, 'w=600') : event.image} 
          srcSet={
            event.image.includes('unsplash.com') 
            ? `${event.image.replace(/w=\d+/, 'w=400')} 400w, ${event.image.replace(/w=\d+/, 'w=800')} 800w`
            : undefined
          }
          sizes="(max-width: 640px) 250px, 400px"
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Badges */}
        {/* Top Left: Rank & Tickets Sold */}
        {rank !== undefined && (
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10">
            <div className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black text-white shadow-sm flex items-center gap-1 ${
              rank === 1 
                ? 'bg-gradient-to-r from-amber-500 to-adv-orange shadow-orange-500/20' 
                : rank === 2
                ? 'bg-gradient-to-r from-slate-600 to-slate-700'
                : rank === 3
                ? 'bg-gradient-to-r from-amber-700 to-amber-800'
                : 'bg-slate-900/80 backdrop-blur-xs'
            }`}>
              <Flame className="w-3 h-3 fill-current" />
              <span>#{rank}</span>
            </div>

          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
          {getDistanceString() && (
            <span className="shrink-0 text-[9px] sm:text-[10px] font-black text-adv-slate bg-white/95 backdrop-blur-md px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
              {getDistanceString()}
            </span>
          )}
          {isPast && (
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-white backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
              {t.pastEvent}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
        {/* Badges under image: Location on line 1, Date/Time on line 2 */}
        <div className="flex flex-col gap-1.5 mb-2.5">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/60 w-fit max-w-full">
            <MapPin className="w-3 h-3 text-adv-orange shrink-0" />
            <span className="truncate">{event.venue || event.location}</span>
          </div>

          {dateBadge && (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/60 w-fit max-w-full">
              <Calendar className="w-3 h-3 text-adv-orange shrink-0" />
              <span className="truncate">{dateBadge}</span>
            </div>
          )}
        </div>

        <h3 className="text-sm sm:text-base md:text-lg font-bold text-adv-slate leading-snug line-clamp-2 break-words mb-2 ">
          {event.title}
        </h3>

        {/* Footer */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col min-w-0 mr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{t.starting}</span>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-sm sm:text-base md:text-lg font-bold text-adv-orange leading-tight truncate">{getPriceRange()}</span>
            </div>
          </div>
          
          <button className="shrink-0 text-[11px] sm:text-xs font-bold text-adv-orange group-hover:underline flex items-center gap-1">
             {t.book}
             <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LandscapeEventCard;
