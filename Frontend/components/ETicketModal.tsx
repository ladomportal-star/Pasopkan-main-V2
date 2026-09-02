import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LaoEvent, TicketTier } from '../data/events';
import {
  getTicketSponsorSettings,
  TicketSponsorSettings,
  DEFAULT_TICKET_SPONSOR_SETTINGS,
  resolveTicketAd
} from '../lib/siteSettings';
import { useCheckins } from '../lib/checkinsStore';

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
      setCurrentTicketIndex(0);
    }
  }, [ticket?.id]);

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

  const totalQuantity = ticket?.quantity || 1;
  const currentTicketId = totalQuantity > 1 ? `${ticket?.id}-${currentTicketIndex + 1}` : (ticket?.id || '');

  // Connect to live check-ins store to see if this ticket (or specific sub-ticket) is already scanned
  const { allCheckins } = useCheckins(ticket?.event?.id ? String(ticket.event.id) : undefined);

  const scannedRecord = useMemo(() => {
    if (!ticket) return null;
    const currentId = currentTicketId.toLowerCase();
    const baseId = ticket.id.toLowerCase();

    // Check if recorded in check-ins store
    const found = allCheckins.find((c) => {
      const recTicketId = (c.ticketId || c.id || '').toLowerCase();
      return (
        recTicketId === currentId ||
        (totalQuantity === 1 && recTicketId === baseId) ||
        (String(c.eventId) === String(ticket.event.id) && (recTicketId === currentId || recTicketId === baseId))
      );
    });

    if (found) return found;

    // Fallback if marked scanned on ticket object
    if (ticket.scanned || ticket.status === 'past') {
      return {
        id: `chk_${ticket.id}`,
        ticketId: currentTicketId,
        eventId: String(ticket.event.id),
        attendeeName: user?.displayName || 'Attendee',
        email: user?.email || '',
        ticketType: ticket.tier.name,
        zone: 'Verified',
        seat: 'N/A',
        time: ticket.selectedTime || 'Verified',
      };
    }

    return null;
  }, [ticket, currentTicketId, totalQuantity, allCheckins, user]);

  const isScanned = !!scannedRecord || ticket?.scanned === true;

  if (!ticket) return null;

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
          className="relative w-full max-w-[390px] sm:max-w-[420px] md:max-w-[440px] h-[96dvh] sm:h-auto sm:max-h-[92vh] rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#FF5500] via-[#F24E00] to-[#E04500] text-white p-3 sm:p-4 md:p-5 shadow-2xl flex flex-col justify-between overflow-hidden border border-orange-400/30"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-1 pt-0.5 shrink-0 mb-1 sm:mb-1.5">
            <motion.button
              type="button"
              onClick={handleDismiss}
              whileTap={{ scale: 0.84, x: -4 }}
              whileHover={{ scale: 1.08, backgroundColor: 'rgba(0,0,0,0.25)' }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/15 active:bg-black/30 transition-colors text-white cursor-pointer shadow-sm shrink-0"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </motion.button>

            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-tight">
              {lang === 'lo' ? 'ປີ້ E-Ticket ຂອງທ່ານ' : 'Your E-Ticket'}
            </h2>

            <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" /> {/* Spacer for centering the title */}
          </div>

          {/* Multi-Ticket Navigation Banner if quantity > 1 (Full-width / longer bar) */}
          {totalQuantity > 1 && (
            <div className="w-full flex items-center justify-between bg-black/25 backdrop-blur-xs rounded-full px-3 sm:px-4 py-1.5 mb-1.5 sm:mb-2 text-xs font-bold text-white shadow-xs border border-white/15 shrink-0">
              <button
                type="button"
                disabled={currentTicketIndex === 0}
                onClick={() => setCurrentTicketIndex((prev) => prev - 1)}
                className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 disabled:opacity-20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                aria-label="Previous ticket"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-2 px-2">
                <span className="tracking-wider uppercase text-[11px] sm:text-xs font-black text-white">
                  {lang === 'lo' 
                    ? `ປີ້ທີ ${currentTicketIndex + 1} ຈາກ ${totalQuantity}` 
                    : `Ticket ${currentTicketIndex + 1} of ${totalQuantity}`}
                </span>
                {isScanned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs">
                    <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
                    {lang === 'lo' ? 'ສະແກນແລ້ວ' : 'Scanned'}
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={currentTicketIndex === totalQuantity - 1}
                onClick={() => setCurrentTicketIndex((prev) => prev + 1)}
                className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 disabled:opacity-20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                aria-label="Next ticket"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* White E-Ticket Card */}
          <div className="relative flex-1 flex flex-col justify-between bg-white rounded-[22px] sm:rounded-[26px] text-gray-900 shadow-xl overflow-hidden px-3.5 sm:px-5 pt-2.5 pb-2 sm:pt-3.5 sm:pb-3 min-h-0">
            {/* Top Ticket Details */}
            <div className="shrink-0">
              {/* Brand Logo Header Bar */}
              <div className="flex items-center justify-center border-b border-gray-100 pb-1.5 mb-1.5 sm:pb-2 sm:mb-2 shrink-0">
                <img 
                  src="/pasopkan_logo.png" 
                  alt="Pasopkan" 
                  className="h-10 sm:h-12 md:h-14 w-auto max-w-[240px] object-contain drop-shadow-sm transition-transform" 
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Event Title */}
              <h1 className="text-base sm:text-lg md:text-xl font-black text-gray-950 leading-tight tracking-tight mb-1.5 line-clamp-2">
                {ticket.event.title}
              </h1>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 mb-1.5">
                <div>
                  <p className="text-[9.5px] sm:text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ວັນທີ' : 'Date'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-950 leading-tight mt-0.5">
                    {formatEventDate()}
                  </p>
                </div>

                <div>
                  <p className="text-[9.5px] sm:text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ເວລາ' : 'Time'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-950 leading-tight mt-0.5">
                    {formatEventTime()}
                  </p>
                </div>

                <div>
                  <p className="text-[9.5px] sm:text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ປະເພດການເຂົ້າ' : 'Check In Type'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-950 leading-tight truncate mt-0.5">
                    {ticket.tier.name || 'VIP A'}
                  </p>
                </div>

                <div>
                  <p className="text-[9.5px] sm:text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                    {lang === 'lo' ? 'ລະຫັດອໍເດີ' : 'Order ID'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-950 font-mono tracking-tight leading-tight mt-0.5">
                    {formattedOrderId}
                  </p>
                </div>
              </div>
            </div>

            {/* Perforated Divider with Circular Concave Cutouts */}
            <div className="relative -mx-3.5 sm:-mx-5 py-0.5 my-1.5 sm:my-2 flex items-center shrink-0">
              {/* Left Cutout */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F24E00] z-10" />
              
              {/* Dashed Perforation Line */}
              <div className="w-full border-t-2 border-dashed border-gray-200 mx-4 sm:mx-5" />

              {/* Right Cutout */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F24E00] z-10" />
            </div>

            {/* Direct QR Code Section (Enlarged and optimized for fast scanning) */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-1">
              {/* Scanned / Status Notification Badge */}
              {isScanned ? (
                <div className="mb-1.5 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 sm:px-4 sm:py-1.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-xs animate-in fade-in zoom-in-95 duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                    <span>{lang === 'lo' ? 'ສະແກນແລ້ວ' : 'ALREADY SCANNED'}</span>
                    {scannedRecord?.time && (
                      <span className="text-emerald-100 font-mono text-[10px] pl-1.5 border-l border-emerald-400/60">
                        {scannedRecord.time}
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="mb-1 text-[10.5px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  {lang === 'lo' ? 'ສະແກນ QR ເພື່ອເຂົ້າງານ' : 'Scan to enter'}
                </div>
              )}

              <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-md p-3 sm:p-4 flex items-center justify-center overflow-hidden shrink-0">
                <QRCodeSVG
                  value={currentTicketId}
                  size={300}
                  className={`w-52 h-52 sm:w-60 sm:h-60 md:w-64 md:h-64 transition-all duration-300 ${
                    isScanned ? 'opacity-35 grayscale-[40%]' : 'opacity-100'
                  }`}
                  level="H"
                  includeMargin={false}
                />

                {/* Scanned Badge Stamp Overlay */}
                {isScanned && (
                  <motion.div 
                    initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
                    animate={{ scale: 1, opacity: 1, rotate: -4 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2"
                  >
                    <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl border-2 border-white flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs">
                        <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                        <span>{lang === 'lo' ? 'ສະແກນແລ້ວ' : 'ALREADY SCANNED'}</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-100 tracking-wide mt-0.5">
                        {lang === 'lo' ? 'ກວດສອບການເຂົ້າຮ່ວມແລ້ວ' : 'Entry Verified'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Dynamic Sponsor Ad Banner under QR Code */}
            {sponsorSettings?.isEnabled && (() => {
              const resolvedAd = resolveTicketAd(sponsorSettings);
              if (!resolvedAd.isDisplayed || !resolvedAd.bannerUrl) return null;

              return (
                <div className="flex flex-col items-center justify-center shrink-0 border-t border-gray-100/80 w-full pt-1.5 pb-0.5 mt-1">
                  {/* Full-width sponsor banner filling the entire frame width cleanly */}
                  <div className="w-full h-13 sm:h-15 rounded-xl overflow-hidden bg-gray-50 border border-gray-200/80 shadow-2xs">
                    {resolvedAd.websiteUrl ? (
                      <a
                        href={resolvedAd.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-full block relative group"
                        title={resolvedAd.name}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img 
                          src={resolvedAd.bannerUrl} 
                          alt={resolvedAd.name || 'Ad Banner'} 
                          className="w-full h-full object-cover object-center rounded-xl group-hover:scale-[1.02] transition-transform duration-200" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/Pasopkan ads.png';
                          }}
                        />
                      </a>
                    ) : (
                      <img 
                        src={resolvedAd.bannerUrl} 
                        alt={resolvedAd.name || 'Ad Banner'} 
                        className="w-full h-full object-cover object-center rounded-xl" 
                        referrerPolicy="no-referrer" 
                        title={resolvedAd.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/Pasopkan ads.png';
                        }}
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
