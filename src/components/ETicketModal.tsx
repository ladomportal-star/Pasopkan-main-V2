import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LaoEvent, TicketTier } from '../data/events';
import {
  getTicketSponsorSettings,
  TicketSponsorSettings,
  DEFAULT_TICKET_SPONSOR_SETTINGS,
  resolveTicketAd
} from '../lib/siteSettings';

export interface PurchasedTicket {
  id: string;
  event: LaoEvent;
  tier: TicketTier;
  quantity: number;
  bookingDate: string;
  status: 'upcoming' | 'past';
  scanned?: boolean;
  selectedDate?: string;
  selectedTime?: string;
}

interface ETicketModalProps {
  ticket: PurchasedTicket | null;
  onClose: () => void;
  user?: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  lang?: 'en' | 'lo';
  onNavigateHome?: () => void;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({
  ticket,
  onClose,
  user,
  lang = 'en',
  onNavigateHome,
}) => {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [sponsorSettings, setSponsorSettings] = useState<TicketSponsorSettings>(DEFAULT_TICKET_SPONSOR_SETTINGS);

  // Fetch ticket sponsor settings and listen for live updates
  useEffect(() => {
    let isMounted = true;
    async function loadSponsors() {
      try {
        const settings = await getTicketSponsorSettings();
        if (isMounted && settings) {
          setSponsorSettings(settings);
        }
      } catch (err) {
        console.warn('Failed to load ticket sponsors:', err);
      }
    }
    loadSponsors();

    const handleSponsorsUpdated = (e: any) => {
      if (e.detail) {
        setSponsorSettings(e.detail);
      }
    };

    window.addEventListener('pasopkan_sponsors_updated', handleSponsorsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('pasopkan_sponsors_updated', handleSponsorsUpdated);
    };
  }, []);

  // Sync ticket state and reset closing
  useEffect(() => {
    if (ticket) {
      setIsClosing(false);
    }
  }, [ticket]);

  // Handle smooth dismissal animation
  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  // Keyboard shortcut (Escape) to close with animation
  useEffect(() => {
    if (!ticket) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticket, isClosing]);

  // Prevent background and page scrolling on mobile when modal is active
  useEffect(() => {
    if (!ticket) return;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [ticket]);

  if (!ticket) return null;

  const totalQuantity = ticket.quantity || 1;
  const currentTicketId = totalQuantity > 1 ? `${ticket.id}-${currentTicketIndex + 1}` : ticket.id;

  // Format Order ID for display (e.g. EBP139920AC)
  const formattedOrderId = (ticket.id.startsWith('tkt-') || ticket.id.startsWith('tk_'))
    ? ticket.id.replace(/^(tkt-|tk_)/, 'EBP').toUpperCase().slice(0, 11)
    : ticket.id.length > 11 
      ? `EBP${ticket.id.slice(-8).toUpperCase()}`
      : ticket.id.toUpperCase();

  // Formatted date
  const formatEventDate = () => {
    try {
      if (ticket.selectedDate) {
        const d = new Date(ticket.selectedDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        }
      }
      return ticket.event.date || '14 February 2025';
    } catch {
      return ticket.event.date || '14 February 2025';
    }
  };

  // Formatted time
  const formatEventTime = () => {
    const rawTime = ticket.selectedTime || (ticket as any).time || (ticket as any).selected_time || ticket.event?.time;
    if (!rawTime) return '18:00';
    // If it has seconds like "18:00:00", trim to "18:00"
    if (/^\d{2}:\d{2}:\d{2}$/.test(rawTime)) {
      return rawTime.substring(0, 5);
    }
    return rawTime;
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 overflow-hidden select-none overscroll-none touch-none"
        onClick={handleDismiss}
      >
        {/* Backdrop: White on mobile devices, dark dimmed on desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="fixed inset-0 bg-white sm:bg-black/80 sm:backdrop-blur-md"
        />

        {/* Main Container Frame: Fits screen height perfectly from top to bottom on mobile without scrolling */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ 
            opacity: isClosing ? 0 : 1, 
            scale: isClosing ? 0.92 : 1, 
            y: isClosing ? 36 : 0 
          }}
          exit={{ opacity: 0, scale: 0.92, y: 36 }}
          transition={{ 
            type: 'spring', 
            damping: isClosing ? 28 : 25, 
            stiffness: isClosing ? 360 : 320,
            mass: 0.8
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[375px] sm:max-w-[400px] h-[96dvh] sm:h-auto sm:max-h-[92vh] rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#FF5500] via-[#F24E00] to-[#E04500] text-white p-3.5 sm:p-5 shadow-2xl flex flex-col justify-between overflow-hidden border border-orange-400/30"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-4 px-1 pt-0.5 shrink-0">
            <motion.button
              type="button"
              onClick={handleDismiss}
              whileTap={{ scale: 0.84, x: -4 }}
              whileHover={{ scale: 1.08, backgroundColor: 'rgba(0,0,0,0.25)' }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-black/15 active:bg-black/30 transition-colors text-white cursor-pointer shadow-sm"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </motion.button>

            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {lang === 'lo' ? 'ປີ້ E-Ticket ຂອງທ່ານ' : 'Your E-Ticket'}
            </h2>

            <div className="w-8 h-8 sm:w-9 sm:h-9" /> {/* Spacer for centering the title */}
          </div>

          {/* Multi-Ticket Navigation Banner if quantity > 1 */}
          {totalQuantity > 1 && (
            <div className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-1 mb-2 sm:mb-3 text-xs font-bold text-white shrink-0">
              <button
                type="button"
                disabled={currentTicketIndex === 0}
                onClick={() => setCurrentTicketIndex((prev) => prev - 1)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="tracking-wider uppercase text-[10px] sm:text-[11px] font-extrabold">
                {lang === 'lo' 
                  ? `ປີ້ທີ ${currentTicketIndex + 1} ຈາກ ${totalQuantity}` 
                  : `Ticket ${currentTicketIndex + 1} of ${totalQuantity}`}
              </span>
              <button
                type="button"
                disabled={currentTicketIndex === totalQuantity - 1}
                onClick={() => setCurrentTicketIndex((prev) => prev + 1)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* White E-Ticket Card */}
          <div className="relative flex-1 flex flex-col justify-between bg-white rounded-[22px] sm:rounded-[26px] text-gray-900 shadow-xl overflow-hidden pt-3.5 pb-3 sm:pt-5 sm:pb-5 px-4 sm:px-6 min-h-0">
            {/* Top Ticket Details */}
            <div className="shrink-0">
              {/* Brand Logo Header Bar */}
              <div className="flex items-center justify-center pb-2.5 mb-2.5 sm:mb-3 border-b border-gray-100 shrink-0">
                <img 
                  src="/pasopkan_logo.png" 
                  alt="Pasopkan" 
                  className="h-12 sm:h-14 md:h-16 w-auto max-w-[260px] object-contain drop-shadow-sm" 
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Event Title */}
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 leading-tight mb-2.5 sm:mb-3.5 tracking-tight line-clamp-2">
                {ticket.event.title}
              </h1>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:gap-y-3 mb-2.5 sm:mb-3.5">
                <div>
                  <p className="text-xs sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ວັນທີ' : 'Date'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 mt-0.5 leading-tight">
                    {formatEventDate()}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ເວລາ' : 'Time'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 mt-0.5 leading-tight">
                    {formatEventTime()}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ປະເພດການເຂົ້າ' : 'Check In Type'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 mt-0.5 leading-tight truncate">
                    {ticket.tier.name || 'VIP A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ລະຫັດອໍເດີ' : 'Order ID'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 mt-0.5 font-mono tracking-tight leading-tight">
                    {formattedOrderId}
                  </p>
                </div>
              </div>

              {/* Place / Venue */}
              <div>
                <p className="text-xs sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {lang === 'lo' ? 'ສະຖານທີ່' : 'Place'}
                </p>
                <p className="text-[13px] sm:text-sm font-semibold text-gray-900 mt-0.5 leading-snug line-clamp-2">
                  {ticket.event.venue ? `${ticket.event.venue}, ` : ''}{ticket.event.location || 'Vientiane Capital, Laos'}
                </p>
              </div>
            </div>

            {/* Perforated Divider with Circular Concave Cutouts */}
            <div className="relative my-2 sm:my-3 -mx-4 sm:-mx-6 py-1 flex items-center shrink-0">
              {/* Left Cutout */}
              <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F24E00] z-10" />
              
              {/* Dashed Perforation Line */}
              <div className="w-full border-t-2 border-dashed border-gray-200 mx-5" />

              {/* Right Cutout */}
              <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F24E00] z-10" />
            </div>

            {/* Direct QR Code Section */}
            <div className="pt-1 pb-1 flex-1 flex flex-col items-center justify-center min-h-0">
              <div className="p-2.5 sm:p-3.5 bg-white rounded-2xl sm:rounded-3xl border border-gray-150 shadow-md flex items-center justify-center">
                <QRCodeSVG
                  value={currentTicketId}
                  size={180}
                  className="w-32 h-32 sm:w-44 sm:h-44 md:w-48 md:h-48 max-h-[26vh] max-w-[26vh]"
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Dynamic Sponsor Ad Banner under QR Code */}
            {sponsorSettings?.isEnabled && (() => {
              const resolvedAd = resolveTicketAd(sponsorSettings);
              if (!resolvedAd.isDisplayed || !resolvedAd.bannerUrl) return null;

              return (
                <div className="pt-2 pb-0.5 flex flex-col items-center justify-center shrink-0 border-t border-gray-100/80 mt-1 w-full">
                  {/* Full-width sponsor banner filling the entire frame width */}
                  <div className="w-full flex items-center justify-center rounded-xl overflow-hidden bg-white/50 border border-gray-100/80">
                    {resolvedAd.websiteUrl ? (
                      <a
                        href={resolvedAd.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center hover:opacity-90 transition-opacity"
                        title={resolvedAd.name}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img 
                          src={resolvedAd.bannerUrl} 
                          alt={resolvedAd.name || 'Ad Banner'} 
                          className="w-full h-auto max-h-16 sm:max-h-20 object-contain rounded-lg hover:scale-[1.01] transition-transform" 
                          referrerPolicy="no-referrer" 
                        />
                      </a>
                    ) : (
                      <img 
                        src={resolvedAd.bannerUrl} 
                        alt={resolvedAd.name || 'Ad Banner'} 
                        className="w-full h-auto max-h-16 sm:max-h-20 object-contain rounded-lg" 
                        referrerPolicy="no-referrer" 
                        title={resolvedAd.name}
                      />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ETicketModal;
