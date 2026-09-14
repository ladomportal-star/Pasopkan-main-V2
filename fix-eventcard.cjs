const fs = require('fs');

let content = fs.readFileSync('Frontend/src/components/EventCard.tsx', 'utf-8');

// The new content will be an updated EventCard component, matching LandscapeEventCard
let newContent = `import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LaoEvent } from '../data/events';

interface EventCardProps {
  key?: React.Key;
  event: LaoEvent;
  index?: number;
  userCoords?: { lat: number; lon: number } | null;
}

const translations = {
  en: {
    startingFrom: 'From',
    buyTickets: 'Book',
    all: 'All',
    concert: 'Concert',
    sports: 'Adventure & Tour',
    workshop: 'Workshops',
    festival: 'Festivals',
    voucher: 'Voucher and Booking',
    free: 'Free',
    soldOut: 'Sold Out',
    pastEvent: 'Past Event',
    viewEvent: 'View',
  },
  lo: {
    startingFrom: 'ເລີ່ມ',
    buyTickets: 'ຊື້ປີ້',
    all: 'ທັງໝົດ',
    concert: 'ຄອນເສີດ',
    sports: 'ການຜະຈົນໄພ',
    workshop: 'ເວີກຊອບ',
    festival: 'ເທດສະການ',
    voucher: 'Voucher ແລະ ການຈອງ',
    free: 'ຟຣີ',
    soldOut: 'ໝົດແລ້ວ',
    pastEvent: 'ຜ່ານມາ',
    viewEvent: 'ເບິ່ງ',
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

export default function EventCard({ event, index = 0, userCoords }: EventCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];

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
      ? \`\${dist.toFixed(1)} km away\` 
      : \`\${dist.toFixed(1)} ກມ ຫ່າງອອກໄປ\`;
  };

  const getPriceRange = () => {
    const rawPrices = (event.hasSeating && event.seatingZones 
      ? event.seatingZones.map(z => Number(String(z.price).replace(/,/g, ''))) 
      : (event.ticketTiers ? event.ticketTiers.map(t => Number(String(t.price).replace(/,/g, ''))) : [0]));
        
    const validPrices = rawPrices.filter(p => !isNaN(p));
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const currency = lang === 'lo' ? 'ກີບ' : 'Kip';
        
    if (minPrice === 0 || !isFinite(minPrice)) return t.free;
    return \`\${minPrice.toLocaleString()} \${currency}\`;
  };

  const formattedDate = event.dateType === 'flexible' && event.flexibleDateDesc 
    ? event.flexibleDateDesc 
    : event.dateType === 'booking'
    ? \`\${lang === 'en' ? 'Booking Available' : 'ເປີດໃຫ້ຈອງ'}\`
    : \`\${new Date(event.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { month: 'short', day: 'numeric' })}\${event.time ? \` • \${event.time}\` : ''}\`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group relative flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 hover:border-adv-orange/50 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer h-full"
      onClick={() => navigate(\`/event/\${event.id}\`, { state: { from: location.pathname + location.search } })}
    >
      {/* Visual Header */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 shrink-0">
        <img 
          src={event.image.includes('unsplash.com') ? event.image.replace(/w=\\d+/, 'w=600') : event.image} 
          srcSet={
            event.image.includes('unsplash.com') 
            ? \`\${event.image.replace(/w=\\d+/, 'w=400')} 400w, \${event.image.replace(/w=\\d+/, 'w=800')} 800w\`
            : undefined
          }
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
          {getDistanceString() && (
            <span className="shrink-0 text-[9px] sm:text-[10px] font-black text-adv-slate bg-white/95 backdrop-blur-md px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
              {getDistanceString()}
            </span>
          )}
          {isPast ? (
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-white backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
              {t.pastEvent}
            </span>
          ) : event.dateType === 'booking' ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
              {lang === 'en' ? 'Booking' : 'ຈອງ'}
            </span>
          ) : null}
        </div>

        {/* Bottom Overlay Info */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/20 w-fit max-w-full">
          <MapPin className="w-3 h-3 text-white shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>
      
      {/* Content Body */}
      <div className="p-3 flex flex-col flex-1 min-w-0">
        {/* Event Title */}
        <h3 className="text-xs sm:text-sm md:text-base font-bold text-adv-slate leading-snug line-clamp-2 h-8 sm:h-10 md:h-12 group-hover:text-adv-orange transition-colors">
          {event.title}
        </h3>
        
        {/* Date Details */}
        <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1 mb-2 flex items-center gap-1 truncate">
          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </div>
        
        {/* Footer Action Bar */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase text-gray-400 tracking-wider leading-none mb-0.5">{t.startingFrom}</span>
            <span className="text-xs sm:text-sm font-black text-adv-slate truncate">{getPriceRange()}</span>
          </div>
            
          <button 
            className={\`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer shrink-0 \${
              isPast 
                ? 'text-adv-slate group-hover:underline' 
                : 'text-adv-orange group-hover:underline'
            }\`}
          >
            <span>{isPast ? t.viewEvent : t.buyTickets}</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
`;

fs.writeFileSync('Frontend/src/components/EventCard.tsx', newContent);
