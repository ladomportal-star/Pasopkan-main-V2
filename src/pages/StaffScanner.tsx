import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  Ticket as TicketIcon, 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  RotateCcw, 
  ShieldCheck, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Zap,
  Sparkles,
  Download,
  Check,
  Building2,
  Mail,
  Phone,
  Globe,
  Plus,
  Users,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { events, LaoEvent } from '../data/events';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { CheckinRecord, useCheckins } from '../lib/checkinsStore';

const LazyScanner = React.lazy(() => 
  import('@yudiel/react-qr-scanner')
    .then(module => ({ default: module.Scanner }))
    .catch(err => {
      console.error('Failed to dynamically import react-qr-scanner:', err);
      return {
        default: () => (
          <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-6 text-center z-20">
             <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 border border-red-500/20">
                <AlertCircle className="w-8 h-8" />
             </div>
             <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Scanner Camera Unavailable</h4>
             <p className="text-zinc-400 mb-6 font-bold text-xs leading-relaxed max-w-xs">Camera scanner requires HTTPS or camera permissions in browser.</p>
          </div>
        )
      };
    })
);

const translations = {
  en: {
    staffPortal: 'Staff Entry & Ticket Verification',
    scanTitle: 'Scan Ticket QR Code',
    scanDesc: 'Point staff camera at attendee ticket QR code or enter ticket code manually below.',
    manualTitle: 'Manual Ticket Verification',
    enterCodePlaceholder: 'Enter ticket code (e.g., tk_981245 or TK-123)',
    verifyBtn: 'Verify Code',
    simulatedScans: 'Quick Test Scans',
    validTicket: 'VALID TICKET - UNCHECKED',
    alreadyScanned: 'ALREADY CHECKED IN',
    invalidTicket: 'INVALID OR UNKNOWN TICKET',
    confirmCheckIn: 'CONFIRM ENTRY / CHECK-IN',
    checkInSuccess: 'Attendee Checked In Successfully!',
    alreadyCheckedInBy: 'Already checked in at {time} by {staff}',
    attendeeDetails: 'Attendee & Ticket Details',
    attendeeName: 'Attendee Name',
    contactEmail: 'Contact Email',
    ticketTier: 'Ticket Tier',
    seatZone: 'Zone / Seat',
    purchasePrice: 'Ticket Price',
    eventInfo: 'Event Info',
    recentCheckins: 'Staff Verified Attendees List',
    noCheckins: 'No check-ins recorded yet by staff.',
    totalCheckedIn: 'Total Checked In',
    capacity: 'Capacity',
    gateStaff: 'Gate Staff',
    searchAttendee: 'Search Name, Phone, Ticket ID...',
    resetScan: 'Scan Next Ticket',
    backToHome: 'Back to Home',
    openCamera: 'Open Camera to Scan',
    closeCamera: 'Turn Off Camera',
    cameraInactiveDesc: 'Click the button below to turn on the camera for QR code scanning.',
  },
  lo: {
    staffPortal: 'ລະບົບກວດສອບປີ້ ແລະ ເຊັກອິນສຳລັບພະນັກງານ',
    scanTitle: 'ສະແກນ QR Code ຂອງປີ້',
    scanDesc: 'ສ່ອງກ້ອງໃສ່ QR Code ຂອງປີ້ ຫຼື ປ້ອນລະຫັດປີ້ດ້ວຍຕົນເອງຢູ່ດ້ານລຸ່ມ.',
    manualTitle: 'ກວດສອບປີ້ດ້ວຍຕົນເອງ',
    enterCodePlaceholder: 'ປ້ອນລະຫັດປີ້ (ເຊັ່ນ: tk_981245 ຫຼື TK-123)',
    verifyBtn: 'ກວດສອບລະຫັດ',
    simulatedScans: 'ປີ້ຕົວຢ່າງສຳລັບທົດລອງ',
    validTicket: 'ປີ້ຖືກຕ້ອງ - ຍັງບໍ່ທັນເຊັກອິນ',
    alreadyScanned: 'ເຊັກອິນແລ້ວ',
    invalidTicket: 'ປີ້ບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ພົບໃນລະບົບ',
    confirmCheckIn: 'ຢືນຢັນການເຂົ້າ / ເຊັກອິນ',
    checkInSuccess: 'ເຊັກອິນຜູ້ເຂົ້າຮ່ວມສຳເລັດແລ້ວ!',
    alreadyCheckedInBy: 'ຖືກເຊັກອິນແລ້ວເມື່ອ {time} ໂດຍ {staff}',
    attendeeDetails: 'ລາຍລະອຽດຜູ້ເຂົ້າຮ່ວມ ແລະ ປີ້',
    attendeeName: 'ຊື່ຜູ້ເຂົ້າຮ່ວມ',
    contactEmail: 'ອີເມວຕິດຕໍ່',
    ticketTier: 'ປະເພດປີ້',
    seatZone: 'ເຂດ / ບ່ອນນັ່ງ',
    purchasePrice: 'ລາຄາປີ້',
    eventInfo: 'ຂໍ້ມູນກິດຈະກຳ',
    recentCheckins: 'ລາຍຊື່ຜູ້ເຂົ້າຮ່ວມທີ່ກວດສອບແລ້ວ',
    noCheckins: 'ຍັງບໍ່ມີຂໍ້ມູນການເຊັກອິນເທື່ອ.',
    totalCheckedIn: 'ເຊັກອິນແລ້ວທັງໝົດ',
    capacity: 'ຄວາມຈຸ',
    gateStaff: 'ພະນັກງານປະຕູ',
    searchAttendee: 'ຄົ້ນຫາຕາມຊື່, ເບີໂທ, ລະຫັດປີ້...',
    resetScan: 'ສະແກນປີ້ຖັດໄປ',
    backToHome: 'ກັບຄືນໜ້າຫຼັກ',
    openCamera: 'ເປີດກ້ອງເພື່ອສະແກນ',
    closeCamera: 'ປິດກ້ອງ',
    cameraInactiveDesc: 'ກົດປຸ່ມດ້ານລຸ່ມເພື່ອເປີດກ້ອງຖ່າຍຮູບສຳລັບສະແກນ QR Code.',
  }
};

export default function StaffScanner() {
  const [searchParams] = useSearchParams();
  const { lang, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const t = translations[lang];

  const eventId = searchParams.get('eventId') || '1';
  const staffLabel = searchParams.get('staffLabel') || 'Main Entrance Gate';

  const selectedEvent: LaoEvent = useMemo(() => {
    try {
      const orgEventsRaw = localStorage.getItem('organizer_events');
      if (orgEventsRaw) {
        const orgEvents = JSON.parse(orgEventsRaw);
        if (Array.isArray(orgEvents)) {
          const found = orgEvents.find((e: any) => e.id === eventId);
          if (found) return found;
        }
      }
    } catch(e) {}
    try {
      const userEventsRaw = localStorage.getItem('pasopkan_user_events');
      if (userEventsRaw) {
        const userEvents = JSON.parse(userEventsRaw);
        if (Array.isArray(userEvents)) {
          const found = userEvents.find((e: any) => e.id === eventId);
          if (found) return found;
        }
      }
    } catch (e) {}
    return events.find(e => e.id === eventId) || events[0];
  }, [eventId]);

  const totalCapacity = useMemo(() => {
    if (selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0) {
      const sumTiers = selectedEvent.ticketTiers.reduce((sum, t) => sum + (Number(t.available) || 0), 0);
      if (sumTiers > 0) return sumTiers;
    }
    if (selectedEvent.seatingZones && selectedEvent.seatingZones.length > 0) {
      const sumZones = selectedEvent.seatingZones.reduce((sum, z) => sum + (Number(z.capacity) || 0), 0);
      if (sumZones > 0) return sumZones;
    }
    if (selectedEvent.maxTickets && !isNaN(parseInt(selectedEvent.maxTickets, 10)) && parseInt(selectedEvent.maxTickets, 10) > 0) {
      return parseInt(selectedEvent.maxTickets, 10);
    }
    return 500;
  }, [selectedEvent]);

  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannerPage, setScannerPage] = useState(1);

  // Loaded checkins from shared store for selected event
  const { eventCheckins: checkins, addCheckin } = useCheckins(selectedEvent.id);

  const generateMockAttendees = () => {
    const laosNames = [
      'Marcus Aurelius', 'Sengdeuan Keo', 'Khamla Phommasone', 'Soukprasith Vong',
      'Noy Bounnhang', 'Phonepadith Chanthalangsy', 'Anousone Sysavath', 'Vilaylack Inthavong',
      'Somchai Thammavong', 'Maly Rattana', 'Davone Soukhaseum', 'Phetmany Luangrath',
      'Bounmy Panyanouvong', 'Khamphoune Xayalath', 'Soukanya Inthavong'
    ];
    
    const ticketConfigs = [
      { ticketType: 'VIP Front Stage Pass', zone: 'VIP Row 1', price: '450,000 LAK' },
      { ticketType: 'Standard Zone A Pass', zone: 'Zone A Row 5', price: '250,000 LAK' },
      { ticketType: 'Standard Zone B Pass', zone: 'Zone B Row 8', price: '200,000 LAK' },
      { ticketType: 'General Admission', zone: 'General Standing', price: '150,000 LAK' }
    ];

    const newMocks: CheckinRecord[] = laosNames.map((name, index) => {
      const cfg = ticketConfigs[index % ticketConfigs.length];
      const tkNum = 100000 + Math.floor(Math.random() * 899999);
      const minsAgo = (15 - index) * 2;
      const d = new Date(Date.now() - minsAgo * 60000);
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      
      return {
        id: `chk_mock_${Date.now()}_${index + 1}`,
        ticketId: `tk_${tkNum}`,
        eventId: selectedEvent.id,
        attendeeName: name,
        email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
        phone: `+856 20 ${Math.floor(20000000 + Math.random() * 70000000)}`,
        ticketType: cfg.ticketType,
        zone: cfg.zone,
        seat: cfg.zone.includes('VIP') ? `Seat ${index + 1}` : cfg.zone.includes('Zone') ? `Seat ${index + 5}` : 'N/A',
        price: cfg.price,
        time: timeStr,
        timestamp: d.getTime(),
        staffLabel: staffLabel
      };
    });

    newMocks.forEach(m => addCheckin(m));
    setScannerPage(1);
    showToast(lang === 'lo' ? 'ສ້າງຂໍ້ມູນຜູ້ເຂົ້າຮ່ວມຕົວຢ່າງ 15 ຄົນສຳເລັດ!' : 'Generated 15 mockup attendees successfully!', 'success');
  };

  // Currently scanned ticket result state
  const [scannedTicket, setScannedTicket] = useState<{
    ticketId: string;
    attendeeName: string;
    email: string;
    phone: string;
    ticketType: string;
    zone: string;
    seat: string;
    price: string;
    bookingDate: string;
    alreadyCheckedIn: boolean;
    checkedInRecord?: CheckinRecord;
    isValid: boolean;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const showToast = (text: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Ticket Lookup helper
  const lookupTicket = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Check if valid code format
    const isValid = cleanCode.startsWith('tk_') || cleanCode.startsWith('TK-') || cleanCode.length >= 4;

    if (!isValid) {
      setScannedTicket({
        ticketId: cleanCode,
        attendeeName: 'Unknown Attendee',
        email: 'N/A',
        phone: 'N/A',
        ticketType: 'N/A',
        zone: 'N/A',
        seat: 'N/A',
        price: '0 LAK',
        bookingDate: 'N/A',
        alreadyCheckedIn: false,
        isValid: false
      });
      showToast(t.invalidTicket, 'error');
      return;
    }

    // Check if already checked in
    const existingCheckin = checkins.find(c => c.ticketId.toLowerCase() === cleanCode.toLowerCase());

    // Generate ticket details deterministically or from user purchases
    const userTicketsStr = localStorage.getItem('pasopkan_user_tickets');
    let foundUserTicket: any = null;
    if (userTicketsStr) {
      try {
        const userTickets = JSON.parse(userTicketsStr);
        foundUserTicket = userTickets.find((ut: any) => ut.id === cleanCode || ut.ticketId === cleanCode);
      } catch (e) {}
    }

    const firstNames = ['Alex', 'Sarah', 'Sengdeuan', 'John', 'Michael', 'Emma', 'Daniel', 'Sophia', 'James', 'Khamla'];
    const lastNames = ['Keo', 'Connor', 'Souksavat', 'Smith', 'Scott', 'Davis', 'Wilson', 'Anderson', 'Phomvihane', 'Taylor'];
    
    const index = Math.abs(cleanCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % firstNames.length;
    
    let mockName = `${firstNames[index]} ${lastNames[index]}`;
    let mockEmail = `${mockName.toLowerCase().replace(' ', '.')}@example.com`;
    let mockPhone = `+856 20 ${5000 + (index * 123)} ${1000 + (index * 456)}`;
    let tierName = selectedEvent.ticketTiers?.[0]?.name || 'Standard Pass';
    let tierPrice = selectedEvent.ticketTiers?.[0]?.price;
    let priceText = tierPrice ? `${tierPrice.toLocaleString()} LAK` : '350,000 LAK';
    let bookingDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (foundUserTicket) {
      if (foundUserTicket.userName) mockName = foundUserTicket.userName;
      if (foundUserTicket.tier) {
        tierName = foundUserTicket.tier.name;
        priceText = foundUserTicket.tier.price ? `${foundUserTicket.tier.price.toLocaleString()} LAK` : priceText;
      }
      if (foundUserTicket.purchaseDate) {
        bookingDate = new Date(foundUserTicket.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }

    setScannedTicket({
      ticketId: cleanCode,
      attendeeName: mockName,
      email: mockEmail,
      phone: mockPhone,
      ticketType: tierName,
      zone: selectedEvent.hasSeating ? 'VIP Zone A' : 'Main Arena',
      seat: selectedEvent.hasSeating ? `Row ${(index % 12) + 1}, Seat ${(index % 20) + 1}` : 'Standing Area',
      price: priceText,
      bookingDate: bookingDate,
      alreadyCheckedIn: !!existingCheckin,
      checkedInRecord: existingCheckin,
      isValid: true
    });

    if (existingCheckin) {
      showToast(t.alreadyScanned, 'warning');
    } else {
      showToast(t.validTicket, 'success');
    }
  };

  const handleScan = (text: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 2000) return;
    lastScanTimeRef.current = now;
    lookupTicket(text);
  };

  const confirmCheckIn = () => {
    if (!scannedTicket || !scannedTicket.isValid || scannedTicket.alreadyCheckedIn) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

    const newRecord: CheckinRecord = {
      id: `chk_${Date.now()}`,
      ticketId: scannedTicket.ticketId,
      eventId: selectedEvent.id,
      attendeeName: scannedTicket.attendeeName,
      email: scannedTicket.email,
      phone: scannedTicket.phone,
      ticketType: scannedTicket.ticketType,
      zone: scannedTicket.zone,
      seat: scannedTicket.seat,
      price: scannedTicket.price,
      time: timeStr,
      timestamp: Date.now(),
      staffLabel: staffLabel
    };

    addCheckin(newRecord);

    setScannedTicket(prev => prev ? {
      ...prev,
      alreadyCheckedIn: true,
      checkedInRecord: newRecord
    } : null);

    showToast(t.checkInSuccess, 'success');
  };

  const filteredCheckins = checkins.filter(c => 
    c.attendeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-adv-slate'
    }`}>
      {/* Toast Notification Bar */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 backdrop-blur-md border border-white/20"
            style={{
              backgroundColor: toastMessage.type === 'success' ? '#10b981' : toastMessage.type === 'warning' ? '#f59e0b' : '#ef4444',
              color: '#ffffff'
            }}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toastMessage.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
        theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="shrink-0 transition-transform hover:scale-[1.02]">
              <img 
                src="/pasopkan_logo.png" 
                alt="Pasopkan Logo" 
                className="h-14 sm:h-18 md:h-20 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </Link>
            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
            <div className="min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-adv-orange text-white text-[10px] font-black uppercase tracking-wider inline-block">
                STAFF DASHBOARD
              </span>
            </div>
          </div>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="hover:text-adv-orange p-2 transition-colors text-sm font-bold animate-fade-in shrink-0 cursor-pointer"
          >
            {lang === 'lo' ? 'LA' : lang.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 pb-3 space-y-3.5">
        
        {/* Compact Event Info Header & Metrics Banner */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
            <img 
              src={selectedEvent.image} 
              alt={selectedEvent.title} 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black truncate">{selectedEvent.title}</h2>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-adv-orange shrink-0" /> {selectedEvent.date}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-adv-orange shrink-0" /> {selectedEvent.location}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-wrap items-center justify-between md:justify-end gap-2.5 pt-2.5 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-zinc-800">
            {/* Quick Stats Pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                <Users className="w-3.5 h-3.5" />
                <span className="font-mono">{checkins.length}</span>
                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold">{t.checkedIn}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-adv-orange/10 text-adv-orange text-xs font-bold border border-adv-orange/20">
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-mono">{totalCapacity.toLocaleString()}</span>
                <span className="text-[10px] text-adv-orange/70 font-semibold">{t.capacity}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold border border-gray-200 dark:border-zinc-700">
              <ShieldCheck className="w-3.5 h-3.5 text-adv-orange" />
              <span className="truncate max-w-[130px]">{staffLabel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Left Column: QR Scanner & Manual Input */}
          <div className="lg:col-span-5 space-y-3">
            
            {/* QR Scanner Container */}
            <div className={`p-3 sm:p-3.5 rounded-2xl border shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
            }`}>
              {isCameraActive ? (
                <div className="relative aspect-square max-w-[240px] sm:max-w-[260px] mx-auto w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  <React.Suspense fallback={
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <QrCode className="w-8 h-8 animate-pulse" />
                      <span className="text-xs font-bold">Initializing Camera...</span>
                    </div>
                  }>
                    <LazyScanner 
                      onScan={(results) => {
                        if (results && results.length > 0 && results[0].rawValue) {
                          handleScan(results[0].rawValue);
                        }
                      }}
                      onError={(error) => {
                        setScannerError(error?.message || 'Camera Scanner Error');
                      }}
                    />
                  </React.Suspense>

                  {/* Overlay Close Camera Button */}
                  <button
                    onClick={() => setIsCameraActive(false)}
                    className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 bg-zinc-900/85 hover:bg-zinc-900 text-white font-extrabold text-[11px] rounded-lg backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-1 shadow-lg active:scale-95"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                    <span>{t.closeCamera}</span>
                  </button>

                  {/* Overlay Scanning Sight Frame */}
                  <div className="absolute inset-0 border-2 border-dashed border-adv-orange/40 pointer-events-none rounded-xl m-4 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-adv-orange/80 shadow-[0_0_15px_#ff6b00] animate-pulse" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-adv-slate dark:bg-white text-white dark:text-adv-slate font-bold hover:opacity-95 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-adv-orange shrink-0" />
                  <span className="text-xs sm:text-sm font-black">{t.openCamera}</span>
                </button>
              )}
            </div>

            {/* Compact Manual Ticket Verification Card */}
            <div className={`p-3 rounded-2xl border shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-400">
                  {t.manualTitle}
                </h3>
              </div>

              <div className="flex gap-1.5 min-w-0">
                <input 
                  type="text" 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupTicket(manualCode)}
                  placeholder={t.enterCodePlaceholder}
                  className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' : 'bg-gray-50 border-gray-200 text-adv-slate'
                  }`}
                />
                <button 
                  onClick={() => lookupTicket(manualCode)}
                  className="px-3 py-1.5 bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {t.verifyBtn}
                </button>
              </div>

              {/* Compact Demo Ticket Quick Buttons */}
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mr-0.5">
                    {t.simulatedScans}:
                  </span>
                  <button 
                    onClick={() => lookupTicket('tk_981245')}
                    className="px-1.5 py-0.5 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-adv-orange font-mono font-bold text-[9px] border border-adv-orange/20 transition-all cursor-pointer"
                  >
                    VIP
                  </button>
                  <button 
                    onClick={() => lookupTicket('tk_301984')}
                    className="px-1.5 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-mono font-bold text-[9px] border border-blue-500/20 transition-all cursor-pointer"
                  >
                    Zone A
                  </button>
                  <button 
                    onClick={() => lookupTicket('tk_452819')}
                    className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-mono font-bold text-[9px] border border-emerald-500/20 transition-all cursor-pointer"
                  >
                    General
                  </button>
                  <button 
                    onClick={() => lookupTicket(`tk_demo_${Math.floor(Math.random() * 89999 + 10000)}`)}
                    className="px-1.5 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 font-mono font-bold text-[9px] border border-purple-500/20 transition-all cursor-pointer"
                  >
                    + Demo Pass
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Ticket & Attendee Verification Card + Checked-in List */}
          <div className="lg:col-span-7 space-y-3.5">
            
            {/* Scanned Ticket & Attendee Detail Result Card */}
            {scannedTicket ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 sm:p-5 rounded-2xl border shadow-md transition-all relative overflow-hidden ${
                  !scannedTicket.isValid
                    ? 'bg-red-500/10 border-red-500/30'
                    : scannedTicket.alreadyCheckedIn
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200/50 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      !scannedTicket.isValid
                        ? 'bg-red-500 text-white'
                        : scannedTicket.alreadyCheckedIn
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    }`}>
                      {!scannedTicket.isValid ? (
                        <XCircle className="w-5 h-5" />
                      ) : scannedTicket.alreadyCheckedIn ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 animate-bounce" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        {!scannedTicket.isValid
                          ? t.invalidTicket
                          : scannedTicket.alreadyCheckedIn
                          ? t.alreadyScanned
                          : t.validTicket}
                      </h4>
                      <p className="text-[10px] font-mono font-bold opacity-80">
                        ID: {scannedTicket.ticketId}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setScannedTicket(null)}
                    className="p-1.5 rounded-lg bg-gray-200/50 dark:bg-zinc-800 hover:opacity-80 text-xs font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Attendee Details Grid */}
                {scannedTicket.isValid && (
                  <div className="space-y-2.5">
                    <div className={`p-3 rounded-xl border transition-colors ${
                      theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-200'
                    }`}>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t.attendeeDetails}</div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-adv-orange/10 text-adv-orange flex items-center justify-center font-bold text-sm shrink-0">
                          {(scannedTicket.attendeeName || 'A').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black truncate">{scannedTicket.attendeeName}</div>
                          <div className="text-[11px] text-gray-400 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-adv-orange shrink-0" /> {scannedTicket.email}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500 shrink-0" /> {scannedTicket.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2.5 rounded-xl border transition-colors ${
                        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-200'
                      }`}>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{t.ticketTier}</div>
                        <div className="text-xs font-black text-adv-orange mt-0.5">{scannedTicket.ticketType}</div>
                      </div>

                      <div className={`p-2.5 rounded-xl border transition-colors ${
                        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-200'
                      }`}>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{t.seatZone}</div>
                        <div className="text-xs font-black mt-0.5">{scannedTicket.zone} • {scannedTicket.seat}</div>
                      </div>
                    </div>

                    {/* Action Check-In Button */}
                    {!scannedTicket.alreadyCheckedIn ? (
                      <button
                        onClick={confirmCheckIn}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{t.confirmCheckIn}</span>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs text-center border border-amber-500/30">
                        {t.alreadyCheckedInBy
                          .replace('{time}', scannedTicket.checkedInRecord?.time || 'earlier')
                          .replace('{staff}', scannedTicket.checkedInRecord?.staffLabel || staffLabel)}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : null}

            {/* Staff Check-Ins Live List (Organizer View Style) */}
            <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border transition-all ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-gray-100/50 dark:border-zinc-800/50">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">{t.recentCheckins}</h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setScannerPage(1);
                      }}
                      placeholder={t.searchAttendee}
                      className={`w-full sm:w-56 pl-8 pr-2.5 py-1.5 rounded-xl border text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-gray-50 border-gray-200 text-adv-slate placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pr-0.5">
                {filteredCheckins.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 font-bold text-xs">
                    {t.noCheckins}
                  </div>
                ) : (
                  (() => {
                    const CHECKINS_PER_PAGE = 10;
                    const totalScannerPages = Math.ceil(filteredCheckins.length / CHECKINS_PER_PAGE) || 1;
                    const safePage = Math.min(scannerPage, totalScannerPages);
                    const currentCheckins = filteredCheckins.slice((safePage - 1) * CHECKINS_PER_PAGE, safePage * CHECKINS_PER_PAGE);

                    return (
                      <>
                        {currentCheckins.map((checkin, index) => (
                          <motion.div 
                            key={checkin.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between gap-3 transition-all group ${
                              theme === 'dark' 
                                ? 'bg-zinc-950/45 border-zinc-850 hover:border-orange-500/20 hover:bg-orange-500/5' 
                                : 'bg-[#F9FAFB] border-gray-50 hover:border-orange-100 hover:bg-orange-50/10'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
                                theme === 'dark'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20 group-hover:bg-green-500/20'
                                  : 'bg-green-50 text-green-500 border-green-100 group-hover:bg-green-100'
                              }`}>
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs sm:text-sm font-black truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">{checkin.attendeeName}</span>
                                  <span className="px-1.5 py-0.5 bg-adv-slate dark:bg-zinc-800 text-white rounded text-[7px] font-black uppercase tracking-widest">{checkin.ticketType}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-zinc-400">
                                  {checkin.email && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Mail className="w-3 h-3 text-adv-orange shrink-0" />
                                      {checkin.email}
                                    </span>
                                  )}
                                  {checkin.phone && (
                                    <span className="flex items-center gap-1 truncate text-emerald-600 dark:text-emerald-400 font-bold">
                                      <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                      {checkin.phone}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-[9px] sm:text-[10px] text-gray-450 dark:text-zinc-400 font-bold uppercase tracking-wider">
                                  {checkin.zone && (
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-adv-orange" /> {checkin.zone}</span>
                                  )}
                                  {checkin.seat && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                      <span className="flex items-center gap-1"><TicketIcon className="w-3 h-3 text-blue-400" /> {checkin.seat}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2.5 md:pt-0 border-gray-100 dark:border-zinc-850">
                              <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                                ID: {checkin.ticketId || checkin.id}
                              </div>
                              <div className="text-[9px] text-emerald-500 font-black uppercase tracking-wider md:mt-1 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <span className="w-1.2 h-1.2 rounded-full bg-emerald-500 animate-pulse" />
                                {checkin.time}
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {totalScannerPages >= 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2.5 mt-2 border-t border-gray-100 dark:border-zinc-800/80">
                            <div className="text-[11px] font-bold text-gray-400 dark:text-zinc-400 flex items-center gap-2">
                              <span>
                                {lang === 'lo'
                                  ? `ສະແດງ ${(safePage - 1) * CHECKINS_PER_PAGE + 1}-${Math.min(safePage * CHECKINS_PER_PAGE, filteredCheckins.length)} ຈາກທັງໝົດ ${filteredCheckins.length} ຄົນ`
                                  : `Showing ${(safePage - 1) * CHECKINS_PER_PAGE + 1}-${Math.min(safePage * CHECKINS_PER_PAGE, filteredCheckins.length)} of ${filteredCheckins.length} attendees`}
                              </span>
                            </div>

                            {totalScannerPages > 1 && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setScannerPage(prev => Math.max(prev - 1, 1))}
                                  disabled={safePage === 1}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                  title={lang === 'lo' ? 'ໜ້າກ່ອນໜ້າ' : 'Previous Page'}
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>

                                <span className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black bg-adv-orange text-white shadow-sm">
                                  {safePage}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => setScannerPage(prev => Math.min(prev + 1, totalScannerPages))}
                                  disabled={safePage === totalScannerPages}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                  title={lang === 'lo' ? 'ໜ້າຖັດໄປ' : 'Next Page'}
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
