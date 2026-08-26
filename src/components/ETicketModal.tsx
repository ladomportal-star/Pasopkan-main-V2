import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LaoEvent, TicketTier } from '../data/events';

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

  const handleBackAction = () => {
    onClose();
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Main Phone / Container Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[370px] sm:max-w-[400px] my-auto rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#FF5500] via-[#F24E00] to-[#E04500] text-white p-4 sm:p-5 shadow-2xl flex flex-col max-h-[96vh] overflow-y-auto select-none border border-orange-400/30"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between mb-4 px-1 pt-1">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/15 hover:bg-black/25 active:scale-95 transition-all text-white cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {lang === 'lo' ? 'ປີ້ E-Ticket ຂອງທ່ານ' : 'Your E-Ticket'}
            </h2>

            <div className="w-9 h-9" /> {/* Spacer for centering the title */}
          </div>

          {/* Multi-Ticket Navigation Banner if quantity > 1 */}
          {totalQuantity > 1 && (
            <div className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-1.5 mb-3 text-xs font-bold text-white">
              <button
                type="button"
                disabled={currentTicketIndex === 0}
                onClick={() => setCurrentTicketIndex((prev) => prev - 1)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="tracking-wider uppercase text-[11px] font-extrabold">
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
          <div className="relative bg-white rounded-[26px] text-gray-900 shadow-xl overflow-hidden pt-6 pb-5 px-5 sm:px-6">
            {/* Event Title */}
            <h1 className="text-xl sm:text-[22px] font-black text-gray-950 leading-tight mb-5 tracking-tight">
              {ticket.event.title}
            </h1>

            {/* 2-Column Info Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-4">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {lang === 'lo' ? 'ວັນທີ' : 'Date'}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 leading-snug">
                  {formatEventDate()}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {lang === 'lo' ? 'ເວລາ' : 'Time'}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 leading-snug">
                  {formatEventTime()}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {lang === 'lo' ? 'ປະເພດການເຂົ້າ' : 'Check In Type'}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 leading-snug truncate">
                  {ticket.tier.name || 'VIP A'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {lang === 'lo' ? 'ລະຫັດອໍເດີ' : 'Order ID'}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 font-mono tracking-tight leading-snug">
                  {formattedOrderId}
                </p>
              </div>
            </div>

            {/* Place / Venue */}
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                {lang === 'lo' ? 'ສະຖານທີ່' : 'Place'}
              </p>
              <p className="text-xs sm:text-[13px] font-semibold text-gray-800 mt-0.5 leading-relaxed">
                {ticket.event.venue ? `${ticket.event.venue}, ` : ''}{ticket.event.location || 'Vientiane Capital, Laos'}
              </p>
            </div>

            {/* Perforated Divider with Circular Concave Cutouts */}
            <div className="relative my-4 -mx-5 sm:-mx-6 py-1 flex items-center">
              {/* Left Cutout */}
              <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F24E00] z-10" />
              
              {/* Dashed Perforation Line */}
              <div className="w-full border-t-2 border-dashed border-gray-200 mx-5" />

              {/* Right Cutout */}
              <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F24E00] z-10" />
            </div>

            {/* Direct QR Code Section */}
            <div className="pt-2 pb-1 flex flex-col items-center justify-center">
              <div className="p-3.5 bg-white rounded-2xl border border-gray-150 shadow-md">
                <QRCodeSVG
                  value={currentTicketId}
                  size={144}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>

          {/* Bottom Primary Action Button: "Back to Home" */}
          <div className="mt-3">
            <button
              onClick={handleBackAction}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-orange-50 active:scale-[0.98] text-gray-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-black/20 cursor-pointer flex items-center justify-center"
            >
              {lang === 'lo' ? 'ກັບຄືນໜ້າຫຼັກ' : 'Back to Home'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ETicketModal;
