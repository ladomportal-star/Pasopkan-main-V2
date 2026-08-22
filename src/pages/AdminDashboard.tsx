import { EventData, PayoutBill } from "../types";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RefreshCw, Shield, Users, Calendar, CheckCircle2, XCircle, Trash2, Edit, ExternalLink, Search, Filter, X, MessageSquare, ChevronDown, MapPin, Save, LayoutDashboard, TrendingUp, DollarSign, Activity, Loader2, AlertCircle, Menu, Globe, User, Bell, Plus, Info, Upload, Image as ImageIcon, Printer, CreditCard, Lock, Eye, EyeOff, LogIn, LogOut, Settings, UploadCloud, Clock, Ticket, Monitor, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { events } from '../data/events';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import Logo from '../components/Logo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SiteSettingsTab from '../components/SiteSettingsTab';
import { safeStorage } from '../lib/storage';

// Utility for exporting data
const exportToCSV = (filename: string, rows: any[]) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  // Exclude nested object fields that don't format well in basic CSV
  const keys = Object.keys(rows[0]).filter(k => k !== 'bankInfo' && k !== 'organizerInfo' && k !== 'paymentInfo');
  
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Mock data for admin panel
const initialMockUsers = [
  { id: 'u1', name: 'Jane Doe', email: 'jane.doe@example.com', role: 'user', status: 'active', joined: '2025-10-12' },
  { id: 'u2', name: 'John Smith', email: 'john.smith@example.com', role: 'organizer', status: 'active', joined: '2025-11-05' },
  { id: 'u3', name: 'Admin User', email: 'admin@pasopkan.com', role: 'admin', status: 'active', joined: '2025-01-01' },
  { id: 'u4', name: 'Spam Bot', email: 'spam@bot.com', role: 'user', status: 'suspended', joined: '2026-02-20' },
];

const initialMockPendingEvents = [
  { 
    id: 'pe1', 
    title: 'Underground Indie Fest', 
    organizer: 'John Smith', 
    date: '2026-10-15', 
    location: 'Vientiane, Laos', 
    submittedAt: '2026-03-24',
    status: 'pending',
    organizerInfo: {
      name: 'John Smith Music',
      contact: '+856 20 1234 5678',
      description: 'Local music promoter focused on indie bands.',
      idCardUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2680&auto=format&fit=crop', // mock id card
      logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop',
    },
    paymentInfo: {
      bankName: 'BCEL',
      accountName: 'JOHN SMITH',
      accountNumber: '0101100012345678',
      qrCodeUrl: 'https://images.unsplash.com/photo-1595054225856-788cf911aeaa?q=80&w=2670&auto=format&fit=crop'
    }
  },
  { 
    id: 'pe2', 
    title: 'Tech Startup Meetup', 
    organizer: 'TechLao', 
    date: '2026-11-02', 
    location: 'Luang Prabang, Laos', 
    submittedAt: '2026-03-25',
    status: 'pending',
    organizerInfo: {
      name: 'TechLao Community',
      contact: 'techlao@example.com',
      description: 'Tech enthusiasts organizing monthly meetups.',
      idCardUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2680&auto=format&fit=crop',
      logoUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2670&auto=format&fit=crop',
    },
    paymentInfo: {
      bankName: 'JDB',
      accountName: 'TECH LAO',
      accountNumber: '999912345678',
      qrCodeUrl: 'https://images.unsplash.com/photo-1595054225856-788cf911aeaa?q=80&w=2670&auto=format&fit=crop'
    }
  },
];

const mockPayoutsData = [
  {
    id: 'pay1',
    eventId: 'evt1',
    eventTitle: 'Music Festival 2026',
    organizer: 'Lao Events',
    revenue: 50000000,
    platformFeePercent: 10,
    platformFeeAmount: 5000000,
    payoutAmount: 45000000,
    status: 'pending',
    bankInfo: {
      bankName: 'BCEL',
      accountName: 'Lao Events Co.',
      accountNumber: '0101100012345678'
    },
    completedDate: '2026-07-28'
  },
  {
    id: 'pay2',
    eventId: 'evt2',
    eventTitle: 'Tech Summit Vientiane',
    organizer: 'TechLao',
    revenue: 25000000,
    platformFeePercent: 15,
    platformFeeAmount: 3750000,
    payoutAmount: 21250000,
    status: 'paid',
    bankInfo: {
      bankName: 'JDB',
      accountName: 'TechLao',
      accountNumber: '999912345678'
    },
    completedDate: '2026-07-15'
  }
];

const translations = {
  en: {
    adminPortal: 'Admin Console Access',
    adminPortalDesc: 'Enter your administrative credentials to manage Pasopkan events, users, and platform data.',
    adminEmailLabel: 'Admin Username',
    adminPasswordLabel: 'Password',
    adminLoginBtn: 'Verify and Authorize',
    adminOr: 'Or authenticate with',
    adminGoogleBtn: 'Google Admin Account',
    adminQuickAccess: 'Instant Demo Bypass (Testing)',
    adminQuickAccessDesc: 'Click below to bypass auth for review and evaluation purposes.',
    loading: 'Loading dashboard data...',
    adminDashboard: 'Admin Dashboard',
    adminDesc: 'Manage users, approve events, and oversee platform activity.',
    overview: 'Overview',
    ticketSalesTrend: 'Ticket Sales Trend',
    salesVolumeLast30Days: 'Sales Volume & Revenue (Last 30 Days)',
    tickets: 'Tickets Sold',
    revenue: 'Revenue',
    pendingApprovals: 'Pending Approvals',
    manageUsers: 'Manage Users',
    eventUpcoming: 'Event Upcoming',
    eventAlreadyDone: 'Event Already Done',
    searchPlaceholder: 'Search...',
    allMonths: 'All Months',
    allYears: 'All Years',
    totalRevenue: 'Total Revenue',
    activeUsers: 'Active Users',
    totalEvents: 'Total Events',
    ticketsSold: 'Tickets Sold',
    recentActivity: 'Recent Activity',
    userRegistered: 'New user registered',
    eventApproved: 'Event approved',
    eventRejected: 'Event rejected',
    ticketPurchased: 'Ticket purchased',
    eventSubmitted: 'New event submitted',
    approve: 'Approve',
    reject: 'Reject',
    noPendingEvents: 'No pending events to review.',
    pendingEvents: 'pending events',
    totalUsers: 'Total Users',
    activeEvents: 'active events',
    suspendedUsers: 'Suspended Users',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    joined: 'Joined',
    actions: 'Actions',
    edit: 'Edit',
    suspend: 'Suspend',
    noUsersFound: 'No users found matching your search.',
    event: 'Event',
    organizer: 'Organizer',
    date: 'Date',
    location: 'Location',
    view: 'View',
    delete: 'Delete',
    noEventsFound: 'No events found matching your search.',
    editUser: 'Edit User',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    editEvent: 'Edit Event',
    title: 'Title',
    reviewEvent: 'Review Event',
    addComment: 'Add Comment',
    addCommentPlaceholder: 'Add a comment or reason for rejection...',
    submitComment: 'Submit Comment',
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
    scanTickets: 'Scan Tickets',
    scanQrCode: 'Scan QR Code',
    scanDesc: 'Position the QR code within the frame to scan.',
    validTicket: 'Valid Ticket!',
    ticketId: 'Ticket ID',
    invalidTicket: 'Invalid Ticket',
    scanAnother: 'Scan Another Ticket',
    eventDetails: 'Event Details',
    finished: 'Finished',
    adminActions: 'Admin Actions',
    viewPage: 'View Page',
    postComment: 'Post Comment',
    selectCategory: 'Select Category',
    searchLocation: 'Search location...',
    upcoming: 'Upcoming',
    manage: 'Manage',
    desktopOnly: 'Desktop Only',
    desktopWarning: 'The admin dashboard is optimized for desktop viewing. Please access this page on a larger screen for the best experience.',
    returnToHome: 'Return to Home',
    reviewApprovals: 'Review Approvals',
    draftNewEvent: 'Draft a new event',
    allCaughtUp: 'You\'re all caught up!',
    submittedOn: 'Submitted on',
    viewDetails: 'View Details',
    description: 'Description',
    organizerKyc: 'Organizer KYC & Info',
    contactInfo: 'Contact Information',
    idCard: 'ID Card / Passport Document',
    payoutInfo: 'Payout Information',
    bankAccount: 'Bank Account Name',
    accountNumber: 'Account Number',
    approveEvent: 'Approve Event',
    rejectEvent: 'Reject Event',
    notifications: 'Notifications',
    sendNotification: 'Send Notification',
    notificationTitle: 'Notification Title',
    notificationMessage: 'Message',
    notificationCategory: 'Category',
    noted: 'Noted',
    upcomingEvent: 'Upcoming Event',
    targetUsers: 'Target Users',
    allUsers: 'All Users',
    organizersOnly: 'Organizers Only',
    notificationHistory: 'Notification History',
    placeholderTitle: 'e.g. Early Bird Tickets ending soon!',
    placeholderMessage: 'Write your notification message here...',
    notificationImage: 'Notification Image (URL)',
    scheduleTime: 'Schedule Time (Optional)',
    readBy: 'Read by',
    users: 'users',
    sendNow: 'Send Now',
    scheduled: 'Scheduled',
    printReport: 'Print Report',
    systemReport: 'System Report',
    payouts: 'Payouts',
    payoutsDesc: 'Manage organizer payouts, platform fees, and view profits.',
    platformFee: 'Platform Fee (%)',
    totalProfit: 'Total Profit',
    markPaid: 'Mark as Paid',
    pendingPayout: 'Pending',
    paid: 'Paid',
    amount: 'Amount',
  },
  lo: {
    adminPortal: 'ການເຂົ້າເຖິງລະບົບແອັດມິນ',
    adminPortalDesc: 'ປ້ອນຂໍ້ມູນປະຈຳຕົວຂອງທ່ານເພື່ອຈັດການກິດຈະກຳ, ຜູ້ໃຊ້ ແລະ ຂໍ້ມູນຂອງລະບົບ Pasopkan.',
    adminEmailLabel: 'ຊື່ຜູ້ໃຊ້ແອດມິນ',
    adminPasswordLabel: 'ລະຫັດຜ່ານ',
    adminLoginBtn: 'ກວດສອບ ແລະ ເຂົ້າສູ່ລະບົບ',
    adminOr: 'ຫຼື ຢືນຢັນຕົວຕົນດ້ວຍ',
    adminGoogleBtn: 'ບັນຊີ Google ແອັດມິນ',
    adminQuickAccess: 'ເຂົ້າເຖິງແບບທົດລອງດ່ວນ (ສຳລັບທົດສອບ)',
    adminQuickAccessDesc: 'ຄລິກດ້ານລຸ່ມເພື່ອຂ້າມຜ່ານການເຂົ້າສູ່ລະບົບເພື່ອການທົດສອບ ແລະ ປະເມີນຜົນ.',
    loading: 'ກຳລັງໂຫຼດຂໍ້ມູນແດຊບອດ...',
    adminDashboard: 'ແດຊບອດຜູ້ເບິ່ງແຍງລະບົບ',
    adminDesc: 'ຈັດການຜູ້ໃຊ້, ອະນຸມັດ event, ແລະ ເບິ່ງແຍງກິດຈະກຳຂອງແພລດຟອມ.',
    overview: 'ພາບລວມ',
    ticketSalesTrend: 'ແນວໂນ້ມການຂາຍປີ້',
    salesVolumeLast30Days: 'ປະລິມານການຂາຍ ແລະ ລາຍຮັບ (30 ວັນຫຼ້າສຸດ)',
    tickets: 'ປີ້ທີ່ຂາຍແລ້ວ',
    revenue: 'ລາຍຮັບ',
    pendingApprovals: 'ລໍຖ້າການອະນຸມັດ',
    manageUsers: 'ຈັດການຜູ້ໃຊ້',
    eventUpcoming: 'event ທີ່ຈະມາເຖິງ',
    eventAlreadyDone: 'event ທີ່ສຳເລັດແລ້ວ',
    searchPlaceholder: 'ຄົ້ນຫາ...',
    allMonths: 'ທຸກເດືອນ',
    allYears: 'ທຸກປີ',
    totalRevenue: 'ລາຍຮັບທັງໝົດ',
    activeUsers: 'ຜູ້ໃຊ້ທີ່ເຄື່ອນໄຫວ',
    totalEvents: 'event ທັງໝົດ',
    ticketsSold: 'ປີ້ທີ່ຂາຍແລ້ວ',
    recentActivity: 'ກິດຈະກຳຫຼ້າສຸດ',
    userRegistered: 'ຜູ້ໃຊ້ໃໝ່ລົງທະບຽນ',
    eventApproved: 'event ຖືກອະນຸມັດ',
    ticketPurchased: 'ຊື້ປີ້ແລ້ວ',
    eventSubmitted: 'ສົ່ງ event ໃໝ່ແລ້ວ',
    approve: 'ອະນຸມັດ',
    reject: 'ປະຕິເສດ',
    noPendingEvents: 'ບໍ່ມີ event ທີ່ລໍຖ້າການກວດສອບ.',
    pendingEvents: 'event ທີ່ລໍຖ້າການອະນຸມັດ',
    totalUsers: 'ຜູ້ໃຊ້ທັງໝົດ',
    activeEvents: 'event ທີ່ເຄື່ອນໄຫວ',
    suspendedUsers: 'ຜູ້ໃຊ້ທີ່ຖືກໂຈະ',
    name: 'ຊື່',
    email: 'ອີເມວ',
    role: 'ບົດບາດ',
    status: 'ສະຖານະ',
    joined: 'ເຂົ້າຮ່ວມ',
    actions: 'ການກະທຳ',
    edit: 'ແກ້ໄຂ',
    suspend: 'ໂຈະ',
    noUsersFound: 'ບໍ່ພົບຜູ້ໃຊ້ທີ່ກົງກັບການຄົ້ນຫາຂອງທ່ານ.',
    event: 'event',
    organizer: 'ຜູ້ຈັດງານ',
    date: 'ວັນທີ',
    location: 'ສະຖານທີ່',
    view: 'ເບິ່ງ',
    delete: 'ລຶບ',
    noEventsFound: 'ບໍ່ພົບ event ທີ່ກົງກັບການຄົ້ນຫາຂອງທ່ານ.',
    editUser: 'ແກ້ໄຂຜູ້ໃຊ້',
    saveChanges: 'ບັນທຶກການປ່ຽນແປງ',
    cancel: 'ຍົກເລີກ',
    editEvent: 'ແກ້ໄຂ event',
    title: 'ຫົວຂໍ້',
    reviewEvent: 'ກວດສອບ event',
    addComment: 'ເພີ່ມຄຳເຫັນ',
    addCommentPlaceholder: 'ເພີ່ມຄຳເຫັນ ຫຼື ເຫດຜົນໃນການປະຕິເສດ...',
    submitComment: 'ສົ່ງຄຳເຫັນ',
    january: 'ມັງກອນ',
    february: 'ກຸມພາ',
    march: 'ມີນາ',
    april: 'ເມສາ',
    may: 'ພຶດສະພາ',
    june: 'ມິຖຸນາ',
    july: 'ກໍລະກົດ',
    august: 'ສິງຫາ',
    september: 'ກັນຍາ',
    october: 'ຕຸລາ',
    november: 'ພະຈິກ',
    december: 'ທັນວາ',
    scanTickets: 'ສະແກນປີ້',
    scanQrCode: 'ສະແກນ QR Code',
    scanDesc: 'ວາງ QR code ພາຍໃນກອບເພື່ອສະແກນ.',
    validTicket: 'ປີ້ຖືກຕ້ອງ!',
    ticketId: 'ລະຫັດປີ້',
    invalidTicket: 'ປີ້ບໍ່ຖືກຕ້ອງ',
    scanAnother: 'ສະແກນປີ້ອື່ນ',
    eventDetails: 'ລາຍລະອຽດ event',
    finished: 'ສຳເລັດແລ້ວ',
    adminActions: 'ການກະທຳຂອງແອັດມິນ',
    viewPage: 'ເບິ່ງໜ້າ',
    postComment: 'ໂພສຄຳເຫັນ',
    selectCategory: 'ເລືອກປະເພດ',
    searchLocation: 'ຄົ້ນຫາສະຖານທີ່...',
    upcoming: 'ທີ່ຈະມາເຖິງ',
    manage: 'ຈັດການ',
    desktopOnly: 'ສຳລັບເດັສທັອບເທົ່ານັ້ນ',
    desktopWarning: 'ແດຊບອດຜູ້ເບິ່ງແຍງລະບົບຖືກປັບໃຫ້ເໝາະສົມສຳລັບການເບິ່ງເທິງເດັສທັອບ. ກະລຸນາເຂົ້າເບິ່ງໜ້ານີ້ໃນໜ້າຈໍທີ່ໃຫຍ່ກວ່າເພື່ອປະສົບການທີ່ດີທີ່ສຸດ.',
    returnToHome: 'ກັບຄືນໜ້າຫຼັກ',
    reviewApprovals: 'ກວດສອບການອະນຸມັດ',
    draftNewEvent: 'ຮ່າງ event ໃໝ່',
    allCaughtUp: 'ທ່ານໄດ້ກວດສອບທັງໝົດແລ້ວ!',
    submittedOn: 'ສົ່ງເມື່ອ',
    viewDetails: 'ເບິ່ງລາຍລະອຽດ',
    description: 'ລາຍລະອຽດ',
    organizerKyc: 'ຂໍ້ມູນຜູ້ຈັດ ແລະ KYC',
    contactInfo: 'ຂໍ້ມູນຕິດຕໍ່',
    idCard: 'ບັດປະຈຳຕົວ / ເອກະສານໜັງສືຜ່ານແດນ',
    payoutInfo: 'ຂໍ້ມູນການຮັບເງິນ (Payout)',
    bankAccount: 'ຊື່ບັນຊີທະນາຄານ',
    accountNumber: 'ໝາຍເລກບັນຊີ',
    approveEvent: 'ອະນຸມັດກິດຈະກຳ',
    rejectEvent: 'ປະຕິເສດກິດຈະກຳ',
    notifications: 'ການແຈ້ງເຕືອນ',
    sendNotification: 'ສົ່ງການແຈ້ງເຕືອນ',
    notificationTitle: 'ຫົວຂໍ້ການແຈ້ງເຕືອນ',
    notificationMessage: 'ຂໍ້ຄວາມ',
    notificationCategory: 'ປະເພດ',
    noted: 'ບັນທຶກແລ້ວ',
    upcomingEvent: 'ກິດຈະກຳໃໝ່',
    targetUsers: 'ກຸ່ມເປົ້າໝາຍ',
    allUsers: 'ຜູ້ໃຊ້ທັງໝົດ',
    organizersOnly: 'ຜູ້ຈັດງານເທົ່ານັ້ນ',
    notificationHistory: 'ປະຫວັດການແຈ້ງເຕືອນ',
    placeholderTitle: 'ຕົວຢ່າງ: ປີ້ໃກ້ຈະໝົດແລ້ວ!',
    placeholderMessage: 'ພິມຂໍ້ຄວາມການແແຈ້ງເຕືອນຂອງທ່ານຢູ່ນີ້...',
    notificationImage: 'ຮູບພາບການແຈ້ງເຕືອນ (URL)',
    scheduleTime: 'ເວລາສົ່ງ (ຖ້າຕ້ອງການ)',
    readBy: 'ອ່ານແລ້ວໂດຍ',
    users: 'ຜູ້ໃຊ້',
    sendNow: 'ສົ່ງທັນທີ',
    scheduled: 'ຕັ້ງເວລາແລ້ວ',
    printReport: 'ພິມລາຍງານ',
    systemReport: 'ລາຍງານລະບົບ',
    payouts: 'ການເບີກຈ່າຍເງິນ',
    payoutsDesc: 'ຈັດການການເບີກຈ່າຍໃຫ້ຜູ້ຈັດງານ, ຄ່າທຳນຽມ ແລະ ກຳໄລ.',
    platformFee: 'ຄ່າທຳນຽມລະບົບ (%)',
    totalProfit: 'ກຳໄລທັງໝົດ',
    markPaid: 'ໝາຍວ່າຈ່າຍແລ້ວ',
    pendingPayout: 'ລໍຖ້າຈ່າຍ',
    paid: 'ຈ່າຍແລ້ວ',
    amount: 'ຈຳນວນເງິນ',
  }
};

export default function AdminDashboard() {
  const { lang, toggleLanguage } = useLanguage();
  const t = translations[lang];
  const currency = lang === 'lo' ? 'ກີບ' : 'Kip';

  const { user, loginWithGoogle } = useAuth();
  const { theme } = useTheme();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('pasopkan_admin_authorized') === 'true';
  });

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if current user is an admin in Firestore
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const adminEmails = ['phanyadeth@gmail.com', 'admin@pasopkan.com'];
        if (adminEmails.includes(user.email || '')) {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('pasopkan_admin_authorized', 'true');
          return;
        }

        // Only query Firestore if we have a real active Firebase authenticated user matching our user.uid
        if (auth.currentUser && auth.currentUser.uid === user.uid) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.role === 'admin') {
                setIsAdminAuthenticated(true);
                sessionStorage.setItem('pasopkan_admin_authorized', 'true');
              }
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }
        }
      }
    };
    checkUserRole();
  }, [user]);

  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const trimmedUsername = adminUsername.trim().toLowerCase();
      const trimmedPass = adminPassword.trim();

      if (
        (trimmedUsername === 'admin' && (trimmedPass === 'admin123' || trimmedPass === 'Admin2026!' || trimmedPass === 'admin')) ||
        (trimmedUsername === 'phanyadeth' && (trimmedPass === 'admin123' || trimmedPass === 'Admin2026!' || trimmedPass === 'admin')) ||
        (trimmedUsername === 'admin@pasopkan.com' && (trimmedPass === 'admin123' || trimmedPass === 'Admin2026!')) ||
        (trimmedUsername === 'phanyadeth@gmail.com' && (trimmedPass === 'admin123' || trimmedPass === 'Admin2026!'))
      ) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('pasopkan_admin_authorized', 'true');
      } else {
        setLoginError(lang === 'en' ? 'Invalid admin username or password.' : 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານຂອງແອດມິນບໍ່ຖືກຕ້ອງ.');
      }
    } catch (err) {
      setLoginError(lang === 'en' ? 'An error occurred. Please try again.' : 'ເກີດຂໍ້ຜິດພາດ. ກະລຸນາລອງໃໝ່.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('pasopkan_admin_authorized');
    setAdminUsername('');
    setAdminPassword('');
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users' | 'events' | 'past-events' | 'payouts' | 'activity-log' | 'notifications' | 'site-settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [payoutDateFilter, setPayoutDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  const [uploadingBill, setUploadingBill] = useState<Record<string, string>>({});
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [tempFeePercent, setTempFeePercent] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  
  const [usersList, setUsersList] = useState(() => {
    const list = [...initialMockUsers];
    try {
      const savedUserStr = safeStorage.getItem('pasopkan_user_profile');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.firstName) {
          const isDup = list.some(u => u.email === savedUser.email);
          if (!isDup) {
            list.unshift({
              id: 'u-live',
              name: `${savedUser.firstName} ${savedUser.lastName}`,
              email: savedUser.email || 'user@example.com',
              role: savedUser.role || 'user',
              status: 'active',
              joined: new Date().toISOString().split('T')[0]
            });
          }
        }
      }
    } catch(e) {}
    return list;
  });
  
  const [realTickets, setRealTickets] = useState<any[]>(() => {
    try {
      const tickets = safeStorage.getItem('pasopkan_user_tickets');
      return tickets ? JSON.parse(tickets) : [];
    } catch(e) { return []; }
  });

  const [payoutsList, setPayoutsList] = useState(() => {
    try {
      const txnsRaw = safeStorage.getItem('pasopkan_user_transactions');
      if (txnsRaw) {
        const txns = JSON.parse(txnsRaw);
        // Create a fake payout summary from real transactions
        if (Array.isArray(txns) && txns.length > 0) {
          const livePayout = {
            id: 'pay-live',
            eventId: 'evt-real',
            eventTitle: txns[0].event?.title || 'Live Ticket Sales',
            organizer: 'Live Platform User',
            revenue: txns.reduce((sum: number, tx: any) => {
              const amount = parseInt(tx.amount.replace(/[^0-9]/g, '')) || 0;
              return sum + amount;
            }, 0),
            platformFeePercent: 10,
            platformFeeAmount: txns.reduce((sum: number, tx: any) => {
              const amount = parseInt(tx.amount.replace(/[^0-9]/g, '')) || 0;
              return sum + amount;
            }, 0) * 0.1,
            payoutAmount: txns.reduce((sum: number, tx: any) => {
              const amount = parseInt(tx.amount.replace(/[^0-9]/g, '')) || 0;
              return sum + amount;
            }, 0) * 0.9,
            status: 'pending',
            bankInfo: {
              bankName: 'BCEL',
              accountName: 'Platform Vendor',
              accountNumber: 'XXXXX1234'
            },
            completedDate: ''
          };
          return [livePayout, ...mockPayoutsData];
        }
      }
    } catch(e) {}
    return mockPayoutsData;
  });
  const [eventsList, setEventsList] = useState(() => {
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        const all = JSON.parse(saved);
        return all.filter((e: any) => e.status !== 'pending' && e.status !== 'rejected');
      }
    } catch (err) {
      console.error(err);
    }
    return events;
  });
  const [pendingEventsList, setPendingEventsList] = useState(() => {
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        const all = JSON.parse(saved);
        const pending = all.filter((e: any) => e.status === 'pending');
        return [...pending, ...initialMockPendingEvents];
      }
    } catch (err) {
      console.error(err);
    }
    return initialMockPendingEvents;
  });
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingIdCardUrl, setViewingIdCardUrl] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Notifications Admin State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifImage, setNotifImage] = useState('');
  const [notifScheduleTime, setNotifScheduleTime] = useState('');
  const [notifCategory, setNotifCategory] = useState<'upcomingEvent' | 'noted'>('upcomingEvent');
  const [notifTarget, setNotifTarget] = useState<'all' | 'organizers'>('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [sentNotifications, setSentNotifications] = useState<any[]>([
    { id: 'sn1', title: 'System Maintenance', category: 'noted', target: 'all', timestamp: '2026-04-05T10:00:00Z', status: 'sent', readCount: 120, image: 'https://images.unsplash.com/photo-1588702547919-26089e690f9a?q=80&w=2670&auto=format&fit=crop' },
    { id: 'sn2', title: 'Indie Fest Flash Sale', category: 'upcomingEvent', target: 'all', timestamp: '2026-04-04T15:30:00Z', status: 'sent', readCount: 450 },
  ]);

  const [activityLogs, setActivityLogs] = useState<any[]>(() => {
    const logs = [
      { id: 'log1', action: 'User role changed', details: 'Jane Doe changed to organizer', admin: 'Admin User', timestamp: '2026-04-01T08:00:00Z' },
      { id: 'log2', action: 'Event approved', details: 'Music Festival 2026', admin: 'Admin User', timestamp: '2026-04-01T07:30:00Z' },
    ];
    try {
      const txnsRaw = safeStorage.getItem('pasopkan_user_transactions');
      if (txnsRaw) {
        const txns = JSON.parse(txnsRaw);
        txns.forEach((tx: any) => {
          logs.unshift({
            id: `log-${tx.id}`,
            action: 'Ticket purchased',
            details: `${tx.quantity}x ${tx.event?.title || 'Event Ticket'}`,
            admin: 'System',
            timestamp: tx.date || new Date().toISOString()
          });
        });
      }
    } catch(e) {}
    return logs;
  });

  const addActivityLog = (action: string, details: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      action,
      details,
      admin: 'Admin User', // In a real app, this would be the currently logged-in admin
      timestamp: new Date().toISOString(),
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleExportData = () => {
    switch (activeTab) {
      case 'users':
        exportToCSV('pasopkan_users.csv', usersList);
        break;
      case 'events':
        exportToCSV('pasopkan_events.csv', eventsList);
        break;
      case 'past-events':
        exportToCSV('pasopkan_past_events.csv', eventsList.filter(e => new Date(e.date) < new Date()));
        break;
      case 'approvals':
        exportToCSV('pasopkan_pending_approvals.csv', pendingEventsList);
        break;
      case 'payouts':
        exportToCSV('pasopkan_payouts.csv', payoutsList);
        break;
      case 'activity-log':
        exportToCSV('pasopkan_activity_logs.csv', activityLogs);
        break;
      default:
        break;
    }
  };

  const handleApprove = (id: string) => {
    const eventToApprove = pendingEventsList.find(e => e.id === id);
    if (eventToApprove) {
      const isFromStorage = !id.startsWith('pe');
      let approvedEvent = { ...eventToApprove, status: 'approved' };
      if (!isFromStorage) {
        approvedEvent = {
          id: `evt-${Date.now()}`,
          title: eventToApprove.title,
          organizer: eventToApprove.organizer,
          date: eventToApprove.date,
          location: eventToApprove.location,
          category: 'Festival',
          image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop',
          ticketTiers: [{ id: 't1', name: 'General Admission', price: 50000, available: 100 }],
          description: 'Newly approved event.',
          status: 'approved',
        } as any;
      }

      // Update local storage so the organizer gets the approved status
      try {
        const saved = safeStorage.getItem('organizer_events');
        const allEvents = saved ? JSON.parse(saved) : [...events];
        const exists = allEvents.some((e: any) => e.id === approvedEvent.id);
        let updatedStorageEvents;
        if (exists) {
          updatedStorageEvents = allEvents.map((e: any) => e.id === approvedEvent.id ? { ...e, status: 'approved' } : e);
        } else {
          updatedStorageEvents = [approvedEvent, ...allEvents];
        }
        safeStorage.setItem('organizer_events', JSON.stringify(updatedStorageEvents));
      } catch (err) {
        console.error(err);
      }

      setEventsList([approvedEvent, ...eventsList]);
      setPendingEventsList(pendingEventsList.filter(e => e.id !== id));
      addActivityLog('Event approved', eventToApprove.title);
    }
  };

  const handleReject = (id: string, reason?: string) => {
    const eventToReject = pendingEventsList.find(e => e.id === id);
    if (eventToReject) {
      const isFromStorage = !id.startsWith('pe');
      if (isFromStorage) {
        try {
          const saved = safeStorage.getItem('organizer_events');
          const allEvents = saved ? JSON.parse(saved) : [...events];
          const updatedStorageEvents = allEvents.map((e: any) => e.id === eventToReject.id ? { ...e, status: 'rejected' } : e);
          safeStorage.setItem('organizer_events', JSON.stringify(updatedStorageEvents));
        } catch (err) {
          console.error(err);
        }
      }
      addActivityLog('Event rejected', `${eventToReject.title}${reason ? `: ${reason}` : ''}`);
    }
    setPendingEventsList(pendingEventsList.filter(e => e.id !== id));
    setComment('');
    setShowRejectionModal(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    const eventToDelete = eventsList.find(e => e.id === id);
    if (eventToDelete) {
      try {
        const saved = safeStorage.getItem('organizer_events');
        if (saved) {
          const allEvents = JSON.parse(saved);
          const updatedStorageEvents = allEvents.filter((e: any) => e.id !== id);
          safeStorage.setItem('organizer_events', JSON.stringify(updatedStorageEvents));
        }
      } catch (err) {
        console.error(err);
      }
      addActivityLog('Event deleted', eventToDelete.title);
    }
    setEventsList(eventsList.filter(e => e.id !== id));
    setSelectedEvent(null);
  };

  const handleSuspendUser = (id: string) => {
    const user = usersList.find(u => u.id === id);
    if (user) {
      addActivityLog('User suspended', user.name);
    }
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: 'suspended' } : u));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const oldUser = usersList.find(u => u.id === editingUser.id);
    if (oldUser && oldUser.role !== editingUser.role) {
      addActivityLog('User role changed', `${editingUser.name} changed to ${editingUser.role}`);
    }
    setUsersList(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComment('');
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingEvent.title?.trim()) {
      setEditError('Title is required');
      return;
    }
    if (!editingEvent.date) {
      setEditError('Date is required');
      return;
    }
    if (!editingEvent.location?.trim()) {
      setEditError('Location is required');
      return;
    }
    if (!editingEvent.category?.trim()) {
      setEditError('Category is required');
      return;
    }
    if (!editingEvent.image?.trim()) {
      setEditError('Image URL is required');
      return;
    }
    
    // validate ticket tiers
    if (editingEvent.ticketTiers) {
      for (const tier of editingEvent.ticketTiers) {
        if (!tier.name?.trim()) {
          setEditError('Ticket tier name is required');
          return;
        }
        if (tier.price < 0) {
          setEditError('Ticket tier price cannot be negative');
          return;
        }
        if (tier.available < 0) {
          setEditError('Ticket tier quantity cannot be negative');
          return;
        }
      }
    }

    // validate seating map image
    if (editingEvent.hasSeating && editingEvent.zoneImage && !editingEvent.zoneImage.startsWith('http')) {
      setEditError('Zone image must be a valid URL');
      return;
    }

    addActivityLog('Event edited', `Edited details for ${editingEvent.title}`);
    
    // Update active and pending events lists based on status
    if (editingEvent.status === 'pending') {
      setPendingEventsList(prev => prev.some(e => e.id === editingEvent.id) 
        ? prev.map(e => e.id === editingEvent.id ? editingEvent : e) 
        : [editingEvent, ...prev]);
      setEventsList(prev => prev.filter(e => e.id !== editingEvent.id));
    } else if (editingEvent.status === 'rejected') {
      setPendingEventsList(prev => prev.filter(e => e.id !== editingEvent.id));
      setEventsList(prev => prev.filter(e => e.id !== editingEvent.id));
    } else {
      setEventsList(prev => prev.some(e => e.id === editingEvent.id) 
        ? prev.map(e => e.id === editingEvent.id ? editingEvent : e) 
        : [editingEvent, ...prev]);
      setPendingEventsList(prev => prev.filter(e => e.id !== editingEvent.id));
    }

    // Update selected event if it's the one we're editing
    if (selectedEvent?.id === editingEvent.id) {
      setSelectedEvent(editingEvent);
    }
    
    // Persist to storage
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        const allEvents = JSON.parse(saved);
        const exists = allEvents.some((ev: any) => String(ev.id) === String(editingEvent.id));
        let newStorageEvents;
        if (exists) {
          newStorageEvents = allEvents.map((ev: any) => String(ev.id) === String(editingEvent.id) ? editingEvent : ev);
        } else {
          newStorageEvents = [editingEvent, ...allEvents];
        }
        safeStorage.setItem('organizer_events', JSON.stringify(newStorageEvents));
      } else {
        safeStorage.setItem('organizer_events', JSON.stringify([editingEvent]));
      }
    } catch (err) {
      console.error(err);
    }
    
    setEditingEvent(null);
  };

  const filteredOverviewEvents = eventsList.filter(e => {
    const eventDate = new Date(e.date);
    const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
    const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
    return matchesMonth && matchesYear;
  });

  const filteredPayouts = payoutsList.filter(p => {
    if (!p.completedDate) return true;
    const pDate = new Date(p.completedDate);
    const matchesMonth = filterMonth === 'all' || (pDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
    const matchesYear = filterYear === 'all' || pDate.getFullYear().toString() === filterYear;
    return matchesMonth && matchesYear;
  });

  const salesTrendData = React.useMemo(() => {
    const days = 30;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const dailyData = new Map();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-US", {
        month: "short",
        day: "numeric"
      });
      dailyData.set(dateKey, { date: dayLabel, tickets: 0, revenue: 0 });
    }

    realTickets.forEach(ticket => {
      if (ticket.purchaseDate) {
        const ticketDate = new Date(ticket.purchaseDate);
        ticketDate.setHours(0, 0, 0, 0);
        const dateKey = ticketDate.toISOString().split("T")[0];
        
        if (dailyData.has(dateKey)) {
          const existing = dailyData.get(dateKey);
          const quantity = Number(ticket.quantity) || 1;
          const price = Number(ticket.tier?.price) || 0;
          existing.tickets += quantity;
          existing.revenue += (quantity * price) / 1000;
        }
      }
    });

    return Array.from(dailyData.values());
  }, [realTickets, lang]);

  if (!isAdminAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'
      }`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all group shadow-sm ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-white hover:bg-gray-50 border-gray-100'
            }`}
            title={t.switchLanguage || 'Language'}
          >
            <Globe className="w-3.5 h-3.5 text-gray-400 group-hover:text-adv-orange transition-colors" />
            <span className="text-xs font-black text-adv-slate uppercase tracking-wider">{lang === 'lo' ? 'la' : lang}</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8"
        >
          <div className="flex flex-col items-center">
            <Link to="/" className="flex flex-col items-center justify-center transition-transform duration-500 ease-out hover:scale-105 cursor-pointer mb-6">
              <img 
                src="/pasopkan_logo.png" 
                alt="Pasopkan Logo" 
                className="h-28 sm:h-36 md:h-40 w-auto object-contain max-w-full drop-shadow-sm" 
                referrerPolicy="no-referrer"
              />
              <span className="text-xs uppercase tracking-[0.25em] text-gray-400 font-extrabold mt-3">{t.adminDashboard}</span>
            </Link>
            
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${
              theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-orange-50 border border-orange-100'
            }`}>
              <Shield className="w-7 h-7 text-adv-orange" />
            </div>

            <h2 className={`text-center text-3xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {t.adminPortal}
            </h2>
            <p className={`mt-2 text-center text-sm ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
            }`}>
              {t.adminPortalDesc}
            </p>
          </div>

          <div className={`mt-8 py-8 px-6 shadow-xl rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800/80 shadow-zinc-950/50' : 'bg-white border-gray-100 shadow-gray-100/50'
          }`}>
            <form onSubmit={handleAdminPasswordLogin} className="space-y-6">
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">{loginError}</span>
                </motion.div>
              )}

              <div>
                <label htmlFor="username" className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                }`}>
                  {t.adminEmailLabel}
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    className={`block w-full pl-11 pr-4 py-3 border rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange ${
                      theme === 'dark' 
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                }`}>
                  {t.adminPasswordLabel}
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`block w-full pl-11 pr-12 py-3 border rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange ${
                      theme === 'dark' 
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-adv-orange transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-2xl text-sm font-black text-white bg-adv-orange hover:bg-adv-orange/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-adv-orange disabled:opacity-50 transition-all shadow-lg shadow-orange-100 dark:shadow-none"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {t.adminLoginBtn}
              </button>
            </form>

            {/* Quick Demo Access Bypass */}
            <div className={`mt-8 pt-6 border-t ${
              theme === 'dark' ? 'border-zinc-800/80' : 'border-gray-100'
            }`}>
              <div className="text-center">
                <span className={`text-[10px] uppercase font-black tracking-widest ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`}>
                  {t.adminQuickAccess}
                </span>
                <p className={`mt-1 text-xs mb-3 ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`}>
                  {t.adminQuickAccessDesc}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthenticated(true);
                    sessionStorage.setItem('pasopkan_admin_authorized', 'true');
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-black tracking-wide uppercase transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-orange-950 text-adv-orange hover:bg-orange-950/20'
                      : 'bg-orange-50 border-orange-100 text-adv-orange hover:bg-orange-100/50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Bypass & Enter
                </button>
              </div>
            </div>

          </div>
          
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-adv-orange transition-colors"
            >
              <span>← Back to Homepage</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8 md:py-12 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-64 h-10 bg-gray-100 rounded mb-4"></div>
          <div className="w-96 h-5 bg-gray-100 rounded mb-8"></div>
          
          <div className="flex gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-32 h-10 bg-gray-50 rounded-full"></div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-gray-50 rounded-xl mb-4"></div>
                <div className="w-24 h-8 bg-gray-50 rounded mb-2"></div>
                <div className="w-32 h-4 bg-gray-50 rounded"></div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <div className="w-48 h-6 bg-gray-50 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-16 bg-gray-50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-12 pb-24 md:pb-12 print:bg-white print:py-0 print:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        
        {/* Print Header */}
        <div className="hidden print:flex flex-col mb-12 border-b-2 border-adv-slate pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/pasopkan_logo.png" alt="Pasopkan Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">{t.systemReport}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-adv-slate">{new Date().toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Generated by Admin Dashboard</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 lg:mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
              <div className="flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105">
                <img src="/pasopkan_logo.png" alt="Pasopkan Logo" className="h-20 sm:h-24 md:h-28 w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="hidden sm:flex flex-col pt-0.5">
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-3 h-3 text-adv-orange" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold leading-none">{t.adminDashboard}</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-white hover:bg-gray-50 rounded-full transition-all border border-gray-100 group shadow-sm"
              title={t.switchLanguage || 'Language'}
            >
              <Globe className="w-3.5 h-3.5 text-gray-400 group-hover:text-adv-orange transition-colors" />
              <span className="text-xs font-black text-adv-slate uppercase tracking-wider">{lang === 'lo' ? 'la' : lang}</span>
            </button>
            <Link to="/account" className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-adv-orange transition-all shadow-sm" title={t.account}>
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={handleAdminLogout}
              className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/30 transition-all shadow-sm"
              title={lang === 'lo' ? 'ອອກຈາກລະບົບແອັດມິນ' : 'Exit Admin Panel'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          
          {/* Navigation - Sidebar on Desktop, Horizontal on Mobile */}
          <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 hide-scrollbar print:hidden">
            <button
               onClick={() => setActiveTab('overview')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'overview' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-white' : 'text-gray-400'}`} />
              {t.overview}
            </button>
            
            <button
               onClick={() => setActiveTab('approvals')}
               className={`flex items-center justify-between gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'approvals' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
               <div className="flex items-center gap-3">
                 <CheckCircle2 className={`w-4 h-4 ${activeTab === 'approvals' ? 'text-white' : 'text-gray-400'}`} />
                 {t.pendingApprovals}
               </div>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                 activeTab === 'approvals' ? 'bg-white/20 text-white' : 'bg-orange-50 text-adv-orange'
               }`}>
                 {pendingEventsList.length}
               </span>
            </button>
            
            <button
               onClick={() => setActiveTab('users')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'users' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : 'text-gray-400'}`} />
              {t.manageUsers}
            </button>
            
            <button
               onClick={() => setActiveTab('events')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'events' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'events' ? 'text-white' : 'text-gray-400'}`} />
              {t.eventUpcoming}
            </button>
            
            <button
               onClick={() => setActiveTab('past-events')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'past-events' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'past-events' ? 'text-white' : 'text-gray-400'}`} />
              {t.eventAlreadyDone}
            </button>

            <button
               onClick={() => setActiveTab('payouts')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'payouts' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <DollarSign className={`w-4 h-4 ${activeTab === 'payouts' ? 'text-white' : 'text-gray-400'}`} />
              {t.payouts}
            </button>

            <button
               onClick={() => setActiveTab('activity-log')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'activity-log' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Activity className={`w-4 h-4 ${activeTab === 'activity-log' ? 'text-white' : 'text-gray-400'}`} />
              Activity Log
            </button>

            <button
               onClick={() => setActiveTab('notifications')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'notifications' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-white' : 'text-gray-400'}`} />
              {t.notifications}
            </button>

            <button
               onClick={() => setActiveTab('site-settings')}
               className={`flex items-center gap-3 px-5 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'site-settings' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'site-settings' ? 'text-white' : 'text-gray-400'}`} />
              {lang === 'lo' ? 'ຕັ້ງຄ່າເວັບໄຊ' : 'Site Settings'}
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-4 print:col-span-1">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 lg:p-8 min-h-[600px] shadow-sm print:border-none print:shadow-none print:p-0">
              
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-50 gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-adv-slate capitalize tracking-tight">
                    {activeTab === 'overview' ? t.overview : 
                     activeTab === 'approvals' ? t.pendingApprovals : 
                     activeTab === 'users' ? t.manageUsers : 
                     activeTab === 'events' ? t.eventUpcoming : 
                     activeTab === 'past-events' ? t.eventAlreadyDone :
                     activeTab === 'payouts' ? t.payouts :
                     activeTab === 'activity-log' ? 'Activity Log' :
                     activeTab === 'notifications' ? t.notifications :
                     activeTab === 'site-settings' ? (lang === 'lo' ? 'ຕັ້ງຄ່າເວັບໄຊ' : 'Site Settings') :
                     t.eventAlreadyDone}
                  </h2>
                  {activeTab === 'overview' && (
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-widest">
                      {new Date().toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {(activeTab === 'overview' || activeTab === 'events' || activeTab === 'past-events' || activeTab === 'approvals') && (
                    <>
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:border-adv-orange transition-colors appearance-none cursor-pointer"
                      >
                        <option value="all">{t.allMonths}</option>
                        <option value="01">{t.january}</option>
                        <option value="02">{t.february}</option>
                        <option value="03">{t.march}</option>
                        <option value="04">{t.april}</option>
                        <option value="05">{t.may}</option>
                        <option value="06">{t.june}</option>
                        <option value="07">{t.july}</option>
                        <option value="08">{t.august}</option>
                        <option value="09">{t.september}</option>
                        <option value="10">{t.october}</option>
                        <option value="11">{t.november}</option>
                        <option value="12">{t.december}</option>
                      </select>
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:border-adv-orange transition-colors appearance-none cursor-pointer"
                      >
                        <option value="all">{t.allYears}</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </>
                  )}
                  {activeTab === 'overview' && (
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-adv-slate text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-adv-slate/10 print:hidden"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {t.printReport}
                    </button>
                  )}
                  {['users', 'events', 'past-events', 'approvals', 'payouts', 'activity-log'].includes(activeTab) && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setIsLoading(true);
                          setTimeout(() => setIsLoading(false), 800);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-adv-slate border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:border-adv-orange hover:text-adv-orange transition-all shadow-sm print:hidden"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        {lang === 'lo' ? 'ຣີເຟຣຊ' : 'Sync'}
                      </button>
                      <button 
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 print:hidden"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lang === 'lo' ? 'ສົ່ງອອກ CSV' : 'Export CSV'}
                      </button>
                    </div>
                  )}
                  {activeTab !== 'site-settings' && (
                    <div className="relative print:hidden">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-adv-orange" />
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:border-adv-orange w-64 transition-colors placeholder:text-gray-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.totalProfit}</h3>
                      <div className="text-3xl font-black text-adv-slate mb-1">
                        {new Intl.NumberFormat('lo-LA').format(filteredPayouts.reduce((sum, p) => sum + p.platformFeeAmount, 0))} ₭
                      </div>
                      <div className="text-adv-orange text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +12.5% from last month
                      </div>
                    </div>
                    
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.activeUsers}</h3>
                      <div className="text-3xl font-black text-adv-slate mb-1">
                        {(usersList.length).toLocaleString('en-US')}
                      </div>
                      <div className="text-adv-orange text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +5.2% from last month
                      </div>
                    </div>

                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.totalEvents}</h3>
                      <div className="text-3xl font-black text-adv-slate mb-1">{filteredOverviewEvents.length}</div>
                      <div className="text-adv-orange text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +2 new this week
                      </div>
                    </div>

                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.ticketsSold}</h3>
                      <div className="text-3xl font-black text-adv-slate mb-1">
                        {(realTickets.reduce((sum, t) => sum + (Number(t.quantity) || 1), 0)).toLocaleString('en-US')}
                      </div>
                      <div className="text-adv-orange text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +18.1% from last month
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Ticket Sales Trend Line Chart */}
                    <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-black text-adv-slate flex items-center gap-2">
                            <span className="p-1 bg-orange-50 text-adv-orange rounded-lg">📈</span>
                            {t.ticketSalesTrend}
                          </h3>
                          <p className="text-xs text-gray-400 font-semibold mt-1">
                            {t.salesVolumeLast30Days}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-wider text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-adv-orange inline-block" />
                            <span className="text-adv-slate">{t.tickets}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                            <span className="text-adv-slate">{t.revenue} (₭ x1,000)</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={salesTrendData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              stroke="#9CA3AF" 
                              fontSize={11} 
                              tickLine={false} 
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis 
                              stroke="#9CA3AF" 
                              fontSize={11} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                background: '#222222', 
                                border: 'none', 
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                color: '#ffffff',
                                padding: '12px 16px'
                              }}
                              labelClassName="font-black text-xs text-orange-400 mb-1"
                              itemStyle={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                color: '#ffffff'
                              }}
                            />
                            <Line 
                              name={t.tickets}
                              type="monotone" 
                              dataKey="tickets" 
                              stroke="#FF5B00" 
                              strokeWidth={3}
                              activeDot={{ r: 6, strokeWidth: 0, fill: '#FF5B00' }}
                              dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#FF5B00' }}
                            />
                            <Line 
                              name={t.revenue}
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#3B82F6" 
                              strokeWidth={3}
                              activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }}
                              dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#3B82F6' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Live Ticket Sales Feed */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden h-[420px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-black text-adv-slate flex items-center gap-2">
                          <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </div>
                          Live Sales Counter
                        </h3>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Real-time</div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        <AnimatePresence>
                          {[...realTickets].sort((a, b) => new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime()).slice(0, 10).map((ticket, idx) => (
                            <motion.div
                              key={ticket.id || idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-3 group hover:bg-orange-50/50 hover:border-orange-100 transition-colors"
                            >
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-adv-slate truncate">{ticket.event?.title || 'Unknown Event'}</span>
                                <span className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">{ticket.tier?.name || 'General'} • x{ticket.quantity || 1}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-black text-adv-orange whitespace-nowrap">
                                  {new Intl.NumberFormat('lo-LA').format((ticket.tier?.price || 0) * (ticket.quantity || 1))} ₭
                                </div>
                                <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-1">
                                  {ticket.purchaseDate ? new Date(ticket.purchaseDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'}) : 'Just now'}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        
                        {realTickets.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 opacity-50">
                            <Activity className="w-8 h-8 mb-3 text-gray-300" />
                            <p className="text-xs font-bold uppercase tracking-wider">Awaiting sales activity</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                      <h3 className="text-lg font-black text-adv-slate mb-6 uppercase tracking-tight">{t.recentActivity}</h3>
                      <div className="space-y-6">
                        {[
                          { action: t.userRegistered, user: 'alex@example.com', time: '2 mins ago', icon: Users, color: 'text-adv-orange', bg: 'bg-orange-50' },
                          { action: t.eventApproved, user: 'Tech Startup Meetup', time: '1 hour ago', icon: CheckCircle2, color: 'text-adv-orange', bg: 'bg-orange-50' },
                          { action: t.ticketPurchased, user: 'VIP Pass - Indie Fest', time: '3 hours ago', icon: DollarSign, color: 'text-adv-orange', bg: 'bg-orange-50' },
                          { action: 'Event rejected', user: 'Spam Event', time: '5 hours ago', icon: XCircle, color: 'text-red-400', bg: 'bg-red-50' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className={`p-2 rounded-xl ${item.bg} shrink-0`}>
                              <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-adv-slate">{item.action}</p>
                              <p className="text-xs text-gray-400 mt-1 font-medium">{item.user}</p>
                            </div>
                            <span className="text-[10px] font-black text-gray-300 ml-auto whitespace-nowrap uppercase tracking-widest">{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-adv-slate uppercase tracking-tight">{t.quickActions}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setActiveTab('approvals')}
                          className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-adv-orange/30 hover:bg-orange-50 transition-all group text-left shadow-sm"
                        >
                          <CheckCircle2 className="w-6 h-6 text-gray-300 group-hover:text-adv-orange mb-3 transition-colors" />
                          <div className="font-bold text-adv-slate mb-1">{t.reviewApprovals}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pendingEventsList.length} {t.pendingEvents}</div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('users')}
                          className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-adv-orange/30 hover:bg-orange-50 transition-all group text-left shadow-sm"
                        >
                          <Users className="w-6 h-6 text-gray-300 group-hover:text-adv-orange mb-3 transition-colors" />
                          <div className="font-bold text-adv-slate mb-1">{t.manageUsers}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{usersList.length} {t.totalUsers}</div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('events')}
                          className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-adv-orange/30 hover:bg-orange-50 transition-all group text-left shadow-sm"
                        >
                          <Calendar className="w-6 h-6 text-gray-300 group-hover:text-adv-orange mb-3 transition-colors" />
                          <div className="font-bold text-adv-slate mb-1">{t.eventUpcoming}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{eventsList.filter(e => new Date(`${e.date}T23:59:59`) >= new Date()).length} {t.activeEvents}</div>
                        </button>
                        <Link 
                          to="/create"
                          className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-adv-orange/30 hover:bg-orange-50 transition-all group text-left block shadow-sm"
                        >
                          <Edit className="w-6 h-6 text-gray-300 group-hover:text-adv-orange mb-3 transition-colors" />
                          <div className="font-bold text-adv-slate mb-1">{t.createEvent}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.draftNewEvent}</div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'approvals' && (
                <div className="space-y-4">
                  {pendingEventsList.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-adv-slate mb-1">{t.noPendingEvents}</h3>
                      <p className="text-sm text-gray-400">{t.everythingUpToDate}</p>
                    </div>
                  ) : (
                    pendingEventsList.filter(e => {
                      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
                      const eventDate = new Date(e.date);
                      const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                      const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                      return matchesSearch && matchesMonth && matchesYear;
                    }).map(event => {
                    const ticketsSold = realTickets.filter(t => t.event?.id === event.id).reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
                    return (

                      <div key={event.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 hover:border-adv-orange/30 transition-all group gap-6 shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-md">
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-black text-adv-slate group-hover:text-adv-orange transition-colors">{event.title}</h3>
                              <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-adv-orange text-[10px] font-black uppercase tracking-wider border border-orange-100">
                                {t.pending}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-adv-orange" />
                                {event.organizer}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 lg:self-center">
                          <button 
                            onClick={() => setSelectedEvent(event)}
                            className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-adv-orange hover:bg-orange-50 hover:border-adv-orange/30 transition-all shadow-sm" title={t.viewDetails}>
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleApprove(event.id)}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-adv-orange text-white hover:bg-orange-600 transition-all shadow-md shadow-orange-100 text-sm font-black uppercase tracking-wider"
                          >
                            <CheckCircle2 className="w-4 h-4" /> {t.approve}
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowRejectionModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-all text-sm font-black uppercase tracking-wider"
                          >
                            <XCircle className="w-4 h-4" /> {t.reject}
                          </button>
                        </div>
                      </div>
                    ); })

                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-orange-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-adv-orange shrink-0 shadow-sm border border-orange-50 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">{usersList.length}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.totalUsers}</div>
                      </div>
                    </div>
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-orange-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-adv-orange shrink-0 shadow-sm border border-orange-50 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">{usersList.filter(u => u.status === 'active').length}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.activeUsers}</div>
                      </div>
                    </div>
                    <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-red-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-red-50 group-hover:scale-110 transition-transform">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">{usersList.filter(u => u.status === 'suspended').length}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.suspendedUsers}</div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-50 text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                          <th className="py-5 font-black pl-8">{t.name}</th>
                          <th className="py-5 font-black">{t.email}</th>
                          <th className="py-5 font-black">{t.role}</th>
                          <th className="py-5 font-black">{t.status}</th>
                          <th className="py-5 font-black text-right pr-8">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {usersList.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                          <tr key={user.id} className="group hover:bg-orange-50/20 transition-colors">
                            <td className="py-5 pl-8">
                              <div className="font-bold text-adv-slate">{user.name}</div>
                              <div className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">{t.joined} {new Date(user.joined).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </td>
                            <td className="py-5 text-gray-500 text-sm font-medium">{user.email}</td>
                            <td className="py-5">
                              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                user.role === 'admin' ? 'bg-orange-50 text-adv-orange border-orange-100' : 
                                user.role === 'organizer' ? 'bg-blue-50 text-blue-500 border-blue-100' : 
                                'bg-gray-50 text-gray-500 border-gray-100'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                user.status === 'active' ? 'bg-orange-50 text-adv-orange border-orange-100' : 'bg-red-50 text-red-500 border-red-100'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-adv-orange' : 'bg-red-500'}`}></span>
                                {user.status}
                              </span>
                            </td>
                            <td className="py-5 text-right pr-8">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {user.role !== 'admin' && user.status === 'active' && (
                                  <button 
                                    onClick={() => handleSuspendUser(user.id)}
                                    className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all shadow-sm" title="Suspend User">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-4">
                  {eventsList.filter(e => {
                    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const isUpcoming = new Date(`${e.date}T23:59:59`) >= new Date();
                    const eventDate = new Date(e.date);
                    const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                    const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                    return matchesSearch && isUpcoming && matchesMonth && matchesYear;
                  }).map(event => {
                    const ticketsSold = realTickets.filter(t => t.event?.id === event.id).reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
                    return (

                    <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 hover:border-adv-orange/30 transition-all group gap-5 shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md">
                          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-adv-slate group-hover:text-adv-orange transition-colors">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-xs text-gray-400 font-bold">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 border border-green-100 text-green-600 uppercase tracking-widest text-[10px]">
                              {t.upcoming}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-300" />
                              {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-300" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 border border-orange-100 text-adv-orange uppercase tracking-widest text-[10px] ml-2 font-black">
                              🎫 {ticketsSold} {t.ticketsSold}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-adv-slate hover:bg-orange-50 hover:border-adv-orange/30 hover:text-adv-orange transition-all text-sm font-black uppercase tracking-wider shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                          {t.manage}
                        </button>
                      </div>
                    </div>
                  );
                })}
                  {eventsList.filter(e => {
                    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const isUpcoming = new Date(`${e.date}T23:59:59`) >= new Date();
                    const eventDate = new Date(e.date);
                    const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                    const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                    return matchesSearch && isUpcoming && matchesMonth && matchesYear;
                  }).length === 0 && (
                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">{t.noUpcomingEvents}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'past-events' && (
                <div className="space-y-4">
                  {eventsList.filter(e => {
                    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const isPast = new Date(`${e.date}T23:59:59`) < new Date();
                    const eventDate = new Date(e.date);
                    const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                    const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                    return matchesSearch && isPast && matchesMonth && matchesYear;
                  }).map(event => {
                    const ticketsSold = realTickets.filter(t => t.event?.id === event.id).reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
                    return (

                    <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 hover:border-adv-orange/30 transition-all group gap-5 shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md grayscale group-hover:grayscale-0 transition-all">
                          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/5"></div>
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-400 group-hover:text-adv-orange transition-colors">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-xs text-gray-300 font-bold uppercase tracking-widest text-[10px]">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-500">
                              {t.finished}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] lowercase font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-adv-orange hover:bg-orange-50 hover:border-adv-orange/30 transition-all text-sm font-black uppercase tracking-wider shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t.viewDetails}
                        </button>
                      </div>
                    </div>
                  );
                })}
                  {eventsList.filter(e => {
                    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const isPast = new Date(`${e.date}T23:59:59`) < new Date();
                    const eventDate = new Date(e.date);
                    const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                    const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                    return matchesSearch && isPast && matchesMonth && matchesYear;
                  }).length === 0 && (
                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">No past events found.</p>
                    </div>
                  )}
                </div>
              )}

               {activeTab === 'notifications' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                          <h3 className="text-lg font-black text-adv-slate uppercase tracking-tight mb-6 flex items-center gap-3">
                             <Bell className="w-5 h-5 text-adv-orange" />
                             {t.sendNotification}
                          </h3>
                          <div className="space-y-6">
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.notificationTitle}</label>
                                <input 
                                  type="text"
                                  value={notifTitle}
                                  onChange={(e) => setNotifTitle(e.target.value)}
                                  placeholder={t.placeholderTitle}
                                  className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:border-adv-orange/30 outline-none transition-all"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.notificationCategory}</label>
                                <div className="grid grid-cols-2 gap-3">
                                   <button 
                                     onClick={() => setNotifCategory('upcomingEvent')}
                                     className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                       notifCategory === 'upcomingEvent' 
                                         ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                         : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                     }`}
                                   >
                                      <Calendar className="w-4 h-4" />
                                      {t.upcomingEvent}
                                   </button>
                                   <button 
                                     onClick={() => setNotifCategory('noted')}
                                     className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                       notifCategory === 'noted' 
                                         ? 'bg-orange-50 border-orange-200 text-adv-orange' 
                                         : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                     }`}
                                   >
                                      <Info className="w-4 h-4" />
                                      {t.noted}
                                   </button>
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.targetUsers}</label>
                                <div className="grid grid-cols-2 gap-3">
                                   <button 
                                     onClick={() => setNotifTarget('all')}
                                     className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                                       notifTarget === 'all' 
                                         ? 'bg-adv-slate border-adv-slate text-white' 
                                         : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                     }`}
                                   >
                                      <Users className="w-4 h-4" />
                                      {t.allUsers}
                                   </button>
                                   <button 
                                     onClick={() => setNotifTarget('organizers')}
                                     className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                                       notifTarget === 'organizers' 
                                         ? 'bg-adv-slate border-adv-slate text-white' 
                                         : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                     }`}
                                   >
                                      <Shield className="w-4 h-4" />
                                      {t.organizersOnly}
                                   </button>
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.notificationMessage}</label>
                                <textarea 
                                  value={notifMessage}
                                  onChange={(e) => setNotifMessage(e.target.value)}
                                  placeholder={t.placeholderMessage}
                                  className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-medium min-h-[120px] shadow-sm focus:border-adv-orange/30 outline-none transition-all resize-none"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.notificationImage}</label>
                                <div 
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`relative w-full h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                                    notifImage 
                                      ? 'border-adv-orange/50 bg-orange-50/10' 
                                      : 'border-gray-200 bg-white hover:border-adv-orange/30 hover:bg-gray-50'
                                  }`}
                                >
                                   <input 
                                     type="file" 
                                     ref={fileInputRef}
                                     onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                           const reader = new FileReader();
                                           reader.onloadend = () => {
                                              setNotifImage(reader.result as string);
                                           };
                                           reader.readAsDataURL(file);
                                        }
                                     }}
                                     className="hidden" 
                                     accept="image/*"
                                   />
                                   {notifImage ? (
                                      <>
                                         <img src={notifImage} alt="Preview" className="w-full h-full object-cover" />
                                         <button 
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              setNotifImage('');
                                              if (fileInputRef.current) fileInputRef.current.value = '';
                                           }}
                                           className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-all"
                                         >
                                            <X className="w-3 h-3" />
                                         </button>
                                      </>
                                   ) : (
                                      <>
                                         <Upload className="w-6 h-6 text-gray-300 mb-2" />
                                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Click to upload image</span>
                                      </>
                                   )}
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.scheduleTime}</label>
                                <input 
                                  type="datetime-local"
                                  value={notifScheduleTime}
                                  onChange={(e) => setNotifScheduleTime(e.target.value)}
                                  className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:border-adv-orange/30 outline-none transition-all"
                                />
                             </div>
                             <button 
                               onClick={() => {
                                  if (!notifTitle || !notifMessage) return;
                                  setIsSendingNotif(true);
                                  setTimeout(() => {
                                     const newNotif = {
                                        id: `sn-${Date.now()}`,
                                        title: notifTitle,
                                        message: notifMessage,
                                        category: notifCategory,
                                        target: notifTarget,
                                        image: notifImage,
                                        scheduledTime: notifScheduleTime,
                                        timestamp: new Date().toISOString(),
                                        status: notifScheduleTime ? 'scheduled' : 'sent',
                                        readCount: 0
                                     };
                                     setSentNotifications([newNotif, ...sentNotifications]);
                                     addActivityLog(notifScheduleTime ? 'Notification scheduled' : 'Notification sent', notifTitle);
                                     setNotifTitle('');
                                     setNotifMessage('');
                                     setNotifImage('');
                                     setNotifScheduleTime('');
                                     setIsSendingNotif(false);
                                  }, 1500);
                               }}
                               disabled={!notifTitle || !notifMessage || isSendingNotif}
                               className="w-full py-4 bg-adv-orange text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                             >
                                {isSendingNotif ? (
                                   <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      {notifScheduleTime ? 'Scheduling...' : 'Sending...'}
                                   </>
                                ) : (
                                   <>
                                      {notifScheduleTime ? <Calendar className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                      {notifScheduleTime ? t.scheduled : t.sendNotification}
                                   </>
                                )}
                             </button>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h3 className="text-lg font-black text-adv-slate uppercase tracking-tight flex items-center gap-3 ml-2">
                             <Activity className="w-5 h-5 text-gray-300" />
                             {t.notificationHistory}
                          </h3>
                          <div className="space-y-3">
                             {sentNotifications.map((notif) => (
                                <div key={notif.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:border-adv-orange/20 transition-all group">
                                   <div className="flex items-center justify-between mb-3">
                                      <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                         notif.category === 'upcomingEvent' ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-orange-50 border-orange-100 text-adv-orange'
                                      }`}>
                                         {notif.category === 'upcomingEvent' ? t.upcomingEvent : t.noted}
                                      </div>
                                      <div className="flex items-center gap-3">
                                         {notif.image && (
                                            <div 
                                              className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={() => setFullscreenImage(notif.image)}
                                            >
                                               <img src={notif.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                         )}
                                         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                            {new Date(notif.timestamp).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { day: 'numeric', month: 'short' })}
                                         </span>
                                      </div>
                                   </div>
                                   <h4 className="font-bold text-adv-slate mb-1 group-hover:text-adv-orange transition-colors">{notif.title}</h4>
                                   <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 pt-3 border-t border-gray-50">
                                      <div className="flex items-center gap-1.5">
                                         <Users className="w-3 h-3" />
                                         {notif.target === 'all' ? t.allUsers : t.organizersOnly}
                                      </div>
                                      <div className={`flex items-center gap-1.5 ${notif.status === 'scheduled' ? 'text-blue-500' : 'text-green-500'}`}>
                                         {notif.status === 'scheduled' ? <Calendar className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                         {notif.status === 'scheduled' ? t.scheduled : notif.status}
                                      </div>
                                      <div className="flex items-center gap-1.5 ml-auto">
                                         <User className="w-3 h-3" />
                                         {t.readBy} {notif.readCount || 0} {t.users}
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

              {activeTab === 'payouts' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 bg-white border border-gray-100 rounded-2xl sm:rounded-3xl shadow-2xs sm:shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-50 rounded-xl sm:rounded-2xl">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-adv-orange" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider sm:tracking-widest">{t.totalProfit}</p>
                        <p className="text-lg sm:text-2xl font-black text-adv-slate">
                          {new Intl.NumberFormat('lo-LA').format(payoutsList.reduce((sum, p) => sum + p.platformFeeAmount, 0))} ₭
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex bg-gray-50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-100 flex-wrap gap-0.5">
                      <button 
                        onClick={() => setPayoutFilter('all')}
                        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutFilter === 'all' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setPayoutFilter('pending')}
                        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutFilter === 'pending' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Pending
                      </button>
                      <button 
                        onClick={() => setPayoutFilter('paid')}
                        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutFilter === 'paid' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Paid
                      </button>
                    </div>

                    <div className="flex bg-gray-50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-100 flex-wrap gap-0.5">
                      <button 
                        onClick={() => setPayoutDateFilter('all')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutDateFilter === 'all' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        All Time
                      </button>
                      <button 
                        onClick={() => setPayoutDateFilter('day')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutDateFilter === 'day' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Day
                      </button>
                      <button 
                        onClick={() => setPayoutDateFilter('week')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutDateFilter === 'week' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Week
                      </button>
                      <button 
                        onClick={() => setPayoutDateFilter('month')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutDateFilter === 'month' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Month
                      </button>
                      <button 
                        onClick={() => setPayoutDateFilter('year')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest rounded-lg sm:rounded-xl transition-all ${payoutDateFilter === 'year' ? 'bg-white text-adv-orange shadow-xs border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Year
                      </button>
                    </div>
                  </div>

                  {payoutsList.length === 0 ? (
                    <div className="text-center py-12 sm:py-20 bg-gray-50/50 rounded-2xl sm:rounded-3xl border border-dashed border-gray-200">
                      <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-200" />
                      <p className="text-xs sm:text-sm text-gray-400 font-bold">No payouts to manage.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {payoutsList
                        .filter(p => payoutFilter === 'all' || p.status === payoutFilter)
                        .filter(p => {
                          if (payoutDateFilter === 'all') return true;
                          if (!p.completedDate) return true;
                          const pDate = new Date(p.completedDate);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - pDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (payoutDateFilter === 'day') return diffDays <= 1;
                          if (payoutDateFilter === 'week') return diffDays <= 7;
                          if (payoutDateFilter === 'month') return diffDays <= 30;
                          if (payoutDateFilter === 'year') return diffDays <= 365;
                          return true;
                        })
                        .map(payout => (
                        <div key={payout.id} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 hover:border-adv-orange/30 transition-all shadow-2xs sm:shadow-sm">
                          <div className="flex flex-col lg:flex-row justify-between gap-3.5 sm:gap-6">
                            
                            {/* Payout Overview */}
                            <div className="flex-1 space-y-2.5 sm:space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-base sm:text-xl font-black text-adv-slate line-clamp-1">{payout.eventTitle}</h3>
                                  <p className="text-xs sm:text-sm font-bold text-gray-500 mt-0.5 sm:mt-1">{t.organizer}: <span className="text-adv-orange">{payout.organizer}</span></p>
                                </div>
                                <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest rounded-full shrink-0 ${
                                  payout.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-adv-orange'
                                }`}>
                                  {payout.status === 'paid' ? t.paid : t.pendingPayout}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 p-2.5 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100">
                                <div>
                                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">{t.totalRevenue}</p>
                                  <p className="text-xs sm:text-base font-black text-adv-slate">{new Intl.NumberFormat('lo-LA').format(payout.revenue)} ₭</p>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider sm:tracking-widest">{t.platformFee}</p>
                                    {payout.status === 'pending' && (
                                      <button 
                                        onClick={() => {
                                          if (editingFeeId === payout.id) {
                                            setPayoutsList(prev => prev.map(p => {
                                              if (p.id === payout.id) {
                                                const newFee = (p.revenue * tempFeePercent) / 100;
                                                return { ...p, platformFeePercent: tempFeePercent, platformFeeAmount: newFee, payoutAmount: p.revenue - newFee };
                                              }
                                              return p;
                                            }));
                                            setEditingFeeId(null);
                                          } else {
                                            setEditingFeeId(payout.id);
                                            setTempFeePercent(payout.platformFeePercent);
                                          }
                                        }}
                                        className="text-[9px] sm:text-[10px] text-adv-orange font-bold hover:underline"
                                      >
                                        {editingFeeId === payout.id ? 'Save' : 'Edit'}
                                      </button>
                                    )}
                                  </div>
                                  {editingFeeId === payout.id ? (
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={tempFeePercent}
                                        onChange={(e) => setTempFeePercent(Number(e.target.value))}
                                        className="w-14 sm:w-16 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-adv-orange"
                                      />
                                      <span className="text-xs sm:text-sm font-bold text-gray-500">%</span>
                                    </div>
                                  ) : (
                                    <p className="text-xs sm:text-base font-black text-red-500">-{new Intl.NumberFormat('lo-LA').format(payout.platformFeeAmount)} ₭ ({payout.platformFeePercent}%)</p>
                                  )}
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[9px] sm:text-[10px] text-adv-orange font-bold uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">Payout Amount</p>
                                  <p className="text-sm sm:text-xl font-black text-green-600">{new Intl.NumberFormat('lo-LA').format(payout.payoutAmount)} ₭</p>
                                </div>
                              </div>
                            </div>

                            {/* Bank Details & Action */}
                            <div className="lg:w-80 space-y-2.5 sm:space-y-4 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-6">
                              <h4 className="text-xs sm:text-sm font-extrabold text-adv-slate flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-adv-orange" />
                                {t.payoutInfo}
                              </h4>
                              <div className="space-y-1.5 bg-orange-50/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-orange-100">
                                <p className="text-[11px] sm:text-xs text-gray-600 font-bold flex justify-between">
                                  <span>{t.bankAccount}:</span>
                                  <span className="text-adv-slate text-right">{payout.bankInfo.bankName}</span>
                                </p>
                                <p className="text-[11px] sm:text-xs text-gray-600 font-bold flex justify-between">
                                  <span>{t.name}:</span>
                                  <span className="text-adv-slate text-right">{payout.bankInfo.accountName}</span>
                                </p>
                                <p className="text-[11px] sm:text-xs text-gray-600 font-bold flex justify-between">
                                  <span>{t.accountNumber}:</span>
                                  <span className="text-adv-slate text-right font-mono">{payout.bankInfo.accountNumber}</span>
                                </p>
                              </div>
                              
                              <div className="space-y-1.5">
                                <label className="block text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider sm:tracking-widest cursor-pointer group">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-adv-orange group-hover:text-orange-600 transition-colors" />
                                    <span>{uploadingBill[payout.id] || payout.billImage ? 'Change Bill' : 'Upload Bill Image'}</span>
                                  </div>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setUploadingBill(prev => ({...prev, [payout.id]: reader.result as string}));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }} 
                                  />
                                </label>
                                {(uploadingBill[payout.id] || payout.billImage) && (
                                  <div className="relative w-full h-20 sm:h-24 rounded-lg overflow-hidden border border-gray-200 shadow-2xs">
                                    <img src={uploadingBill[payout.id] || payout.billImage} alt="Bill Preview" className="w-full h-full object-cover" />
                                    {uploadingBill[payout.id] && (
                                      <button 
                                        onClick={() => setUploadingBill(prev => { const next = {...prev}; delete next[payout.id]; return next; })}
                                        className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {uploadingBill[payout.id] && (
                                <button 
                                  onClick={() => {
                                    const img = uploadingBill[payout.id];
                                    setPayoutsList(prev => prev.map(p => p.id === payout.id ? { ...p, status: 'paid', billImage: img, completedDate: new Date().toISOString() } : p));
                                    
                                    // Add/update to organizer's local storage for them to see the bill
                                    const savedBills = safeStorage.getItem('organizer_payout_bills') || '[]';
                                    let parsedBills = JSON.parse(savedBills);
                                    
                                    const existingIdx = parsedBills.findIndex((b: any) => b.id === payout.id);
                                    if (existingIdx >= 0) {
                                      parsedBills[existingIdx] = { ...payout, status: 'paid', billImage: img, paidAt: new Date().toISOString() };
                                    } else {
                                      parsedBills.push({ ...payout, status: 'paid', billImage: img, paidAt: new Date().toISOString() });
                                    }
                                    
                                    safeStorage.setItem('organizer_payout_bills', JSON.stringify(parsedBills));
                                    
                                    setUploadingBill(prev => { const next = {...prev}; delete next[payout.id]; return next; });
                                  }}
                                  className="w-full bg-adv-orange hover:bg-orange-600 text-white font-bold text-sm px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {payout.status === 'paid' ? 'Resubmit Bill' : 'Submit Bill to Organizer'}
                                </button>
                              )}
                            </div>
                            
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity-log' && (
                <div className="space-y-4">
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                      <p className="text-gray-400 font-bold">No activity logs found.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-50 text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                            <th className="py-5 font-black pl-8">Action</th>
                            <th className="py-5 font-black">Details</th>
                            <th className="py-5 font-black">Admin/System</th>
                            <th className="py-5 font-black text-right pr-8">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {activityLogs.filter(log => log.action.toLowerCase().includes(searchQuery.toLowerCase()) || log.details.toLowerCase().includes(searchQuery.toLowerCase())).map((log) => (
                            <tr key={log.id} className="group hover:bg-orange-50/20 transition-colors">
                              <td className="py-5 pl-8">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-adv-orange">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-adv-slate text-sm">{log.action}</span>
                                </div>
                              </td>
                              <td className="py-5 text-gray-500 text-sm font-medium">{log.details}</td>
                              <td className="py-5 text-gray-400 text-xs font-bold">{log.admin}</td>
                              <td className="py-5 text-right text-gray-300 text-[10px] font-black uppercase tracking-widest pr-8">
                                {new Date(log.timestamp).toLocaleString(lang === 'lo' ? 'lo-LA' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'site-settings' && (
                <SiteSettingsTab
                  lang={lang}
                  t={t}
                  addActivityLog={addActivityLog}
                />
              )}

            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Warning */}
      <div className="md:hidden flex flex-col items-center justify-center min-h-[80vh] px-8 text-center bg-white">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <Shield className="w-10 h-10 text-adv-orange" />
        </div>
        <h2 className="text-3xl font-black text-adv-slate mb-4 uppercase tracking-tighter">{t.desktopOnly}</h2>
        <p className="text-gray-400 font-medium leading-relaxed mb-10 max-w-xs mx-auto">
          {t.desktopWarning}
        </p>
        <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-adv-orange text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100 hover:scale-105 transition-transform active:scale-95">
          {t.returnToHome}
        </Link>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-adv-orange shadow-sm border border-orange-50">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-adv-slate uppercase tracking-tight">{t.eventDetails}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{selectedEvent.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-adv-slate transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                {/* Hero Banner Cover */}
                <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-800 aspect-[21/9] min-h-[260px] shadow-2xl border border-gray-200 mb-8 mx-auto max-w-6xl">
                  <img 
                    src={selectedEvent.horizontalImage || selectedEvent.image} 
                    alt={selectedEvent.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-10">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-adv-orange text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md">
                        {selectedEvent.category}
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30">
                        {selectedEvent.eventType === 'online' ? 'Online Event' : (selectedEvent.province || 'Offline Event')}
                      </span>
                      {selectedEvent.dateType === 'flexible' && (
                        <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                          Flexible Date
                        </span>
                      )}
                    </div>
                    <h1 className="font-extrabold text-white tracking-tight mb-2 text-4xl">
                      {selectedEvent.title}
                    </h1>
                    <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-adv-orange shrink-0" />
                      {selectedEvent.venue} • {selectedEvent.district}, {selectedEvent.province}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  
                  {/* Left Column: Details */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Event Quick Info Bar */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ວັນທີ' : 'Date'}</div>
                          <div className="text-sm font-bold text-adv-slate">
                            {selectedEvent.dateType === 'flexible' ? (
                              'Flexible Date'
                            ) : selectedEvent.date ? (
                              new Date(selectedEvent.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                            ) : 'TBA'}
                            {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date && ` - ${new Date(selectedEvent.endDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric' })}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'lo' ? 'ເວລາ' : 'Time'}</div>
                          <div className="text-sm font-bold text-adv-slate">
                            {selectedEvent.time || 'TBA'} {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-adv-slate mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-adv-orange" />
                        {lang === 'lo' ? 'ລາຍລະອຽດ event' : 'Event Description'}
                      </h3>
                      <div 
                        className="prose max-w-none text-gray-600 text-sm leading-relaxed rich-text-content"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          const anchor = target.closest('a');
                          if (anchor) {
                            let href = anchor.getAttribute('href');
                            if (href) {
                              if (!/^https?:\/\//i.test(href) && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                                href = `https://${href}`;
                              }
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(href, '_blank', 'noopener,noreferrer');
                            }
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedEvent.description || '<p>No description provided.</p>' }}
                      />
                    </div>

                    {/* Gallery Images */}
                    {selectedEvent.exampleImages && selectedEvent.exampleImages.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ຮູບພາບປະກອບ' : 'Event Gallery'}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedEvent.exampleImages.map((img, idx) => (
                            <img key={idx} src={img} alt={`Gallery ${idx}`} className="w-full h-32 object-cover rounded-xl border border-gray-100 shadow-sm" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seating Zone Map */}
                    {selectedEvent.hasSeating && selectedEvent.zoneImage && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ແຜນຜັງໂຊນບ່ອນນັ່ງ' : 'Zone Seating Map'}
                        </h3>
                        <div className="rounded-xl overflow-hidden border border-gray-200 max-h-[400px] flex justify-center bg-gray-50">
                          <img src={selectedEvent.zoneImage} alt="Seating Map" className="w-full object-contain" />
                        </div>
                      </div>
                    )}

                    {/* Time Slots */}
                    {selectedEvent.hasTimeSelection && selectedEvent.timeSlots && selectedEvent.timeSlots.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <Clock className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ເລືອກຊ່ວງເວລາ' : 'Operating Time Slots'}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedEvent.timeSlots.map((slot, idx) => (
                            <div key={idx} className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-center text-xs font-bold text-adv-slate">
                              {slot}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Event Settings & Policies */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                        <Settings className="w-5 h-5 text-adv-orange" />
                        {lang === 'lo' ? 'ການຕັ້ງຄ່າກິດຈະກຳ ແລະ ນະໂຍບາຍ' : 'Event Settings & Policies'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ຄວາມເປັນສ່ວນຕົວ' : 'Event Privacy'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.eventPrivacy || 'Public'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ປະເພດກິດຈະກຳ' : 'Event Type'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.eventType || 'Offline'}</div>
                        </div>
                        {selectedEvent.eventType === 'online' && (
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 col-span-2 md:col-span-3">
                            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-2">{lang === 'lo' ? 'ຂໍ້ມູນອອນລາຍ' : 'Online Event Details'}</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <span className="block text-[10px] font-bold text-gray-400">Platform</span>
                                <span className="text-xs font-black text-adv-slate capitalize">{selectedEvent.onlinePlatform}</span>
                              </div>
                              <div className="md:col-span-2">
                                <span className="block text-[10px] font-bold text-gray-400">Link</span>
                                <span className="text-xs font-medium text-blue-600 break-all">{selectedEvent.onlineMeetingUrl}</span>
                              </div>
                            </div>
                            {selectedEvent.onlinePasscode && (
                              <div className="mt-2 pt-2 border-t border-blue-100">
                                <span className="block text-[10px] font-bold text-gray-400">Passcode</span>
                                <span className="text-xs font-medium text-adv-slate">{selectedEvent.onlinePasscode}</span>
                              </div>
                            )}
                            {selectedEvent.onlineInstructions && (
                              <div className="mt-2 pt-2 border-t border-blue-100">
                                <span className="block text-[10px] font-bold text-gray-400">Instructions</span>
                                <span className="text-xs font-medium text-adv-slate">{selectedEvent.onlineInstructions}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ປະເພດວັນທີ' : 'Date Type'}</div>
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.dateType || 'Fixed'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ອະນຸຍາດໃຫ້ຄືນເງິນ' : 'Allow Refunds'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.allowRefunds ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ອະນຸຍາດໃຫ້ຣີວິວ' : 'Allow Reviews'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.allowReviews !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ສະແດງຈຳນວນປີ້' : 'Show Remaining Tickets'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.showRemainingTickets !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ບັງຄັບໃຫ້ໃສ່ຂໍ້ມູນທຸກປີ້' : 'Require Every Ticket Info'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.requireEveryTicketInfo !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ເປີດໃຊ້ນັບຖອຍຫຼັງ' : 'Enable Countdown'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.enableCountdown !== false ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ຈຳກັດຈຳນວນປີ້ຕໍ່ການຊື້' : 'Max Tickets per Transaction'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.maxTickets || '4'}</div>
                        </div>
                      </div>
                      
                      {selectedEvent.cancellationPolicy && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl mt-4">
                          <div className="text-[10px] text-adv-orange font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ນະໂຍບາຍການຍົກເລີກ' : 'Cancellation Policy'}</div>
                          <div className="text-sm font-medium text-adv-slate">{selectedEvent.cancellationPolicy}</div>
                        </div>
                      )}
                      {selectedEvent.attendeeQuestions && selectedEvent.attendeeQuestions.length > 0 && (
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl mt-4">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">{lang === 'lo' ? 'ຄຳຖາມສຳລັບຜູ້ເຂົ້າຮ່ວມ' : 'Custom Attendee Questions'}</div>
                          <div className="space-y-2">
                            {selectedEvent.attendeeQuestions.map((q: any, idx: number) => (
                              <div key={idx} className="p-3 bg-white border border-gray-100 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-bold text-adv-slate">{q.label}</span>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-adv-orange bg-orange-50 px-2 py-0.5 rounded-md">
                                    {q.type}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 font-medium">
                                  {q.required ? 'Required' : 'Optional'}
                                  {q.options && q.options.length > 0 && (
                                    <span className="ml-2 block mt-1 text-gray-500">Options: {q.options.join(', ')}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedEvent.attendeeMessage && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mt-4">
                          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ຂໍ້ຄວາມເຖິງຜູ້ເຂົ້າຮ່ວມ' : 'Attendee Message'}</div>
                          <div className="text-sm font-medium text-emerald-900">{selectedEvent.attendeeMessage}</div>
                        </div>
                      )}
                    </div>

                    {/* Organizer Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                      {selectedEvent.organizerLogo || (selectedEvent.organizerInfo && selectedEvent.organizerInfo.logoUrl) ? (
                        <img src={selectedEvent.organizerLogo || selectedEvent.organizerInfo?.logoUrl} alt={selectedEvent.organizer || 'Organizer'} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange font-black text-xl shrink-0">
                          {(selectedEvent.organizerInfo?.name || selectedEvent.organizer || 'O').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-400 font-bold uppercase">{lang === 'lo' ? 'ຜູ້ຈັດງານ' : 'Organized by'}</div>
                        <div className="text-base font-extrabold text-adv-slate">{selectedEvent.organizerInfo?.name || selectedEvent.organizer || 'Organizer Name'}</div>
                        {(selectedEvent.organizerInfo?.contact || selectedEvent.organizerContact) && (
                          <div className="text-xs text-gray-500 font-medium mt-0.5">{selectedEvent.organizerInfo?.contact || selectedEvent.organizerContact}</div>
                        )}
                      </div>
                    </div>
                    

                    
                    {selectedEvent.status === 'pending' && selectedEvent.paymentInfo && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-adv-orange" />
                            {t.payoutInfo}
                          </h3>
                            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.bankAccount}</div>
                              <div className="font-bold text-adv-slate">{selectedEvent.paymentInfo.accountName}</div>
                              <div className="text-xs text-gray-500 font-medium mt-1">{selectedEvent.paymentInfo.bankName}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.accountNumber}</div>
                              <div className="font-bold text-adv-slate tracking-wider">{selectedEvent.paymentInfo.accountNumber}</div>
                            </div>
                          </div>
                        </div>
                    )}

                  </div>

                  {/* Right Column: Ticket Purchase Box & Admin Actions */}
                  <div className="space-y-6">
                    {/* Ticket Box */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-6">
                      <div className="border-b border-gray-100 pb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          {lang === 'lo' ? 'ລາຄາປີ້ເລີ່ມຕົ້ນ' : 'Starting Ticket Price'}
                        </span>
                        <div className="text-2xl font-black text-adv-orange">
                          {selectedEvent.price || `0 ₭`}
                        </div>
                      </div>

                      {/* Ticket Tiers list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                          {lang === 'lo' ? 'ປະເພດປີ້' : 'Ticket Tiers'}
                        </h4>
                        {selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0 ? (
                          selectedEvent.ticketTiers.map((tier, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                              <div>
                                <div className="font-bold text-xs text-adv-slate">{tier.name || `Tier ${idx + 1}`}</div>
                                <div className="text-[10px] text-gray-400 font-medium">Qty: {tier.quantity || 'Unlimited'}</div>
                              </div>
                              <div className="font-extrabold text-xs text-adv-orange">
                                {tier.price ? `${(Number(String(tier.price).replace(/,/g, '')) || 0).toLocaleString()} ₭` : `0 ₭`}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-400 font-medium">
                            General Admission
                          </div>
                        )}
                      </div>

                      {/* Coupons Badge */}
                      {selectedEvent.coupons && selectedEvent.coupons.length > 0 && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
                          <Ticket className="w-4 h-4 shrink-0" />
                          <span>{selectedEvent.coupons.length} {lang === 'lo' ? 'ຄູປອງສ່ວນຫຼຸດພິເສດ' : 'Special Coupons Available'}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Admin Actions Panel */}
                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-adv-orange" />
                        {t.adminActions}
                      </h4>
                      
                      <div className="space-y-3 mb-8">
                        {selectedEvent.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => {
                                handleApprove(selectedEvent.id);
                                setSelectedEvent(null);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-adv-orange text-white hover:bg-orange-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100"
                            >
                              <CheckCircle2 className="w-4 h-4" /> {t.approveEvent}
                            </button>
                            <Link 
                              to={`/create?adminEdit=${selectedEvent.id}`}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200 text-adv-slate hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                              <Edit className="w-4 h-4" /> {lang === 'lo' ? 'ແກ້ໄຂກິດຈະກຳ' : 'Edit Event'}
                            </Link>
                            <button 
                              onClick={() => setShowRejectionModal(true)}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <XCircle className="w-4 h-4" /> {t.rejectEvent}
                            </button>
                          </>
                        ) : (
                          <>
                            <Link 
                              to={`/event/${selectedEvent.id}`}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200 text-adv-slate hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4" /> {t.viewPage}
                            </Link>
                            <Link 
                              to={`/create?adminEdit=${selectedEvent.id}`}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200 text-adv-slate hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                              <Edit className="w-4 h-4" /> {lang === 'lo' ? 'ແກ້ໄຂກິດຈະກຳ' : 'Edit Event'}
                            </Link>
                            <button 
                              onClick={() => handleDeleteEvent(selectedEvent.id)}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" /> {t.delete}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-adv-orange shadow-sm border border-orange-50">
                    <Edit className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-adv-slate uppercase tracking-tight">{t.editEvent}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.updateEventDetails}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingEvent(null)}
                  className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-adv-slate transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleSaveEvent} className="space-y-8">
                  {editError && (
                    <div className="bg-red-50 border border-red-100 text-red-500 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
                      <AlertCircle className="w-5 h-5" />
                      {editError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.eventTitle}</label>
                        <input 
                          type="text" 
                          value={editingEvent.title || ""}
                          onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white transition-all shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.category}</label>
                          <div className="relative">
                            <select 
                              value={editingEvent.category || ""}
                              onChange={(e) => setEditingEvent({...editingEvent, category: e.target.value})}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white appearance-none transition-all shadow-inner"
                            >
                              <option value="" disabled>{t.selectCategory}</option>
                              <option value="Sports">Sports</option>
                              <option value="Workshop">Workshop</option>
                              <option value="Festival">Festival</option>
                              <option value="Voucher">Voucher</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.date}</label>
                            <input 
                              type="date" 
                              value={editingEvent.date || ""}
                              onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white transition-all shadow-inner"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Time</label>
                            <input 
                              type="time" 
                              value={editingEvent.time || ""}
                              onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white transition-all shadow-inner"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Status</label>
                          <div className="relative">
                            <select 
                              value={editingEvent.status || "active"}
                              onChange={(e) => setEditingEvent({...editingEvent, status: e.target.value})}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white appearance-none transition-all shadow-inner"
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                              <option value="paused">Paused</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.location}</label>
                          <div className="relative">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-adv-orange" />
                            <input 
                              type="text" 
                              value={editingEvent.location || ""}
                              onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                              list="location-suggestions-edit"
                              placeholder={t.searchLocation}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white transition-all shadow-inner"
                            />
                            <datalist id="location-suggestions-edit">
                              <option value="National Convention Centre, Vientiane" />
                              <option value="Lao National Cultural Hall, Vientiane" />
                              <option value="That Luang Esplanade, Vientiane" />
                              <option value="Chao Anouvong Park, Vientiane" />
                              <option value="Vientiane Center, Vientiane" />
                              <option value="ITECC Mall, Vientiane" />
                              <option value="Landmark Mekong Riverside Hotel, Vientiane" />
                              <option value="Settha Palace Hotel, Vientiane" />
                            </datalist>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Venue</label>
                          <input 
                            type="text" 
                            value={editingEvent.venue || ''}
                            onChange={(e) => setEditingEvent({...editingEvent, venue: e.target.value})}
                            placeholder="e.g. Main Hall, Stadium"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.organizer}</label>
                          <input 
                            type="text" 
                            value={editingEvent.organizer || ''}
                            onChange={(e) => setEditingEvent({...editingEvent, organizer: e.target.value})}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Image URL</label>
                          <input 
                            type="url" 
                            value={editingEvent.image || ''}
                            onChange={(e) => setEditingEvent({...editingEvent, image: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.description}</label>
                        <textarea 
                          value={editingEvent.description || ''}
                          onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-[2rem] px-6 py-5 text-adv-slate font-medium leading-relaxed focus:outline-none focus:border-adv-orange/30 focus:bg-white min-h-[200px] resize-none transition-all shadow-inner"
                        />
                      </div>

                      <div className="flex items-center gap-4 bg-orange-50/30 border border-orange-100 rounded-[2rem] px-8 py-6 group hover:bg-orange-50/50 transition-all">
                        <div className="relative w-12 h-6 bg-gray-200 rounded-full transition-colors group-hover:bg-gray-300">
                          <input
                            type="checkbox"
                            id="hasSeating-edit"
                            checked={editingEvent.hasSeating || false}
                            onChange={(e) => setEditingEvent({...editingEvent, hasSeating: e.target.checked})}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all duration-300 ${editingEvent.hasSeating ? 'translate-x-6 bg-adv-orange' : 'bg-white shadow-sm'}`}></div>
                        </div>
                        <div>
                          <label htmlFor="hasSeating-edit" className="text-sm font-black text-adv-slate cursor-pointer select-none block uppercase tracking-tight">
                            Enable Seating Map
                          </label>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.allowZoneSelection}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50/30 p-6 rounded-[2rem] border border-gray-100">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Seating Map Image</label>
                        <input
                          type="text"
                          value={editingEvent.zoneImage || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, zoneImage: e.target.value })}
                          placeholder="https://example.com/seating-map.jpg"
                          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm text-adv-slate font-bold focus:outline-none focus:border-adv-orange/30 transition-all shadow-sm"
                        />
                        {editingEvent.zoneImage && (
                          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
                            <img src={editingEvent.zoneImage} alt="Seating Map Preview" className="w-full h-full object-contain bg-gray-50" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange border border-orange-100">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <h4 className="text-xl font-black text-adv-slate uppercase tracking-tight">{t.ticketTiers}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newTier = { id: `t${Date.now()}`, name: 'General Admission', price: 0, available: 100 };
                          setEditingEvent({
                            ...editingEvent,
                            ticketTiers: [...(editingEvent.ticketTiers || []), newTier]
                          });
                        }}
                        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-adv-slate transition-all shadow-lg"
                      >
                        + Add Tier
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(editingEvent.ticketTiers || []).map((tier: any, index: number) => (
                        <div key={tier.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4 hover:bg-white transition-colors shadow-sm relative group/tier">
                          <button
                            type="button"
                            onClick={() => {
                              const newTiers = editingEvent.ticketTiers.filter((_: any, i: number) => i !== index);
                              setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                            }}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-red-100 text-red-500 shadow-sm flex items-center justify-center hover:bg-red-50 transition-all scale-0 group-hover/tier:scale-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.tierName}</label>
                              <input
                                type="text"
                                value={tier.name}
                                onChange={(e) => {
                                  const newTiers = [...editingEvent.ticketTiers];
                                  newTiers[index].name = e.target.value;
                                  setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                }}
                                placeholder="e.g. VIP Pass"
                                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-adv-slate font-bold shadow-sm focus:border-adv-orange/30 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.price}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const newTiers = [...editingEvent.ticketTiers];
                                    newTiers[index].price = Number(e.target.value);
                                    setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                  }}
                                  className="w-full bg-white border border-gray-100 rounded-2xl pl-5 pr-12 py-3 text-adv-slate font-bold shadow-sm focus:border-adv-orange/30 transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">{currency}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">{t.availableQty}</label>
                              <input
                                type="number"
                                value={tier.available}
                                onChange={(e) => {
                                  const newTiers = [...editingEvent.ticketTiers];
                                  newTiers[index].available = Number(e.target.value);
                                  setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                }}
                                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-adv-slate font-bold shadow-sm focus:border-adv-orange/30 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!editingEvent.ticketTiers || editingEvent.ticketTiers.length === 0) && (
                        <div className="col-span-2 text-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                          <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold tracking-tight">No ticket tiers added yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-8 gap-4 border-t border-gray-100">
                    <button 
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      className="px-8 py-4 rounded-2xl text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-adv-slate hover:bg-gray-50 transition-all"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      type="submit"
                      className="px-10 py-5 rounded-2xl bg-adv-orange text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100 hover:scale-[1.02] transform active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {t.saveChanges}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-adv-orange shadow-sm border border-orange-50">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-adv-slate uppercase tracking-tight">{t.editUser}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.updateUserPrivileges}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-adv-slate transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8">
                <form onSubmit={handleSaveUser} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.name}</label>
                      <input 
                        type="text" 
                        value={editingUser.name || ""}
                        disabled
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate/50 font-bold cursor-not-allowed shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.email}</label>
                      <input 
                        type="email" 
                        value={editingUser.email || ""}
                        disabled
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate/50 font-bold cursor-not-allowed shadow-inner"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.role}</label>
                        <div className="relative">
                          <select 
                            value={editingUser.role || ""}
                            onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-inner focus:outline-none focus:border-adv-orange/30 transition-all appearance-none"
                          >
                            <option value="user">User</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t.status}</label>
                        <div className="relative">
                          <select 
                            value={editingUser.status || ""}
                            onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-inner focus:outline-none focus:border-adv-orange/30 transition-all appearance-none"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-8 gap-4 border-t border-gray-100">
                    <button 
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-8 py-4 rounded-2xl text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-adv-slate hover:bg-gray-50 transition-all"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-4 rounded-2xl bg-adv-orange text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100 hover:scale-[1.02] transform active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {t.saveChanges}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ID Card / Image Viewer Modal */}
      <AnimatePresence>
        {viewingIdCardUrl && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-gray-900/90 backdrop-blur-md"
            onClick={() => setViewingIdCardUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative max-w-6xl w-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewingIdCardUrl(null)}
                className="absolute -top-16 right-0 p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all group border border-white/10"
              >
                <X className="w-8 h-8 group-hover:rotate-90 transition-transform" />
              </button>
              
              <div className="relative w-full aspect-[4/3] bg-gray-800 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src={viewingIdCardUrl} 
                  alt="Document Preview" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mt-8 flex items-center gap-6">
                <a 
                  href={viewingIdCardUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-10 py-5 rounded-[2rem] bg-white text-adv-slate text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center gap-3 transition-all transform hover:scale-105 shadow-xl"
                >
                  <ExternalLink className="w-5 h-5 text-adv-orange" /> Open Original
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectionModal && selectedEvent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-white/20"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 font-bold shadow-sm border border-red-100 mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-black text-adv-slate text-center mb-2 uppercase tracking-tight">{t.rejectEvent}</h3>
              <p className="text-gray-400 text-center text-sm font-medium mb-8 leading-relaxed">
                {lang === 'en' ? 'Are you sure you want to reject' : 'ທ່ານແນ່ໃຈບໍ່ວ່າຈະປະຕິເສດ'} <span className="text-adv-slate font-black">"{selectedEvent.title}"</span>? {lang === 'en' ? 'Please provide a reason below.' : 'ກະລຸນາລະບຸເຫດຜົນຂ້າງລຸ່ມນີ້.'}
              </p>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t.addComment}</label>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner focus-within:border-red-200 transition-colors">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.addCommentPlaceholder}
                    className="w-full bg-transparent border-none text-sm text-adv-slate font-medium placeholder:text-gray-300 focus:outline-none focus:ring-0 resize-none min-h-[120px]"
                  />
                </div>
                
                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={() => handleReject(selectedEvent.id, comment)}
                    disabled={!comment.trim()}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-100 hover:bg-red-600 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    {t.reject}
                  </button>
                  <button 
                    onClick={() => {
                      setShowRejectionModal(false);
                      setComment('');
                    }}
                    className="w-full py-4 rounded-2xl bg-white border border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Overlay */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 sm:p-10"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute top-10 right-10 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="w-8 h-8" />
            </motion.button>
            
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={fullscreenImage}
              alt="Fullscreen Preview"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
