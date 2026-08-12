import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronLeft, ChevronRight, Camera, Calendar as CalendarIcon, MapPin, Plus, CheckCircle2, XCircle, X, AlertCircle, AlertTriangle, Loader2, Image as ImageIcon, Ticket, Download, Link2, Copy, ExternalLink, QrCode, Trash2, ShieldCheck , Building, Hash, Save, Edit2, ChevronDown, DollarSign, Info, Smartphone, Lock, Search, Phone, Mail } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { safeStorage } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { events, SeatingZone } from '../data/events';
import { useAuth } from '../AuthContext';
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
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20">
             <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-black text-adv-slate uppercase tracking-tight mb-2">Scanner Unvailable</h4>
             <p className="text-gray-400 mb-6 font-bold text-sm leading-relaxed">Camera scanner requires a secure context and frame permissions.</p>
          </div>
        )
      };
    })
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
    noStaffLinks: 'No staff links generated yet. Click "Create Staff Link" below.'
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
    noStaffLinks: 'ຍັງບໍ່ມີລິ້ງພະນັກງານຖືກສ້າງເທື່ອ. ກົດ "ສ້າງລິ້ງເຂົ້າເຖິງສຳລັບພະນັກງານ" ດ້ານລຸ່ມ.'
  }
};


const MOCK_PAYOUTS = [
  {
    id: 'TXN-98472-LA',
    date: '2026-07-01',
    event: 'Vang Vieng Music Festival 2026',
    grossAmount: 16000000,
    platformFee: 500000,
    amount: 15500000,
    status: 'Completed',
    account: 'BCEL *6701',
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
    account: 'BCEL *6701',
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
    account: 'BCEL *6701',
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
    account: 'BCEL *6701',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300'
  }
];

const LAO_BANKS = [
  { id: 'bcel', name: 'BCEL Bank', label: 'BCEL One', badgeBg: 'bg-red-600', textColor: 'text-red-600' },
  { id: 'jdb', name: 'JDB Bank', label: 'JDB', badgeBg: 'bg-blue-600', textColor: 'text-blue-600' },
  { id: 'ldb', name: 'LDB Bank', label: 'LDB', badgeBg: 'bg-emerald-600', textColor: 'text-emerald-600' },
  { id: 'ibcool', name: 'Indochina Bank', label: 'IB Cool', badgeBg: 'bg-cyan-600', textColor: 'text-cyan-600' },
  { id: 'stb', name: 'ST Bank', label: 'STB', badgeBg: 'bg-purple-600', textColor: 'text-purple-600' }
];

export default function Account() {

  const [bankAccount, setBankAccount] = useState<any | null>(() => {
    const saved = safeStorage.getItem('organizer_payment_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [showBankConfirmModal, setShowBankConfirmModal] = useState(false);
  const [bankFormData, setBankFormData] = useState(bankAccount || { bankName: '', accountName: '', accountNumber: '' });
  
  const [unclaimedRevenue, setUnclaimedRevenue] = useState(3500000);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimCode2FA, setClaimCode2FA] = useState('');
  const [bank2FACode, setBank2FACode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const is2FAEnabled = safeStorage.getItem('user_2fa_enabled') === 'true';

  const handleConfirmClaimPayout = () => {
    if (is2FAEnabled) {
      if (!claimCode2FA || claimCode2FA.trim().length < 6) {
        setToastQueue(prev => [...prev, { 
          id: Date.now().toString(), 
          text: lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ 2FA Authenticator 6 ຫຼັກ' : 'Please enter the 6-digit 2FA Authenticator code', 
          type: 'error' 
        }]);
        return;
      }
    }

    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setShowClaimModal(false);
      const claimedAmt = unclaimedRevenue;
      setUnclaimedRevenue(0);
      setClaimCode2FA('');

      const newPayout = {
        id: `PAY-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        event: 'Vientiane Music Festival 2026',
        grossAmount: claimedAmt,
        platformFee: claimedAmt * 0.05,
        amount: claimedAmt * 0.95,
        status: 'Completed',
        account: bankAccount ? `${bankAccount.bankName} *${bankAccount.accountNumber.slice(-4)}` : 'BCEL Bank *8899',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
      };

      setMyPayouts(prev => [newPayout, ...prev]);

      setToastQueue(prev => [...prev, {
        id: Date.now().toString(),
        text: lang === 'lo'
          ? 'ສົ່ງຄຳຂໍເບີກຈ່າຍເງິນສຳເລັດ! ເງິນຖືກໂອນເຂົ້າບັນຊີຂອງທ່ານແລ້ວ'
          : 'Payout claim submitted successfully with 2FA authorization!',
        type: 'success'
      }]);
    }, 1000);
  };

  const getDaysSinceBankUpdate = () => {
    if (!bankAccount?.updatedAt) return 999;
    const last = new Date(bankAccount.updatedAt).getTime();
    if (isNaN(last)) return 999;
    const diff = Date.now() - last;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleEditBankClick = () => {
    const days = getDaysSinceBankUpdate();
    if (days < 30) {
      const remaining = 30 - days;
      const msg = lang === 'lo'
        ? `ທ່ານໄດ້ອັບເດດຂໍ້ມູນທະນາຄານແລ້ວ. ຂໍ້ມູນທະນາຄານສາມາດແກ້ໄຂໄດ້ພຽງ 1 ຄັ້ງຕໍ່ 30 ວັນ. ທ່ານສາມາດແກ້ໄຂໄດ້ອີກໃນ ${remaining} ວັນ.`
        : `Bank account details can only be edited once every 30 days. You can edit again in ${remaining} day${remaining > 1 ? 's' : ''}.`;
      setToastQueue(prev => [...prev, { id: Date.now().toString(), text: msg, type: 'warning' }]);
      return;
    }
    setBankFormData(bankAccount || { bankName: '', accountName: '', accountNumber: '' });
    setIsEditingBank(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankFormData.bankName || !bankFormData.accountName || !bankFormData.accountNumber) {
      setToastQueue(prev => [...prev, { id: Date.now().toString(), text: 'Please fill all fields', type: 'error' }]);
      return;
    }
    const days = getDaysSinceBankUpdate();
    if (days < 30) {
      const remaining = 30 - days;
      const msg = lang === 'lo'
        ? `ບໍ່ສາມາດແກ້ໄຂໄດ້ໃນຕອນນີ້. ຂໍ້ມູນທະນາຄານສາມາດແກ້ໄຂໄດ້ພຽງ 1 ຄັ້ງຕໍ່ 30 ວັນ. ທ່ານສາມາດແກ້ໄຂໄດ້ອີກໃນ ${remaining} ວັນ.`
        : `Cannot update now. Bank details can only be changed once every 30 days. You can edit again in ${remaining} day${remaining > 1 ? 's' : ''}.`;
      setToastQueue(prev => [...prev, { id: Date.now().toString(), text: msg, type: 'warning' }]);
      return;
    }
    setShowBankConfirmModal(true);
  };

  const confirmSaveBankDetails = () => {
    if (is2FAEnabled) {
      if (!bank2FACode || bank2FACode.trim().length < 6) {
        setToastQueue(prev => [...prev, { 
          id: Date.now().toString(), 
          text: lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ 2FA Authenticator 6 ຫຼັກ' : 'Please enter the 6-digit 2FA Authenticator code', 
          type: 'error' 
        }]);
        return;
      }
    }

    const newBankInfo = {
      ...bankFormData,
      updatedAt: new Date().toISOString()
    };
    
    safeStorage.setItem('organizer_payment_info', JSON.stringify(newBankInfo));
    setBankAccount(newBankInfo);
    setIsEditingBank(false);
    setShowBankConfirmModal(false);
    setBank2FACode('');
    
    setToastQueue(prev => [...prev, { id: Date.now().toString(), text: lang === 'lo' ? 'ບັນທຶກຂໍ້ມູນທະນາຄານສຳເລັດ! (ສາມາດແກ້ໄຂໄດ້ອີກຫຼັງ 30 ວັນ)' : 'Bank details saved! (Next edit allowed after 30 days)', type: 'success' }]);
  };

  const navigate = useNavigate();
  const { logout } = useAuth();
  const { lang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = translations[lang];
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
      { ...events[1], registered: 85, scanned: 80, hasSeating: false }
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
  } | null>(null);

  const [checkinPage, setCheckinPage] = useState(1);
  const [recentCheckinSearch, setRecentCheckinSearch] = useState('');

  // Real-time checkins store automatically filtered for selected event
  const { eventCheckins: recentCheckins, addCheckin: addOrganizerCheckin } = useCheckins(selectedEventId);


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

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'my-event' | 'payouts'>(
    (location.state as any)?.targetTab || 'profile'
  );
  
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

  const [toastQueue, setToastQueue] = useState<{id: string, text: string, type: 'error' | 'success' | 'warning'}[]>([]);
  const lastScanRef = useRef<{ id: string; time: number } | null>(null);

  const addToast = (text: string, type: 'error' | 'success' | 'warning') => {
    const id = Date.now().toString() + Math.random().toString();
    setToastQueue(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleScan = (text: string) => {
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.id === text && (now - lastScanRef.current.time) < 2500) {
      return;
    }
    lastScanRef.current = { id: text, time: now };

    const isValid = text.startsWith('tk_') || text.length > 5;
    
    if (isValid) {
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
    const headers = ['Ticket ID', 'Attendee Name', 'Email', 'Ticket Type', 'Zone', 'Seat', 'Check-In Time'];
    const rows = recentCheckins.map(c => [
      c.id,
      c.attendeeName,
      c.email,
      c.ticketType,
      c.zone,
      c.seat,
      c.time
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `checked_in_attendees_${selectedEventId || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast(
      lang === 'en' 
        ? 'Successfully exported check-in data to Excel/CSV!' 
        : 'ສົ່ງອອກຂໍ້ມູນການເຊັກອິນໄປຍັງ Excel/CSV ສຳເລັດແລ້ວ!', 
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
  ];

  const pastEvents = events.slice(0, 3);

  const [showFullMap, setShowFullMap] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [showZoneSuccess, setShowZoneSuccess] = useState(false);
  const [showProfilePicSuccess, setShowProfilePicSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutImagePreview, setPayoutImagePreview] = useState<string | null>(null);
  const [myPayouts, setMyPayouts] = useState<any[]>(MOCK_PAYOUTS);

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
            account: bill.bankInfo ? `${bill.bankInfo.bankName} *${bill.bankInfo.accountNumber.slice(-4)}` : 'Unknown',
            receiptUrl: bill.billImage
          }));
          
          setMyPayouts([...formattedBills, ...MOCK_PAYOUTS]);
        }
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
        try {
          localStorage.setItem('pasopkan_user_profile_pic', reader.result as string);
        } catch (err) {
          console.error(err);
        }
        setShowProfilePicSuccess(true);
        setTimeout(() => {
          setShowProfilePicSuccess(false);
        }, 2000);
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
      <div className="max-w-4xl mx-auto pt-1 sm:pt-2">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-adv-slate'
          }`}>
            {t.settings}
          </h1>
        </div>
        
        {/* Tabs - Mobile Segmented Pill Bar */}
        <div className={`p-1 rounded-2xl flex gap-1 mb-6 sm:mb-8 transition-colors ${
          theme === 'dark' ? 'bg-zinc-900/60' : 'bg-gray-200/50'
        } sm:bg-transparent sm:p-0 sm:border-b sm:border-gray-100 sm:rounded-none sm:gap-8`}>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-initial text-center py-2.5 sm:pb-4 sm:pt-0 text-sm font-bold transition-all rounded-xl sm:rounded-none sm:border-b-2 ${
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
            onClick={() => setActiveTab('my-event')}
            className={`flex-1 sm:flex-initial text-center py-2.5 sm:pb-4 sm:pt-0 text-sm font-bold transition-all rounded-xl sm:rounded-none sm:border-b-2 ${
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
            onClick={() => setActiveTab('payouts')}
            className={`flex-1 sm:flex-initial text-center py-2.5 sm:pb-4 sm:pt-0 text-sm font-bold transition-all rounded-xl sm:rounded-none sm:border-b-2 ${
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
              <p className="text-gray-400 font-medium mb-4 text-xs sm:text-sm truncate">{profile.email}</p>
              <Link to="/edit-profile" className="inline-block px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-adv-orange text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-lg">
                {t.updateProfile}
              </Link>
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

          <button 
            onClick={() => logout()}
            className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold text-sm sm:text-base ${
              theme === 'dark' 
                ? 'bg-zinc-900 border-red-500/20 text-red-400 hover:bg-red-500/5' 
                : 'bg-white border-red-50 text-red-500 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {t.signOut}
          </button>
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
              {/* Event Stats Card */}
              <div className={`rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-sm border p-5 sm:p-8 transition-all ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-gray-100/50 dark:border-zinc-800/50">
                   <img src={selectedEvent.image} alt={selectedEvent.title} className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 shadow-sm" />
                   <div className="flex-1 text-center sm:text-left min-w-0">
                      <div className="flex items-center gap-3 justify-center sm:justify-start mb-1 sm:mb-1.5">
                        <h3 className="text-base sm:text-lg font-bold truncate">{selectedEvent.title}</h3>
                        {selectedEvent.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest shrink-0">
                            Pending Approval
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-x-3.5 gap-y-1.5 text-[11px] sm:text-sm text-gray-400 font-medium">
                         <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-adv-orange shrink-0" /> {selectedEvent.date}</span>
                         <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-adv-orange shrink-0" /> {selectedEvent.location}</span>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-2xl p-4 sm:p-5 text-center border transition-all ${
                    theme === 'dark' ? 'bg-zinc-950/40 border-zinc-850' : 'bg-[#F9FAFB] border-gray-50'
                  }`}>
                    <div className="text-2xl sm:text-3xl font-bold mb-0.5">{selectedEvent.registered}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.bookings}</div>
                  </div>
                  <div className={`rounded-2xl p-4 sm:p-5 text-center border transition-all ${
                    theme === 'dark' ? 'bg-orange-950/20 border-orange-900/25' : 'bg-orange-50/30 border-orange-50'
                  }`}>
                    <div className="text-2xl sm:text-3xl font-bold text-adv-orange mb-0.5">{recentCheckins.length}</div>
                    <div className="text-[10px] text-adv-orange/60 dark:text-orange-450/60 font-bold uppercase tracking-widest">{t.attended}</div>
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
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded-full border border-emerald-500/20 shrink-0">
                            {lang === 'lo' ? 'ໃຊ້ງານໄດ້' : 'Active'}
                          </span>
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

              {/* Seating Map (Only visible if event has one) */}
              {selectedEvent.hasSeating && (
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
                    
                    {/* Interactive Hint */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                       <button 
                        onClick={() => setShowFullMap(true)}
                        className="px-5 py-2 bg-white text-adv-slate rounded-xl font-bold text-xs shadow-xl border border-gray-100 flex items-center gap-2 hover:scale-105 transition-transform"
                       >
                          <ImageIcon className="w-4 h-4 text-adv-orange" />
                          <span>{t.viewFullMap}</span>
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Checked-In Attendees details list */}
              <div className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border transition-all ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100/50 dark:border-zinc-800/50">
                  <div>
                    <h4 className="text-base sm:text-lg font-bold">{t.recentCheckins}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {filteredRecentCheckins.length} {t.attended}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input 
                        type="text" 
                        value={recentCheckinSearch}
                        onChange={(e) => {
                          setRecentCheckinSearch(e.target.value);
                          setCheckinPage(1);
                        }}
                        placeholder={lang === 'lo' ? 'ຄົ້ນຫາຕາມຊື່, ເບີໂທ, ລະຫັດປີ້...' : 'Search Name, Phone, Ticket ID...'}
                        className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-gray-50 border-gray-200 text-adv-slate placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <button
                      onClick={handleExportToExcel}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-[1.02] active:scale-[0.98] font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 border border-emerald-500/20 shadow-sm shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Export Excel' : 'ສົ່ງອອກ Excel'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {filteredRecentCheckins.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 font-bold text-xs sm:text-sm">
                      {t.noRecentCheckins}
                    </div>
                  ) : (
                    (() => {
                      const CHECKINS_PER_PAGE = 10;
                      const totalCheckinPages = Math.ceil(filteredRecentCheckins.length / CHECKINS_PER_PAGE) || 1;
                      const safePage = Math.min(checkinPage, totalCheckinPages);
                      const currentCheckins = filteredRecentCheckins.slice((safePage - 1) * CHECKINS_PER_PAGE, safePage * CHECKINS_PER_PAGE);

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
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-adv-orange" /> {checkin.zone}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                    <span className="flex items-center gap-1"><Ticket className="w-3 h-3 text-blue-400" /> {checkin.seat}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2.5 md:pt-0 border-gray-100 dark:border-zinc-850">
                                <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                                  ID: {checkin.id}
                                </div>
                                <div className="text-[9px] text-emerald-500 font-black uppercase tracking-wider md:mt-1 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  <span className="w-1.2 h-1.2 rounded-full bg-emerald-500 animate-pulse" />
                                  {checkin.time}
                                </div>
                              </div>
                            </motion.div>
                          ))}

                          {totalCheckinPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-4 border-t border-gray-100 dark:border-zinc-800/80">
                              <div className="text-xs font-bold text-gray-400">
                                {lang === 'en'
                                  ? `Page ${safePage} of ${totalCheckinPages} (${recentCheckins.length} total)`
                                  : `ໜ້າ ${safePage} ຈາກ ${totalCheckinPages} (ທັງໝົດ ${recentCheckins.length})`}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setCheckinPage(prev => Math.max(prev - 1, 1))}
                                  disabled={safePage === 1}
                                  className="p-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalCheckinPages }, (_, i) => i + 1).map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCheckinPage(p)}
                                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                      safePage === p
                                        ? 'bg-adv-orange text-white shadow-sm'
                                        : 'border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => setCheckinPage(prev => Math.min(prev + 1, totalCheckinPages))}
                                  disabled={safePage === totalCheckinPages}
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
            </div>
          )}
        </div>

        <div className={activeTab === 'payouts' ? 'block' : 'hidden'}>
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className={`text-2xl sm:text-3xl font-black transition-colors tracking-tight ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                  {t.payouts || (lang === 'lo' ? 'ໃບບິນເບີກຈ່າຍ' : 'Payout Bills')}
                </h2>
                <p className="text-sm font-semibold text-gray-500 mt-1">{lang === 'lo' ? 'ຈັດການຂໍ້ມູນທະນາຄານ ແລະ ເບິ່ງປະຫວັດການເບີກຈ່າຍ.' : 'Manage your bank details and view past payouts.'}</p>
              </div>
              <div className="p-4 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 rounded-2xl flex items-center gap-4 shadow-sm shrink-0 backdrop-blur-xl">
                <div className="p-2.5 bg-orange-100 dark:bg-orange-900/50 text-adv-orange dark:text-orange-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-adv-orange dark:text-orange-400 uppercase tracking-widest">{t.totalReceived || 'Total Received'}</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {new Intl.NumberFormat('lo-LA').format(myPayouts.reduce((sum, p) => sum + p.amount, 0))} ₭
                  </p>
                </div>
              </div>
            </div>

            {/* Claimable Event Revenue Card */}
            <div className={`p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border transition-all ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-100'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base sm:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                        {lang === 'lo' ? 'ລາຍຮັບກິດຈະກຳທີ່ສາມາດເບີກໄດ້' : 'Claimable Event Revenue'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                        {lang === 'lo' ? 'ພ້ອມເບີກ' : 'Ready'}
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {new Intl.NumberFormat('lo-LA').format(unclaimedRevenue)} ₭
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowClaimModal(true)}
                  disabled={unclaimedRevenue <= 0}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4 text-emerald-200" />
                  <span>{lang === 'lo' ? 'ຂໍເບີກຈ່າຍເງິນ (Claim Money)' : 'Claim Event Money'}</span>
                </button>
              </div>
            </div>

            {/* Bank Settings Card */}
            <div className={`p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border transition-all ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}>
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{t.payoutSettings || 'Payout Settings'}</h3>
                    <p className="text-xs text-gray-500 font-semibold">{lang === 'lo' ? 'ບ່ອນທີ່ທ່ານຈະໄດ້ຮັບເງິນເບີກຈ່າຍ' : 'Where you receive your event payouts'}</p>
                  </div>
                </div>
                {bankAccount && isEditingBank && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditingBank(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {bankAccount && !isEditingBank && (
                  <button 
                    onClick={handleEditBankClick}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      theme === 'dark' 
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {lang === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}
                  </button>
                )}
              </div>

              {isEditingBank || !bankAccount ? (
                <form onSubmit={handleSaveBank} className="space-y-5 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
                  {/* 30-Day Limit Alert Banner */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                    <div className="text-xs">
                      <p className="font-bold mb-0.5">
                        {lang === 'lo' ? 'ແຈ້ງເຕືອນສຳຄັນ: ການອັບເດດຂໍ້ມູນບັນຊີທະນາຄານ' : 'Important Notice: Bank Details Update Policy'}
                      </p>
                      <p className="text-gray-600 dark:text-zinc-300 font-medium leading-relaxed">
                        {lang === 'lo'
                          ? 'ຂໍ້ມູນບັນຊີທະນາຄານສາມາດແກ້ໄຂໄດ້ພຽງ 1 ຄັ້ງຕໍ່ 30 ວັນ ເພື່ອຄວາມປອດໄພຂອງການເບີກຈ່າຍເງິນ. ກະລຸນາກວດສອບຊື່ ແລະ ເລກບັນຊີໃຫ້ຖືກຕ້ອງກ່ອນກົດບັນທຶກ.'
                          : 'Bank account details can only be edited once every 30 days for security and verification purposes. Please verify all information carefully before saving.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Bank Dropdown Select */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{lang === 'lo' ? 'ຊື່ທະນາຄານ' : 'Bank Name'}</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={bankFormData.bankName || ''}
                          onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                          className={`w-full border rounded-xl pl-10 pr-10 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all appearance-none cursor-pointer ${
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
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{lang === 'lo' ? 'ຊື່ບັນຊີ' : 'Account Holder'}</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Somsack Xayarath"
                          value={bankFormData.accountName || ''}
                          onChange={(e) => setBankFormData({...bankFormData, accountName: e.target.value.replace(/[0-9]/g, '')})}
                          className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white focus:bg-zinc-900' 
                              : 'bg-gray-50 border-gray-200/80 text-adv-slate focus:bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{lang === 'lo' ? 'ເລກບັນຊີ' : 'Account Number'}</label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                          type="text"
                          inputMode="numeric"
                          required
                          placeholder="e.g. 120-11-00-1234567-001"
                          value={bankFormData.accountNumber || ''}
                          onChange={(e) => setBankFormData({...bankFormData, accountNumber: e.target.value.replace(/\D/g, '')})}
                          className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white focus:bg-zinc-900' 
                              : 'bg-gray-50 border-gray-200/80 text-adv-slate focus:bg-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      type="submit"
                      className="px-8 py-3 bg-adv-slate dark:bg-white text-white dark:text-adv-slate rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {lang === 'lo' ? 'ບັນທຶກ' : 'Save Details'}
                    </button>
                    {bankAccount && (
                      <button 
                        type="button"
                        onClick={() => setIsEditingBank(false)}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                          theme === 'dark' ? 'text-gray-400 hover:bg-zinc-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className={`pt-4 border-t ${theme === 'dark' ? 'border-zinc-800/60' : 'border-gray-100'}`}>
                  <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-zinc-950/50' : 'bg-gray-50'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-black">{bankAccount.bankName}</h4>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                          {lang === 'lo' ? 'ເຊື່ອມຕໍ່ແລ້ວ' : 'Connected'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{bankAccount.accountName} <span className="mx-1 text-gray-300 dark:text-zinc-700">•</span> {bankAccount.accountNumber}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{lang === 'lo' ? 'ປະຫວັດການເບີກຈ່າຍ' : 'Payout History'}</h3>
              {myPayouts.length === 0 ? (
                <div className={`text-center py-16 sm:py-20 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-100'}`}>
                  <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300 dark:text-zinc-600" />
                  <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-500'}`}>{t.payoutsEmpty || 'No payouts yet'}</h3>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-sm mx-auto px-4">
                    Once your event is completed and processed by the admin, your payout receipts will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPayouts.map((bill, index) => (
                    <div key={index} className={`p-5 sm:p-6 rounded-[1.5rem] shadow-sm border flex flex-col sm:flex-row gap-5 transition-all ${
                      theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 hover:border-adv-orange/30' : 'bg-white border-gray-100 hover:border-adv-orange/30'
                    }`}>
                      <div className="w-full sm:w-24 h-40 sm:h-auto shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm relative group cursor-pointer" onClick={() => setPayoutImagePreview(bill.receiptUrl)}>
                        <img src={bill.receiptUrl} alt="Admin Submit Receipt" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{lang === 'lo' ? 'ສຳເລັດ' : 'Completed'}</span>
                          
                          <div className="relative group ml-0.5 flex items-center">
                            <Info className="w-3.5 h-3.5 text-gray-400 hover:text-adv-slate dark:hover:text-white cursor-help transition-colors" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-48 p-3 bg-gray-900 dark:bg-zinc-800 text-white text-xs rounded-xl shadow-xl z-10 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-900 dark:before:border-t-zinc-800 pointer-events-none">
                              <p className="font-bold mb-1">Transaction Details</p>
                              <div className="space-y-1 mt-2">
                                <p className="text-gray-300 flex justify-between"><span className="text-gray-500">Ref:</span> <span className="font-mono text-gray-100">{bill.id}</span></p>
                                <p className="text-gray-300 flex justify-between"><span className="text-gray-500">Status:</span> <span className="text-emerald-400">{bill.status}</span></p>
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-gray-400 ml-auto">{bill.date}</span>
                        </div>
                        <h4 className={`text-base font-black mb-1 line-clamp-1 ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{bill.event}</h4>
                        <p className="text-xs text-gray-500 font-semibold mb-4">{lang === 'lo' ? 'ໂອນໄປຫາ:' : 'Transferred to:'} {bill.account}</p>
                        
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{lang === 'lo' ? 'ລະຫັດທຸລະກຳ' : 'Transaction ID'}</p>
                            <p className="text-sm font-bold font-mono text-gray-500 dark:text-gray-400">{bill.id}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`sm:w-56 p-4 rounded-xl flex flex-col justify-center border ${
                        theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/50' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ຍອດລວມ' : 'Gross'}</p>
                          <p className="text-xs font-bold text-gray-500">{new Intl.NumberFormat('lo-LA').format(bill.grossAmount)} ₭</p>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ຄ່າທຳນຽມ' : 'Fee'}</p>
                          <p className="text-xs font-bold text-red-500">-{new Intl.NumberFormat('lo-LA').format(bill.platformFee)} ₭</p>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-zinc-800/80">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{lang === 'lo' ? 'ຮັບເງິນສຸດທິ' : 'Net Payout'}</p>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('lo-LA').format(bill.amount)} ₭</p>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-6 lg:p-8"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
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
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
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

      {/* Toast Container */}
      <div className="fixed bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6">
        <AnimatePresence>
          {toastQueue.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-5 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border ${
                toast.type === 'error' 
                  ? theme === 'dark' ? 'bg-zinc-900 border-red-500/20 text-red-400' : 'bg-white border-red-100 text-red-500' 
                  : toast.type === 'warning'
                    ? theme === 'dark' ? 'bg-zinc-900 border-orange-500/20 text-adv-orange' : 'bg-white border-orange-100 text-adv-orange'
                    : theme === 'dark' ? 'bg-zinc-900 border-emerald-500/20 text-emerald-400' : 'bg-white border-green-100 text-green-500'
              }`}
            >
              {toast.type === 'error' && <XCircle className="w-6 h-6 shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="w-6 h-6 shrink-0" />}
              {toast.type === 'success' && <CheckCircle2 className="w-6 h-6 shrink-0" />}
              <span className={`font-bold text-sm flex-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-adv-slate'}`}>{toast.text}</span>
              <button 
                onClick={() => setToastQueue(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-300 hover:text-gray-500 transition-colors"
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
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-[200] border ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-adv-slate text-white'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-adv-orange" />
            {t.profileUpdated}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Payout Image Preview Modal */}
      <AnimatePresence>
        {payoutImagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
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
        {showBankConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowBankConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full rounded-[2rem] p-6 sm:p-8 shadow-2xl border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-black text-center mb-2">
                {lang === 'lo' ? 'ຢືນຢັນການແກ້ໄຂຂໍ້ມູນທະນາຄານ?' : 'Confirm Bank Details Update?'}
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-center leading-relaxed mb-6">
                {lang === 'lo'
                  ? 'ຫຼັງຈາກບັນທຶກແລ້ວ, ທ່ານຈະບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນບັນຊີທະນາຄານໄດ້ອີກເປັນເວລາ 30 ວັນ ເພື່ອຄວາມປອດໄພ. ທ່ານແນ່ໃຈບໍທີ່ຈະດຳເນີນການຕໍ່?'
                  : 'Once updated, you will not be able to edit your bank account details for 30 days for security purposes. Are you sure you want to proceed?'}
              </p>

              <div className={`p-4 rounded-2xl mb-6 space-y-2 text-xs border ${
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

              {/* 2FA Authenticator Field if 2FA Enabled */}
              {is2FAEnabled && (
                <div className="mb-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-adv-orange font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>{lang === 'lo' ? 'ຕ້ອງການ 2FA Authenticator' : '2FA Authenticator Required'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-relaxed">
                    {lang === 'lo'
                      ? 'ກະລຸນາປ້ອນລະຫັດ 6 ຫຼັກຈາກແອັບ Authenticator ຂອງທ່ານເພື່ອອັບເດດຂໍ້ມູນທະນາຄານ.'
                      : 'Please enter the 6-digit code from your Authenticator app to update bank details.'}
                  </p>
                  <div className="relative pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={bank2FACode}
                      onChange={(e) => setBank2FACode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className={`w-full border rounded-xl px-4 py-3 font-mono font-black text-center text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-adv-orange ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-200 text-adv-slate'
                      }`}
                    />
                    <Lock className="w-4 h-4 text-gray-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBankConfirmModal(false)}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={is2FAEnabled && bank2FACode.length < 6}
                  onClick={confirmSaveBankDetails}
                  className="flex-1 py-3.5 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'lo' ? 'ຢືນຢັນ ແລະ ບັນທຶກ' : 'Confirm & Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Event Money Modal */}
      <AnimatePresence>
        {showClaimModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowClaimModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full rounded-[2rem] p-6 sm:p-8 shadow-2xl border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-xs">
                <DollarSign className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-black text-center mb-1">
                {lang === 'lo' ? 'ຢືນຢັນການເບີກຈ່າຍເງິນກິດຈະກຳ' : 'Confirm Claim Event Money'}
              </h3>
              <p className="text-xs text-gray-400 font-medium text-center mb-5">
                {lang === 'lo' ? 'ຂໍເບີກຈ່າຍເງິນລາຍຮັບຈາກການຂາຍປີ້ກິດຈະກຳຂອງທ່ານ' : 'Request payout for your event ticket sales revenue.'}
              </p>

              <div className={`p-4 rounded-2xl mb-5 space-y-2.5 text-xs border ${
                theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-gray-150'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຈຳນວນເງິນ:' : 'Amount to Claim:'}</span>
                  <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('lo-LA').format(unclaimedRevenue)} ₭
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ຄ່າທຳນຽມ (5%):' : 'Platform Fee (5%):'}</span>
                  <span className="font-bold text-red-500">
                    -{new Intl.NumberFormat('lo-LA').format(unclaimedRevenue * 0.05)} ₭
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{lang === 'lo' ? 'ທະນາຄານຮັບເງິນ:' : 'Payout Bank:'}</span>
                  <span className="font-extrabold">{bankAccount?.bankName || 'BCEL Bank'} ({bankAccount?.accountNumber ? `*${bankAccount.accountNumber.slice(-4)}` : '*8899'})</span>
                </div>
              </div>

              {/* 2FA Authenticator Field if 2FA Enabled */}
              {is2FAEnabled && (
                <div className="mb-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-adv-orange font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>{lang === 'lo' ? 'ຕ້ອງການ 2FA Authenticator' : '2FA Authenticator Required'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-relaxed">
                    {lang === 'lo'
                      ? 'ກະລຸນາປ້ອນລະຫັດ 6 ຫຼັກຈາກແອັບ Authenticator ຂອງທ່ານເພື່ອຢືນຢັນການເບີກຈ່າຍເງິນ.'
                      : 'Please enter the 6-digit code from your Authenticator app to authorize payout.'}
                  </p>
                  <div className="relative pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={claimCode2FA}
                      onChange={(e) => setClaimCode2FA(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className={`w-full border rounded-xl px-4 py-3 font-mono font-black text-center text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-adv-orange ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-200 text-adv-slate'
                      }`}
                    />
                    <Lock className="w-4 h-4 text-gray-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.cancel || (lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={isClaiming || (is2FAEnabled && claimCode2FA.length < 6)}
                  onClick={handleConfirmClaimPayout}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  <span>{lang === 'lo' ? 'ຢືນຢັນເບີກຈ່າຍເງິນ' : 'Confirm & Claim'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
