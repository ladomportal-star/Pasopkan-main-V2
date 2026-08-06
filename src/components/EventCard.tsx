import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Star, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LaoEvent, getEventStatus } from '../data/events';

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
    sports: 'Adventure and Tour',
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex flex-row sm:flex-col commerce-card overflow-hidden transition-all duration-500 cursor-pointer hover:border-adv-orange/30"
      onClick={() => navigate(`/event/${event.id}`, { state: { from: location.pathname + location.search } })}
    >
      {/* Image Container */}
      <div className="relative w-32 sm:w-full aspect-square sm:aspect-[4/3] overflow-hidden shrink-0">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Category Badge */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5">
          <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-adv-slate shadow-sm border border-white/20">
            {getTranslatedCategory(event.category)}
          </div>
        </div>

        {/* Past Event Badge */}
        {isPast && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-900/90 text-white backdrop-blur-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-md border border-white/20">
              {t.pastEvent}
            </div>
          </div>
        )}

        {/* Date Badge */}
        {event.dateType !== 'flexible' && (
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10">
            <div className="flex flex-col items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white text-adv-slate shadow-lg overflow-hidden border border-gray-100">
              <span className="text-[8px] sm:text-[10px] font-black uppercase leading-none text-adv-orange">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-sm sm:text-lg font-black leading-none mt-0.5">{new Date(event.date).getDate()}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-5 md:p-6 min-w-0">
        <div className="flex items-center gap-1 mb-1 sm:mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-adv-orange fill-current" />
            ))}
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold text-gray-400">(4.8)</span>
        </div>

        <h3 className="text-sm sm:text-xl font-bold text-adv-slate mb-1 sm:mb-3 line-clamp-2 sm:line-clamp-1 group-hover:text-adv-orange transition-colors leading-tight tracking-tight">
          {event.title}
        </h3>
        
        <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-6 text-[10px] sm:text-sm text-gray-400 font-medium font-sans">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-adv-orange/60" />
            <span className="truncate">{event.venue}, {event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-adv-orange/60" />
            <span className="truncate">
              {event.dateType === 'flexible' && event.flexibleDateDesc 
                ? event.flexibleDateDesc 
                : `${new Date(event.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'lo-LA', { weekday: 'short', month: 'short', day: 'numeric' })} • ${event.time}`}
            </span>
          </div>
        </div>
        
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-widest font-black leading-none mb-0.5">{t.startingFrom}</span>
            <span className="text-sm sm:text-xl font-black text-adv-slate">{getPriceRange()}</span>
          </div>
          
          <button 
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 min-w-[105px] sm:min-w-[130px] rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 group/btn cursor-pointer shrink-0 text-center ${
              isPast 
                ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-900/20' 
                : 'bg-adv-orange text-white hover:bg-orange-600 shadow-orange-500/20'
            }`}
          >
            <span>{isPast ? t.viewEvent : t.buyTickets}</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-1 shrink-0" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

