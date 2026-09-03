import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, ArrowRight, Gauge, Layers } from 'lucide-react';
import { LaoEvent, getEventStatus } from '../data/events';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  en: {
    difficulty: 'Energy Rating',
    capacity: 'People Joined',
    book: 'Book It',
    starting: 'Starting from',
    reviewed: 'reviews',
    free: 'Free',
  },
  lo: {
    difficulty: 'ລະດັບພະລັງງານ',
    capacity: 'ຜູ້ເຂົ້າຮ່ວມແລ້ວ',
    book: 'ຈອງດຽວນີ້',
    starting: 'ລາຄາເລີ່ມຕົ້ນ',
    reviewed: 'ລີວິວ',
    free: 'ຟຣີ',
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
}

const LandscapeEventCard: React.FC<LandscapeEventCardProps> = ({ event, index, userCoords }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col commerce-card shrink-0 w-[230px] sm:w-[280px] md:w-[320px] overflow-hidden cursor-pointer snap-start rounded-2xl sm:rounded-[2rem]"
      onClick={() => navigate(`/event/${event.id}`, { state: { from: location.pathname + location.search } })}
    >
      {/* Visual Header */}
      <div className="relative h-32 sm:h-40 md:h-44 overflow-hidden bg-gray-100">
        <img 
          src={event.image.includes('unsplash.com') ? event.image.replace(/w=\d+/, 'w=600') : event.image} 
          srcSet={
            event.image.includes('unsplash.com') 
            ? `${event.image.replace(/w=\d+/, 'w=400')} 400w, ${event.image.replace(/w=\d+/, 'w=800')} 800w`
            : undefined
          }
          sizes="(max-width: 640px) 250px, 400px"
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-1.5 text-[11px] sm:text-xs text-adv-slate/50 mb-1.5">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-adv-orange/70 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          {getDistanceString() && (
            <span className="shrink-0 text-[9px] sm:text-[10px] font-bold text-adv-orange bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100/30 whitespace-nowrap">
              {getDistanceString()}
            </span>
          )}
        </div>

        <h3 className="text-sm sm:text-base md:text-lg font-bold text-adv-slate leading-snug line-clamp-2 mb-2 h-9 sm:h-11 md:h-12">
          {event.title}
        </h3>

        {/* Footer */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.starting}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base md:text-lg font-bold text-adv-orange leading-tight">{getPriceRange()}</span>
            </div>
          </div>
          
          <button className="text-[11px] sm:text-xs font-bold text-adv-orange group-hover:underline flex items-center gap-1">
             {t.book}
             <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LandscapeEventCard;
