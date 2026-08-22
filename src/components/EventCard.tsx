import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LaoEvent } from '../data/events';

interface EventCardProps {
  key?: React.Key;
  event: LaoEvent;
  index?: number;
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
    voucher: 'ບັດສ່ວນຫຼຸດ ແລະ ການຈອງ',
    free: 'ຟຣີ',
    soldOut: 'ໝົດແລ້ວ',
    pastEvent: 'ຜ່ານມາ',
    viewEvent: 'ເບິ່ງ',
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
    : `${new Date(event.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { month: 'short', day: 'numeric' })}${event.time ? ` • ${event.time}` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group relative flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 hover:border-adv-orange/50 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer h-full"
      onClick={() => navigate(`/event/${event.id}`, { state: { from: location.pathname + location.search } })}
    >
      {/* Image Container with compact aspect ratio */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100 shrink-0">
        <img 
          src={event.image.includes('unsplash.com') ? event.image.replace(/w=\d+/, 'w=600') : event.image} 
          srcSet={
            event.image.includes('unsplash.com') 
            ? `${event.image.replace(/w=\d+/, 'w=400')} 400w, ${event.image.replace(/w=\d+/, 'w=800')} 800w`
            : undefined
          }
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40 pointer-events-none" />

        {/* Status / Date Badges */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
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

        {/* Date Overlay Pill */}
        {event.dateType === 'fixed' && event.date && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-md text-adv-slate shadow-2xs border border-white/60 text-[10px] font-black">
              <Calendar className="w-3 h-3 text-adv-orange shrink-0" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Content Body */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 min-w-0">
        {/* Location */}
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-500 font-medium mb-1 truncate">
          <MapPin className="w-3 h-3 text-adv-orange shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>

        {/* Event Title */}
        <h3 className="text-xs sm:text-sm font-extrabold text-adv-slate mb-1.5 line-clamp-2 leading-snug tracking-tight group-hover:text-adv-orange transition-colors">
          {event.title}
        </h3>
        
        {/* Date Details */}
        <div className="text-[10px] sm:text-[11px] text-gray-400 font-medium mb-2.5 flex items-center gap-1 truncate">
          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </div>
        
        {/* Footer Action Bar */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase text-gray-400 tracking-wider leading-none mb-0.5">{t.startingFrom}</span>
            <span className="text-xs sm:text-sm font-black text-adv-slate truncate">{getPriceRange()}</span>
          </div>
          
          <button 
            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              isPast 
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' 
                : 'bg-adv-orange text-white hover:bg-orange-600 shadow-2xs shadow-orange-500/20'
            }`}
          >
            <span>{isPast ? t.viewEvent : t.buyTickets}</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}


