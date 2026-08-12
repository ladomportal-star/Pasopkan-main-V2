import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight,
  Share2, 
  Plus, 
  Minus, 
  Zap,
  Info,
  Calendar,
  Activity,
  MapPin,
  Navigation,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Map as MapIcon,
  Star,
  MessageSquare,
  Send,
  Languages,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Sliders,
  Settings,
  Save,
  Check,
  Lock,
  Unlock,
  FileEdit,
  ShieldAlert,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Image as ImageIcon,
  Copy,
  Ticket,
  ExternalLink
} from 'lucide-react';
import { events, LaoEvent, TicketTier } from '../data/events';
import { useLanguage } from '../LanguageContext';
import { EventMapPicker } from '../components/EventMapPicker';
import { CountdownTimer } from '../components/CountdownTimer';
import DotsLoader from '../components/DotsLoader';
import { safeStorage } from '../lib/storage';
import { getReviewsForEvent, getAverageRatingForEvent, saveReview } from '../data/reviews';
import { useAuth } from '../AuthContext';
import { collection, query, where, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

const XIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.901 2.879 2.896 2.896 0 0 1-2.895-2.879 2.896 2.896 0 0 1 2.895-2.879c.307 0 .605.05.882.144V9.458a6.326 6.326 0 0 0-.882-.062c-3.528 0-6.388 2.839-6.388 6.335 0 3.497 2.86 6.336 6.388 6.336 3.527 0 6.387-2.839 6.387-6.336V8.927a8.21 8.21 0 0 0 4.739 1.488V6.97a4.847 4.847 0 0 1-1.008-.284z"/>
  </svg>
);

const translations = {
  en: {
    backToEvents: 'Back to all activities',
    aboutEvent: 'About this Activity',
    languagesSupported: 'Languages',
    importantInfo: 'Important Information',
    selectTickets: 'Select Options',
    quantity: 'Quantity',
    checkout: 'Get Tickets',
    startingFrom: 'From',
    selectVisitDate: 'Select Date',
    visitDateDesc: 'Select the date you wish to visit.',
    pleaseSelectDate: 'Please select a date first.',
    selectTimeSlot: 'Select Session Time',
    pleaseSelectTime: 'Please select a session time.',
    instant: 'Instant Confirmation',
    cancellation: 'Full refund if cancelled up to 24 hours before the experience starts',
    duration: 'Duration',
    promoCode: 'Promo Code',
    apply: 'Apply',
    applied: 'Applied!',
    invalidCode: 'Invalid code',
    linkCopied: 'Link copied to clipboard!',
    share: 'Share',
    startTime: 'Activity Starts At',
    ratingsAndReviews: 'Ratings & Reviews',
    avgRating: 'Average Rating',
    outOf5: 'out of 5 stars',
    basedOnReviews: 'based on {count} ratings',
    noReviewsYet: 'No reviews yet for this activity.',
    beFirstReview: 'Be the first to leave a review after attending!',
    verifiedAttendee: 'Verified Attendee',
    writeComment: 'Write a Review',
    commentPlaceholder: 'Share your experience, what you liked or how it could be improved...',
    yourName: 'Your Name',
    yourNamePlaceholder: 'Enter your name (e.g., Jane Doe)',
    yourRating: 'Your Rating',
    submitComment: 'Submit Review',
    submitting: 'Submitting...',
    commentSuccess: 'Thank you! Your review has been submitted successfully.',
    commentError: 'Please write a comment and select a star rating.',
    loginToComment: 'Log in to write a review',
    onlyAttendeesCanComment: 'Only verified ticket holders can rate and review this event.',
    loginButton: 'Log In',
    buyTicketFirst: 'Please purchase a ticket first to leave a review.',
    organizerTitle: 'Event Organizer',
    verifiedOrganizer: 'Verified Partner',
    contactOrganizer: 'Contact Organizer',
    aboutOrganizer: 'About the Host',
    reportEvent: 'Report Event',
    reportTitle: 'Report Event Issues',
    reportReason: 'Reason for reporting',
    reportDetails: 'Additional Details',
    reportDetailsPlaceholder: 'Please describe the issue in detail...',
    submitReport: 'Submit Report',
    reportSubmitted: 'Report submitted successfully. Thank you for keeping Pasopkan safe!',
  },
  lo: {
    backToEvents: 'ກັບຄືນສູ່ກິດຈະກຳທັງໝົດ',
    aboutEvent: 'ກ່ຽວກັບກິດຈະກຳນີ້',
    languagesSupported: 'ພາສາ',
    importantInfo: 'ຂໍ້ມູນທີ່ຄວນຮູ້',
    selectTickets: 'ເລືອກຕົວເລືອກ',
    quantity: 'ຈຳນວນ',
    checkout: 'ຊື້ປີ້ດຽວນີ້',
    startingFrom: 'ເລີ່ມຕົ້ນ',
    selectVisitDate: 'ເລືອກວັນທີ',
    visitDateDesc: 'ກະລຸນາເລືອກວັນທີທີ່ທ່ານຕ້ອງການ.',
    pleaseSelectDate: 'ກະລຸນາເລືອກວັນທີກ່ອນ.',
    selectTimeSlot: 'ເລືອກຊ່ວງເວລາ',
    pleaseSelectTime: 'ກະລຸນາເລືອກຊ່ວງເວລາກ່ອນ.',
    instant: 'ຢືນຢັນທັນທີ',
    cancellation: 'ຄືນເງິນເຕັມຈຳນວນຫາກຍົກເລີກກ່ອນກິດຈະກຳເລີ່ມຕົ້ນຢ່າງໜ້ອຍ 24 ຊົ່ວໂມງ',
    duration: 'ໄລຍະເວລາ',
    promoCode: 'ລະຫັດສ່ວນຫຼຸດ',
    apply: 'ໃຊ້ງານ',
    applied: 'ໃຊ້ແລ້ວ!',
    invalidCode: 'ລະຫັດບໍ່ຖືກຕ້ອງ',
    linkCopied: 'ຄັດລອກລິ້ງແລ້ວ!',
    share: 'ແຊຣ໌',
    reportEvent: 'ລາຍງານກິດຈະກຳ',
    reportTitle: 'ລາຍງານບັນຫາກ່ຽວກັບກິດຈະກຳ',
    reportReason: 'ເຫດຜົນໃນການລາຍງານ',
    reportDetails: 'ລາຍລະອຽດເພີ່ມເຕີມ',
    reportDetailsPlaceholder: 'ກະລຸນາອະທິບາຍບັນຫາຢ່າງລະອຽດ...',
    submitReport: 'ສົ່ງການລາຍງານ',
    reportSubmitted: 'ສົ່ງການລາຍງານສຳເລັດແລ້ວ! ທີມງານຈະກວດສອບກິດຈະກຳນີ້.',
    startTime: 'ກິດຈະກຳເລີ່ມເວລາ',
    ratingsAndReviews: 'ຄະແນນ ແລະ ການຣີວິວ',
    avgRating: 'ຄະແນນສະເລ່ຍ',
    outOf5: 'ຈາກທັງໝົດ 5 ດາວ',
    basedOnReviews: 'ອີງຕາມ {count} ການຣີວິວ',
    noReviewsYet: 'ຍັງບໍ່ມີການຣີວິວເທື່ອສຳລັບກິດຈະກຳນີ້.',
    beFirstReview: 'ເປັນຄົນທຳອິດທີ່ຈະຣີວິວຫຼັງຈາກເຂົ້າຮ່ວມກິດຈະກຳ!',
    verifiedAttendee: 'ຜູ້ເຂົ້າຮ່ວມທີ່ໄດ້ຮັບການຢືນຢັນ',
    writeComment: 'ຂຽນການຣີວິວ',
    commentPlaceholder: 'ແບ່ງປັນປະສົບການຂອງທ່ານ, ສິ່ງທີ່ທ່ານມັກ ຫຼື ສິ່ງທີ່ຄວນປັບປຸງ...',
    yourName: 'ຊື່ຂອງທ່ານ',
    yourNamePlaceholder: 'ປ້ອນຊື່ຂອງທ່ານ (ຕົວຢ່າງ: ນາງ ຈັນທາ)',
    yourRating: 'ຄະແນນຂອງທ່ານ',
    submitComment: 'ສົ່ງການຣີວິວ',
    submitting: 'ກຳລັງສົ່ງ...',
    commentSuccess: 'ຂອບໃຈ! ສົ່ງການຣີວິວຂອງທ່ານສຳເລັດແລ້ວ.',
    commentError: 'ກະລຸນາຂຽນຄວາມຄິດເຫັນ ແລະ ເລືອກຄະແນນດາວ.',
    loginToComment: 'ເຂົ້າສູ່ລະບົບເພື່ອຂຽນການຣີວິວ',
    onlyAttendeesCanComment: 'ສະເພາະຜູ້ຖືປີ້ທີ່ໄດ້ຮັບການຢືນຢັນເທົ່ານັ້ນຈຶ່ງສາມາດໃຫ້ຄະແນນ ແລະ ຣີວິວກິດຈະກຳນີ້ໄດ້.',
    loginButton: 'ເຂົ້າສູ່ລະບົບ',
    buyTicketFirst: 'ກະລຸນາຊື້ປີ້ກ່ອນເພື່ອຂຽນການຣີວິວ.',
    organizerTitle: 'ຜູ້ຈັດກິດຈະກຳ',
    verifiedOrganizer: 'ພັນທະມິດທີ່ໄດ້ຮັບການຢືນຢັນ',
    contactOrganizer: 'ຕິດຕໍ່ຜູ້ຈັດງານ',
    aboutOrganizer: 'ກ່ຽວກັບຜູ້ຈັດງານ',
  }
};

const calendarMonths = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  lo: [
    'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
    'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'
  ]
};

const calendarDays = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  lo: ['ອາ', 'ຈ', 'ອ', 'ພ', 'ພຫ', 'ສຸ', 'ສ']
};

const formatDateString = (year: number, month: number, day: number) => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

function InlineCalendar({ 
  selectedDate, 
  onDateChange, 
  dateType, 
  eventDate, 
  lang 
}: { 
  selectedDate: string; 
  onDateChange: (date: string) => void; 
  dateType: 'fixed' | 'flexible' | 'booking'; 
  eventDate?: string; 
  lang: 'en' | 'lo'; 
}) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDateStr = formatDateString(todayYear, todayMonth, today.getDate());

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxYear = maxDate.getFullYear();
  const maxMonth = maxDate.getMonth();
  const maxDateStr = formatDateString(maxYear, maxMonth, maxDate.getDate());

  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);

  useEffect(() => {
    const targetDate = dateType === 'fixed' ? eventDate : selectedDate;
    if (targetDate) {
      const parts = targetDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        setCurrentYear(y);
        setCurrentMonth(m);
      }
    }
  }, [selectedDate, eventDate, dateType]);

  const handlePrevMonth = () => {
    if (dateType === 'fixed') return;
    if (currentYear > todayYear || (currentYear === todayYear && currentMonth > todayMonth)) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (dateType === 'fixed') return;
    if (currentYear < maxYear || (currentYear === maxYear && currentMonth < maxMonth)) {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(prev => prev + 1);
      } else {
        setCurrentMonth(prev => prev + 1);
      }
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  return (
    <div className="bg-gray-50/50 border border-gray-150/80 rounded-2xl p-4 space-y-3.5 shadow-inner">
      {/* Month Year Header */}
      <div className="flex items-center justify-between px-1">
        <span className="font-bold text-sm text-adv-slate">
          {calendarMonths[lang][currentMonth]} {currentYear}
        </span>
        {(dateType === 'flexible' || dateType === 'booking') && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              disabled={currentYear === todayYear && currentMonth === todayMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              disabled={currentYear > maxYear || (currentYear === maxYear && currentMonth >= maxMonth)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays[lang].map((day, idx) => (
          <span key={idx} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysArray.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const dateStr = formatDateString(currentYear, currentMonth, day);
          
          let isSelectable = false;
          let isSelected = false;
          let isToday = dateStr === todayDateStr;

          if (dateType === 'flexible' || dateType === 'booking') {
            isSelectable = dateStr >= todayDateStr && dateStr <= maxDateStr;
            isSelected = dateStr === selectedDate;
          } else {
            // Fixed event date
            isSelectable = dateStr === eventDate;
            isSelected = dateStr === eventDate;
          }

          return (
            <button
              key={`day-${day}`}
              onClick={() => isSelectable && onDateChange(dateStr)}
              disabled={!isSelectable}
              className={`aspect-square flex flex-col items-center justify-center text-xs font-bold rounded-xl transition-all relative ${
                isSelected
                  ? 'bg-adv-orange text-white shadow-md shadow-orange-100 scale-105 z-10'
                  : isSelectable
                    ? isToday
                      ? 'border border-adv-orange/40 text-adv-orange hover:bg-orange-50'
                      : 'text-adv-slate hover:bg-gray-200/70 hover:text-adv-orange'
                    : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <span>{day}</span>
              {isToday && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-adv-orange" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend / Helper Info */}
      <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 border-t border-gray-150/50 pt-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-adv-orange" />
          <span>{dateType === 'fixed' ? (lang === 'en' ? 'Event Day' : 'ວັນທີກິດຈະກຳ') : (lang === 'en' ? 'Selected' : 'ເລືອກແລ້ວ')}</span>
        </div>
        {(dateType === 'flexible' || dateType === 'booking') && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-adv-orange/40 bg-orange-50/10" />
            <span>{lang === 'en' ? 'Today' : 'ມື້ນີ້'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const getGalleryImages = (evt: LaoEvent) => {
  const list = [evt.image, ...(evt.exampleImages || [])].filter(Boolean);
  if (list.length > 1) return list;
  
  // If only 1 image, generate some category-based beautiful fallback images for a rich gallery experience
  const categoryDefaults: Record<string, string[]> = {
    Festival: [
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540039155732-d6824b5ce1fd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1000&auto=format&fit=crop'
    ],
    Workshop: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop'
    ],
    Sports: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?q=80&w=1000&auto=format&fit=crop'
    ],
    Voucher: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop'
    ]
  };
  
  const fallbacks = categoryDefaults[evt.category] || categoryDefaults['Festival'];
  return [evt.image, ...fallbacks];
};

const formatHtmlLinks = (html: string): string => {
  if (!html) return html;
  
  // 1. Process existing <a> tags: ensure proper href prefix, target="_blank", rel, and styles
  let formatted = html.replace(/<a\b([^>]*)>(.*?)<\/a>/gi, (match, attrs, content) => {
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
    let href = hrefMatch ? hrefMatch[1] : '';
    if (href && !/^https?:\/\//i.test(href) && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      href = `https://${href}`;
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-adv-orange underline hover:text-orange-600 font-semibold transition-colors cursor-pointer">${content}</a>`;
  });

  // 2. Automatically linkify standalone URLs (like https://... or www....) that aren't inside an HTML tag attribute or existing <a>
  const rawUrlRegex = /(^|[\s>(])((?:https?:\/\/|www\.)[^\s<"']+)/gi;
  formatted = formatted.replace(rawUrlRegex, (match, prefix, url) => {
    if (prefix.includes('href=') || prefix.includes('src=')) return match;
    let fullUrl = url;
    if (url.toLowerCase().startsWith('www.')) {
      fullUrl = `https://${url}`;
    }
    return `${prefix}<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-adv-orange underline hover:text-orange-600 font-semibold transition-colors cursor-pointer">${url}</a>`;
  });

  return formatted;
};

const handleDescriptionClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const target = e.target as HTMLElement;
  const anchor = target.closest('a');
  if (anchor) {
    let href = anchor.getAttribute('href');
    if (href) {
      if (!/^https?:\/\//i.test(href) && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        href = `https://${href}`;
      }
      e.preventDefault();
      e.stopPropagation();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }
};

const renderFormattedDescription = (desc: string) => {
  if (!desc) return null;

  // If there are standard <p> tags, split and render them with separators
  if (desc.includes('<p>')) {
    const paragraphs = desc
      .split(/<\/p>/gi)
      .map(p => p.replace(/<p>/gi, '').trim())
      .filter(p => p.length > 0);

    return (
      <div className="space-y-5" onClick={handleDescriptionClick}>
        {paragraphs.map((para, index) => (
          <div key={index} className="space-y-5">
            {index > 0 && (
              <div className="border-t border-gray-150/70 my-5" />
            )}
            <div 
              className="text-gray-800 leading-relaxed text-sm sm:text-[15px] rich-text-content"
              dangerouslySetInnerHTML={{ __html: formatHtmlLinks(para) }}
            />
          </div>
        ))}
      </div>
    );
  }

  // Otherwise, split by double line breaks or double newlines
  const paragraphs = desc
    .split(/(?:<br\s*\/?>\s*){2,}|(?:\n\s*){2,}/gi)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return (
    <div className="space-y-5" onClick={handleDescriptionClick}>
      {paragraphs.map((para, index) => {
        const formattedPara = para.replace(/<br\s*\/?>/gi, '<br />');
        return (
          <div key={index} className="space-y-5">
            {index > 0 && (
              <div className="border-t border-gray-150/70 my-5" />
            )}
            <div 
              className="text-gray-800 leading-relaxed text-sm sm:text-[15px] rich-text-content"
              dangerouslySetInnerHTML={{ __html: formatHtmlLinks(formattedPara) }}
            />
          </div>
        );
      })}
    </div>
  );
};

const openInGoogleMaps = (lat?: number, lng?: number, address?: string) => {
  const dest = (lat && lng)
    ? `${lat},${lng}`
    : encodeURIComponent(address || 'Vientiane, Laos');
  window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, '_blank', 'noopener,noreferrer');
};

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (event?.category) {
      navigate(`/category/${encodeURIComponent(event.category)}`);
    } else {
      navigate('/');
    }
  };
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const t = translations[lang];
  const currency = lang === 'lo' ? 'ກີບ' : 'Kip';
  
  const [event, setEvent] = useState<LaoEvent | null>(null);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [tierQuantities, setTierQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedVisitDate, setSelectedVisitDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Mobile Touch Swipe States for Gallery Image Preview
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleMobileTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleMobileTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleMobileTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 35;
    if (distance > minSwipeDistance && galleryImages.length > 1) {
      // Swiped left -> Next Image
      setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    } else if (distance < -minSwipeDistance && galleryImages.length > 1) {
      // Swiped right -> Previous Image
      setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copiedMapAddress, setCopiedMapAddress] = useState(false);
  const [showOrganizerDetails, setShowOrganizerDetails] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isPast = useMemo(() => {
    if (!event) return false;
    const checkDate = event.endDate || event.date;
    return checkDate ? checkDate < todayStr : false;
  }, [event, todayStr]);

  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    if (user) {
      setContactName(user.displayName || '');
      setContactEmail(user.email || '');
    }
  }, [user]);

  const handleSendContactMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError(lang === 'en' ? 'Please fill in all required fields.' : 'ກະລຸນາປ້ອນຂໍ້ມູນໃນຊ່ອງທີ່ຕ້ອງການໃຫ້ຄົບຖ້ວນ.');
      return;
    }

    setIsSubmittingContact(true);
    setContactError('');

    try {
      // Create message data
      const messageData = {
        eventId: event.id,
        eventTitle: event.title,
        organizer: event.organizer || 'Pasopkan Partner',
        senderName: contactName.trim(),
        senderEmail: contactEmail.trim(),
        subject: contactSubject,
        message: contactMessage.trim(),
        timestamp: new Date().toISOString(),
        userId: user?.uid || 'anonymous'
      };

      // Try sending to firebase first
      if (auth.currentUser) {
        try {
          const inquiryRef = doc(collection(db, 'organizer_inquiries'));
          await setDoc(inquiryRef, messageData);
        } catch (fbErr) {
          console.warn('Could not save to Firestore collection, fallback to local storage:', fbErr);
          // Standard local storage backup
          const savedInquiries = JSON.parse(safeStorage.getItem('pasopkan_local_inquiries') || '[]');
          savedInquiries.push({ id: `inq_${Date.now()}`, ...messageData });
          safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));
        }
      } else {
        // Local storage backup
        const savedInquiries = JSON.parse(safeStorage.getItem('pasopkan_local_inquiries') || '[]');
        savedInquiries.push({ id: `inq_${Date.now()}`, ...messageData });
        safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));
      }

      // Simulate a bit of network latency for polished feel
      await new Promise(resolve => setTimeout(resolve, 1200));

      setContactSuccess(true);
      setContactMessage('');
    } catch (err: any) {
      setContactError(lang === 'en' ? 'Failed to send message. Please try again.' : 'ບໍ່ສາມາດສົ່ງຂໍ້ຄວາມໄດ້. ກະລຸນາລອງໃໝ່.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [hasPurchasedTicket, setHasPurchasedTicket] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<number | 'all'>('all');

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return reviews;
    return reviews.filter(r => Math.floor(r.rating) === reviewFilter);
  }, [reviews, reviewFilter]);

  const [mobileActiveTab, setMobileActiveTab] = useState<'details' | 'reviews'>(() => {
    return searchParams.get('tab') === 'reviews' ? 'reviews' : 'details';
  });

  useEffect(() => {
    if (searchParams.get('tab') === 'reviews') {
      setMobileActiveTab('reviews');
      const timer = setTimeout(() => {
        const element = document.getElementById('reviews-section-desktop') || document.getElementById('reviews-section-mobile');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!id) {
      setHasPurchasedTicket(false);
      return;
    }

    const checkPurchase = async () => {
      const ids = new Set<string>();
      
      // Default/mock upcoming and past events that the user is considered to have bought tickets for
      ids.add('mock_elig');
      ids.add('mock_dis');
      ids.add('music_fest_25');
      ids.add('cooking_class_past');
      
      // Add default past events
      events.slice(0, 3).forEach(e => ids.add(e.id));
      
      // Add any from pasopkan_past_events in localStorage
      try {
        const past = localStorage.getItem('pasopkan_past_events');
        if (past) {
          const parsed = JSON.parse(past);
          if (Array.isArray(parsed)) {
            parsed.forEach((e: any) => {
              if (e && e.id) ids.add(e.id);
            });
          }
        }
      } catch (e) {}

      // Add any explicitly purchased
      try {
        const purchased = localStorage.getItem('pasopkan_purchased_event_ids');
        if (purchased) {
          const parsed = JSON.parse(purchased);
          if (Array.isArray(parsed)) {
            parsed.forEach((purchId: string) => ids.add(purchId));
          }
        }
      } catch (e) {}

      if (ids.has(id)) {
        setHasPurchasedTicket(true);
        return;
      }

      // Check Firestore tickets collection
      const activeUser = user || auth.currentUser;
      if (activeUser) {
        if (auth.currentUser && activeUser.uid === auth.currentUser.uid) {
          try {
            const ticketsRef = collection(db, 'tickets');
            const q = query(
              ticketsRef,
              where('userId', '==', activeUser.uid),
              where('eventId', '==', id)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              setHasPurchasedTicket(true);
              return;
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, 'tickets');
          }
        } else {
          // Fallback to localStorage for mock/offline session
          const purchasedIdsStr = localStorage.getItem('pasopkan_purchased_event_ids');
          if (purchasedIdsStr) {
            try {
              const purchasedIds = JSON.parse(purchasedIdsStr);
              if (purchasedIds.includes(id)) {
                setHasPurchasedTicket(true);
                return;
              }
            } catch (e) {}
          }
        }
      }

      setHasPurchasedTicket(false);
    };

    checkPurchase();
  }, [id, isAuthenticated, user]);

  // Reviews Submission Form States
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const getAccountUserName = () => {
    try {
      const saved = localStorage.getItem('pasopkan_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.firstName || parsed.lastName) {
          return `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
        }
      }
    } catch (e) {}
    if (user?.displayName) return user.displayName;
    return 'Sirithida Souksavat';
  };

  const [commentStatus, setCommentStatus] = useState<{
    type: 'idle' | 'submitting' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    if (!userComment.trim()) {
      setCommentStatus({
        type: 'error',
        message: translations[lang].commentError
      });
      return;
    }

    const activeUser = user || auth.currentUser;
    if (!activeUser) {
      setCommentStatus({
        type: 'error',
        message: lang === 'en' ? 'You must be logged in to comment.' : 'ທ່ານຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນເພື່ອອອກຄວາມຄິດເຫັນ.'
      });
      return;
    }

    setCommentStatus({ type: 'submitting', message: '' });

    const anonymousName = lang === 'en' ? 'Anonymous User' : 'ຜູ້ໃຊ້ບໍ່ປະສົງອອກຊື່';
    const reviewData = {
      eventId: id,
      userId: activeUser.uid,
      rating: userRating,
      comment: userComment.trim(),
      userName: isAnonymous ? anonymousName : (getAccountUserName() || anonymousName),
      userRealName: getAccountUserName(),
      date: new Date().toISOString().slice(0, 10)
    };

    if (auth.currentUser && activeUser.uid === auth.currentUser.uid) {
      try {
        const reviewRef = doc(collection(db, 'reviews'));
        await setDoc(reviewRef, reviewData);

        // Local fallback / sync
        saveReview({
          id: reviewRef.id,
          ...reviewData
        });

        // Reset form except name
        setUserComment('');
        setUserRating(5);
        setCommentStatus({
          type: 'success',
          message: translations[lang].commentSuccess
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setCommentStatus(prev => prev.type === 'success' ? { type: 'idle', message: '' } : prev);
        }, 5000);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'reviews');
      }
    } else {
      // Mock / Local fallback mode
      const mockId = `mock_rev_${Math.random().toString(36).substring(2, 11)}`;
      saveReview({
        id: mockId,
        ...reviewData
      });
      setUserComment('');
      setUserRating(5);
      setCommentStatus({
        type: 'success',
        message: translations[lang].commentSuccess
      });
      setTimeout(() => {
        setCommentStatus(prev => prev.type === 'success' ? { type: 'idle', message: '' } : prev);
      }, 5000);
    }
  };

  useEffect(() => {
    if (!id) return;

    // Listen to real-time reviews from Firestore for this event
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('eventId', '==', id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreReviews: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        firestoreReviews.push({
          id: docSnap.id,
          ...data
        });
      });

      // Sort Firestore reviews by date/createdAt descending
      firestoreReviews.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Combine with local / mock reviews
      const localReviews = getReviewsForEvent(id).filter(mock => 
        !firestoreReviews.some(fire => fire.eventId === mock.eventId && (fire.comment === mock.comment || fire.id === mock.id))
      );

      const combined = [...firestoreReviews, ...localReviews];
      
      // Calculate average rating
      const sum = combined.reduce((acc, curr) => acc + curr.rating, 0);
      const average = combined.length > 0 ? Math.round((sum / combined.length) * 10) / 10 : 0;

      setReviews(combined);
      setAvgRating(average);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'reviews');
    });

    return () => unsubscribe();
  }, [id]);

  const galleryImages = event ? getGalleryImages(event) : [];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenImageIndex !== null) {
        if (e.key === 'ArrowLeft') {
          setFullscreenImageIndex(prev => (prev === 0 || prev === null ? galleryImages.length - 1 : prev - 1));
        } else if (e.key === 'ArrowRight') {
          setFullscreenImageIndex(prev => (prev === galleryImages.length - 1 || prev === null ? 0 : prev + 1));
        } else if (e.key === 'Escape') {
          setFullscreenImageIndex(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImageIndex, galleryImages.length]);

  const ticketSidebarRef = useRef<HTMLDivElement>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSidebarVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentRef = ticketSidebarRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [event]);

  const handleApplyPromo = () => {
    setPromoError('');
    if (!promoCode.trim()) return;

    const found = event.coupons?.some(c => c.code.trim().toUpperCase() === promoCode.trim().toUpperCase() && c.isActive);
    if (found) {
      setAppliedPromo(promoCode.trim().toUpperCase());
      setPromoCode('');
    } else {
      setPromoError(t.invalidCode);
      setAppliedPromo(null);
    }
  };

  useEffect(() => {
    let allEvents = events;
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        allEvents = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    const foundEvent = allEvents.find(e => e.id === id);
    if (foundEvent) {
      setEvent(foundEvent);
      const availableTier = foundEvent.ticketTiers?.find(tier => tier.available > 0);
      if (availableTier) setSelectedTier(availableTier);

      if (foundEvent.ticketTiers && foundEvent.ticketTiers.length > 0) {
        const initialQuantities: Record<string, number> = {};
        const firstAvailable = foundEvent.ticketTiers.find(tier => (tier.available ?? Infinity) > 0) || foundEvent.ticketTiers[0];
        foundEvent.ticketTiers.forEach(t => {
          initialQuantities[t.id] = t.id === firstAvailable.id ? 1 : 0;
        });
        setTierQuantities(initialQuantities);
      }

      // Auto-initialize the date selection
      if (foundEvent.dateType === 'flexible') {
        const today = new Date();
        const initialDateStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
        setSelectedVisitDate(initialDateStr);
      } else {
        setSelectedVisitDate(foundEvent.date);
      }

      // Auto-initialize time slot selection
      if (foundEvent.hasTimeSelection && foundEvent.timeSlots && foundEvent.timeSlots.length > 0) {
        setSelectedTimeSlot(foundEvent.timeSlots[0]);
      } else {
        setSelectedTimeSlot(foundEvent.time || '');
      }
    }
  }, [id]);

  const parsedMaxTickets = event?.maxTickets ? parseInt(String(event.maxTickets), 10) : 4;
  const effectiveMaxTickets = isNaN(parsedMaxTickets) || parsedMaxTickets <= 0 ? 4 : parsedMaxTickets;
  const tierAvailable = selectedTier?.available !== undefined ? selectedTier.available : Infinity;
  const maxAllowedTickets = Math.min(effectiveMaxTickets, tierAvailable);

  const selectedTiersList = useMemo(() => {
    if (!event) return [];
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      return event.ticketTiers
        .map(t => ({ tier: t, quantity: tierQuantities[t.id] || 0 }))
        .filter(item => item.quantity > 0);
    }
    const defaultTier: TicketTier = selectedTier || {
      id: 'ga',
      name: 'General Admission',
      price: event.price || 0,
      available: event.availableTickets || 100
    };
    return [{ tier: defaultTier, quantity }];
  }, [event, tierQuantities, selectedTier, quantity]);

  const totalQuantity = useMemo(() => {
    if (event?.ticketTiers && event.ticketTiers.length > 0) {
      return (Object.values(tierQuantities) as number[]).reduce((acc, q) => acc + (q || 0), 0);
    }
    return quantity;
  }, [event, tierQuantities, quantity]);

  const subtotalPrice = useMemo(() => {
    if (!event) return 0;
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      return event.ticketTiers.reduce((acc: number, t) => {
        const q = tierQuantities[t.id] || 0;
        return acc + (t.price || 0) * q;
      }, 0);
    }
    return (selectedTier?.price || event.price || 0) * quantity;
  }, [event, tierQuantities, selectedTier, quantity]);

  const discountValue = useMemo(() => {
    if (!appliedPromo || !event?.coupons) return 0;
    const coupon = event.coupons.find(c => c.code.trim().toUpperCase() === appliedPromo);
    if (!coupon) return 0;
    if (coupon.type === 'percentage') {
      return (subtotalPrice * Number(coupon.discount)) / 100;
    }
    return Number(coupon.discount);
  }, [appliedPromo, event, subtotalPrice]);

  const totalPrice = Math.max(0, subtotalPrice - discountValue);

  const handleUpdateTierQuantity = (tierId: string, delta: number, available: number = Infinity) => {
    setTierQuantities(prev => {
      const currentQ = prev[tierId] || 0;
      const newQ = currentQ + delta;
      if (newQ < 0) return prev;

      if (delta > 0) {
        const currentTotal = (Object.values(prev) as number[]).reduce((a, b) => a + (b || 0), 0);
        if (currentTotal + delta > effectiveMaxTickets) {
          alert(
            lang === 'en'
              ? `You can only purchase up to ${effectiveMaxTickets} total ticket(s) per transaction.`
              : `ທ່ານສາມາດຊື້ປີ້ໄດ້ສູງສຸດ ${effectiveMaxTickets} ໃບ ໃນທັງໝົດ ຕໍ່ຄັ້ງ.`
          );
          return prev;
        }
        if (newQ > available) {
          alert(
            lang === 'en'
              ? `Only ${available} ticket(s) remaining for this tier.`
              : `ມີປີ້ເຫຼືອພຽງ ${available} ໃບ ສຳລັບລະດັບນີ້.`
          );
          return prev;
        }
      }
      return { ...prev, [tierId]: newQ };
    });
  };

  useEffect(() => {
    if (event && quantity > maxAllowedTickets) {
      setQuantity(Math.max(1, maxAllowedTickets));
    }
  }, [selectedTier, event, maxAllowedTickets, quantity]);

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <DotsLoader />
      </div>
    );
  }

  const handleCheckout = () => {
    if (event.dateType === 'flexible' && !selectedVisitDate) {
      alert(t.pleaseSelectDate);
      return;
    }
    if (event.hasTimeSelection && !selectedTimeSlot) {
      alert(t.pleaseSelectTime);
      return;
    }
    if (totalQuantity <= 0) {
      alert(lang === 'en' ? 'Please select at least 1 ticket to purchase.' : 'ກະລຸນາເລືອກປີ້ຢ່າງໜ້ອຍ 1 ໃບກ່ອນ.');
      return;
    }

    if (totalQuantity > effectiveMaxTickets) {
      alert(
        lang === 'en'
          ? `You can only purchase up to ${effectiveMaxTickets} ticket(s) in total per transaction.`
          : `ທ່ານສາມາດຊື້ປີ້ໄດ້ສູງສຸດ ${effectiveMaxTickets} ໃບ ໃນທັງໝົດ ຕໍ່ຄັ້ງ.`
      );
      return;
    }

    const primaryTier = selectedTiersList[0]?.tier || selectedTier || (event.ticketTiers ? event.ticketTiers[0] : null);

    navigate('/checkout', { 
      state: { 
        event, 
        tier: primaryTier, 
        quantity: totalQuantity,
        selectedTiers: selectedTiersList,
        selectedDate: selectedVisitDate,
        selectedTime: selectedTimeSlot || event.time,
        initialDiscountCode: appliedPromo
      } 
    });
  };

  const handleShare = async () => {
    if (!event) return;
    
    const shareUrl = window.location.href;
    let copied = false;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch (err) {
      console.warn('Failed to use navigator.clipboard, trying fallback:', err);
    }
    
    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          copied = true;
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }

    if (copied) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } else {
      // In case copy failed completely, alert or still show toast advising manually copying
      console.warn('Could not copy link automatically.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-6 lg:pb-8">
      <AnimatePresence>
        {fullscreenImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImageIndex(null)}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
          >
            {/* Close button */}
            <motion.button 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-20"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImageIndex(null);
              }}
            >
              <X className="w-6 h-6" />
            </motion.button>
            
            {/* Prev button */}
            {galleryImages.length > 1 && (
              <button 
                className="absolute left-4 sm:left-8 w-12 h-12 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full flex items-center justify-center text-white transition-all z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenImageIndex(prev => (prev === 0 || prev === null ? galleryImages.length - 1 : prev - 1));
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {/* Next button */}
            {galleryImages.length > 1 && (
              <button 
                className="absolute right-4 sm:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full flex items-center justify-center text-white transition-all z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenImageIndex(prev => (prev === galleryImages.length - 1 || prev === null ? 0 : prev + 1));
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Main image container */}
            <div 
              className="relative max-w-full max-h-full flex flex-col items-center gap-4 touch-pan-y select-none" 
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleMobileTouchStart}
              onTouchMove={handleMobileTouchMove}
              onTouchEnd={() => {
                if (touchStartX === null || touchEndX === null) return;
                const distance = touchStartX - touchEndX;
                const minSwipeDistance = 35;
                if (distance > minSwipeDistance && galleryImages.length > 1) {
                  setFullscreenImageIndex(prev => (prev === galleryImages.length - 1 || prev === null ? 0 : prev + 1));
                } else if (distance < -minSwipeDistance && galleryImages.length > 1) {
                  setFullscreenImageIndex(prev => (prev === 0 || prev === null ? galleryImages.length - 1 : prev - 1));
                }
                setTouchStartX(null);
                setTouchEndX(null);
              }}
            >
              <motion.img 
                key={fullscreenImageIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
                src={galleryImages[fullscreenImageIndex]} 
                alt="Full view"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/5"
              />
              {/* Pagination badge */}
              <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white/95 border border-white/10">
                {fullscreenImageIndex + 1} / {galleryImages.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {shareSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className="fixed bottom-12 left-1/2 z-[150] bg-adv-slate text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <Share2 className="w-4 h-4 text-adv-orange" />
            {t.linkCopied}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-4 sm:pb-6">
        {/* Header/Breadcrumb row */}
        <div className="hidden lg:flex items-center justify-between mb-2 sm:mb-3">
          <button 
            onClick={handleBack} 
            className="inline-flex items-center gap-1.5 text-adv-orange font-bold text-xs hover:underline uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.backToEvents}
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/80 rounded-xl text-adv-slate text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-adv-orange" />
              <span>{t.share}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 relative group/hero">
               {/* Mobile Cover Image & Centered Title */}
               {event.image && (
                 <div className="block lg:hidden w-full relative">
                   <div 
                     className="relative w-full aspect-square sm:aspect-[4/3] overflow-hidden rounded-t-3xl touch-pan-y select-none cursor-grab active:cursor-grabbing"
                     onTouchStart={handleMobileTouchStart}
                     onTouchMove={handleMobileTouchMove}
                     onTouchEnd={handleMobileTouchEnd}
                   >
                     <motion.img 
                       key={activeImageIndex}
                       initial={{ opacity: 0.8, scale: 0.98 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ duration: 0.25 }}
                       src={galleryImages[activeImageIndex]} 
                       alt={event.title} 
                       className="w-full h-full object-cover pointer-events-none"
                     />
                     {/* Subtle dark gradient overlay at top and bottom */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

                     {/* Round White Back Button */}
                     <button 
                       onClick={handleBack} 
                       className="absolute top-4 left-4 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-adv-slate hover:bg-gray-50 active:scale-95 transition-all z-20 cursor-pointer"
                     >
                       <ArrowLeft className="w-5 h-5 text-gray-800" />
                     </button>

                     {/* Round White Action Buttons: Share */}
                     <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
                       <button 
                         onClick={handleShare} 
                         className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-adv-slate hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                         title={t.share}
                       >
                         <Share2 className="w-5 h-5 text-gray-800" />
                       </button>
                     </div>

                     {/* Mobile Left / Right Chevron Controls */}
                     {galleryImages.length > 1 && (
                       <>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                           }}
                           className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/50 backdrop-blur-xs flex items-center justify-center text-white z-20 active:scale-90 transition-all cursor-pointer shadow-md"
                           aria-label="Previous image"
                         >
                           <ChevronLeft className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                           }}
                           className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/50 backdrop-blur-xs flex items-center justify-center text-white z-20 active:scale-90 transition-all cursor-pointer shadow-md"
                           aria-label="Next image"
                         >
                           <ChevronRight className="w-5 h-5" />
                         </button>
                       </>
                     )}

                     {/* Bottom Center Dots Carousel Indicators */}
                     {galleryImages.length > 1 && (
                       <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-xs">
                         {galleryImages.map((_, idx) => (
                           <button
                             key={idx}
                             onClick={() => setActiveImageIndex(idx)}
                             className={`h-2 rounded-full transition-all duration-300 ${idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/50 w-2'}`}
                           />
                         ))}
                       </div>
                     )}

                     {/* Bottom Right Photo Badge Pill */}
                     {galleryImages.length > 1 && (
                       <button 
                         onClick={() => setFullscreenImageIndex(activeImageIndex)}
                         className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-[11px] font-black text-adv-slate border border-gray-100 shadow-md flex items-center gap-1.5 hover:bg-white active:scale-95 transition-all z-20 cursor-pointer"
                       >
                         <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
                         <span>{galleryImages.length}</span>
                       </button>
                     )}
                   </div>

                   {/* Mobile Horizontal Thumbnail Strip for quick tap/slide */}
                   {galleryImages.length > 1 && (
                     <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50/70 border-b border-gray-100 scrollbar-none">
                       {galleryImages.map((img, idx) => {
                         const isActive = idx === activeImageIndex;
                         return (
                           <button
                             key={idx}
                             onClick={() => setActiveImageIndex(idx)}
                             className={`relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 border-2 cursor-pointer ${
                               isActive 
                                 ? 'border-adv-orange ring-1 ring-orange-200 scale-95 shadow-xs' 
                                 : 'border-transparent opacity-60 hover:opacity-100'
                             }`}
                           >
                             <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                           </button>
                         );
                       })}
                     </div>
                   )}

                   {/* Title & Metadata Centered Section */}
                   <div className="text-center space-y-4 px-4 py-6 border-b border-gray-100 bg-gray-50/20">
                     <div className="space-y-1.5">
                       <span className="inline-block bg-adv-orange/10 text-adv-orange px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-adv-orange/20">
                         {event.category || 'Event'}
                       </span>
                       <h1 className="text-xl sm:text-2xl font-black tracking-tight text-adv-slate leading-tight font-sans px-2">
                         {event.title}
                       </h1>
                     </div>

                     <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-gray-500">
                       {event.dateType !== 'flexible' && (
                         <span className="inline-flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-150/60 shadow-3xs">
                           <Calendar className="w-3.5 h-3.5 text-adv-orange" />
                           {new Date(event.date).toLocaleDateString()}
                         </span>
                       )}
                       {event.dateType !== 'flexible' && event.time && (
                         <span className="inline-flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-150/60 shadow-3xs">
                           <Clock className="w-3.5 h-3.5 text-adv-orange" />
                           {event.time}
                         </span>
                       )}
                       <span className="inline-flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-150/60 shadow-3xs text-adv-slate">
                         <MapPin className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                         <span>{event.location}</span>
                       </span>
                     </div>
                   </div>
                 </div>
               )}

               {/* Desktop Hero Image */}
               <div className="hidden lg:block">
                 {event.image ? (
                 <div className="relative">
                   {/* Ambient glow backdrop underneath */}
                   <div 
                     className="absolute inset-0 -m-8 bg-cover bg-center blur-3xl opacity-15 select-none pointer-events-none rounded-[40px] transition-opacity duration-500 group-hover/hero:opacity-25" 
                     style={{ backgroundImage: `url(${galleryImages[activeImageIndex]})` }} 
                   />
                   
                   <div 
                     className="relative h-64 sm:h-[320px] md:h-[380px] lg:h-[420px] w-full cursor-zoom-in overflow-hidden rounded-3xl"
                     onClick={() => setFullscreenImageIndex(activeImageIndex)}
                   >
                     <motion.img 
                       key={activeImageIndex}
                       initial={{ opacity: 0.8 }}
                       animate={{ opacity: 1 }}
                       transition={{ duration: 0.3 }}
                       src={galleryImages[activeImageIndex]} 
                       alt={event.title} 
                       className="w-full h-full object-cover transition-all duration-1000 ease-out group-hover/hero:scale-[1.04]"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
                     <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
                     
                     {/* Left/Right Arrows on Hover */}
                     {galleryImages.length > 1 && (
                       <>
                         <button 
                           className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 z-20 md:opacity-0 md:group-hover/hero:opacity-100"
                           onClick={(e) => {
                             e.stopPropagation();
                             setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                           }}
                         >
                           <ChevronLeft className="w-5 h-5" />
                         </button>
                         <button 
                           className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 z-20 md:opacity-0 md:group-hover/hero:opacity-100"
                           onClick={(e) => {
                             e.stopPropagation();
                             setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                           }}
                         >
                           <ChevronRight className="w-5 h-5" />
                         </button>
                       </>
                     )}

                     {/* Overlay Title on Image to save space! */}
                     <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white flex flex-col justify-end h-full z-10 pointer-events-none">
                       <div className="mb-2.5">
                         <span className="inline-flex items-center gap-1 bg-adv-orange/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/10 border border-white/10">
                           {event.category || 'Event'}
                         </span>
                       </div>
                       
                       <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-sans text-white">
                         {event.title}
                       </h1>

                       {/* Ratings feature removed */}
                       
                       <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold font-sans">
                          {event.dateType !== 'flexible' && (
                            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg text-white transition-all hover:bg-white/20">
                              <Calendar className="w-3.5 h-3.5 text-white" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                          )}
                          {event.dateType !== 'flexible' && event.time && (
                            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg text-white transition-all hover:bg-white/20">
                              <Clock className="w-3.5 h-3.5 text-white animate-pulse" />
                              {event.time}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg text-white">
                            <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>{event.location}</span>
                          </span>
                       </div>
                     </div>

                     <div className="absolute top-4 right-4 bg-black/20 hover:bg-white/20 backdrop-blur-md border border-white/15 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 group/btn z-10" title="Full Screen">
                       <Maximize2 className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110" />
                     </div>

                     {/* Photo Index Indicator */}
                     {galleryImages.length > 1 && (
                       <div className="absolute top-4 left-4 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/10 z-10">
                         {activeImageIndex + 1} / {galleryImages.length}
                       </div>
                     )}
                   </div>

                   {/* Thumbnail strip */}
                   {galleryImages.length > 1 && (
                     <div className="flex gap-2.5 overflow-x-auto px-6 py-4 border-b border-gray-100/80 bg-gray-50/45 scrollbar-none">
                       {galleryImages.map((img, idx) => {
                         const isActive = idx === activeImageIndex;
                         return (
                           <button
                             key={idx}
                             onClick={(e) => {
                               e.stopPropagation();
                               setActiveImageIndex(idx);
                             }}
                             className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2 ${
                               isActive 
                                 ? 'border-adv-orange ring-2 ring-orange-100 scale-[0.96] shadow-md shadow-orange-500/10' 
                                 : 'border-transparent hover:border-gray-200 hover:scale-[1.02] opacity-70 hover:opacity-100'
                             }`}
                           >
                             <img 
                               src={img} 
                               alt={`Event thumbnail ${idx + 1}`} 
                               className="w-full h-full object-cover"
                             />

                           </button>
                         );
                       })}
                     </div>
                   )}
                 </div>
               ) : (
                 /* Title with NO background image - should be black / text-adv-slate */
                 <div className={`p-6 border-b border-gray-150/60 bg-gray-50/50 ${event.allowReviews !== false && mobileActiveTab === 'reviews' ? 'hidden lg:block' : 'block'}`}>
                    <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight mb-4 text-adv-slate">
                      {event.title}
                    </h1>


                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                       {event.dateType !== 'flexible' && (
                         <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-150 shadow-sm text-gray-600">
                           <Calendar className="w-3.5 h-3.5 text-adv-orange" />
                           {new Date(event.date).toLocaleDateString()}
                         </span>
                       )}
                       {event.dateType !== 'flexible' && event.time && (
                         <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-150 shadow-sm text-gray-600">
                           <Clock className="w-3.5 h-3.5 text-adv-orange animate-pulse" />
                           {event.time}
                         </span>
                       )}
                       <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-150 shadow-sm text-gray-700">
                         <MapPin className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                         <span>{event.location}</span>
                       </span>
                       <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-150 shadow-sm text-gray-600">
                         <Languages className="w-3.5 h-3.5 text-adv-orange" />
                         {(event.languages || ['Lao', 'English']).join(', ')}
                       </span>
                    </div>
                 </div>
               )}
               </div>
                 
               {/* Event Details Sections */}
               <div className="block">

              <div className="px-6 pt-3 sm:pt-4 pb-2">
                 <div className="prose prose-orange max-w-none">
                   <h2 className="text-sm font-bold text-adv-slate uppercase tracking-wider mb-2">{t.aboutEvent}</h2>
                   <div className="text-gray-800 leading-relaxed text-sm rich-text-content">
                     {renderFormattedDescription(event.description)}
                   </div>
                </div>
             </div>

             {/* Public Map Venue Section */}
             {event.eventType !== 'online' && (
               <div className="my-4 bg-white p-4 text-sm space-y-2 border-t border-gray-150/60 dark:border-zinc-800/60" id="event-map-venue">
                 <h3 className="font-bold text-black dark:text-black">
                   {lang === 'lo' ? 'ສະຖານທີ່' : 'Location'}
                 </h3>
                 <div className="text-black dark:text-black font-medium">
                   {event.location}
                 </div>
                 <EventMapPicker 
                   isReadOnly={true}
                   address={event.location}
                   googleMapUrl={event.googleMapUrl}
                   province={event.province}
                   district={event.district}
                   latitude={event.latitude}
                   longitude={event.longitude}
                   lang={lang as 'en' | 'lo'}
                 />
               </div>
             )}
               </div>
            </div>

            {/* Event Organizer Details Section (Desktop Only - Hidden on Mobile) */}
            <div className="hidden lg:block bg-white rounded-2xl p-5 shadow-sm border border-gray-150/60">
              <div 
                onClick={() => setShowOrganizerDetails(!showOrganizerDetails)}
                className="flex items-center justify-between gap-4 cursor-pointer select-none group/organizer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {event.organizerLogo && (event.organizerLogo.startsWith('data:') || event.organizerLogo.startsWith('http') || event.organizerLogo.startsWith('/')) ? (
                      <img 
                        src={event.organizerLogo} 
                        alt={event.organizer || 'Organizer'} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-adv-orange to-amber-500 flex items-center justify-center text-white font-black text-sm">
                        {(event.organizer || 'P').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                        {t.organizerTitle}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 text-[8px] font-extrabold text-emerald-600 border border-emerald-100/30">
                        <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                        {lang === 'en' ? 'VERIFIED' : 'ຢືນຢັນແລ້ວ'}
                      </span>
                    </div>
                    <h3 className="font-bold text-adv-slate text-sm group-hover/organizer:text-adv-orange transition-colors">
                      {event.organizer || (lang === 'en' ? 'Pasopkan Partner' : 'ພັນທະມິດ Pasopkan')}
                    </h3>
                  </div>
                </div>

                <div className="p-1.5 bg-gray-50 group-hover/organizer:bg-gray-100 rounded-lg transition-colors text-gray-400 group-hover/organizer:text-gray-600">
                  {showOrganizerDetails ? (
                    <ChevronUp className="w-4 h-4 transition-transform duration-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                  )}
                </div>
              </div>

              {showOrganizerDetails && (
                <div className="mt-4 pt-3.5 border-t border-gray-100 animate-fadeIn">
                  {/* Organizer Description / Bio */}
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {event.organizerInfo || (
                      lang === 'en' 
                        ? `${event.organizer || 'Pasopkan Partner'} is a verified premium organizer on Pasopkan, committed to curating highly trusted, engaging, and unforgettable cultural, outdoor, or social events across Laos.`
                        : `${event.organizer || 'ພັນທະມິດ Pasopkan'} ແມ່ນຜູ້ຈັດງານລະດັບພຣີມ່ຽມທີ່ໄດ້ຮັບການຢືນຢັນໃນ Pasopkan, ມຸ່ງໝັ້ນທີ່ຈະສ້າງສັນ ແລະ ນຳສະເໜີກິດຈະກຳວັດທະນະທຳ, ການຜະຈົນໄພ ແລະ ງານສັງຄົມ ທີ່ປອດໄພ ແລະ ໜ້າຈົດຈຳທີ່ສຸດໃນລາວ.`
                    )}
                  </p>

                  {/* Contact Channels & Interactive Send Message Form */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                        {lang === 'en' ? 'Contact Channels' : 'ຊ່ອງທາງຕິດຕໍ່'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`mailto:${event.organizerContact || 'info@pasopkan.com'}`}
                        className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-150 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Mail className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                        <span className="truncate">{lang === 'en' ? 'Email' : 'ອີເມວ'}</span>
                      </a>
                      <a
                        href="tel:+8562099999999"
                        className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-150 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{lang === 'en' ? 'Call' : 'ໂທຫາ'}</span>
                      </a>
                    </div>

                  </div>
                </div>
              )}
            </div>




          </div>

          {/* Ticket Sidebar */}
          <div className="lg:col-span-5 block" ref={ticketSidebarRef}>
            {isPast ? (
              <div className="sticky top-24 bg-white rounded-3xl p-6 shadow-sm border border-gray-150/80 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-700 border border-slate-200/60 shadow-xs">
                  <Calendar className="w-6 h-6 text-slate-600" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-widest border border-slate-200">
                    {lang === 'en' ? 'Past Event' : 'ກິດຈະກຳຜ່ານມາແລ້ວ'}
                  </span>
                  <h3 className="font-extrabold text-adv-slate text-base">
                    {lang === 'en' ? 'Ticket Sales Closed' : 'ປິດການຂາຍປີ້ແລ້ວ'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    {lang === 'en'
                      ? 'This activity has already taken place. Ticket purchasing and pricing details are no longer available.'
                      : 'ກິດຈະກຳນີ້ໄດ້ຈັດຂຶ້ນຜ່ານມາແລ້ວ. ບໍ່ສາມາດຊື້ປີ້ໄດ້ອີກ.'}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 font-semibold">
                  {lang === 'en'
                    ? 'You can still view activity details, location map, organizer information, and ratings below.'
                    : 'ທ່ານຍັງສາມາດເບິ່ງລາຍລະອຽດ, ແຜນທີ່, ຂໍ້ມູນຜູ້ຈັດງານ ແລະ ລີວິວໄດ້ຢູ່ລຸ່ມນີ້.'}
                </div>
              </div>
            ) : (
              <div className="sticky top-24 bg-white rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-gray-150/80 space-y-5 relative overflow-hidden">
               {/* Decorative top accent line */}
               <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-adv-orange via-amber-500 to-adv-orange" />

               {/* Calendar Selector */}
               <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-wider text-adv-slate block flex items-center justify-between">
                   <span>{event.dateType === 'flexible' ? t.selectVisitDate : event.dateType === 'booking' ? (lang === 'en' ? 'Select Booking Date' : 'ເລືອກວັນທີຈອງ') : (lang === 'en' ? 'Activity Date' : 'ວັນທີກິດຈະກຳ')}</span>
                   {event.dateType === 'fixed' && (
                     <span className="text-[10px] font-bold text-adv-orange bg-orange-50 px-2 py-0.5 rounded-md">
                       {lang === 'en' ? 'Fixed Event Date' : 'ວັນທີກຳນົດ'}
                     </span>
                   )}
                   {event.dateType === 'booking' && (
                     <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                       {lang === 'en' ? 'Slot Booking' : 'ເປີດໃຫ້ຈອງ'}
                     </span>
                   )}
                 </label>
                 <InlineCalendar
                   selectedDate={selectedVisitDate}
                   onDateChange={(date) => setSelectedVisitDate(date)}
                   dateType={event.dateType || 'fixed'}
                   eventDate={event.date}
                   lang={lang}
                 />
                 {event.dateType === 'fixed' && event.time && (
                   <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50/70 to-amber-50/40 border border-orange-100 rounded-xl text-xs shadow-xs">
                     <div className="flex items-center gap-2">
                       <Clock className="w-4 h-4 text-adv-orange shrink-0" />
                       <span className="font-bold text-gray-600">{t.startTime}:</span>
                     </div>
                     <span className="font-black text-adv-orange bg-white px-2.5 py-0.5 rounded-md border border-orange-200/60 shadow-xs">{event.time}</span>
                   </div>
                 )}
                 {event.dateType === 'booking' && (
                   <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs space-y-2">
                     {event.bookingCapacity && (
                       <div className="flex items-center justify-between text-amber-800 text-[11px]">
                         <span>{lang === 'en' ? 'Max Capacity / Slot' : 'ຈຳນວນສູງສຸດ/ຮອບ'}:</span>
                         <span className="font-bold">{event.bookingCapacity} {lang === 'en' ? 'guests' : 'ຄົນ'}</span>
                       </div>
                     )}
                     {event.bookingApprovalMode && (
                       <div className="flex items-center justify-between text-amber-800 text-[11px]">
                         <span>{lang === 'en' ? 'Confirmation' : 'ການຢືນຢັນ'}:</span>
                         <span className="font-bold">{event.bookingApprovalMode === 'manual' ? (lang === 'en' ? 'Requires Approval' : 'ຕ້ອງໄດ້ຮັບການອະນຸມັດ') : (lang === 'en' ? 'Instant Confirmation' : 'ຢືນຢັນທັນທີ')}</span>
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {/* Time Slot Selector */}
               {event.hasTimeSelection && event.timeSlots && event.timeSlots.length > 0 && (
                 <div className="space-y-2.5">
                   <label className="text-xs font-black uppercase tracking-wider text-adv-slate block flex items-center gap-1.5">
                     <Clock className="w-3.5 h-3.5 text-adv-orange" />
                     {t.selectTimeSlot}
                   </label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                     {event.timeSlots.map((slot) => {
                       const isSelected = selectedTimeSlot === slot;
                       return (
                         <button
                           key={slot}
                           onClick={() => setSelectedTimeSlot(slot)}
                           className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center gap-0.5 relative ${
                             isSelected
                               ? 'border-adv-orange bg-orange-50/90 text-adv-orange ring-2 ring-adv-orange/30 shadow-xs'
                               : 'border-gray-200 bg-white text-adv-slate hover:border-gray-300 hover:bg-gray-50/60'
                           }`}
                         >
                           <span className="font-mono font-black text-xs">{slot}</span>
                           <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                             {parseInt(slot.split(':')[0], 10) < 12 
                               ? (lang === 'en' ? 'Morning' : 'ຕອນເຊົ້າ') 
                               : parseInt(slot.split(':')[0], 10) < 17 
                                 ? (lang === 'en' ? 'Afternoon' : 'ຕອນບ່າຍ') 
                                 : (lang === 'en' ? 'Evening' : 'ຕອນແລງ')
                             }
                           </span>
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}

               {/* Ticket Options (Multi-Tier Selection) */}
               {event.ticketTiers && event.ticketTiers.length > 0 ? (
                 <div className="space-y-2.5">
                   <div className="flex items-center justify-between">
                     <label className="text-xs font-black uppercase tracking-wider text-adv-slate block">
                       {t.selectTickets}
                     </label>
                     <span className="text-[10px] text-gray-400 font-semibold">
                       {lang === 'en' ? `Max ${effectiveMaxTickets} total tickets` : `ສູງສຸດ ${effectiveMaxTickets} ໃບທັງໝົດ`}
                     </span>
                   </div>
                   <div className="space-y-2.5">
                     {event.ticketTiers.map((tier) => {
                       const currentQty = tierQuantities[tier.id] || 0;
                       const isSelected = currentQty > 0;
                       const tierAvailable = tier.available !== undefined ? tier.available : Infinity;
                       const isSoldOut = tierAvailable <= 0;

                       return (
                         <div
                           key={tier.id}
                           className={`w-full p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                             isSelected 
                               ? 'border-adv-orange bg-gradient-to-r from-orange-50/90 to-amber-50/40 shadow-xs ring-2 ring-adv-orange/20' 
                               : isSoldOut 
                                 ? 'border-gray-200 bg-gray-50/60 opacity-60'
                                 : 'border-gray-200 bg-white hover:border-gray-300'
                           }`}
                         >
                           <div className="flex-1 min-w-0 pr-3">
                             <div className="flex items-center gap-2">
                               <p className="font-bold text-xs text-adv-slate group-hover:text-black transition-colors truncate">
                                 {tier.name}
                               </p>
                               {isSelected && (
                                 <span className="text-[10px] font-black bg-adv-orange text-white px-2 py-0.5 rounded-md">
                                   {currentQty}
                                 </span>
                               )}
                             </div>
                             <div className="flex items-center gap-2 mt-0.5">
                               <span className="font-mono font-black text-xs text-adv-orange">
                                 {tier.price.toLocaleString()} {currency}
                               </span>
                               {event.showRemainingTickets && (
                                 <span className="text-[10px] font-semibold text-gray-400">
                                   • {isSoldOut ? (lang === 'en' ? 'Sold Out' : 'ໝົດແລ້ວ') : `${tierAvailable} ${lang === 'en' ? 'remaining' : 'ເຫຼືອ'}`}
                                 </span>
                               )}
                             </div>
                           </div>

                           {/* Tier Quantity Controls */}
                           <div className="flex items-center gap-2 bg-gray-50/90 px-2 py-1 rounded-xl border border-gray-200/80 shadow-2xs shrink-0">
                             <button
                               type="button"
                               onClick={() => handleUpdateTierQuantity(tier.id, -1, tierAvailable)}
                               disabled={currentQty <= 0 || isSoldOut}
                               className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-gray-200 text-gray-700 hover:border-adv-orange hover:text-adv-orange active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                             >
                               <Minus className="w-3 h-3" />
                             </button>
                             <span className="font-black text-xs w-5 text-center text-adv-slate">
                               {currentQty}
                             </span>
                             <button
                               type="button"
                               onClick={() => handleUpdateTierQuantity(tier.id, 1, tierAvailable)}
                               disabled={currentQty >= tierAvailable || isSoldOut || totalQuantity >= effectiveMaxTickets}
                               className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-gray-200 text-gray-700 hover:border-adv-orange hover:text-adv-orange active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                             >
                               <Plus className="w-3 h-3" />
                             </button>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               ) : (
                 /* Single quantity selector when event has no explicit ticket tiers */
                 <div className="flex items-center justify-between py-3 border-t border-b border-gray-100">
                   <div>
                     <span className="text-xs font-black text-adv-slate block">{t.quantity}</span>
                     <span className="text-[10px] text-gray-400 font-semibold block">
                       {lang === 'en' ? `Max ${effectiveMaxTickets} per transaction` : `ສູງສຸດ ${effectiveMaxTickets} ໃບ/ຄັ້ງ`}
                     </span>
                   </div>
                   <div className="flex items-center gap-3 bg-gray-50/80 px-2 py-1.5 rounded-xl border border-gray-200/80 shadow-xs">
                     <button 
                       type="button"
                       onClick={() => setQuantity(Math.max(1, quantity - 1))}
                       disabled={quantity <= 1}
                       className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-gray-200 text-gray-700 hover:border-adv-orange hover:text-adv-orange active:scale-95 transition-all disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                     >
                       <Minus className="w-3.5 h-3.5" />
                     </button>
                     <span className="font-black text-xs w-6 text-center text-adv-slate">{quantity}</span>
                     <button 
                       type="button"
                       onClick={() => setQuantity(Math.min(effectiveMaxTickets, quantity + 1))}
                       disabled={quantity >= effectiveMaxTickets}
                       className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-gray-200 text-gray-700 hover:border-adv-orange hover:text-adv-orange active:scale-95 transition-all disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                     >
                       <Plus className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 </div>
               )}

               {/* Selected Tickets Summary Box */}
               <div className="p-3.5 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-orange-50/80 border border-orange-200/80 rounded-2xl space-y-2">
                 <div className="flex items-center justify-between text-xs font-extrabold text-adv-slate pb-1 border-b border-orange-200/40">
                   <span className="flex items-center gap-1.5 text-adv-orange">
                     <Ticket className="w-4 h-4" />
                     <span>{lang === 'en' ? 'Order Summary' : 'ລາຍການປີ້ທີ່ເລືອກ'}</span>
                   </span>
                   <span className="bg-white px-2 py-0.5 rounded-md border border-orange-200 text-[10px] font-black text-adv-slate">
                     {totalQuantity} {lang === 'en' ? (totalQuantity === 1 ? 'Ticket' : 'Tickets') : 'ໃບ'}
                   </span>
                 </div>

                 {selectedTiersList.length > 0 ? (
                   <div className="space-y-1 text-xs">
                     {selectedTiersList.map(({ tier, quantity: qty }) => (
                       <div key={tier.id} className="flex items-center justify-between font-bold text-gray-700">
                         <span>{qty}× {tier.name}</span>
                         <span className="font-mono text-adv-orange">{(tier.price * qty).toLocaleString()} {currency}</span>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-xs text-gray-400 font-semibold italic">
                     {lang === 'en' ? 'Please select at least 1 ticket to proceed.' : 'ກະລຸນາເລືອກປີ້ຢ່າງໜ້ອຍ 1 ໃບເພື່ອດຳເນີນການ.'}
                   </p>
                 )}

                 {!appliedPromo && (
                   <div className="pt-2 border-t border-gray-150/50 mt-2">
                     <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.promoCode}</label>
                     <div className="flex gap-2">
                       <input 
                         type="text"
                         value={promoCode}
                         onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                         placeholder={t.promoCode}
                         className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:border-adv-orange focus:ring-1 focus:ring-adv-orange transition-all"
                       />
                       <button
                         onClick={handleApplyPromo}
                         disabled={!promoCode.trim()}
                         className="px-3 py-1.5 bg-adv-slate text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {t.apply}
                       </button>
                     </div>
                     {promoError && <p className="text-[9px] font-bold text-red-500 mt-1.5">{promoError}</p>}
                   </div>
                 )}

                 {appliedPromo && (
                    <div className="flex justify-between items-center text-adv-green text-xs font-semibold bg-emerald-50/50 px-2.5 py-1.5 rounded-lg border border-emerald-100/40 mt-2">
                       <span className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{t.discount} ({appliedPromo})</span>
                       </span>
                       <div className="flex items-center gap-2">
                         <span>-{discountValue.toLocaleString()} {currency}</span>
                         <button 
                           onClick={() => { setAppliedPromo(null); setPromoCode(''); setPromoError(''); }} 
                           className="text-gray-400 hover:text-red-500 transition-colors"
                         >
                           <X className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                 )}

                 <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 font-black text-sm text-adv-slate mt-2">
                   <span>{t.total}</span>
                   <span className="text-base text-adv-orange font-mono font-black">{totalPrice.toLocaleString()} {currency}</span>
                 </div>
               </div>



               {/* Total Summary & Checkout Button */}
               <div className="pt-3 border-t border-gray-100 space-y-3">
                 <button 
                   onClick={handleCheckout}
                   disabled={event.status === 'paused'}
                   className={`w-full py-4 rounded-xl text-white font-black text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer ${
                     event.status === 'paused'
                       ? 'bg-gray-300 shadow-none cursor-not-allowed text-gray-500'
                       : 'bg-adv-orange hover:bg-orange-600 shadow-lg shadow-orange-500/25'
                   }`}
                 >
                   <span>
                     {event.status === 'paused' 
                       ? (lang === 'en' ? 'Booking Paused' : 'ໂຈະການຂາຍປີ້ຊົ່ວຄາວ') 
                       : t.checkout}
                   </span>
                   {event.status !== 'paused' && <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />}
                 </button>
               </div>

            </div>
            )}
          </div>

          {/* Mobile Event Organizer (Visible on Mobile Only) */}
          <div className="col-span-1 block lg:hidden w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-150/60">
            <div 
              onClick={() => setShowOrganizerDetails(!showOrganizerDetails)}
              className="flex items-center justify-between gap-4 cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {event.organizerLogo && (event.organizerLogo.startsWith('data:') || event.organizerLogo.startsWith('http') || event.organizerLogo.startsWith('/')) ? (
                    <img 
                      src={event.organizerLogo} 
                      alt={event.organizer || 'Organizer'} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-adv-orange to-amber-500 flex items-center justify-center text-white font-black text-sm">
                      {(event.organizer || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      {t.organizerTitle}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 text-[8px] font-extrabold text-emerald-600 border border-emerald-100/30">
                      <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                      {lang === 'en' ? 'VERIFIED' : 'ຢືນຢັນແລ້ວ'}
                    </span>
                  </div>
                  <h3 className="font-bold text-adv-slate text-sm">
                    {event.organizer || (lang === 'en' ? 'Pasopkan Partner' : 'ພັນທະມິດ Pasopkan')}
                  </h3>
                </div>
              </div>

              <div className="p-1.5 bg-gray-50 rounded-lg transition-colors text-gray-400">
                {showOrganizerDetails ? (
                  <ChevronUp className="w-4 h-4 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                )}
              </div>
            </div>

            {showOrganizerDetails && (
              <div className="mt-4 pt-3.5 border-t border-gray-100 animate-fadeIn">
                {/* Organizer Description / Bio */}
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {event.organizerInfo || (
                    lang === 'en' 
                      ? `${event.organizer || 'Pasopkan Partner'} is a verified premium organizer on Pasopkan, committed to curating highly trusted, engaging, and unforgettable cultural, outdoor, or social events across Laos.`
                      : `${event.organizer || 'ພັນທະມິດ Pasopkan'} ແມ່ນຜູ້ຈັດງານລະດັບພຣີມ່ຽມທີ່ໄດ້ຮັບການຢືນຢັນໃນ Pasopkan, ມຸ່ງໝັ້ນທີ່ຈະສ້າງສັນ ແລະ ນຳສະເໜີກິດຈະກຳວັດທະນະທຳ, ການຜະຈົນໄພ ແລະ ງານສັງຄົມ ທີ່ປອດໄພ ແລະ ໜ້າຈົດຈຳທີ່ສຸດໃນລາວ.`
                  )}
                </p>

                {/* Contact Channels & Interactive Send Message Form */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      {lang === 'en' ? 'Contact Channels' : 'ຊ່ອງທາງຕິດຕໍ່'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`mailto:${event.organizerContact || 'info@pasopkan.com'}`}
                      className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-150 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                      <span className="truncate">{lang === 'en' ? 'Email' : 'ອີເມວ'}</span>
                    </a>
                    <a
                      href="tel:+8562099999999"
                      className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-150 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{lang === 'en' ? 'Call' : 'ໂທຫາ'}</span>
                    </a>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating booking CTA bar */}
      <AnimatePresence>
        {!isPast && !isSidebarVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="lg:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden"
          >
            <button 
              onClick={() => {
                if (event.status !== 'paused') {
                  ticketSidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              disabled={event.status === 'paused'}
              className={`w-full py-3 px-5 font-bold flex items-center justify-between transition-all ${
                event.status === 'paused'
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-adv-orange text-white active:scale-[0.98]'
              }`}
            >
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-85 font-bold">
                  {lang === 'en' ? 'Starting Price' : 'ລາຄາເລີ່ມຕົ້ນ'}
                </span>
                <span className="text-base font-black leading-tight">
                  {(selectedTier?.price || event.price || 0).toLocaleString()} {currency}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-sm uppercase tracking-wider font-black">
                <span>
                  {event.status === 'paused' 
                    ? (lang === 'en' ? 'Booking Paused' : 'ໂຈະການຂາຍປີ້ຊົ່ວຄາວ') 
                    : t.checkout}
                </span>
                {event.status !== 'paused' && <ArrowRight className="w-4 h-4" />}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
