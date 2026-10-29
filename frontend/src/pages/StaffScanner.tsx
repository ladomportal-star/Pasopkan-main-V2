import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  Clock,
  Search,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  QrCode,
  Users,
  UserCheck,
  X,
  Eye,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { LaoEvent } from '../data/events';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api, type BackendCheckIn, type ScannerEvent } from '../lib/api';
import { fromBackendEvent } from '../lib/eventPayload';
import SEO from '../components/SEO';

const LazyScanner = React.lazy(
  () =>
    import('@yudiel/react-qr-scanner')
      .then((module) => ({ default: module.Scanner }))
      .catch((err) => {
        console.error('Failed to dynamically import react-qr-scanner:', err);
        return {
          default: () => (
            <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 shrink-0 flex items-center justify-center mb-4 border border-red-500/20">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                Scanner Camera Unavailable
              </h4>
              <p className="text-zinc-400 mb-6 font-bold text-xs leading-relaxed max-w-xs">
                Camera scanner requires HTTPS or camera permissions in browser.
              </p>
            </div>
          ),
        };
      }) as Promise<{ default: React.ComponentType<any> }>,
);

const formatTimeToHHMM = (timeStr?: string | null, timestamp?: number): string => {
  if (!timeStr && !timestamp) return '';
  if (timeStr) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const match = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
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

const translations = {
  en: {
    staffPortal: 'Staff Entry & Ticket Verification',
    scanTitle: 'Scan Ticket QR Code',
    scanDesc: 'Point staff camera at attendee ticket QR code or enter ticket code manually below.',
    manualTitle: 'Manual Ticket Verification',
    enterCodePlaceholder: 'Enter ticket code (e.g., PSK-123456789012-1)',
    verifyBtn: 'Verify Code',
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
    viewAnswers: 'View Answers',
    checkedIn: 'Checked In',
    questionnaireAnswers: 'Questionnaire Answers',
    close: 'Close',
    time: 'Time',
    phone: 'Phone',
    email: 'Email',
  },
  lo: {
    staffPortal: 'ລະບົບກວດສອບປີ້ ແລະ ເຊັກອິນສຳລັບພະນັກງານ',
    scanTitle: 'ສະແກນ QR Code ຂອງປີ້',
    scanDesc: 'ສ່ອງກ້ອງໃສ່ QR Code ຂອງປີ້ ຫຼື ປ້ອນລະຫັດປີ້ດ້ວຍຕົນເອງຢູ່ດ້ານລຸ່ມ.',
    manualTitle: 'ກວດສອບປີ້ດ້ວຍຕົນເອງ',
    enterCodePlaceholder: 'ປ້ອນລະຫັດປີ້ (ເຊັ່ນ: tk_981245 ຫຼື TK-123)',
    verifyBtn: 'ກວດສອບລະຫັດ',
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
    viewAnswers: 'ເບິ່ງຄຳຕອບ',
    checkedIn: 'ເຊັກອິນແລ້ວ',
    questionnaireAnswers: 'ຄຳຕອບແບບສອບຖາມ',
    close: 'ປິດ',
    time: 'ເວລາ',
    phone: 'ເບີໂທລະສັບ',
    email: 'ອີເມວ',
  },
};

export default function StaffScanner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const { user, token, loading: authLoading } = useAuth();
  const t = translations[lang] as unknown as Record<string, string>;

  const staffLabel = searchParams.get('staffLabel') || searchParams.get('gate') || 'Main Entrance Gate';

  const [scannerEvents, setScannerEvents] = useState<ScannerEvent[]>([]);
  const [eventId, setEventId] = useState<string>(searchParams.get('eventId') || '');
  const [eventsLoading, setEventsLoading] = useState(true);

  const emptyEvent = useMemo(
    () =>
      ({
        id: eventId,
        title: '',
        date: '',
        time: '',
        location: '',
        venue: '',
        image: '',
        category: 'Other',
        description: '',
        ticketTiers: [],
      }) as unknown as LaoEvent,
    [eventId],
  );
  const [selectedEvent, setSelectedEvent] = useState<LaoEvent>(emptyEvent);

  useEffect(() => {
    if (authLoading || !user || !token) {
      setEventsLoading(false);
      return;
    }
    let active = true;
    setEventsLoading(true);
    api
      .listScannerEvents({ token })
      .then((res) => {
        if (!active) return;
        const allowed = res.data?.events ?? [];
        setScannerEvents(allowed);
        const requested = searchParams.get('eventId');
        const chosen = allowed.find((ev) => ev.id === requested)?.id || allowed[0]?.id || '';
        setEventId(chosen);
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user?.id, token]);

  useEffect(() => {
    if (!eventId) {
      setSelectedEvent(emptyEvent);
      return;
    }
    let cancelled = false;
    api.getEvent(eventId, { token }).then((res) => {
      if (cancelled) return;
      if (res.data?.event) {
        const event = fromBackendEvent(res.data.event);
        const summary = scannerEvents.find((item) => item.id === eventId);
        // Scanner event summaries include the venue even when the full event
        // response omits it, so preserve that real API value for the header.
        if (!event.venue && summary?.venueName) {
          event.venue = summary.venueName;
        }
        if (!event.location && summary?.venueName) {
          event.location = summary.venueName;
        }
        setSelectedEvent(event);
      } else {
        const summary = scannerEvents.find((ev) => ev.id === eventId);
        if (summary) {
          setSelectedEvent({
            ...emptyEvent,
            id: summary.id,
            title: summary.title,
            date: summary.startDate ? summary.startDate.slice(0, 10) : '',
            location: summary.venueName || '',
            venue: summary.venueName || '',
          });
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, token, scannerEvents, emptyEvent]);

  const totalCapacity = useMemo(() => {
    if (selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0) {
      const sumTiers = selectedEvent.ticketTiers.reduce((sum, tier) => {
        const qty =
          (tier as { quantity?: string | number }).quantity !== 'unlimited' &&
          (tier as { quantity?: string | number }).quantity != null &&
          (tier as { quantity?: string | number }).quantity !== ''
            ? Number((tier as { quantity?: string | number }).quantity) || 0
            : Number.isFinite(Number(tier.available))
              ? Number(tier.available) + (Number((tier as { sold?: number }).sold) || 0)
              : 0;
        return sum + qty;
      }, 0);
      if (sumTiers > 0) return sumTiers;
    }
    if (selectedEvent.seatingZones && selectedEvent.seatingZones.length > 0) {
      const sumZones = selectedEvent.seatingZones.reduce((sum, z) => sum + (Number(z.capacity) || 0), 0);
      if (sumZones > 0) return sumZones;
    }
    if (
      selectedEvent.maxTickets &&
      !isNaN(parseInt(selectedEvent.maxTickets, 10)) &&
      parseInt(selectedEvent.maxTickets, 10) > 0
    ) {
      return parseInt(selectedEvent.maxTickets, 10);
    }
    return 0;
  }, [selectedEvent]);

  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannerPage, setScannerPage] = useState(1);
  const [checkins, setCheckins] = useState<BackendCheckIn[]>([]);
  const [selectedAttendeeForAnswers, setSelectedAttendeeForAnswers] = useState<{
    attendeeName: string;
    ticketType?: string;
    ticketId: string;
    email?: string;
    phone?: string;
    time?: string;
    timestamp?: number;
    customAnswers?: Record<string, string | string[]>;
  } | null>(null);

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
    checkedInTime?: string;
    checkedInStaff?: string;
    customAnswers?: Record<string, string | string[]>;
    isValid: boolean;
    isRefunded?: boolean;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  const refreshCheckins = useCallback(
    async (targetEventId: string) => {
      if (!targetEventId || !token) {
        setCheckins([]);
        return;
      }
      const res = await api.listCheckins(targetEventId, { token });
      if (res.ok && res.data) {
        setCheckins(res.data.checkIns ?? []);
      }
    },
    [token],
  );

  useEffect(() => {
    setScannedTicket(null);
    setManualCode('');
    if (!eventId || !token) return;
    void refreshCheckins(eventId);
  }, [eventId, token, refreshCheckins]);

  const lookupTicket = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode || !eventId || busy) return;

    setBusy(true);
    try {
      const res = await api.lookupTicket(cleanCode, { token });
      if (!res.ok || !res.data?.ticket) {
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
          isValid: false,
        });
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
        showToast(res.error || t.invalidTicket, 'error');
        return;
      }

      const ticket = res.data.ticket;
      if (ticket.eventId && String(ticket.eventId) !== String(eventId)) {
        setScannedTicket({
          ticketId: ticket.ticketCode,
          attendeeName: ticket.attendeeName || 'Guest',
          email: ticket.attendeeEmail || 'N/A',
          phone: ticket.attendeePhone || 'N/A',
          ticketType: ticket.tierName,
          zone: 'N/A',
          seat: 'N/A',
          price: `${ticket.unitPriceKip.toLocaleString()} LAK`,
          bookingDate: 'N/A',
          alreadyCheckedIn: false,
          isValid: false,
        });
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
        showToast(
          lang === 'lo' ? 'ປີ້ນີ້ແມ່ນຂອງກິດຈະກຳອື່ນ' : 'This ticket belongs to another event',
          'error',
        );
        return;
      }

      const isRefunded = ticket.itemStatus === 'refunded' || ticket.itemStatus === 'void';
      const isUnpaid = ticket.orderStatus !== 'confirmed' && ticket.orderStatus !== 'paid';
      const bookingDate = ticket.orderCreatedAt
        ? new Date(ticket.orderCreatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'N/A';
      const existingCheckin = checkins.find(
        (c) => c.ticketCode.toLowerCase() === cleanCode.toLowerCase(),
      );

      if (isRefunded || isUnpaid) {
        setScannedTicket({
          ticketId: ticket.ticketCode,
          attendeeName: ticket.attendeeName || 'Guest',
          email: ticket.attendeeEmail || 'N/A',
          phone: ticket.attendeePhone || 'N/A',
          ticketType: ticket.tierName,
          zone: ticket.zoneName || (selectedEvent.hasSeating ? 'VIP Zone A' : 'Main Arena'),
          seat: ticket.seatLabel || 'Standing Area',
          price: `${ticket.unitPriceKip.toLocaleString()} LAK`,
          bookingDate,
          alreadyCheckedIn: false,
          isValid: false,
          isRefunded,
        });
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
        showToast(
          isRefunded
            ? lang === 'lo'
              ? 'ປີ້ຖືກຄືນເງິນແລ້ວ - ລະຫັດບໍ່ຖືກຕ້ອງ!'
              : 'Ticket has been refunded - Invalid QR Code!'
            : lang === 'lo'
              ? 'ຍັງບໍ່ໄດ້ຊຳລະເງິນ'
              : 'This ticket has not been paid for',
          'error',
        );
        return;
      }

      const alreadyChecked = Boolean(ticket.alreadyCheckedIn || existingCheckin);
      setScannedTicket({
        ticketId: ticket.ticketCode,
        attendeeName: ticket.attendeeName || 'Guest',
        email: ticket.attendeeEmail || 'N/A',
        phone: ticket.attendeePhone || 'N/A',
        ticketType: ticket.tierName,
        zone: ticket.zoneName || (selectedEvent.hasSeating ? 'VIP Zone A' : 'Main Arena'),
        seat: ticket.seatLabel || 'Standing Area',
        price: `${ticket.unitPriceKip.toLocaleString()} LAK`,
        bookingDate,
        alreadyCheckedIn: alreadyChecked,
        checkedInTime: formatTimeToHHMM(ticket.checkedInAt || existingCheckin?.checkedInAt),
        checkedInStaff:
          ticket.checkedInBy || existingCheckin?.checkedInBy || existingCheckin?.gate || staffLabel,
        customAnswers: ticket.customAnswers || existingCheckin?.customAnswers || undefined,
        isValid: true,
      });

      if (alreadyChecked) {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        showToast(t.alreadyScanned, 'warning');
      } else {
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        showToast(t.validTicket, 'success');
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleTorch = async () => {
    try {
      const videoElement = document.querySelector('video');
      if (!videoElement) return;
      const stream = videoElement.srcObject as MediaStream;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities =
          (track.getCapabilities && (track.getCapabilities() as Record<string, unknown>)) || {};
        if (capabilities.torch) {
          const currentSettings = track.getSettings() as Record<string, unknown>;
          const newTorchState = !currentSettings.torch;
          await track.applyConstraints({
            advanced: [{ torch: newTorchState } as unknown as MediaTrackConstraintSet],
          });
          setIsTorchOn(Boolean(newTorchState));
        } else {
          showToast(
            lang === 'lo' ? 'ອຸປະກອນນີ້ບໍ່ຮອງຮັບໄຟສາຍ' : 'Flashlight not supported on this device',
            'error',
          );
        }
      }
    } catch (err) {
      console.error('Failed to toggle torch', err);
      showToast(lang === 'lo' ? 'ບໍ່ສາມາດເປີດໄຟສາຍໄດ້' : 'Failed to toggle flashlight', 'error');
    }
  };

  const handleScan = (text: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 2000) return;
    lastScanTimeRef.current = now;
    void lookupTicket(text);
  };

  const confirmCheckIn = async () => {
    if (!scannedTicket || !scannedTicket.isValid || scannedTicket.alreadyCheckedIn || !eventId || busy)
      return;

    setBusy(true);
    try {
      const res = await api.scanCheckin(
        {
          ticketCode: scannedTicket.ticketId,
          eventId: String(eventId),
          attendeeName: scannedTicket.attendeeName || undefined,
          ticketType: scannedTicket.ticketType || undefined,
          seatLabel: scannedTicket.seat || undefined,
          gate: staffLabel || undefined,
        },
        { token },
      );

      if (!res.ok || !res.data?.checkIn) {
        showToast(res.error || (lang === 'lo' ? 'ການເຊັກອິນບໍ່ສຳເລັດ' : 'Check-in failed'), 'error');
        return;
      }

      const confirmed = res.data.checkIn;
      setScannedTicket((prev) =>
        prev
          ? {
              ...prev,
              alreadyCheckedIn: true,
              checkedInTime: formatTimeToHHMM(confirmed.checkedInAt),
              checkedInStaff: confirmed.checkedInBy || staffLabel,
            }
          : null,
      );

      if ('vibrate' in navigator) navigator.vibrate(200);
      showToast(
        res.data.status === 'checked_in' ? t.checkInSuccess : t.alreadyScanned,
        res.data.status === 'checked_in' ? 'success' : 'warning',
      );
      await refreshCheckins(eventId);
    } finally {
      setBusy(false);
    }
  };

  const filteredCheckins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return checkins;
    return checkins.filter(
      (c) =>
        (c.attendeeName || '').toLowerCase().includes(q) ||
        c.ticketCode.toLowerCase().includes(q) ||
        (c.attendeeEmail || '').toLowerCase().includes(q) ||
        (c.attendeePhone || '').toLowerCase().includes(q),
    );
  }, [checkins, searchQuery]);

  if (authLoading || eventsLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 text-adv-slate font-bold text-sm">
        {lang === 'lo' ? 'ກຳລັງໂຫຼດ...' : 'Loading...'}
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-6 text-adv-slate">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-adv-orange/10 text-adv-orange flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black">{t.staffPortal}</h1>
          <p className="text-sm text-gray-500 font-medium">
            {lang === 'lo'
              ? 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນເພື່ອກວດສອບປີ້ເຂົ້າງານ.'
              : 'Please sign in first to verify event tickets.'}
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-xl bg-adv-orange text-black font-black text-xs shadow-sm hover:opacity-90"
          >
            {lang === 'lo' ? 'ເຂົ້າສູ່ລະບົບ' : 'Sign In'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        theme === 'dark' ? 'bg-zinc-950 text-black' : 'bg-gray-50 text-adv-slate'
      }`}
    >
      <SEO
        title={lang === 'lo' ? 'ສະແກນກວດປີ້' : 'Staff Ticket Scanner'}
        description="Gate staff QR ticket verification scanner for Pasopkan events."
        noindex={true}
      />

      {/* Toast Notification Bar */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">
                {toastMessage.text}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header
        className={`sticky top-0 z-[60] w-full border-b backdrop-blur-md transition-colors ${
          theme === 'dark' ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-gray-100 shadow-sm'
        }`}
      >
        <div className="mx-auto flex h-16 sm:h-20 lg:h-24 max-w-[1400px] items-center justify-between px-3 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="flex items-center shrink-0 mt-3 sm:mt-4 transition-transform hover:scale-[1.03] duration-300"
            >
              <img
                src="/pasopkan_logo.png"
                alt="Pasopkan Logo"
                className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-transform duration-300 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>

          <button
            onClick={toggleLanguage}
            className="hover:text-adv-orange shrink-0 p-2 transition-colors text-sm font-bold animate-fade-in cursor-pointer"
          >
            {lang === 'lo' ? 'LA' : lang.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 pb-3 space-y-3.5">
        {scannerEvents.length === 0 ? (
          <div
            className={`p-8 rounded-2xl border text-center space-y-2 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
            }`}
          >
            <ShieldCheck className="w-10 h-10 text-adv-orange mx-auto" />
            <h2 className="text-base font-black">
              {lang === 'lo' ? 'ຍັງບໍ່ມີກິດຈະກຳທີ່ທ່ານໄດ້ຮັບສິດສະແກນ' : 'No Assigned Events Found'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {lang === 'lo'
                ? 'ກະລຸນາໃຫ້ຜູ້ຈັດງານເພີ່ມອີເມວບັນຊີຂອງທ່ານເປັນພະນັກງານສະແກນປີ້ກ່ອນ.'
                : 'Ask the event organizer to assign your account email as gate staff.'}
            </p>
          </div>
        ) : (
          <>
            {/* Compact Event Info Header & Metrics Banner */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                {selectedEvent.image ? (
                  <img
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-adv-orange/10 text-adv-orange flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {scannerEvents.length > 1 ? (
                    <div className="relative inline-block max-w-full">
                      <select
                        value={eventId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          setEventId(nextId);
                          setSearchParams(nextId ? { eventId: nextId } : {});
                        }}
                        className="appearance-none bg-transparent pr-6 text-sm sm:text-base font-black truncate focus:outline-none cursor-pointer max-w-full"
                      >
                        {scannerEvents.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-adv-orange absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <h2 className="text-sm sm:text-base font-black truncate">
                      {selectedEvent.title}
                    </h2>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">
                    {selectedEvent.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-adv-orange shrink-0" />{' '}
                        {selectedEvent.date}
                      </span>
                    )}
                    {(selectedEvent.venue || selectedEvent.location) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-adv-orange shrink-0" />{' '}
                        {selectedEvent.venue || selectedEvent.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-wrap items-center justify-between md:justify-end gap-2.5 pt-2.5 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 text-xs font-bold border border-emerald-500/20">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="font-mono">{checkins.length}</span>
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold">
                      {t.checkedIn}
                    </span>
                  </div>

                  {totalCapacity > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-adv-orange/10 text-adv-orange shrink-0 text-xs font-bold border border-adv-orange/20">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-mono">{totalCapacity.toLocaleString()}</span>
                      <span className="text-[10px] text-adv-orange/70 font-semibold">
                        {t.capacity}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold border border-gray-200 dark:border-zinc-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                  <span className="truncate max-w-[130px]">{staffLabel}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Left Column: QR Scanner & Manual Input */}
              <div className="lg:col-span-5 space-y-3">
                {/* QR Scanner Container */}
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl border shadow-sm transition-colors ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
                  }`}
                >
                  {isCameraActive ? (
                    <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto shadow-inner">
                      <React.Suspense
                        fallback={
                          <div className="flex flex-col items-center gap-2 text-zinc-500">
                            <QrCode className="w-8 h-8 animate-pulse" />
                            <span className="text-xs font-bold">Initializing Camera...</span>
                          </div>
                        }
                      >
                        <LazyScanner
                          components={{ finder: false, torch: false }}
                          onScan={(results: Array<{ rawValue?: string }>) => {
                            if (results && results.length > 0 && results[0].rawValue) {
                              handleScan(results[0].rawValue);
                            }
                          }}
                          onError={() => {
                            /* Handled gracefully in scanner overlay */
                          }}
                        />
                      </React.Suspense>

                      {/* Overlay Actions */}
                      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(false)}
                          className="px-2.5 py-1 bg-zinc-900/85 hover:bg-zinc-900 text-white font-extrabold text-[11px] rounded-lg backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg active:scale-95"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                          <span>{t.closeCamera}</span>
                        </button>

                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`px-2.5 py-1.5 font-extrabold text-[11px] rounded-lg backdrop-blur-md border transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-95 ${
                            isTorchOn
                              ? 'bg-adv-orange text-white border-adv-orange'
                              : 'bg-zinc-900/85 hover:bg-zinc-900 text-white border-white/20'
                          }`}
                        >
                          {isTorchOn ? (
                            <FlashlightOff className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Flashlight className="w-3.5 h-3.5 text-white" />
                          )}
                          <span>
                            {isTorchOn
                              ? lang === 'lo'
                                ? 'ປິດໄຟ'
                                : 'Flashlight Off'
                              : lang === 'lo'
                                ? 'ເປີດໄຟ'
                                : 'Flashlight On'}
                          </span>
                        </button>
                      </div>

                      {/* Overlay Scanning Sight Frame */}
                      <div className="absolute inset-0 border-2 border-dashed border-adv-orange/40 pointer-events-none rounded-xl m-4 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-adv-orange/80 shadow-[0_0_15px_#ff6b00] animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(true)}
                      className="w-full aspect-[4/3] sm:aspect-square mx-auto flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-adv-orange hover:bg-adv-orange/5 dark:hover:bg-adv-orange/10 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="w-16 h-16 rounded-full bg-adv-orange/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-adv-orange shrink-0" />
                      </div>
                      <div className="text-center space-y-1">
                        <span className="block text-sm sm:text-base font-black text-gray-700 dark:text-gray-200">
                          {t.openCamera}
                        </span>
                        <span className="block text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500 font-semibold max-w-[200px] mx-auto leading-relaxed">
                          {t.cameraInactiveDesc}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Compact Manual Ticket Verification Card */}
                <div
                  className={`p-3 rounded-2xl border shadow-sm transition-colors ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
                  }`}
                >
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
                      onKeyDown={(e) => e.key === 'Enter' && void lookupTicket(manualCode)}
                      placeholder={t.enterCodePlaceholder}
                      className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-zinc-800 text-black placeholder-zinc-600'
                          : 'bg-gray-50 border-gray-200 text-adv-slate'
                      }`}
                    />
                    <button
                      type="button"
                      disabled={busy || !manualCode.trim()}
                      onClick={() => void lookupTicket(manualCode)}
                      className="px-3 py-1.5 bg-adv-orange hover:bg-orange-600 disabled:opacity-50 text-black font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {t.verifyBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Ticket & Attendee Verification Card + Checked-in List */}
              <div className="lg:col-span-7 space-y-3.5">
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
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            !scannedTicket.isValid
                              ? 'bg-red-500 text-black shadow-md shadow-red-500/30'
                              : scannedTicket.alreadyCheckedIn
                                ? 'bg-amber-500 text-black'
                                : 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                          }`}
                        >
                          {!scannedTicket.isValid ? (
                            <XCircle className="w-5 h-5 stroke-[2.5]" />
                          ) : scannedTicket.alreadyCheckedIn ? (
                            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 animate-bounce" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                            {!scannedTicket.isValid
                              ? scannedTicket.isRefunded
                                ? lang === 'lo'
                                  ? 'ປີ້ຖືກຄືນເງິນແລ້ວ (ບໍ່ຖືກຕ້ອງ)'
                                  : 'TICKET REFUNDED (INVALID)'
                                : t.invalidTicket
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
                        type="button"
                        onClick={() => setScannedTicket(null)}
                        className="p-1.5 rounded-lg bg-gray-200/50 dark:bg-zinc-800 hover:opacity-80 text-xs font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {scannedTicket.isRefunded && (
                      <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 mb-3 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide">
                            {lang === 'lo'
                              ? 'ປີ້ໂມຄະ - ຫ້າມເຂົ້າຮ່ວມງານ'
                              : 'Void Ticket - Entry Prohibited'}
                          </div>
                          <div className="text-[11px] font-medium leading-relaxed mt-0.5 opacity-90">
                            {lang === 'lo'
                              ? 'ປີ້ໃບນີ້ໄດ້ຜ່ານການຂໍຄືນເງິນແລ້ວ ລະຫັດ QR Code ຖືກຍົກເລີກ ແລະ ບໍ່ສາມາດໃຊ້ເຂົ້າງານໄດ້ໂດຍເດັດຂາດ.'
                              : 'This ticket has been refunded. The QR code is permanently void and check-in is strictly prohibited.'}
                          </div>
                        </div>
                      </div>
                    )}

                    {scannedTicket.isValid && (
                      <div className="space-y-2.5">
                        <div
                          className={`p-3 rounded-xl border transition-colors ${
                            theme === 'dark'
                              ? 'bg-zinc-900/80 border-zinc-800'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                            {t.attendeeDetails}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-adv-orange/10 text-adv-orange shrink-0 flex items-center justify-center font-bold text-sm">
                                {(scannedTicket.attendeeName || 'A').charAt(0)}
                              </div>
                              <div className="min-w-0 flex flex-col items-start gap-1">
                                <div className="text-sm font-black truncate">
                                  {scannedTicket.attendeeName}
                                </div>
                                <span className="w-fit px-2 py-0.5 bg-adv-slate dark:bg-zinc-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                  {scannedTicket.ticketType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {scannedTicket.customAnswers &&
                          Object.keys(scannedTicket.customAnswers).length > 0 && (
                            <div
                              className={`p-2.5 rounded-xl border ${
                                theme === 'dark'
                                  ? 'bg-blue-950/20 border-blue-900/30 text-blue-200'
                                  : 'bg-blue-50/60 border-blue-100 text-blue-900'
                              }`}
                            >
                              <div className="text-[9px] font-black uppercase tracking-wider text-blue-500 mb-1.5 flex items-center gap-1">
                                <TicketIcon className="w-3 h-3" />
                                <span>Questionnaire Info</span>
                              </div>
                              <div className="space-y-1">
                                {Object.entries(scannedTicket.customAnswers).map(([k, v], qIdx) => {
                                  const qConfig = (selectedEvent as any)?.attendeeQuestions?.find(
                                    (q: any) => q.id === k || q.label === k || q.title === k,
                                  );
                                  const label = qConfig?.label || qConfig?.title || k;
                                  return (
                                    <div key={qIdx} className="text-[11px] flex justify-between gap-2">
                                      <span className="font-semibold opacity-75 truncate">
                                        {label}:
                                      </span>
                                      <span className="font-black text-right truncate">
                                        {Array.isArray(v) ? v.join(', ') : String(v)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        {!scannedTicket.alreadyCheckedIn ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void confirmCheckIn()}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-black text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{t.confirmCheckIn}</span>
                          </button>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs text-center border border-amber-500/30">
                            {t.alreadyCheckedInBy
                              .replace('{time}', scannedTicket.checkedInTime || 'earlier')
                              .replace('{staff}', scannedTicket.checkedInStaff || staffLabel)}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : null}

                {/* Staff Check-Ins Live List */}
                <div
                  className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-black'
                      : 'bg-white border-gray-100 text-adv-slate'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-gray-100/50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-950 dark:text-black">
                        {t.recentCheckins}
                      </h4>
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
                          className={`w-full sm:w-56 pl-8 pr-2.5 py-2 sm:py-1.5 rounded-xl border text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                            theme === 'dark'
                              ? 'bg-zinc-950 border-zinc-800 text-black placeholder-zinc-500'
                              : 'bg-gray-50 border-gray-200 text-adv-slate placeholder-gray-400'
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
                        const totalScannerPages =
                          Math.ceil(filteredCheckins.length / CHECKINS_PER_PAGE) || 1;
                        const safePage = Math.min(scannerPage, totalScannerPages);
                        const currentCheckins = filteredCheckins.slice(
                          (safePage - 1) * CHECKINS_PER_PAGE,
                          safePage * CHECKINS_PER_PAGE,
                        );

                        return (
                          <>
                            {currentCheckins.map((checkin, index) => {
                              const combinedAnswers = checkin.customAnswers || {};
                              const answerCount = Object.keys(combinedAnswers).filter((k) => {
                                const v = combinedAnswers[k];
                                return Array.isArray(v)
                                  ? v.length > 0
                                  : v !== '' && v !== null && v !== undefined;
                              }).length;
                              const priceDisplay =
                                typeof checkin.unitPriceKip === 'number'
                                  ? `${checkin.unitPriceKip.toLocaleString()} LAK`
                                  : '';

                              return (
                                <motion.div
                                  key={checkin.id || checkin.ticketCode || index}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.02 }}
                                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                                    theme === 'dark'
                                      ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-orange-500/30'
                                      : 'bg-white border-gray-100 hover:border-orange-200 shadow-2xs'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                                        <span className="text-sm sm:text-base font-black text-gray-900 dark:text-black break-words">
                                          {checkin.attendeeName || 'Attendee'}
                                        </span>
                                        <span className="w-fit px-2 py-0.5 bg-adv-slate dark:bg-zinc-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                          {checkin.ticketType || 'Standard'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1 shrink-0">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                          <span>
                                            {lang === 'lo' ? 'ເຊັກອິນແລ້ວ' : 'Checked In'}
                                          </span>
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">
                                        <span className="text-[11px] font-mono text-gray-400 dark:text-zinc-500 shrink-0">
                                          Ticket ID:{' '}
                                          <strong className="font-bold text-adv-slate dark:text-black">
                                            {checkin.ticketCode}
                                          </strong>
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-x-2.5 text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider">
                                        {priceDisplay && (
                                          <span className="text-adv-orange shrink-0 font-mono font-black">
                                            {priceDisplay}
                                          </span>
                                        )}
                                        {checkin.checkedInAt && (
                                          <>
                                            {priceDisplay && (
                                              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                            )}
                                            <span className="flex items-center gap-1 font-mono font-bold lowercase text-emerald-500 shrink-0">
                                              <Clock className="w-3 h-3 shrink-0" />
                                              <span>{formatTimeToHHMM(checkin.checkedInAt)}</span>
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-100 dark:border-zinc-800/80 shrink-0 w-full sm:w-auto">
                                      <div
                                        className={`grid ${answerCount > 0 ? 'grid-cols-2' : 'grid-cols-1'} sm:flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto`}
                                      >
                                        {answerCount > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setSelectedAttendeeForAnswers({
                                                attendeeName: checkin.attendeeName || 'Attendee',
                                                ticketType: checkin.ticketType,
                                                ticketId: checkin.ticketCode,
                                                email: checkin.attendeeEmail || undefined,
                                                phone: checkin.attendeePhone || undefined,
                                                time: checkin.checkedInAt,
                                                customAnswers: combinedAnswers,
                                              })
                                            }
                                            className="w-full sm:w-[138px] h-9 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-adv-orange shrink-0 border border-orange-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
                                          >
                                            <Eye className="w-3.5 h-3.5 shrink-0" />
                                            <span>{t.viewAnswers}</span>
                                          </button>
                                        ) : null}

                                        <div
                                          className="w-full sm:w-[138px] h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs select-none shrink-0 whitespace-nowrap"
                                          title={
                                            checkin.checkedInAt
                                              ? `${t.checkedIn} @ ${formatTimeToHHMM(checkin.checkedInAt)}`
                                              : t.checkedIn
                                          }
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                          <span>{t.checkedIn}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}

                            {totalScannerPages > 1 ? (
                              <div className="flex flex-col xs:flex-row items-center justify-between gap-3 pt-3 mt-2.5 border-t border-gray-100 dark:border-zinc-800/80">
                                <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 text-center xs:text-left">
                                  {lang === 'lo'
                                    ? `ສະແດງ ${(safePage - 1) * CHECKINS_PER_PAGE + 1}-${Math.min(safePage * CHECKINS_PER_PAGE, filteredCheckins.length)} ຈາກ ${filteredCheckins.length} ຄົນ`
                                    : `Showing ${(safePage - 1) * CHECKINS_PER_PAGE + 1}-${Math.min(safePage * CHECKINS_PER_PAGE, filteredCheckins.length)} of ${filteredCheckins.length}`}
                                </div>

                                <div className="flex items-center gap-1.5 select-none">
                                  <button
                                    type="button"
                                    onClick={() => setScannerPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={safePage === 1}
                                    className="h-9 px-2.5 sm:px-3 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-bold flex items-center gap-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-35 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden xs:inline">
                                      {lang === 'lo' ? 'ກ່ອນໜ້າ' : 'Prev'}
                                    </span>
                                  </button>

                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: totalScannerPages }, (_, i) => i + 1)
                                      .filter(
                                        (p) =>
                                          p === 1 ||
                                          p === totalScannerPages ||
                                          Math.abs(p - safePage) <= 1,
                                      )
                                      .map((pageNum, idx, arr) => (
                                        <React.Fragment key={pageNum}>
                                          {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                                            <span className="text-gray-400 dark:text-zinc-500 text-xs px-0.5">
                                              ...
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => setScannerPage(pageNum)}
                                            className={`min-w-9 h-9 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                              safePage === pageNum
                                                ? 'bg-adv-orange text-black shadow-xs'
                                                : 'border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                            }`}
                                          >
                                            {pageNum}
                                          </button>
                                        </React.Fragment>
                                      ))}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setScannerPage((prev) =>
                                        Math.min(prev + 1, totalScannerPages),
                                      )
                                    }
                                    disabled={safePage === totalScannerPages}
                                    className="h-9 px-2.5 sm:px-3 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-bold flex items-center gap-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-35 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                                  >
                                    <span className="hidden xs:inline">
                                      {lang === 'lo' ? 'ຖັດໄປ' : 'Next'}
                                    </span>
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : filteredCheckins.length > 0 ? (
                              <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-zinc-800/80 text-[11px] font-bold text-gray-400 dark:text-zinc-400 text-center sm:text-left">
                                {lang === 'lo'
                                  ? `ສະແດງທັງໝົດ ${filteredCheckins.length} ຄົນ`
                                  : `Showing all ${filteredCheckins.length} verified attendees`}
                              </div>
                            ) : null}
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Questionnaire Answers Modal */}
      <AnimatePresence>
        {selectedAttendeeForAnswers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedAttendeeForAnswers(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`max-w-2xl w-full max-h-[90vh] flex flex-col rounded-3xl sm:rounded-[2.5rem] shadow-2xl border overflow-hidden ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-black'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black truncate text-gray-900 dark:text-black">
                        {selectedAttendeeForAnswers.attendeeName}
                      </h3>
                      <span className="w-fit px-2 py-0.5 bg-adv-slate dark:bg-zinc-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {selectedAttendeeForAnswers.ticketType || 'Standard'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-medium">
                      <span>
                        <strong className="font-mono text-gray-900 dark:text-zinc-200">
                          {selectedAttendeeForAnswers.ticketId}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAttendeeForAnswers(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-black hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div
                  className={`p-4 rounded-2xl border grid grid-cols-2 gap-3 text-xs ${
                    theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-800 text-black'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">
                      {t.time}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-zinc-100 truncate block font-mono">
                      {formatTimeToHHMM(
                        selectedAttendeeForAnswers.time,
                        selectedAttendeeForAnswers.timestamp,
                      ) || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">
                      {t.checkedIn}
                    </span>
                    <span className="font-bold flex items-center gap-1 text-emerald-500 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                    <span>
                      {t.questionnaireAnswers} (
                      {Object.keys(selectedAttendeeForAnswers.customAnswers || {}).length})
                    </span>
                  </h4>

                  {!selectedAttendeeForAnswers.customAnswers ||
                  Object.keys(selectedAttendeeForAnswers.customAnswers).length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-zinc-400 text-xs font-bold">
                      {lang === 'lo'
                        ? 'ບໍ່ມີຂໍ້ມູນຄຳຕອບແບບສອບຖາມສຳລັບປີ້ໃບນີ້'
                        : 'No questionnaire answers recorded for this ticket.'}
                    </div>
                  ) : (
                    Object.entries(selectedAttendeeForAnswers.customAnswers).map(
                      ([key, val], idx) => {
                        const qConfig = (selectedEvent as any)?.attendeeQuestions?.find(
                          (q: any) => q.id === key || q.label === key || q.title === key,
                        );
                        const qTitle = qConfig?.label || qConfig?.title || key;
                        const qType = qConfig?.type || 'text';
                        const formattedVal = Array.isArray(val)
                          ? val.join(', ')
                          : typeof val === 'boolean'
                            ? val
                              ? 'Yes'
                              : 'No'
                            : String(val);

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              theme === 'dark'
                                ? 'bg-zinc-950/40 border-zinc-800 text-zinc-100'
                                : 'bg-white border-gray-200 text-gray-900 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-black text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-orange-500/10 text-adv-orange shrink-0 text-[10px] font-black flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-gray-900 dark:text-black font-black">
                                  {qTitle}
                                </span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                  theme === 'dark'
                                    ? 'bg-zinc-800 text-zinc-300'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {qType}
                              </span>
                            </div>

                            <div
                              className={`p-3.5 rounded-xl border text-sm font-semibold leading-relaxed ${
                                theme === 'dark'
                                  ? 'bg-zinc-900 border-zinc-750 text-zinc-100'
                                  : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                            >
                              {formattedVal || '-'}
                            </div>
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/40 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedAttendeeForAnswers(null)}
                  className="px-5 py-2 rounded-xl bg-adv-orange text-black font-bold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
