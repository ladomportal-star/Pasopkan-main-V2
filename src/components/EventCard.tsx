import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Star, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LaoEvent } from '../data/events';

interface EventCardProps {
  key?: React.Key;
  event: LaoEvent;
  index?: number;
}

const translations = {
  en: {
    startingFrom: 'Starting from',
    buyTickets: 'Buy Tickets',
    all: 'All',
    concert: 'Concert',
    sports: 'Adventure & Tour',
    workshop: 'Workshops',
    festival: 'Festivals',
    voucher: 'Vouchers',
    free: 'Free',
    soldOut: 'Sold Out',
    pastEvent: 'Past Event',
    viewEvent: 'View Event',
  },
  lo: {
    startingFrom: 'ເລີ່ມຕົ້ນທີ່',
    buyTickets: 'ຊື້ປີ້',
    all: 'ທັງໝົດ',
    concert: 'ຄອນເສີດ',
    sports: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ',
    workshop: 'ເວີກຊອບ',
    festival: 'ເທດສະການ',
    voucher: 'Voucher',
    free: 'ຟຣີ',
    soldOut: 'ໝົດແລ້ວ',
    pastEvent: 'ຜ່ານມາແລ້ວ',
    viewEvent: 'ເບິ່ງລາຍລະອຽດ',
  }
};

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];

  const todayStr = new Date().toISOString().split('T')[0];
  const checkDate = event.endDate || event.date;
  const isPast = checkDate ? checkDate < todayStr : false;

  const getTranslatedCategory = (cat: string) => {
    switch(cat) {
      case 'All': return t.all;
      case 'Concert': return t.concert;
      case 'Sports': return t.sports;
      case 'Workshop': return t.workshop;
      case 'Festival': return t.festival;
      case 'Voucher': return t.voucher;
      default: return cat;
    }
  };

  const getPriceRange = () => {
    const rawPrices = (event.hasSeating && event.seatingZones 
      ? event.seatingZones.map(z => Number(String(z.price).replace(/,/g, ''))) 
      : (event.ticketTiers ? event.ticketTiers.map(t => Number(String(t.price).replace(/,/g, ''))) : [0]));
    
    const validPrices = rawPrices.filter(p => !isNaN(p));
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const currency = lang === 'lo' ? 'ກີບ' : 'Kip';
    
    if (minPrice === 0 || !isFinite(minPrice)) return t.free;
    return `${minPrice.toLocaleString()} ${currency}`;
  };

  const formattedDate = event.dateType === 'flexible' && event.flexibleDateDesc 
    ? event.flexibleDateDesc 
    : event.dateType === 'booking'
    ? `${lang === 'en' ? 'Booking Available' : 'ເປີດໃຫ້ຈອງ'}`
    : `${new Date(event.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { month: 'short', day: 'numeric', year: 'numeric' })}${event.time ? ` • ${event.time}` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-gray-150/80 shadow-2xs hover:shadow-xl hover:border-orange-300/60 transition-all duration-300 overflow-hidden cursor-pointer h-full"
      onClick={() => navigate(`/event/${event.id}`, { state: { from: location.pathname + location.search } })}
    >
      {/* Image Header Container */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-gray-100 shrink-0">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Subtle Bottom Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Category Pill - Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-adv-slate shadow-xs border border-white/40">
            {getTranslatedCategory(event.category)}
          </span>
        </div>

        {/* Top Right Status Badge */}
        {isPast ? (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 text-white backdrop-blur-md text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-xs border border-white/20">
              {t.pastEvent}
            </span>
          </div>
        ) : event.dateType === 'booking' ? (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-adv-orange text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-xs border border-white/20">
              {lang === 'en' ? 'Booking' : 'ເປີດໃຫ້ຈອງ'}
            </span>
          </div>
        ) : null}

        {/* Date Overlay Pill - Bottom Left */}
        {event.dateType === 'fixed' && event.date && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md text-adv-slate shadow-sm border border-white/50 text-xs font-black">
              <Calendar className="w-3.5 h-3.5 text-adv-orange shrink-0" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
        {/* Star Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>
          <span className="text-[11px] font-bold text-gray-400">4.8</span>
        </div>

        {/* Event Title */}
        <h3 className="text-base sm:text-lg font-extrabold text-adv-slate mb-2 line-clamp-2 leading-snug tracking-tight group-hover:text-adv-orange transition-colors">
          {event.title}
        </h3>
        
        {/* Location & Date Details */}
        <div className="space-y-1.5 mb-4 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-adv-orange shrink-0" />
            <span className="truncate">{event.venue}, {event.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-adv-orange/80 shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
        </div>
        
        {/* Footer Action Bar */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block mb-0.5">{t.startingFrom}</span>
            <span className="text-base sm:text-lg font-black text-adv-slate">{getPriceRange()}</span>
          </div>
          
          <button 
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
              isPast 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                : 'bg-adv-orange text-white hover:bg-orange-600 shadow-xs shadow-orange-500/20 group-hover:shadow-md'
            }`}
          >
            <span>{isPast ? t.viewEvent : t.buyTickets}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}


