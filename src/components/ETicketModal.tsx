import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Share2, QrCode, Barcode as BarcodeIcon, Download, Check } from 'lucide-react';
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

// Generate deterministic SVG Barcode bars from string
function BarcodeSVG({ code }: { code: string }) {
  // Deterministic bar widths pattern based on code chars
  const bars: { width: number; space: number }[] = [];
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    seed = (seed * 31 + code.charCodeAt(i)) % 100000;
  }

  // Generate 48 bars with authentic varying widths
  for (let i = 0; i < 46; i++) {
    const val = (seed * (i + 7) * 13) % 100;
    const width = val < 30 ? 1.5 : val < 65 ? 2.5 : val < 85 ? 3.5 : 4.5;
    const space = (val % 3 === 0) ? 2.5 : 1.8;
    bars.push({ width, space });
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-1">
      <svg
        className="w-full h-16 sm:h-20"
        viewBox="0 0 280 64"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        {(() => {
          let currentX = 10;
          return bars.map((bar, idx) => {
            const x = currentX;
            currentX += bar.width + bar.space;
            if (currentX > 270) return null;
            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={bar.width}
                height={64}
                fill="#111827"
                rx={0.5}
              />
            );
          });
        })()}
      </svg>
      <div className="mt-1 font-mono text-[11px] sm:text-xs tracking-[0.25em] text-gray-500 font-bold uppercase">
        {code}
      </div>
    </div>
  );
}

export const ETicketModal: React.FC<ETicketModalProps> = ({
  ticket,
  onClose,
  user,
  lang = 'en',
  onNavigateHome,
}) => {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'barcode' | 'qr'>('barcode');
  const [copied, setCopied] = useState(false);

  if (!ticket) return null;

  const totalQuantity = ticket.quantity || 1;
  const currentTicketId = totalQuantity > 1 ? `${ticket.id}-${currentTicketIndex + 1}` : ticket.id;

  // Format Order ID for display (e.g. EBP139920AC)
  const formattedOrderId = (ticket.id.startsWith('tkt-') || ticket.id.startsWith('tk_'))
    ? ticket.id.replace(/^(tkt-|tk_)/, 'EBP').toUpperCase().slice(0, 11)
    : ticket.id.length > 11 
      ? `EBP${ticket.id.slice(-8).toUpperCase()}`
      : ticket.id.toUpperCase();

  // Attendee tracking serial code (e.g. EVT12881824012329)
  const attendeeSerial = `EVT${ticket.id.replace(/\D/g, '').padEnd(12, '1288182401').slice(0, 14)}`;

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
    return ticket.selectedTime || ticket.event.time || '12:30 PM';
  };

  // Attendee Name
  const attendeeName = user?.displayName || user?.email?.split('@')[0] || (lang === 'lo' ? 'ທ່ານ ຜູ້ຊື້ປີ້' : 'Kitani Sarasvati');
  const attendeePhoto = user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const handleShareOrCopy = () => {
    if (navigator.share) {
      navigator.share({
        title: ticket.event.title,
        text: `E-Ticket for ${ticket.event.title} - Order ID: ${formattedOrderId}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`E-Ticket: ${ticket.event.title} | Order ID: ${formattedOrderId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          className="relative w-full max-w-[370px] sm:max-w-[400px] my-auto rounded-[32px] sm:rounded-[36px] bg-[#00C365] text-white p-4 sm:p-5 shadow-2xl flex flex-col max-h-[96vh] overflow-y-auto select-none border border-emerald-400/30"
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

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleShareOrCopy}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-black/15 hover:bg-black/25 active:scale-95 transition-all text-white cursor-pointer"
                title={lang === 'lo' ? 'ແບ່ງປັນ' : 'Share'}
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 stroke-[2.2]" />}
              </button>
            </div>
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
              <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#00C365] z-10" />
              
              {/* Dashed Perforation Line */}
              <div className="w-full border-t-2 border-dashed border-gray-200 mx-5" />

              {/* Right Cutout */}
              <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#00C365] z-10" />
            </div>

            {/* Barcode / QR Code Switcher & View */}
            <div className="pt-2 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setViewMode('barcode')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'barcode'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <BarcodeIcon className="w-3 h-3" />
                  <span>Barcode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('qr')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'qr'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>QR Code</span>
                </button>
              </div>

              {viewMode === 'barcode' ? (
                <BarcodeSVG code={formattedOrderId} />
              ) : (
                <div className="py-2 flex flex-col items-center">
                  <div className="p-2 bg-white rounded-xl border border-gray-150 shadow-sm">
                    <QRCodeSVG
                      value={currentTicketId}
                      size={130}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-2 font-mono text-[11px] tracking-widest text-gray-500 font-bold uppercase">
                    {currentTicketId.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Attendee Info Card */}
          <div className="mt-3 bg-[#18181b] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between border border-white/10 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={attendeePhoto}
                alt={attendeeName}
                className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/15"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate leading-tight">
                  {attendeeName}
                </h4>
                <p className="text-[11px] text-gray-400 font-mono font-medium truncate mt-0.5 tracking-tight">
                  {attendeeSerial}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
          </div>

          {/* Bottom Primary Action Button: "Back to Home" */}
          <div className="mt-3">
            <button
              onClick={handleBackAction}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#00E676] hover:bg-[#00D06C] active:scale-[0.98] text-gray-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-black/15 cursor-pointer flex items-center justify-center"
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
