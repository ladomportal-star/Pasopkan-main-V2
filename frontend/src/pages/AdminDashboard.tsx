import { EventData, PayoutBill } from "../types";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RefreshCw, RotateCcw, Shield, Users, Calendar, CalendarDays, CheckCircle2, XCircle, Trash2, Edit, ExternalLink, Search, Filter, X, MessageSquare, ChevronDown, MapPin, Save, LayoutDashboard, TrendingUp, TrendingDown, DollarSign, Activity, Loader2, AlertCircle, Menu, Globe, User, Bell, Plus, Info, Upload, Image as ImageIcon, Printer, CreditCard, Lock, Eye, EyeOff, LogIn, LogOut, Settings, UploadCloud, Clock, Ticket, Monitor, Smartphone, Star, Building2, UserCheck, Briefcase, Phone, Mail, Building, CheckSquare, Square, SlidersHorizontal, Layers, Table, Grid, Sparkles, AlertTriangle, Check, FileCheck, ChevronRight, ChevronLeft, Maximize2, ArrowRight, BookOpen, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { events } from '../data/events';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from "../lib/supabase";
import Logo from '../components/Logo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, Legend } from 'recharts';
import SiteSettingsTab from '../components/SiteSettingsTab';
import RefundsManagementTab from '../components/RefundsManagementTab';
import AdminBlogsTab from '../components/AdminBlogsTab';
import { safeStorage } from '../lib/storage';
import SEO from '../components/SEO';
import { AdaptiveImage } from '../components/AdaptiveImage';
import { notifyOrganizerEventDecision } from '../lib/notificationHelper';

// Helper functions for robust event image resolution
const getEventMainImage = (evt: any): string => {
  if (!evt) return 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop';
  return (
    evt.horizontalImage ||
    evt.image ||
    evt.verticalImage ||
    evt.coverImage ||
    evt.coverImageUrl ||
    (evt.exampleImages && evt.exampleImages[0]) ||
    (evt.galleryImages && evt.galleryImages[0]) ||
    (evt.images && evt.images[0]) ||
    'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop'
  );
};

const getEventAllImages = (evt: any): string[] => {
  if (!evt) return [];
  const list: string[] = [];
  const add = (url: any) => {
    if (typeof url === 'string' && url.trim() && !list.includes(url.trim())) {
      list.push(url.trim());
    }
  };
  add(evt.horizontalImage);
  add(evt.image);
  add(evt.verticalImage);
  add(evt.coverImage);
  add(evt.coverImageUrl);
  if (Array.isArray(evt.exampleImages)) evt.exampleImages.forEach(add);
  if (Array.isArray(evt.galleryImages)) evt.galleryImages.forEach(add);
  if (Array.isArray(evt.images)) evt.images.forEach(add);
  if (list.length === 0) {
    list.push('https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop');
  }
  return list;
};

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
        cell = cell instanceof Date ? cell.toLocaleString() : (cell?.toString() || '').replace(/"/g, '""');
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
  { id: 'u1', name: 'Jane Doe', email: 'jane.doe@example.com', role: 'user', status: 'active', joined: '2025-10-12', phone: '+856 20 5511 2233', ticketsBought: 4 },
  { id: 'u2', name: 'John Smith', email: 'john.smith@example.com', role: 'organizer', status: 'active', joined: '2025-11-05', organization: 'John Smith Music', phone: '+856 20 1234 5678', bankName: 'BCEL', accountNumber: '0101100012345678' },
  { id: 'u3', name: 'Admin User', email: 'admin@pasopkan.com', role: 'admin', status: 'active', joined: '2025-01-01', phone: '+856 20 9999 0000', ticketsBought: 0 },
  { id: 'u4', name: 'Spam Bot', email: 'spam@bot.com', role: 'user', status: 'suspended', joined: '2026-02-20', phone: '+856 20 0000 0000', ticketsBought: 0 },
  { id: 'u5', name: 'TechLao Community', email: 'techlao@example.com', role: 'organizer', status: 'active', joined: '2025-12-10', organization: 'TechLao Co., Ltd.', phone: '+856 20 9876 5432', bankName: 'JDB', accountNumber: '999912345678' },
  { id: 'u6', name: 'Lao Events Group', email: 'contact@laoevents.la', role: 'organizer', status: 'active', joined: '2026-01-15', organization: 'Lao Events Co.', phone: '+856 20 5588 7766', bankName: 'BCEL', accountNumber: '0101100012345678' },
  { id: 'u7', name: 'Kham Souk Arts', email: 'khamsouk@artlao.org', role: 'organizer', status: 'active', joined: '2026-02-01', organization: 'Lao Heritage Crafts', phone: '+856 20 5544 3322', bankName: 'BCEL', accountNumber: '0102000098765432' },
  { id: 'u8', name: 'Aloun Phomma', email: 'aloun.p@gmail.com', role: 'user', status: 'active', joined: '2026-03-01', phone: '+856 20 7711 3344', ticketsBought: 3 },
  { id: 'u9', name: 'Vansy Douangdy', email: 'vansy.d@yahoo.com', role: 'user', status: 'active', joined: '2026-03-10', phone: '+856 20 9922 4455', ticketsBought: 1 },
  { id: 'u10', name: 'Bouasone Seng', email: 'bouasone.s@outlook.la', role: 'user', status: 'active', joined: '2026-03-12', phone: '+856 20 5566 7788', ticketsBought: 5 },
  { id: 'u11', name: 'Vang Vieng Tourism Hub', email: 'info@vangviengfest.la', role: 'organizer', status: 'active', joined: '2025-09-18', organization: 'Vang Vieng Tourism', phone: '+856 20 5533 1122', bankName: 'BCEL', accountNumber: '0101500044556677' },
];

const initialMockPendingEvents = [
  { 
    id: 'pe1', 
    title: 'Underground Indie Fest', 
    organizer: 'John Smith', 
    date: '2026-10-15', 
    time: '18:00',
    location: 'Vientiane, Laos', 
    venue: 'That Luang Esplanade',
    province: 'Vientiane Capital',
    category: 'Festival',
    price: '80,000 ₭',
    submittedAt: '2026-03-24',
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop',
    description: 'A vibrant underground indie music festival featuring 8 alternative rock bands, indie pop acts, and artisan street food stalls from across Laos and Southeast Asia.',
    ticketTiers: [
      { id: 't1', name: 'Early Bird', price: 60000, available: 100 },
      { id: 't2', name: 'Standard Admission', price: 80000, available: 350 },
      { id: 't3', name: 'VIP Pass (Backstage & Drinks)', price: 150000, available: 50 }
    ],
    organizerInfo: {
      name: 'John Smith Music',
      contact: '+856 20 1234 5678',
      description: 'Local music promoter focused on youth talent, independent bands, and cultural events.',
      idCardUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2680&auto=format&fit=crop',
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
    title: 'Tech Startup Meetup & Pitch Night', 
    organizer: 'TechLao Community', 
    date: '2026-11-02', 
    time: '14:00',
    location: 'Luang Prabang, Laos', 
    venue: 'Luang Prabang Innovation Hub',
    province: 'Luang Prabang',
    category: 'Workshop',
    price: 'Free Entry',
    submittedAt: '2026-03-25',
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1000&auto=format&fit=crop',
    description: 'Monthly gathering for developers, founders, and angel investors to discuss emerging AI technologies and tech innovation in Laos.',
    ticketTiers: [
      { id: 't1', name: 'General Free Admission', price: 0, available: 120 },
      { id: 't2', name: 'Pitch Presenter Seat', price: 50000, available: 15 }
    ],
    organizerInfo: {
      name: 'TechLao Community',
      contact: 'techlao@example.com',
      description: 'Tech enthusiasts organizing monthly meetups across Vientiane and Luang Prabang.',
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
  {
    id: 'pe3',
    title: 'Vang Vieng Eco Trail Run & Kayak Challenge',
    organizer: 'Vang Vieng Tourism Hub',
    date: '2026-10-28',
    time: '06:00',
    location: 'Vang Vieng, Vientiane Province',
    venue: 'Nam Song Riverbank',
    province: 'Vientiane Province',
    category: 'Sports',
    price: '120,000 ₭',
    submittedAt: '2026-03-26',
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1000&auto=format&fit=crop',
    description: 'Annual 15km mountain trail run and 5km kayak challenge along the scenic Nam Song River with finisher medals and cash prizes.',
    ticketTiers: [
      { id: 't1', name: 'Solo Trail & Kayak', price: 120000, available: 200 },
      { id: 't2', name: 'Tandem Team (2 Persons)', price: 220000, available: 60 }
    ],
    organizerInfo: {
      name: 'Vang Vieng Tourism Hub',
      contact: '+856 20 5533 1122',
      description: 'Official tourism association running certified sporting events in Vang Vieng.',
      idCardUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2680&auto=format&fit=crop',
      logoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2670&auto=format&fit=crop',
    },
    paymentInfo: {
      bankName: 'BCEL',
      accountName: 'VANG VIENG TOURISM HUB',
      accountNumber: '0101500044556677',
      qrCodeUrl: 'https://images.unsplash.com/photo-1595054225856-788cf911aeaa?q=80&w=2670&auto=format&fit=crop'
    }
  }
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
    completedDate: '2026-07-28',
    billImage: ''
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
    completedDate: '2026-07-15',
    billImage: ''
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
    ticketSalesTrend: 'Daily Ticket Sales Trends',
    salesVolumeLast30Days: 'Daily Ticket Sales & Revenue Trends',
    dailyRevenueTrends: 'Daily Ticket Sales Trends',
    dailyRevenueTrendsDesc: 'Track daily ticket sales trends, booking spikes, and revenue performance over time with interactive Recharts line charts.',
    allEvents: 'All Events',
    revenueOnly: 'Revenue (₭)',
    ticketsOnly: 'Tickets Sold (Daily)',
    combinedView: 'Tickets & Revenue',
    last7Days: '7D',
    last14Days: '14D',
    last30Days: '30D',
    last90Days: '90D',
    periodRevenue: 'Period Revenue',
    dailyAverage: 'Daily Average',
    peakDay: 'Peak Day',
    filterByEvent: 'Filter Event',
    exportChartCSV: 'Export CSV',
    totalRegistrations: 'Total Registrations',
    tickets: 'Tickets Sold',
    revenue: 'Revenue',
    pendingApprovals: 'Pending Approvals',
    manageUsers: 'Manage Users',
    manageOrganizers: 'Manage Organizers',
    organizers: 'Organizers',
    totalOrganizers: 'Total Organizers',
    activeOrganizers: 'Active Organizers',
    suspendedOrganizers: 'Suspended Organizers',
    hostedEvents: 'Hosted Events',
    organization: 'Organization',
    bankInfo: 'Bank Details',
    viewEvents: 'View Events',
    promoteToOrganizer: 'Promote to Organizer',
    demoteToUser: 'Change to Regular User',
    confirmRoleChangeTitle: 'Confirm Role Change',
    confirmPromoteTitle: 'Promote User to Organizer',
    confirmDemoteTitle: 'Change Organizer to Regular User',
    confirmPromoteSubtitle: 'Grant event publishing & management privileges',
    confirmDemoteSubtitle: 'Revoke organizer hosting privileges',
    confirmPromoteDesc: 'Are you sure you want to promote this user to an Organizer? They will be granted permissions to create and host events, manage ticket inventories, and request payouts.',
    confirmDemoteDesc: 'Are you sure you want to change this organizer back to a Regular User? Their organizer creation and management privileges will be revoked. Their existing published events will remain saved in the system.',
    currentRole: 'Current Role',
    newRole: 'New Role',
    confirmChange: 'Confirm Change',
    activate: 'Activate',
    noOrganizersFound: 'No organizers found matching your search.',
    organizerDetails: 'Organizer Profile',
    eventsByOrganizer: 'Events Hosted by Organizer',
    searchOrganizersPlaceholder: 'Search organizers by name, company, email, phone...',
    searchUsersPlaceholder: 'Search users by name, email, phone...',
    eventUpcoming: 'Event Upcoming (Event Type)',
    eventType: 'Event Type',
    bookingType: 'Booking Type',
    bookingUpcoming: 'Booking Experiences (Booking Type)',
    eventAlreadyDone: 'Event Already Done',
    moneyCanGet: 'Money Can Get (Payout)',
    netPayout: 'Net Payout',
    grossSales: 'Gross Sales',
    ticketHasSold: 'Tickets Sold',
    readyForPayout: 'Ready for Payout',
    completedEvents: 'Completed Events',
    totalPastRevenue: 'Completed Events Revenue',
    totalPastPayouts: 'Total Money to Payout',
    searchPlaceholder: 'Search...',
    allMonths: 'All Months',
    allYears: 'All Years',
    totalRevenue: 'Total Revenue',
    activeEvents: 'Active Events',
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
    organizerKyc: 'Organizer Information',
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
    refunds: 'Refunds',
    manageRefunds: 'Refund Management',
    pendingApprovalsTitle: 'Pending Event Approvals',
    pendingApprovalsDesc: 'Review, verify, and approve incoming event submissions and organizer credentials.',
    batchApprove: 'Approve Selected',
    batchReject: 'Reject Selected',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    exportPendingList: 'Export Pending CSV',
    viewCards: 'Cards',
    viewTable: 'Table',
    viewSplit: 'Split Review',
    urgentSubmission: 'Urgent',
    daysUntilEvent: 'days to event',
    verificationChecks: 'Admin Quality Checklist',
    checkCover: 'Cover Visual',
    checkVenue: 'Venue / Map',
    checkBank: 'Payout Details',
    checkPricing: 'Ticket Tiers',
    searchPendingPlaceholder: 'Search pending by event, organizer, venue, or bank...',
    allCategories: 'All Categories',
    sortNewest: 'Newest Submissions',
    sortOldest: 'Oldest / Longest Waiting',
    sortEventDate: 'Closest Event Date',
    sortCapacity: 'Highest Capacity',
    quickInspect: 'Quick Inspect',
    kycAttached: 'KYC Document Attached',
    viewIdCard: 'View ID',
    noIdCard: 'No ID Attached',
    payoutLinked: 'Bank Payout Attached',
    noPayoutInfo: 'No Payout Info',
    freeEventBadge: 'Free Event',
    capacityTotal: 'Total Capacity',
    rejectReasonPreset1: 'Incomplete bank account or payout information',
    rejectReasonPreset2: 'Low resolution or blurry cover image',
    rejectReasonPreset3: 'Venue location or authorization missing',
    rejectReasonPreset4: 'Ticket tier pricing or description unclear',
    rejectReasonPreset5: 'Duplicate event submission or invalid dates',
    recentlyReviewed: 'Recent Decision History',
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
    ticketSalesTrend: 'ແນວໂນ້ມການຂາຍປີ້ປະຈຳວັນ',
    salesVolumeLast30Days: 'ແນວໂນ້ມການຂາຍປີ້ ແລະ ລາຍຮັບປະຈຳວັນ',
    dailyRevenueTrends: 'ແນວໂນ້ມການຂາຍປີ້ປະຈຳວັນ',
    dailyRevenueTrendsDesc: 'ຕິດຕາມຈຳນວນປີ້ທີ່ຂາຍໄດ້ປະຈຳວັນ, ແນວໂນ້ມຄວາມຕ້ອງການ ແລະ ລາຍຮັບຕາມແຕ່ລະວັນດ້ວຍກຣາຟ Recharts.',
    allEvents: 'ທຸກ Event',
    revenueOnly: 'ສະເພາະລາຍຮັບ (₭)',
    ticketsOnly: 'ຈຳນວນປີ້ປະຈຳວັນ',
    combinedView: 'ປີ້ & ລາຍຮັບ',
    last7Days: '7 ວັນ',
    last14Days: '14 ວັນ',
    last30Days: '30 ວັນ',
    last90Days: '90 ວັນ',
    periodRevenue: 'ລາຍຮັບໃນຊ່ວງນີ້',
    dailyAverage: 'ສະເລ່ຍຕໍ່ວັນ',
    peakDay: 'ວັນທີ່ລາຍຮັບສູງສຸດ',
    filterByEvent: 'ກັ່ນຕອງຕາມ Event',
    exportChartCSV: 'ສົ່ງອອກ CSV',
    totalRegistrations: 'ການລົງທະບຽນທັງໝົດ',
    tickets: 'ປີ້ທີ່ຂາຍແລ້ວ',
    revenue: 'ລາຍຮັບ',
    pendingApprovals: 'ລໍຖ້າການອະນຸມັດ',
    manageUsers: 'ຈັດການຜູ້ໃຊ້',
    manageOrganizers: 'ຈັດການຜູ້ຈັດງານ',
    organizers: 'ຜູ້ຈັດງານ',
    totalOrganizers: 'ຜູ້ຈັດງານທັງໝົດ',
    activeOrganizers: 'ຜູ້ຈັດງານທີ່ເຄື່ອນໄຫວ',
    suspendedOrganizers: 'ຜູ້ຈັດງານທີ່ຖືກໂຈະ',
    hostedEvents: 'Event ທີ່ສ້າງ',
    organization: 'ອົງກອນ / ບໍລິສັດ',
    bankInfo: 'ບັນຊີທະນາຄານ',
    viewEvents: 'ເບິ່ງ Event',
    promoteToOrganizer: 'ປັບເປັນຜູ້ຈັດງານ',
    demoteToUser: 'ປ່ຽນເປັນຜູ້ໃຊ້ທົ່ວໄປ',
    confirmRoleChangeTitle: 'ຢືນຢັນການປ່ຽນບົດບາດ',
    confirmPromoteTitle: 'ປັບຜູ້ໃຊ້ເປັນຜູ້ຈັດງານ (Organizer)',
    confirmDemoteTitle: 'ປ່ຽນຜູ້ຈັດງານເປັນຜູ້ໃຊ້ທົ່ວໄປ (User)',
    confirmPromoteSubtitle: 'ມອບສິດທິໃນການສ້າງ ແລະ ຄຸ້ມຄອງກິດຈະກຳ',
    confirmDemoteSubtitle: 'ຍົກເລີກສິດທິຜູ້ຈັດງານ',
    confirmPromoteDesc: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປັບຜູ້ໃຊ້ນີ້ເປັນຜູ້ຈັດງານ? ຜູ້ໃຊ້ນີ້ຈະໄດ້ຮັບສິດທິໃນການສ້າງກິດຈະກຳ, ຈັດການປີ້ ແລະ ຂໍຖອນເງິນ.',
    confirmDemoteDesc: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປ່ຽນຜູ້ຈັດງານນີ້ກັບເປັນຜູ້ໃຊ້ທົ່ວໄປ? ສິດທິໃນການສ້າງ ແລະ ຄຸ້ມຄອງງານຈະຖືກຍົກເລີກ. ແຕ່ຂໍ້ມູນກິດຈະກຳເກົ່າຍັງຄົງຖືກບັນທຶກໄວ້ໃນລະບົບ.',
    currentRole: 'ບົດບາດປັດຈຸບັນ',
    newRole: 'ບົດບາດໃໝ່',
    confirmChange: 'ຢືນຢັນການປ່ຽນ',
    activate: 'ເປີດໃຊ້ງານ',
    noOrganizersFound: 'ບໍ່ພົບຜູ້ຈັດງານທີ່ກົງກັບການຄົ້ນຫາ.',
    organizerDetails: 'ຂໍ້ມູນຜູ້ຈັດງານ',
    eventsByOrganizer: 'Event ທີ່ສ້າງໂດຍຜູ້ຈັດງານນີ້',
    searchOrganizersPlaceholder: 'ຄົ້ນຫາຊື່, ອົງກອນ, ອີເມວ, ເບີໂທ...',
    searchUsersPlaceholder: 'ຄົ້ນຫາຜູ້ໃຊ້ຕາມຊື່, ອີເມວ, ເບີໂທ...',
    eventUpcoming: 'Event ທົ່ວໄປ (Event Type)',
    eventType: 'Event ທົ່ວໄປ',
    bookingType: 'ກິດຈະກຳຈອງ (Booking Type)',
    bookingUpcoming: 'ກິດຈະກຳຈອງ (Booking Type)',
    eventAlreadyDone: 'event ທີ່ສຳເລັດແລ້ວ',
    moneyCanGet: 'ເງິນທີ່ຈະໄດ້ຮັບ (Payout)',
    netPayout: 'ເງິນທີ່ໄດ້ຮັບຕົວຈິງ',
    grossSales: 'ຍອດຂາຍລວມ',
    ticketHasSold: 'ປີ້ທີ່ຂາຍແລ້ວ',
    readyForPayout: 'ພ້ອມເບີກຈ່າຍ',
    completedEvents: 'Event ທີ່ສຳເລັດແລ້ວ',
    totalPastRevenue: 'ລາຍຮັບ Event ທີ່ສຳເລັດແລ້ວ',
    totalPastPayouts: 'ເງິນທີ່ຈະໄດ້ຮັບທັງໝົດ',
    searchPlaceholder: 'ຄົ້ນຫາ...',
    allMonths: 'ທຸກເດືອນ',
    allYears: 'ທຸກປີ',
    totalRevenue: 'ລາຍຮັບທັງໝົດ',
    activeEvents: 'event ທີ່ເຄື່ອນໄຫວ',
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
    organizerKyc: 'ຂໍ້ມູນຜູ້ຈັດງານ',
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
    refunds: 'ການຄືນເງິນ',
    manageRefunds: 'ຈັດການການຄືນເງິນ',
    pendingApprovalsTitle: 'ກວດສອບກິດຈະກຳທີ່ລໍຖ້າອະນຸມັດ',
    pendingApprovalsDesc: 'ກວດສອບ, ຢືນຢັນ ແລະ ອະນຸມັດກິດຈະກຳໃໝ່ທີ່ຖືກສົ່ງເຂົ້າມາຈາກຜູ້ຈັດງານ.',
    batchApprove: 'ອະນຸມັດທີ່ເລືອກ',
    batchReject: 'ປະຕິເສດທີ່ເລືອກ',
    selectAll: 'ເລືອກທັງໝົດ',
    deselectAll: 'ຍົກເລີກການເລືອກ',
    exportPendingList: 'ດາວໂຫຼດ CSV',
    viewCards: 'ຮູບແບບກາດ',
    viewTable: 'ຮູບແບບຕາຕະລາງ',
    viewSplit: 'ກວດສອບດ່ວນ (Split)',
    urgentSubmission: 'ດ່ວນ',
    daysUntilEvent: 'ມື້ກ່ອນຮອດວັນງານ',
    verificationChecks: 'ລາຍການກວດສອບຄຸນນະພາບ',
    checkCover: 'ຮູບໜ້າປົກ',
    checkVenue: 'ສະຖານທີ່',
    checkBank: 'ຂໍ້ມູນການເງິນ',
    checkPricing: 'ລາຄາປີ້',
    searchPendingPlaceholder: 'ຄົ້ນຫາກິດຈະກຳ, ຜູ້ຈັດງານ, ສະຖານທີ່ ຫຼື ບັນຊີ...',
    allCategories: 'ທຸກໝວດໝູ່',
    sortNewest: 'ສົ່ງລ່າສຸດ',
    sortOldest: 'ລໍຖ້າດົນທີ່ສຸດ',
    sortEventDate: 'ວັນງານໃກ້ທີ່ສຸດ',
    sortCapacity: 'ຈຳນວນປີ້ຫຼາຍທີ່ສຸດ',
    quickInspect: 'ກວດສອບດ່ວນ',
    kycAttached: 'ມີເອກະສານ KYC',
    viewIdCard: 'ເບິ່ງບັດປະຈຳຕົວ',
    noIdCard: 'ບໍ່ມີເອກະສານ KYC',
    payoutLinked: 'ມີບັນຊີທະນາຄານ',
    noPayoutInfo: 'ຍັງບໍ່ມີຂໍ້ມູນບັນຊີ',
    freeEventBadge: 'ເຂົ້າຊົມຟຣີ',
    capacityTotal: 'ຈຳນວນປີ້ທັງໝົດ',
    rejectReasonPreset1: 'ຂໍ້ມູນບັນຊີທະນາຄານ ຫຼື ການຮັບເງິນບໍ່ຄົບຖ້ວນ',
    rejectReasonPreset2: 'ຮູບພາບໜ້າປົກບໍ່ຊັດເຈນ ຫຼື ແຕກ',
    rejectReasonPreset3: 'ສະຖານທີ່ຈັດງານບໍ່ຊັດເຈນ ຫຼື ຍັງບໍ່ໄດ້ຮັບອະນຸຍາດ',
    rejectReasonPreset4: 'ລາຄາປີ້ ຫຼື ປະເພດປີ້ບໍ່ຈະແຈ້ງ',
    rejectReasonPreset5: 'ການສົ່ງກິດຈະກຳຊ້ຳກັນ ຫຼື ວັນທີບໍ່ຖືກຕ້ອງ',
    recentlyReviewed: 'ປະຫວັດການຕັດສິນໃຈລ່າສຸດ',
  }
};

export default function AdminDashboard() {
  const { lang, toggleLanguage } = useLanguage();
  const t = translations[lang] as unknown as Record<string, string>;
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
        if (user.id) {
          try {
            const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (data && data.role === 'admin' && !error) {
              setIsAdminAuthenticated(true);
              sessionStorage.setItem('pasopkan_admin_authorized', 'true');
            }
          } catch (err) {
            console.error(err);
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


  const handleExportCSV = () => {
    // Generate CSV for Events & Sales
    const eventsRows = [
      ['Event Name', 'Category', 'Date', 'Status', 'Tickets Sold', 'Revenue (LAK)']
    ];
    
    const allEvents = [...eventsList, ...pendingEventsList];
    allEvents.forEach(event => {
      const ticketsSold = realTickets.filter(t => t.event?.id === event.id).reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
      const revenue = realTickets.filter(t => t.event?.id === event.id).reduce((sum, t) => sum + ((Number(t.quantity) || 1) * (Number(t.tier?.price) || 0)), 0);
      eventsRows.push([
        `"${(event.title || '').replace(/"/g, '""')}"`,
        `"${(event.category || '').replace(/"/g, '""')}"`,
        event.date,
        event.status,
        ticketsSold.toString(),
        revenue.toString()
      ]);
    });

    const eventsCsvContent = eventsRows.map(e => e.join(",")).join("\n");
    
    // Generate CSV for Users
    const usersRows = [
      ['Name', 'Email', 'Role', 'Status', 'Joined Date']
    ];
    
    usersList.forEach(user => {
      usersRows.push([
        `"${(user.name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        user.role,
        user.status,
        new Date(user.joined).toISOString().split('T')[0]
      ]);
    });
    
    const usersCsvContent = usersRows.map(e => e.join(",")).join("\n");
    
    // Combine them or trigger two downloads? Let's combine them into one file with a separator
    const combinedCsv = `EVENTS AND SALES DATA\n\n${eventsCsvContent}\n\n\nUSER REGISTRATION DATA\n\n${usersCsvContent}`;
    
    const blob = new Blob([combinedCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pasopkan_admin_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addActivityLog('Data Exported', 'Exported events and users data to CSV');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('pasopkan_admin_authorized');
    setAdminUsername('');
    setAdminPassword('');
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users' | 'organizers' | 'events' | 'bookings' | 'past-events' | 'payouts' | 'refunds' | 'activity-log' | 'notifications' | 'site-settings' | 'blogs'>('overview');
  const [selectedOrganizerForEvents, setSelectedOrganizerForEvents] = useState<any | null>(null);
  const [organizerStatusFilter, setOrganizerStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [pendingRefundsCount, setPendingRefundsCount] = useState<number>(() => {
    try {
      const stored = safeStorage.getItem('pasopkan_admin_refunds');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((r: any) => r.status === 'pending').length;
        }
      }
    } catch (e) {}
    return 1;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [uploadingBill, setUploadingBill] = useState<Record<string, string>>({});
  const [uploadingRef, setUploadingRef] = useState<Record<string, string>>({});
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [tempFeePercent, setTempFeePercent] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedPreviewImageIndex, setSelectedPreviewImageIndex] = useState<number>(0);
  const [previewImageFitMode, setPreviewImageFitMode] = useState<'contain' | 'cover'>('contain');
  const [previewShowOverlay, setPreviewShowOverlay] = useState<boolean>(true);

  useEffect(() => {
    setSelectedPreviewImageIndex(0);
    setPreviewImageFitMode('contain');
    setPreviewShowOverlay(true);
  }, [selectedEvent?.id]);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  
  // Pending Approvals Tab State
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [inspectedPendingEvent, setInspectedPendingEvent] = useState<any | null>(null);
  const [checklistMap, setChecklistMap] = useState<Record<string, { cover: boolean; venue: boolean; bank: boolean; pricing: boolean }>>({
    pe1: { cover: true, venue: true, bank: true, pricing: true },
    pe2: { cover: true, venue: true, bank: true, pricing: true },
    pe3: { cover: true, venue: true, bank: true, pricing: true },
  });
  const [approvalDecisionHistory, setApprovalDecisionHistory] = useState<Array<{ id: string; title: string; decision: 'approved' | 'rejected'; timestamp: string; reason?: string }>>([]);
  
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
              joined: new Date().toISOString().split('T')[0],
              phone: savedUser.phone || '+856 20 5555 0000',
              ticketsBought: 0
            });
          }
        }
      }
    } catch(e) {}
    return list;
  });
  
  const generateSampleTickets = () => {
    const sampleEvents = [
      { id: '1', title: 'That Luang Festival', tier: { id: 't2', name: 'VIP Seating (Grandstand)', price: 150000 } },
      { id: '2', title: 'AI Developer Summit 2026', tier: { id: 't1', name: 'Standard Pass', price: 250000 } },
      { id: '3', title: 'Vang Vieng Music Fest', tier: { id: 't1', name: 'General Admission', price: 120000 } },
      { id: '4', title: 'Luang Prabang Half Marathon', tier: { id: 't1', name: '21K Entry', price: 180000 } },
      { id: '5', title: 'Traditional Silk Weaving Workshop', tier: { id: 't1', name: 'Workshop Seat', price: 90000 } },
    ];
    
    const sampleList: any[] = [];
    const now = new Date();
    
    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
      const saleDate = new Date(now);
      saleDate.setDate(now.getDate() - dayOffset);
      const dayOfWeek = saleDate.getDay();
      const weekendMultiplier = (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) ? 2 : 1;
      const baseCount = ((dayOffset * 7 + 3) % 4) + 1;
      const salesCount = Math.min(6, baseCount * weekendMultiplier);

      for (let s = 0; s < salesCount; s++) {
        const ev = sampleEvents[(dayOffset + s) % sampleEvents.length];
        const qty = ((dayOffset + s) % 3) + 1;
        const hours = 8 + ((dayOffset * 3 + s * 2) % 12);
        const minutes = (s * 17) % 60;
        saleDate.setHours(hours, minutes, 0, 0);
        sampleList.push({
          id: `ticket-seed-${dayOffset}-${s}`,
          eventId: ev.id,
          event: { id: ev.id, title: ev.title },
          tier: ev.tier,
          quantity: qty,
          purchaseDate: saleDate.toISOString(),
          buyerName: `Attendee ${dayOffset}-${s}`,
          buyerEmail: `attendee${dayOffset}${s}@example.com`,
          status: 'confirmed'
        });
      }
    }
    return sampleList;
  };

  const [realTickets, setRealTickets] = useState<any[]>(() => {
    const sample = generateSampleTickets();
    try {
      const tickets = safeStorage.getItem('pasopkan_user_tickets');
      if (tickets) {
        const parsed = JSON.parse(tickets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...sample];
        }
      }
    } catch(e) {}
    return sample;
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
              const amount = parseInt(String(tx.amount || '').replace(/[^0-9]/g, '')) || 0;
              return sum + amount;
            }, 0),
            platformFeePercent: 10,
            platformFeeAmount: txns.reduce((sum: number, tx: any) => {
              const amount = parseInt(String(tx.amount || '').replace(/[^0-9]/g, '')) || 0;
              return sum + amount;
            }, 0) * 0.1,
            payoutAmount: txns.reduce((sum: number, tx: any) => {
              const amount = parseInt(String(tx.amount || '').replace(/[^0-9]/g, '')) || 0;
              return sum + amount;
            }, 0) * 0.9,
            status: 'pending',
            bankInfo: {
              bankName: 'BCEL',
              accountName: 'Platform Vendor',
              accountNumber: 'XXXXX1234'
            },
            completedDate: '',
            billImage: ''
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
  const [roleConfirmData, setRoleConfirmData] = useState<{
    user: any;
    targetRole: 'organizer' | 'user';
  } | null>(null);

  // Daily Ticket Sales & Revenue Trends controls
  const [revenueTimeRange, setRevenueTimeRange] = useState<'7' | '14' | '30' | '90'>('30');
  const [revenueEventFilter, setRevenueEventFilter] = useState<string>('all');
  const [revenueMetricMode, setRevenueMetricMode] = useState<'combined' | 'revenue' | 'tickets'>('tickets');
  const [isExportingRevenueChart, setIsExportingRevenueChart] = useState(false);

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

  const syncFromStorage = () => {
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        const all = JSON.parse(saved);
        if (Array.isArray(all)) {
          const approvedOrLive = all.filter((e: any) => e.status !== 'pending' && e.status !== 'rejected');
          const pending = all.filter((e: any) => e.status === 'pending');
          setEventsList(approvedOrLive);
          setPendingEventsList([...pending, ...initialMockPendingEvents.filter(mock => !pending.some(p => p.id === mock.id))]);
        }
      }

      const refundsStored = safeStorage.getItem('pasopkan_admin_refunds');
      if (refundsStored) {
        const parsedRefunds = JSON.parse(refundsStored);
        if (Array.isArray(parsedRefunds)) {
          setPendingRefundsCount(parsedRefunds.filter((r: any) => r.status === 'pending').length);
        }
      }
    } catch (err) {
      console.error('Failed to sync events in Admin Dashboard:', err);
    }
  };

  useEffect(() => {
    syncFromStorage();
    const handleStorageUpdate = () => {
      syncFromStorage();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('pasopkan_storage_update', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);

    const interval = setInterval(syncFromStorage, 4000);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('pasopkan_storage_update', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const handleExportData = () => {
    switch (activeTab) {
      case 'users':
        exportToCSV('pasopkan_users.csv', usersList.filter(u => u.role !== 'organizer').map(u => ({
          'Name': u.name,
          'Email': u.email,
          'Phone': u.phone || '',
          'Role': u.role,
          'Status': u.status,
          'Tickets Purchased': u.ticketsBought || 0,
          'Joined Date': u.joined
        })));
        break;
      case 'organizers':
        exportToCSV('pasopkan_organizers.csv', usersList.filter(u => u.role === 'organizer').map(org => {
          const orgEvents = eventsList.filter(e => 
            (e.organizer && e.organizer.toLowerCase() === org.name.toLowerCase()) ||
            (org.organization && e.organizer && e.organizer.toLowerCase() === org.organization.toLowerCase())
          );
          return {
            'Name': org.name,
            'Organization': org.organization || org.name,
            'Email': org.email,
            'Phone': org.phone || '',
            'Status': org.status,
            'Bank': org.bankName || '',
            'Account Number': org.accountNumber || '',
            'Hosted Events Count': orgEvents.length,
            'Joined Date': org.joined
          };
        }));
        break;
      case 'events':
        exportToCSV('pasopkan_standard_events.csv', eventsList.filter(e => e.dateType !== 'booking'));
        break;
      case 'bookings':
        const bookingExport = eventsList.filter(e => e.dateType === 'booking').map(e => {
          const fin = getEventFinancialSummary(e);
          return {
            'Experience Title': e.title,
            'Type': 'Booking Experience',
            'Organizer': e.organizer || '',
            'Category': e.category || '',
            'Booking Range': `${e.bookingStartDate || e.date} to ${e.bookingEndDate || 'Ongoing'}`,
            'Time Slots': (e.bookingTimeSlots || []).join('; '),
            'Slot Capacity': e.bookingCapacity || '10',
            'Location': e.location || '',
            'Tickets Sold': fin.ticketsSold,
            'Gross Revenue (LAK)': fin.grossRevenue,
            'Platform Fee (LAK)': fin.platformFeeAmount,
            'Payout Can Get (LAK)': fin.moneyCanGet,
            'Payout Status': fin.payoutStatus
          };
        });
        exportToCSV('pasopkan_booking_experiences.csv', bookingExport);
        break;
      case 'past-events':
        const pastEventsExport = eventsList.filter(e => new Date(e.date) < new Date()).map(e => {
          const fin = getEventFinancialSummary(e);
          return {
            'Event Title': e.title,
            'Organizer': e.organizer || '',
            'Category': e.category || '',
            'Date': e.date,
            'Location': e.location || '',
            'Tickets Sold': fin.ticketsSold,
            'Total Capacity': fin.totalCapacity,
            'Gross Revenue (LAK)': fin.grossRevenue,
            'Platform Fee (LAK)': fin.platformFeeAmount,
            'Money Can Get (LAK)': fin.moneyCanGet,
            'Payout Status': fin.payoutStatus
          };
        });
        exportToCSV('pasopkan_completed_events_financials.csv', pastEventsExport);
        break;
      case 'approvals':
        exportToCSV('pasopkan_pending_approvals.csv', pendingEventsList);
        break;
      case 'payouts':
        exportToCSV('pasopkan_payouts.csv', payoutsList);
        break;
      case 'refunds':
        try {
          const refundsData = safeStorage.getItem('pasopkan_admin_refunds');
          if (refundsData) {
            exportToCSV('pasopkan_refunds.csv', JSON.parse(refundsData));
          }
        } catch(e) {}
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
      let approvedEvent = { 
        ...eventToApprove, 
        id: isFromStorage ? eventToApprove.id : `evt-${Date.now()}-${id}`,
        status: 'approved' 
      };

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

      // Notify organizer of event approval
      notifyOrganizerEventDecision(approvedEvent, 'approved');

      setEventsList([approvedEvent, ...eventsList]);
      setPendingEventsList(pendingEventsList.filter(e => e.id !== id));
      setSelectedPendingIds(prev => prev.filter(item => item !== id));
      if (inspectedPendingEvent?.id === id) {
        setInspectedPendingEvent(null);
      }
      setApprovalDecisionHistory(prev => [
        { id: eventToApprove.id, title: eventToApprove.title, decision: 'approved', timestamp: new Date().toISOString() },
        ...prev.slice(0, 9)
      ]);
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
          const updatedStorageEvents = allEvents.map((e: any) => e.id === eventToReject.id ? { ...e, status: 'rejected', rejectionReason: reason } : e);
          safeStorage.setItem('organizer_events', JSON.stringify(updatedStorageEvents));
        } catch (err) {
          console.error(err);
        }
      }

      // Notify organizer of event rejection
      notifyOrganizerEventDecision(eventToReject, 'rejected', reason);

      setApprovalDecisionHistory(prev => [
        { id: eventToReject.id, title: eventToReject.title, decision: 'rejected', timestamp: new Date().toISOString(), reason },
        ...prev.slice(0, 9)
      ]);
      addActivityLog('Event rejected', `${eventToReject.title}${reason ? `: ${reason}` : ''}`);
    }
    setPendingEventsList(pendingEventsList.filter(e => e.id !== id));
    setSelectedPendingIds(prev => prev.filter(item => item !== id));
    if (inspectedPendingEvent?.id === id) {
      setInspectedPendingEvent(null);
    }
    setComment('');
    setShowRejectionModal(false);
    setSelectedEvent(null);
  };

  const handleBatchApprove = () => {
    if (selectedPendingIds.length === 0) return;
    const toApprove = pendingEventsList.filter(e => selectedPendingIds.includes(e.id));
    
    try {
      const saved = safeStorage.getItem('organizer_events');
      let allEvents = saved ? JSON.parse(saved) : [...events];
      const newlyApprovedList: any[] = [];

      toApprove.forEach(item => {
        const approved = {
          ...item,
          id: item.id.startsWith('pe') ? `evt-${Date.now()}-${item.id}` : item.id,
          status: 'approved'
        };
        newlyApprovedList.push(approved);
        const exists = allEvents.some((e: any) => e.id === approved.id);
        if (exists) {
          allEvents = allEvents.map((e: any) => e.id === approved.id ? { ...e, status: 'approved' } : e);
        } else {
          allEvents = [approved, ...allEvents];
        }
        addActivityLog('Event approved', item.title);

        // Notify organizer of event approval
        notifyOrganizerEventDecision(approved, 'approved');
      });

      safeStorage.setItem('organizer_events', JSON.stringify(allEvents));
      setEventsList([...newlyApprovedList, ...eventsList]);
      setPendingEventsList(pendingEventsList.filter(e => !selectedPendingIds.includes(e.id)));
      setApprovalDecisionHistory(prev => [
        ...toApprove.map(e => ({ id: e.id, title: e.title, decision: 'approved' as const, timestamp: new Date().toISOString() })),
        ...prev
      ].slice(0, 10));
      setSelectedPendingIds([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchReject = (reason?: string) => {
    if (selectedPendingIds.length === 0) return;
    const toReject = pendingEventsList.filter(e => selectedPendingIds.includes(e.id));

    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        let allEvents = JSON.parse(saved);
        allEvents = allEvents.map((e: any) => selectedPendingIds.includes(e.id) ? { ...e, status: 'rejected', rejectionReason: reason } : e);
        safeStorage.setItem('organizer_events', JSON.stringify(allEvents));
      }
    } catch (err) {
      console.error(err);
    }

    toReject.forEach(item => {
      addActivityLog('Event rejected', `${item.title}${reason ? `: ${reason}` : ''}`);
      // Notify organizer of event rejection
      notifyOrganizerEventDecision(item, 'rejected', reason);
    });

    setPendingEventsList(pendingEventsList.filter(e => !selectedPendingIds.includes(e.id)));
    setApprovalDecisionHistory(prev => [
      ...toReject.map(e => ({ id: e.id, title: e.title, decision: 'rejected' as const, timestamp: new Date().toISOString(), reason })),
      ...prev
    ].slice(0, 10));
    setSelectedPendingIds([]);
    setShowRejectionModal(false);
    setSelectedEvent(null);
    setComment('');
  };

  const handleExportPendingCSV = () => {
    const rows = [
      ['Event Title', 'Category', 'Organizer', 'Date', 'Venue', 'Submitted At', 'Price', 'Capacity', 'Bank Name', 'Account Number']
    ];
    pendingEventsList.forEach(e => {
      const capacity = e.ticketTiers ? e.ticketTiers.reduce((s: number, t: any) => s + (Number(t.available) || 0), 0) : 0;
      rows.push([
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${(e.category || 'General').replace(/"/g, '""')}"`,
        `"${(e.organizer || '').replace(/"/g, '""')}"`,
        e.date || '',
        `"${(e.venue || e.location || '').replace(/"/g, '""')}"`,
        e.submittedAt || '',
        `"${e.price || 'Free'}"`,
        capacity.toString(),
        `"${(e.paymentInfo?.bankName || '').replace(/"/g, '""')}"`,
        `"${(e.paymentInfo?.accountNumber || '').replace(/"/g, '""')}"`
      ]);
    });
    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pasopkan_pending_events_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleChecklistItem = (eventId: string, key: 'cover' | 'venue' | 'bank' | 'pricing') => {
    setChecklistMap(prev => {
      const current = prev[eventId] || { cover: false, venue: false, bank: false, pricing: false };
      return {
        ...prev,
        [eventId]: {
          ...current,
          [key]: !current[key]
        }
      };
    });
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
    handleToggleUserStatus(id);
  };

  const handleToggleUserStatus = (id: string) => {
    const user = usersList.find(u => u.id === id);
    if (user) {
      const nextStatus = user.status === 'active' ? 'suspended' : 'active';
      const label = user.role === 'organizer' ? 'Organizer' : 'User';
      addActivityLog(nextStatus === 'suspended' ? `${label} suspended` : `${label} activated`, user.name);
      setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
    }
  };

  const handleRequestRoleChange = (user: any, targetRole: 'organizer' | 'user') => {
    setRoleConfirmData({ user, targetRole });
  };

  const handleConfirmRoleChange = () => {
    if (!roleConfirmData) return;
    const { user, targetRole } = roleConfirmData;
    const isEditModalSource = editingUser && editingUser.id === user.id;

    addActivityLog(
      'User role updated',
      `${user.name} role changed to ${targetRole === 'organizer' ? 'Organizer' : 'Regular User'}`
    );

    setUsersList(prev => prev.map(u => {
      if (u.id === user.id) {
        const base = isEditModalSource ? { ...editingUser } : { ...u };
        return {
          ...base,
          role: targetRole,
          organization: base.organization || (targetRole === 'organizer' ? `${user.name} Events` : undefined),
          bankName: base.bankName || 'BCEL',
          accountNumber: base.accountNumber || '0101100012345678'
        };
      }
      return u;
    }));

    if (isEditModalSource) {
      setEditingUser(null);
    }
    setRoleConfirmData(null);
  };

  const handlePromoteToOrganizer = (id: string) => {
    const user = usersList.find(u => u.id === id);
    if (user) {
      const nextRole: 'organizer' | 'user' = user.role === 'organizer' ? 'user' : 'organizer';
      setRoleConfirmData({ user, targetRole: nextRole });
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const oldUser = usersList.find(u => u.id === editingUser.id);
    if (oldUser && oldUser.role !== editingUser.role && (editingUser.role === 'organizer' || editingUser.role === 'user')) {
      setRoleConfirmData({
        user: { ...editingUser, name: editingUser.name || oldUser.name },
        targetRole: editingUser.role as 'organizer' | 'user'
      });
      return;
    }
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

    // Find original event from lists or storage to keep all organizer-created data
    let originalEvent = eventsList.find(e => String(e.id) === String(editingEvent.id)) || 
                        pendingEventsList.find(e => String(e.id) === String(editingEvent.id));
    if (!originalEvent) {
      try {
        const saved = safeStorage.getItem('organizer_events');
        if (saved) {
          const parsed = JSON.parse(saved);
          originalEvent = parsed.find((e: any) => String(e.id) === String(editingEvent.id));
        }
      } catch (err) {
        console.error(err);
      }
    }

    const mergedEvent = {
      ...(originalEvent || {}),
      ...editingEvent,
      // Retain and preserve all old data created by organizer
      organizer: editingEvent.organizer || originalEvent?.organizer,
      organizerInfo: editingEvent.organizerInfo || originalEvent?.organizerInfo,
      organizerContact: editingEvent.organizerContact || originalEvent?.organizerContact,
      organizerPhone: editingEvent.organizerPhone || originalEvent?.organizerPhone,
      organizerEmail: editingEvent.organizerEmail || originalEvent?.organizerEmail,
      organizerLogo: editingEvent.organizerLogo || originalEvent?.organizerLogo,
      organizerSocialLinks: editingEvent.organizerSocialLinks || originalEvent?.organizerSocialLinks,
      organizerId: originalEvent?.organizerId || editingEvent.organizerId,
      userId: originalEvent?.userId || editingEvent.userId,
      createdBy: originalEvent?.createdBy || editingEvent.createdBy,
      creatorEmail: originalEvent?.creatorEmail || editingEvent.creatorEmail,
      createdAt: originalEvent?.createdAt || editingEvent.createdAt,
      bankName: originalEvent?.bankName || editingEvent.bankName,
      accountNumber: originalEvent?.accountNumber || editingEvent.accountNumber,
      accountHolder: originalEvent?.accountHolder || editingEvent.accountHolder,
      idCardFile: originalEvent?.idCardFile || editingEvent.idCardFile,
      businessRegFile: originalEvent?.businessRegFile || editingEvent.businessRegFile,
      kycStatus: originalEvent?.kycStatus || editingEvent.kycStatus,
      registered: originalEvent?.registered !== undefined ? originalEvent.registered : editingEvent.registered,
      scanned: originalEvent?.scanned !== undefined ? originalEvent.scanned : editingEvent.scanned,
      totalTickets: originalEvent?.totalTickets !== undefined ? originalEvent.totalTickets : editingEvent.totalTickets,
      soldTickets: originalEvent?.soldTickets !== undefined ? originalEvent.soldTickets : editingEvent.soldTickets,
      revenue: originalEvent?.revenue !== undefined ? originalEvent.revenue : editingEvent.revenue,
      views: originalEvent?.views !== undefined ? originalEvent.views : editingEvent.views,
      purchases: originalEvent?.purchases !== undefined ? originalEvent.purchases : editingEvent.purchases,
      likes: originalEvent?.likes !== undefined ? originalEvent.likes : editingEvent.likes,
      featured: originalEvent?.featured !== undefined ? originalEvent.featured : editingEvent.featured,
    };

    addActivityLog('Event edited', `Edited details for ${mergedEvent.title}`);
    
    // Update active and pending events lists based on status
    if (mergedEvent.status === 'pending') {
      setPendingEventsList(prev => prev.some(e => e.id === mergedEvent.id) 
        ? prev.map(e => e.id === mergedEvent.id ? mergedEvent : e) 
        : [mergedEvent, ...prev]);
      setEventsList(prev => prev.filter(e => e.id !== mergedEvent.id));
    } else if (mergedEvent.status === 'rejected') {
      setPendingEventsList(prev => prev.filter(e => e.id !== mergedEvent.id));
      setEventsList(prev => prev.filter(e => e.id !== mergedEvent.id));
    } else {
      setEventsList(prev => prev.some(e => e.id === mergedEvent.id) 
        ? prev.map(e => e.id === mergedEvent.id ? mergedEvent : e) 
        : [mergedEvent, ...prev]);
      setPendingEventsList(prev => prev.filter(e => e.id !== mergedEvent.id));
    }

    // Update selected event if it's the one we're editing
    if (selectedEvent?.id === mergedEvent.id) {
      setSelectedEvent(mergedEvent);
    }

    // Notify organizer if status was changed during edit
    if (originalEvent?.status !== mergedEvent.status) {
      if (mergedEvent.status === 'approved') {
        notifyOrganizerEventDecision(mergedEvent, 'approved');
      } else if (mergedEvent.status === 'rejected') {
        notifyOrganizerEventDecision(mergedEvent, 'rejected', (mergedEvent as any).rejectionReason || 'Event submission requirements not met');
      }
    }
    
    // Persist to storage
    try {
      const saved = safeStorage.getItem('organizer_events');
      if (saved) {
        const allEvents = JSON.parse(saved);
        const exists = allEvents.some((ev: any) => String(ev.id) === String(mergedEvent.id));
        let newStorageEvents;
        if (exists) {
          newStorageEvents = allEvents.map((ev: any) => String(ev.id) === String(mergedEvent.id) ? mergedEvent : ev);
        } else {
          newStorageEvents = [mergedEvent, ...allEvents];
        }
        safeStorage.setItem('organizer_events', JSON.stringify(newStorageEvents));
      } else {
        safeStorage.setItem('organizer_events', JSON.stringify([mergedEvent]));
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

  const availableEventsForFilter = React.useMemo(() => {
    const map = new Map<string, string>();
    eventsList.forEach(e => {
      if (e.id && e.title) map.set(String(e.id), e.title);
    });
    realTickets.forEach(t => {
      const id = t.event?.id || t.eventId;
      const title = t.event?.title;
      if (id && title) map.set(String(id), title);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [eventsList, realTickets]);

  const dailyRevenueTrendData = React.useMemo(() => {
    const days = parseInt(revenueTimeRange, 10) || 30;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dailyData = new Map();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-US", {
        month: days > 30 ? "numeric" : "short",
        day: "numeric"
      });
      dailyData.set(dateKey, {
        date: dayLabel,
        fullDate: dateKey,
        rawDate: d,
        tickets: 0,
        revenue: 0,
        eventSales: {} as Record<string, { title: string; revenue: number; tickets: number }>
      });
    }

    const filteredTickets = realTickets.filter(ticket => {
      if (revenueEventFilter === 'all') return true;
      const evId = ticket.event?.id || ticket.eventId;
      return String(evId) === String(revenueEventFilter);
    });

    filteredTickets.forEach(ticket => {
      if (ticket.purchaseDate) {
        const ticketDate = new Date(ticket.purchaseDate);
        ticketDate.setHours(0, 0, 0, 0);
        const dateKey = ticketDate.toISOString().split("T")[0];

        if (dailyData.has(dateKey)) {
          const existing = dailyData.get(dateKey);
          const quantity = Number(ticket.quantity) || 1;
          const price = Number(ticket.tier?.price) || 0;
          const rev = quantity * price;

          existing.tickets += quantity;
          existing.revenue += rev;

          const evTitle = ticket.event?.title || 'Unknown Event';
          if (!existing.eventSales[evTitle]) {
            existing.eventSales[evTitle] = { title: evTitle, revenue: 0, tickets: 0 };
          }
          existing.eventSales[evTitle].revenue += rev;
          existing.eventSales[evTitle].tickets += quantity;
        }
      }
    });

    return Array.from(dailyData.values());
  }, [realTickets, revenueTimeRange, revenueEventFilter, lang]);

  const revenueStats = React.useMemo(() => {
    const days = parseInt(revenueTimeRange, 10) || 30;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filteredTickets = realTickets.filter(ticket => {
      if (revenueEventFilter === 'all') return true;
      const evId = ticket.event?.id || ticket.eventId;
      return String(evId) === String(revenueEventFilter);
    });

    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - (days - 1));

    const prevPeriodEnd = new Date(currentPeriodStart);
    prevPeriodEnd.setDate(currentPeriodStart.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setDate(prevPeriodEnd.getDate() - (days - 1));

    let currentRevenue = 0;
    let currentTickets = 0;
    let prevRevenue = 0;
    let prevTickets = 0;
    let peakRevenue = 0;
    let peakDate = '';
    let peakTickets = 0;
    let peakTicketsDate = '';

    dailyRevenueTrendData.forEach(item => {
      currentRevenue += item.revenue;
      currentTickets += item.tickets;
      if (item.revenue > peakRevenue) {
        peakRevenue = item.revenue;
        peakDate = item.date;
      }
      if (item.tickets > peakTickets) {
        peakTickets = item.tickets;
        peakTicketsDate = item.date;
      }
    });

    filteredTickets.forEach(ticket => {
      if (ticket.purchaseDate) {
        const d = new Date(ticket.purchaseDate);
        d.setHours(0, 0, 0, 0);
        if (d >= prevPeriodStart && d <= prevPeriodEnd) {
          const qty = Number(ticket.quantity) || 1;
          const price = Number(ticket.tier?.price) || 0;
          prevRevenue += qty * price;
          prevTickets += qty;
        }
      }
    });

    const revenueGrowth = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : (currentRevenue > 0 ? 100 : 0);

    const ticketGrowth = prevTickets > 0
      ? ((currentTickets - prevTickets) / prevTickets) * 100
      : (currentTickets > 0 ? 100 : 0);

    const dailyAverage = days > 0 ? Math.round(currentRevenue / days) : 0;
    const dailyAverageTickets = days > 0 ? (currentTickets / days) : 0;

    return {
      currentRevenue,
      currentTickets,
      dailyAverage,
      dailyAverageTickets,
      peakRevenue,
      peakDate: peakDate || (dailyRevenueTrendData[0]?.date || 'N/A'),
      peakTickets,
      peakTicketsDate: peakTicketsDate || (dailyRevenueTrendData[0]?.date || 'N/A'),
      revenueGrowth,
      ticketGrowth
    };
  }, [dailyRevenueTrendData, realTickets, revenueTimeRange, revenueEventFilter]);

  // Keep salesTrendData alias for compatibility
  const salesTrendData = dailyRevenueTrendData;

  const grossRevenue = React.useMemo(() => {
    return realTickets.reduce((sum, t) => sum + ((Number(t.quantity) || 1) * (Number(t.tier?.price) || 0)), 0);
  }, [realTickets]);

  const totalTicketsCount = React.useMemo(() => {
    return realTickets.reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
  }, [realTickets]);

  const activeEventsCount = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventsList.filter(e => {
      try {
        const d = new Date(e.date);
        return d >= today;
      } catch (err) {
        return true;
      }
    }).length;
  }, [eventsList]);

  // Comprehensive financial and ticket sales calculator for events (both past and upcoming)
  const getEventFinancialSummary = React.useCallback((event: any) => {
    if (!event) {
      return {
        ticketsSold: 0,
        totalCapacity: 0,
        grossRevenue: 0,
        platformFeePercent: 10,
        platformFeeAmount: 0,
        moneyCanGet: 0,
        payoutStatus: 'ready' as const,
        payoutId: undefined
      };
    }

    // 1. Match realTickets
    const matchingTickets = realTickets.filter(t => 
      t.event?.id === event.id || 
      t.eventId === event.id || 
      (t.event?.title && event.title && t.event.title.trim().toLowerCase() === event.title.trim().toLowerCase())
    );

    // 2. Match payoutsList
    const matchingPayout = payoutsList.find(p => 
      p.eventId === event.id || 
      (p.eventTitle && event.title && p.eventTitle.trim().toLowerCase() === event.title.trim().toLowerCase())
    );

    let ticketsSold = 0;
    let grossRevenue = 0;
    let totalCapacity = 0;

    // Calculate total capacity from tiers or availableTickets
    if (event.ticketTiers && Array.isArray(event.ticketTiers) && event.ticketTiers.length > 0) {
      totalCapacity = event.ticketTiers.reduce((acc: number, tier: any) => acc + (Number(tier.available) || Number(tier.quantity) || 150), 0);
    } else if (event.availableTickets) {
      totalCapacity = Number(event.availableTickets) || 500;
    } else {
      totalCapacity = 500;
    }

    if (matchingTickets.length > 0) {
      ticketsSold = matchingTickets.reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
      grossRevenue = matchingTickets.reduce((sum, t) => {
        const qty = Number(t.quantity) || 1;
        const price = Number(t.tier?.price) || Number(event.price) || 0;
        const actualPrice = price < 1000 && price > 0 ? price * 1000 : price;
        return sum + (qty * actualPrice);
      }, 0);
    } else if (matchingPayout && matchingPayout.revenue > 0) {
      grossRevenue = matchingPayout.revenue;
      const firstTierPrice = event.ticketTiers?.[0]?.price;
      const cleanAvg = firstTierPrice ? (Number(firstTierPrice) < 1000 ? Number(firstTierPrice) * 1000 : Number(firstTierPrice)) : (Number(event.price) || 150000);
      ticketsSold = cleanAvg > 0 ? Math.round(grossRevenue / cleanAvg) : 25;
    } else if (typeof event.soldTickets === 'number' && event.soldTickets > 0) {
      ticketsSold = event.soldTickets;
      grossRevenue = event.revenue || (ticketsSold * (event.price || 150000));
    } else if (typeof event.purchases === 'number' && event.purchases > 0) {
      ticketsSold = event.purchases;
      grossRevenue = event.revenue || (ticketsSold * (event.price || 150000));
    } else {
      // Deterministic calculation for past events so realistic sales figures and revenue are shown
      const numId = parseInt(String(event.id).replace(/\D/g, ''), 10) || ((event.title?.charCodeAt(0) || 65) + (event.title?.length || 10));
      const multiplier = ((numId * 13) % 25) + 15;
      if (event.ticketTiers && event.ticketTiers.length > 0) {
        event.ticketTiers.forEach((tier: any, idx: number) => {
          const tierCap = Number(tier.available) || Number(tier.quantity) || 120;
          const soldRatio = Math.min(0.96, 0.55 + ((numId + idx * 9) % 38) / 100);
          const tierSold = Math.floor(tierCap * soldRatio);
          ticketsSold += tierSold;
          const cleanPrice = typeof tier.price === 'number' ? tier.price : (Number(String(tier.price).replace(/,/g, '')) || 50000);
          const actualPrice = cleanPrice < 1000 && cleanPrice > 0 ? cleanPrice * 1000 : cleanPrice;
          grossRevenue += tierSold * actualPrice;
        });
      } else {
        const soldRatio = 0.76;
        ticketsSold = Math.floor(totalCapacity * soldRatio);
        const cleanPrice = typeof event.price === 'number' ? event.price : 120000;
        const actualPrice = cleanPrice < 1000 && cleanPrice > 0 ? cleanPrice * 1000 : cleanPrice;
        grossRevenue = ticketsSold * actualPrice;
      }
      if (ticketsSold === 0) ticketsSold = 45 + multiplier * 3;
      if (grossRevenue === 0) grossRevenue = ticketsSold * 120000;
    }

    const platformFeePercent = matchingPayout?.platformFeePercent ?? 10;
    const platformFeeAmount = matchingPayout?.platformFeeAmount ?? Math.round(grossRevenue * (platformFeePercent / 100));
    const moneyCanGet = matchingPayout?.payoutAmount ?? (grossRevenue - platformFeeAmount);
    const payoutStatus: 'paid' | 'pending' | 'ready' = matchingPayout?.status === 'paid' 
      ? 'paid' 
      : (matchingPayout?.status === 'pending' ? 'pending' : 'ready');

    return {
      ticketsSold,
      totalCapacity: Math.max(totalCapacity, ticketsSold),
      grossRevenue,
      platformFeePercent,
      platformFeeAmount,
      moneyCanGet,
      payoutStatus,
      payoutId: matchingPayout?.id
    };
  }, [realTickets, payoutsList]);

  // Pre-filter past events for tab & top metrics
  const filteredPastEvents = React.useMemo(() => {
    return eventsList.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const isPast = new Date(`${e.date}T23:59:59`) < new Date();
      const eventDate = new Date(e.date);
      const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
      const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
      return matchesSearch && isPast && matchesMonth && matchesYear;
    });
  }, [eventsList, searchQuery, filterMonth, filterYear]);

  // Aggregate statistics for past events (completed events)
  const pastEventsStats = React.useMemo(() => {
    let totalTickets = 0;
    let totalGrossRevenue = 0;
    let totalMoneyCanGet = 0;
    filteredPastEvents.forEach(e => {
      const fin = getEventFinancialSummary(e);
      totalTickets += fin.ticketsSold;
      totalGrossRevenue += fin.grossRevenue;
      totalMoneyCanGet += fin.moneyCanGet;
    });
    return {
      count: filteredPastEvents.length,
      totalTickets,
      totalGrossRevenue,
      totalMoneyCanGet
    };
  }, [filteredPastEvents, getEventFinancialSummary]);

  // Daily ticket sales trend for selected event inspection modal
  const selectedEventDailyTrend = React.useMemo(() => {
    if (!selectedEvent) return [];
    const days = 14;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daily = [];
    const evTickets = realTickets.filter(t => 
      t.event?.id === selectedEvent.id || 
      t.eventId === selectedEvent.id || 
      (t.event?.title && selectedEvent.title && t.event.title.trim().toLowerCase() === selectedEvent.title.trim().toLowerCase())
    );
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString(lang === "lo" ? "lo-LA" : "en-US", { month: "numeric", day: "numeric" });
      
      let count = 0;
      let rev = 0;
      evTickets.forEach(t => {
        if (t.purchaseDate && t.purchaseDate.startsWith(dateKey)) {
          const qty = Number(t.quantity) || 1;
          const price = Number(t.tier?.price) || Number(selectedEvent.price) || 0;
          count += qty;
          rev += qty * price;
        }
      });
      
      // If no tickets on that specific day, provide realistic curve based on financial summary
      if (evTickets.length === 0) {
        const numId = parseInt(String(selectedEvent.id).replace(/\D/g, ''), 10) || 42;
        const wave = Math.sin((i + numId) * 0.8) * 0.5 + 0.5;
        count = Math.max(1, Math.round(wave * 7 + ((numId + i * 3) % 4)));
        rev = count * 120000;
      }
      
      daily.push({
        date: dayLabel,
        fullDate: dateKey,
        tickets: count,
        revenue: rev
      });
    }
    return daily;
  }, [selectedEvent, realTickets, lang]);

  // Export currently visualized ticket sales data from the daily revenue chart into CSV
  const handleExportRevenueChartCSV = () => {
    if (!dailyRevenueTrendData || !dailyRevenueTrendData.length) return;

    setIsExportingRevenueChart(true);
    setTimeout(() => setIsExportingRevenueChart(false), 2000);

    const selectedEventObj = availableEventsForFilter.find(e => e.id === revenueEventFilter);
    const eventName = revenueEventFilter === 'all' 
      ? (lang === 'lo' ? 'ທຸກ Event' : 'All Events') 
      : (selectedEventObj?.title || revenueEventFilter);

    const headers = [
      lang === 'lo' ? 'ວັນທີ' : 'Date',
      lang === 'lo' ? 'ວັນທີເຕັມ' : 'Full Date',
      lang === 'lo' ? 'Event' : 'Event Filter',
      lang === 'lo' ? 'ຈຳນວນປີ້ທີ່ຂາຍໄດ້ (ໃບ)' : 'Tickets Sold',
      lang === 'lo' ? 'ລາຍຮັບ (LAK)' : 'Revenue (LAK)',
      lang === 'lo' ? 'ລາຄາສະເລ່ຍຕໍ່ປີ້ (LAK)' : 'Average Ticket Price (LAK)'
    ];

    const rows = [
      headers,
      ...dailyRevenueTrendData.map(item => {
        const avgPrice = item.tickets > 0 ? Math.round(item.revenue / item.tickets) : 0;
        return [
          item.date,
          item.fullDate,
          `"${(eventName || '').replace(/"/g, '""')}"`,
          item.tickets.toString(),
          item.revenue.toString(),
          avgPrice.toString()
        ];
      }),
      // Summary total row
      [
        lang === 'lo' ? 'ລວມທັງໝົດ' : 'TOTAL',
        `${lang === 'lo' ? 'ຍ້ອນຫຼັງ' : 'Last'} ${revenueTimeRange} ${lang === 'lo' ? 'ວັນ' : 'Days'}`,
        `"${(eventName || '').replace(/"/g, '""')}"`,
        revenueStats.currentTickets.toString(),
        revenueStats.currentRevenue.toString(),
        (revenueStats.currentTickets > 0 ? Math.round(revenueStats.currentRevenue / revenueStats.currentTickets) : 0).toString()
      ]
    ];

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const safeSlug = revenueEventFilter === 'all' 
      ? 'all_events' 
      : (selectedEventObj?.title ? (selectedEventObj.title || '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25) : 'event');
    const filename = `ticket_sales_revenue_${revenueTimeRange}d_${safeSlug}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const categoryDistributionData = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    // Process all events
    eventsList.concat(pendingEventsList).forEach(event => {
      const category = event.category || 'Other';
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category)! + 1);
      } else {
        categoryMap.set(category, 1);
      }
    });
    
    // Sort and convert to array
    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
      
    return sortedCategories;
  }, [eventsList, pendingEventsList]);

  const PIE_COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];


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
    <div className="min-h-screen flex bg-[#F9FAFB] print:bg-white overflow-hidden">
      <SEO
        title={t.adminDashboard || 'Admin Console | Pasopkan'}
        description="Administrative management panel for Pasopkan event ticketing system."
        noindex={true}
      />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0 z-20 print:hidden shadow-sm">
        <div className="p-6 pb-4 flex flex-col gap-4 border-b border-gray-50">
          <Link to="/" className="flex items-center justify-center hover:opacity-80 transition-opacity py-1">
            <img 
              src="/pasopkan_logo.png" 
              alt="Pasopkan Logo" 
              className="h-20 sm:h-24 lg:h-28 w-auto max-w-full object-contain transition-transform duration-300 hover:scale-[1.03]" 
              referrerPolicy="no-referrer" 
            />
          </Link>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold leading-none">{t.adminDashboard}</span>
            <button onClick={toggleLanguage} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 transition-colors">
              {lang === 'lo' ? 'EN' : 'ລາວ'}
            </button>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
<button
               onClick={() => setActiveTab('overview')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'approvals' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'approvals' ? 'text-white' : 'text-gray-400'}`} />
              {t.pendingApprovals}
            </button>
            
            <button
               onClick={() => setActiveTab('users')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'users' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : 'text-gray-400'}`} />
              <span>{t.manageUsers}</span>
            </button>

            <button
               onClick={() => setActiveTab('organizers')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'organizers' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Building2 className={`w-4 h-4 ${activeTab === 'organizers' ? 'text-white' : 'text-gray-400'}`} />
              <span>{t.manageOrganizers}</span>
            </button>
            
            <button
               onClick={() => setActiveTab('events')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'events' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'events' ? 'text-white' : 'text-gray-400'}`} />
              <span>{lang === 'lo' ? 'Event ທົ່ວໄປ (Event Type)' : 'Event Type (Standard)'}</span>
            </button>
            
            <button
               onClick={() => setActiveTab('bookings')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'bookings' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <CalendarDays className={`w-4 h-4 ${activeTab === 'bookings' ? 'text-white' : 'text-gray-400'}`} />
              <span>{lang === 'lo' ? 'ກິດຈະກຳຈອງ (Booking Type)' : 'Booking Type (Daily)'}</span>
            </button>
            
            <button
               onClick={() => setActiveTab('past-events')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'payouts' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <DollarSign className={`w-4 h-4 ${activeTab === 'payouts' ? 'text-white' : 'text-gray-400'}`} />
              {t.payouts}
            </button>

            <button
               onClick={() => setActiveTab('refunds')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'refunds' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <RotateCcw className={`w-4 h-4 ${activeTab === 'refunds' ? 'text-white' : 'text-gray-400'}`} />
              <span>{t.refunds || (lang === 'lo' ? 'ການຄືນເງິນ' : 'Refunds')}</span>
            </button>

            <button
               onClick={() => setActiveTab('activity-log')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'site-settings' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'site-settings' ? 'text-white' : 'text-gray-400'}`} />
              {lang === 'lo' ? 'ຕັ້ງຄ່າເວັບໄຊ' : 'Site Settings'}
            </button>

            <button
               onClick={() => setActiveTab('blogs')}
               className={`flex items-center gap-3 px-4 py-3 w-full justify-start rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'blogs' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'blogs' ? 'text-white' : 'text-gray-400'}`} />
              {lang === 'lo' ? 'ຈັດການບົດຄວາມ' : 'Blog Articles'}
            </button>
        </div>
        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
           <Link to="/account" className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors">
              <div className="w-8 h-8 rounded-full bg-adv-orange/10 text-adv-orange flex items-center justify-center">
                 <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-adv-slate">Admin</span>
           </Link>
           <button onClick={handleAdminLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title={lang === 'lo' ? 'ອອກຈາກລະບົບແອັດມິນ' : 'Exit Admin Panel'}>
              <LogOut className="w-4 h-4" />
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
         {/* Mobile Header */}
         <div className="lg:hidden flex flex-col gap-4 p-4 bg-white border-b border-gray-100 sticky top-0 z-30">
            <div className="flex items-center justify-between">
               <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                 <img 
                   src="/pasopkan_logo.png" 
                   alt="Pasopkan Logo" 
                   className="h-14 sm:h-18 w-auto object-contain transition-transform duration-300 hover:scale-[1.03]" 
                   referrerPolicy="no-referrer" 
                 />
               </Link>
               <button onClick={toggleLanguage} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 transition-colors">
                 {lang === 'lo' ? 'EN' : 'ລາວ'}
               </button>
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
<button
               onClick={() => setActiveTab('overview')}
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'approvals' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'approvals' ? 'text-white' : 'text-gray-400'}`} />
              {t.pendingApprovals}
            </button>
            
            <button
               onClick={() => setActiveTab('users')}
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'users' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : 'text-gray-400'}`} />
              <span>{t.manageUsers}</span>
            </button>
            
            <button
               onClick={() => setActiveTab('organizers')}
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'organizers' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Building2 className={`w-4 h-4 ${activeTab === 'organizers' ? 'text-white' : 'text-gray-400'}`} />
              <span>{t.manageOrganizers}</span>
            </button>
            
            <button
               onClick={() => setActiveTab('events')}
               className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'events' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'events' ? 'text-white' : 'text-gray-400'}`} />
              <span>{lang === 'lo' ? 'Event ທົ່ວໄປ' : 'Event Type'}</span>
            </button>
            
            <button
               onClick={() => setActiveTab('bookings')}
               className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'bookings' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <CalendarDays className={`w-4 h-4 ${activeTab === 'bookings' ? 'text-white' : 'text-gray-400'}`} />
              <span>{lang === 'lo' ? 'ກິດຈະກຳຈອງ' : 'Booking Type'}</span>
            </button>
            
            <button
               onClick={() => setActiveTab('past-events')}
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'payouts' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <DollarSign className={`w-4 h-4 ${activeTab === 'payouts' ? 'text-white' : 'text-gray-400'}`} />
              {t.payouts}
            </button>

            <button
               onClick={() => setActiveTab('refunds')}
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'refunds' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <RotateCcw className={`w-4 h-4 ${activeTab === 'refunds' ? 'text-white' : 'text-gray-400'}`} />
              <span>{t.refunds || (lang === 'lo' ? 'ການຄືນເງິນ' : 'Refunds')}</span>
            </button>

            <button
               onClick={() => setActiveTab('activity-log')}
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'site-settings' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'site-settings' ? 'text-white' : 'text-gray-400'}`} />
              {lang === 'lo' ? 'ຕັ້ງຄ່າເວັບໄຊ' : 'Site Settings'}
            </button>

            <button
               onClick={() => setActiveTab('blogs')}
               className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                 activeTab === 'blogs' 
                   ? 'bg-adv-orange text-white shadow-lg shadow-orange-100' 
                   : 'text-gray-500 bg-white border border-gray-100 hover:border-adv-orange/30'
               }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'blogs' ? 'text-white' : 'text-gray-400'}`} />
              {lang === 'lo' ? 'ຈັດການບົດຄວາມ' : 'Blog Articles'}
            </button>
            </div>
         </div>
         
         {/* Page Content */}
         <div className="p-4 sm:p-6 lg:p-10 flex-1 max-w-[1600px] w-full mx-auto">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 lg:p-8 min-h-[600px] shadow-sm print:border-none print:shadow-none print:p-0">
              
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-50 gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-adv-slate capitalize tracking-tight">
                    {activeTab === 'overview' ? t.overview : 
                     activeTab === 'approvals' ? t.pendingApprovals : 
                     activeTab === 'users' ? t.manageUsers : 
                     activeTab === 'organizers' ? t.manageOrganizers : 
                     activeTab === 'events' ? (lang === 'lo' ? 'Event ທົ່ວໄປ (Event Type)' : 'Upcoming Events (Event Type)') : 
                     activeTab === 'bookings' ? (lang === 'lo' ? 'ກິດຈະກຳຈອງ (Booking Type)' : 'Booking Experiences (Booking Type)') : 
                     activeTab === 'past-events' ? t.eventAlreadyDone :
                     activeTab === 'payouts' ? t.payouts :
                     activeTab === 'refunds' ? (t.manageRefunds || (lang === 'lo' ? 'ຈັດການການຄືນເງິນ' : 'Refund Management')) :
                     activeTab === 'activity-log' ? 'Activity Log' :
                     activeTab === 'notifications' ? t.notifications :
                     activeTab === 'site-settings' ? (lang === 'lo' ? 'ຕັ້ງຄ່າເວັບໄຊ' : 'Site Settings') :
                     activeTab === 'blogs' ? (lang === 'lo' ? 'ຈັດການບົດຄວາມ' : 'Blog Management') :
                     t.eventAlreadyDone}
                  </h2>
                  {activeTab === 'overview' && (
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-widest">
                      {new Date().toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {(activeTab === 'overview' || activeTab === 'events' || activeTab === 'bookings' || activeTab === 'past-events') && (
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
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-adv-orange text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 print:hidden"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lang === 'lo' ? 'ສົ່ງອອກ CSV' : 'Export CSV'}
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-adv-slate text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-adv-slate/10 print:hidden"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        {t.printReport}
                      </button>
                    </div>
                  )}
                  {['users', 'organizers', 'events', 'bookings', 'past-events', 'approvals', 'payouts', 'activity-log'].includes(activeTab) && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setIsLoading(true);
                          syncFromStorage();
                          setTimeout(() => setIsLoading(false), 500);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-adv-slate border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:border-adv-orange hover:text-adv-orange transition-all shadow-sm print:hidden"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        {lang === 'lo' ? 'ຣີເຟຣຊ' : 'Sync'}
                      </button>
                      {activeTab !== 'approvals' && (
                        <button 
                          onClick={handleExportData}
                          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 print:hidden"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {lang === 'lo' ? 'ສົ່ງອອກ CSV' : 'Export CSV'}
                        </button>
                      )}
                    </div>
                  )}
                  {activeTab !== 'site-settings' && activeTab !== 'blogs' && activeTab !== 'approvals' && (
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
                    {/* KPI Card 1: Total Revenue */}
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group hover:shadow-md hover:border-orange-200 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.totalRevenue}</h3>
                      <div className="text-2xl sm:text-3xl font-black text-adv-slate mb-1.5 tracking-tight">
                        {new Intl.NumberFormat('lo-LA').format(grossRevenue)} ₭
                      </div>
                      <div className={`text-xs font-bold flex items-center gap-1.5 ${revenueStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {revenueStats.revenueGrowth >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {revenueStats.revenueGrowth >= 0 ? '+' : ''}{revenueStats.revenueGrowth.toFixed(1)}% {lang === 'lo' ? 'ທຽບກັບໄລຍະຜ່ານມາ' : 'vs previous period'}
                        </span>
                      </div>
                    </div>
                    
                    {/* KPI Card 2: Total Registrations */}
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group hover:shadow-md hover:border-orange-200 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ticket className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.totalRegistrations}</h3>
                      <div className="text-2xl sm:text-3xl font-black text-adv-slate mb-1.5 tracking-tight">
                        {totalTicketsCount.toLocaleString('en-US')}
                      </div>
                      <div className={`text-xs font-bold flex items-center gap-1.5 ${revenueStats.ticketGrowth >= 0 ? 'text-adv-orange' : 'text-red-500'}`}>
                        {revenueStats.ticketGrowth >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {revenueStats.ticketGrowth >= 0 ? '+' : ''}{revenueStats.ticketGrowth.toFixed(1)}% {lang === 'lo' ? 'ທຽບກັບໄລຍະຜ່ານມາ' : 'vs previous period'}
                        </span>
                      </div>
                    </div>

                    {/* KPI Card 3: Active Events */}
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group hover:shadow-md hover:border-orange-200 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.activeEvents}</h3>
                      <div className="text-2xl sm:text-3xl font-black text-adv-slate mb-1.5 tracking-tight">
                        {activeEventsCount}
                      </div>
                      <div className="text-adv-orange text-xs font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{eventsList.length} {lang === 'lo' ? 'event ທັງໝົດໃນລະບົບ' : 'total events listed'}</span>
                      </div>
                    </div>

                    {/* KPI Card 4: Total Profit */}
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group hover:shadow-md hover:border-orange-200 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-adv-orange" />
                      </div>
                      <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">{t.totalProfit}</h3>
                      <div className="text-2xl sm:text-3xl font-black text-adv-slate mb-1.5 tracking-tight">
                        {new Intl.NumberFormat('lo-LA').format(filteredPayouts.reduce((sum, p) => sum + p.platformFeeAmount, 0) || Math.round(grossRevenue * 0.1))} ₭
                      </div>
                      <div className="text-adv-orange text-xs font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+12.5% {lang === 'lo' ? 'ທຽບກັບເດືອນກ່ອນ' : 'from last month'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Dedicated Daily Ticket Sales Trends Line Chart */}
                    <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                      {/* Chart Header & Controls */}
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-black text-adv-slate flex items-center gap-2">
                              <span className="p-1.5 bg-orange-50 text-adv-orange rounded-xl inline-flex items-center justify-center">
                                <Ticket className="w-4 h-4 text-adv-orange" />
                              </span>
                              {t.dailyTicketSalesTrends || t.dailyRevenueTrends}
                            </h3>
                            <p className="text-xs text-gray-400 font-semibold mt-1">
                              {t.dailyTicketSalesTrendsDesc || t.dailyRevenueTrendsDesc}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Time Range Pills */}
                            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                              {(['7', '14', '30', '90'] as const).map((range) => (
                                <button
                                  key={range}
                                  onClick={() => setRevenueTimeRange(range)}
                                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                                    revenueTimeRange === range
                                      ? 'bg-adv-orange text-white shadow-sm'
                                      : 'text-gray-500 hover:text-adv-slate'
                                  }`}
                                >
                                  {range}D
                                </button>
                              ))}
                            </div>

                            {/* Export Chart CSV Button */}
                            <button
                              id="export-revenue-chart-csv-btn"
                              onClick={handleExportRevenueChartCSV}
                              title={lang === 'lo' ? 'ສົ່ງອອກຂໍ້ມູນກຣາຟນີ້ເປັນ CSV' : 'Export current chart ticket sales data to CSV'}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm group shrink-0 border ${
                                isExportingRevenueChart
                                  ? 'bg-green-50 border-green-200 text-green-700'
                                  : 'bg-orange-50/80 hover:bg-adv-orange text-adv-orange hover:text-white border-orange-200/80'
                              }`}
                            >
                              {isExportingRevenueChart ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  <span className="hidden sm:inline text-green-700">{lang === 'lo' ? 'ດາວໂຫຼດແລ້ວ' : 'Exported!'}</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
                                  <span className="hidden sm:inline">{t.exportChartCSV}</span>
                                  <span className="sm:hidden">CSV</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Secondary Filters Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100">
                          {/* Event Dropdown Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.filterByEvent}:</span>
                            <select
                              value={revenueEventFilter}
                              onChange={(e) => setRevenueEventFilter(e.target.value)}
                              className="bg-gray-50 border border-gray-200 text-adv-slate text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-adv-orange max-w-[200px] truncate"
                            >
                              <option value="all">{t.allEvents}</option>
                              {availableEventsForFilter.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                              ))}
                            </select>
                          </div>

                          {/* Metric Toggle Buttons */}
                          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-100 text-xs font-bold">
                            <button
                              onClick={() => setRevenueMetricMode('tickets')}
                              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                                revenueMetricMode === 'tickets'
                                  ? 'bg-white text-adv-orange shadow-sm font-black'
                                  : 'text-gray-400 hover:text-adv-slate'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-adv-orange inline-block" />
                              {t.ticketsOnly}
                            </button>
                            <button
                              onClick={() => setRevenueMetricMode('combined')}
                              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                                revenueMetricMode === 'combined'
                                  ? 'bg-white text-adv-slate shadow-sm font-black'
                                  : 'text-gray-400 hover:text-adv-slate'
                              }`}
                            >
                              <Layers className="w-3 h-3 text-blue-500" />
                              {t.combinedView}
                            </button>
                            <button
                              onClick={() => setRevenueMetricMode('revenue')}
                              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                                revenueMetricMode === 'revenue'
                                  ? 'bg-white text-emerald-600 shadow-sm font-black'
                                  : 'text-gray-400 hover:text-adv-slate'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                              {t.revenueOnly}
                            </button>
                          </div>
                        </div>

                        {/* Highlight Metrics Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-orange-50/20 border border-orange-100/60">
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {revenueMetricMode === 'tickets' ? (lang === 'lo' ? 'ປີ້ທີ່ຂາຍທັງໝົດ' : 'Total Tickets Sold') : t.periodRevenue}
                            </div>
                            <div className={`text-sm font-black mt-0.5 truncate ${revenueMetricMode === 'tickets' ? 'text-adv-orange' : 'text-adv-slate'}`}>
                              {revenueMetricMode === 'tickets' 
                                ? `${revenueStats.currentTickets.toLocaleString()} ${lang === 'lo' ? 'ໃບ' : 'tix'}`
                                : `${new Intl.NumberFormat('lo-LA').format(revenueStats.currentRevenue)} ₭`}
                            </div>
                            {revenueMetricMode === 'tickets' && (
                              <div className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
                                <TrendingUp className="w-3 h-3" />
                                <span>+{revenueStats.ticketGrowth.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {revenueMetricMode === 'tickets' ? (lang === 'lo' ? 'ສະເລ່ຍປີ້ຕໍ່ວັນ' : 'Avg Tickets / Day') : t.dailyAverage}
                            </div>
                            <div className="text-sm font-black text-adv-slate mt-0.5 truncate">
                              {revenueMetricMode === 'tickets'
                                ? `${revenueStats.dailyAverageTickets.toFixed(1)} ${lang === 'lo' ? 'ໃບ/ວັນ' : 'tix/day'}`
                                : `${new Intl.NumberFormat('lo-LA').format(revenueStats.dailyAverage)} ₭`}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {revenueMetricMode === 'tickets' ? (lang === 'lo' ? 'ວັນຂາຍດີສຸດ' : 'Peak Ticket Day') : t.peakDay}
                            </div>
                            <div className="text-sm font-black text-adv-orange mt-0.5 truncate">
                              {revenueMetricMode === 'tickets'
                                ? `${revenueStats.peakTickets} ${lang === 'lo' ? 'ໃບ' : 'tix'}`
                                : `${new Intl.NumberFormat('lo-LA').format(revenueStats.peakRevenue)} ₭`}
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold truncate">
                              {revenueMetricMode === 'tickets' ? revenueStats.peakTicketsDate : revenueStats.peakDate}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {revenueMetricMode === 'tickets' ? (lang === 'lo' ? 'ລາຍຮັບໃນຊ່ວງນີ້' : 'Period Revenue') : t.tickets}
                            </div>
                            <div className="text-sm font-black text-blue-600 mt-0.5 truncate">
                              {revenueMetricMode === 'tickets'
                                ? `${new Intl.NumberFormat('lo-LA').format(revenueStats.currentRevenue)} ₭`
                                : `${revenueStats.currentTickets.toLocaleString()} ${lang === 'lo' ? 'ໃບ' : 'tix'}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recharts Canvas */}
                      <div className="h-80 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={dailyRevenueTrendData}
                            margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
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
                            {/* Primary YAxis for Revenue */}
                            {(revenueMetricMode === 'combined' || revenueMetricMode === 'revenue') && (
                              <YAxis 
                                yAxisId="revenue"
                                stroke="#9CA3AF" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => {
                                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                                  return `${val}`;
                                }}
                              />
                            )}
                            {/* YAxis for Tickets */}
                            {revenueMetricMode === 'tickets' && (
                              <YAxis 
                                yAxisId="tickets"
                                stroke="#9CA3AF" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                allowDecimals={false}
                                tickFormatter={(val) => `${val}`}
                              />
                            )}
                            {revenueMetricMode === 'combined' && (
                              <YAxis 
                                yAxisId="tickets"
                                orientation="right"
                                stroke="#9CA3AF" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                allowDecimals={false}
                                tickFormatter={(val) => `${val}`}
                              />
                            )}
                            {revenueMetricMode === 'tickets' && (
                              <ReferenceLine 
                                yAxisId="tickets" 
                                y={Math.round(revenueStats.dailyAverageTickets)} 
                                stroke="#FDBA74" 
                                strokeDasharray="3 3" 
                                strokeWidth={1.5}
                                label={{ 
                                  value: `Avg: ${Math.round(revenueStats.dailyAverageTickets)}`, 
                                  position: 'insideTopRight', 
                                  fill: '#EA580C', 
                                  fontSize: 10,
                                  fontWeight: 'bold' 
                                }} 
                              />
                            )}
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl p-4 shadow-2xl text-white min-w-[210px]">
                                      <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-2.5">
                                        <span className="text-xs font-black text-orange-400">{data.date}</span>
                                        <span className="text-[10px] font-bold text-gray-400">{data.fullDate}</span>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-adv-orange inline-block" />
                                            <span className="text-xs text-gray-300 font-semibold">{t.tickets}:</span>
                                          </div>
                                          <span className="text-xs font-black text-orange-400">
                                            {data.tickets} {lang === 'lo' ? 'ໃບ' : 'tickets'}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                            <span className="text-xs text-gray-300 font-semibold">{t.revenue}:</span>
                                          </div>
                                          <span className="text-xs font-black text-white">
                                            {new Intl.NumberFormat('lo-LA').format(data.revenue)} ₭
                                          </span>
                                        </div>

                                        {data.tickets > 0 && (
                                          <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                                            <span>{lang === 'lo' ? 'ສະເລ່ຍຕໍ່ປີ້' : 'Avg / ticket'}:</span>
                                            <span className="font-bold text-gray-300">
                                              {new Intl.NumberFormat('lo-LA').format(Math.round(data.revenue / data.tickets))} ₭
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            {(revenueMetricMode === 'combined' || revenueMetricMode === 'revenue') && (
                              <Line 
                                yAxisId="revenue"
                                name={t.revenue}
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#10B981" 
                                strokeWidth={2.5}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                                dot={{ r: 3, strokeWidth: 2, fill: '#ffffff', stroke: '#10B981' }}
                              />
                            )}
                            {revenueMetricMode === 'tickets' && (
                              <Line 
                                yAxisId="tickets"
                                name={t.tickets}
                                type="monotone" 
                                dataKey="tickets" 
                                stroke="#FF5B00" 
                                strokeWidth={3}
                                activeDot={{ r: 6, strokeWidth: 2, fill: '#FF5B00', stroke: '#ffffff' }}
                                dot={{ r: 3.5, strokeWidth: 2, fill: '#ffffff', stroke: '#FF5B00' }}
                              />
                            )}
                            {revenueMetricMode === 'combined' && (
                              <Line 
                                yAxisId="tickets"
                                name={t.tickets}
                                type="monotone" 
                                dataKey="tickets" 
                                stroke="#FF5B00" 
                                strokeWidth={2.5}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#FF5B00' }}
                                dot={{ r: 3, strokeWidth: 2, fill: '#ffffff', stroke: '#FF5B00' }}
                              />
                            )}
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

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Category Distribution Pie Chart */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black text-adv-slate flex items-center gap-2">
                          <span className="p-1 bg-blue-50 text-blue-500 rounded-lg">📊</span>
                          Category Distribution
                        </h3>
                      </div>
                      
                      <div className="flex-1 w-full flex items-center justify-center relative">
                        {categoryDistributionData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {categoryDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  background: '#222222',
                                  border: 'none',
                                  borderRadius: '12px',
                                  color: '#ffffff',
                                  padding: '8px 12px'
                                }}
                                itemStyle={{
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  color: '#ffffff'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-sm font-bold text-gray-400">No data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Event Categories Legend */}
                    <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[350px] overflow-hidden flex flex-col">
                      <h3 className="text-base font-black text-adv-slate flex items-center gap-2 mb-6">
                        <span className="p-1 bg-green-50 text-green-500 rounded-lg">🏷️</span>
                        Event Categories Overview
                      </h3>
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
                          {categoryDistributionData.map((category, index) => (
                            <div key={category.name} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200 transition-colors shadow-sm">
                              <div className="flex items-center gap-3">
                                <span 
                                  className="w-3 h-3 rounded-full shrink-0" 
                                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                                />
                                <span className="text-xs font-bold text-adv-slate truncate max-w-[120px]" title={category.name}>{category.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-400">{category.value} {lang === 'lo' ? 'ງານ' : 'events'}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-gray-100 text-gray-500">
                                  {Math.round((category.value / Math.max(1, eventsList.length + pendingEventsList.length)) * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
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
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{usersList.filter(u => u.role !== 'organizer').length} {t.totalUsers}</div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('organizers')}
                          className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-adv-orange/30 hover:bg-orange-50 transition-all group text-left shadow-sm"
                        >
                          <Building2 className="w-6 h-6 text-gray-300 group-hover:text-adv-orange mb-3 transition-colors" />
                          <div className="font-bold text-adv-slate mb-1">{t.manageOrganizers}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{usersList.filter(u => u.role === 'organizer').length} {t.organizers}</div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('events')}
                          className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-adv-orange/30 hover:bg-orange-50 transition-all group text-left shadow-sm"
                        >
                          <Calendar className="w-6 h-6 text-gray-300 group-hover:text-adv-orange mb-3 transition-colors" />
                          <div className="font-bold text-adv-slate mb-1">{lang === 'lo' ? 'Event ທົ່ວໄປ (Event Type)' : 'Event Type (Standard)'}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{eventsList.filter(e => e.dateType !== 'booking' && new Date(`${e.date}T23:59:59`) >= new Date()).length} {t.activeEvents}</div>
                        </button>
                        <button 
                          onClick={() => setActiveTab('bookings')}
                          className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-adv-orange/30 hover:bg-orange-50 transition-all group text-left shadow-sm"
                        >
                          <CalendarDays className="w-6 h-6 text-gray-300 group-hover:text-adv-orange mb-3 transition-colors" />
                          <div className="font-bold text-adv-slate mb-1">{lang === 'lo' ? 'ກິດຈະກຳຈອງ (Booking Type)' : 'Booking Type (Daily)'}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{eventsList.filter(e => e.dateType === 'booking').length} {lang === 'lo' ? 'ກິດຈະກຳ' : 'Experiences'}</div>
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

              {activeTab === 'approvals' && (() => {
                const filteredPending = [...pendingEventsList].sort((a, b) => {
                  return (b.submittedAt || '').localeCompare(a.submittedAt || '');
                });

                const urgentPendingCount = pendingEventsList.filter(e => {
                  if (!e.date) return false;
                  const diffDays = Math.ceil((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays >= 0 && diffDays <= 14;
                }).length;

                return (
                  <div className="space-y-6">
                    {/* Header Title & Description */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-black text-adv-slate tracking-tight">
                            {t.pendingApprovalsTitle}
                          </h2>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                          {t.pendingApprovalsDesc}
                        </p>
                      </div>
                    </div>

                    {/* Pending Approvals Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 flex items-center gap-4 group shadow-xs transition-all hover:bg-amber-50/70">
                        <div className="w-13 h-13 rounded-2xl bg-white flex items-center justify-center text-amber-600 shrink-0 shadow-xs border border-amber-100 group-hover:scale-105 transition-transform">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-adv-slate leading-none mb-1">
                            {pendingEventsList.length}
                          </div>
                          <div className="text-[10px] text-amber-800 uppercase tracking-widest font-black">
                            {lang === 'lo' ? 'ລໍຖ້າການອະນຸມັດ' : 'Pending Review'}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {lang === 'lo' ? 'ກວດສອບກ່ອນເປີດຂາຍ' : 'Awaiting admin decision'}
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50/40 p-5 rounded-2xl border border-red-100 flex items-center gap-4 group shadow-xs transition-all hover:bg-red-50/70">
                        <div className="w-13 h-13 rounded-2xl bg-white flex items-center justify-center text-red-500 shrink-0 shadow-xs border border-red-100 group-hover:scale-105 transition-transform">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-adv-slate leading-none mb-1">
                            {urgentPendingCount}
                          </div>
                          <div className="text-[10px] text-red-700 uppercase tracking-widest font-black">
                            {lang === 'lo' ? 'ວັນງານໃກ້ເຂົ້າມາ (<14 ມື້)' : 'Urgent Timeline'}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {lang === 'lo' ? 'ຕ້ອງການກວດສອບດ່ວນ' : 'Needs prompt attention'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EMPTY STATE */}
                    {filteredPending.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-xs">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 text-emerald-600">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-adv-slate mb-1">
                          {t.noPendingEvents}
                        </h3>
                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                          {t.everythingUpToDate}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* CARDS VIEW */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {filteredPending.map(event => {
                              const eventDate = event.date ? new Date(event.date) : null;
                              const isDateValid = eventDate && !isNaN(eventDate.getTime());
                              const diffDays = isDateValid ? Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                              const isUrgent = diffDays !== null && diffDays >= 0 && diffDays <= 14;

                              const totalCapacity = event.ticketTiers
                                ? event.ticketTiers.reduce((acc: number, tier: any) => acc + (Number(tier.available) || 0), 0)
                                : 0;

                              return (
                                <div
                                  key={event.id}
                                  className="rounded-3xl bg-white border border-gray-200/90 hover:border-gray-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden group"
                                >
                                  {/* Top Header with Visual Cover & Key Badges */}
                                  <div className="p-5 pb-0">
                                    <div className="flex items-start gap-4">
                                      {/* Thumbnail */}
                                      {(() => {
                                        const eventMainImg = getEventMainImage(event);
                                        return (
                                          <div 
                                            onClick={() => setFullscreenImage(eventMainImg)}
                                            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 cursor-pointer group/img border border-gray-100 shadow-xs bg-slate-100"
                                            title={lang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງຮູບຂະໜາດເຕັມ' : 'Click to inspect full image'}
                                          >
                                            <img
                                              src={eventMainImg}
                                              alt={event.title}
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop';
                                              }}
                                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover/img:bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                              <Eye className="w-5 h-5 text-white" />
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      {/* Event Meta Header */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                          {event.dateType === 'booking' ? (
                                            <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 text-adv-orange text-[10px] font-black uppercase tracking-wider border border-orange-200 flex items-center gap-1">
                                              <CalendarDays className="w-3 h-3" />
                                              {lang === 'lo' ? 'ກິດຈະກຳຈອງ (Booking)' : 'Booking Type'}
                                            </span>
                                          ) : (
                                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              {lang === 'lo' ? 'Event ທົ່ວໄປ' : 'Event Type'}
                                            </span>
                                          )}
                                          <span className="px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-wider border border-gray-200">
                                            {event.category || 'Event'}
                                          </span>
                                          {isUrgent && (
                                            <span className="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider border border-red-100 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              {diffDays} {t.daysUntilEvent}
                                            </span>
                                          )}
                                          <span className="text-[11px] text-gray-400 font-medium ml-auto">
                                            {t.submittedOn}: {event.submittedAt || 'Recent'}
                                          </span>
                                        </div>

                                        <h3 className="text-lg font-black text-adv-slate leading-snug group-hover:text-adv-orange transition-colors line-clamp-1">
                                          {event.title}
                                        </h3>

                                        <div className="flex flex-col gap-1 mt-2 text-xs text-gray-600 font-medium">
                                          <div className="flex items-center gap-1.5 text-gray-700">
                                            <Calendar className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                                            <span>
                                              {isDateValid
                                                ? eventDate.toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                  })
                                                : (event.date || 'Flexible')}
                                              {event.time && ` • ${event.time}`}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-gray-500 truncate" title={event.venue || event.location}>
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{event.venue ? `${event.venue}, ${event.location}` : event.location}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Mid Section: Organizer & Banking Dossier */}
                                  <div className="p-5 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {/* Organizer Info Box */}
                                      <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between">
                                        <div>
                                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5">
                                            <Building2 className="w-3 h-3 text-adv-orange" />
                                            {t.organizer}
                                          </div>
                                          <div className="font-bold text-xs text-adv-slate truncate" title={event.organizer}>
                                            {event.organizer}
                                          </div>
                                          {event.organizerInfo?.contact && (
                                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                              <span>{event.organizerInfo.contact}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Bank & Payout Box */}
                                      <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between">
                                        <div>
                                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5">
                                            <CreditCard className="w-3 h-3 text-emerald-600" />
                                            {t.payoutInfo}
                                          </div>
                                          <div className="font-bold text-xs text-adv-slate">
                                            {event.paymentInfo?.bankName || 'Direct Transfer'}
                                          </div>
                                          <div className="text-[11px] text-gray-500 truncate mt-0.5">
                                            {event.paymentInfo?.accountName || 'Account details pending'}
                                          </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-gray-200/60 text-[11px] text-gray-600 font-mono">
                                          <span>{event.paymentInfo?.accountNumber || '—'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Ticket Tiers & Capacity Overview */}
                                    <div className="p-3 rounded-2xl bg-amber-50/30 border border-amber-100/60 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Ticket className="w-4 h-4 text-adv-orange shrink-0" />
                                        <div>
                                          <span className="text-xs font-bold text-adv-slate">
                                            {event.price || (event.ticketTiers && event.ticketTiers[0]?.price ? `${Number(event.ticketTiers[0].price).toLocaleString()} ₭` : 'Free')}
                                          </span>
                                          {event.ticketTiers && event.ticketTiers.length > 1 && (
                                            <span className="text-[10px] text-gray-500 ml-1">
                                              ({event.ticketTiers.length} {lang === 'lo' ? 'ປະເພດປີ້' : 'tiers'})
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <div className="text-xs font-black text-adv-slate">
                                          {totalCapacity > 0 ? `${totalCapacity.toLocaleString()} ${lang === 'lo' ? 'ປີ້' : 'tickets'}` : (lang === 'lo' ? 'ບໍ່ຈຳກັດ' : 'Unlimited')}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-semibold uppercase">
                                          {t.capacityTotal}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bottom Action Controls */}
                                  <div className="p-4 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setSelectedEvent(event)}
                                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-adv-orange text-xs font-black uppercase tracking-wider transition-all border border-orange-200/60 shadow-2xs cursor-pointer"
                                        title={lang === 'lo' ? 'ເບິ່ງຕົວຢ່າງ Event' : 'View Event Preview'}
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span>{lang === 'lo' ? 'ເບິ່ງຕົວຢ່າງ' : 'View Preview'}</span>
                                      </button>
                                      <a
                                        href={`/event/${event.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-adv-slate hover:border-gray-300 transition-all shadow-2xs inline-flex items-center justify-center"
                                        title={lang === 'lo' ? 'ເປີດໜ້າ Event ຕົວຈິງ' : 'Open live event page'}
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedEvent(event);
                                          setShowRejectionModal(true);
                                        }}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        <span>{t.reject}</span>
                                      </button>

                                      <button
                                        onClick={() => handleApprove(event.id)}
                                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-200/50"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{t.approve}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                    {/* RECENT DECISIONS AUDIT HISTORY (If any decision made in session) */}
                    {approvalDecisionHistory.length > 0 && (
                      <div className="mt-8 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-black uppercase tracking-wider text-adv-slate flex items-center gap-2">
                            <Activity className="w-4 h-4 text-adv-orange" />
                            {t.recentlyReviewed}
                          </h4>
                          <span className="text-xs text-gray-400 font-bold">
                            {approvalDecisionHistory.length} {lang === 'lo' ? 'ການຕັດສິນໃຈ' : 'decisions'}
                          </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {approvalDecisionHistory.map((item, idx) => (
                            <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-3">
                                {item.decision === 'approved' ? (
                                  <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </span>
                                ) : (
                                  <span className="p-1 rounded-lg bg-red-50 text-red-600">
                                    <XCircle className="w-4 h-4" />
                                  </span>
                                )}
                                <div>
                                  <span className="font-bold text-adv-slate">{item.title}</span>
                                  {item.reason && (
                                    <p className="text-[11px] text-gray-500 mt-0.5">Reason: {item.reason}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  item.decision === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {item.decision}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* USERS TAB (REGULAR ATTENDEES & ADMINS) */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  {/* Users Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-orange-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-adv-orange shrink-0 shadow-sm border border-orange-50 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">
                          {usersList.filter(u => u.role !== 'organizer').length}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.totalUsers}</div>
                      </div>
                    </div>
                    <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-emerald-50/60">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-50 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">
                          {usersList.filter(u => u.role !== 'organizer' && u.status === 'active').length}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.activeUsers}</div>
                      </div>
                    </div>
                    <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-red-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-red-50 group-hover:scale-110 transition-transform">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">
                          {usersList.filter(u => u.role !== 'organizer' && u.status === 'suspended').length}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.suspendedUsers}</div>
                      </div>
                    </div>
                  </div>

                  {/* Users Filter & Search Bar */}
                  <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchUsersPlaceholder || (lang === 'lo' ? 'ຄົ້ນຫາຜູ້ໃຊ້...' : 'Search users...')}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-adv-slate font-medium focus:outline-none focus:border-adv-orange/40 transition-colors shadow-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-adv-slate"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Role Filter */}
                      <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-bold">
                        <button
                          onClick={() => setUserRoleFilter('all')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${userRoleFilter === 'all' ? 'bg-adv-slate text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                        >
                          {lang === 'lo' ? 'ທຸກສິດ' : 'All Roles'}
                        </button>
                        <button
                          onClick={() => setUserRoleFilter('user')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${userRoleFilter === 'user' ? 'bg-adv-slate text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                        >
                          {lang === 'lo' ? 'ຜູ້ໃຊ້' : 'Users'}
                        </button>
                        <button
                          onClick={() => setUserRoleFilter('admin')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${userRoleFilter === 'admin' ? 'bg-adv-slate text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                        >
                          {lang === 'lo' ? 'ແອັດມິນ' : 'Admins'}
                        </button>
                      </div>

                      {/* Status Filter */}
                      <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-bold">
                        <button
                          onClick={() => setUserStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${userStatusFilter === 'all' ? 'bg-adv-orange text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                        >
                          {lang === 'lo' ? 'ທຸກສະຖານະ' : 'All'}
                        </button>
                        <button
                          onClick={() => setUserStatusFilter('active')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${userStatusFilter === 'active' ? 'bg-adv-orange text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                        >
                          {lang === 'lo' ? 'ເຄື່ອນໄຫວ' : 'Active'}
                        </button>
                        <button
                          onClick={() => setUserStatusFilter('suspended')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${userStatusFilter === 'suspended' ? 'bg-adv-orange text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                        >
                          {lang === 'lo' ? 'ຖືກໂຈະ' : 'Suspended'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-50 text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                            <th className="py-3 font-black pl-8">{t.name}</th>
                            <th className="py-3 font-black">{t.email}</th>
                            <th className="py-3 font-black">{lang === 'lo' ? 'ເບີໂທ' : 'Phone'}</th>
                            <th className="py-3 font-black">{t.role}</th>
                            <th className="py-3 font-black">{t.status}</th>
                            <th className="py-3 font-black text-right pr-8">{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {usersList
                            .filter(u => u.role !== 'organizer')
                            .filter(u => userStatusFilter === 'all' || u.status === userStatusFilter)
                            .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
                            .filter(u => {
                              const q = searchQuery.toLowerCase().trim();
                              if (!q) return true;
                              return (
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                (u.phone && u.phone.toLowerCase().includes(q))
                              );
                            })
                            .map(user => (
                              <tr key={user.id} className="group even:bg-gray-50/30 hover:bg-orange-50/30 transition-colors">
                                <td className="py-3 pl-8">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-adv-orange font-black flex items-center justify-center text-xs shrink-0 border border-orange-100">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-adv-slate">{user.name}</div>
                                      <div className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">
                                        {t.joined} {new Date(user.joined).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-gray-600 text-sm font-medium">{user.email}</td>
                                <td className="py-3 text-gray-500 text-sm font-medium">{user.phone || '—'}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                    user.role === 'admin' ? 'bg-orange-50 text-adv-orange border-orange-200' : 
                                    'bg-gray-50 text-gray-500 border-gray-200'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                    user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    {user.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right pr-8">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Promote to organizer */}
                                    {user.role === 'user' && (
                                      <button
                                        onClick={() => handleRequestRoleChange(user, 'organizer')}
                                        className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-adv-orange hover:text-white text-adv-orange border border-orange-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                        title={t.promoteToOrganizer}
                                      >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{t.promoteToOrganizer}</span>
                                      </button>
                                    )}

                                    {/* Edit user */}
                                    <button
                                      onClick={() => setEditingUser(user)}
                                      className="p-2 rounded-xl text-gray-400 hover:text-adv-slate hover:bg-gray-100 transition-colors"
                                      title={t.edit}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>

                                    {/* Suspend / Activate toggle */}
                                    {user.role !== 'admin' && (
                                      <button
                                        onClick={() => handleToggleUserStatus(user.id)}
                                        className={`p-2 rounded-xl border transition-all ${
                                          user.status === 'active'
                                            ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border-transparent'
                                            : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                                        }`}
                                        title={user.status === 'active' ? t.suspend : t.activate}
                                      >
                                        {user.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {usersList.filter(u => u.role !== 'organizer').length === 0 && (
                      <div className="text-center py-16 text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-sm">{t.noUsersFound}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ORGANIZERS TAB (DEDICATED EVENT ORGANIZER MANAGEMENT) */}
              {activeTab === 'organizers' && (
                <div className="space-y-6">
                  {/* Organizers Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-orange-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-adv-orange shrink-0 shadow-sm border border-orange-50 group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">
                          {usersList.filter(u => u.role === 'organizer').length}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.totalOrganizers}</div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-emerald-50/60">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-50 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">
                          {usersList.filter(u => u.role === 'organizer' && u.status === 'active').length}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.activeOrganizers}</div>
                      </div>
                    </div>

                    <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-red-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-red-50 group-hover:scale-110 transition-transform">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">
                          {usersList.filter(u => u.role === 'organizer' && u.status === 'suspended').length}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.suspendedOrganizers}</div>
                      </div>
                    </div>

                    <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 flex items-center gap-4 group shadow-sm transition-all hover:bg-blue-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-50 group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-adv-slate leading-none mb-1">
                          {eventsList.length}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{t.hostedEvents}</div>
                      </div>
                    </div>
                  </div>

                  {/* Organizers Search & Filter Bar */}
                  <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchOrganizersPlaceholder || (lang === 'lo' ? 'ຄົ້ນຫາຜູ້ຈັດງານ...' : 'Search organizers by name, company, email...')}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-adv-slate font-medium focus:outline-none focus:border-adv-orange/40 transition-colors shadow-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-adv-slate"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-bold self-start md:self-auto">
                      <button
                        onClick={() => setOrganizerStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${organizerStatusFilter === 'all' ? 'bg-adv-orange text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                      >
                        {lang === 'lo' ? 'ທຸກສະຖານະ' : 'All Organizers'}
                      </button>
                      <button
                        onClick={() => setOrganizerStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${organizerStatusFilter === 'active' ? 'bg-adv-orange text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                      >
                        {lang === 'lo' ? 'ເຄື່ອນໄຫວ' : 'Active'}
                      </button>
                      <button
                        onClick={() => setOrganizerStatusFilter('suspended')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${organizerStatusFilter === 'suspended' ? 'bg-adv-orange text-white' : 'text-gray-500 hover:text-adv-slate'}`}
                      >
                        {lang === 'lo' ? 'ຖືກໂຈະ' : 'Suspended'}
                      </button>
                    </div>
                  </div>

                  {/* Organizers Table */}
                  <div className="overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-50 text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                            <th className="py-3 font-black pl-8">{t.organizer}</th>
                            <th className="py-3 font-black">{t.email} & {lang === 'lo' ? 'ເບີໂທ' : 'Phone'}</th>
                            <th className="py-3 font-black">{t.bankInfo}</th>
                            <th className="py-3 font-black">{t.hostedEvents}</th>
                            <th className="py-3 font-black">{t.status}</th>
                            <th className="py-3 font-black text-right pr-8">{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {usersList
                            .filter(u => u.role === 'organizer')
                            .filter(u => organizerStatusFilter === 'all' || u.status === organizerStatusFilter)
                            .filter(org => {
                              const q = searchQuery.toLowerCase().trim();
                              if (!q) return true;
                              return (
                                org.name.toLowerCase().includes(q) ||
                                (org.organization && org.organization.toLowerCase().includes(q)) ||
                                org.email.toLowerCase().includes(q) ||
                                (org.phone && org.phone.toLowerCase().includes(q)) ||
                                (org.bankName && org.bankName.toLowerCase().includes(q))
                              );
                            })
                            .map(org => {
                              const orgEvents = eventsList.filter(e => 
                                (e.organizer && e.organizer.toLowerCase() === org.name.toLowerCase()) ||
                                (org.organization && e.organizer && e.organizer.toLowerCase() === org.organization.toLowerCase())
                              );

                              return (
                                <tr key={org.id} className="group even:bg-gray-50/30 hover:bg-orange-50/30 transition-colors">
                                  {/* Organizer */}
                                  <td className="py-3 pl-8">
                                    <div className="flex items-center gap-3">
                                      <div className="w-11 h-11 rounded-2xl bg-orange-100/60 text-adv-orange font-black flex items-center justify-center text-sm shrink-0 border border-orange-200/50">
                                        <Building2 className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-adv-slate">
                                          {org.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">
                                          {t.joined} {new Date(org.joined).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Contact info */}
                                  <td className="py-3">
                                    <div className="text-sm font-semibold text-adv-slate">{org.email}</div>
                                    {org.phone ? (
                                      <div className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        {org.phone}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-300 font-medium mt-0.5">—</div>
                                    )}
                                  </td>

                                  {/* Bank info */}
                                  <td className="py-3">
                                    {org.bankName ? (
                                      <div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-adv-slate">
                                          <CreditCard className="w-3.5 h-3.5 text-adv-orange" />
                                          {org.bankName}
                                        </div>
                                        {org.accountNumber && (
                                          <div className="text-[11px] text-gray-400 font-mono mt-1 font-semibold tracking-wider">
                                            {org.accountNumber}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">BCEL (Default)</span>
                                    )}
                                  </td>

                                  {/* Hosted Events Count */}
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 font-black text-xs rounded-xl border border-blue-100">
                                        {orgEvents.length} {lang === 'lo' ? 'ງານ' : 'events'}
                                      </span>
                                      {orgEvents.length > 0 && (
                                        <button
                                          onClick={() => setSelectedOrganizerForEvents(org)}
                                          className="text-xs font-bold text-adv-orange hover:underline flex items-center gap-0.5"
                                        >
                                          {t.viewEvents}
                                          <ExternalLink className="w-3 h-3 ml-0.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                      org.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${org.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                      {org.status}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 text-right pr-8">
                                    <div className="flex items-center justify-end gap-2">
                                      {/* View events detail modal */}
                                      <button
                                        onClick={() => setSelectedOrganizerForEvents(org)}
                                        className="p-2 rounded-xl text-gray-400 hover:text-adv-orange hover:bg-orange-50 transition-colors"
                                        title={t.viewEvents}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>

                                      {/* Edit organizer */}
                                      <button
                                        onClick={() => setEditingUser(org)}
                                        className="p-2 rounded-xl text-gray-400 hover:text-adv-slate hover:bg-gray-100 transition-colors"
                                        title={t.edit}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>

                                      {/* Demote to Regular User */}
                                      <button
                                        onClick={() => handleRequestRoleChange(org, 'user')}
                                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        title={t.demoteToUser}
                                      >
                                        <User className="w-4 h-4" />
                                      </button>

                                      {/* Toggle Suspend */}
                                      <button
                                        onClick={() => handleToggleUserStatus(org.id)}
                                        className={`p-2 rounded-xl border transition-all ${
                                          org.status === 'active'
                                            ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border-transparent'
                                            : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                                        }`}
                                        title={org.status === 'active' ? t.suspend : t.activate}
                                      >
                                        {org.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {usersList.filter(u => u.role === 'organizer').length === 0 && (
                      <div className="text-center py-16 text-gray-400">
                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-sm">{t.noOrganizersFound}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODAL: ORGANIZER EVENTS OVERVIEW */}
              <AnimatePresence>
                {selectedOrganizerForEvents && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
                    >
                      {/* Modal Header */}
                      <div className="p-6 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-adv-orange flex items-center justify-center font-black">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-adv-slate">{selectedOrganizerForEvents.name}</h3>
                            <p className="text-xs text-gray-400 font-medium">
                              {selectedOrganizerForEvents.organization || 'Independent Organizer'} • {selectedOrganizerForEvents.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedOrganizerForEvents(null)}
                          className="p-2.5 rounded-xl text-gray-400 hover:text-adv-slate hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Body: Organizer's Events List */}
                      <div className="p-6 overflow-y-auto space-y-4">
                        <div className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                          {t.eventsByOrganizer}
                        </div>
                        {(() => {
                          const orgEvents = eventsList.filter(e => 
                            (e.organizer && e.organizer.toLowerCase() === selectedOrganizerForEvents.name.toLowerCase()) ||
                            (selectedOrganizerForEvents.organization && e.organizer && e.organizer.toLowerCase() === selectedOrganizerForEvents.organization.toLowerCase())
                          );

                          if (orgEvents.length === 0) {
                            return (
                              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="font-bold text-sm">No events found for this organizer.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                              {orgEvents.map(event => {
                                const isDone = new Date(`${event.date}T23:59:59`) < new Date();
                                return (
                                  <div key={event.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-adv-slate text-sm">{event.title}</h4>
                                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                          <span>📅 {event.date}</span>
                                          <span>📍 {event.location}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        isDone ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'
                                      }`}>
                                        {isDone ? (lang === 'lo' ? 'ສຳເລັດແລ້ວ' : 'Completed') : (lang === 'lo' ? 'ກຳລັງຈະມາ' : 'Upcoming')}
                                      </span>
                                      <Link
                                        to={`/events/${event.id}`}
                                        className="p-2 rounded-xl text-adv-orange hover:bg-orange-50 transition-colors"
                                        title="View Event Page"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                        <button
                          onClick={() => setSelectedOrganizerForEvents(null)}
                          className="px-6 py-2.5 rounded-xl bg-adv-slate text-white text-xs font-bold hover:bg-black transition-colors"
                        >
                          {t.close}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {activeTab === 'events' && (
                <div className="space-y-4">
                  {eventsList.filter(e => {
                    const isStandard = e.dateType !== 'booking';
                      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (e.organizer && e.organizer.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()));
                      const isUpcoming = new Date(`${e.date}T23:59:59`) >= new Date();
                      const eventDate = new Date(e.date);
                      const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                      const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                      return isStandard && matchesSearch && isUpcoming && matchesMonth && matchesYear;
                    }).map(event => {
                      const fin = getEventFinancialSummary(event);
                      return (
                        <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 hover:border-adv-orange/30 transition-all group gap-5 shadow-sm">
                          <div className="flex items-center gap-5">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md">
                              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 uppercase tracking-widest text-[9px] font-black">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {lang === 'lo' ? 'Event ທົ່ວໄປ' : 'Event Type'}
                                </span>
                                {event.category && (
                                  <span className="px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                                    {event.category}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-black text-adv-slate group-hover:text-adv-orange transition-colors">{event.title}</h3>
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-xs text-gray-400 font-bold">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 border border-green-100 text-green-600 uppercase tracking-widest text-[10px]">
                                  {t.upcoming}
                                </span>
                                {event.featured && (
                                  <span className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-500 uppercase tracking-widest text-[10px] font-black">
                                    <Star className="w-3 h-3 fill-amber-500" />
                                    {lang === 'lo' ? 'ແນະນຳ' : 'Featured'}
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                  {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                  {event.location}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 border border-orange-100 text-adv-orange uppercase tracking-widest text-[10px] font-black">
                                  <Ticket className="w-3.5 h-3.5" /> {fin.ticketsSold} {t.ticketsSold}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase tracking-widest text-[10px] font-black">
                                  <Wallet className="w-3.5 h-3.5" /> {lang === 'lo' ? 'ເງິນທີ່ຈະໄດ້ຮັບ' : 'Payout'}: {new Intl.NumberFormat('lo-LA').format(fin.moneyCanGet)} ₭
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/event/${event.id}`}
                              target="_blank"
                              className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 hover:text-adv-orange hover:bg-orange-50 transition-all shadow-xs"
                              title={lang === 'lo' ? 'ເບິ່ງໜ້າ Event' : 'Live Preview'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
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
                      const isStandard = e.dateType !== 'booking';
                      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (e.organizer && e.organizer.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()));
                      const isUpcoming = new Date(`${e.date}T23:59:59`) >= new Date();
                      const eventDate = new Date(e.date);
                      const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                      const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                      return isStandard && matchesSearch && isUpcoming && matchesMonth && matchesYear;
                    }).length === 0 && (
                      <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">{t.noUpcomingEvents}</p>
                      </div>
                    )}
                  </div>
                )}

              {activeTab === 'bookings' && (
                <div className="space-y-6">
                  {/* Booking Experiences KPI Cards */}
                  {(() => {
                    const bookingEvents = eventsList.filter(e => e.dateType === 'booking');
                    const totalSlots = bookingEvents.reduce((acc, e) => acc + (e.bookingTimeSlots?.length || 0), 0);
                    const totalBookingAttendees = bookingEvents.reduce((acc, e) => {
                      const fin = getEventFinancialSummary(e);
                      return acc + fin.ticketsSold;
                    }, 0);
                    const totalBookingRevenue = bookingEvents.reduce((acc, e) => {
                      const fin = getEventFinancialSummary(e);
                      return acc + fin.grossRevenue;
                    }, 0);

                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-adv-orange/30 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                              {lang === 'lo' ? 'ກິດຈະກຳຈອງທັງໝົດ' : 'Active Experiences'}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-adv-orange flex items-center justify-center">
                              <CalendarDays className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-black text-adv-slate">{bookingEvents.length}</div>
                          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {lang === 'lo' ? 'ກິດຈະກຳປະເພດຈອງ' : 'Recurring booking events'}
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-adv-orange/30 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                              {lang === 'lo' ? 'ຮອບເວລາປະຈຳວັນ' : 'Daily Time Slots'}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-black text-adv-slate">{totalSlots}</div>
                          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {lang === 'lo' ? 'ຮອບເວລາເປີດໃຫ້ຈອງ' : 'Time slots across all experiences'}
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-adv-orange/30 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                              {lang === 'lo' ? 'ຈຳນວນການຈອງແລ້ວ' : 'Total Bookings'}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                              <Ticket className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-black text-adv-slate">{totalBookingAttendees}</div>
                          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {lang === 'lo' ? 'ຜູ້ເຂົ້າຮ່ວມທີ່ຈອງສຳເລັດ' : 'Guests & tickets booked'}
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-adv-orange/30 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                              {lang === 'lo' ? 'ຍອດຂາຍປະເພດຈອງ' : 'Booking Volume'}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <Wallet className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-black text-adv-slate">
                            {new Intl.NumberFormat('lo-LA').format(totalBookingRevenue)} ₭
                          </div>
                          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {lang === 'lo' ? 'ລາຍຮັບຈາກກິດຈະກຳຈອງ' : 'Gross booking revenue'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Booking Experiences List */}
                  <div className="space-y-4">
                    {eventsList.filter(e => {
                      const isBooking = e.dateType === 'booking';
                      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (e.organizer && e.organizer.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()));
                      const eventDate = new Date(e.date);
                      const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                      const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                      return isBooking && matchesSearch && matchesMonth && matchesYear;
                    }).map(event => {
                      const fin = getEventFinancialSummary(event);
                      return (
                        <div key={event.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 hover:border-adv-orange/30 transition-all group gap-5 shadow-sm">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 shadow-md">
                              <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider">
                                {event.bookingDuration || 'Flexible'}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-adv-orange uppercase tracking-widest text-[9px] font-black">
                                  <CalendarDays className="w-3 h-3" />
                                  {lang === 'lo' ? 'ກິດຈະກຳຈອງ (Booking Type)' : 'Booking Type'}
                                </span>
                                {event.category && (
                                  <span className="px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                                    {event.category}
                                  </span>
                                )}
                                {event.featured && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-500 uppercase tracking-widest text-[9px] font-black">
                                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                                    {lang === 'lo' ? 'ແນະນຳ' : 'Featured'}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg font-black text-adv-slate group-hover:text-adv-orange transition-colors line-clamp-1">{event.title}</h3>
                              
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-gray-400 font-bold">
                                <span className="flex items-center gap-1.5 text-gray-600">
                                  <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                  {event.bookingStartDate ? `${event.bookingStartDate} → ${event.bookingEndDate || 'Ongoing'}` : event.date}
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-600">
                                  <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                  {event.location}
                                </span>
                                {event.organizer && (
                                  <span className="flex items-center gap-1.5 text-gray-600">
                                    <Building2 className="w-3.5 h-3.5 text-gray-300" />
                                    {event.organizer}
                                  </span>
                                )}
                              </div>

                              {/* Time Slots Chips */}
                              {event.bookingTimeSlots && event.bookingTimeSlots.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">
                                    {lang === 'lo' ? 'ຮອບເວລາ:' : 'Slots:'}
                                  </span>
                                  {event.bookingTimeSlots.map((slot, idx) => {
                                    const slotCap = event.bookingSlotCapacities?.[slot] || event.bookingCapacity || '10';
                                    return (
                                      <span key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200/80 text-[10px] font-bold text-adv-slate">
                                        <Clock className="w-2.5 h-2.5 text-adv-orange" />
                                        <span>{slot}</span>
                                        <span className="text-gray-400 font-normal">({slotCap} pax)</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-end justify-between gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-right">
                                <div className="text-[10px] font-black uppercase tracking-wider text-adv-orange">{lang === 'lo' ? 'ຈອງແລ້ວ' : 'Booked'}</div>
                                <div className="text-sm font-black text-adv-slate">{fin.ticketsSold} {t.ticketsSold}</div>
                              </div>
                              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-right">
                                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">{lang === 'lo' ? 'ເງິນທີ່ຈະໄດ້ຮັບ' : 'Payout'}</div>
                                <div className="text-sm font-black text-emerald-800">{new Intl.NumberFormat('lo-LA').format(fin.moneyCanGet)} ₭</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end">
                              <Link
                                to={`/event/${event.id}`}
                                target="_blank"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:text-adv-orange hover:bg-orange-50 transition-all text-xs font-black uppercase tracking-wider shadow-xs"
                                title={lang === 'lo' ? 'ເບິ່ງໜ້າການຈອງຕົວຈິງ' : 'Live Booking Preview'}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{lang === 'lo' ? 'ເບິ່ງໜ້າຈອງ' : 'Preview'}</span>
                              </Link>
                              <button 
                                onClick={() => setSelectedEvent(event)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-adv-slate text-white hover:bg-black transition-all text-xs font-black uppercase tracking-wider shadow-sm"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>{t.manage}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {eventsList.filter(e => {
                      const isBooking = e.dateType === 'booking';
                      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (e.organizer && e.organizer.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()));
                      const eventDate = new Date(e.date);
                      const matchesMonth = filterMonth === 'all' || (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                      const matchesYear = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear;
                      return isBooking && matchesSearch && matchesMonth && matchesYear;
                    }).length === 0 && (
                      <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h4 className="text-adv-slate font-black text-base mb-1">
                          {lang === 'lo' ? 'ບໍ່ພົບກິດຈະກຳແບບຈອງ' : 'No Booking Experiences Found'}
                        </h4>
                        <p className="text-gray-400 font-medium text-xs max-w-sm mx-auto mb-4">
                          {lang === 'lo' 
                            ? 'ຍັງບໍ່ມີກິດຈະກຳປະເພດຈອງລາຍວັນທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາຂອງທ່ານ' 
                            : 'No daily booking experiences match your current search or date filters.'}
                        </p>
                        <Link
                          to="/create"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-adv-orange text-white text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
                        >
                          <Plus className="w-4 h-4" />
                          {lang === 'lo' ? 'ສ້າງກິດຈະກຳແບບຈອງໃໝ່' : 'Create Booking Experience'}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'past-events' && (
                <div className="space-y-6">
                  {/* Summary KPI Banner for Completed Events */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
                          {lang === 'lo' ? 'Event ທີ່ສຳເລັດແລ້ວ' : 'Completed Events'}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-adv-slate">{pastEventsStats.count}</div>
                      <div className="text-[10px] text-gray-400 mt-1 font-bold">
                        {lang === 'lo' ? 'ກິດຈະກຳທີ່ຈັດສຳເລັດ' : 'Events already done'}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
                          {lang === 'lo' ? 'ປີ້ທີ່ຂາຍແລ້ວທັງໝົດ' : 'Total Tickets Sold'}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange">
                          <Ticket className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-adv-orange">
                        {pastEventsStats.totalTickets.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 font-bold">
                        {lang === 'lo' ? 'ຈຳນວນປີ້ທີ່ຂາຍໄດ້ທັງໝົດ' : 'Total sold across done events'}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
                          {lang === 'lo' ? 'ຍອດຂາຍລວມ' : 'Gross Sales'}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-base sm:text-xl font-black text-adv-slate truncate">
                        {new Intl.NumberFormat('lo-LA').format(pastEventsStats.totalGrossRevenue)} ₭
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 font-bold">
                        {lang === 'lo' ? 'ລາຍຮັບຈາກປີ້ທັງໝົດ' : 'Gross revenue from tickets'}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-100">
                          {lang === 'lo' ? 'ເງິນທີ່ຈະໄດ້ຮັບ (Payout)' : 'Money Can Get'}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                          <Wallet className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-base sm:text-xl font-black truncate">
                        {new Intl.NumberFormat('lo-LA').format(pastEventsStats.totalMoneyCanGet)} ₭
                      </div>
                      <div className="text-[10px] text-emerald-100 mt-1 font-bold">
                        {lang === 'lo' ? 'ຫຼັງຫັກຄ່າທຳນຽມ 10%' : 'Net payout after 10% fee'}
                      </div>
                    </div>
                  </div>

                  {/* List of Done Events with Tickets Sold and Money Can Get */}
                  <div className="space-y-4">
                    {filteredPastEvents.map(event => {
                      const fin = getEventFinancialSummary(event);
                      return (
                        <div key={event.id} className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 hover:border-adv-orange/30 transition-all group shadow-sm space-y-4">
                          {/* Header / Event Identity & Quick Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-4">
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 shadow-md">
                                <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/5"></div>
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-600 font-extrabold text-[9px] uppercase tracking-wider">
                                    {t.finished}
                                  </span>
                                  {event.category && (
                                    <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-100 text-adv-orange font-bold text-[9px] uppercase tracking-wider">
                                      {event.category}
                                    </span>
                                  )}
                                  {fin.payoutStatus === 'paid' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      {lang === 'lo' ? 'ເບີກຈ່າຍແລ້ວ' : 'Paid'}
                                    </span>
                                  ) : fin.payoutStatus === 'pending' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {lang === 'lo' ? 'ລໍຖ້າເບີກຈ່າຍ' : 'Pending Payout'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                                      <Wallet className="w-2.5 h-2.5" />
                                      {lang === 'lo' ? 'ພ້ອມເບີກຈ່າຍ' : 'Ready for Payout'}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-adv-slate group-hover:text-adv-orange transition-colors">
                                  {event.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-xs text-gray-400 font-bold">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                    {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                      {event.location}
                                    </span>
                                  )}
                                  {event.organizer && (
                                    <span className="flex items-center gap-1 text-gray-500">
                                      <Building2 className="w-3.5 h-3.5 text-gray-300" />
                                      {event.organizer}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button 
                                onClick={() => setSelectedEvent(event)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-adv-slate hover:bg-orange-50 hover:border-adv-orange/30 hover:text-adv-orange transition-all text-xs font-black uppercase tracking-wider shadow-2xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {t.viewDetails}
                              </button>
                              <button
                                onClick={() => setActiveTab('payouts')}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all text-xs font-black uppercase tracking-wider shadow-2xs"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                                {lang === 'lo' ? 'ຈັດການ Payout' : 'Payouts'}
                              </button>
                            </div>
                          </div>

                          {/* Tickets Sold & Money Can Get Highlight Section */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                            {/* Ticket Has Sold */}
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shrink-0">
                                <Ticket className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                  {lang === 'lo' ? 'ປີ້ທີ່ຂາຍແລ້ວ' : 'Tickets Sold'}
                                </div>
                                <div className="text-sm sm:text-base font-black text-adv-slate truncate">
                                  {fin.ticketsSold.toLocaleString()}{' '}
                                  <span className="text-xs font-bold text-gray-400">
                                    / {fin.totalCapacity > 0 ? fin.totalCapacity.toLocaleString() : 'Open'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Gross Sales / Revenue */}
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                  {lang === 'lo' ? 'ຍອດຂາຍລວມ' : 'Gross Sales'}
                                </div>
                                <div className="text-sm sm:text-base font-black text-adv-slate truncate">
                                  {new Intl.NumberFormat('lo-LA').format(fin.grossRevenue)} ₭
                                </div>
                              </div>
                            </div>

                            {/* Money Can Get (Payout Amount) - High-Visibility Emerald Card */}
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <Wallet className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider truncate">
                                    {lang === 'lo' ? 'ເງິນທີ່ຈະໄດ້ຮັບ (Payout)' : 'Money Can Get'}
                                  </div>
                                  <div className="text-sm sm:text-base font-black text-emerald-700 truncate">
                                    {new Intl.NumberFormat('lo-LA').format(fin.moneyCanGet)} ₭
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                  -{fin.platformFeePercent}% fee
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredPastEvents.length === 0 && (
                      <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">{lang === 'lo' ? 'ບໍ່ພົບ Event ທີ່ສຳເລັດແລ້ວ.' : 'No past events found.'}</p>
                      </div>
                    )}
                  </div>
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
                                <div className="space-y-1.5 mt-3">
                                  <label className="block text-[11px] font-bold text-gray-500 uppercase">
                                    Reference Number / Txn ID
                                  </label>
                                  <input
                                    type="text"
                                    value={uploadingRef[payout.id] || ''}
                                    onChange={(e) => setUploadingRef(prev => ({...prev, [payout.id]: e.target.value}))}
                                    placeholder="e.g. TR-202609..."
                                    className="w-full text-sm py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all outline-none"
                                  />
                                </div>
                              )}
                              
                              {uploadingBill[payout.id] && (
                                <button 
                                  onClick={() => {
                                    const img = uploadingBill[payout.id];
                                    const ref = uploadingRef[payout.id] || payout.id;
                                    setPayoutsList(prev => prev.map(p => p.id === payout.id ? { ...p, status: 'paid', billImage: img, reference: ref, completedDate: new Date().toISOString() } : p));
                                    
                                    // Add/update to organizer's local storage for them to see the bill
                                    const savedBills = safeStorage.getItem('organizer_payout_bills') || '[]';
                                    let parsedBills = JSON.parse(savedBills);
                                    
                                    const existingIdx = parsedBills.findIndex((b: any) => b.id === payout.id);
                                    if (existingIdx >= 0) {
                                      parsedBills[existingIdx] = { ...payout, status: 'paid', billImage: img, reference: ref, paidAt: new Date().toISOString() };
                                    } else {
                                      parsedBills.push({ ...payout, status: 'paid', billImage: img, reference: ref, paidAt: new Date().toISOString() });
                                    }
                                    
                                    safeStorage.setItem('organizer_payout_bills', JSON.stringify(parsedBills));
                                    
                                    setUploadingBill(prev => { const next = {...prev}; delete next[payout.id]; return next; });
                                    setUploadingRef(prev => { const next = {...prev}; delete next[payout.id]; return next; });
                                  }}
                                  className="w-full mt-3 bg-adv-orange hover:bg-orange-600 text-white font-bold text-sm px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
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
                            <th className="py-3 font-black pl-8">Action</th>
                            <th className="py-3 font-black">Details</th>
                            <th className="py-3 font-black">Admin/System</th>
                            <th className="py-3 font-black text-right pr-8">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {activityLogs.filter(log => log.action.toLowerCase().includes(searchQuery.toLowerCase()) || log.details.toLowerCase().includes(searchQuery.toLowerCase())).map((log) => (
                            <tr key={log.id} className="group even:bg-gray-50/30 hover:bg-orange-50/30 transition-colors">
                              <td className="py-3 pl-8">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-adv-orange">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-adv-slate text-sm">{log.action}</span>
                                </div>
                              </td>
                              <td className="py-3 text-gray-500 text-sm font-medium">{log.details}</td>
                              <td className="py-3 text-gray-400 text-xs font-bold">{log.admin}</td>
                              <td className="py-3 text-right text-gray-300 text-[10px] font-black uppercase tracking-widest pr-8">
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

              {activeTab === 'refunds' && (
                <RefundsManagementTab
                  lang={lang}
                  t={t}
                  addActivityLog={addActivityLog}
                />
              )}

              {activeTab === 'site-settings' && (
                <SiteSettingsTab
                  lang={lang}
                  t={t}
                  addActivityLog={addActivityLog}
                />
              )}

              {activeTab === 'blogs' && (
                <AdminBlogsTab />
              )}
            </div>
         </div>
      </main>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-adv-orange shadow-sm border border-orange-50 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-adv-slate line-clamp-1">{selectedEvent.title}</h2>
                      <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 text-adv-orange font-black text-[10px] uppercase tracking-wider border border-orange-200/60 shrink-0">
                        {selectedEvent.category}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-0.5 truncate">
                      <span>{t.eventDetails}</span>
                      <span>•</span>
                      <span>#{selectedEvent.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span className="truncate">{selectedEvent.venue || selectedEvent.location}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <a
                    href={`/event/${selectedEvent.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-orange-50 hover:bg-orange-100 text-adv-orange text-xs font-bold transition-all border border-orange-200/60 shadow-2xs"
                    title={lang === 'lo' ? 'ເປີດໜ້າ Event ຕົວຈິງ (Live Preview)' : 'Open Live Event Page Preview'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{lang === 'lo' ? 'ເບິ່ງໜ້າຕົວຈິງ' : 'Live Preview'}</span>
                  </a>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-adv-slate transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                {/* Hero Banner Cover & Interactive Image Inspector */}
                {(() => {
                  const allImages = getEventAllImages(selectedEvent);
                  const safeIdx = (selectedPreviewImageIndex >= 0 && selectedPreviewImageIndex < allImages.length) ? selectedPreviewImageIndex : 0;
                  const activeImg = allImages[safeIdx] || getEventMainImage(selectedEvent);

                  return (
                    <div className="mb-8 mx-auto max-w-6xl space-y-3">
                      {/* Visual Image Preview Box */}
                      <div className={`relative rounded-[2.5rem] overflow-hidden bg-slate-950 shadow-2xl border border-gray-200 transition-all ${
                        previewShowOverlay 
                          ? 'aspect-[16/9] min-h-[300px] sm:min-h-[380px] max-h-[520px]' 
                          : 'min-h-[360px] sm:min-h-[480px] max-h-[70vh]'
                      }`}>
                        <AdaptiveImage 
                          src={activeImg} 
                          alt={selectedEvent.title} 
                          className="absolute inset-0 w-full h-full cursor-zoom-in"
                          showBlurBackdrop={true}
                          fitMode={previewImageFitMode}
                          onClick={() => setFullscreenImage(activeImg)}
                        />

                        {/* Top Control Bar for Image Inspection */}
                        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2 pointer-events-auto">
                          {/* Image Index & Fit Badges */}
                          <div className="flex items-center gap-2">
                            {allImages.length > 1 && (
                              <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-black border border-white/20 shadow-md">
                                {safeIdx + 1} / {allImages.length}
                              </span>
                            )}
                            <span className="px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-white/90 text-[11px] font-bold border border-white/10 hidden sm:inline-block">
                              {previewImageFitMode === 'contain' 
                                ? (lang === 'lo' ? 'ສະແດງເຕັມຮູບ (Contain)' : 'Full Image (Contain)') 
                                : (lang === 'lo' ? 'ຕັດແບບປ້າຍ (Cover)' : 'Banner Crop (Cover)')}
                            </span>
                          </div>

                          {/* Right Action Tools */}
                          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl">
                            {/* Toggle Contain vs Cover */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImageFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
                              }}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-all flex items-center gap-1 cursor-pointer"
                              title={previewImageFitMode === 'contain' ? 'Switch to Banner Crop (Cover)' : 'Switch to Full Contain'}
                            >
                              <Layers className="w-3.5 h-3.5 text-orange-400" />
                              <span className="text-[11px]">{previewImageFitMode === 'contain' ? 'Fit' : 'Cover'}</span>
                            </button>

                            {/* Toggle Overlay Text On/Off */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewShowOverlay(prev => !prev);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                !previewShowOverlay ? 'bg-adv-orange text-white shadow-md' : 'text-white hover:bg-white/20'
                              }`}
                              title={previewShowOverlay ? (lang === 'lo' ? 'ເຊື່ອງຂໍ້ຄວາມເພື່ອເບິ່ງຮູບໂປສເຕີແບບຊັດເຈນ' : 'Hide overlay text to inspect clean flyer') : (lang === 'lo' ? 'ສະແດງຂໍ້ຄວາມ' : 'Show overlay text')}
                            >
                              {!previewShowOverlay ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-orange-400" />}
                              <span className="text-[11px]">
                                {!previewShowOverlay 
                                  ? (lang === 'lo' ? 'ຮູບສະອາດ' : 'Clean') 
                                  : (lang === 'lo' ? 'ປົກກະຕິ' : 'Overlay')}
                              </span>
                            </button>

                            {/* Fullscreen Zoom */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullscreenImage(activeImg);
                              }}
                              className="p-1.5 rounded-xl text-white hover:bg-white/20 transition-all cursor-pointer"
                              title={lang === 'lo' ? 'ເບິ່ງຮູບຂະໜາດເຕັມ (Zoom)' : 'Zoom Full Image'}
                            >
                              <Maximize2 className="w-4 h-4 text-orange-400" />
                            </button>
                          </div>
                        </div>

                        {/* Previous / Next Chevrons if multi-image */}
                        {allImages.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPreviewImageIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 border border-white/20 shadow-md cursor-pointer"
                              title="Previous image"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPreviewImageIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 border border-white/20 shadow-md cursor-pointer"
                              title="Next image"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Text Overlay in Front of Image (Can be toggled so admin can inspect clean flyer) */}
                        {previewShowOverlay && (
                          <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent flex flex-col justify-end p-5 sm:p-8 md:p-10 pointer-events-none">
                            {/* Category, Format & Status Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-2.5">
                              <span className="px-3 py-1 bg-adv-orange text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md">
                                {selectedEvent.category}
                              </span>
                              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30">
                                {selectedEvent.eventType === 'online' ? 'Online Event' : (selectedEvent.province || 'Offline Event')}
                              </span>
                              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg shadow-md ${
                                selectedEvent.status === 'approved' 
                                  ? 'bg-emerald-500 text-white' 
                                  : selectedEvent.status === 'rejected' 
                                    ? 'bg-rose-500 text-white' 
                                    : 'bg-amber-500 text-slate-950'
                              }`}>
                                {selectedEvent.status || 'Pending'}
                              </span>
                              {selectedEvent.dateType === 'flexible' && (
                                <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                                  {lang === 'lo' ? 'ວັນທີຈັດງານ' : 'Event Date'}
                                </span>
                              )}
                              {selectedEvent.dateType === 'booking' && (
                                <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                                  {lang === 'lo' ? 'ການຈອງ' : 'Booking'}
                                </span>
                              )}
                            </div>

                            {/* Event Title in Front of Image */}
                            <h1 className="font-black text-white tracking-tight mb-3 text-2xl sm:text-3xl md:text-4xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                              {selectedEvent.title}
                            </h1>

                            {/* Key Event Details Grid in Front of Image */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-semibold">
                              {/* Date Detail */}
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white/95 border border-white/20 shadow-md">
                                <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                <span>
                                  {selectedEvent.dateType === 'flexible' ? (
                                    (lang === 'lo' ? 'ວັນທີຈັດງານ' : 'Event Date')
                                  ) : selectedEvent.dateType === 'booking' ? (
                                    (lang === 'lo' ? 'ການຈອງ (Booking)' : 'Slot Booking')
                                  ) : selectedEvent.date ? (
                                    new Date(selectedEvent.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                  ) : 'TBA'}
                                  {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date && ` - ${new Date(selectedEvent.endDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric' })}`}
                                </span>
                              </div>

                              {/* Time Detail */}
                              {selectedEvent.time && selectedEvent.dateType !== 'booking' && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white/95 border border-white/20 shadow-md">
                                  <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  <span>{selectedEvent.time}</span>
                                </div>
                              )}

                              {/* Location / Venue Detail */}
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white/95 border border-white/20 shadow-md">
                                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                <span className="truncate max-w-[200px] sm:max-w-[320px]">
                                  {selectedEvent.venue || selectedEvent.location}{selectedEvent.district ? `, ${selectedEvent.district}` : ''}{selectedEvent.province ? ` • ${selectedEvent.province}` : ''}
                                </span>
                              </div>

                              {/* Ticket Starting Price */}
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-emerald-300 border border-white/20 shadow-md">
                                <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>
                                  {selectedEvent.price || (selectedEvent.ticketTiers && selectedEvent.ticketTiers[0]?.price 
                                    ? `${(Number(String(selectedEvent.ticketTiers[0].price).replace(/,/g, '')) || 0).toLocaleString()} ${currency}`
                                    : (lang === 'lo' ? 'ຟຣີ / Free' : 'Free'))}
                                </span>
                              </div>

                              {/* Organizer Detail */}
                              {selectedEvent.organizer && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white/85 border border-white/20 shadow-md">
                                  <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  <span className="truncate max-w-[160px] sm:max-w-[220px]">{selectedEvent.organizer}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Thumbnails strip for multi-image events */}
                      {allImages.length > 1 && (
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
                          <span className="text-xs font-bold text-gray-500 shrink-0">
                            {lang === 'lo' ? 'ຮູບທັງໝົດ:' : 'All Images:'}
                          </span>
                          {allImages.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPreviewImageIndex(idx)}
                              className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                safeIdx === idx 
                                  ? 'border-adv-orange ring-2 ring-adv-orange/30 scale-105 shadow-sm' 
                                  : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={img}
                                alt={`Image ${idx + 1}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop';
                                }}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setFullscreenImage(activeImg)}
                            className="ml-auto text-xs font-bold text-adv-orange hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>{lang === 'lo' ? 'ເບິ່ງຂະໜາດເຕັມ' : 'View Fullscreen'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                              (lang === 'lo' ? 'ວັນທີຈັດງານ' : 'Event Date')
                            ) : selectedEvent.dateType === 'booking' ? (
                              (lang === 'lo' ? 'ການຈອງ (Slot Booking)' : 'Booking Available')
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
                            {selectedEvent.time || 'TBA'}
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
                          {selectedEvent.exampleImages.map((img: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setFullscreenImage(img)}
                              className="relative h-32 rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group bg-slate-100"
                              title={lang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງຮູບເຕັມ' : 'Click to inspect image'}
                            >
                              <img
                                src={img}
                                alt={`Gallery ${idx}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seating Zone Map */}
                    {selectedEvent.hasSeating && selectedEvent.zoneImage && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-adv-orange" />
                            {lang === 'lo' ? 'ແຜນຜັງໂຊນບ່ອນນັ່ງ' : 'Zone Seating Map'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setFullscreenImage(selectedEvent.zoneImage)}
                            className="text-xs font-bold text-adv-orange hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>{lang === 'lo' ? 'ເບິ່ງຂະໜາດເຕັມ' : 'Zoom Map'}</span>
                          </button>
                        </div>
                        <div 
                          onClick={() => setFullscreenImage(selectedEvent.zoneImage)}
                          className="rounded-xl overflow-hidden border border-gray-200 max-h-[400px] flex justify-center bg-gray-50 cursor-pointer group relative"
                          title={lang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງແຜນຜັງເຕັມ' : 'Click to zoom seating map'}
                        >
                          <img src={selectedEvent.zoneImage} alt="Seating Map" className="w-full object-contain group-hover:scale-[1.02] transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5" />
                              {lang === 'lo' ? 'ຄລິກເພື່ອຂະຫຍາຍ' : 'Click to zoom'}
                            </span>
                          </div>
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

                    {/* Booking Time Slots & Daily Capacities */}
                    {selectedEvent.dateType === 'booking' && selectedEvent.bookingTimeSlots && selectedEvent.bookingTimeSlots.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                            <Clock className="w-5 h-5 text-adv-orange" />
                            {lang === 'lo' ? 'ຮອບເວລາ & ຄວາມຈຸຕໍ່ຮອບ (ສຳລັບ 1 ວັນ)' : 'Booking Time Slots & Daily Capacities (For 1 Day)'}
                          </h3>
                          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            {selectedEvent.bookingTimeSlots.length} {lang === 'lo' ? 'ຮອບ' : 'slots'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedEvent.bookingTimeSlots.map((slot, idx) => {
                            const cap = selectedEvent.bookingSlotCapacities?.[slot] || Number(selectedEvent.bookingCapacity) || 10;
                            return (
                              <div key={idx} className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center space-y-1">
                                <div className="text-xs font-black text-adv-slate font-mono">{slot}</div>
                                <div className="text-[10px] font-bold text-amber-800 flex items-center justify-center gap-1">
                                  <Users className="w-3 h-3 text-adv-orange" />
                                  <span>{cap} {lang === 'lo' ? 'ຄົນ/ຮອບ/ວັນ' : 'people/slot/day'}</span>
                                </div>
                              </div>
                            );
                          })}
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
                          <div className="text-xs font-black text-adv-slate capitalize">{selectedEvent.dateType === 'booking' ? (lang === 'lo' ? 'ການຈອງ (Booking)' : 'Booking') : (lang === 'lo' ? 'ວັນທີຈັດງານ (Event Date)' : 'Event Date')}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{lang === 'lo' ? 'ອະນຸຍາດໃຫ້ຄືນເງິນ' : 'Allow Refunds'}</div>
                          <div className="text-xs font-black text-adv-slate">{selectedEvent.allowRefunds ? 'Yes' : 'No'}</div>
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
                    {(() => {
                      const orgEmail = selectedEvent.organizerEmail || 
                        (typeof selectedEvent.organizerInfo === 'object' ? selectedEvent.organizerInfo?.email : null) || 
                        (selectedEvent.organizerContact && selectedEvent.organizerContact.includes('@') ? selectedEvent.organizerContact : null);
                      const orgBio = (typeof selectedEvent.organizerInfo === 'string' && selectedEvent.organizerInfo.trim()) 
                        ? selectedEvent.organizerInfo.trim() 
                        : (selectedEvent.organizerBio || (typeof selectedEvent.organizerInfo === 'object' ? selectedEvent.organizerInfo?.bio : null) || selectedEvent.aboutOrganizer || '');
                      const orgPhone = selectedEvent.organizerPhone || 
                        (typeof selectedEvent.organizerInfo === 'object' ? selectedEvent.organizerInfo?.phone : null) || 
                        (selectedEvent.organizerContact && !selectedEvent.organizerContact.includes('@') ? selectedEvent.organizerContact : null);

                      return (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                          <div className="flex items-center gap-4">
                            {selectedEvent.organizerLogo || (selectedEvent.organizerInfo && selectedEvent.organizerInfo.logoUrl) ? (
                              <img src={selectedEvent.organizerLogo || selectedEvent.organizerInfo?.logoUrl} alt={selectedEvent.organizer || 'Organizer'} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange font-black text-xl shrink-0">
                                {(selectedEvent.organizerInfo?.name || selectedEvent.organizer || 'O').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-400 font-bold uppercase">{lang === 'lo' ? 'ຜູ້ຈັດງານ' : 'Organized by'}</div>
                              <div className="text-base font-extrabold text-adv-slate truncate">{selectedEvent.organizerInfo?.name || selectedEvent.organizer || 'Organizer Name'}</div>
                              {orgEmail && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium mt-1">
                                  <Mail className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                                  <a href={`mailto:${orgEmail}`} className="text-adv-slate hover:text-adv-orange underline underline-offset-2 transition-colors truncate">
                                    {orgEmail}
                                  </a>
                                </div>
                              )}
                              {orgPhone && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span>{orgPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Organizer Bio Section */}
                          <div className="pt-3 border-t border-gray-100">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-adv-orange" />
                              <span>{lang === 'lo' ? 'ກ່ຽວກັບຜູ້ຈັດງານ (Bio)' : 'About Organizer / Bio'}</span>
                            </div>
                            {orgBio ? (
                              <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 whitespace-pre-line">
                                {orgBio}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 italic bg-gray-50/50 rounded-xl p-3 border border-gray-100/60">
                                {lang === 'lo' ? 'ບໍ່ມີຂໍ້ມູນ bio ທີ່ລະບຸ' : 'No organizer bio provided'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    

                    
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
                              {(() => {
                                const bName = (selectedEvent.paymentInfo.bankName || '').toLowerCase();
                                let logo = '';
                                if (bName.includes('bcel')) logo = '/BCEL.png';
                                else if (bName.includes('ldb')) logo = '/LDB.png';
                                else if (bName.includes('jdb')) logo = '/JDB.png';
                                else if (bName.includes('ib') || bName.includes('indochina')) logo = '/IB.png';
                                else if (bName.includes('st')) logo = '/ST.png';
                                return (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    {logo && (
                                      <div className="w-5 h-5 rounded-md bg-white border border-gray-200 p-0.5 flex items-center justify-center shrink-0">
                                        <img src={logo} alt={selectedEvent.paymentInfo.bankName} className="w-full h-full object-contain" />
                                      </div>
                                    )}
                                    <span className="text-xs text-gray-600 font-bold">{selectedEvent.paymentInfo.bankName}</span>
                                  </div>
                                );
                              })()}
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
                    {/* Financial Performance & Tickets Sold for Selected Event */}
                    {(() => {
                      const fin = getEventFinancialSummary(selectedEvent);
                      const isEventPast = new Date(`${selectedEvent.date}T23:59:59`) < new Date();
                      return (
                        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 rounded-2xl p-5 shadow-sm border border-emerald-200/80 space-y-4">
                          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Wallet className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                  {lang === 'lo' ? 'ຍອດຂາຍ & ເງິນທີ່ຈະໄດ້ຮັບ' : 'Sales & Money Can Get'}
                                </h4>
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  {isEventPast 
                                    ? (lang === 'lo' ? 'Event ທີ່ສຳເລັດແລ້ວ' : 'Event Completed') 
                                    : (lang === 'lo' ? 'Event ທີ່ຈະມາເຖິງ' : 'Upcoming Event')}
                                </span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                              fin.payoutStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              fin.payoutStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {fin.payoutStatus === 'paid' ? (lang === 'lo' ? 'ເບີກຈ່າຍແລ້ວ' : 'Paid') :
                               fin.payoutStatus === 'pending' ? (lang === 'lo' ? 'ລໍຖ້າເບີກຈ່າຍ' : 'Pending Payout') :
                               (lang === 'lo' ? 'ພ້ອມເບີກຈ່າຍ' : 'Ready')}
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {/* Tickets sold */}
                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-adv-orange shrink-0" />
                                <span className="text-xs font-bold text-gray-500">
                                  {lang === 'lo' ? 'ປີ້ທີ່ຂາຍແລ້ວ' : 'Ticket Has Sold'}
                                </span>
                              </div>
                              <span className="text-sm font-black text-adv-slate">
                                {fin.ticketsSold.toLocaleString()} <span className="text-xs font-medium text-gray-400">/ {fin.totalCapacity.toLocaleString()}</span>
                              </span>
                            </div>

                            {/* Gross sales */}
                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-xs font-bold text-gray-500">
                                  {lang === 'lo' ? 'ຍອດຂາຍລວມ' : 'Gross Revenue'}
                                </span>
                              </div>
                              <span className="text-sm font-black text-adv-slate truncate">
                                {new Intl.NumberFormat('lo-LA').format(fin.grossRevenue)} ₭
                              </span>
                            </div>

                            {/* Money can get (Payout) */}
                            <div className="flex items-center justify-between p-2.5 bg-emerald-600 text-white rounded-xl shadow-2xs">
                              <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 shrink-0" />
                                <span className="text-xs font-black text-emerald-100">
                                  {lang === 'lo' ? 'ເງິນທີ່ຈະໄດ້ຮັບ (Payout)' : 'Money Can Get'}
                                </span>
                              </div>
                              <span className="text-sm font-black truncate">
                                {new Intl.NumberFormat('lo-LA').format(fin.moneyCanGet)} ₭
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
                              <span>{lang === 'lo' ? 'ຄ່າທຳນຽມລະບົບ 10%' : 'Platform fee 10%'}</span>
                              <span>-{new Intl.NumberFormat('lo-LA').format(fin.platformFeeAmount)} ₭</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Event Daily Ticket Sales Trend Line Chart */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-adv-slate">
                          <TrendingUp className="w-3.5 h-3.5 text-adv-orange" />
                          <span>{lang === 'lo' ? 'ແນວໂນ້ມການຂາຍປີ້ 14 ວັນ' : '14-Day Daily Ticket Sales'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                          {selectedEventDailyTrend.reduce((sum, d) => sum + d.tickets, 0)} {lang === 'lo' ? 'ໃບ' : 'tix'}
                        </span>
                      </div>
                      <div className="h-28 w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedEventDailyTrend} margin={{ top: 5, right: 8, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-gray-900 text-white rounded-xl px-2.5 py-1.5 text-[10px] shadow-lg border border-gray-800">
                                      <div className="font-bold text-orange-400">{d.fullDate}</div>
                                      <div className="flex items-center justify-between gap-3 mt-1">
                                        <span className="text-gray-300">{lang === 'lo' ? 'ປີ້' : 'Tickets'}:</span>
                                        <span className="font-black text-white">{d.tickets} {lang === 'lo' ? 'ໃບ' : ''}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3 mt-0.5">
                                        <span className="text-gray-300">{lang === 'lo' ? 'ລາຍຮັບ' : 'Revenue'}:</span>
                                        <span className="font-bold text-emerald-400">{new Intl.NumberFormat('lo-LA').format(d.revenue)} ₭</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="tickets" 
                              stroke="#FF5B00" 
                              strokeWidth={2.5} 
                              dot={{ r: 2, fill: '#FF5B00' }} 
                              activeDot={{ r: 4.5, fill: '#FF5B00', stroke: '#ffffff', strokeWidth: 1.5 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
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
                        <div className="relative flex flex-col justify-end pb-1">
                          <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 hover:bg-orange-50 px-5 py-4 rounded-2xl transition-all border border-gray-100 hover:border-adv-orange/30">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox"
                                checked={!!editingEvent.featured}
                                onChange={(e) => setEditingEvent({...editingEvent, featured: e.target.checked})}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 rounded-full transition-colors ${editingEvent.featured ? 'bg-adv-orange' : 'bg-gray-300'}`}></div>
                              <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${editingEvent.featured ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </div>
                            <span className={`text-sm font-black uppercase tracking-wider ${editingEvent.featured ? 'text-adv-orange' : 'text-gray-400 group-hover:text-adv-slate'}`}>
                              {lang === 'lo' ? 'ແນະນຳໃນໜ້າຫຼັກ' : 'Featured Event'}
                            </span>
                          </label>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
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

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{lang === 'lo' ? 'ເບີໂທລະສັບ' : 'Phone Number'}</label>
                      <input 
                        type="text" 
                        value={editingUser.phone || ""}
                        onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                        placeholder="+856 20 ..."
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 text-adv-slate font-bold shadow-inner focus:outline-none focus:border-adv-orange/30 transition-all"
                      />
                    </div>

                    {editingUser.role === 'organizer' && (
                      <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100/60 space-y-4">
                        <div className="text-xs font-black text-adv-orange uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {lang === 'lo' ? 'ຂໍ້ມູນຜູ້ຈັດງານ' : 'Organizer Details'}
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">{t.organization}</label>
                          <input 
                            type="text" 
                            value={editingUser.organization || ""}
                            onChange={(e) => setEditingUser({...editingUser, organization: e.target.value})}
                            placeholder="Company or Organization Name"
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">{lang === 'lo' ? 'ທະນາຄານ' : 'Bank'}</label>
                            <input 
                              type="text" 
                              value={editingUser.bankName || ""}
                              onChange={(e) => setEditingUser({...editingUser, bankName: e.target.value})}
                              placeholder="e.g. BCEL, JDB"
                              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">{lang === 'lo' ? 'ເລກບັນຊີ' : 'Account #'}</label>
                            <input 
                              type="text" 
                              value={editingUser.accountNumber || ""}
                              onChange={(e) => setEditingUser({...editingUser, accountNumber: e.target.value})}
                              placeholder="0101..."
                              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}
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

      {/* Document / Image Viewer Modal */}
      <AnimatePresence>
        {viewingIdCardUrl && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-gray-900/90 backdrop-blur-md overflow-y-auto"
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
        {showRejectionModal && (selectedEvent || selectedPendingIds.length > 0) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl border border-white/20"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-5 font-bold shadow-sm border border-red-100 mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-black text-adv-slate text-center mb-2 uppercase tracking-tight">{t.rejectEvent}</h3>
              <p className="text-gray-500 text-center text-sm font-medium mb-6 leading-relaxed">
                {selectedEvent ? (
                  <>
                    {lang === 'en' ? 'Are you sure you want to reject' : 'ທ່ານແນ່ໃຈບໍ່ວ່າຈະປະຕິເສດ'} <span className="text-adv-slate font-black">"{selectedEvent.title}"</span>? {lang === 'en' ? 'Please provide feedback to the organizer.' : 'ກະລຸນາລະບຸເຫດຜົນເພື່ອແຈ້ງຜູ້ຈັດງານ.'}
                  </>
                ) : (
                  <>
                    {lang === 'en' ? `Reject ${selectedPendingIds.length} selected events at once?` : `ປະຕິເສດ ${selectedPendingIds.length} ກິດຈະກຳທີ່ເລືອກພ້ອມກັນ?`}
                  </>
                )}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">
                    {lang === 'en' ? 'Quick Reason Presets' : 'ເຫດຜົນດ່ວນທີ່ພົບເລື້ອຍ'}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      t.rejectReasonPreset1,
                      t.rejectReasonPreset2,
                      t.rejectReasonPreset3,
                      t.rejectReasonPreset4,
                      t.rejectReasonPreset5,
                    ].filter(Boolean).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setComment(preset)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors text-left"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t.addComment}</label>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner focus-within:border-red-200 transition-colors">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.addCommentPlaceholder}
                    className="w-full bg-transparent border-none text-sm text-adv-slate font-medium placeholder:text-gray-300 focus:outline-none focus:ring-0 resize-none min-h-[100px]"
                  />
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={() => {
                      if (selectedEvent) {
                        handleReject(selectedEvent.id, comment);
                      } else {
                        handleBatchReject(comment);
                      }
                    }}
                    disabled={!comment.trim()}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-100 hover:bg-red-600 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    {t.reject}
                  </button>
                  <button 
                    onClick={() => {
                      setShowRejectionModal(false);
                      setComment('');
                      if (!selectedEvent) setSelectedPendingIds([]);
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

      {/* Role Change Confirmation Modal */}
      <AnimatePresence>
        {roleConfirmData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                    roleConfirmData.targetRole === 'organizer'
                      ? 'bg-orange-50 text-adv-orange border-orange-100'
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {roleConfirmData.targetRole === 'organizer' ? (
                      <Building2 className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-adv-slate">
                      {roleConfirmData.targetRole === 'organizer'
                        ? t.confirmPromoteTitle
                        : t.confirmDemoteTitle}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {roleConfirmData.targetRole === 'organizer'
                        ? t.confirmPromoteSubtitle
                        : t.confirmDemoteSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleConfirmData(null)}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-adv-slate hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* User Info & Role Transition Box */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-adv-slate text-white flex items-center justify-center font-black text-sm shrink-0">
                      {roleConfirmData.user.name ? roleConfirmData.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-adv-slate truncate">
                        {roleConfirmData.user.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {roleConfirmData.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Role Transition Badges */}
                  <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {t.currentRole}
                      </span>
                      <span className="mt-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white border border-gray-200 text-gray-600 capitalize">
                        {roleConfirmData.user.role || (roleConfirmData.targetRole === 'organizer' ? 'user' : 'organizer')}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-400 mx-2 shrink-0" />

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {t.newRole}
                      </span>
                      <span className={`mt-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${
                        roleConfirmData.targetRole === 'organizer'
                          ? 'bg-orange-50 text-adv-orange border-orange-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {roleConfirmData.targetRole}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-100/80 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-medium">
                    {roleConfirmData.targetRole === 'organizer'
                      ? t.confirmPromoteDesc
                      : t.confirmDemoteDesc}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRoleConfirmData(null)}
                  className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRoleChange}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-colors shadow-sm ${
                    roleConfirmData.targetRole === 'organizer'
                      ? 'bg-adv-orange hover:bg-orange-600 shadow-orange-200/50'
                      : 'bg-adv-slate hover:bg-black shadow-slate-300/50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t.confirmChange}
                </button>
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
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 sm:p-10 overflow-y-auto"
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
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop';
              }}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
