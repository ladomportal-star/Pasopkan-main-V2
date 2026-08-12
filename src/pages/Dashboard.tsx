import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Calendar, MapPin, QrCode, User, Settings, LogOut, X, CheckCircle2, Loader2, Users, DollarSign, PieChart, Plus, RefreshCcw, ChevronLeft, ChevronRight, Clock, Star, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LaoEvent, TicketTier } from '../data/events';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

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
      refundConfirmDesc: 'Are you sure you want to refund your tickets for {event}? Refunds are typically processed within 48 hours.',
      confirmRefund: 'Confirm Refund',
      cancel: 'Cancel',
      refundSuccess: 'Refund request submitted successfully!',
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
      refundConfirmDesc: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຄືນເງິນປີ້ສຳລັບ {event}? ການຄືນເງິນປົກກະຕິຈະຖືກປະມວນຜົນພາຍໃນ 48 ຊົ່ວໂມງ.',
      confirmRefund: 'ຢືນຢັນການຄືນເງິນ',
      cancel: 'ຍົກເລີກ',
      refundSuccess: 'ສົ່ງຄຳຮ້ອງຂໍຄືນເງິນສຳເລັດແລ້ວ!',
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
  status: 'upcoming' | 'past';
  scanned?: boolean;
  selectedDate?: string;
  selectedTime?: string;
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const t = translations[lang as keyof typeof translations];
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showQrTicket, setShowQrTicket] = useState<PurchasedTicket | null>(null);
  const [currentQrIndex, setCurrentQrIndex] = useState(0);
  const [refundTicket, setRefundTicket] = useState<PurchasedTicket | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (showQrTicket) {
      setCurrentQrIndex(0);
    }
  }, [showQrTicket]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      const formatTime = (d: Date) => d.toTimeString().split(' ')[0].substring(0, 5);

      const mockTickets: PurchasedTicket[] = [
        {
          id: 'tk_refund_eligible',
          event: {
            id: 'mock_elig',
            title: 'Vientiane Light Festival',
            date: formatDate(in48Hours),
            time: formatTime(in48Hours),
            location: 'Vientiane, LA',
            venue: 'Mekong Riverside',
            image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000&auto=format&fit=crop',
            category: 'Festival',
            description: 'A magical night along the Mekong river.',
            ticketTiers: []
          },
          tier: { id: 't1', name: 'Standard Floor', price: 150000, available: 0 },
          quantity: 1,
          bookingDate: new Date().toISOString(),
          status: 'upcoming'
        },
        {
          id: 'tk_refund_disabled',
          event: {
            id: 'mock_dis',
            title: 'Digital Arts Workshop',
            date: formatDate(in12Hours),
            time: formatTime(in12Hours),
            location: 'Vientiane, LA',
            venue: 'Pasopkan Creative Space',
            image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2000&auto=format&fit=crop',
            category: 'Workshop',
            description: 'Learn digital illustration from the pros.',
            ticketTiers: []
          },
          tier: { id: 't2', name: 'General Admission', price: 50000, available: 0 },
          quantity: 2,
          bookingDate: new Date().toISOString(),
          status: 'upcoming'
        },
        {
          id: 'tk_past_1',
          event: {
            id: 'music_fest_25',
            title: 'Lao Music Festival 2025',
            date: '2025-12-15',
            time: '18:00',
            location: 'Vientiane, LA',
            venue: 'National Stadium',
            image: 'https://images.unsplash.com/photo-1459749411177-042180ceea72?q=80&w=2000&auto=format&fit=crop',
            category: 'Festival',
            description: 'The biggest music event of the year.',
            ticketTiers: []
          },
          tier: { id: 'v1', name: 'VIP Front Row', price: 500000, available: 0 },
          quantity: 1,
          bookingDate: '2025-11-20T10:00:00Z',
          status: 'past',
          scanned: true
        },
        {
          id: 'tk_past_2',
          event: {
            id: 'cooking_class_past',
            title: 'Traditional Lao Cooking Class',
            date: '2026-01-10',
            time: '10:00',
            location: 'Luang Prabang, LA',
            venue: 'Bamboo Tree Garden',
            image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2000&auto=format&fit=crop',
            category: 'Workshop',
            description: 'Master the art of sticky rice and laap.',
            ticketTiers: []
          },
          tier: { id: 'ga1', name: 'General Admission', price: 120000, available: 0 },
          quantity: 3,
          bookingDate: '2026-01-05T14:30:00Z',
          status: 'past',
          scanned: true
        }
      ];

      let loadedTickets = [...mockTickets];
      
      try {
        const savedTicketsRaw = localStorage.getItem('pasopkan_user_tickets');
        if (savedTicketsRaw) {
          const savedTickets = JSON.parse(savedTicketsRaw);
          if (Array.isArray(savedTickets)) {
            // Deduplicate by ID
            const savedTicketIds = new Set(savedTickets.map(t => t.id));
            loadedTickets = [...savedTickets, ...loadedTickets.filter(t => !savedTicketIds.has(t.id))];
          }
        }
      } catch (e) {
        console.error('Failed to load tickets from local storage:', e);
      }

      if (location.state?.newTicket) {
        const { event, tier, quantity, selectedTiers, selectedDate, selectedTime } = location.state.newTicket;
        let newlyCreatedTickets: PurchasedTicket[] = [];
        if (selectedTiers && selectedTiers.length > 0) {
          newlyCreatedTickets = selectedTiers.map((st: { tier: TicketTier; quantity: number }) => ({
            id: `tk_${Math.random().toString(36).substr(2, 9)}`,
            event,
            tier: st.tier,
            quantity: st.quantity,
            bookingDate: new Date().toISOString(),
            status: 'upcoming' as const,
            selectedDate,
            selectedTime
          }));
        } else {
          newlyCreatedTickets = [{
            id: `tk_${Math.random().toString(36).substr(2, 9)}`,
            event,
            tier,
            quantity: quantity || 1,
            bookingDate: new Date().toISOString(),
            status: 'upcoming' as const,
            selectedDate,
            selectedTime
          }];
        }
        
        // Deduplicate new tickets against loaded ones just in case
        const newlyCreatedIds = new Set(newlyCreatedTickets.map(t => t.id));
        setTickets([...newlyCreatedTickets, ...loadedTickets.filter(t => !newlyCreatedIds.has(t.id))]);
      } else {
        setTickets(loadedTickets);
      }
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [location.state]);

  const filteredTickets = tickets.filter(t => t.status === activeTab);

  const handleRefundTicket = (ticket: PurchasedTicket) => {
    setRefundTicket(ticket);
  };

  const processRefund = async () => {
    if (!refundTicket) return;
    setIsRefunding(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTickets(tickets.filter(t => t.id !== refundTicket.id));
    alert(t.refundSuccess);
    setIsRefunding(false);
    setRefundTicket(null);
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
                    {tickets.filter(t => t.status === tab.id).length}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {filteredTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className={`group rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col sm:flex-row ${
                        theme === 'dark' 
                          ? 'bg-zinc-900 border-zinc-800/80 shadow-none hover:border-orange-500/30' 
                          : 'bg-white border-gray-200/70 shadow-xs hover:border-orange-500/20 hover:shadow-md'
                      }`}
                    >
                      {/* Image Section */}
                      <div className="sm:w-36 md:w-44 h-28 sm:h-auto relative shrink-0 overflow-hidden">
                        <img 
                          src={ticket.event.image} 
                          alt={ticket.event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2.5">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                              theme === 'dark' 
                                ? 'bg-orange-950/40 text-orange-400 border-orange-900/30' 
                                : 'bg-orange-50 text-adv-orange border-orange-100/60'
                            }`}>
                              {ticket.event.category}
                            </span>
                            <div className="flex items-center gap-1 text-gray-400 text-[10px] sm:text-xs font-semibold">
                              <Calendar className="w-3 h-3 text-adv-orange shrink-0" />
                              <span>
                                {ticket.selectedDate ? new Date(ticket.selectedDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ticket.event.date}
                              </span>
                            </div>
                            {ticket.selectedTime && (
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-adv-orange font-mono pl-1 border-l border-gray-200 dark:border-zinc-750">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{ticket.selectedTime}</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className={`text-base font-bold line-clamp-1 group-hover:text-adv-orange transition-colors ${
                            theme === 'dark' ? 'text-zinc-100' : 'text-adv-slate'
                          }`}>
                            {ticket.event.title}
                          </h3>

                          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-adv-orange shrink-0" />
                              <span className="truncate max-w-[180px] sm:max-w-none">{ticket.event.venue}</span>
                            </div>
                            <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">•</span>
                            <div className="flex items-center gap-1">
                              <Ticket className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{ticket.quantity}x {ticket.tier.name}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between pt-2 border-t ${theme === 'dark' ? 'border-zinc-800/80' : 'border-gray-100'}`}>
                          {ticket.status === 'upcoming' ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                              <button 
                                onClick={() => setShowQrTicket(ticket)}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                  theme === 'dark' 
                                    ? 'bg-adv-orange/15 text-adv-orange border border-adv-orange/30 hover:bg-adv-orange hover:text-white' 
                                    : 'bg-adv-orange/10 text-adv-orange border border-adv-orange/20 hover:bg-adv-orange hover:text-white hover:shadow-xs'
                                }`}
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>{t.viewTicket}</span>
                              </button>
                              
                              <button 
                                onClick={() => handleRefundTicket(ticket)}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                  theme === 'dark' 
                                    ? 'bg-zinc-800/60 text-zinc-400 border border-transparent hover:bg-red-950/20 hover:text-red-400' 
                                    : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500'
                                }`}
                              >
                                <RefreshCcw className="w-3 h-3" />
                                <span>{t.refund}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{lang === 'lo' ? 'ກິດຈະກຳສຳເລັດແລ້ວ' : 'Event Completed'}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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

        {/* QR Code Modal moved inside root div for valid JSX */}
        <AnimatePresence>
          {showQrTicket && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              onClick={() => setShowQrTicket(null)}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[310px] xs:max-w-[330px] my-auto overflow-hidden rounded-[24px] shadow-2xl flex flex-col bg-gradient-to-b from-[#ff5e00] via-[#eb580c] to-[#c2410c] text-white border border-orange-400/30 select-none max-h-[96vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Header & Cover Image Card */}
                <div className="p-3 xs:p-3.5 pb-1">
                  <div className="relative w-full h-28 xs:h-32 rounded-[16px] overflow-hidden shadow-inner border border-white/20">
                    <img 
                      src={showQrTicket.event.image} 
                      alt={showQrTicket.event.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    
                    {/* Share & Close Action Buttons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: showQrTicket.event.title, url: window.location.href }).catch(() => {});
                          } else if (navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.href);
                          }
                        }}
                        title={lang === 'lo' ? 'ແບ່ງປັນ' : 'Share'}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-md cursor-pointer border border-white/20"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={() => setShowQrTicket(null)}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-md cursor-pointer border border-white/20"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Organizer */}
                  <div className="mt-2 px-0.5">
                    <h3 className="text-base xs:text-lg font-black text-white leading-tight tracking-tight break-words line-clamp-1">
                      {showQrTicket.event.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-orange-100/80 mt-0.5 truncate">
                      {lang === 'lo' ? 'ໂດຍ' : 'By'} {showQrTicket.event.organizer || 'Pasopkan Events'}
                    </p>
                  </div>
                </div>

                {/* Perforated Divider #1 with side cutouts */}
                <div className="relative w-full py-0.5">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/80 backdrop-blur-md z-10 border-r border-orange-500/30" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/80 backdrop-blur-md z-10 border-l border-orange-500/30" />
                  <div className="border-t-2 border-dashed border-white/30 mx-5" />
                </div>

                {/* Middle Details Grid */}
                <div className="px-4 xs:px-5 py-1.5 space-y-2">
                  {/* Location */}
                  <div>
                    <div className="text-[9px] uppercase font-extrabold tracking-wider text-orange-200/80 mb-0.5">
                      {lang === 'lo' ? 'ສະຖານທີ່' : 'Location'}
                    </div>
                    <div className="text-xs font-black text-white leading-tight truncate">
                      {showQrTicket.event.venue || showQrTicket.event.location}
                    </div>
                  </div>

                  {/* Name & Date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] uppercase font-extrabold tracking-wider text-orange-200/80 mb-0.5">
                        {lang === 'lo' ? 'ຊື່' : 'Name'}
                      </div>
                      <div className="text-xs font-black text-white truncate">
                        {user?.displayName || user?.email?.split('@')[0] || (lang === 'lo' ? 'ຜູ້ຖືບັດ' : 'Pass Holder')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-extrabold tracking-wider text-orange-200/80 mb-0.5">
                        {lang === 'lo' ? 'ວັນທີ' : 'Date'}
                      </div>
                      <div className="text-xs font-black text-white truncate">
                        {showQrTicket.selectedDate 
                          ? new Date(showQrTicket.selectedDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) 
                          : showQrTicket.event.date}
                      </div>
                    </div>
                  </div>

                  {/* Time & Ticket Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] uppercase font-extrabold tracking-wider text-orange-200/80 mb-0.5">
                        {lang === 'lo' ? 'ເວລາ' : 'Time'}
                      </div>
                      <div className="text-xs font-black text-white truncate">
                        {showQrTicket.selectedTime || showQrTicket.event.time || '18:00 PM'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-extrabold tracking-wider text-orange-200/80 mb-0.5">
                        {lang === 'lo' ? 'ປະເພດ' : 'Type / Zone'}
                      </div>
                      <div className="text-xs font-black text-white truncate">
                        {showQrTicket.tier.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perforated Divider #2 with side cutouts */}
                <div className="relative w-full py-0.5">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/80 backdrop-blur-md z-10 border-r border-orange-500/30" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/80 backdrop-blur-md z-10 border-l border-orange-500/30" />
                  <div className="border-t-2 border-dashed border-white/30 mx-5" />
                </div>

                {/* Bottom QR Code Section */}
                <div className="p-3 pt-1.5 flex flex-col items-center">
                  <div className="text-[9px] uppercase font-black tracking-[0.2em] text-orange-100/90 mb-1.5 text-center">
                    {lang === 'lo' ? 'ສະແກນ QR CODE' : 'SCAN QR CODE'}
                  </div>

                  {/* Quantity Navigator */}
                  {showQrTicket.quantity > 1 && (
                    <div className="flex items-center justify-between w-full mb-1.5 px-2">
                      <button
                        type="button"
                        disabled={currentQrIndex === 0}
                        onClick={() => setCurrentQrIndex(prev => prev - 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all bg-white/15 hover:bg-white/30 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-white" />
                      </button>
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/90">
                        {t.ticketCount.replace('{current}', (currentQrIndex + 1).toString()).replace('{total}', showQrTicket.quantity.toString())}
                      </div>
                      <button
                        type="button"
                        disabled={currentQrIndex === showQrTicket.quantity - 1}
                        onClick={() => setCurrentQrIndex(prev => prev + 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all bg-white/15 hover:bg-white/30 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}

                  {/* QR Container */}
                  <div className="bg-white p-2.5 rounded-xl shadow-xl text-black border border-white/40">
                    <QRCodeSVG 
                      value={showQrTicket.quantity > 1 ? `${showQrTicket.id}-${currentQrIndex + 1}` : showQrTicket.id} 
                      size={110} 
                      level="H" 
                      includeMargin={false} 
                    />
                  </div>

                  {/* Alphanumeric Code */}
                  <div className="mt-1.5 font-mono text-[10px] uppercase font-black text-white/90 tracking-widest">
                    {(showQrTicket.quantity > 1 ? `${showQrTicket.id}-${currentQrIndex + 1}` : showQrTicket.id).toUpperCase()}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Refund Confirmation Modal */}
        <AnimatePresence>
          {refundTicket && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
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