import { BankAccountInfo, PayoutBill, EventData } from "../types";
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronLeft, ChevronRight, Camera, Calendar as CalendarIcon, CalendarDays, MapPin, Plus, CheckCircle2, XCircle, X, AlertCircle, AlertTriangle, Loader2, Image as ImageIcon, Ticket, Download, Link2, Copy, ExternalLink, QrCode, Trash2, ShieldCheck , Building, Save, Edit2, ChevronDown, DollarSign, Info, Smartphone, Lock, Search, Phone, Mail, FileText, Users, Eye, Filter, PieChart, Sparkles, UserCheck, MessageSquare, ClipboardList, CheckSquare, Clock, Globe, ListFilter, Check, UserX, BarChart3, CheckCheck, KeyRound, RefreshCw, ShieldAlert } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { safeStorage } from '../lib/storage';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { events, SeatingZone, Coupon } from '../data/events';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CheckinRecord, EventAttendee, useAttendees, useCheckins } from '../lib/checkinsStore';
import SEO from '../components/SEO';
import OtpInput from '../components/OtpInput';
import ManageCouponsSection from '../components/ManageCouponsSection';
import BookingDayManagement from '../components/BookingDayManagement';

const LazyScanner = React.lazy(() =>
  (import('@yudiel/react-qr-scanner')
    .then(module => ({ default: module.Scanner }))
    .catch(err => {
      console.error('Failed to dynamically import react-qr-scanner:', err);
      return {
        default: () => (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20">
             <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-black text-adv-slate uppercase tracking-tight mb-2">Scanner Unvailable</h4>
             <p className="text-gray-400 mb-6 font-bold text-sm leading-relaxed">Camera scanner requires a secure context and frame permissions.</p>
          </div>
        )
      };
    })) as Promise<{ default: React.ComponentType<any> }>
);

const translations = {
  en: {
    settings: 'Settings',
    myProfile: 'My Profile',
    manageEvent: 'Manage Event',
    profileSettings: 'Profile Settings',
    notifications: 'Notifications',
    privacySecurity: 'Privacy & Security',
    payoutSettings: 'Payout Settings',
    helpCenter: 'Help Center',
    updateProfile: 'Update Profile',
    signOut: 'Sign Out',
    manageEvents: 'Manage Events',
    manageEventsDesc: 'Manage your events and ticket scanning',
    selectActivity: 'Select Activity to Manage',
    bookings: 'Tickets',
    attended: 'Attended',
    scanQr: 'Scan QR Code',
    seatingConfig: 'Seating Configuration',
    activeMap: 'Active Map',
    seatingDesc: 'Visual representation of ticket zones and layout',
    frontStage: 'Front Stage',
    vipZone: 'VIP Zone',
    zoneA: 'Zone A',
    zoneB: 'Zone B',
    viewFullMap: 'View Full Map',
    vipOccupancy: 'VIP Occupancy',
    liveSeatingMap: 'Live Seating Map Dashboard',
    mainStageArea: 'Main Stage Area',
    occupied: 'Occupied',
    totalCapacity: 'Total Capacity',
    revenueEstimate: 'Revenue Estimate',
    closeDashboard: 'Close Dashboard',
    entryScanner: 'Entry Scanner',
    invalidTicket: 'Invalid Ticket',
    validTicket: 'Valid Ticket',
    confirmEntry: 'Confirm Entry',
    alreadyScanned: 'Ticket {id} already scanned!',
    profileUpdated: 'Profile updated successfully',
    seats: 'Seats',
    scannerError: 'Scanner Error',
    resetScanner: 'Reset Scanner',
    permissionDismissed: 'Camera permission request was dismissed. Please allow camera access and try again.',
    accessDenied: 'Camera access denied',
    manualEntry: 'Manual Check-in',
    enterTicketCode: 'Enter ticket code (e.g. tk_123)',
    checkIn: 'Check In',
    simulateScan: 'Simulate Demo Ticket Scan',
    simulateDesc: 'Mock a successful entry scan without camera permissions.',
    ticketCode: 'Ticket Code',
    attendee: 'Attendee',
    zone: 'Zone',
    seat: 'Seat',
    price: 'Price',
    email: 'Email',
    recentCheckins: 'Recent Checked-In Attendees',
    noRecentCheckins: 'No checked-in attendees yet.',
    scannedAt: 'Scanned at',
    ticketDetails: 'Ticket Verification Details',
    staffScannerLinks: 'Staff QR Scanner Access Links',
    staffScannerDesc: 'Create dedicated URLs for gate staff. Staff can scan ticket QR codes & verify attendee details on their devices without full account access.',
    createStaffLink: 'Create Staff Access Link',
    staffNameLabel: 'Staff / Gate Name',
    staffNamePlaceholder: 'e.g., Gate 1 - Main Entrance',
    generateLink: 'Generate Staff Link',
    copyLink: 'Copy Link',
    linkCopied: 'Staff Link Copied to Clipboard!',
    showQrCode: 'Show QR Code',
    openScanner: 'Open Scanner',
    qrCodeModalTitle: 'Staff Scanner QR Code',
    qrCodeModalDesc: 'Scan this QR code on staff device to open scanner portal immediately.',
    revoke: 'Revoke',
    active: 'Active',
    noStaffLinks: 'No staff links generated yet. Click "Create Staff Link" below.',
    attendeeDirectory: 'Ticket Buyers & Registration Directory',
    attendeeDirectoryDesc: 'Track all registered ticket holders, check-in status, and their custom questionnaire responses.',
    allBuyers: 'All Buyers',
    checkedIn: 'Checked In',
    pendingGate: 'Pending Gate Scan',
    withFormAnswers: 'With Form Answers',
    viewAnswers: 'View Answers',
    questionnaireAnswers: 'Questionnaire Responses',
    questionnaireSummary: 'Answers Summary',
    noAttendeesFound: 'No ticket buyers match the selected filters.',
    answersModalTitle: 'Attendee Registration Details & Answers',
    answersModalSubtitle: 'Full questionnaire response data submitted during ticket checkout',
    questionnaireSummaryTitle: 'Activity Questionnaire Analytics & Summary',
    questionnaireSummarySubtitle: 'Aggregated breakdown of all attendee question submissions for this activity',
    exportAllData: 'Export Excel (All Data & Answers)',
    quickCheckin: 'Quick Check-In',
    appSettings: 'App Settings',
    selectLanguage: 'Select Language',
    english: 'English',
    lao: 'Lao'
  },
  lo: {
    settings: 'ຕັ້ງຄ່າ',
    myProfile: 'ໂປຣໄຟລ໌ຂອງຂ້ອຍ',
    manageEvent: 'ຈັດການກິດຈະກຳ',
    profileSettings: 'ຕັ້ງຄ່າໂປຣໄຟລ໌',
    notifications: 'ການແຈ້ງເຕືອນ',
    privacySecurity: 'ຄວາມເປັນສ່ວນຕົວ ແລະ ຄວາມປອດໄພ',
    payoutSettings: 'ຕັ້ງຄ່າການຈ່າຍເງິນ',
    helpCenter: 'ສູນຊ່ວຍເຫຼືອ',
    updateProfile: 'ອັບເດດໂປຣໄຟລ໌',
    signOut: 'ອອກຈາກລະບົບ',
    manageEvents: 'ຈັດການກິດຈະກຳ',
    manageEventsDesc: 'ຈັດການກິດຈະກຳ ແລະ ການສະແກນປີ້ຂອງທ່ານ',
    selectActivity: 'ເລືອກກິດຈະກຳທີ່ຈະຈັດການ',
    bookings: 'ປີ້',
    attended: 'ເຂົ້າຮ່ວມແລ້ວ',
    scanQr: 'ສະແກນ QR Code',
    seatingConfig: 'ການຕັ້ງຄ່າບ່ອນນັ່ງ',
    activeMap: 'ແຜນຜັງທີ່ໃຊ້ງານຢູ່',
    seatingDesc: 'ການສະແດງພາບຂອງເຂດປີ້ ແລະ ຮູບແບບ',
    frontStage: 'ໜ້າເວທີ',
    vipZone: 'ເຂດ VIP',
    zoneA: 'ເຂດ A',
    zoneB: 'ເຂດ B',
    viewFullMap: 'ເບິ່ງແຜນຜັງທັງໝົດ',
    vipOccupancy: 'ການຄອບຄອງ VIP',
    liveSeatingMap: 'ແຜງຄວບຄຸມແຜນຜັງບ່ອນນັ່ງສົດ',
    mainStageArea: 'ພື້ນທີ່ເວທີຫຼັກ',
    occupied: 'ມີຄົນຈອງແລ້ວ',
    totalCapacity: 'ຄວາມຈຸທັງໝົດ',
    revenueEstimate: 'ລາຍໄດ້ປະມານ',
    closeDashboard: 'ປິດແຜງຄວບຄຸມ',
    entryScanner: 'ເຄື່ອງສະແກນທາງເຂົ້າ',
    invalidTicket: 'ປີ້ບໍ່ຖືກຕ້ອງ',
    validTicket: 'ປີ້ຖືກຕ້ອງ',
    confirmEntry: 'ຢືນຢັນການເຂົ້າ',
    alreadyScanned: 'ປີ້ {id} ຖືກສະແກນແລ້ວ!',
    profileUpdated: 'ອັບເດດໂປຣໄຟລ໌ສຳເລັດແລ້ວ',
    seats: 'ບ່ອນນັ່ງ',
    scannerError: 'ຂໍ້ຜິດພາດຂອງເຄື່ອງສະແກນ',
    resetScanner: 'ຣີເຊັດເຄື່ອງສະແກນ',
    permissionDismissed: 'ການຂໍອະນຸຍາດກ້ອງຖ່າຍຮູບຖືກປະຕິເສດ. ກະລຸນາອະນຸຍາດໃຫ້ເຂົ້າເຖິງກ້ອງຖ່າຍຮູບ ແລະ ລອງໃໝ່ອີກຄັ້ງ.',
    accessDenied: 'ການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບຖືກປະຕິເສດ',
    manualEntry: 'ເຊັກອິນດ້ວຍຕົນເອງ',
    enterTicketCode: 'ປ້ອນລະຫັດປີ້ (ເຊັ່ນ: tk_123)',
    checkIn: 'ເຊັກອິນ',
    simulateScan: 'ຈຳລອງການສະແກນປີ້ຕົວຢ່າງ',
    simulateDesc: 'ຈຳລອງການສະແກນເຂົ້າສຳເລັດ ໂດຍບໍ່ຕ້ອງໃຊ້ກ້ອງ.',
    ticketCode: 'ລະຫັດປີ້',
    attendee: 'ຜູ້ເຂົ້າຮ່ວມ',
    zone: 'ເຂດ',
    seat: 'ບ່ອນນັ່ງ',
    price: 'ລາຄາ',
    email: 'ອີເມວ',
    recentCheckins: 'ຜູ້ເຂົ້າຮ່ວມທີ່ເຊັກອິນເມື່ອບໍ່ດົນມານີ້',
    noRecentCheckins: 'ຍັງບໍ່ມີຜູ້ເຂົ້າຮ່ວມທີ່ເຊັກອິນເທື່ອ.',
    scannedAt: 'ສະແກນເມື່ອ',
    ticketDetails: 'ລາຍລະອຽດການຢືນຢັນປີ້',
    staffScannerLinks: 'ລິ້ງສະແກນປີ້ QR ສຳລັບພະນັກງານ',
    staffScannerDesc: 'ສ້າງ URL ສະເພາະສຳລັບພະນັກງານປະຕູ. ພະນັກງານສາມາດສະແກນ QR code ແລະ ກວດສອບລາຍລະອຽດຜູ້ເຂົ້າຮ່ວມໃນອຸປະກອນຂອງເຂົາເຈົ້າໄດ້.',
    createStaffLink: 'ສ້າງລິ້ງເຂົ້າເຖິງສຳລັບພະນັກງານ',
    staffNameLabel: 'ຊື່ພະນັກງານ / ປະຕູ',
    staffNamePlaceholder: 'ເຊັ່ນ: ປະຕູ 1 - ທາງເຂົ້າຫຼັກ',
    generateLink: 'ສ້າງລິ້ງພະນັກງານ',
    copyLink: 'ຄັດລອກລິ້ງ',
    linkCopied: 'ຄັດລອກລິ້ງພະນັກງານສຳເລັດແລ້ວ!',
    showQrCode: 'ສະແດງ QR Code',
    openScanner: 'ເປີດເຄື່ອງສະແກນ',
    qrCodeModalTitle: 'QR Code ສຳລັບພະນັກງານ',
    qrCodeModalDesc: 'ສະແກນ QR code ນີ້ໃນອຸປະກອນພະນັກງານເພື່ອເປີດໜ້າສະແກນທັນທີ.',
    revoke: 'ຍົກເລີກ',
    active: 'ເປີດໃຊ້ງານ',
    noStaffLinks: 'ຍັງບໍ່ມີລິ້ງພະນັກງານຖືກສ້າງເທື່ອ. ກົດ "ສ້າງລິ້ງເຂົ້າເຖິງສຳລັບພະນັກງານ" ດ້ານລຸ່ມ.',
    attendeeDirectory: 'ລາຍຊື່ຜູ້ຊື້ປີ້ ແລະ ຄຳຕອບແບບສອບຖາມ',
    attendeeDirectoryDesc: 'ຕິດຕາມຜູ້ຖືປີ້ທັງໝົດ, ສະຖານະການເຊັກອິນ, ແລະ ຄຳຕອບແບບສອບຖາມຂອງພວກເຂົາ.',
    allBuyers: 'ຜູ້ຊື້ທັງໝົດ',
    checkedIn: 'ເຊັກອິນແລ້ວ',
    pendingGate: 'ລໍຖ້າສະແກນ',
    withFormAnswers: 'ມີຄຳຕອບແບບສອບຖາມ',
    viewAnswers: 'ເບິ່ງຄຳຕອບ',
    questionnaireAnswers: 'ຄຳຕອບແບບສອບຖາມ',
    questionnaireSummary: 'ສະຫຼຸບຄຳຕອບ',
    noAttendeesFound: 'ບໍ່ພົບຂໍ້ມູນຜູ້ຊື້ປີ້ຕາມເງື່ອນໄຂທີ່ເລືອກ.',
    answersModalTitle: 'ລາຍລະອຽດຜູ້ເຂົ້າຮ່ວມ ແລະ ຄຳຕອບແບບສອບຖາມ',
    answersModalSubtitle: 'ຂໍ້ມູນຄຳຕອບແບບສອບຖາມທີ່ຜູ້ຊື້ປ້ອນໃນຕອນຊື້ປີ້',
    questionnaireSummaryTitle: 'ສະຖິຕິ ແລະ ບົດສະຫຼຸບຄຳຕອບແບບສອບຖາມ',
    questionnaireSummarySubtitle: 'ການລວບລວມຄຳຕອບແບບສອບຖາມທັງໝົດສຳລັບກິດຈະກຳນີ້',
    exportAllData: 'ສົ່ງອອກ Excel (ຂໍ້ມູນທັງໝົດ ແລະ ຄຳຕອບ)',
    quickCheckin: 'ເຊັກອິນດ່ວນ',
    appSettings: 'ຕັ້ງຄ່າແອັບ',
    selectLanguage: 'ເລືອກພາສາ',
    english: 'ພາສາອັງກິດ',
    lao: 'ພາສາລາວ'
  }
};


const MOCK_PAYOUTS: PayoutBill[] = [
  {
    id: 'TXN-98472-LA',
    date: '2026-07-01',
    event: 'Vang Vieng Music Festival 2026',
    grossAmount: 16000000,
    platformFee: 500000,
    amount: 15500000,
    status: 'Completed',
    account: 'BCEL 0101200012346701',
    accountName: 'Sirithida Souksavat',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'TXN-47201-LA',
    date: '2026-06-18',
    event: 'That Luang Cultural Workshop',
    grossAmount: 8500000,
    platformFee: 300000,
    amount: 8200000,
    status: 'Completed',
    account: 'BCEL 0101200012346701',
    accountName: 'Sirithida Souksavat',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'TXN-21049-LA',
    date: '2026-05-30',
    event: 'Luang Prabang Film & Food Experience',
    grossAmount: 13000000,
    platformFee: 600000,
    amount: 12400000,
    status: 'Completed',
    account: 'BCEL 0101200012346701',
    accountName: 'Sirithida Souksavat',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'TXN-11590-LA',
    date: '2026-05-15',
    event: 'Kip Exchange Artisan Bazaar',
    grossAmount: 3800000,
    platformFee: 300000,
    amount: 3500000,
    status: 'Completed',
    account: 'BCEL 0101200012346701',
    accountName: 'Sirithida Souksavat',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300'
  }
];

const LAO_BANKS = [
  { id: 'bcel', name: 'BCEL Bank', label: 'BCEL One', badgeBg: 'bg-red-600', textColor: 'text-red-600', logo: '/BCEL.png' },
  { id: 'jdb', name: 'JDB Bank', label: 'JDB', badgeBg: 'bg-blue-600', textColor: 'text-blue-600', logo: '/JDB.png' },
  { id: 'ldb', name: 'LDB Bank', label: 'LDB', badgeBg: 'bg-emerald-600', textColor: 'text-emerald-600', logo: '/LDB.png' },
  { id: 'ibcool', name: 'Indochina Bank', label: 'IB Cool', badgeBg: 'bg-cyan-600', textColor: 'text-cyan-600', logo: '/IB.png' },
  { id: 'stb', name: 'ST Bank', label: 'STB', badgeBg: 'bg-purple-600', textColor: 'text-purple-600', logo: '/ST.png' }
];

export default function Account() {

  const [bankAccount, setBankAccount] = useState<BankAccountInfo | null>(() => {
    const saved = safeStorage.getItem('organizer_payment_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default verified bank account set 35 days ago so claiming is initially ready
    const initialBank: BankAccountInfo = {
      bankName: 'BCEL Bank',
      accountName: 'Sirithida Souksavat',
      accountNumber: '120-11-00-8899231-001',
      updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    };
    safeStorage.setItem('organizer_payment_info', JSON.stringify(initialBank));
    return initialBank;
  });

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState(bankAccount || { bankName: '', accountName: '', accountNumber: '' });
  
  // Payout revenue state
  interface UnclaimedEvent {
    id: string;
    title: string;
    amount: number;
    date: string;
  }
  const [unclaimedEvents, setUnclaimedEvents] = useState<UnclaimedEvent[]>([
    { id: 'ev1', title: 'Vientiane Music Festival 2026', amount: 2000000, date: '2026-10-15' },
    { id: 'ev2', title: 'Tech Startup Conference', amount: 1500000, date: '2026-09-20' }
  ]);
  const [eventToClaim, setEventToClaim] = useState<UnclaimedEvent | null>(null);
  const unclaimedRevenue = unclaimedEvents.reduce((acc, ev) => acc + ev.amount, 0);
  const [isClaiming, setIsClaiming] = useState(false);

  // Bank Update OTP State
  const [showBankOtpModal, setShowBankOtpModal] = useState(false);
  const [bankOtpCode, setBankOtpCode] = useState('');
  const [expectedBankOtp, setExpectedBankOtp] = useState('123456');
  const [bankOtpCountdown, setBankOtpCountdown] = useState(60);
  const [bankOtpError, setBankOtpError] = useState('');
  const [isVerifyingBankOtp, setIsVerifyingBankOtp] = useState(false);

  // Claim Event Money OTP State
  const [showClaimOtpModal, setShowClaimOtpModal] = useState(false);
  const [claimOtpCode, setClaimOtpCode] = useState('');
  const [expectedClaimOtp, setExpectedClaimOtp] = useState('123456');
  const [claimOtpCountdown, setClaimOtpCountdown] = useState(60);
  const [claimOtpError, setClaimOtpError] = useState('');
  const [claimTwoFaCode, setClaimTwoFaCode] = useState('');
  const [showCoolingWarningModal, setShowCoolingWarningModal] = useState(false);

  // State for Check-in Confirmation Modal
  const [checkinConfirmAttendee, setCheckinConfirmAttendee] = useState<any | null>(null);

  // Global Toast Notifications with 5-Second Auto-Dismiss
  const [toastQueue, setToastQueue] = useState<{id: string, text: string, type: 'error' | 'success' | 'warning' | 'info'}[]>([]);

  const addToast = (text: string, type: 'error' | 'success' | 'warning' | 'info' = 'success', duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToastQueue(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  // Safety timer to guarantee all notifications auto-dismiss in 5 seconds
  useEffect(() => {
    if (toastQueue.length > 0) {
      const timer = setTimeout(() => {
        setToastQueue(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastQueue]);

  // Calculate days since last bank details update
  const getDaysSinceBankUpdate = () => {
    if (!bankAccount?.updatedAt) return 999;
    const last = new Date(bankAccount.updatedAt).getTime();
    if (isNaN(last)) return 999;
    const diff = Date.now() - last;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysSinceBankUpdate = getDaysSinceBankUpdate();
  const isBankInCoolingPeriod = daysSinceBankUpdate < 30;
  const coolingDaysRemaining = isBankInCoolingPeriod ? (30 - daysSinceBankUpdate) : 0;
  const unlockDate = bankAccount?.updatedAt
    ? new Date(new Date(bankAccount.updatedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      )
    : '';

  // Countdown timer for Bank Update OTP
  useEffect(() => {
    let timer: any;
    if (showBankOtpModal && bankOtpCountdown > 0) {
      timer = setInterval(() => {
        setBankOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showBankOtpModal, bankOtpCountdown]);

  // Countdown timer for Claim Event Money OTP
  useEffect(() => {
    let timer: any;
    if (showClaimOtpModal && claimOtpCountdown > 0) {
      timer = setInterval(() => {
        setClaimOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showClaimOtpModal, claimOtpCountdown]);

  // Resend Bank Update OTP
  const handleResendBankOtp = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedBankOtp(newCode);
    setBankOtpCountdown(60);
    setBankOtpCode('');
    setBankOtpError('');
    addToast(lang === 'lo' ? `ສົ່ງລະຫັດ OTP ໃໝ່ສຳເລັດ: ${newCode}` : `New OTP Code sent: ${newCode}`, 'info', 5000);
  };

  // Resend Claim OTP
  const handleResendClaimOtp = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedClaimOtp(newCode);
    setClaimOtpCountdown(60);
    setClaimOtpCode('');
    setClaimOtpError('');
    addToast(lang === 'lo' ? `ສົ່ງລະຫັດ OTP ໃໝ່ສຳເລັດ: ${newCode}` : `New OTP Code sent: ${newCode}`, 'info', 5000);
  };

  // Open bank edit form
  const handleEditBankClick = () => {
    setBankFormData(bankAccount || { bankName: '', accountName: '', accountNumber: '' });
    setIsEditingBank(true);
  };

  // Save bank form - triggers mandatory OTP verification
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankFormData.bankName || !bankFormData.accountName || !bankFormData.accountNumber) {
      addToast(lang === 'lo' ? 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບທຸກຊ່ອງ' : 'Please fill all bank fields', 'error', 5000);
      return;
    }

    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedBankOtp(randomOtp);
    setBankOtpCode('');
    setBankOtpError('');
    setBankOtpCountdown(60);
    setShowBankOtpModal(true);
  };

  // Verify OTP and persist updated bank details (Triggers 5-second auto-remove success popup)
  const handleVerifyAndSaveBank = () => {
    if (bankOtpCode.length < 6) {
      setBankOtpError(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກໃຫ້ຄົບຖ້ວນ' : 'Please enter the full 6-digit OTP code');
      return;
    }
    if (bankOtpCode !== expectedBankOtp && bankOtpCode !== '123456') {
      setBankOtpError(lang === 'lo' ? 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບຄືນ' : 'Invalid OTP code. Please verify and try again.');
      return;
    }

    setIsVerifyingBankOtp(true);
    setTimeout(() => {
      setIsVerifyingBankOtp(false);
      const now = new Date().toISOString();
      const newBankInfo: BankAccountInfo = {
        ...bankFormData,
        updatedAt: now
      };

      safeStorage.setItem('organizer_payment_info', JSON.stringify(newBankInfo));
      setBankAccount(newBankInfo);
      setIsEditingBank(false);
      setShowBankOtpModal(false);
      setBankOtpCode('');
      setBankOtpError('');

      addToast(
        lang === 'lo'
          ? 'ອັບເດດຂໍ້ມູນທະນາຄານສຳເລັດແລ້ວ!'
          : 'Bank details updated successfully!',
        'success',
        5000
      );
    }, 600);
  };

  // Open Claim Event Money Modal with 30-Day Check
  const handleOpenClaimModal = (event: UnclaimedEvent) => {
    // Strictly enforce 30-day bank modification cooling-off condition
    if (isBankInCoolingPeriod) {
      setShowCoolingWarningModal(true);
      return;
    }

    setEventToClaim(event);
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedClaimOtp(randomOtp);
    setClaimOtpCode('');
    setClaimOtpError('');
    setClaimOtpCountdown(60);
    setShowClaimOtpModal(true);
  };

  // Confirm and authorize event revenue claim with OTP
  const handleConfirmClaimPayout = () => {
    let hasError = false;

    if (claimOtpCode.length < 6) {
      setClaimOtpError(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກໃຫ້ຄົບຖ້ວນ' : 'Please enter the full 6-digit OTP code');
      hasError = true;
    } else if (claimOtpCode !== expectedClaimOtp && claimOtpCode !== '123456') {
      setClaimOtpError(lang === 'lo' ? 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບຄືນ' : 'Invalid OTP code. Please verify and try again.');
      hasError = true;
    }
    
    if (claimTwoFaCode.length < 6) {
      setClaimOtpError(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ 2FA 6 ຫຼັກໃຫ້ຄົບຖ້ວນ' : 'Please enter the full 6-digit 2FA code');
      hasError = true;
    } else if (claimTwoFaCode !== '123456') {
      setClaimOtpError(lang === 'lo' ? 'ລະຫັດ 2FA ບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບຄືນ' : 'Invalid 2FA code. Please verify and try again.');
      hasError = true;
    }

    if (hasError) return;

    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimOtpModal(false);
      
      if (!eventToClaim) return;

      const claimedAmt = eventToClaim.amount;
      setUnclaimedEvents(prev => prev.filter(e => e.id !== eventToClaim.id));
      setClaimOtpCode('');
      setClaimTwoFaCode('');
      setClaimOtpError('');

      const newPayout: PayoutBill = {
        id: `PAY-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        event: eventToClaim.title,
        grossAmount: claimedAmt,
        platformFee: claimedAmt * 0.05,
        amount: claimedAmt * 0.95,
        status: 'Pending',
        account: bankAccount ? `${bankAccount.bankName} *${bankAccount.accountNumber.slice(-4)}` : 'BCEL Bank *8899',
        accountName: bankAccount?.accountName || 'Sirithida Souksavat',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
      };

      setMyPayouts(prev => [newPayout, ...prev]);

      try {
        const existing = safeStorage.getItem('organizer_payout_bills');
        const parsed = existing ? JSON.parse(existing) : [];
        parsed.unshift({
          id: newPayout.id,
          paidAt: new Date().toISOString(),
          eventTitle: newPayout.event,
          revenue: newPayout.grossAmount,
          platformFeeAmount: newPayout.platformFee,
          payoutAmount: newPayout.amount,
          status: 'pending',
          bankInfo: bankAccount,
          billImage: newPayout.receiptUrl
        });
        safeStorage.setItem('organizer_payout_bills', JSON.stringify(parsed));
      } catch (e) {}

      addToast(
        lang === 'lo'
          ? `ຢືນຢັນສຳເລັດ! ຂໍເບີກຈ່າຍເງິນ ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ ຮຽບຮ້ອຍແລ້ວ`
          : `Verified! Payout claim of ${new Intl.NumberFormat('lo-LA').format(claimedAmt * 0.95)} ₭ transferred successfully!`,
        'success',
        5000
      );
    }, 800);
  };

  const handleSimulateBankDate = (daysAgo: number) => {
    if (!bankAccount) return;
    const simulatedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const updated: BankAccountInfo = { ...bankAccount, updatedAt: simulatedDate };
    setBankAccount(updated);
    safeStorage.setItem('organizer_payment_info', JSON.stringify(updated));
    addToast(
      daysAgo >= 30
        ? (lang === 'lo' ? `ຈຳລອງ: ທະນາຄານອັບເດດເມື່ອ ${daysAgo} ວັນກ່ອນ (ສາມາດຂໍເບີກເງິນໄດ້ແລ້ວ)` : `Simulated: Bank updated ${daysAgo} days ago (Eligible to claim)`)
        : (lang === 'lo' ? `ຈຳລອງ: ທະນາຄານອັບເດດມື້ນີ້ (ຖືກລັອກຄວາມປອດໄພ 30 ວັນ)` : `Simulated: Bank updated today (Locked for 30 days)`),
      'info',
      5000
    );
  };

  const navigate = useNavigate();
  const { logout } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = translations[lang] as unknown as Record<string, string>;


  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try {
      return localStorage.getItem('pasopkan_user_profile_pic');
    } catch (e) {
      return null;
    }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('pasopkan_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'USR-98421',
      firstName: 'Sirithida',
      lastName: 'Souksavat',
      email: 'sirithida.ssv@gmail.com',
    };
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [myEvents, setMyEvents] = useState(() => {
    const defaultEvents = [
      { 
        ...events[0], 
        registered: 124, 
        scanned: 45, 
        hasSeating: true,
        zoneImage: '/src/assets/images/seating_map_layout_1782798956470.jpg'
      },
      { ...events[1], registered: 85, scanned: 80, hasSeating: false },
      { 
        ...(events.find(e => e.id === '4') || events[3]), 
        registered: 24, 
        scanned: 8, 
        hasSeating: false 
      }
    ];

    try {
      const savedOrganizerEventsStr = safeStorage.getItem('organizer_events');
      if (savedOrganizerEventsStr) {
        const savedOrganizerEvents = JSON.parse(savedOrganizerEventsStr);
        if (Array.isArray(savedOrganizerEvents) && savedOrganizerEvents.length > 0) {
          // Merge custom created events, ensuring we don't duplicate by ID
          const existingIds = new Set(savedOrganizerEvents.map(e => e.id));
          return [...savedOrganizerEvents, ...defaultEvents.filter(e => !existingIds.has(e.id))];
        }
      }
    } catch (e) {
      console.error('Failed to load organizer events:', e);
    }
    
    return defaultEvents;
  });
  const [selectedEventId, setSelectedEventId] = useState<string>(myEvents[0]?.id || '1');
  const selectedEvent = myEvents.find(e => e.id === selectedEventId) || myEvents[0];

  const [showScanner, setShowScanner] = useState(false);
  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<{ 
    id: string; 
    valid: boolean; 
    alreadyScanned?: boolean; 
    attendeeName?: string; 
    ticketType?: string;
    zone?: string;
    seat?: string;
    price?: string;
    email?: string;
    phone?: string;
  } | null>(null);

  const [checkinPage, setCheckinPage] = useState(1);
  const [recentCheckinSearch, setRecentCheckinSearch] = useState('');

  // Real-time checkins store automatically filtered for selected event
  const { eventCheckins: recentCheckins, addCheckin: addOrganizerCheckin } = useCheckins(selectedEventId);

  // Real-time comprehensive attendees store with question responses & checkin status
  const {
    eventAttendees,
    checkedInAttendees,
    pendingAttendees,
    attendeesWithAnswers,
    totalCount: totalAttendeesCount,
    checkedInCount,
    pendingCount,
    withAnswersCount,
    setCheckinStatus,
    addAttendee,
    rescheduleBooking
  } = useAttendees(selectedEventId);

  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [attendeeTierFilter, setAttendeeTierFilter] = useState<string>('all');
  const [selectedAttendeeForAnswers, setSelectedAttendeeForAnswers] = useState<EventAttendee | null>(null);
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const [attendeeListPage, setAttendeeListPage] = useState(1);

  // Helper to format any time string or timestamp strictly to HH:mm
  const formatTimeToHHMM = (timeStr?: string, timestamp?: number): string => {
    if (!timeStr && !timestamp) return '';
    if (timeStr) {
      // If matches HH:mm:ss or HH:mm or H:mm
      const match = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    return timeStr || '';
  };

  const filteredRecentCheckins = recentCheckins.filter(c => {
    const q = recentCheckinSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.attendeeName && c.attendeeName.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.ticketType && c.ticketType.toLowerCase().includes(q)) ||
      (c.zone && c.zone.toLowerCase().includes(q)) ||
      (c.seat && c.seat.toLowerCase().includes(q))
    );
  });

  const filteredAttendees = React.useMemo(() => {
    return eventAttendees.filter(att => {
      // Status filter
      if (attendeeFilter === 'checked_in' && !att.isCheckedIn) return false;
      if (attendeeFilter === 'pending' && att.isCheckedIn) return false;

      // Tier filter
      if (attendeeTierFilter !== 'all' && att.ticketType !== attendeeTierFilter) return false;

      // Query search
      const q = attendeeSearchQuery.toLowerCase().trim();
      if (!q) return true;

      const nameMatch = (att.attendeeName || '').toLowerCase().includes(q);
      const emailMatch = (att.email || '').toLowerCase().includes(q);
      const phoneMatch = (att.phone || '').toLowerCase().includes(q);
      const ticketMatch = (att.ticketId || '').toLowerCase().includes(q);
      const orderMatch = (att.orderId || '').toLowerCase().includes(q);
      const tierMatch = (att.ticketType || '').toLowerCase().includes(q);
      const zoneMatch = (att.zone || '').toLowerCase().includes(q);

      const answersMatch = att.customAnswers && Object.values(att.customAnswers).some(val => {
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (Array.isArray(val)) return val.some(item => String(item).toLowerCase().includes(q));
        return String(val).toLowerCase().includes(q);
      });

      return nameMatch || emailMatch || phoneMatch || ticketMatch || orderMatch || tierMatch || zoneMatch || answersMatch;
    });
  }, [eventAttendees, attendeeFilter, attendeeTierFilter, attendeeSearchQuery]);

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'my-event' | 'payouts'>(
    (location.state as any)?.targetTab || 'profile'
  );

  useEffect(() => {
    if ((location.state as any)?.targetTab) {
      setActiveTab((location.state as any).targetTab);
      window.scrollTo(0, 0);
    }
  }, [location.state]);

  
  // Staff Scanner Links State
  interface StaffLink {
    id: string;
    eventId: string;
    staffLabel: string;
    token: string;
    createdAt: string;
    url: string;
  }

  const [staffLinks, setStaffLinks] = useState<StaffLink[]>(() => {
    try {
      const saved = localStorage.getItem('pasopkan_staff_links');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    
    return [
      {
        id: 'stf_demo_1',
        eventId: '1',
        staffLabel: 'Main Entrance Gate 1',
        token: 'tk_stf_89123',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        url: `${window.location.origin}/staff-scanner?eventId=1&staffLabel=${encodeURIComponent('Main Entrance Gate 1')}&key=tk_stf_89123`
      }
    ];
  });

  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [newStaffLabel, setNewStaffLabel] = useState('');
  const [activeStaffQrModal, setActiveStaffQrModal] = useState<StaffLink | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('pasopkan_staff_links', JSON.stringify(staffLinks));
    } catch (e) {}
  }, [staffLinks]);

  const handleCreateStaffLink = () => {
    const label = newStaffLabel.trim() || 'Gate Staff';
    const targetEventId = String(selectedEvent?.id || selectedEventId || '1');
    const token = `stf_${targetEventId}_${Date.now()}`;
    const url = `${window.location.origin}/staff-scanner?eventId=${targetEventId}&staffLabel=${encodeURIComponent(label)}&key=${token}`;

    const newLink: StaffLink = {
      id: `link_${Date.now()}`,
      eventId: targetEventId,
      staffLabel: label,
      token: token,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      url: url
    };

    setStaffLinks(prev => [newLink, ...prev]);
    setNewStaffLabel('');
    setShowCreateStaffModal(false);
    
    // Auto copy
    try {
      navigator.clipboard.writeText(url);
    } catch (e) {}
    addToast(t.linkCopied, 'success');
  };

  const handleCopyStaffLink = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
    } catch (e) {}
    addToast(t.linkCopied, 'success');
  };

  const handleRevokeStaffLink = (id: string) => {
    setStaffLinks(prev => prev.filter(l => l.id !== id));
    addToast('Staff Access Link Revoked', 'warning');
  };

  const lastScanRef = useRef<{ id: string; time: number } | null>(null);

  const handleScan = (text: string) => {
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.id === text && (now - lastScanRef.current.time) < 2500) {
      return;
    }
    lastScanRef.current = { id: text, time: now };

    const isValid = text.startsWith('tk_') || text.length > 5;
    
    if (isValid) {
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      const isAlready = scannedIds.includes(text) || recentCheckins.some(c => c.id === text);
      
      const firstNames = ['Alex', 'Sarah', 'Jessica', 'David', 'Michael', 'Emma', 'Daniel', 'Sophia', 'James', 'Emily'];
      const lastNames = ['Johnson', 'Connor', 'Miller', 'Smith', 'Scott', 'Davis', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];
      const ticketTypes = ['VIP Front Stage', 'Standard Zone A', 'General Access Zone B'];
      const zones = ['VIP Row 3', 'Zone A Row 12', 'Zone B Row 25'];
      
      const index = text.length % 10;
      const charCodeSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fn = firstNames[(index + charCodeSum) % 10];
      const ln = lastNames[(index + charCodeSum * 2) % 10];
      const tt = ticketTypes[charCodeSum % 3];
      const zn = zones[charCodeSum % 3];
      const seatNum = `Seat ${1 + (charCodeSum % 40)}`;
      const priceVal = charCodeSum % 3 === 0 ? '$250.00' : charCodeSum % 3 === 1 ? '$120.00' : '$60.00';
      const emailAddr = `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;

      setScanResult({ 
        id: text, 
        valid: true,
        alreadyScanned: isAlready,
        attendeeName: `${fn} ${ln}`,
        ticketType: tt,
        zone: zn,
        seat: seatNum,
        price: priceVal,
        email: emailAddr
      });

      if (isAlready) {
        addToast(t.alreadyScanned.replace('{id}', text), 'warning');
      } else {
        setScannedIds(prev => [...prev, text]);
      }
    } else {
      addToast(`${t.invalidTicket}: ${text}`, 'error');
    }
  };

  const handleConfirmEntry = () => {
    if (!scanResult) return;

    if (scanResult.alreadyScanned) {
      addToast(
        lang === 'en' 
          ? `Warning: Ticket ${scanResult.id} has already been checked in!` 
          : `ຄຳເຕືອນ: ປີ້ ${scanResult.id} ໄດ້ຖືກສະແກນ ຫຼື ເຊັກອິນໄປແລ້ວ!`, 
        'error'
      );
      setScanResult(null);
      return;
    }

    const newCheckin: CheckinRecord = {
      id: scanResult.id,
      ticketId: scanResult.id,
      eventId: selectedEventId,
      attendeeName: scanResult.attendeeName || 'Unknown Attendee',
      ticketType: scanResult.ticketType || 'Standard',
      zone: scanResult.zone || 'General',
      seat: scanResult.seat || 'N/A',
      email: scanResult.email || '',
      phone: scanResult.phone || '',
      time: new Date().toLocaleTimeString(lang === 'lo' ? 'lo-LA' : 'en-GB', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      staffLabel: 'Organizer Desk'
    };
    addOrganizerCheckin(newCheckin);
    // Persist the scan to Postgres (source of truth); non-blocking.
    api.scanCheckin({
      ticketCode: scanResult.id,
      eventId: String(selectedEventId),
      attendeeName: scanResult.attendeeName || undefined,
      ticketType: scanResult.ticketType || undefined,
      seatLabel: scanResult.seat || undefined,
      gate: 'Organizer Desk',
    });
    setMyEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, scanned: e.scanned + 1 } : e));
    addToast(lang === 'en' ? `Successfully checked in ${scanResult.attendeeName}` : `ເຊັກອິນ ${scanResult.attendeeName} ສຳເລັດແລ້ວ`, 'success');
    setScanResult(null);
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode('');
  };

  const handleSimulation = () => {
    const mockId = 'tk_' + Math.floor(100000 + Math.random() * 900000);
    handleScan(mockId);
  };

  const handleExportToExcel = () => {
    // 1. Collect all custom questions from the event schema or existing answers
    const configuredQuestions = (selectedEvent as any)?.attendeeQuestions || [];
    const questionKeys = new Set<string>();
    const questionLabels: Record<string, string> = {};

    // Add configured questions
    configuredQuestions.forEach((q: any) => {
      const qKey = q.id || q.title;
      questionKeys.add(qKey);
      questionLabels[qKey] = q.title || q.id;
    });

    // Also scan all attendees to ensure no dynamic questions are missed
    eventAttendees.forEach(att => {
      if (att.customAnswers) {
        Object.keys(att.customAnswers).forEach(key => {
          questionKeys.add(key);
          if (!questionLabels[key]) {
            // Find label if available
            const matchingQ = configuredQuestions.find((q: any) => q.id === key || q.title === key);
            questionLabels[key] = matchingQ?.title || key;
          }
        });
      }
    });

    const questionKeyList = Array.from(questionKeys);

    // 2. Define headers
    const baseHeaders = [
      'Ticket ID',
      'Order ID',
      'Attendee Full Name',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Ticket Tier',
      'Zone',
      'Seat',
      'Price Paid',
      'Purchase Date',
      'Check-in Status',
      'Check-in Time',
      'Gate / Staff'
    ];

    const questionHeaderTitles = questionKeyList.map(k => `Question: ${questionLabels[k] || k}`);
    const allHeaders = [...baseHeaders, ...questionHeaderTitles];

    // 3. Define rows (export filtered attendees if active, or all attendees)
    const exportDataset = filteredAttendees.length > 0 ? filteredAttendees : eventAttendees;
    const rows = exportDataset.map(att => {
      const answersValues = questionKeyList.map(k => {
        if (!att.customAnswers || att.customAnswers[k] === undefined || att.customAnswers[k] === null) {
          return '-';
        }
        const val = att.customAnswers[k];
        if (typeof val === 'boolean') {
          return val ? 'Yes' : 'No';
        }
        if (Array.isArray(val)) {
          return val.join(', ');
        }
        return String(val);
      });

      return [
        att.ticketId || att.id,
        att.orderId || 'N/A',
        att.attendeeName || `${att.firstName || ''} ${att.lastName || ''}`.trim() || 'Attendee',
        att.firstName || '',
        att.lastName || '',
        att.email || '',
        att.phone || '',
        att.ticketType || 'Standard',
        att.zone || 'General',
        att.seat || 'N/A',
        att.price || '',
        att.purchaseDate ? new Date(att.purchaseDate).toLocaleString() : '',
        att.isCheckedIn ? 'Checked In' : 'Pending Gate Scan',
        att.checkedInTime || (att.isCheckedIn ? 'Verified' : 'Not Checked In'),
        att.staffLabel || (att.isCheckedIn ? 'Organizer Desk' : '-')
      ].concat(answersValues);
    });

    const worksheetData = [allHeaders, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendees");
    
    const cleanTitle = typeof selectedEvent?.title === 'string' ? selectedEvent.title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'event';
    const fileName = `attendees_and_responses_${cleanTitle}_${selectedEventId}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    
    addToast(
      lang === 'en' 
        ? `Successfully exported ${exportDataset.length} attendee records & answers to Excel!` 
        : `ສົ່ງອອກຂໍ້ມູນຜູ້ຊື້ປີ້ ແລະ ຄຳຕອບແບບສອບຖາມ ${exportDataset.length} ລາຍການໄປຍັງ Excel ສຳເລັດແລ້ວ!`, 
      'success'
    );
  };

  const menuItems = [
    { 
      icon: User, 
      label: t.profileSettings, 
      desc: lang === 'en' ? 'Update your basic information and photo' : 'ອັບເດດຂໍ້ມູນພື້ນຖານ ແລະ ຮູບພາບຂອງທ່ານ',
      path: '/edit-profile',
      color: 'text-blue-500 dark:text-blue-450',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    { 
      icon: Bell, 
      label: t.notifications, 
      desc: lang === 'en' ? 'Control how you receive activity updates' : 'ຄວບຄຸມວິທີທີ່ທ່ານໄດ້ຮັບການແຈ້ງເຕືອນກິດຈະກຳ',
      path: '/notifications',
      color: 'text-adv-orange dark:text-orange-450',
      bg: 'bg-orange-50 dark:bg-orange-500/10'
    },
    {
      icon: Globe,
      label: lang === 'en' ? 'Language' : 'ພາສາ',
      desc: lang === 'en' ? 'Change application language' : 'ປ່ຽນພາສາຂອງແອັບພລິເຄຊັນ',
      path: '/language',
      color: 'text-indigo-500 dark:text-indigo-450',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    { 
      icon: Shield, 
      label: t.privacySecurity, 
      desc: lang === 'en' ? 'Manage 2FA authenticator and account security' : 'ຈັດການ 2FA Authenticator ແລະ ຄວາມປອດໄພຂອງບັນຊີ',
      path: '/security',
      color: 'text-emerald-500 dark:text-emerald-450',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    { 
      icon: HelpCircle, 
      label: t.helpCenter, 
      desc: lang === 'en' ? 'Browse FAQs or contact our support team' : 'ເບິ່ງຄຳຖາມທີ່ພົບເລື້ອຍ ຫຼື ຕິດຕໍ່ທີມງານຊ່ວຍເຫຼືອ',
      path: '/help',
      color: 'text-amber-500 dark:text-amber-450',
      bg: 'bg-amber-50 dark:bg-amber-500/10'
    },
    {
      icon: Info,
      label: lang === 'en' ? 'About' : 'ກ່ຽວກັບ',
      desc: lang === 'en' ? 'Learn more about our platform' : 'ຮຽນຮູ້ເພີ່ມເຕີມກ່ຽວກັບແພລດຟອມຂອງພວກເຮົາ',
      path: '/about',
      color: 'text-sky-500 dark:text-sky-450',
      bg: 'bg-sky-50 dark:bg-sky-500/10'
    }
  ];

  const pastEvents = events.slice(0, 3);

  const [showFullMap, setShowFullMap] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [showZoneSuccess, setShowZoneSuccess] = useState(false);
  const [showProfilePicSuccess, setShowProfilePicSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutImagePreview, setPayoutImagePreview] = useState<string | null>(null);
  const [activeTxTooltip, setActiveTxTooltip] = useState<string | null>(null);
  const [myPayouts, setMyPayouts] = useState<PayoutBill[]>(MOCK_PAYOUTS);

  useEffect(() => {
    const savedBills = safeStorage.getItem('organizer_payout_bills');
    if (savedBills) {
      try {
        const parsed = JSON.parse(savedBills);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formattedBills = parsed.map(bill => ({
            id: bill.id,
            date: bill.paidAt ? new Date(bill.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            event: bill.eventTitle,
            grossAmount: bill.revenue || 0,
            platformFee: bill.platformFeeAmount || 0,
            amount: bill.payoutAmount || 0,
            status: bill.status === 'paid' ? 'Completed' : 'Pending',
            account: bill.bankInfo ? `${bill.bankInfo.bankName} ${bill.bankInfo.accountNumber}` : 'Unknown',
            accountName: bill.bankInfo?.accountName || bill.accountName || bankAccount?.accountName || 'Sirithida Souksavat',
            receiptUrl: bill.billImage
          }));
          
          setMyPayouts([...formattedBills, ...MOCK_PAYOUTS]);
        }
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    // Instant execution for mobile responsiveness
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (showScanner) {
      if (typeof window === 'undefined' || !window.navigator || !window.navigator.mediaDevices) {
        setScannerError(lang === 'en' ? 'Camera access is not supported in this frame. Please open the app in a new window/tab for camera permissions.' : 'ບໍ່ຮອງຮັບການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໃນຫນ້ານີ້. ກະລຸນາເປີດໃນແທັບໃໝ່.');
      } else {
        setScannerError(null);
      }
    }
  }, [showScanner, lang]);

  const toggleSeating = (eventId: string) => {
    setMyEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, hasSeating: !e.hasSeating } : e
    ));
  };

  const handleUpdateEventCoupons = (updatedCoupons: Coupon[]) => {
    setMyEvents(prev => {
      const updated = prev.map(e => {
        if (String(e.id) === String(selectedEvent.id)) {
          return {
            ...e,
            coupons: updatedCoupons,
          };
        }
        return e;
      });
      try {
        safeStorage.setItem('organizer_events', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save organizer events:', err);
      }
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const base64Pic = canvas.toDataURL('image/jpeg', 0.8);
          
          setProfilePic(base64Pic);
          
          try {
            localStorage.setItem('pasopkan_user_profile_pic', base64Pic);
          } catch (err) {
            console.error('LocalStorage quota exceeded, skipping local cache', err);
          }
          
          setShowProfilePicSuccess(true);
          setTimeout(() => {
          setShowProfilePicSuccess(false);
        }, 5000);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-12 animate-pulse">
        <div className="max-w-4xl mx-auto px-4">
          <div className="w-48 h-10 bg-white rounded-2xl mb-8 shadow-sm"></div>
          <div className="bg-white rounded-3xl h-64 shadow-sm mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl shadow-sm"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 py-4 sm:py-8 px-3.5 sm:px-6 lg:px-8 ${
      theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-[#F9FAFB] text-adv-slate'
    }`}>
      <SEO
        title={t.myProfile || (lang === 'lo' ? 'ບັນຊີ & ການຕັ້ງຄ່າ' : 'Account & Settings')}
        description="Manage your Pasopkan profile, organizer settings, notifications, and event tickets."
        noindex={true}
      />
      <div className="max-w-4xl mx-auto pt-1 sm:pt-2">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-adv-slate'
          }`}>
            {t.settings}
          </h1>
        </div>
        
        {/* Tabs - Mobile Segmented Pill Bar */}
        <div className={`p-1 rounded-xl sm:rounded-2xl flex overflow-x-auto hide-scrollbar gap-1 mb-4 sm:mb-8 transition-colors ${
          theme === 'dark' ? 'bg-zinc-900/60' : 'bg-gray-200/50'
        } sm:bg-transparent sm:p-0 sm:border-b sm:border-gray-100 sm:rounded-none sm:gap-8`}>
          <button 
            onClick={() => { setActiveTab('profile'); window.scrollTo(0, 0); }}
            className={`flex-1 min-w-[90px] sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 ${
              activeTab === 'profile' 
                ? theme === 'dark'
                  ? 'bg-zinc-800 text-white border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange'
                  : 'bg-white text-adv-slate shadow-sm border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 sm:border-transparent'
            }`}
          >
            {t.myProfile}
          </button>
          <button 
            onClick={() => { setActiveTab('my-event'); window.scrollTo(0, 0); }}
            className={`flex-1 min-w-[90px] sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 ${
              activeTab === 'my-event' 
                ? theme === 'dark'
                  ? 'bg-zinc-800 text-white border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange'
                  : 'bg-white text-adv-slate shadow-sm border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 sm:border-transparent'
            }`}
          >
            {t.manageEvent}
          </button>
          <button 
            onClick={() => { setActiveTab('payouts'); window.scrollTo(0, 0); }}
            className={`flex-1 min-w-[90px] sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 ${
              activeTab === 'payouts' 
                ? theme === 'dark'
                  ? 'bg-zinc-800 text-white border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange'
                  : 'bg-white text-adv-slate shadow-sm border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 sm:border-transparent'
            }`}
          >
            {t.payouts || (lang === 'lo' ? 'ໃບບິນເບີກຈ່າຍ' : 'Payout Bills')}
          </button>
        </div>

        <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
          {/* Profile Card */}
          <div className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8 shadow-sm border transition-all ${
            theme === 'dark' 
              ? 'bg-zinc-900 border-zinc-800/80 text-white' 
              : 'bg-white border-gray-100 text-adv-slate'
          }`}>
            <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center text-gray-300 shrink-0 overflow-hidden shadow-inner transition-transform group-hover:scale-[1.02] duration-300">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-adv-orange text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 transition-transform group-hover:scale-110">
                <Camera className="w-4 h-4" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{profile.firstName} {profile.lastName}</h2>
              <p className="text-gray-400 font-medium mb-1 text-xs sm:text-sm truncate">{profile.email}</p>
              <p className="text-gray-400/80 font-medium text-[10px] sm:text-xs truncate">Id: {profile.id || 'N/A'}</p>
            </div>
          </div>

          {/* Account Menu */}
          <div className={`rounded-3xl sm:rounded-[2.5rem] overflow-hidden mb-6 sm:mb-8 shadow-sm border transition-all ${
            theme === 'dark' 
              ? 'bg-zinc-900 border-zinc-800/80 divide-y divide-zinc-800/50' 
              : 'bg-white border-gray-100 divide-y divide-gray-50'
          }`}>
            {menuItems.map((item, index) => (
              <Link 
                key={index} 
                to={item.path}
                className={`w-full flex items-center justify-between p-4 sm:p-5.5 transition-all group text-left ${
                  theme === 'dark' ? 'hover:bg-zinc-800/45' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl ${item.bg} flex items-center justify-center ${item.color} shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                    <item.icon className="w-5.5 h-5.5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`block font-bold text-sm sm:text-base mb-0.5 group-hover:text-adv-orange transition-colors ${
                      theme === 'dark' ? 'text-zinc-100' : 'text-adv-slate'
                    }`}>{item.label}</span>
                    <span className="block text-xs text-gray-400 font-medium truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none">{item.desc}</span>
                  </div>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  theme === 'dark' 
                    ? 'bg-zinc-800/50 text-zinc-500 group-hover:bg-adv-orange group-hover:text-white' 
                    : 'bg-gray-50 text-gray-350 group-hover:bg-adv-orange group-hover:text-white'
                } group-hover:translate-x-0.5`}>
                  <ChevronRight className="w-4.5 h-4.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => logout()}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold text-sm sm:text-base ${
                theme === 'dark' 
                  ? 'bg-zinc-900 border-red-500/20 text-red-400 hover:bg-red-500/5' 
                  : 'bg-white border-red-50 text-red-500 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-5 h-5" />
              {t.signOut}
            </button>
          </div>

          {/* Mobile Legal Actions */}
          <div className="flex flex-col gap-3 mt-4 sm:hidden">
            <div className="flex items-center gap-3">
              <Link 
                to="/terms"
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all font-bold text-xs ${
                  theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                {lang === 'lo' ? 'ເງື່ອນໄຂການບໍລິການ' : 'Terms & Conditions'}
              </Link>
              <Link 
                to="/privacy"
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all font-bold text-xs ${
                  theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                {lang === 'lo' ? 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ' : 'Privacy Policy'}
              </Link>
            </div>
          </div>
        </div>

        <div className={activeTab === 'my-event' ? 'block' : 'hidden'}>
          {/* Manage Event Header */}
          <div className="mb-6 sm:mb-8">
            <h2 className={`text-xl sm:text-2xl font-bold transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-adv-slate'
            }`}>{t.manageEvents}</h2>
            <p className="text-gray-400 font-medium text-xs sm:text-sm">{t.manageEventsDesc}</p>
          </div>

          <div className="mb-6 sm:mb-8">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">{t.selectActivity}</label>
            <div className="relative">
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)}
                className={`w-full border rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 shadow-sm appearance-none pr-12 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-white focus:border-adv-orange' 
                    : 'bg-white border-gray-150 text-adv-slate focus:border-adv-orange'
                }`}
              >
                {myEvents.map(event => (
                  <option key={event.id} value={event.id} className={theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-adv-slate'}>
                    {event.title}{event.status === 'pending' ? ' (Pending Approval)' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-450 dark:text-zinc-500">
                <ChevronRight className="w-4.5 h-4.5 rotate-90" />
              </div>
            </div>

          </div>
          {selectedEvent && (
            <div className="space-y-6 sm:space-y-8">
              {/* Event Card */}
              <div className={`rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border p-4 sm:p-5 transition-all ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                   <div className={`w-full sm:w-28 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm relative ${theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-100'}`}>
                     <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-auto object-cover" />
                   </div>
                   <div className="flex-1 text-center sm:text-left min-w-0 pt-1">
                      <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start mb-2 sm:mb-3">
                        <h3 className="text-xl sm:text-2xl font-black text-adv-slate dark:text-white truncate">{selectedEvent.title}</h3>
                        {selectedEvent.dateType === 'booking' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-adv-orange border border-orange-500/20 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {lang === 'lo' ? 'ກິດຈະກຳແບບຈອງລາຍວັນ' : 'Booking Experience'}
                          </span>
                        )}
                        {selectedEvent.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[9px] sm:text-[10px] font-black uppercase tracking-widest shrink-0">
                            Pending Approval
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 sm:gap-5 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold">
                         <span className="flex items-center gap-1.5 sm:gap-2">
                           <CalendarIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-adv-orange shrink-0" /> 
                           {selectedEvent.dateType === 'booking' 
                             ? `${selectedEvent.bookingStartDate || selectedEvent.date} to ${selectedEvent.bookingEndDate || 'Ongoing'} • Daily Sessions` 
                             : selectedEvent.date}
                         </span>
                         <span className="flex items-center gap-1.5 sm:gap-2"><MapPin className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-adv-orange shrink-0" /> {selectedEvent.location}</span>
                      </div>
                   </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="w-full">
                <button 
                  onClick={() => setShowScanner(true)}
                  className="w-full flex items-center justify-center gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] bg-adv-slate dark:bg-white text-white dark:text-adv-slate font-bold hover:opacity-95 transition-all shadow-md active:scale-[0.98] transform cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-adv-orange animate-pulse" />
                  <span className="text-sm sm:text-base">{t.scanQr}</span>
                </button>
              </div>

              {/* Staff Scanner Access Links Card */}
              <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border transition-all ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-gray-100/50 dark:border-zinc-800/50">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Link2 className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold">{t.staffScannerLinks}</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium max-w-xl">
                      {t.staffScannerDesc}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateStaffModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.createStaffLink}</span>
                  </button>
                </div>

                {/* Staff Link Items List */}
                <div className="space-y-2">
                  {staffLinks.filter(l => String(l.eventId) === String(selectedEvent.id)).length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 font-medium">
                      {t.noStaffLinks}
                    </div>
                  ) : (
                    staffLinks.filter(l => String(l.eventId) === String(selectedEvent.id)).map((link) => (
                      <div
                        key={link.id}
                        className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                          theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-50/80 border-gray-100'
                        }`}
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black truncate">{link.staffLabel}</span>
                          {link.createdAt && (
                            <span className="text-[10px] text-gray-400 font-medium hidden md:inline-block shrink-0">
                              • {lang === 'lo' ? 'ສ້າງເມື່ອ' : 'Created'}: {link.createdAt}
                            </span>
            )}
                        </div>

                         <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyStaffLink(link.url)}
                            title={t.copyLink}
                            className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              theme === 'dark' 
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' 
                                : 'bg-white border-gray-200 text-gray-700 hover:text-adv-slate'
                            }`}
                          >
                            <Copy className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] hidden sm:inline">{t.copyLink}</span>
                          </button>

                          <button
                            onClick={() => setActiveStaffQrModal(link)}
                            title={t.showQrCode}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              theme === 'dark' 
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' 
                                : 'bg-white border-gray-200 text-gray-700 hover:text-adv-slate'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                          </button>

                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t.openScanner}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleRevokeStaffLink(link.id)}
                            title={t.revoke}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
            )}
                </div>
               </div>

               {/* Coupons & Discounts Management (Manage existing coupons created with event) */}
              <ManageCouponsSection
                eventId={String(selectedEvent.id)}
                coupons={selectedEvent.coupons || []}
                onUpdateCoupons={handleUpdateEventCoupons}
                theme={theme}
                lang={lang}
              />

              {selectedEvent.dateType === 'booking' ? (
                <BookingDayManagement
                  event={selectedEvent}
                  attendees={eventAttendees}
                  onToggleCheckin={(ticketId, status, staffLabel) => setCheckinStatus(ticketId, status, staffLabel)}
                  onAddAttendee={(att) => addAttendee(att)}
                  onRescheduleAttendee={(ticketId, newDate, newSlot) => rescheduleBooking(ticketId, newDate, newSlot)}
                  theme={theme}
                  lang={lang}
                  onOpenScanner={() => setShowScanner(true)}
                />
              ) : (
                <>
                  {/* Seating Map (Only visible if event has one) */}
                  {(selectedEvent.hasSeating === true || String(selectedEvent.hasSeating) === 'true') && (
                <div className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border transition-all ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
                }`}>
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                       <h4 className="text-base sm:text-lg font-bold">{t.seatingConfig}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium tracking-tight">{t.seatingDesc}</p>
                  </div>
                  
                  <div className={`relative w-full rounded-2xl border overflow-hidden p-4 sm:p-6 flex flex-col items-center group transition-colors ${
                    theme === 'dark' ? 'bg-zinc-950/40 border-zinc-850' : 'bg-[#F9FAFB] border-gray-100'
                  }`}>
                    <img 
                      src={selectedEvent.zoneImage || '/src/assets/images/seating_map_layout_1782798956470.jpg'} 
                      alt="Seating Map Layout" 
                      className="w-full h-auto max-h-[240px] sm:max-h-[320px] object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Interactive Hint / Action Control */}
                    <div className="absolute bottom-2.5 right-2.5 sm:inset-0 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-center justify-center sm:backdrop-blur-[2px] z-10">
                       <button 
                        type="button"
                        onClick={() => setShowFullMap(true)}
                        className="px-3 py-1.5 sm:px-5 sm:py-2 bg-white/95 dark:bg-zinc-900/95 sm:bg-white text-adv-slate dark:text-white sm:text-adv-slate rounded-xl font-bold text-xs shadow-md sm:shadow-xl border border-gray-200 dark:border-zinc-750 sm:border-gray-100 flex items-center gap-1.5 sm:gap-2 hover:scale-105 active:scale-95 transition-transform cursor-pointer backdrop-blur-sm"
                       >
                          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-adv-orange shrink-0" />
                          <span>{t.viewFullMap}</span>
                       </button>
                    </div>
                  </div>
                </div>
            )}

              {/* Ticket Buyers & Registration Directory with Custom Questionnaire Responses */}
              <div className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border transition-all ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}>
                {/* Header & Primary Actions */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <h4 className="text-base sm:text-lg font-black">{t.attendeeDirectory}</h4>
                    </div>
                    <p className="text-xs text-gray-400 font-medium max-w-2xl">
                      {t.attendeeDirectoryDesc}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={attendeeSearchQuery}
                        onChange={(e) => {
                          setAttendeeSearchQuery(e.target.value);
                          setAttendeeListPage(1);
                        }}
                        placeholder={lang === 'lo' ? 'ຄົ້ນຫາຊື່, ອີເມວ, ເບີໂທ, ຫຼື ລະຫັດປີ້...' : 'Search name, email, phone, or ticket ID...'}
                        className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-gray-50 border-gray-200 text-adv-slate placeholder-gray-400'
                        }`}
                      />
                      {attendeeSearchQuery && (
                        <button
                          onClick={() => { setAttendeeSearchQuery(''); setAttendeeListPage(1); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Tier selector */}
                    {selectedEvent.tiers && selectedEvent.tiers.length > 1 && (
                      <div className="w-full sm:w-48 shrink-0">
                        <select
                          value={attendeeTierFilter}
                          onChange={(e) => {
                            setAttendeeTierFilter(e.target.value);
                            setAttendeeListPage(1);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                          }`}
                        >
                          <option value="all">{lang === 'lo' ? 'ທຸກລະດັບປີ້ (Tiers)' : 'All Ticket Tiers'}</option>
                          {selectedEvent.tiers.map((tItem: any, idx: number) => (
                            <option key={idx} value={tItem.name}>{tItem.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Export to Excel Button */}
                    <button
                      onClick={handleExportToExcel}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-[1.02] active:scale-[0.98] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-emerald-500/20 shadow-sm shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Export Excel' : 'ສົ່ງອອກ Excel'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Tabs & Filters */}
                <div className="mb-5">
                  {/* Status Pills */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 p-1.5 bg-gray-100/80 dark:bg-zinc-950/60 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-zinc-850">
                    <button
                      onClick={() => { setAttendeeFilter('all'); setAttendeeListPage(1); }}
                      className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-2 text-center h-full min-h-[36px] sm:min-h-[44px] ${
                        attendeeFilter === 'all'
                          ? 'bg-adv-orange text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="whitespace-normal leading-tight text-left flex-1 min-w-0">{t.allBuyers}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${attendeeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}>
                        {totalAttendeesCount}
                      </span>
                    </button>

                    <button
                      onClick={() => { setAttendeeFilter('checked_in'); setAttendeeListPage(1); }}
                      className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-2 text-center h-full min-h-[36px] sm:min-h-[44px] ${
                        attendeeFilter === 'checked_in'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 flex-1 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-normal leading-tight text-left min-w-0">{t.checkedIn}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${attendeeFilter === 'checked_in' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                        {checkedInCount}
                      </span>
                    </button>

                    <button
                      onClick={() => { setAttendeeFilter('pending'); setAttendeeListPage(1); }}
                      className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-2 text-center h-full min-h-[36px] sm:min-h-[44px] ${
                        attendeeFilter === 'pending'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-normal leading-tight text-left min-w-0">{t.pendingGate}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${attendeeFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                        {pendingCount}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Attendees List Cards */}
                <div className="space-y-3.5">
                  {filteredAttendees.length === 0 ? (
                    <div className={`py-12 px-4 text-center rounded-2xl border border-dashed ${
                      theme === 'dark' ? 'border-zinc-800 text-zinc-400' : 'border-gray-200 text-gray-500'
                    }`}>
                      <Users className="w-10 h-10 mx-auto mb-2 text-gray-400 opacity-60" />
                      <p className="font-bold text-sm mb-1">{t.noAttendeesFound}</p>
                      <p className="text-xs text-gray-400">
                        {attendeeSearchQuery ? (lang === 'lo' ? 'ລອງປ່ຽນຄຳຄົ້ນຫາໃໝ່' : 'Try adjusting your search terms') : (lang === 'lo' ? 'ຍັງບໍ່ມີຂໍ້ມູນໃນໝວດນີ້' : 'No attendees in this category yet')}
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const ATTENDEES_PER_PAGE = 10;
                      const totalAttendeePages = Math.ceil(filteredAttendees.length / ATTENDEES_PER_PAGE) || 1;
                      const safePage = Math.min(attendeeListPage, totalAttendeePages);
                      const paginatedAttendees = filteredAttendees.slice((safePage - 1) * ATTENDEES_PER_PAGE, safePage * ATTENDEES_PER_PAGE);

                      return (
                        <>
                          {paginatedAttendees.map((att, index) => {
                            const answerEntries = att.customAnswers ? Object.entries(att.customAnswers).filter(([_, val]) => val !== undefined && val !== null && val !== '') : [];
                            const answerCount = answerEntries.length;

                            return (
                              <motion.div
                                key={att.id || att.ticketId || index}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] border transition-all ${
                                  theme === 'dark'
                                    ? 'bg-zinc-950/50 border-zinc-850 hover:border-orange-500/20'
                                    : 'bg-[#F9FAFB] border-gray-150 hover:border-orange-200 hover:shadow-xs'
                                }`}
                              >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                  {/* Left: Info */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-1">
                                      <span className="text-sm sm:text-base font-black truncate max-w-[200px] sm:max-w-none">
                                        {att.attendeeName || `${att.firstName || ''} ${att.lastName || ''}`.trim() || 'Attendee'}
                                      </span>
                                      <span className="w-fit px-2 py-0.5 bg-adv-slate dark:bg-zinc-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        {att.ticketType || 'Standard'}
                                      </span>
                                    </div>

                                    {/* Contact and Ticket ID (Removed Order number) */}
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-x-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2.5 sm:mb-2">
                                      {att.email && (
                                        <span className="flex items-center gap-1.5 sm:gap-1 truncate">
                                          <Mail className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-adv-orange shrink-0" />
                                          <span>{att.email}</span>
                                        </span>
            )}
                                      {att.phone && (
                                        <span className="flex items-center gap-1.5 sm:gap-1 text-emerald-600 dark:text-emerald-400 font-bold truncate">
                                          <Phone className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-emerald-500 shrink-0" />
                                          <span>{att.phone}</span>
                                        </span>
            )}
                                      <span className="text-[11px] font-mono text-gray-400 dark:text-zinc-500 flex items-center gap-1.5 sm:gap-0">
                                        Ticket ID: <span className="font-bold text-adv-slate dark:text-white sm:ml-1">{att.ticketId || att.id}</span>
                                      </span>
                                    </div>

                                    {/* Detail: Price & Time strictly as hh:mm (Removed detail zone, row, seat) */}
                                    <div className="flex flex-row flex-wrap items-center gap-2.5 text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider">
                                      {att.price && (
                                        <span className="text-adv-orange font-mono font-black">{att.price}</span>
            )}
                                      {(att.checkedInTime && att.isCheckedIn) && (
                                        <>
                                          {att.price && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />}
                                          <span className="flex items-center gap-1 font-mono font-bold lowercase text-emerald-500">
                                            <Clock className="w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0" />
                                            <span>{formatTimeToHHMM(att.checkedInTime, att.checkedInTimestamp)}</span>
                                          </span>
                                        </>
                                      )}
                                    </div>
                                   </div>

                                  {/* Right: Actions */}
                                  <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200/60 dark:border-zinc-850 shrink-0 w-full sm:w-auto">
                                     <div className={`grid ${answerCount > 0 ? 'grid-cols-2' : 'grid-cols-1'} sm:flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto`}>
                                    {/* View Full Answers Button (Always accessible to organizer) */}
                                    {answerCount > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAttendeeForAnswers(att)}
                                        className="w-full sm:w-[138px] h-9 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-adv-orange border border-orange-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-95 shadow-2xs"
                                      >
                                        <Eye className="w-3.5 h-3.5 shrink-0" />
                                        <span>{t.viewAnswers}</span>
                                      </button>
                                    ) : null}

                                    {/* Check-in Status / Quick Check-in */}
                                    {att.isCheckedIn ? (
                                      <div 
                                        className="w-full sm:w-[138px] h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs select-none shrink-0 whitespace-nowrap"
                                        title={att.checkedInTime ? `${t.checkedIn} @ ${att.checkedInTime}` : t.checkedIn}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span>{t.checkedIn}</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCheckinConfirmAttendee(att);
                                        }}
                                        className="w-full sm:w-[138px] h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>{t.quickCheckin}</span>
                                      </button>
            )}
                                  </div>
                                  </div>
                                   </div>
                               </motion.div>
                            );
                          })}

                          {/* Pagination */}
                          {totalAttendeePages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-4 border-t border-gray-100 dark:border-zinc-800/80">
                              <div className="text-xs font-bold text-gray-400">
                                {lang === 'en'
                                  ? `Page ${safePage} of ${totalAttendeePages} (${filteredAttendees.length} total buyers)`
                                  : `ໜ້າ ${safePage} ຈາກ ${totalAttendeePages} (ທັງໝົດ ${filteredAttendees.length} ຜູ້ຊື້)`}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setAttendeeListPage(prev => Math.max(prev - 1, 1))}
                                  disabled={safePage === 1}
                                  className="p-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalAttendeePages }, (_, i) => i + 1).map(p => {
                                  // Show first page, last page, current page, and pages immediately around current
                                  if (p === 1 || p === totalAttendeePages || (p >= safePage - 1 && p <= safePage + 1)) {
                                    return (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => setAttendeeListPage(p)}
                                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                          safePage === p
                                            ? 'bg-adv-orange text-white shadow-sm'
                                            : 'border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                        }`}
                                      >
                                        {p}
                                      </button>
                                    );
                                  }
                                  
                                  // Show ellipsis for gaps
                                  if (p === safePage - 2 || p === safePage + 2) {
                                    return <span key={p} className="text-gray-400 dark:text-zinc-500 font-bold px-1">...</span>;
                                  }
                                  
                                  return null;
                                })}

                                <button
                                  type="button"
                                  onClick={() => setAttendeeListPage(prev => Math.min(prev + 1, totalAttendeePages))}
                                  disabled={safePage === totalAttendeePages}
                                  className="p-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
            )}
                        </>
                      );
                    })()
            )}
            </div>
                </div>
                </>
              )}
              </div>
            )}
        </div>

        <div className={activeTab === 'payouts' ? 'block' : 'hidden'}>
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 mb-4">
              <div>
                <h2 className={`text-xl sm:text-3xl font-black transition-colors tracking-tight ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                  {t.payouts || (lang === 'lo' ? 'ໃບບິນເບີກຈ່າຍ' : 'Payout Bills')}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5 sm:mt-1">{lang === 'lo' ? 'ຈັດການຂໍ້ມູນທະນາຄານ ແລະ ເບິ່ງປະຫວັດການເບີກຈ່າຍ.' : 'Manage your bank details and view past payouts.'}</p>
              </div>
            </div>

            {/* Claimable Event Revenue Card */}
            <div className={`p-3.5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-2xs sm:shadow-sm border transition-all ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-100'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                    isBankInCoolingPeriod
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className={`text-xs sm:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                        {lang === 'lo' ? 'ລາຍຮັບກິດຈະກຳທີ່ສາມາດເບີກໄດ້' : 'Claimable Event Revenue'}
                      </h3>
                      {isBankInCoolingPeriod ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lang === 'lo' ? `ຖືກລັອກ (ເຫຼືອ ${coolingDaysRemaining} ວັນ)` : `Locked (${coolingDaysRemaining}d remaining)`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {lang === 'lo' ? 'ພ້ອມເບີກ' : 'Ready to Claim'}
                        </span>
            )}
                    </div>
                    <p className={`text-lg sm:text-2xl font-black mt-0.5 ${
                      isBankInCoolingPeriod ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {new Intl.NumberFormat('lo-LA').format(unclaimedRevenue)} ₭
                    </p>
                  </div>
                </div>

              </div>
              
              {/* Event-by-Event Claim List */}
              {unclaimedEvents.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className={`font-bold text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                    {lang === 'lo' ? 'ກິດຈະກຳທີ່ສາມາດເບີກຈ່າຍໄດ້' : 'Claimable Events'}
                  </h3>
                  {unclaimedEvents.map(ev => (
                    <div key={ev.id} className={`p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border shadow-sm transition-all ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'
                    }`}>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base">{ev.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-500 text-xs">{ev.date}</span>
                          <span className="text-gray-300 dark:text-zinc-600">•</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {new Intl.NumberFormat('lo-LA').format(ev.amount)} ₭
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenClaimModal(ev)}
                        disabled={isBankInCoolingPeriod}
                        className={`w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                          isBankInCoolingPeriod
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isBankInCoolingPeriod ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            {lang === 'lo' ? 'ລັອກ' : 'Locked'}
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            {lang === 'lo' ? 'ຂໍເບີກຈ່າຍ (OTP)' : 'Claim (OTP)'}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 30-Day Cooling Alert Banner if bank details recently modified */}
              {isBankInCoolingPeriod && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 sm:gap-3 text-amber-700 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-amber-500" />
                  <div className="text-[11px] sm:text-xs">
                    <p className="font-black mb-0.5">
                      {lang === 'lo'
                        ? `ລະບົບປ້ອງກັນ: ຂໍ້ມູນທະນາຄານຫາກໍ່ຖືກແກ້ໄຂ (ສາມາດຂໍເບີກເງິນໄດ້ຫຼັງຈາກ 30 ວັນ)`
                        : `30-Day Security Lock Active: Bank details were recently modified`}
                    </p>
                    <p className="text-gray-600 dark:text-zinc-300 font-medium leading-relaxed">
                      {lang === 'lo'
                        ? `ທ່ານໄດ້ອັບເດດຂໍ້ມູນທະນາຄານເມື່ອ ${daysSinceBankUpdate} ວັນກ່ອນ. ຕາມເງື່ອນໄຂຄວາມປອດໄພ, ຜູ້ຈັດງານຕ້ອງລໍຖ້າໃຫ້ຄົບ 30 ວັນ (ເຫຼືອອີກ ${coolingDaysRemaining} ວັນ, ປົດລັອກວັນທີ ${unlockDate}) ຈຶ່ງຈະສາມາດຂໍເບີກເງິນໄດ້.`
                        : `Bank details were updated ${daysSinceBankUpdate} day(s) ago. According to terms and fraud-prevention policy, organizers who edit bank details must wait 30 days before claiming event money (Unlocks on ${unlockDate}, in ${coolingDaysRemaining} days).`}
                    </p>
                  </div>
                </div>
            )}
            </div>

            {/* Terms & Conditions (Simplified) */}
            <div className="px-2 sm:px-4">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="space-y-2 max-w-3xl">
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                    • {lang === 'lo'
                      ? 'ຫາກຜູ້ຈັດງານມີການແກ້ໄຂຂໍ້ມູນບັນຊີທະນາຄານ ຈະຕ້ອງລໍຖ້າໃຫ້ຄົບ 30 ວັນ ຈຶ່ງຈະສາມາດກົດຂໍເບີກຈ່າຍເງິນກິດຈະກຳໄດ້ ເພື່ອປ້ອງກັນການສໍ້ໂກງ ແລະ ການລັກລອບປ່ຽນບັນຊີ.'
                      : 'If the organizer edits bank details, they must wait 30 days before they can claim event money. This cooling-off lock prevents unauthorized account hijack payouts.'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                    • {lang === 'lo'
                      ? 'ທຸກໆຄັ້ງທີ່ມີການເພີ່ມ ຫຼື ແກ້ໄຂຂໍ້ມູນບັນຊີທະນາຄານ ລະບົບຈະສົ່ງລະຫັດ OTP 6 ຫຼັກ ເພື່ອຢືນຢັນຕົວຕົນຂອງເຈົ້າຂອງບັນຊີຕົວຈິງກ່ອນບັນທຶກ.'
                      : 'Updating bank details strictly requires a 6-digit One-Time Password (OTP) verification sent to the verified organizer device before changes are saved.'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                    • {lang === 'lo'
                      ? 'ການກົດຂໍເບີກຈ່າຍເງິນລາຍຮັບກິດຈະກຳຕ້ອງໄດ້ຮັບການຢືນຢັນດ້ວຍລະຫັດ OTP 6 ຫຼັກ ເພື່ອຮັບປະກັນວ່າເຈົ້າຂອງງານເປັນຜູ້ອະນຸມັດການໂອນເງິນ.'
                      : 'Claiming event money strictly requires 6-digit OTP confirmation to ensure that only the authorized organizer executes the fund transfer.'}
                  </p>
                </div>

                {/* Interactive Testing Simulation Toggle */}
                <div className="flex items-center gap-1.5 self-start bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 px-2 hidden sm:inline">
                    {lang === 'lo' ? 'ທົດສອບ:' : 'Test Sim:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSimulateBankDate(0)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isBankInCoolingPeriod
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                    }`}
                    title="Simulate bank was updated today"
                  >
                    {lang === 'lo' ? 'ອັບເດດມື້ນີ້ (ຖືກລັອກ)' : 'Bank Edit Today (Locked)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateBankDate(35)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      !isBankInCoolingPeriod
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                    }`}
                    title="Simulate bank was updated 35 days ago"
                  >
                    {lang === 'lo' ? '35 ວັນກ່ອນ (ເບີກໄດ້)' : '35 Days Ago (Eligible)'}
                  </button>
                </div>
              </div>
            </div>
            {/* Bank Settings Card */}
            <div className={`p-3.5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-2xs sm:shadow-sm border transition-all ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-3 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}>
                    <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{t.payoutSettings || 'Payout Settings'}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-semibold">{lang === 'lo' ? 'ບ່ອນທີ່ທ່ານຈະໄດ້ຮັບເງິນເບີກຈ່າຍ' : 'Where you receive your event payouts'}</p>
                  </div>
                </div>
                {bankAccount && isEditingBank && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditingBank(false)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
            )}
                {bankAccount && !isEditingBank && (
                  <button 
                    onClick={handleEditBankClick}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      theme === 'dark' 
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {lang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນທະນາຄານ' : 'Edit Bank Details'}
                  </button>
            )}
              </div>

              {isEditingBank || !bankAccount ? (
                <form onSubmit={handleSaveBank} className="space-y-3.5 sm:space-y-5 pt-2 sm:pt-3 border-t border-gray-100 dark:border-zinc-800/60">
                  {/* Notice Banner: OTP verification and 30-day claim lock */}
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-2.5 sm:gap-3 shadow-xs">
                    <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-amber-500" />
                    <div className="text-[11px] sm:text-xs">
                      <p className="font-bold mb-0.5">
                        {lang === 'lo' ? 'ແຈ້ງເຕືອນ: ການອັບເດດຂໍ້ມູນບັນຊີທະນາຄານ' : 'Security Notice: Bank Details Update'}
                      </p>
                      <p className="text-gray-600 dark:text-zinc-300 font-medium leading-relaxed">
                        {lang === 'lo'
                          ? 'ການບັນທຶກຂໍ້ມູນທະນາຄານໃໝ່ຈະຕ້ອງຢືນຢັນດ້ວຍລະຫັດ OTP 6 ຫຼັກ. ຫຼັງຈາກອັບເດດແລ້ວ ລະບົບຈະເລີ່ມໄລຍະລໍຖ້າຄວາມປອດໄພ 30 ວັນ ກ່ອນທີ່ທ່ານຈະສາມາດຂໍເບີກເງິນກິດຈະກຳໄດ້.'
                          : 'Saving new bank details requires 6-digit OTP verification. Once updated, a 30-day security lock will be initiated during which event money claims will be paused.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
                    {/* Bank Dropdown Select */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest block">{lang === 'lo' ? 'ຊື່ທະນາຄານ' : 'Bank Name'}</label>
                      <div className="relative">
                        <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={bankFormData.bankName || ''}
                          onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                          className={`w-full border rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all appearance-none cursor-pointer ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white focus:bg-zinc-900' 
                              : 'bg-gray-50 border-gray-200/80 text-adv-slate focus:bg-white'
                          }`}
                        >
                          <option value="" disabled>-- {lang === 'lo' ? 'ເລືອກທະນາຄານ' : 'Select Bank'} --</option>
                          {LAO_BANKS.map((b) => (
                            <option key={b.id} value={b.name} className={theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}>
                              {b.name} ({b.label})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest block">{lang === 'lo' ? 'ຊື່ບັນຊີ' : 'Account Holder'}</label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Somsack Xayarath"
                          value={bankFormData.accountName || ''}
                          onChange={(e) => setBankFormData({...bankFormData, accountName: e.target.value.replace(/[0-9]/g, '')})}
                          className={`w-full border rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white focus:bg-zinc-900' 
                              : 'bg-gray-50 border-gray-200/80 text-adv-slate focus:bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest block">{lang === 'lo' ? 'ເລກບັນຊີ' : 'Account Number'}</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="e.g. 120-11-00-1234567-001"
                        value={bankFormData.accountNumber || ''}
                        onChange={(e) => setBankFormData({...bankFormData, accountNumber: e.target.value.replace(/\D/g, '')})}
                        className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all ${
                          theme === 'dark' 
                            ? 'bg-zinc-950 border-zinc-800 text-white focus:bg-zinc-900' 
                            : 'bg-gray-50 border-gray-200/80 text-adv-slate focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 pt-1">
                    <button 
                      type="submit"
                      className="px-5 sm:px-8 py-2.5 sm:py-3 bg-adv-slate dark:bg-white text-white dark:text-adv-slate rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {lang === 'lo' ? 'ບັນທຶກ' : 'Save Details'}
                    </button>
                    {bankAccount && (
                      <button 
                        type="button"
                        onClick={() => setIsEditingBank(false)}
                        className={`px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all cursor-pointer ${
                          theme === 'dark' ? 'text-gray-400 hover:bg-zinc-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                      </button>
            )}
                  </div>
                </form>
              ) : (
                <div className={`pt-3 border-t ${theme === 'dark' ? 'border-zinc-800/60' : 'border-gray-100'}`}>
                  <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 ${theme === 'dark' ? 'bg-zinc-950/50' : 'bg-gray-50'}`}>
                    {(() => {
                      const matchedBank = LAO_BANKS.find(b => 
                        b.name.toLowerCase() === bankAccount.bankName.toLowerCase() || 
                        b.label.toLowerCase() === bankAccount.bankName.toLowerCase() ||
                        bankAccount.bankName.toLowerCase().includes(b.id)
                      );
                      return matchedBank?.logo ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-gray-200 dark:border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                          <img src={matchedBank.logo} alt={bankAccount.bankName} className="w-full h-full object-contain rounded-lg" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200/50 dark:border-emerald-800/50">
                          <Building className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h4 className="text-xs sm:text-sm font-black">{bankAccount.bankName}</h4>
                        <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                          {lang === 'lo' ? 'ເຊື່ອມຕໍ່ແລ້ວ' : 'Connected'}
                        </span>
                        {isBankInCoolingPeriod && (
                          <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {lang === 'lo' ? `ລັອກເບີກເງິນອີກ ${coolingDaysRemaining} ວັນ` : `Claim locked for ${coolingDaysRemaining}d`}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                        <p className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <span className="text-gray-400 dark:text-zinc-500 font-medium">{lang === 'lo' ? 'ຊື່ບັນຊີ:' : 'Account Name:'}</span>
                          <span className="text-gray-900 dark:text-white font-black">{bankAccount.accountName}</span>
                        </p>
                        <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">•</span>
                        <p className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <span className="text-gray-400 dark:text-zinc-500 font-medium">{lang === 'lo' ? 'ເລກບັນຊີ:' : 'Account Number:'}</span>
                          <span className="text-gray-900 dark:text-white font-black">{bankAccount.accountNumber}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            )}
            </div>

            <div className="pt-1 sm:pt-2">
              <h3 className={`text-base sm:text-lg font-bold mb-2.5 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{lang === 'lo' ? 'ປະຫວັດການເບີກຈ່າຍ' : 'Payout History'}</h3>
              {myPayouts.length === 0 ? (
                <div className={`text-center py-10 sm:py-20 rounded-2xl sm:rounded-[2rem] border shadow-xs ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-100'}`}>
                  <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
                  <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-500'}`}>{t.payoutsEmpty || 'No payouts yet'}</h3>
                  <p className="text-[11px] sm:text-sm text-gray-400 font-medium max-w-sm mx-auto px-4">
                    Once your event is completed and processed by the admin, your payout receipts will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {myPayouts.map((bill, index) => (
                    <div key={index} className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-[1.5rem] shadow-2xs sm:shadow-sm border flex flex-col sm:flex-row gap-3 sm:gap-5 transition-all ${
                      theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 hover:border-adv-orange/30' : 'bg-white border-gray-100 hover:border-adv-orange/30'
                    }`}>
                      <div className="flex flex-row gap-3 sm:gap-5 flex-1 min-w-0">
                        <div className="w-20 sm:w-24 h-28 sm:h-auto shrink-0 rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-xs relative group cursor-pointer bg-gray-50 dark:bg-zinc-950 flex items-center justify-center" onClick={() => setPayoutImagePreview(bill.receiptUrl)}>
                          <img src={bill.receiptUrl} alt="Admin Submit Receipt" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
                          {bill.status.toLowerCase() === 'pending' ? (
                            <>
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                              <span className="text-[9px] sm:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider sm:tracking-widest">{lang === 'lo' ? 'ກຳລັງດຳເນີນການ' : 'Pending'}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                              <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider sm:tracking-widest">{lang === 'lo' ? 'ສຳເລັດ' : 'Completed'}</span>
                            </>
                          )}
                          
                          <div 
                            className="relative ml-0.5 flex items-center"
                            onMouseEnter={() => setActiveTxTooltip(bill.id)}
                            onMouseLeave={() => setActiveTxTooltip(null)}
                            onTouchStart={() => setActiveTxTooltip(bill.id)}
                            onTouchEnd={() => setActiveTxTooltip(null)}
                            onTouchCancel={() => setActiveTxTooltip(null)}
                          >
                            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 hover:text-adv-slate dark:hover:text-white transition-colors cursor-help" />
                              
                            <div className={`absolute -left-6 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-2.5 transition-all duration-200 w-56 p-3 bg-gray-900 dark:bg-zinc-800 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none before:content-[''] before:absolute before:top-full before:left-[30px] sm:before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-900 dark:before:border-t-zinc-800 ${activeTxTooltip === bill.id ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                              <p className="font-bold mb-1">{lang === 'lo' ? 'ລາຍລະອຽດທຸລະກຳ' : 'Transaction Details'}</p>
                              <div className="space-y-1 mt-2 text-[11px]">
                                {bill.status.toLowerCase() !== 'pending' && (<p className="text-gray-300 flex justify-between"><span className="text-gray-400">Ref:</span> <span className="font-mono text-gray-100">{bill.reference || bill.id}</span></p>)}
                                <p className="text-gray-300 flex justify-between"><span className="text-gray-400">Status:</span> <span className={bill.status.toLowerCase() === 'pending' ? "text-amber-400" : "text-emerald-400"}>{bill.status}</span></p>
                                <p className="text-gray-300 flex justify-between gap-2"><span className="text-gray-400 shrink-0">{lang === 'lo' ? 'ຊື່ບັນຊີ:' : 'Account Name:'}</span> <span className="font-bold text-gray-100 truncate text-right">{bill.accountName || bankAccount?.accountName || 'Sirithida Souksavat'}</span></p>
                                <p className="text-gray-300 flex justify-between gap-2"><span className="text-gray-400 shrink-0">{lang === 'lo' ? 'ເລກບັນຊີ:' : 'Account No:'}</span> <span className="font-mono text-gray-100 truncate text-right">{bill.account}</span></p>
                              </div>
                            </div>

                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 ml-auto">{bill.date}</span>
                        </div>
                        <h4 className={`text-sm sm:text-base font-bold sm:font-black mb-1 line-clamp-1 ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{bill.event}</h4>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs">
                          <p className="text-gray-500 font-medium flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                            <span className="text-adv-slate dark:text-zinc-200 font-bold">{bill.accountName || bankAccount?.accountName || 'Sirithida Souksavat'}</span>
                          </p>
                          <span className="text-gray-300 dark:text-zinc-700 hidden sm:inline">•</span>
                          <p className="text-gray-500 font-medium flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                            <span className="font-mono text-adv-slate dark:text-zinc-200 font-bold">{bill.account}</span>
                          </p>
                        </div>
                        
                        </div>
                      </div>
                      
                      <div className={`sm:w-56 p-2.5 sm:p-4 rounded-xl flex flex-col justify-center border ${
                        theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/50' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ຍອດລວມ' : 'Gross'}</p>
                          <p className="text-[11px] sm:text-xs font-bold text-gray-500">{new Intl.NumberFormat('lo-LA').format(bill.grossAmount)} ₭</p>
                        </div>
                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ຄ່າທຳນຽມ' : 'Fee'}</p>
                          <p className="text-[11px] sm:text-xs font-bold text-red-500">-{new Intl.NumberFormat('lo-LA').format(bill.platformFee)} ₭</p>
                        </div>
                        <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-zinc-800/80 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
                          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0 sm:mb-1">{lang === 'lo' ? 'ຮັບເງິນສຸດທິ' : 'Net Payout'}</p>
                          <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('lo-LA').format(bill.amount)} ₭</p>
                    </div>
                        </div>
                      </div>
                  ))}
                </div>
            )}
              </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFullMap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-6 lg:p-8 overflow-y-auto"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullMap(false)}
              className="absolute inset-0 bg-zinc-950/80 dark:bg-zinc-950/90 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`relative w-full max-w-4xl rounded-3xl sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border transition-colors ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
            >
              {/* Header */}
              <div className={`p-5 sm:p-8 border-b flex items-center justify-between transition-colors ${
                theme === 'dark' ? 'border-zinc-800' : 'border-gray-50'
              }`}>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-black truncate uppercase tracking-tight">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-gray-400 font-bold">{t.seatingConfig}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFullMap(false)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all group shrink-0 ${
                    theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:text-adv-orange hover:bg-zinc-700' : 'bg-gray-50 text-gray-400 hover:text-adv-orange hover:bg-orange-50'
                  }`}
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              {/* Map Container */}
              <div className={`flex-1 overflow-auto p-4 sm:p-12 flex items-center justify-center transition-colors ${
                theme === 'dark' ? 'bg-zinc-950/40' : 'bg-[#F9FAFB]'
              }`}>
                <img 
                  src={selectedEvent.zoneImage || '/src/assets/images/seating_map_layout_1782798956470.jpg'} 
                  alt="Seating Map Layout" 
                  className={`max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-2xl sm:rounded-3xl shadow-md border ${
                    theme === 'dark' ? 'border-zinc-850' : 'border-gray-100'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Footer */}
              <div className={`p-5 sm:p-8 border-t flex items-center justify-end transition-colors ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-50'
              }`}>
                <button 
                  onClick={() => setShowFullMap(false)}
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-adv-slate dark:bg-white text-white dark:text-adv-slate rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md w-full sm:w-auto"
                >
                  {t.closeDashboard}
                </button>
              </div>
            </motion.div>
          </motion.div>
            )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`rounded-[2.5rem] overflow-hidden w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] border transition-colors ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex items-center justify-between p-6 border-b flex-shrink-0 transition-colors ${
                theme === 'dark' ? 'border-zinc-800' : 'border-gray-50'
              }`}>
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Camera className="w-6 h-6 text-adv-orange animate-pulse" />
                  {t.entryScanner}
                </h3>
                <button 
                  onClick={() => { setShowScanner(false); setScanResult(null); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-gray-50 text-gray-400 hover:text-adv-slate'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className={`p-6 sm:p-8 relative flex-1 overflow-y-auto transition-colors ${
                theme === 'dark' ? 'bg-zinc-950/40' : 'bg-[#F9FAFB]'
              }`}>
                <div className={`rounded-3xl overflow-hidden border-4 shadow-lg relative aspect-square ${
                  theme === 'dark' ? 'border-zinc-800' : 'border-white'
                }`}>
                  {!scannerError && typeof window !== 'undefined' && window.navigator && window.navigator.mediaDevices && (
                    <React.Suspense fallback={
                      <div className={`absolute inset-0 flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
                        <Loader2 className="w-8 h-8 animate-spin text-adv-orange" />
                      </div>
                    }>
                      <LazyScanner 
                        onScan={(result) => result && result.length > 0 && handleScan(result[0].rawValue)}
                        onError={(error) => {
                          const errorMessage = error instanceof Error ? error.message : String(error);
                          console.warn('Camera scanner warning (safe handling):', errorMessage);
                          
                          if (errorMessage.toLowerCase().includes('not allowed') || 
                              errorMessage.toLowerCase().includes('permission') || 
                              errorMessage.toLowerCase().includes('denied') || 
                              errorMessage.toLowerCase().includes('restricted')) {
                            setScannerError(lang === 'en' 
                              ? 'Camera permission is restricted or denied in this frame. Please use our instant scan simulator or enter the ticket code below!'
                              : 'ການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບຖືກຈຳກັດ. ກະລຸນາໃຊ້ເຄື່ອງຈຳລອງການສະແກນ ຫຼື ປ້ອນລະຫັດປີ້ຢູ່ດ້ານລຸ່ມ!');
                          } else {
                            setScannerError(errorMessage || t.accessDenied);
                          }
                        }}
                      />
                    </React.Suspense>
            )}
                  
                  {scannerError && (
                    <div className={`absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 transition-colors ${
                      theme === 'dark' ? 'bg-zinc-900/95' : 'bg-white/95'
                    }`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border ${
                        theme === 'dark' ? 'bg-orange-500/10 text-adv-orange border-orange-500/20' : 'bg-orange-50 text-adv-orange border-orange-100'
                      }`}>
                        <AlertCircle className="w-7 h-7 animate-pulse" />
                      </div>
                      <h4 className={`text-lg font-black uppercase tracking-tight mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{t.scannerError}</h4>
                      <p className="text-gray-400 mb-6 font-bold text-xs leading-relaxed max-w-xs">{scannerError}</p>
                      <div className="flex flex-col gap-2 w-full max-w-[240px]">
                        <button 
                          onClick={() => {
                            setScannerError(null);
                            handleSimulation();
                          }}
                          className="px-6 py-3.5 rounded-xl bg-adv-orange text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          {t.simulateScan}
                        </button>
                        <button 
                          onClick={() => setScannerError(null)}
                          className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-colors ${
                            theme === 'dark' ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-850' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {t.resetScanner}
                        </button>
                      </div>
                    </div>
            )}
                  <div className="absolute inset-0 pointer-events-none border-2 border-adv-orange/30 rounded-2xl m-10">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-adv-orange -mt-1 -ml-1"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-adv-orange -mt-1 -mr-1"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-adv-orange -mb-1 -ml-1"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-adv-orange -mb-1 -mr-1"></div>
                  </div>
                </div>

                <AnimatePresence>
                  {scanResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`absolute inset-0 z-30 p-4 flex flex-col justify-between overflow-y-auto transition-colors ${
                        theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white'
                      }`}
                    >
                      <div className="flex-1 space-y-2.5">
                        {/* Status Header */}
                        <div className={`flex items-center gap-2 pb-2.5 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-100'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            scanResult.alreadyScanned
                              ? 'bg-amber-500/10 text-amber-500'
                              : theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-500'
                          }`}>
                            {scanResult.alreadyScanned ? (
                              <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5" />
            )}
                          </div>
                          <div>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              scanResult.alreadyScanned
                                ? 'bg-amber-500/15 text-amber-600'
                                : theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {scanResult.alreadyScanned 
                                ? (lang === 'en' ? 'Already Scanned / Checked In' : 'ສະແກນແລ້ວ / ເຊັກອິນແລ້ວ') 
                                : t.validTicket}
                            </span>
                            <h4 className="text-xs font-bold mt-0.5">{t.ticketDetails}</h4>
                          </div>
                        </div>

                        {/* Compact card layout */}
                        <div className={`p-3 rounded-xl border space-y-2 text-[11px] transition-colors ${
                          theme === 'dark' ? 'bg-zinc-950/40 border-zinc-850' : 'bg-gray-50/80 border-gray-100'
                        }`}>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.attendee}</span>
                              <span className="font-extrabold block truncate text-adv-slate dark:text-zinc-200">{scanResult.attendeeName}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.ticketCode}</span>
                              <span className="font-mono font-bold block truncate text-adv-slate dark:text-zinc-200">{scanResult.id}</span>
                            </div>
                          </div>

                          <div className="border-t border-gray-200/40 dark:border-zinc-800/60 pt-2 grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.zone}</span>
                              <span className="font-bold block truncate text-xs text-adv-slate dark:text-zinc-300">{scanResult.zone}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.seat}</span>
                              <span className="font-bold block truncate text-xs text-adv-slate dark:text-zinc-300">{scanResult.seat}</span>
                            </div>
                          </div>

                          <div className="border-t border-gray-200/40 dark:border-zinc-800/60 pt-2">
                            <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.email}</span>
                            <span className="font-semibold block truncate text-xs text-gray-500 dark:text-zinc-400">{scanResult.email}</span>
                          </div>

                          <div className="border-t border-gray-200/40 dark:border-zinc-800/60 pt-2 grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.price}</span>
                              <span className="font-black text-adv-orange block">{scanResult.price}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.scannedAt}</span>
                              <span className="font-bold text-gray-500 block">Just now</span>
                            </div>
                          </div>
                      </div>
                      </div>

                      <div className={`mt-4 flex gap-2 flex-shrink-0 pt-3 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-100'}`}>
                        <button 
                          onClick={() => setScanResult(null)}
                          className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest ${
                            theme === 'dark' ? 'bg-zinc-850 text-zinc-300 hover:bg-zinc-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-150'
                          }`}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleConfirmEntry}
                          className="flex-[2] py-2.5 rounded-xl bg-adv-orange text-white font-black hover:opacity-95 transition-all text-[10px] uppercase tracking-widest shadow-md"
                        >
                          {t.confirmEntry}
                        </button>
                      </div>
                    </motion.div>
            )}
                </AnimatePresence>

                {/* Manual Check-in and Simulator Controls */}
                <div className={`mt-6 pt-6 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.manualEntry}</span>
                    <span className={`h-px flex-1 ${theme === 'dark' ? 'bg-zinc-850' : 'bg-gray-100'}`} />
                  </div>
                  
                  <form onSubmit={handleManualCheckIn} className="flex gap-2 mb-3">
                    <input 
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder={t.enterTicketCode}
                      className={`flex-1 px-4 py-3 rounded-xl border text-xs font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
                      }`}
                    />
                    <button 
                      type="submit"
                      className="px-5 py-3 rounded-xl bg-adv-slate dark:bg-white text-white dark:text-adv-slate text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all"
                    >
                      {t.checkIn}
                    </button>
                  </form>

                  <div className={`rounded-2xl p-4 border transition-colors ${
                    theme === 'dark' ? 'bg-orange-950/10 border-orange-900/10' : 'bg-orange-50/50 border-orange-50'
                  }`}>
                    <p className="text-[10px] text-gray-400 font-bold mb-2 leading-relaxed">
                      {t.simulateDesc}
                    </p>
                    <button 
                      type="button"
                      onClick={handleSimulation}
                      className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-adv-orange hover:bg-zinc-850' : 'bg-white border-adv-orange/20 text-adv-orange hover:bg-orange-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-adv-orange animate-pulse shrink-0" />
                      {t.simulateScan}
                    </button>
                  </div>
                                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Create Staff Link Modal */}
      <AnimatePresence>
        {showCreateStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCreateStaffModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl transition-colors ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black">{t.createStaffLink}</h3>
                </div>
                <button
                  onClick={() => setShowCreateStaffModal(false)}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {t.staffNameLabel}
                  </label>
                  <input
                    type="text"
                    value={newStaffLabel}
                    onChange={(e) => setNewStaffLabel(e.target.value)}
                    placeholder={t.staffNamePlaceholder}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-normal font-medium">
                  {t.staffScannerDesc}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateStaffModal(false)}
                    className="px-3.5 py-2 rounded-xl font-bold text-xs border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateStaffLink}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {t.generateLink}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
            )}
      </AnimatePresence>

      {/* Staff QR Code View Modal */}
      <AnimatePresence>
        {activeStaffQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveStaffQrModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xs p-4 sm:p-5 rounded-2xl border shadow-2xl text-center transition-colors ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
            >
              <div className="flex justify-end mb-1">
                <button
                  onClick={() => setActiveStaffQrModal(null)}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-4 h-4" />
              </div>

              <h3 className="text-sm font-black truncate">{activeStaffQrModal.staffLabel}</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 mb-3">
                {t.qrCodeModalDesc}
              </p>

              <div className="p-2.5 bg-white rounded-xl shadow-inner border border-gray-200 w-fit mx-auto mb-3">
                <QRCodeSVG
                  value={activeStaffQrModal.url}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleCopyStaffLink(activeStaffQrModal.url)}
                  className="w-full py-3 rounded-2xl bg-adv-orange text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t.copyLink}</span>
                </button>

                <a
                  href={activeStaffQrModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl border border-gray-200 dark:border-zinc-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-adv-orange" />
                  <span>{t.openScanner}</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
            )}
      </AnimatePresence>

      {/* Toast Container with 5-Second Auto-Dismiss Indicator */}
      <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
        <AnimatePresence>
          {toastQueue.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              

              
              
              
              
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">{toast.text}</span>
              <button 
                onClick={() => setToastQueue(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Success Toast (Old simple one, keeping it for profile pic but updated style) */}
      <AnimatePresence>
        {showProfilePicSuccess && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">{t.profileUpdated}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Payout Image Preview Modal */}
      <AnimatePresence>
        {payoutImagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setPayoutImagePreview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full h-[80vh] sm:h-[90vh] flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPayoutImagePreview(null)}
                className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={payoutImagePreview} 
                alt="Payout Receipt" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              />
            </motion.div>
          </motion.div>
            )}
      </AnimatePresence>

      {/* Bank Edit 30-Day Limit Confirmation Modal */}
      <AnimatePresence>
        {showBankOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setShowBankOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-2xl border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3 border border-blue-500/20 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>

              <h3 className="text-base sm:text-lg font-black text-center mb-1">
                {lang === 'lo' ? 'ຢືນຢັນລະຫັດ OTP ເພື່ອອັບເດດຂໍ້ມູນທະນາຄານ' : 'Verify OTP to Update Bank Details'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium text-center mb-4 leading-relaxed">
                {lang === 'lo'
                  ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກ ເພື່ອຢືນຢັນການປ່ຽນແປງຂໍ້ມູນບັນຊີທະນາຄານຮັບເງິນຂອງທ່ານ'
                  : 'Enter the 6-digit OTP code to authorize changes to your receiving bank account.'}
              </p>

              {/* Bank Details Preview Box */}
              <div className={`p-3.5 rounded-xl sm:rounded-2xl mb-4 space-y-1.5 text-xs border ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-gray-150'
              }`}>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ທະນາຄານ:' : 'Bank:'}</span>
                  <span className="font-black">{bankFormData.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຊື່ບັນຊີ:' : 'Account Holder:'}</span>
                  <span className="font-black">{bankFormData.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ເລກບັນຊີ:' : 'Account No:'}</span>
                  <span className="font-mono font-black text-adv-orange">{bankFormData.accountNumber}</span>
                </div>
              </div>

              {/* 30-Day Cooling Notice Warning Box */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium leading-relaxed mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  {lang === 'lo'
                    ? 'ຫຼັງຈາກບັນທຶກແລ້ວ ລະບົບຈະເລີ່ມໄລຍະລໍຖ້າ 30 ວັນ ກ່ອນຈະສາມາດຂໍເບີກເງິນກິດຈະກຳໄດ້ ເພື່ອຄວາມປອດໄພ.'
                    : 'Notice: Saving this update will initiate a 30-day security lock on claiming event money.'}
                </span>
              </div>

              {/* Validation Errors */}
              {claimOtpError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-red-500 text-[11px] font-bold">{claimOtpError}</span>
                </div>
              )}

              {/* Input Section - Both OTP and 2FA */}
              <div className="mb-5 space-y-4">
                
                {/* OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {lang === 'lo' ? '1. ລະຫັດ OTP (SMS)' : '1. SMS OTP Code'}
                    </label>
                    {/* Demo Helper Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setClaimOtpCode(expectedClaimOtp);
                        setClaimOtpError('');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[9px] hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      Fill: {expectedClaimOtp}
                    </button>
                  </div>
                  <OtpInput
                    length={6}
                    autoFocus={false}
                    value={claimOtpCode}
                    onChange={(val) => {
                      setClaimOtpCode(val);
                      setClaimOtpError('');
                    }}
                    error={!!claimOtpError && claimOtpCode.length < 6}
                  />
                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <div className="text-[10px] text-gray-400 font-medium">
                      {claimOtpCountdown > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {lang === 'lo' ? `ສົ່ງໃໝ່ໃນ ${claimOtpCountdown}s` : `Resend in ${claimOtpCountdown}s`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendClaimOtp}
                          className="text-emerald-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {lang === 'lo' ? 'ສົ່ງລະຫັດໃໝ່' : 'Resend'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <hr className={`border-t border-dashed ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`} />

                {/* 2FA Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      {lang === 'lo' ? '2. ລະຫັດ 2FA Authenticator' : '2. 2FA App Code'}
                    </label>
                    {/* Demo Helper Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setClaimTwoFaCode('123456');
                        setClaimOtpError('');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[9px] hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      Fill: 123456
                    </button>
                  </div>
                  <OtpInput
                    length={6}
                    autoFocus={false}
                    value={claimTwoFaCode}
                    onChange={(val) => {
                      setClaimTwoFaCode(val);
                      setClaimOtpError('');
                    }}
                    error={!!claimOtpError && claimTwoFaCode.length < 6}
                  />
                  <p className="text-[10px] text-gray-400 font-medium text-center mt-1.5">
                    {lang === 'lo' ? 'ເປີດແອັບ Google Authenticator ຂອງທ່ານ' : 'Open your Google Authenticator app'}
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimOtpModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={claimOtpCode.length < 6 || claimTwoFaCode.length < 6 || isClaiming}
                  onClick={handleConfirmClaimPayout}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isClaiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
            )}
                  <span>{lang === 'lo' ? 'ຢືນຢັນເບີກຈ່າຍເງິນ' : 'Confirm & Claim'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
            )}
      </AnimatePresence>

      {/* Claim Event Money Modal */}
      <AnimatePresence>
        {showClaimOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setShowClaimOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-2xl border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 shadow-xs">
                <DollarSign className="w-6 h-6" />
              </div>

              <h3 className="text-base sm:text-lg font-black text-center mb-1">
                {lang === 'lo' ? 'ຢືນຢັນການເບີກຈ່າຍເງິນດ້ວຍ OTP' : 'Authorize Event Money Claim with OTP'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium text-center mb-4 leading-relaxed">
                {lang === 'lo'
                  ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກ ເພື່ອຢືນຢັນການໂອນເງິນລາຍຮັບກິດຈະກຳເຂົ້າບັນຊີທະນາຄານຂອງທ່ານ'
                  : 'Enter the 6-digit OTP and 2FA codes to securely authorize the payout.'}
              </p>

              {/* Financial Calculation Breakdown */}
              <div className={`p-3.5 rounded-xl sm:rounded-2xl mb-4 space-y-2 text-xs border ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-gray-150'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ລາຍການກິດຈະກຳ:' : 'Event Title:'}</span>
                  <span className="font-black text-xs text-right truncate w-48" title={eventToClaim?.title}>{eventToClaim?.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຍອດລາຍຮັບກິດຈະກຳ:' : 'Event Revenue:'}</span>
                  <span className="font-black text-sm">{new Intl.NumberFormat('lo-LA').format(eventToClaim?.amount || 0)} ₭</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຄ່າທຳນຽມລະບົບ (5%):' : 'Platform Fee (5%):'}</span>
                  <span className="font-bold text-red-500">-{new Intl.NumberFormat('lo-LA').format((eventToClaim?.amount || 0) * 0.05)} ₭</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-adv-slate dark:text-white font-black">{lang === 'lo' ? 'ຍອດເງິນທີ່ໄດ້ຮັບຕົວຈິງ:' : 'Net Transfer Amount:'}</span>
                  <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('lo-LA').format((eventToClaim?.amount || 0) * 0.95)} ₭
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-150 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between sm:items-center text-[11px] gap-1 sm:gap-2">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ທະນາຄານຮັບເງິນ:' : 'Payout Account:'}</span>
                  <span className="font-extrabold sm:text-right">{bankAccount?.accountNumber || '0000000008899'} - {bankAccount?.accountName || 'Phanyadeth'}</span>
                </div>
              </div>

              {/* Validation Errors */}
              {claimOtpError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-red-500 text-[11px] font-bold">{claimOtpError}</span>
                </div>
              )}

              {/* Input Section - Both OTP and 2FA */}
              <div className="mb-5 space-y-4">
                
                {/* OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {lang === 'lo' ? '1. ລະຫັດ OTP (SMS)' : '1. SMS OTP Code'}
                    </label>
                    {/* Demo Helper Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setClaimOtpCode(expectedClaimOtp);
                        setClaimOtpError('');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[9px] hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      Fill: {expectedClaimOtp}
                    </button>
                  </div>
                  <OtpInput
                    length={6}
                    autoFocus={false}
                    value={claimOtpCode}
                    onChange={(val) => {
                      setClaimOtpCode(val);
                      setClaimOtpError('');
                    }}
                    error={!!claimOtpError && claimOtpCode.length < 6}
                  />
                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <div className="text-[10px] text-gray-400 font-medium">
                      {claimOtpCountdown > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {lang === 'lo' ? `ສົ່ງໃໝ່ໃນ ${claimOtpCountdown}s` : `Resend in ${claimOtpCountdown}s`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendClaimOtp}
                          className="text-emerald-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {lang === 'lo' ? 'ສົ່ງລະຫັດໃໝ່' : 'Resend'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <hr className={`border-t border-dashed ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`} />

                {/* 2FA Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      {lang === 'lo' ? '2. ລະຫັດ 2FA Authenticator' : '2. 2FA App Code'}
                    </label>
                    {/* Demo Helper Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setClaimTwoFaCode('123456');
                        setClaimOtpError('');
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[9px] hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      Fill: 123456
                    </button>
                  </div>
                  <OtpInput
                    length={6}
                    autoFocus={false}
                    value={claimTwoFaCode}
                    onChange={(val) => {
                      setClaimTwoFaCode(val);
                      setClaimOtpError('');
                    }}
                    error={!!claimOtpError && claimTwoFaCode.length < 6}
                  />
                  <p className="text-[10px] text-gray-400 font-medium text-center mt-1.5">
                    {lang === 'lo' ? 'ເປີດແອັບ Google Authenticator ຂອງທ່ານ' : 'Open your Google Authenticator app'}
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimOtpModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={claimOtpCode.length < 6 || isClaiming}
                  onClick={handleConfirmClaimPayout}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isClaiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
            )}
                  <span>{lang === 'lo' ? 'ຢືນຢັນເບີກຈ່າຍເງິນ' : 'Confirm & Claim'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
            )}
      </AnimatePresence>

      {/* 30-Day Cooling-off Period Notice Modal */}
      <AnimatePresence>
        {showCoolingWarningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setShowCoolingWarningModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-2xl border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3.5 border border-amber-500/20 shadow-xs">
                <Clock className="w-7 h-7" />
              </div>

              <h3 className="text-base sm:text-lg font-black text-center mb-1 text-adv-slate dark:text-white">
                {lang === 'lo' ? 'ບໍ່ສາມາດເບີກເງິນໄດ້ໃນຕອນນີ້ (ລໍຖ້າ 30 ວັນ)' : 'Event Money Claim Locked (30-Day Rule)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium text-center mb-4 leading-relaxed">
                {lang === 'lo'
                  ? 'ຕາມເງື່ອນໄຂຄວາມປອດໄພ ຫາກມີການແກ້ໄຂຂໍ້ມູນທະນາຄານ ຜູ້ຈັດງານຕ້ອງລໍຖ້າໃຫ້ຄົບ 30 ວັນ ຈຶ່ງຈະສາມາດຂໍເບີກເງິນໄດ້.'
                  : 'Under our terms and anti-fraud regulations, if bank details are edited, payout claims are locked for 30 days.'}
              </p>

              {/* Status Breakdown Box */}
              <div className={`p-4 rounded-xl sm:rounded-2xl mb-4 space-y-2.5 text-xs border ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-gray-150'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ວັນທີອັບເດດບັນຊີ:' : 'Bank Updated Date:'}</span>
                  <span className="font-bold">
                    {bankAccount?.updatedAt ? new Date(bankAccount.updatedAt).toLocaleDateString('lo-LA') : 'Recently'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຜ່ານມາແລ້ວ:' : 'Days Elapsed:'}</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-zinc-300">{daysSinceBankUpdate} {lang === 'lo' ? 'ວັນ' : 'day(s)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ໄລຍະລໍຖ້າທີ່ເຫຼືອ:' : 'Cooling Days Left:'}</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400">{coolingDaysRemaining} {lang === 'lo' ? 'ວັນ' : 'day(s)'}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="font-bold text-gray-700 dark:text-zinc-200">{lang === 'lo' ? 'ວັນທີປົດລັອກຂໍເບີກເງິນ:' : 'Eligible Claim Date:'}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{unlockDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCoolingWarningModal(false)}
                  className="w-full py-3 rounded-xl bg-adv-slate dark:bg-white text-white dark:text-adv-slate font-black text-xs shadow-md cursor-pointer hover:opacity-95"
                >
                  {lang === 'lo' ? 'ຂ້ອຍເຂົ້າໃຈແລ້ວ' : 'Understood'}
                </button>
              </div>
            </motion.div>
          </motion.div>
            )}

        {/* Individual Attendee Questionnaire Answers Modal */}
        {selectedAttendeeForAnswers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[270] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedAttendeeForAnswers(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className={`max-w-2xl w-full max-h-[90vh] flex flex-col rounded-3xl sm:rounded-[2.5rem] shadow-2xl border overflow-hidden ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black truncate text-gray-900 dark:text-white">
                        {selectedAttendeeForAnswers.attendeeName || `${selectedAttendeeForAnswers.firstName || ''} ${selectedAttendeeForAnswers.lastName || ''}`.trim() || 'Attendee'}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-zinc-400 mt-1 font-medium">
                      <span className="text-gray-900 dark:text-zinc-300 break-all">{selectedAttendeeForAnswers.email || '-'}</span>
                      <span>Ticket ID: <strong className="font-mono text-gray-900 dark:text-zinc-200">{selectedAttendeeForAnswers.ticketId || selectedAttendeeForAnswers.id}</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAttendeeForAnswers(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
                {/* Attendee Details Card */}
                <div className={`p-4 rounded-2xl border grid grid-cols-2 gap-3 text-xs ${
                  theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">{lang === 'lo' ? 'ປະເພດປີ້' : 'Ticket'}</span>
                    <span className="font-bold text-gray-900 dark:text-zinc-100 truncate block">{selectedAttendeeForAnswers.ticketType || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">{lang === 'lo' ? 'ເວລາ' : 'Time'}</span>
                    <span className="font-bold text-gray-900 dark:text-zinc-100 truncate block font-mono">{formatTimeToHHMM(selectedAttendeeForAnswers.checkedInTime || selectedAttendeeForAnswers.purchaseDate, selectedAttendeeForAnswers.checkedInTimestamp) || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">{t.checkedIn}</span>
                    <span className={`font-bold flex items-center gap-1 ${selectedAttendeeForAnswers.isCheckedIn ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {selectedAttendeeForAnswers.isCheckedIn ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {selectedAttendeeForAnswers.isCheckedIn ? 'Verified' : 'Pending Gate'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">{lang === 'lo' ? 'ເບີໂທລະສັບ' : 'Phone Number'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">{selectedAttendeeForAnswers.phone || '-'}</span>
                  </div>
                </div>

                {/* Questionnaire QA pairs */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-adv-orange" />
                    <span>{t.questionnaireAnswers} ({Object.keys(selectedAttendeeForAnswers.customAnswers || {}).length})</span>
                  </h4>

                  {(!selectedAttendeeForAnswers.customAnswers || Object.keys(selectedAttendeeForAnswers.customAnswers).length === 0) ? (
                    <div className="py-8 text-center text-gray-500 dark:text-zinc-400 text-xs font-bold">
                      {lang === 'lo' ? 'ບໍ່ມີຂໍ້ມູນຄຳຕອບແບບສອບຖາມສຳລັບປີ້ໃບນີ້' : 'No questionnaire answers recorded for this ticket.'}
                    </div>
                  ) : (
                    Object.entries(selectedAttendeeForAnswers.customAnswers).map(([key, val], idx) => {
                      const qConfig = (selectedEvent as any)?.attendeeQuestions?.find((q: any) => q.id === key || q.title === key);
                      const qTitle = qConfig?.title || key;
                      const qType = qConfig?.type || 'text';
                      const formattedVal = Array.isArray(val) ? val.join(', ') : typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border transition-all ${
                            theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-black text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-orange-500/10 text-adv-orange text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-gray-900 dark:text-white font-black">{qTitle}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                              theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {qType}
                            </span>
                          </div>

                          <div className={`p-3.5 rounded-xl border text-sm font-semibold leading-relaxed ${
                            theme === 'dark' ? 'bg-zinc-900 border-zinc-750 text-zinc-100' : 'bg-gray-50 border-gray-200 text-gray-900'
                          }`}>
                            {formattedVal || '-'}
                          </div>
                        </div>
                      );
                    })
            )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/40 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedAttendeeForAnswers(null)}
                  className="px-5 py-2 rounded-xl bg-adv-orange text-white font-bold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t.close || 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
            )}
      </AnimatePresence>

      {/* Quick Check-in Confirmation Modal */}
      <AnimatePresence>
        {checkinConfirmAttendee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setCheckinConfirmAttendee(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`max-w-md w-full rounded-2xl sm:rounded-[2rem] p-6 sm:p-7 shadow-2xl border relative overflow-hidden ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/25">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-center mb-2">
                {lang === 'en' ? 'Confirm Check-in?' : 'ຢືນຢັນການເຊັກອິນ?'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                {lang === 'en' 
                  ? `Are you sure you want to manually check-in ${checkinConfirmAttendee.attendeeName || checkinConfirmAttendee.firstName}?` 
                  : `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການເຊັກອິນ ${checkinConfirmAttendee.attendeeName || checkinConfirmAttendee.firstName} ດ້ວຍຕົນເອງ?`}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCheckinConfirmAttendee(null)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'en' ? 'Cancel' : 'ຍົກເລີກ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckinStatus(checkinConfirmAttendee.ticketId || checkinConfirmAttendee.id, true, 'Organizer Desk');
                    addToast(
                      lang === 'en' 
                        ? `Checked in ${checkinConfirmAttendee.attendeeName || checkinConfirmAttendee.firstName}` 
                        : `ເຊັກອິນ ${checkinConfirmAttendee.attendeeName || checkinConfirmAttendee.firstName} ສຳເລັດແລ້ວ`,
                      'success'
                    );
                    setCheckinConfirmAttendee(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                >
                  {lang === 'en' ? 'Confirm' : 'ຢືນຢັນ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
