import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LaoEvent, TicketTier } from '../data/events';
import { formatEventDateDDMMYYYY } from '../lib/dateFormat';
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
  ticketCodes: string[];
  orderNumber: string;
  bookingDate: string;
  status: 'upcoming' | 'past' | 'pending_refund' | 'refunded';
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
  const currentTicketId = ticket?.ticketCodes?.[currentTicketIndex] ?? '';

  const isPast = useMemo(() => {
    if (!ticket) return false;
    if (ticket.status === 'past') return true;
    const dateStr = ticket.selectedDate || ticket.event?.endDate || ticket.event?.date;
    if (!dateStr) return false;
    const now = new Date();
    const curY = now.getFullYear();
    const curM = String(now.getMonth() + 1).padStart(2, '0');
    const curD = String(now.getDate()).padStart(2, '0');
    const todayLocal = `${curY}-${curM}-${curD}`;
    const cleanDate = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return cleanDate < todayLocal;
    }
    try {
      const parsed = new Date(cleanDate);
      if (!isNaN(parsed.getTime())) {
        const pY = parsed.getFullYear();
        const pM = String(parsed.getMonth() + 1).padStart(2, '0');
        const pD = String(parsed.getDate()).padStart(2, '0');
        return `${pY}-${pM}-${pD}` < todayLocal;
      }
    } catch {
      // ignore
    }
    return false;
  }, [ticket]);

  const isRefunded = ticket?.status === 'pending_refund' || ticket?.status === 'refunded';

  const isScanned = !isRefunded && ticket?.scanned === true;
  const isExpired = !isRefunded && !isScanned && isPast;

  if (!ticket) return null;

  const formattedOrderId = ticket.orderNumber || ticket.id;

  // Formatted date
  const formatEventDate = () => {
    return formatEventDateDDMMYYYY(ticket.selectedDate || ticket.event.date) || '—';
  };

  // Formatted time
  const formatEventTime = () => {
    let rawTime = ticket.selectedTime || (ticket as any).time || (ticket as any).selected_time || ticket.event?.time;
    if (!rawTime) return '—';
    
    // Extract just the start time if it contains a range (e.g., "18:00 - 23:00")
    if (typeof rawTime === 'string' && rawTime.includes('-')) {
      rawTime = rawTime.split('-')[0].trim();
    }
    
    // If it has seconds like "18:00:00", trim to "18:00"
    if (/^\d{2}:\d{2}:\d{2}$/.test(rawTime)) {
      return rawTime.substring(0, 5);
    }
    return rawTime;
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto select-none overscroll-none"
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

        {/* Main Container Frame: Fits screen height perfectly and matches the design */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          animate={{ 
            opacity: isClosing ? 0 : 1, 
            scale: isClosing ? 0.98 : 1, 
            y: isClosing ? 16 : 0 
          }}
          exit={{ opacity: 0, scale: 0.98, y: 16 }}
          transition={{ 
            duration: 0.35, 
            ease: [0.22, 1, 0.36, 1]
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[370px] sm:max-w-[390px] h-auto max-h-[96vh] rounded-[32px] sm:rounded-[36px] bg-[#F24E00] text-white p-3 sm:p-4 shadow-2xl flex flex-col justify-start overflow-y-auto border border-orange-400/30 my-auto"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-1 pt-0.5 shrink-0 mb-1.5 sm:mb-2">
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

            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
              {lang === 'lo' ? 'ປີ້ E-Ticket ຂອງທ່ານ' : 'Your E-Ticket'}
            </h2>

            <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" /> {/* Spacer for centering the title */}
          </div>

          {/* Multi-Ticket Navigation Banner if quantity > 1 (Full-width / longer bar) */}
          {totalQuantity > 1 && (
            <div className="w-full flex items-center justify-between bg-black/25 backdrop-blur-xs rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-1.5 sm:mb-2 text-xs font-bold text-white shadow-xs border border-white/15 shrink-0">
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
          <div className="relative w-full bg-white rounded-[24px] sm:rounded-[28px] text-gray-900 shadow-xl overflow-hidden px-3.5 sm:px-4 pt-3 pb-3 flex flex-col justify-start">
            {/* Top Ticket Details */}
            <div className="w-full flex flex-col justify-start shrink-0">
              {/* Event Image Banner Header */}
              <div className="w-full h-32 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-2.5 shrink-0 bg-gray-100 shadow-2xs border border-gray-100">
                <img 
                  src={ticket.event.image || '/pasopkan_logo.png'} 
                  alt={ticket.event.title} 
                  className="w-full h-full object-cover object-center" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pasopkan_logo.png';
                  }}
                />
              </div>

              {/* Event Title */}
              <h1 className="text-base sm:text-lg font-bold text-gray-950 leading-snug tracking-tight mb-2 sm:mb-2.5 line-clamp-2">
                {ticket.event.title}
              </h1>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-2">
                <div>
                  <p className="text-[11px] font-medium text-gray-400">
                    {lang === 'lo' ? 'ວັນທີ' : 'Date'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 mt-0.5 truncate">
                    {formatEventDate()}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-400">
                    {lang === 'lo' ? 'ເວລາເລີ່ມງານ' : 'Start Time'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 mt-0.5 truncate">
                    {formatEventTime()}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-400">
                    {lang === 'lo' ? 'ປະເພດການເຂົ້າ' : 'Check In Type'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 mt-0.5 truncate" title={ticket.tier.name || 'VIP A'}>
                    {ticket.tier.name || 'VIP A'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-400">
                    {lang === 'lo' ? 'ລະຫັດອໍເດີ' : 'Order ID'}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-950 font-mono mt-0.5 truncate" title={formattedOrderId}>
                    {formattedOrderId}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom QR Section: Cutting Line placed directly near the QR Code */}
            <div className="w-full flex flex-col shrink-0 pt-0.5">
              {/* Perforated Divider with Circular Concave Cutouts */}
              <div className="relative -mx-3.5 sm:-mx-4 py-0.5 my-1.5 sm:my-2 flex items-center shrink-0">
                {/* Left Cutout */}
                <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F24E00] z-10" />
                
                {/* Dashed Perforation Line */}
                <div className="w-full border-t border-dashed border-gray-300 mx-3.5" />

                {/* Right Cutout */}
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F24E00] z-10" />
              </div>

              {/* Direct QR Code Section */}
              <div className="flex flex-col items-center justify-center min-h-0 py-0.5">
                {/* Scanned / Status Notification Badge */}
                {isRefunded ? (
                  <div className="mb-1.5 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-4 sm:py-1 bg-red-600 text-white rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs animate-in fade-in zoom-in-95 duration-200">
                      <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{lang === 'lo' ? 'ປີ້ຖືກຄືນເງິນແລ້ວ (ໂມຄະ)' : 'REFUNDED - QR VOIDED'}</span>
                    </span>
                  </div>
                ) : isScanned ? (
                  <div className="mb-1.5 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-4 sm:py-1 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs animate-in fade-in zoom-in-95 duration-200">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{lang === 'lo' ? 'ສະແກນແລ້ວ' : 'ALREADY SCANNED'}</span>
                    </span>
                  </div>
                ) : isExpired ? (
                  <div className="mb-1.5 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-4 sm:py-1 bg-red-500 dark:bg-red-500 text-white rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs animate-in fade-in zoom-in-95 duration-200">
                      <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{lang === 'lo' ? 'ໝົດອາຍຸ' : 'EXPIRED'}</span>
                    </span>
                  </div>
                ) : (
                  <div className="mb-2 text-xs font-medium text-gray-500 text-center">
                    {lang === 'lo' ? 'ສະແກນ QR ເພື່ອເຂົ້າງານ' : 'Scan to enter'}
                  </div>
                )}

                {/* Subtitle / Notice for Refunded */}
                {isRefunded && (
                  <div className="mb-1 text-[10px] sm:text-[11px] font-bold text-red-500 uppercase tracking-wider text-center">
                    {lang === 'lo' ? 'QR Code ຖືກຍົກເລີກແລ້ວ ບໍ່ສາມາດສະແກນໄດ້' : 'QR code deactivated - Entry prohibited'}
                  </div>
                )}

                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xs p-3 flex items-center justify-center overflow-hidden shrink-0 mx-auto">
                  {isRefunded ? (
                    <div className="w-[195px] h-[195px] sm:w-[210px] sm:h-[210px] flex flex-col items-center justify-center text-center p-2.5 bg-red-50/70 rounded-xl border-2 border-dashed border-red-300">
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-1.5 shadow-inner">
                        <XCircle className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="text-xs font-black text-red-600 uppercase tracking-wider">
                        {lang === 'lo' ? 'QR Code ຖືກຍົກເລີກແລ້ວ' : 'QR CODE VOIDED'}
                      </div>
                      <p className="text-[9.5px] sm:text-[10px] font-medium text-gray-500 mt-1 leading-relaxed max-w-[170px]">
                        {lang === 'lo' 
                          ? 'ປີ້ໃບນີ້ໄດ້ຖືກຂໍຄືນເງິນແລ້ວ ລະຫັດຖືກຍົກເລີກ ແລະ ບໍ່ສາມາດສະແກນເຂົ້າງານໄດ້.' 
                          : 'This ticket was refunded. The QR code has been deactivated.'}
                      </p>
                    </div>
                  ) : currentTicketId ? (
                    <>
                      <QRCodeSVG
                        value={currentTicketId}
                        size={220}
                        className={`w-[195px] h-[195px] sm:w-[210px] sm:h-[210px] transition-all duration-300 ${
                          isScanned || isExpired ? 'opacity-35 grayscale-[40%]' : 'opacity-100'
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
                          <div className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl shadow-xl border-2 border-white flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs">
                              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              <span>{lang === 'lo' ? 'ສະແກນແລ້ວ' : 'ALREADY SCANNED'}</span>
                            </div>
                            <span className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-100 tracking-wide mt-0.5">
                              {lang === 'lo' ? 'ກວດສອບການເຂົ້າຮ່ວມແລ້ວ' : 'Entry Verified'}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Expired Badge Stamp Overlay */}
                      {isExpired && (
                        <motion.div 
                          initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
                          animate={{ scale: 1, opacity: 1, rotate: -4 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2"
                        >
                          <div className="bg-red-500 text-white px-3.5 py-1.5 rounded-xl shadow-xl border-2 border-white flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs">
                              <XCircle className="w-4 h-4 stroke-[2.5]" />
                              <span>{lang === 'lo' ? 'ໝົດອາຍຸ' : 'EXPIRED'}</span>
                            </div>
                            <span className="text-[8.5px] sm:text-[9.5px] font-bold text-red-100 tracking-wide mt-0.5">
                              {lang === 'lo' ? 'ກິດຈະກຳສິ້ນສຸດແລ້ວ' : 'Event Ended'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <p className="px-5 py-8 text-center text-sm font-semibold text-gray-500">
                      {lang === 'lo' ? 'ບໍ່ພົບ QR ປີ້ຈາກ Backend' : 'Ticket QR is unavailable from the backend'}
                    </p>
                  )}
                </div>

                {/* Ticket Code Display under QR Code */}
                {currentTicketId && (
                  <div className="w-full mt-2.5 bg-[#F6F8FA] border border-[#E1E4E8] rounded-xl px-3 py-2 text-left shrink-0">
                    <div className="flex items-start gap-1 text-[11px] sm:text-xs">
                      <span className="text-gray-400 font-medium shrink-0 leading-snug">
                        {lang === 'lo' ? 'ລະຫັດປີ້:' : 'Ticket Code:'}
                      </span>
                      <span className="font-mono text-gray-800 font-semibold break-all leading-snug">
                        {currentTicketId}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Space under for ads: Dedicated ad banner area matching 800 x 160 px ratio */}
              <div className="shrink-0 w-full mt-2.5 flex items-center justify-center">
                {sponsorSettings?.isEnabled && (() => {
                  const resolvedAd = resolveTicketAd(sponsorSettings);
                  if (resolvedAd.isDisplayed && resolvedAd.bannerUrl) {
                    return (
                      <div className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-50 border border-gray-200/80 shadow-2xs">
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
                              className="w-full h-full object-cover object-center rounded-xl sm:rounded-2xl group-hover:scale-[1.02] transition-transform duration-200" 
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
                            className="w-full h-full object-cover object-center rounded-xl sm:rounded-2xl" 
                            referrerPolicy="no-referrer" 
                            title={resolvedAd.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/Pasopkan ads.png';
                            }}
                          />
                        )}
                      </div>
                    );
                  }
                  return null;
                })() || (
                  <div className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF7537] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs select-none">
                    {lang === 'lo' ? 'ພື້ນທີ່ ໂຄສະນາ 800 x 160 px' : 'Ad Banner Space 800 x 160 px'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ETicketModal;
