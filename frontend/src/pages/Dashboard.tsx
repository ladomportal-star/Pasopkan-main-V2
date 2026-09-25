import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Calendar, MapPin, QrCode, User, Settings, LogOut, X, CheckCircle2, XCircle, Loader2, Users, DollarSign, PieChart, Plus, RefreshCcw, ChevronLeft, ChevronRight, Clock, Star, Share2, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LaoEvent, TicketTier } from '../data/events';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { fromBackendEvent } from '../lib/eventPayload';
import SEO from '../components/SEO';
import ETicketModal from '../components/ETicketModal';
import { useCheckins } from '../lib/checkinsStore';
import { safeStorage } from '../lib/storage';

const translations = {
    en: {
      dashboard: 'Ticket Dashboard',
      myTickets: 'My Tickets',
      upcoming: 'Upcoming',
      past: 'Past',
      upcomingEvents: 'Upcoming',
      pastEvents: 'Past',
      noTickets: 'No tickets found',
      noTicketsDesc: "You don't have any {tab} activities.",
      browseEvents: 'Explore Activities',
      ticketDetails: 'Ticket Details',
      orderId: 'Order ID',
      bookingDate: 'Ticket Date',
      quantity: 'Quantity',
      totalPaid: 'Total Paid',
      downloadPdf: 'Download PDF',
      close: 'Close',
      scanTickets: 'Scan Tickets',
      scanQrCode: 'Scan QR Code',
      scanDesc: 'Position the QR code within the frame to scan.',
      validTicket: 'Valid Ticket!',
      ticketId: 'Ticket ID',
      invalidTicket: 'Invalid Ticket',
      scanAnother: 'Scan Another Ticket',
      myEvents: 'My Events',
      registered: 'Registered',
      scanned: 'Scanned',
      recentRegistrations: 'Recent Registrations',
      name: 'Name',
      email: 'Email',
      ticketType: 'Ticket Type',
      status: 'Status',
      viewAll: 'View All',
      loading: 'Loading your dashboard...',
      ticket: 'Ticket',
      viewTicket: 'View Ticket',
      eventDetails: 'Activity Details',
      manageTickets: 'Manage your tickets.',
      settings: 'Settings',
      signOut: 'Sign Out',
      organizerTools: 'Organizer Tools',
      yourUpcomingTickets: 'Your Upcoming Activities',
      scanToEnter: 'Scan to enter',
      alreadyScanned: 'Ticket Already Scanned',
      attendeeMode: 'Customer',
      organizerMode: 'Manager',
      createEvent: 'Post Activity',
      netRevenue: 'Net Revenue',
      ticketsSold: 'Sales',
      activeEvents: 'Active Items',
      manageEvent: 'Manage Item',
      refund: 'Request Refund',
      refundConfirmTitle: 'Request Refund?',
      refundConfirmDesc: 'Are you sure you want to refund your tickets for {event}? Refunds will be processed 4-5 business days after the event ends.',
      confirmRefund: 'Confirm Refund',
      cancel: 'Cancel',
      refundSuccess: 'Refund request submitted successfully!',
      refundInProgress: 'Refund in Progress',
      refundStepSubmitted: 'Request Sent',
      refundStepProcessing: 'Bank Review',
      refundStepCompleted: 'Funds Credited',
      refundStepCounter: 'Step 2 of 3',
      refundEstimatedArrival: 'Refund will be deposited 4–5 business days after the event ends.',
      refundDisabledTooltip: 'Refund unavailable (event starts in less than 48 hours)',
      refundNotAllowed: 'The organizer does not allow refunds for this event',
      refundSuccessBadge: 'Refunded Successfully',
      ticketRefundSuccessStatus: 'This ticket was refunded successfully',
      saveTicket: 'SAVE TICKET',
      ticketCount: 'Ticket {current} of {total}',
      activity: 'Activity',
      venue: 'Venue',
      reference: 'Reference',
      bookmarks: 'Saved Activities',
      noBookmarks: 'No saved activities',
      noBookmarksDesc: 'You have not saved any activities yet.',
      removeBookmark: 'Remove Saved',
    },
    lo: {
      dashboard: 'ແຜງຄວບຄຸມປີ້',
      myTickets: 'ປີ້ຂອງຂ້ອຍ',
      upcoming: 'ກຳລັງຈະມາເຖິງ',
      past: 'ຜ່ານມາແລ້ວ',
      upcomingEvents: 'ກຳລັງຈະມາເຖິງ',
      pastEvents: 'ຜ່ານມາແລ້ວ',
      noTickets: 'ບໍ່ພົບປີ້',
      noTicketsDesc: 'ທ່ານບໍ່ມີກິດຈະກຳ {tab}.',
      browseEvents: 'ຄົ້ນຫາກິດຈະກຳ',
      ticketDetails: 'ລາຍລະອຽດປີ້',
      orderId: 'ລະຫັດຄຳສັ່ງຊື້',
      bookingDate: 'ວັນທີຊື້ປີ້',
      quantity: 'ຈຳນວນ',
      totalPaid: 'ຈ່າຍທັງໝົດ',
      downloadPdf: 'ດາວໂຫຼດ PDF',
      close: 'ປິດ',
      scanTickets: 'ສະແກນປີ້',
      scanQrCode: 'ສະແກນ QR Code',
      scanDesc: 'ວາງ QR code ໃຫ້ຢູ່ໃນກອບເພື່ອສະແກນ.',
      validTicket: 'ປີ້ຖືກຕ້ອງ!',
      ticketId: 'ລະຫັດປີ້',
      invalidTicket: 'ປີ້ບໍ່ຖືກຕ້ອງ',
      scanAnother: 'ສະແກນປີ້ອື່ນ',
      myEvents: 'ກິດຈະກຳຂອງຂ້ອຍ',
      registered: 'ລົງທະບຽນແລ້ວ',
      scanned: 'ສະແກນແລ້ວ',
      recentRegistrations: 'ການລົງທະບຽນຫຼ້າສຸດ',
      name: 'ຊື່',
      email: 'ອີເມວ',
      ticketType: 'ປະເພດປີ້',
      status: 'ສະຖານະ',
      viewAll: 'ເບິ່ງທັງໝົດ',
      loading: 'ກຳລັງໂຫຼດຂໍ້ມູນ...',
      ticket: 'ປີ້',
      viewTicket: 'ເບິ່ງປີ້',
      eventDetails: 'ລາຍລະອຽດກິດຈະກຳ',
      manageTickets: 'ຈັດການປີ້ຂອງທ່ານ.',
      settings: 'ຕັ້ງຄ່າ',
      signOut: 'ອອກຈາກລະບົບ',
      organizerTools: 'ເຄື່ອງມືຜູ້ຈັດງານ',
      yourUpcomingTickets: 'ກິດຈະກຳກຳລັງຈະມາເຖິງຂອງທ່ານ',
      scanToEnter: 'ສະແກນເພື່ອເຂົ້າງານ',
      alreadyScanned: 'ປີ້ຖືກສະແກນແລ້ວ',
      attendeeMode: 'ຜູ້ເຂົ້າຮ່ວມ',
      organizerMode: 'ຜູ້ຈັດງານ',
      createEvent: 'ສ້າງກິດຈະກຳ',
      netRevenue: 'ລາຍຮັບສຸດທິ',
      ticketsSold: 'ປີ້ທີ່ຂາຍແລ້ວ',
      activeEvents: 'ກິດຈະກຳທີ່ກຳລັງດຳເນີນ',
      manageEvent: 'ຈັດການກິດຈະກຳ',
      refund: 'ຄືນເງິນປີ້',
      refundConfirmTitle: 'ຕ້ອງການຄືນເງິນປີ້?',
      refundConfirmDesc: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຄືນເງິນປີ້ສຳລັບ {event}? ການຄືນເງິນຈະຖືກປະມວນຜົນພາຍໃນ 4-5 ມື້ລັດຖະການ ຫຼັງຈາກກິດຈະກຳສິ້ນສຸດ.',
      confirmRefund: 'ຢືນຢັນການຄືນເງິນ',
      cancel: 'ຍົກເລີກ',
      refundSuccess: 'ສົ່ງຄຳຮ້ອງຂໍຄືນເງິນສຳເລັດແລ້ວ!',
      refundInProgress: 'ກຳລັງດຳເນີນການຄືນເງິນ',
      refundStepSubmitted: 'ສົ່ງຄຳຮ້ອງແລ້ວ',
      refundStepProcessing: 'ກວດສອບທະນາຄານ',
      refundStepCompleted: 'ໂອນເງິນສຳເລັດ',
      refundStepCounter: 'ຂັ້ນຕອນ 2 / 3',
      refundEstimatedArrival: 'ເງິນຈະໂອນຄືນພາຍໃນ 4-5 ມື້ລັດຖະການຫຼັງກິດຈະກຳສິ້ນສຸດ.',
      refundDisabledTooltip: 'ບໍ່ສາມາດຄືນເງິນໄດ້ (ກິດຈະກຳຈະເລີ່ມພາຍໃນ 48 ຊົ່ວໂມງ)',
      refundNotAllowed: 'ຜູ້ຈັດງານບໍ່ອະນຸຍາດໃຫ້ຄືນເງິນສຳລັບກິດຈະກຳນີ້',
      refundSuccessBadge: 'ຄືນເງິນສຳເລັດແລ້ວ',
      ticketRefundSuccessStatus: 'ປີ້ໃບນີ້ໄດ້ຮັບການຄືນເງິນສຳເລັດແລ້ວ',
      saveTicket: 'ບັນທຶກປີ້',
      ticketCount: 'ປີ້ທີ {current} ຈາກທັງໝົດ {total}',
      activity: 'ກິດຈະກຳ',
      venue: 'ສະຖານທີ່',
      reference: 'ລະຫັດອ້າງອີງ',
      bookmarks: 'ບັນທຶກໄວ້',
      noBookmarks: 'ບໍ່ມີກິດຈະກຳທີ່ບັນທຶກໄວ້',
      noBookmarksDesc: 'ທ່ານຍັງບໍ່ມີກິດຈະກຳທີ່ບັນທຶກໄວ້ເທື່ອ.',
      removeBookmark: 'ລຶບທີ່ບັນທຶກໄວ້',
    }
};

interface PurchasedTicket {
  id: string;
  event: LaoEvent;
  tier: TicketTier;
  quantity: number;
  bookingDate: string;
  status: 'upcoming' | 'past' | 'pending_refund' | 'refunded';
  scanned?: boolean;
  selectedDate?: string;
  selectedTime?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const t = translations[lang as keyof typeof translations];
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showQrTicket, setShowQrTicket] = useState<PurchasedTicket | null>(null);
  const [refundTicket, setRefundTicket] = useState<PurchasedTicket | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const { allCheckins } = useCheckins();



  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      const res = await api.listOrders();
      const orders = (res.data?.tickets ?? []) as any[];

      // Orders only carry a denormalized eventId/eventTitle snapshot; fetch
      // each distinct event once for its image/venue/etc.
      const uniqueEventIds = Array.from(new Set(orders.map((o) => String(o.eventId))));
      const eventResults = await Promise.all(uniqueEventIds.map((id) => api.getEvent(id)));
      const eventById = new Map<string, LaoEvent>();
      uniqueEventIds.forEach((id, i) => {
        const ev = eventResults[i].data?.event;
        if (ev) eventById.set(id, fromBackendEvent(ev));
      });

      const today = new Date().toISOString().split('T')[0];

      const mapped: PurchasedTicket[] = orders
        // A "pending" order is an unpaid reservation, not a ticket yet.
        .filter((o) => o.status !== 'pending')
        .map((o) => {
          const event: LaoEvent = eventById.get(String(o.eventId)) ?? ({
            id: String(o.eventId),
            title: o.eventTitle,
            date: o.selectedDate || '',
            time: o.selectedTime || '',
            location: '',
            venue: '',
            image: '',
            category: 'Other',
            description: '',
            ticketTiers: [],
          } as unknown as LaoEvent);
          const items: any[] = o.items ?? [];
          const firstItem = items[0];
          const tier: TicketTier = {
            id: firstItem?.tierId ?? 'tier',
            name: firstItem?.tierName ?? 'Ticket',
            price: firstItem?.unitPriceKip ?? 0,
            available: 0,
          };
          const eventDate = o.selectedDate || event.date || '';
          const status: PurchasedTicket['status'] =
            o.status === 'refunded' || o.status === 'cancelled'
              ? 'refunded'
              : eventDate && eventDate < today
                ? 'past'
                : 'upcoming';

          return {
            id: o.id,
            event,
            tier,
            quantity: items.length || 1,
            bookingDate: o.createdAt,
            status,
            scanned: items.some((it) => it.status === 'checked_in'),
            selectedDate: o.selectedDate,
            selectedTime: o.selectedTime,
          };
        });

      if (!cancelled) {
        setTickets(mapped);
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to format event date cleanly without UTC timezone shift
  const formatTicketEventDate = (dateStr?: string, fallback = '') => {
    if (!dateStr) return fallback;
    try {
      const clean = dateStr.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [year, month, day] = clean.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      return clean;
    } catch {
      return dateStr || fallback;
    }
  };

  // Helper to format event start time cleanly (extracting start time from slots, ranges, or event.time)
  const formatTicketStartTime = (ticket: PurchasedTicket): string => {
    let raw = ticket.selectedTime || (ticket as any).time || (ticket as any).selected_time || ticket.event?.time || '';
    if (!raw) return '';

    // If it contains a range like "18:00 - 23:00" or "09:00-12:00", take the start time
    if (typeof raw === 'string' && raw.includes('-')) {
      raw = raw.split('-')[0].trim();
    }

    // Extract standard HH:MM time if embedded in text like "Check-in 14:00" or "Starts at 19:30"
    if (typeof raw === 'string') {
      const match = raw.match(/\b\d{1,2}:\d{2}\b/);
      if (match) {
        return match[0];
      }
    }

    // If "18:00:00", trim to "18:00"
    if (typeof raw === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(raw.trim())) {
      return raw.trim().substring(0, 5);
    }

    return String(raw).trim();
  };

  /**
   * Determine if a ticket has been refunded.
   */
  const isTicketRefunded = (ticket: PurchasedTicket): boolean => {
    if (ticket.status === 'refunded' || ticket.status === 'pending_refund') {
      return true;
    }
    if (typeof window !== 'undefined') {
      try {
        const refundedRaw = localStorage.getItem('pasopkan_refunded_tickets');
        if (refundedRaw) {
          const list = JSON.parse(refundedRaw);
          if (Array.isArray(list) && list.includes(ticket.id)) {
            return true;
          }
        }
      } catch (e) {}
    }
    return false;
  };

  // Evaluates the EVENT's start/end date, NOT the purchase date. A refunded
  // ticket always counts as past regardless of the event date.
  const isTicketPast = (ticket: PurchasedTicket): boolean => {
    // 0. Tickets with successful refund are strictly placed in the Past tab
    if (isTicketRefunded(ticket)) {
      return true;
    }

    // 1. Explicit historical past mock tickets
    if (ticket.id === 'tk_past_1' || ticket.id === 'tk_past_2') {
      return true;
    }

    // 2. Identify the Event's Date (event start or selected slot or event end date)
    const eventDateStr = ticket.selectedDate || ticket.event?.endDate || ticket.event?.date;
    if (!eventDateStr) {
      return ticket.status === 'past';
    }

    // Get current local date in YYYY-MM-DD
    const now = new Date();
    const curY = now.getFullYear();
    const curM = String(now.getMonth() + 1).padStart(2, '0');
    const curD = String(now.getDate()).padStart(2, '0');
    const todayLocal = `${curY}-${curM}-${curD}`;

    const cleanDate = eventDateStr.trim();

    // Standard ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      // Event concluded on a previous calendar day
      if (cleanDate < todayLocal) {
        return true;
      }
      // Event is happening today or in the future -> UPCOMING!
      return false;
    }

    // Fallback parser for other date formats
    try {
      const parsed = new Date(cleanDate);
      if (!isNaN(parsed.getTime())) {
        const pY = parsed.getFullYear();
        const pM = String(parsed.getMonth() + 1).padStart(2, '0');
        const pD = String(parsed.getDate()).padStart(2, '0');
        const parsedLocal = `${pY}-${pM}-${pD}`;
        return parsedLocal < todayLocal;
      }
    } catch (e) {
      // ignore
    }

    return ticket.status === 'past';
  };

  const getEffectiveStatus = (ticket: PurchasedTicket): 'upcoming' | 'past' => {
    return isTicketPast(ticket) ? 'past' : 'upcoming';
  };

  const filteredTickets = tickets.filter(t => getEffectiveStatus(t) === activeTab);

  const isRefundEligible = (ticket: PurchasedTicket): boolean => {
    // If the event organizer explicitly disabled refunds
    if (ticket.event && ticket.event.allowRefunds === false) {
      return false;
    }

    const eventDateStr = ticket.selectedDate || ticket.event?.date;
    const eventTimeStr = formatTicketStartTime(ticket) || '00:00';
    
    if (!eventDateStr) return false;
  
    const cleanDate = eventDateStr.trim();
    
    let eventDateTime: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      eventDateTime = new Date(`${cleanDate}T${eventTimeStr}:00`);
    } else {
      eventDateTime = new Date(`${cleanDate} ${eventTimeStr}`);
    }
  
    if (isNaN(eventDateTime.getTime())) {
       return false; // If we can't parse the date, default to no refund to be safe
    }
  
    const now = new Date();
    const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
    // Eligible if it's more than 48 hours before the event starts
    return hoursUntilEvent >= 48;
  };

  const handleRefundTicket = (ticket: PurchasedTicket) => {
    if (ticket.event && ticket.event.allowRefunds === false) {
      alert(lang === 'lo' ? 'ຜູ້ຈັດງານບໍ່ອະນຸຍາດໃຫ້ຄືນເງິນສຳລັບກິດຈະກຳນີ້' : 'The organizer does not allow refunds for this event.');
      return;
    }
    if (!isRefundEligible(ticket)) {
      alert(lang === 'lo' ? 'ບໍ່ສາມາດຄືນເງິນໄດ້ເນື່ອງຈາກກິດຈະກຳຈະເລີ່ມພາຍໃນ 48 ຊົ່ວໂມງ' : 'Refund is not available because the event starts in less than 48 hours.');
      return;
    }
    setRefundTicket(ticket);
  };

  const processRefund = async () => {
    if (!refundTicket) return;
    setIsRefunding(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update ticket status to 'refunded'
    const updatedTickets = tickets.map(t => 
      t.id === refundTicket.id ? { ...t, status: 'refunded' as const } : t
    );
    
    setTickets(updatedTickets);
    
    // Save updated tickets to safeStorage
    try {
      safeStorage.setItem('pasopkan_user_tickets', JSON.stringify(updatedTickets));
      const existingRefundedRaw = safeStorage.getItem('pasopkan_refunded_tickets') || localStorage.getItem('pasopkan_refunded_tickets');
      const refundedList: string[] = existingRefundedRaw ? JSON.parse(existingRefundedRaw) : [];
      if (!refundedList.includes(refundTicket.id)) {
        refundedList.push(refundTicket.id);
      }
      safeStorage.setItem('pasopkan_refunded_tickets', JSON.stringify(refundedList));

      // Also register in admin refunds for immediate visibility
      const existingRefundsRaw = safeStorage.getItem('pasopkan_admin_refunds') || localStorage.getItem('pasopkan_admin_refunds');
      const adminRefunds = existingRefundsRaw ? JSON.parse(existingRefundsRaw) : [];
      if (!adminRefunds.some((r: any) => r.ticketId === refundTicket.id)) {
        const price = Number(refundTicket.tier?.price) || 0;
        const qty = Number(refundTicket.quantity) || 1;
        adminRefunds.unshift({
          id: `REF-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
          ticketId: refundTicket.id,
          orderId: `ORD-${refundTicket.id.slice(-6).toUpperCase()}`,
          eventId: refundTicket.event?.id || 1,
          eventTitle: refundTicket.event?.title || 'Event Ticket',
          eventDate: refundTicket.event?.date || 'Upcoming',
          eventLocation: refundTicket.event?.location || 'Vientiane',
          customerName: user?.displayName || user?.name || 'Registered Customer',
          customerEmail: user?.email || 'customer@pasopkan.com',
          tierName: refundTicket.tier?.name || 'Standard',
          quantity: qty,
          amount: price * qty,
          requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          reason: 'Customer initiated refund from User Dashboard.',
          status: 'approved',
          processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          processedBy: 'User Self-Service'
        });
        safeStorage.setItem('pasopkan_admin_refunds', JSON.stringify(adminRefunds));
      }
      window.dispatchEvent(new Event('pasopkan_storage_update'));
    } catch (e) {
      console.error('Failed to save refund status to local storage:', e);
    }
    
    alert(t.refundSuccess);
    setIsRefunding(false);
    setRefundTicket(null);
    // Switch to 'past' tab immediately so user sees the refunded ticket moved here
    setActiveTab('past');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen pt-2 sm:pt-3 pb-6 sm:pb-8 animate-pulse ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className={`w-full h-12 rounded-2xl shadow-sm ${theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}></div>
              <div className={`w-full h-12 rounded-2xl shadow-sm ${theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}></div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              {[1, 2].map(i => (
                <div key={i} className={`rounded-3xl h-64 shadow-sm border ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50/50 border-gray-100'
                }`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 pt-2 sm:pt-3 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 ${
      theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-adv-slate'
    }`}>
      <SEO
        title={t.dashboard}
        description="View and manage your registered activity tickets, barcodes, and QR codes on Pasopkan."
        noindex={true}
      />
      <div className="max-w-7xl mx-auto pt-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-1.5 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-adv-slate'
            }`}>{t.dashboard}</h1>
            <p className={`text-xs sm:text-sm font-medium transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>{t.manageTickets}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          
          {/* Sidebar Nav */}
          <div className="lg:col-span-1">
            <nav className={`grid grid-cols-2 lg:flex lg:flex-col gap-1 lg:gap-2 p-1.5 lg:p-0 rounded-2xl lg:rounded-none border lg:border-none transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-zinc-900/50 border-zinc-800' 
                : 'bg-gray-100/60 border-gray-200/40'
            }`}>
              {[
                { id: 'upcoming', label: t.upcomingEvents, icon: Ticket },
                { id: 'past', label: t.pastEvents, icon: Calendar }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center lg:justify-between px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-3.5 rounded-xl lg:rounded-2xl text-xs sm:text-sm font-bold transition-all w-full cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-adv-orange text-white shadow-sm lg:shadow-md lg:shadow-orange-500/10' 
                      : theme === 'dark' 
                        ? 'text-zinc-400 hover:text-white bg-transparent' 
                        : 'text-gray-500 hover:text-adv-slate bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{tab.label}</span>
                  </div>
                  <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : theme === 'dark' 
                        ? 'bg-zinc-800 text-zinc-400' 
                        : 'bg-white text-gray-500 border border-gray-100'
                  }`}>
                    {tickets.filter(t => getEffectiveStatus(t) === tab.id).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <AnimatePresence mode="wait">
              {filteredTickets.length > 0 ? (
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.99 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3 sm:space-y-4"
                >
                  {filteredTickets.map((ticket) => {
                    const isTicketPastStatus = getEffectiveStatus(ticket) === 'past';
                    return (
                    <div 
                      key={ticket.id} 
                      className={`group rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden flex flex-row w-full ${
                        theme === 'dark' 
                          ? 'bg-zinc-900 border-zinc-800/80 shadow-none hover:border-orange-500/30' 
                          : 'bg-white border-gray-200/70 shadow-xs hover:border-orange-500/20 hover:shadow-md'
                      }`}
                    >
                                            {/* Image Section */}
                      <div className="w-28 sm:w-40 md:w-48 relative shrink-0 overflow-hidden">
                        <img 
                          src={ticket.event.image} 
                          alt={ticket.event.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2.5 min-w-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                              theme === 'dark' 
                                ? 'bg-orange-950/40 text-orange-400 border-orange-900/30' 
                                : 'bg-orange-50 text-adv-orange border-orange-100/60'
                            }`}>
                              {ticket.event.category}
                            </span>
                            {isTicketRefunded(ticket) && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                                <span>{t.refundSuccessBadge}</span>
                              </span>
                            )}
                            {!isTicketPastStatus && !isTicketRefunded(ticket) && (ticket.scanned || allCheckins.some(c => (c.ticketId || c.id || '').toLowerCase().includes(ticket.id.toLowerCase()))) && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                                <span>{lang === 'lo' ? 'ສະແກນແລ້ວ' : 'Scanned'}</span>
                              </span>
                            )}
                          </div>

                          <h3 className={`text-sm sm:text-base font-bold line-clamp-2 group-hover:text-adv-orange transition-colors mb-2 ${
                            theme === 'dark' ? 'text-zinc-100' : 'text-adv-slate'
                          }`}>
                            {ticket.event.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-semibold mb-1">
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Calendar className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                              <span>
                                {formatTicketEventDate(ticket.selectedDate || ticket.event?.date, ticket.event?.date || '')}
                              </span>
                            </div>
                            {formatTicketStartTime(ticket) && (
                              <div className="flex items-center gap-1 text-adv-orange font-mono pl-3 border-l border-gray-200 dark:border-zinc-750">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>{formatTicketStartTime(ticket)}</span>
                              </div>
                            )}
                          </div>

                          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-adv-orange/70 shrink-0" />
                              <span className="truncate max-w-[120px] sm:max-w-[200px]">{ticket.event.venue}</span>
                            </div>
                            <span className="hidden sm:inline text-gray-200 dark:text-zinc-800">•</span>
                            <div className="flex items-center gap-1">
                              <Ticket className="w-3.5 h-3.5 text-gray-400/70 shrink-0" />
                              <span>{ticket.quantity}x {ticket.tier.name}</span>
                            </div>
                          </div>
                        </div>

                        {!isTicketRefunded(ticket) && (
                          <div className={`pt-2.5 mt-2 border-t ${theme === 'dark' ? 'border-zinc-800/80' : 'border-gray-100'}`}>
                            {!isTicketPastStatus ? (
                              <div className="flex items-center justify-between w-full flex-wrap gap-2">
                                <button 
                                  onClick={() => setShowQrTicket({ ...ticket, status: 'upcoming' })}
                                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                    theme === 'dark' 
                                      ? 'bg-adv-orange/15 text-adv-orange border border-adv-orange/30 hover:bg-adv-orange hover:text-white' 
                                      : 'bg-adv-orange/10 text-adv-orange border border-adv-orange/20 hover:bg-adv-orange hover:text-white hover:shadow-xs'
                                  }`}
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>{t.viewTicket}</span>
                                </button>
                                
                                {(() => {
                                  const isEligible = isRefundEligible(ticket);
                                  return (
                                    <button 
                                      onClick={() => isEligible && handleRefundTicket(ticket)}
                                      disabled={!isEligible}
                                      aria-disabled={!isEligible}
                                      title={
                                        !isEligible
                                          ? ticket.event?.allowRefunds === false
                                            ? t.refundNotAllowed
                                            : t.refundDisabledTooltip
                                          : t.refund
                                      }
                                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                                        isEligible
                                          ? theme === 'dark' 
                                            ? 'bg-zinc-800/60 text-zinc-300 border border-zinc-700/60 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 cursor-pointer' 
                                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer'
                                          : theme === 'dark'
                                            ? 'opacity-35 bg-zinc-800/40 text-zinc-500 border border-zinc-800/60 cursor-not-allowed select-none'
                                            : 'opacity-35 bg-gray-100 text-gray-400 border border-gray-200/80 cursor-not-allowed select-none'
                                      }`}
                                    >
                                      <RefreshCcw className="w-3 h-3" />
                                      <span>{t.refund}</span>
                                    </button>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full flex-wrap gap-2">
                                {(() => {
                                  const isScanned = ticket.scanned || allCheckins.some(c => (c.ticketId || c.id || '').toLowerCase().includes(ticket.id.toLowerCase()));
                                  return isScanned ? (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>{lang === 'lo' ? 'ກິດຈະກຳສຳເລັດແລ້ວ' : 'Event Completed'}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                                      <span>{lang === 'lo' ? 'ໝົດອາຍຸ' : 'Expired'}</span>
                                    </span>
                                  );
                                })()}
                                <button 
                                  onClick={() => setShowQrTicket({ ...ticket, status: 'past' })}
                                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                    theme === 'dark' 
                                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <QrCode className="w-3 h-3 text-adv-orange" />
                                  <span>{t.viewTicket}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-3xl sm:rounded-[3rem] border p-8 sm:p-20 flex flex-col items-center text-center w-full ${
                    theme === 'dark' 
                      ? 'bg-zinc-900 border-zinc-800' 
                      : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mb-4 sm:mb-8 border ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-750' : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <Ticket className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                    {t.noTickets}
                  </h3>
                  <p className="text-gray-400 font-medium mb-6 sm:mb-10 max-w-sm text-sm sm:text-base">
                    {t.noTicketsDesc.replace('{tab}', activeTab === 'upcoming' ? 'upcoming' : 'past')}
                  </p>
                  <Link 
                    to="/" 
                    className="px-6 py-3 sm:px-10 sm:py-4 bg-adv-slate text-white rounded-2xl font-bold tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-adv-slate/10"
                  >
                    {t.browseEvents}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Redesigned E-Ticket Modal */}
        <ETicketModal
          ticket={showQrTicket}
          onClose={() => setShowQrTicket(null)}
          user={user}
          lang={lang}
          onNavigateHome={() => navigate('/')}
        />

        {/* Refund Confirmation Modal */}
        <AnimatePresence>
          {refundTicket && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 16 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl p-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
                  <RefreshCcw className="w-10 h-10" />
                </div>
                
                <h2 className="text-2xl font-bold text-adv-slate text-center mb-4">{t.refundConfirmTitle}</h2>
                <p className="text-gray-500 text-center mb-8 font-medium">
                  {t.refundConfirmDesc.replace('{event}', refundTicket.event.title)}
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={processRefund}
                    disabled={isRefunding}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                  >
                    {isRefunding ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t.confirmRefund}
                  </button>
                  <button 
                    onClick={() => setRefundTicket(null)}
                    disabled={isRefunding}
                    className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition-all"
                  >
                    {t.cancel}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}