import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, CalendarDays, Clock, Users, CheckCircle2, XCircle, AlertCircle, 
  Search, Plus, Download, ChevronLeft, ChevronRight, PauseCircle, PlayCircle, 
  Edit2, Save, Phone, Mail, FileText, Sparkles, Filter, ArrowRight, 
  UserCheck, RotateCcw, Check, Lock, Unlock, Sun, Moon, Info, Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { LaoEvent } from '../data/events';
import { EventAttendee } from '../lib/checkinsStore';

interface BookingDayManagementProps {
  event: LaoEvent;
  attendees: EventAttendee[];
  onToggleCheckin: (ticketIdOrId: string, currentStatus: boolean, staffLabel?: string) => void;
  onAddAttendee: (attendee: Partial<EventAttendee>) => void;
  onRescheduleAttendee?: (ticketIdOrId: string, newDate: string, newTimeSlot: string) => void;
  theme: 'dark' | 'light';
  lang: 'en' | 'lo';
  onOpenScanner?: () => void;
}

interface DayOverride {
  isClosed?: boolean;
  notes?: string;
  slotOverrides?: Record<string, {
    isPaused?: boolean;
    extraCapacity?: number;
  }>;
}

// Translations dictionary
const t = {
  en: {
    dailyBookingTitle: 'Daily Booking Operations',
    dailyBookingSubtitle: 'Schedule & slot management for multi-day booking experience',
    dayByDayView: 'Day-by-Day View',
    masterDirectory: 'All Bookings Directory',
    selectDay: 'Select Operating Day',
    today: 'Today',
    tomorrow: 'Tomorrow',
    dayStatus: 'Operating Status',
    dayOpen: 'Open for Bookings',
    dayClosed: 'Closed / Day Off',
    markDayClosed: 'Pause / Close Day',
    markDayOpen: 'Open This Day',
    dayNote: 'Daily Operations Note',
    dayNotePlaceholder: 'Add staff notes for today (e.g. Head chef on duty, weather forecast, private bookings)...',
    saved: 'Saved',
    totalBookedToday: 'Booked Today',
    todayCapacity: 'Daily Capacity',
    occupancyRate: 'Occupancy Rate',
    arrivedToday: 'Checked-In / Arrived',
    expectedToday: 'Pending Arrival',
    activeSlots: 'Active Time Slots',
    estimatedRevenue: 'Est. Day Revenue',
    timeSlotsGrid: 'Time Slots for Selected Day',
    timeSlotsDesc: 'Real-time capacity and booking distribution per session',
    filterBySlot: 'Filter Guests',
    allSlots: 'All Slots',
    pauseSlot: 'Pause Slot',
    resumeSlot: 'Open Slot',
    slotPausedBadge: 'Paused / Closed',
    slotSoldOutBadge: 'Sold Out',
    slotAvailableBadge: 'Available',
    slotFillingFastBadge: 'Filling Fast',
    adjustCap: 'Adjust Capacity',
    guestRoster: 'Guests Booked for',
    searchGuestPlaceholder: 'Search name, phone, ticket ID...',
    allStatus: 'All Guests',
    checkedInStatus: 'Checked In',
    pendingStatus: 'Pending',
    addWalkin: '+ Add Walk-in Guest',
    exportDayRoster: 'Export Day Manifest',
    exportAllRoster: 'Export All Manifest',
    noGuestsForDay: 'No bookings found for this operating day.',
    noGuestsDesc: 'Share your event link or click "+ Add Walk-in Guest" to register an on-site guest.',
    guestName: 'Guest Name',
    contact: 'Contact',
    ticketTier: 'Ticket Tier',
    slot: 'Time Slot',
    status: 'Check-in Status',
    actions: 'Actions',
    checkinNow: 'Check In',
    checkedInAt: 'Arrived at',
    rescheduleSlot: 'Move Slot',
    viewAnswers: 'Questionnaire',
    modalWalkinTitle: 'Add On-Site Walk-In Booking',
    modalWalkinSubtitle: 'Register a guest directly into today\'s schedule',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email Address (Optional)',
    selectSlot: 'Select Time Slot',
    selectTier: 'Select Ticket Tier',
    guestCount: 'Number of Guests',
    markAsCheckedIn: 'Mark as Checked-In immediately upon creation',
    cancel: 'Cancel',
    confirmBooking: 'Create Booking',
    modalRescheduleTitle: 'Reschedule Guest Booking',
    modalRescheduleSubtitle: 'Move guest to another date or session slot',
    newDate: 'New Booking Date',
    newSlot: 'New Time Slot',
    saveReschedule: 'Update Booking',
    modalAnswersTitle: 'Attendee Questionnaire Responses',
    noAnswersAvailable: 'No questionnaire answers recorded for this booking.',
    allDatesListTitle: 'Master Bookings Directory (All Dates)',
    date: 'Booking Date',
    bookingTypeNotice: 'Booking Event: Capacity is partitioned by calendar date and session slot.',
    instantConfirm: 'Instant Booking',
    approvalMode: 'Requires Approval'
  },
  lo: {
    dailyBookingTitle: 'ການຈັດການຈອງລາຍວັນ',
    dailyBookingSubtitle: 'ຕາຕະລາງ ແລະ ການຄຸ້ມຄອງຮອບເວລາສຳລັບກິດຈະກຳແບບຈອງລາຍວັນ',
    dayByDayView: 'ເບິ່ງລາຍວັນ (Day-by-Day)',
    masterDirectory: 'ລາຍຊື່ການຈອງທັງໝົດ (All)',
    selectDay: 'ເລືອກວັນທີໃຫ້ບໍລິການ',
    today: 'ມື້ນີ້',
    tomorrow: 'ມື້ອື່ນ',
    dayStatus: 'ສະຖານະການເປີດຮັບ',
    dayOpen: 'ເປີດຮັບການຈອງ',
    dayClosed: 'ປິດໃຫ້ບໍລິການ / ວັນພັກ',
    markDayClosed: 'ປິດຮັບວັນນີ້',
    markDayOpen: 'ເປີດຮັບວັນນີ້',
    dayNote: 'ບັນທຶກປະຈຳວັນຂອງທີມງານ',
    dayNotePlaceholder: 'ເພີ່ມບັນທຶກການປະຕິບັດງານ (ເຊັ່ນ: ຫົວໜ້າຄົວປະຈຳການ, ສະພາບອາກາດ, ກຸ່ມ VIP)...',
    saved: 'ບັນທຶກແລ້ວ',
    totalBookedToday: 'ຈອງແລ້ວມື້ນີ້',
    todayCapacity: 'ຄວາມຈຸປະຈຳວັນ',
    occupancyRate: 'ອັດຕາການຈອງ',
    arrivedToday: 'ເຊັກອິນແລ້ວ / ມາຮອດ',
    expectedToday: 'ລໍຖ້າເຊັກອິນ',
    activeSlots: 'ຮອບເວລາທີ່ເປີດ',
    estimatedRevenue: 'ລາຍຮັບປະຈຳວັນ',
    timeSlotsGrid: 'ຮອບເວລາປະຈຳວັນທີ່ເລືອກ',
    timeSlotsDesc: 'ຄວາມຈຸໃນເວລາຈິງ ແລະ ການແຈກຢາຍການຈອງແຕ່ລະຮອບ',
    filterBySlot: 'ກັ່ນຕອງແຂກຮອບນີ້',
    allSlots: 'ທຸກຮອບເວລາ',
    pauseSlot: 'ພັກຮອບນີ້',
    resumeSlot: 'ເປີດຮອບນີ້',
    slotPausedBadge: 'ປິດຮອບນີ້',
    slotSoldOutBadge: 'ເຕັມແລ້ວ',
    slotAvailableBadge: 'ວ່າງ',
    slotFillingFastBadge: 'ໃກ້ຈະເຕັມ',
    adjustCap: 'ປັບຄວາມຈຸ',
    guestRoster: 'ລາຍຊື່ແຂກທີ່ຈອງສຳລັບ',
    searchGuestPlaceholder: 'ຄົ້ນຫາຊື່, ເບີໂທ, ລະຫັດປີ້...',
    allStatus: 'ແຂກທັງໝົດ',
    checkedInStatus: 'ເຊັກອິນແລ້ວ',
    pendingStatus: 'ລໍຖ້າ',
    addWalkin: '+ ເພີ່ມແຂກ Walk-in',
    exportDayRoster: 'ດາວໂຫຼດລາຍຊື່ວັນນີ້',
    exportAllRoster: 'ດາວໂຫຼດລາຍຊື່ທັງໝົດ',
    noGuestsForDay: 'ຍັງບໍ່ມີການຈອງໃນວັນທີເລືອກນີ້.',
    noGuestsDesc: 'ແບ່ງປັນລິ້ງກິດຈະກຳ ຫຼື ກົດ "+ ເພີ່ມແຂກ Walk-in" ເພື່ອລົງທະບຽນແຂກຢູ່ໜ້າງານ.',
    guestName: 'ຊື່ແຂກ',
    contact: 'ຂໍ້ມູນຕິດຕໍ່',
    ticketTier: 'ປະເພດປີ້',
    slot: 'ຮອບເວລາ',
    status: 'ສະຖານະເຊັກອິນ',
    actions: 'ຈັດການ',
    checkinNow: 'ເຊັກອິນ',
    checkedInAt: 'ມາຮອດເວລາ',
    rescheduleSlot: 'ປ່ຽນຮອບເວລາ',
    viewAnswers: 'ເບິ່ງແບບສອບຖາມ',
    modalWalkinTitle: 'ເພີ່ມແຂກ Walk-in ໜ້າງານ',
    modalWalkinSubtitle: 'ລົງທະບຽນແຂກເຂົ້າຕາຕະລາງຮອບເວລາມື້ນີ້ໂດຍກົງ',
    fullName: 'ຊື່ ແລະ ນາມສະກຸນ',
    phoneNumber: 'ເບີໂທລະສັບ',
    emailAddress: 'ອີເມລ (ຖ້າມີ)',
    selectSlot: 'ເລືອກຮອບເວລາ',
    selectTier: 'ເລືອກປະເພດປີ້',
    guestCount: 'ຈຳນວນແຂກ',
    markAsCheckedIn: 'ໝາຍວ່າເຊັກອິນທັນທີຫຼັງສ້າງ',
    cancel: 'ຍົກເລີກ',
    confirmBooking: 'ຢືນຢັນການຈອງ',
    modalRescheduleTitle: 'ປ່ຽນວັນທີ ຫຼື ຮອບເວລາຂອງແຂກ',
    modalRescheduleSubtitle: 'ຍ້າຍແຂກໄປຮອບເວລາ ຫຼື ວັນທີອື່ນ',
    newDate: 'ວັນທີຈອງໃໝ່',
    newSlot: 'ຮອບເວລາໃໝ່',
    saveReschedule: 'ບັນທຶກການປ່ຽນແປງ',
    modalAnswersTitle: 'ຄຳຕອບແບບສອບຖາມຂອງແຂກ',
    noAnswersAvailable: 'ບໍ່ມີຂໍ້ມູນແບບສອບຖາມສຳລັບການຈອງນີ້.',
    allDatesListTitle: 'ລາຍຊື່ການຈອງທັງໝົດ (ທຸກວັນທີ)',
    date: 'ວັນທີຈອງ',
    bookingTypeNotice: 'ກິດຈະກຳແບບຈອງ: ຄວາມຈຸຖືກແບ່ງຕາມວັນທີ ແລະ ຮອບເວລາໃນແຕ່ລະມື້.',
    instantConfirm: 'ຢືນຢັນການຈອງທັນທີ',
    approvalMode: 'ຕ້ອງຜ່ານການອະນຸມັດ'
  }
};

const LAO_MONTHS = [
  'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
  'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'
];

const LAO_DAYS = [
  'ວັນອາທິດ', 'ວັນຈັນ', 'ວັນອັງຄານ', 'ວັນພຸດ', 'ວັນພະຫັດ', 'ວັນສຸກ', 'ວັນເສົາ'
];

const LAO_DAYS_SHORT = [
  'ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'
];

export default function BookingDayManagement({
  event,
  attendees,
  onToggleCheckin,
  onAddAttendee,
  onRescheduleAttendee,
  theme,
  lang,
  onOpenScanner
}: BookingDayManagementProps) {
  const currentLang = lang === 'lo' ? t.lo : t.en;
  
  // Format today's date in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today if within range, or event start date
    if (event.bookingStartDate && event.bookingStartDate > todayStr) {
      return event.bookingStartDate;
    }
    return todayStr;
  });

  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('all');
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Day Overrides (Closure, notes, paused slots, capacity adjustments)
  const [dayOverrides, setDayOverrides] = useState<Record<string, DayOverride>>(() => {
    try {
      const saved = localStorage.getItem(`pasopkan_day_overrides_${event.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    name: '',
    phone: '',
    email: '',
    slot: '',
    tierId: '',
    quantity: 1,
    markCheckedIn: true
  });

  const [rescheduleModalAttendee, setRescheduleModalAttendee] = useState<EventAttendee | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  const [answersModalAttendee, setAnswersModalAttendee] = useState<EventAttendee | null>(null);

  // Time slots for this event
  const eventSlots = useMemo(() => {
    if (event.bookingTimeSlots && event.bookingTimeSlots.length > 0) {
      return event.bookingTimeSlots;
    }
    if (event.timeSlots && event.timeSlots.length > 0) {
      return event.timeSlots;
    }
    return ['08:30 - 11:30', '11:30 - 14:30', '14:30 - 17:30'];
  }, [event]);

  // Set default slot for walk-in form
  useEffect(() => {
    if (eventSlots.length > 0 && !walkinForm.slot) {
      setWalkinForm(prev => ({
        ...prev,
        slot: eventSlots[0],
        tierId: event.ticketTiers?.[0]?.id || 't7'
      }));
    }
  }, [eventSlots, event.ticketTiers, walkinForm.slot]);

  // Save day overrides to localStorage
  const saveDayOverrides = (updated: Record<string, DayOverride>) => {
    setDayOverrides(updated);
    try {
      localStorage.setItem(`pasopkan_day_overrides_${event.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save day overrides:', e);
    }
  };

  const currentDayOverride = dayOverrides[selectedDate] || {};
  const isSelectedDayClosed = !!currentDayOverride.isClosed;

  // Toggle selected day open / closed
  const toggleDayStatus = () => {
    const updated = {
      ...dayOverrides,
      [selectedDate]: {
        ...currentDayOverride,
        isClosed: !isSelectedDayClosed
      }
    };
    saveDayOverrides(updated);
  };

  // Toggle slot pause for selected day
  const toggleSlotPause = (slot: string) => {
    const slotOverrides = currentDayOverride.slotOverrides || {};
    const currentSlotData = slotOverrides[slot] || {};
    const updated = {
      ...dayOverrides,
      [selectedDate]: {
        ...currentDayOverride,
        slotOverrides: {
          ...slotOverrides,
          [slot]: {
            ...currentSlotData,
            isPaused: !currentSlotData.isPaused
          }
        }
      }
    };
    saveDayOverrides(updated);
  };

  // Helper to format dates nicely
  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    if (lang === 'lo') {
      const dayName = LAO_DAYS[d.getDay()];
      const monthName = LAO_MONTHS[month];
      return `${dayName}, ${day} ${monthName} ${year}`;
    } else {
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Compute 14 days centered strip
  const dateStrip = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const result: { dateStr: string; dayNum: number; dayName: string; monthName: string; isToday: boolean; isSelected: boolean }[] = [];

    for (let i = -3; i <= 10; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const str = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const monthIdx = d.getMonth();
      const dayIdx = d.getDay();

      result.push({
        dateStr: str,
        dayNum,
        dayName: lang === 'lo' ? LAO_DAYS_SHORT[dayIdx] : d.toLocaleDateString('en-US', { weekday: 'short' }),
        monthName: lang === 'lo' ? LAO_MONTHS[monthIdx] : d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: str === todayStr,
        isSelected: str === selectedDate
      });
    }
    return result;
  }, [selectedDate, todayStr, lang]);

  // Filter attendees for this event
  const thisEventAttendees = useMemo(() => {
    return attendees.filter(a => String(a.eventId) === String(event.id));
  }, [attendees, event.id]);

  // Filter attendees specifically for the selected date
  const selectedDateAttendees = useMemo(() => {
    return thisEventAttendees.filter(a => {
      const aDate = a.visitDate || (a.purchaseDate ? a.purchaseDate.split('T')[0] : '');
      return aDate === selectedDate;
    });
  }, [thisEventAttendees, selectedDate]);

  // Compute capacity per slot for the selected day (locked strictly to original submitted event capacity)
  const slotMetrics = useMemo(() => {
    return eventSlots.map(slot => {
      const baseCap = (event.bookingSlotCapacities && event.bookingSlotCapacities[slot]) 
        ? event.bookingSlotCapacities[slot] 
        : Number(event.bookingCapacity) || 12;
      
      const slotOverride = currentDayOverride.slotOverrides?.[slot];
      const capacity = Math.max(1, baseCap);
      const isPaused = !!slotOverride?.isPaused;

      // Attendees booked for this slot on this day
      const slotBookings = selectedDateAttendees.filter(a => a.timeSlot === slot);
      const bookedCount = slotBookings.length;
      const arrivedCount = slotBookings.filter(a => a.isCheckedIn).length;
      const pendingCount = bookedCount - arrivedCount;
      const occupancyPct = Math.min(100, Math.round((bookedCount / capacity) * 100));

      let status: 'available' | 'filling' | 'full' | 'paused' = 'available';
      if (isPaused) {
        status = 'paused';
      } else if (bookedCount >= capacity) {
        status = 'full';
      } else if (occupancyPct >= 70) {
        status = 'filling';
      }

      return {
        slot,
        capacity,
        bookedCount,
        arrivedCount,
        pendingCount,
        occupancyPct,
        isPaused,
        status
      };
    });
  }, [eventSlots, event.bookingSlotCapacities, event.bookingCapacity, currentDayOverride, selectedDateAttendees]);

  // Daily totals
  const dailyTotalCapacity = useMemo(() => {
    return slotMetrics.reduce((acc, curr) => acc + (curr.isPaused ? 0 : curr.capacity), 0);
  }, [slotMetrics]);

  const dailyTotalBooked = useMemo(() => {
    return selectedDateAttendees.length;
  }, [selectedDateAttendees]);

  const dailyTotalArrived = useMemo(() => {
    return selectedDateAttendees.filter(a => a.isCheckedIn).length;
  }, [selectedDateAttendees]);

  const dailyTotalPending = useMemo(() => {
    return dailyTotalBooked - dailyTotalArrived;
  }, [dailyTotalBooked, dailyTotalArrived]);

  const dailyOccupancyPct = useMemo(() => {
    if (dailyTotalCapacity === 0) return 0;
    return Math.min(100, Math.round((dailyTotalBooked / dailyTotalCapacity) * 100));
  }, [dailyTotalBooked, dailyTotalCapacity]);

  const dailyTotalRevenue = useMemo(() => {
    return selectedDateAttendees.reduce((sum, att) => {
      const numeric = parseInt((att.price || '0').replace(/[^0-9]/g, ''), 10) || 0;
      return sum + numeric;
    }, 0);
  }, [selectedDateAttendees]);

  // Filter attendees for guest list table
  const displayedDailyAttendees = useMemo(() => {
    return selectedDateAttendees.filter(att => {
      // Slot filter
      if (selectedSlotFilter !== 'all' && att.timeSlot !== selectedSlotFilter) {
        return false;
      }
      // Status filter
      if (attendeeStatusFilter === 'checked_in' && !att.isCheckedIn) return false;
      if (attendeeStatusFilter === 'pending' && att.isCheckedIn) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = att.attendeeName.toLowerCase().includes(q);
        const matchPhone = (att.phone || '').toLowerCase().includes(q);
        const matchTicket = att.ticketId.toLowerCase().includes(q);
        const matchOrder = (att.orderId || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchTicket && !matchOrder) return false;
      }
      return true;
    });
  }, [selectedDateAttendees, selectedSlotFilter, attendeeStatusFilter, searchQuery]);

  // Shift day by delta
  const handleShiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Submit walk-in modal
  const handleCreateWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.name.trim()) return;

    const selectedTier = event.ticketTiers?.find(t => t.id === walkinForm.tierId) || event.ticketTiers?.[0];
    const priceStr = selectedTier ? `${(selectedTier.price * 1000).toLocaleString()} LAK` : '300,000 LAK';

    for (let i = 0; i < walkinForm.quantity; i++) {
      const now = new Date();
      const newAtt: Partial<EventAttendee> = {
        id: `att_walkin_${Date.now()}_${i + 1}`,
        ticketId: `tk_walk_${Date.now().toString().slice(-6)}_${i + 1}`,
        orderId: `ord_walk_${Date.now().toString().slice(-6)}`,
        eventId: String(event.id),
        firstName: walkinForm.name.split(' ')[0] || 'Walk-in',
        lastName: walkinForm.name.split(' ').slice(1).join(' ') || 'Guest',
        attendeeName: walkinForm.name.trim(),
        email: walkinForm.email.trim() || 'walkin@pasopkan.la',
        phone: walkinForm.phone.trim() || '+856 20 0000 0000',
        ticketType: selectedTier?.name || 'Walk-in Pass',
        tierId: selectedTier?.id,
        zone: 'Studio',
        seat: `Walk-in #${i + 1}`,
        price: priceStr,
        purchaseDate: new Date().toISOString(),
        visitDate: selectedDate,
        timeSlot: walkinForm.slot || eventSlots[0],
        isCheckedIn: walkinForm.markCheckedIn,
        checkedInTime: walkinForm.markCheckedIn ? now.toLocaleTimeString('en-GB', { hour12: false }) : undefined,
        checkedInTimestamp: walkinForm.markCheckedIn ? Date.now() : undefined,
        staffLabel: 'On-site Walkin Desk',
        customAnswers: {
          'booking_type': 'On-site Walk-in',
          'registered_by': 'Organizer Desk'
        }
      };

      onAddAttendee(newAtt);
    }

    setShowWalkinModal(false);
    setWalkinForm({
      name: '',
      phone: '',
      email: '',
      slot: eventSlots[0] || '',
      tierId: event.ticketTiers?.[0]?.id || 't7',
      quantity: 1,
      markCheckedIn: true
    });
  };

  // Open reschedule modal
  const handleOpenReschedule = (att: EventAttendee) => {
    setRescheduleModalAttendee(att);
    setRescheduleDate(att.visitDate || selectedDate);
    setRescheduleSlot(att.timeSlot || eventSlots[0]);
  };

  // Submit reschedule
  const handleSaveReschedule = () => {
    if (!rescheduleModalAttendee) return;
    if (onRescheduleAttendee) {
      onRescheduleAttendee(rescheduleModalAttendee.id, rescheduleDate, rescheduleSlot);
    }
    setRescheduleModalAttendee(null);
  };

  // Export Manifest
  const handleExportXLSX = (mode: 'day' | 'all') => {
    const listToExport = mode === 'day' ? selectedDateAttendees : thisEventAttendees;
    if (listToExport.length === 0) return;

    const data = listToExport.map((att, idx) => ({
      'No.': idx + 1,
      'Date': att.visitDate || att.purchaseDate?.split('T')[0] || '-',
      'Time Slot': att.timeSlot || 'General',
      'Guest Name': att.attendeeName,
      'Phone': att.phone || '-',
      'Email': att.email || '-',
      'Ticket Tier': att.ticketType,
      'Price': att.price || '-',
      'Ticket Code': att.ticketId,
      'Order ID': att.orderId || '-',
      'Check-in Status': att.isCheckedIn ? 'Checked In' : 'Pending',
      'Arrival Time': att.checkedInTime || '-',
      'Staff': att.staffLabel || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, mode === 'day' ? `Day_${selectedDate}` : 'All_Bookings');
    XLSX.writeFile(wb, `${event.title.replace(/\s+/g, '_')}_${mode === 'day' ? selectedDate : 'All_Bookings'}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Mode Selector */}
      <div className={`rounded-3xl p-5 sm:p-7 shadow-sm border transition-all ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {currentLang.dailyBookingTitle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {currentLang.instantConfirm}
              </span>
              {event.bookingDuration && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.bookingDuration} / session
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black">{event.title}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              {currentLang.dailyBookingSubtitle}
            </p>
          </div>

          {/* View Mode Toggle & Scanner button */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
              theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-100 border-gray-200/70'
            }`}>
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-adv-orange text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{currentLang.dayByDayView}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-adv-orange text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{currentLang.masterDirectory}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {thisEventAttendees.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowWalkinModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang.addWalkin}</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          {/* 2. Interactive Day-by-Day Navigator Strip */}
          <div className={`rounded-3xl p-4 sm:p-6 shadow-sm border transition-all ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-black">{currentLang.selectDay}</h4>
                  <p className="text-xs text-gray-400 font-medium">{formatDateDisplay(selectedDate)}</p>
                </div>
              </div>

              {/* Quick Jump Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-adv-orange text-white border-adv-orange shadow-sm'
                      : 'border-gray-200 dark:border-zinc-750 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {currentLang.today}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-zinc-750 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  {currentLang.tomorrow}
                </button>

                {/* Direct Native Date Picker */}
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1 border-l pl-2 border-gray-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleShiftDay(-1)}
                    className="p-1.5 rounded-xl border border-gray-200 dark:border-zinc-750 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftDay(1)}
                    className="p-1.5 rounded-xl border border-gray-200 dark:border-zinc-750 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Date Strip */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {dateStrip.map((item) => {
                // Count bookings for this strip date
                const dayBookings = thisEventAttendees.filter(a => {
                  const d = a.visitDate || (a.purchaseDate ? a.purchaseDate.split('T')[0] : '');
                  return d === item.dateStr;
                });
                const dayOverride = dayOverrides[item.dateStr];
                const isClosed = dayOverride?.isClosed;

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`shrink-0 w-20 py-2.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border relative ${
                      item.isSelected
                        ? 'bg-adv-orange text-white border-adv-orange shadow-md scale-105 ring-2 ring-orange-500/30 font-bold'
                        : isClosed
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 opacity-70'
                        : theme === 'dark'
                        ? 'bg-zinc-950 border-zinc-800 text-gray-300 hover:border-zinc-700'
                        : 'bg-gray-50 border-gray-200/70 text-gray-700 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    {item.isToday && (
                      <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 px-1.5 py-0.2 rounded-full ${
                        item.isSelected ? 'bg-white/30 text-white' : 'bg-adv-orange text-white'
                      }`}>
                        {currentLang.today}
                      </span>
                    )}
                    <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80">{item.dayName}</span>
                    <span className="text-xl font-black leading-tight my-0.5">{item.dayNum}</span>
                    <span className="text-[10px] opacity-75">{item.monthName}</span>
                    
                    {/* Capacity / Booking Dot */}
                    <div className="mt-1 flex items-center gap-1">
                      {isClosed ? (
                        <span className="text-[9px] font-bold text-rose-500">CLOSED</span>
                      ) : (
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                          item.isSelected
                            ? 'bg-white/20 text-white'
                            : dayBookings.length > 0
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-200/50 dark:bg-zinc-800 text-gray-400'
                        }`}>
                          {dayBookings.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Status & Operations Control Banner */}
            <div className={`mt-4 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isSelectedDayClosed
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isSelectedDayClosed
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-emerald-500 text-white border-emerald-600'
                }`}>
                  {isSelectedDayClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm sm:text-base">
                      {isSelectedDayClosed ? currentLang.dayClosed : currentLang.dayOpen}
                    </span>
                    <span className="text-xs opacity-75">({formatDateDisplay(selectedDate)})</span>
                  </div>
                  <p className="text-xs opacity-80">
                    {isSelectedDayClosed
                      ? 'No public bookings accepted for this day. Existing bookings remain intact.'
                      : 'Slots are active and accepting bookings based on configured capacity.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleDayStatus}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isSelectedDayClosed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isSelectedDayClosed ? currentLang.markDayOpen : currentLang.markDayClosed}
                </button>
              </div>
            </div>

            {currentDayOverride.notes && (
              <div className="mt-3 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{currentDayOverride.notes}</span>
              </div>
            )}
          </div>

          {/* 3. Daily Executive KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Bookings */}
            <div className={`rounded-3xl p-4 sm:p-5 border shadow-sm transition-all ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">{currentLang.totalBookedToday}</span>
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-adv-orange flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl sm:text-3xl font-black">{dailyTotalBooked}</h4>
                <span className="text-xs font-semibold text-gray-400">/ {dailyTotalCapacity}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dailyOccupancyPct >= 90 ? 'bg-rose-500' : dailyOccupancyPct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${dailyOccupancyPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 mt-1 block">
                {dailyOccupancyPct}% {currentLang.occupancyRate}
              </span>
            </div>

            {/* Check-in Arrivals */}
            <div className={`rounded-3xl p-4 sm:p-5 border shadow-sm transition-all ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">{currentLang.arrivedToday}</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{dailyTotalArrived}</h4>
                <span className="text-xs font-semibold text-gray-400">{currentLang.arrivedToday}</span>
              </div>
              <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span>{dailyTotalPending} {currentLang.expectedToday}</span>
              </div>
            </div>

            {/* Active Time Slots */}
            <div className={`rounded-3xl p-4 sm:p-5 border shadow-sm transition-all ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">{currentLang.activeSlots}</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl sm:text-3xl font-black">
                  {slotMetrics.filter(s => !s.isPaused).length}
                </h4>
                <span className="text-xs font-semibold text-gray-400">/ {eventSlots.length}</span>
              </div>
              <div className="mt-3 text-xs text-gray-400 font-semibold flex items-center gap-1">
                <span>{slotMetrics.filter(s => s.status === 'full').length} Sold Out</span>
              </div>
            </div>

            {/* Day's Estimated Revenue */}
            <div className={`rounded-3xl p-4 sm:p-5 border shadow-sm transition-all ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">{currentLang.estimatedRevenue}</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <h4 className="text-xl sm:text-2xl font-black text-adv-orange truncate">
                  {dailyTotalRevenue.toLocaleString()}
                </h4>
                <span className="text-[10px] font-bold text-gray-400">LAK</span>
              </div>
              <div className="mt-3 text-xs text-gray-400 font-semibold truncate">
                {selectedDateAttendees.length} paid bookings
              </div>
            </div>
          </div>

          {/* 4. Time Slots Breakdown for Selected Day */}
          <div className={`rounded-3xl p-5 sm:p-7 shadow-sm border transition-all ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-adv-orange flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black">{currentLang.timeSlotsGrid}</h4>
                </div>
                <p className="text-xs text-gray-400 font-medium">{currentLang.timeSlotsDesc}</p>
              </div>

              {selectedSlotFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedSlotFilter('all')}
                  className="text-xs font-bold text-adv-orange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Show All Slots ({dailyTotalBooked})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {slotMetrics.map((s) => {
                const isSelectedSlot = selectedSlotFilter === s.slot;

                return (
                  <div
                    key={s.slot}
                    className={`rounded-2xl p-4 border transition-all relative ${
                      isSelectedSlot
                        ? 'border-adv-orange bg-orange-500/5 shadow-md ring-2 ring-orange-500/20'
                        : s.isPaused
                        ? 'bg-gray-100/50 dark:bg-zinc-950/50 border-dashed border-gray-300 dark:border-zinc-800 opacity-70'
                        : theme === 'dark'
                        ? 'bg-zinc-950 border-zinc-850 hover:border-zinc-750'
                        : 'bg-[#F9FAFB] border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-adv-orange flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="font-black text-sm sm:text-base">{s.slot}</span>
                      </div>

                      {/* Status Tag */}
                      {s.isPaused ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                          {currentLang.slotPausedBadge}
                        </span>
                      ) : s.status === 'full' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          {currentLang.slotSoldOutBadge}
                        </span>
                      ) : s.status === 'filling' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {currentLang.slotFillingFastBadge}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {currentLang.slotAvailableBadge}
                        </span>
                      )}
                    </div>

                    {/* Booked vs Capacity */}
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-gray-400 font-semibold">{currentLang.slotCapacity}</span>
                      <div className="text-right">
                        <span className="text-base font-black">{s.bookedCount}</span>
                        <span className="text-xs text-gray-400 font-medium"> / {s.capacity} spots</span>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          s.isPaused ? 'bg-gray-400' : s.occupancyPct >= 100 ? 'bg-rose-500' : s.occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${s.isPaused ? 0 : s.occupancyPct}%` }}
                      />
                    </div>

                    {/* Check-ins in this slot */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-3 pt-1 border-t border-gray-100 dark:border-zinc-850">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {s.arrivedCount} {currentLang.arrivedToday}
                      </span>
                      <span>{s.pendingCount} {currentLang.expectedToday}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-zinc-850">
                      <button
                        type="button"
                        onClick={() => setSelectedSlotFilter(isSelectedSlot ? 'all' : s.slot)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isSelectedSlot
                            ? 'bg-adv-orange text-white shadow-sm'
                            : 'bg-gray-200/60 dark:bg-zinc-800 hover:bg-adv-orange hover:text-white'
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                        <span>{isSelectedSlot ? 'Viewing' : currentLang.filterBySlot}</span>
                      </button>

                      {/* Pause Slot Button */}
                      <button
                        type="button"
                        onClick={() => toggleSlotPause(s.slot)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          s.isPaused 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' 
                            : 'border-gray-200 dark:border-zinc-800 hover:bg-rose-500/10 hover:text-rose-500'
                        }`}
                        title={s.isPaused ? currentLang.resumeSlot : currentLang.pauseSlot}
                      >
                        {s.isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Daily Attendee / Guest Roster */}
          <div className={`rounded-3xl p-5 sm:p-7 shadow-sm border transition-all ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
          }`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black">
                    {currentLang.guestRoster} {formatDateDisplay(selectedDate)}
                  </h4>
                  {selectedSlotFilter !== 'all' && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-adv-orange text-white">
                      {selectedSlotFilter}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-medium">
                  {displayedDailyAttendees.length} guests booked for this day
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLang.addWalkin}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportXLSX('day')}
                  disabled={selectedDateAttendees.length === 0}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-750 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-adv-orange" />
                  <span>{currentLang.exportDayRoster}</span>
                </button>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-5">
              {/* Slot Filter Pills - Wrap to show all without scrolling */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedSlotFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSlotFilter === 'all'
                      ? 'bg-adv-slate dark:bg-white text-white dark:text-adv-slate shadow-sm'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:text-adv-slate'
                  }`}
                >
                  {currentLang.allSlots} ({selectedDateAttendees.length})
                </button>
                {eventSlots.map(slot => {
                  const count = selectedDateAttendees.filter(a => a.timeSlot === slot).length;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlotFilter(slot)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSlotFilter === slot
                          ? 'bg-adv-orange text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:text-adv-slate'
                      }`}
                    >
                      {slot} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Status Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className={`p-0.5 rounded-xl border flex items-center ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-100 border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setAttendeeStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendeeStatusFilter === 'all' ? 'bg-white dark:bg-zinc-800 shadow-xs' : 'text-gray-400'
                    }`}
                  >
                    {currentLang.allStatus}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendeeStatusFilter('checked_in')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendeeStatusFilter === 'checked_in' ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-xs' : 'text-gray-400'
                    }`}
                  >
                    {currentLang.checkedInStatus}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendeeStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendeeStatusFilter === 'pending' ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-xs' : 'text-gray-400'
                    }`}
                  >
                    {currentLang.pendingStatus}
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={currentLang.searchGuestPlaceholder}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none font-medium ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Guest Cards / Roster */}
            {displayedDailyAttendees.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-adv-orange flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-base mb-1">{currentLang.noGuestsForDay}</h5>
                <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">{currentLang.noGuestsDesc}</p>
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(true)}
                  className="px-4 py-2 rounded-xl bg-adv-orange text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLang.addWalkin}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedDailyAttendees.map((att) => {
                  const hasAnswers = att.customAnswers && Object.keys(att.customAnswers).length > 0;

                  return (
                    <div
                      key={att.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-zinc-850 hover:border-zinc-750'
                          : 'bg-[#F9FAFB] border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {/* Guest Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center font-black text-sm shrink-0">
                          {att.firstName ? att.firstName[0].toUpperCase() : 'G'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h5 className="font-black text-sm sm:text-base truncate">{att.attendeeName}</h5>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200/80 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                              {att.ticketType}
                            </span>
                            {att.price && (
                              <span className="text-[11px] font-bold text-adv-orange">
                                {att.price}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium">
                            {att.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {att.phone}
                              </span>
                            )}
                            {att.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {att.email}
                              </span>
                            )}
                            <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-gray-500">
                              #{att.ticketId}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Slot Badge & Checkin Status & Actions */}
                      <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-zinc-850">
                        {/* Time Slot Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{att.timeSlot || 'General'}</span>
                        </div>

                        {/* Status badge */}
                        {att.isCheckedIn ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{currentLang.checkedInAt} {att.checkedInTime || 'Today'}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleCheckin(att.ticketId, false, 'Manage Event Desk')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{currentLang.checkinNow}</span>
                          </button>
                        )}

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-1">
                          {hasAnswers && (
                            <button
                              type="button"
                              onClick={() => setAnswersModalAttendee(att)}
                              className="p-2 rounded-xl border border-gray-200 dark:border-zinc-750 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-adv-orange cursor-pointer"
                              title={currentLang.viewAnswers}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(att)}
                            className="p-2 rounded-xl border border-gray-200 dark:border-zinc-750 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-adv-orange cursor-pointer"
                            title={currentLang.rescheduleSlot}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Master Directory View: All Dates */
        <div className={`rounded-3xl p-5 sm:p-7 shadow-sm border transition-all ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div>
              <h4 className="text-lg font-black">{currentLang.allDatesListTitle}</h4>
              <p className="text-xs text-gray-400 font-medium">
                {thisEventAttendees.length} total bookings recorded across all dates
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportXLSX('all')}
              className="px-4 py-2.5 rounded-2xl bg-adv-orange text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{currentLang.exportAllRoster}</span>
            </button>
          </div>

          <div className="space-y-3">
            {thisEventAttendees.map((att) => (
              <div
                key={att.id}
                className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F9FAFB] border-gray-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{att.attendeeName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-adv-orange font-semibold">
                      {att.ticketType}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-3">
                    <span>Date: <strong className="text-gray-600 dark:text-gray-300">{att.visitDate || 'General'}</strong></span>
                    <span>Slot: <strong className="text-gray-600 dark:text-gray-300">{att.timeSlot || '-'}</strong></span>
                    <span>Phone: {att.phone || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    att.isCheckedIn
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {att.isCheckedIn ? 'Checked In' : 'Pending'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenReschedule(att)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    {currentLang.rescheduleSlot}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Walk-in Modal */}
      <AnimatePresence>
        {showWalkinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h4 className="text-lg font-black">{currentLang.modalWalkinTitle}</h4>
                  <p className="text-xs text-gray-400">{formatDateDisplay(selectedDate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateWalkin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">{currentLang.fullName} *</label>
                  <input
                    type="text"
                    required
                    value={walkinForm.name}
                    onChange={(e) => setWalkinForm({ ...walkinForm, name: e.target.value })}
                    placeholder="e.g. Somphone Vongxay"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none font-medium ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">{currentLang.phoneNumber} *</label>
                    <input
                      type="text"
                      required
                      value={walkinForm.phone}
                      onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                      placeholder="+856 20 ..."
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none font-medium ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{currentLang.emailAddress}</label>
                    <input
                      type="email"
                      value={walkinForm.email}
                      onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                      placeholder="guest@example.la"
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none font-medium ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">{currentLang.selectSlot} *</label>
                    <select
                      value={walkinForm.slot}
                      onChange={(e) => setWalkinForm({ ...walkinForm, slot: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none font-medium ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                      }`}
                    >
                      {eventSlots.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">{currentLang.selectTier} *</label>
                    <select
                      value={walkinForm.tierId}
                      onChange={(e) => setWalkinForm({ ...walkinForm, tierId: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none font-medium ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                      }`}
                    >
                      {event.ticketTiers?.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({(t.price * 1000).toLocaleString()} LAK)</option>
                      )) || <option value="standard">Standard Pass</option>}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="markCheckedIn"
                    checked={walkinForm.markCheckedIn}
                    onChange={(e) => setWalkinForm({ ...walkinForm, markCheckedIn: e.target.checked })}
                    className="w-4 h-4 rounded text-adv-orange accent-adv-orange cursor-pointer"
                  />
                  <label htmlFor="markCheckedIn" className="text-xs font-bold cursor-pointer">
                    {currentLang.markAsCheckedIn}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowWalkinModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-750 text-xs font-bold cursor-pointer"
                  >
                    {currentLang.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    {currentLang.confirmBooking}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Reschedule Modal */}
      <AnimatePresence>
        {rescheduleModalAttendee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h4 className="text-lg font-black">{currentLang.modalRescheduleTitle}</h4>
                  <p className="text-xs text-gray-400">{rescheduleModalAttendee.attendeeName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRescheduleModalAttendee(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">{currentLang.newDate}</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none font-medium ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">{currentLang.newSlot}</label>
                  <select
                    value={rescheduleSlot}
                    onChange={(e) => setRescheduleSlot(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none font-medium ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  >
                    {eventSlots.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setRescheduleModalAttendee(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-750 text-xs font-bold cursor-pointer"
                  >
                    {currentLang.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReschedule}
                    className="px-5 py-2 rounded-xl bg-adv-orange text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    {currentLang.saveReschedule}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Questionnaire Responses Modal */}
      <AnimatePresence>
        {answersModalAttendee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h4 className="text-base font-black">{currentLang.modalAnswersTitle}</h4>
                  <p className="text-xs text-gray-400">{answersModalAttendee.attendeeName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnswersModalAttendee(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {Object.entries(answersModalAttendee.customAnswers || {}).map(([key, value]) => {
                  const displayKey = key === 'q_diet' ? 'Dietary Restrictions' :
                    key === 'q_allergies' ? 'Food Allergies' :
                    key === 'q_spice' ? 'Preferred Spice Level' :
                    key;

                  const displayVal = Array.isArray(value) ? value.join(', ') : String(value);

                  return (
                    <div key={key} className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850">
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        {displayKey}
                      </span>
                      <p className="text-sm font-semibold">{displayVal || '-'}</p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800 text-right">
                <button
                  type="button"
                  onClick={() => setAnswersModalAttendee(null)}
                  className="px-4 py-2 rounded-xl bg-adv-slate dark:bg-white text-white dark:text-adv-slate text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
