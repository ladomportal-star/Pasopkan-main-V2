import { EventData } from "../types";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  User,
  Settings,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Camera,
  Calendar as CalendarIcon,
  CalendarDays,
  MapPin,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Ticket,
  Download,
  Link2,
  Copy,
  ExternalLink,
  QrCode,
  Trash2,
  ShieldCheck,
  Building,
  Save,
  Edit2,
  ChevronDown,
  DollarSign,
  Info,
  Smartphone,
  Lock,
  Search,
  Phone,
  Mail,
  FileText,
  Users,
  Eye,
  Filter,
  PieChart,
  Sparkles,
  UserCheck,
  MessageSquare,
  ClipboardList,
  CheckSquare,
  Clock,
  Globe,
  ListFilter,
  Check,
  UserX,
  BarChart3,
  CheckCheck,
  KeyRound,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";
import { LaoEvent, SeatingZone, Coupon } from "../data/events";
import { fromBackendEvent, toEventPayload } from "../lib/eventPayload";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import SEO from "../components/SEO";
import ManageCouponsSection from "../components/ManageCouponsSection";

const LazyScanner = React.lazy(
  () =>
    import("@yudiel/react-qr-scanner")
      .then((module) => ({ default: module.Scanner }))
      .catch((err) => {
        console.error("Failed to dynamically import react-qr-scanner:", err);
        return {
          default: () => (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-adv-slate uppercase tracking-tight mb-2">
                Scanner Unavailable
              </h4>
              <p className="text-gray-400 mb-6 font-bold text-sm leading-relaxed">
                Camera scanner requires a secure context and frame permissions.
              </p>
            </div>
          ),
        };
      }) as Promise<{ default: React.ComponentType<any> }>,
);

const translations = {
  en: {
    settings: "Settings",
    myProfile: "My Profile",
    manageEvent: "Manage Event",
    profileSettings: "Profile Settings",
    notifications: "Notifications",
    privacySecurity: "Privacy & Security",
    payoutSettings: "Payout Settings",
    helpCenter: "Help Center",
    updateProfile: "Update Profile",
    signOut: "Sign Out",
    manageEvents: "Manage Events",
    manageEventsDesc: "Manage your events and ticket scanning",
    selectActivity: "Select Activity to Manage",
    bookings: "Tickets",
    attended: "Attended",
    scanQr: "Scan QR Code",
    seatingConfig: "Seating Configuration",
    activeMap: "Active Map",
    seatingDesc: "Visual representation of ticket zones and layout",
    frontStage: "Front Stage",
    vipZone: "VIP Zone",
    zoneA: "Zone A",
    zoneB: "Zone B",
    viewFullMap: "View Full Map",
    vipOccupancy: "VIP Occupancy",
    liveSeatingMap: "Live Seating Map Dashboard",
    mainStageArea: "Main Stage Area",
    occupied: "Occupied",
    totalCapacity: "Total Capacity",
    revenueEstimate: "Revenue Estimate",
    closeDashboard: "Close Dashboard",
    entryScanner: "Entry Scanner",
    invalidTicket: "Invalid Ticket",
    validTicket: "Valid Ticket",
    confirmEntry: "Confirm Entry",
    alreadyScanned: "Ticket {id} already scanned!",
    profileUpdated: "Profile updated successfully",
    seats: "Seats",
    scannerError: "Scanner Error",
    resetScanner: "Reset Scanner",
    permissionDismissed:
      "Camera permission request was dismissed. Please allow camera access and try again.",
    accessDenied: "Camera access denied",
    manualEntry: "Manual Check-in",
    enterTicketCode: "Enter ticket code (e.g. tk_123)",
    checkIn: "Check In",
    ticketCode: "Ticket Code",
    attendee: "Attendee",
    zone: "Zone",
    seat: "Seat",
    price: "Price",
    email: "Email",
    recentCheckins: "Recent Checked-In Attendees",
    noRecentCheckins: "No checked-in attendees yet.",
    scannedAt: "Scanned at",
    ticketDetails: "Ticket Verification Details",
    attendeeDirectory: "Ticket Buyers & Registration Directory",
    attendeeDirectoryDesc:
      "Track all registered ticket holders, check-in status, and their custom questionnaire responses.",
    allBuyers: "All Buyers",
    checkedIn: "Checked In",
    pendingGate: "Pending Gate Scan",
    withFormAnswers: "With Form Answers",
    viewAnswers: "View Answers",
    questionnaireAnswers: "Questionnaire Responses",
    questionnaireSummary: "Answers Summary",
    noAttendeesFound: "No ticket buyers match the selected filters.",
    answersModalTitle: "Attendee Registration Details & Answers",
    answersModalSubtitle:
      "Full questionnaire response data submitted during ticket checkout",
    questionnaireSummaryTitle: "Activity Questionnaire Analytics & Summary",
    questionnaireSummarySubtitle:
      "Aggregated breakdown of all attendee question submissions for this activity",
    exportAllData: "Export Excel (All Data & Answers)",
    quickCheckin: "Quick Check-In",
    appSettings: "App Settings",
    selectLanguage: "Select Language",
    english: "English",
    lao: "Lao",
  },
  lo: {
    settings: "ຕັ້ງຄ່າ",
    myProfile: "ໂປຣໄຟລ໌ຂອງຂ້ອຍ",
    manageEvent: "ຈັດການກິດຈະກຳ",
    profileSettings: "ຕັ້ງຄ່າໂປຣໄຟລ໌",
    notifications: "ການແຈ້ງເຕືອນ",
    privacySecurity: "ຄວາມເປັນສ່ວນຕົວ ແລະ ຄວາມປອດໄພ",
    payoutSettings: "ຕັ້ງຄ່າການຈ່າຍເງິນ",
    helpCenter: "ສູນຊ່ວຍເຫຼືອ",
    updateProfile: "ອັບເດດໂປຣໄຟລ໌",
    signOut: "ອອກຈາກລະບົບ",
    manageEvents: "ຈັດການກິດຈະກຳ",
    manageEventsDesc: "ຈັດການກິດຈະກຳ ແລະ ການສະແກນປີ້ຂອງທ່ານ",
    selectActivity: "ເລືອກກິດຈະກຳທີ່ຈະຈັດການ",
    bookings: "ປີ້",
    attended: "ເຂົ້າຮ່ວມແລ້ວ",
    scanQr: "ສະແກນ QR Code",
    seatingConfig: "ການຕັ້ງຄ່າບ່ອນນັ່ງ",
    activeMap: "ແຜນຜັງທີ່ໃຊ້ງານຢູ່",
    seatingDesc: "ການສະແດງພາບຂອງເຂດປີ້ ແລະ ຮູບແບບ",
    frontStage: "ໜ້າເວທີ",
    vipZone: "ເຂດ VIP",
    zoneA: "ເຂດ A",
    zoneB: "ເຂດ B",
    viewFullMap: "ເບິ່ງແຜນຜັງທັງໝົດ",
    vipOccupancy: "ການຄອບຄອງ VIP",
    liveSeatingMap: "ແຜງຄວບຄຸມແຜນຜັງບ່ອນນັ່ງສົດ",
    mainStageArea: "ພື້ນທີ່ເວທີຫຼັກ",
    occupied: "ມີຄົນຈອງແລ້ວ",
    totalCapacity: "ຄວາມຈຸທັງໝົດ",
    revenueEstimate: "ລາຍໄດ້ປະມານ",
    closeDashboard: "ປິດແຜງຄວບຄຸມ",
    entryScanner: "ເຄື່ອງສະແກນທາງເຂົ້າ",
    invalidTicket: "ປີ້ບໍ່ຖືກຕ້ອງ",
    validTicket: "ປີ້ຖືກຕ້ອງ",
    confirmEntry: "ຢືນຢັນການເຂົ້າ",
    alreadyScanned: "ປີ້ {id} ຖືກສະແກນແລ້ວ!",
    profileUpdated: "ອັບເດດໂປຣໄຟລ໌ສຳເລັດແລ້ວ",
    seats: "ບ່ອນນັ່ງ",
    scannerError: "ຂໍ້ຜິດພາດຂອງເຄື່ອງສະແກນ",
    resetScanner: "ຣີເຊັດເຄື່ອງສະແກນ",
    permissionDismissed:
      "ການຂໍອະນຸຍາດກ້ອງຖ່າຍຮູບຖືກປະຕິເສດ. ກະລຸນາອະນຸຍາດໃຫ້ເຂົ້າເຖິງກ້ອງຖ່າຍຮູບ ແລະ ລອງໃໝ່ອີກຄັ້ງ.",
    accessDenied: "ການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບຖືກປະຕິເສດ",
    manualEntry: "ເຊັກອິນດ້ວຍຕົນເອງ",
    enterTicketCode: "ປ້ອນລະຫັດປີ້ (ເຊັ່ນ: tk_123)",
    checkIn: "ເຊັກອິນ",
    ticketCode: "ລະຫັດປີ້",
    attendee: "ຜູ້ເຂົ້າຮ່ວມ",
    zone: "ເຂດ",
    seat: "ບ່ອນນັ່ງ",
    price: "ລາຄາ",
    email: "ອີເມວ",
    recentCheckins: "ຜູ້ເຂົ້າຮ່ວມທີ່ເຊັກອິນເມື່ອບໍ່ດົນມານີ້",
    noRecentCheckins: "ຍັງບໍ່ມີຜູ້ເຂົ້າຮ່ວມທີ່ເຊັກອິນເທື່ອ.",
    scannedAt: "ສະແກນເມື່ອ",
    ticketDetails: "ລາຍລະອຽດການຢືນຢັນປີ້",
    attendeeDirectory: "ລາຍຊື່ຜູ້ຊື້ປີ້ ແລະ ຄຳຕອບແບບສອບຖາມ",
    attendeeDirectoryDesc:
      "ຕິດຕາມຜູ້ຖືປີ້ທັງໝົດ, ສະຖານະການເຊັກອິນ, ແລະ ຄຳຕອບແບບສອບຖາມຂອງພວກເຂົາ.",
    allBuyers: "ຜູ້ຊື້ທັງໝົດ",
    checkedIn: "ເຊັກອິນແລ້ວ",
    pendingGate: "ລໍຖ້າສະແກນ",
    withFormAnswers: "ມີຄຳຕອບແບບສອບຖາມ",
    viewAnswers: "ເບິ່ງຄຳຕອບ",
    questionnaireAnswers: "ຄຳຕອບແບບສອບຖາມ",
    questionnaireSummary: "ສະຫຼຸບຄຳຕອບ",
    noAttendeesFound: "ບໍ່ພົບຂໍ້ມູນຜູ້ຊື້ປີ້ຕາມເງື່ອນໄຂທີ່ເລືອກ.",
    answersModalTitle: "ລາຍລະອຽດຜູ້ເຂົ້າຮ່ວມ ແລະ ຄຳຕອບແບບສອບຖາມ",
    answersModalSubtitle: "ຂໍ້ມູນຄຳຕອບແບບສອບຖາມທີ່ຜູ້ຊື້ປ້ອນໃນຕອນຊື້ປີ້",
    questionnaireSummaryTitle: "ສະຖິຕິ ແລະ ບົດສະຫຼຸບຄຳຕອບແບບສອບຖາມ",
    questionnaireSummarySubtitle:
      "ການລວບລວມຄຳຕອບແບບສອບຖາມທັງໝົດສຳລັບກິດຈະກຳນີ້",
    exportAllData: "ສົ່ງອອກ Excel (ຂໍ້ມູນທັງໝົດ ແລະ ຄຳຕອບ)",
    quickCheckin: "ເຊັກອິນດ່ວນ",
    appSettings: "ຕັ້ງຄ່າແອັບ",
    selectLanguage: "ເລືອກພາສາ",
    english: "ພາສາອັງກິດ",
    lao: "ພາສາລາວ",
  },
};

export default function Account() {
  // Global Toast Notifications with 5-Second Auto-Dismiss
  const [toastQueue, setToastQueue] = useState<
    {
      id: string;
      text: string;
      type: "error" | "success" | "warning" | "info";
    }[]
  >([]);

  const addToast = (
    text: string,
    type: "error" | "success" | "warning" | "info" = "success",
    duration = 5000,
  ) => {
    const id = Date.now().toString() + Math.random().toString();
    setToastQueue((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // Safety timer to guarantee all notifications auto-dismiss in 5 seconds
  useEffect(() => {
    if (toastQueue.length > 0) {
      const timer = setTimeout(() => {
        setToastQueue((prev) => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastQueue]);

  const navigate = useNavigate();
  const { logout, user, syncProfileToSupabase } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = translations[lang] as unknown as Record<string, string>;

  const profilePic = user?.avatar || user?.photoURL || null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // A handful of legacy display-only fields (registered/scanned/tiers/...)
  // that predate the real backend and aren't part of LaoEvent proper.
  type OrganizerEvent = LaoEvent & Record<string, any>;
  const [myEvents, setMyEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  // A placeholder so `selectedEvent` is never undefined — while events are
  // still loading, and for an organizer with no events at all yet.
  const noEvent = useMemo(
    () =>
      ({
        id: "",
        title: "",
        date: "",
        time: "",
        location: "",
        venue: "",
        image: "",
        category: "Other",
        description: "",
        ticketTiers: [],
        registered: 0,
      }) as unknown as OrganizerEvent,
    [],
  );
  const selectedEvent =
    myEvents.find((e) => e.id === selectedEventId) || myEvents[0] || noEvent;

  // The organizer's own events (drafts included) — the real replacement for
  // what used to be a hardcoded sample list merged with organizer_events.
  const loadMyEvents = async () => {
    const res = await api.listEvents({ mine: true });
    const mine = (res.data?.events ?? []).map((e) => {
      const mapped = fromBackendEvent(e);
      const registered = (mapped.ticketTiers || []).reduce(
        (sum: number, t: any) => sum + (Number(t.sold) || 0),
        0,
      );
      return { ...mapped, registered };
    });
    setMyEvents(mine);
    setSelectedEventId((prev) => prev || mine[0]?.id || "");
  };

  useEffect(() => {
    let cancelled = false;
    loadMyEvents().catch(() => {
      if (!cancelled) setMyEvents([]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUpTicket, setIsLookingUpTicket] = useState(false);
  const [isConfirmingEntry, setIsConfirmingEntry] = useState(false);
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

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<
    "profile" | "my-event" | "payouts"
  >((location.state as any)?.targetTab || "profile");

  useEffect(() => {
    if ((location.state as any)?.targetTab) {
      setActiveTab((location.state as any).targetTab);
      window.scrollTo(0, 0);
    }
  }, [location.state]);

  // Re-fetch when an admin approves/rejects an event elsewhere, or another
  // tab changes something — re-pull from the API rather than trusting
  // whatever's sitting in localStorage.
  useEffect(() => {
    const handleSyncEvents = () => {
      loadMyEvents().catch(() => {});
    };

    window.addEventListener("storage", handleSyncEvents);
    window.addEventListener("pasopkan_notification_added", handleSyncEvents);
    return () => {
      window.removeEventListener("storage", handleSyncEvents);
      window.removeEventListener(
        "pasopkan_notification_added",
        handleSyncEvents,
      );
    };
  }, []);

  const lastScanRef = useRef<{ id: string; time: number } | null>(null);

  const handleScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || !selectedEventId) return;
    const now = Date.now();
    if (lastScanRef.current?.id === code && now - lastScanRef.current.time < 2500) return;
    lastScanRef.current = { id: code, time: now };
    setScannerError(null);
    setScanResult(null);
    setIsLookingUpTicket(true);
    try {
      const result = await api.lookupTicket(code);
      const ticket = result.data?.ticket;
      if (!result.ok || !ticket) throw new Error(result.error || t.invalidTicket);
      if (ticket.eventId !== selectedEventId) throw new Error("Ticket belongs to another event");
      if (ticket.orderStatus !== "confirmed" || ticket.itemStatus === "void" || ticket.itemStatus === "refunded") {
        throw new Error("This ticket is not valid for entry");
      }
      setScanResult({
        id: ticket.ticketCode,
        valid: true,
        alreadyScanned: ticket.alreadyCheckedIn || ticket.itemStatus === "checked_in",
        attendeeName: ticket.attendeeName || undefined,
        ticketType: ticket.tierName,
        price: `${new Intl.NumberFormat("lo-LA").format(ticket.unitPriceKip)} ₭`,
        email: ticket.attendeeEmail || undefined,
        phone: ticket.attendeePhone || undefined,
      });
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
    } catch (error) {
      addToast(error instanceof Error ? error.message : t.invalidTicket, "error");
      lastScanRef.current = null;
    } finally {
      setIsLookingUpTicket(false);
    }
  };

  const handleConfirmEntry = async () => {
    if (!scanResult || scanResult.alreadyScanned || !selectedEventId || isConfirmingEntry) return;
    setIsConfirmingEntry(true);
    try {
      const result = await api.scanCheckin({
        ticketCode: scanResult.id,
        eventId: selectedEventId,
        gate: "Organizer Desk",
      });
      if (!result.ok || !result.data) throw new Error(result.error || "Check-in failed");
      if (result.data.status === "already_checked_in") {
        setScanResult({ ...scanResult, alreadyScanned: true });
        addToast(t.alreadyScanned.replace("{id}", scanResult.id), "warning");
        return;
      }
      setMyEvents((prev) => prev.map((event) =>
        event.id === selectedEventId ? { ...event, scanned: (event.scanned || 0) + 1 } : event,
      ));
      addToast(lang === "lo" ? "ເຊັກອິນສຳເລັດແລ້ວ" : "Ticket checked in successfully", "success");
      setScanResult(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Check-in failed", "error");
    } finally {
      setIsConfirmingEntry(false);
    }
  };
  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode("");
  };

  const menuItems = [
    {
      icon: User,
      label: t.profileSettings,
      desc:
        lang === "en"
          ? "Update your basic information and photo"
          : "ອັບເດດຂໍ້ມູນພື້ນຖານ ແລະ ຮູບພາບຂອງທ່ານ",
      path: "/edit-profile",
      color: "text-blue-500 dark:text-blue-450",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      icon: Bell,
      label: t.notifications,
      desc:
        lang === "en"
          ? "Control how you receive activity updates"
          : "ຄວບຄຸມວິທີທີ່ທ່ານໄດ້ຮັບການແຈ້ງເຕືອນກິດຈະກຳ",
      path: "/notifications?tab=settings",
      color: "text-adv-orange dark:text-orange-450",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
    {
      icon: Globe,
      label: lang === "en" ? "Language" : "ພາສາ",
      desc:
        lang === "en"
          ? "Change application language"
          : "ປ່ຽນພາສາຂອງແອັບພລິເຄຊັນ",
      path: "/language",
      color: "text-indigo-500 dark:text-indigo-450",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      icon: Shield,
      label: t.privacySecurity,
      desc:
        lang === "en"
          ? "Manage 2FA authenticator and account security"
          : "ຈັດການ 2FA Authenticator ແລະ ຄວາມປອດໄພຂອງບັນຊີ",
      path: "/security",
      color: "text-emerald-500 dark:text-emerald-450",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      icon: HelpCircle,
      label: t.helpCenter,
      desc:
        lang === "en"
          ? "Browse FAQs or contact our support team"
          : "ເບິ່ງຄຳຖາມທີ່ພົບເລື້ອຍ ຫຼື ຕິດຕໍ່ທີມງານຊ່ວຍເຫຼືອ",
      path: "/help",
      color: "text-amber-500 dark:text-amber-450",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      icon: Info,
      label: lang === "en" ? "About" : "ກ່ຽວກັບ",
      desc:
        lang === "en"
          ? "Learn more about our platform"
          : "ຮຽນຮູ້ເພີ່ມເຕີມກ່ຽວກັບແພລດຟອມຂອງພວກເຮົາ",
      path: "/about",
      color: "text-sky-500 dark:text-sky-450",
      bg: "bg-sky-50 dark:bg-sky-500/10",
    },
  ];

  const [showFullMap, setShowFullMap] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [showZoneSuccess, setShowZoneSuccess] = useState(false);
  const [showProfilePicSuccess, setShowProfilePicSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Instant execution for mobile responsiveness
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (showScanner) {
      if (
        typeof window === "undefined" ||
        !window.navigator ||
        !window.navigator.mediaDevices
      ) {
        setScannerError(
          lang === "en"
            ? "Camera access is not supported in this frame. Please open the app in a new window/tab for camera permissions."
            : "ບໍ່ຮອງຮັບການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໃນຫນ້ານີ້. ກະລຸນາເປີດໃນແທັບໃໝ່.",
        );
      } else {
        setScannerError(null);
      }
    }
  }, [showScanner, lang]);

  const toggleSeating = (eventId: string) => {
    setMyEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, hasSeating: !e.hasSeating } : e,
      ),
    );
  };

  const handleUpdateEventCoupons = async (updatedCoupons: Coupon[]) => {
    setMyEvents((prev) =>
      prev.map((e) =>
        String(e.id) === String(selectedEvent.id)
          ? { ...e, coupons: updatedCoupons }
          : e,
      ),
    );
    const res = await api.updateEvent(
      String(selectedEvent.id),
      toEventPayload({ ...selectedEvent, coupons: updatedCoupons }),
    );
    if (!res.ok) {
      console.error("Failed to save coupons:", res.error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
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
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const base64Pic = canvas.toDataURL("image/jpeg", 0.7);

          syncProfileToSupabase({ profilePic: base64Pic })
            .then(() => {
              setShowProfilePicSuccess(true);
              setTimeout(() => setShowProfilePicSuccess(false), 5000);
            })
            .catch((error) => {
              addToast(error instanceof Error ? error.message : "Could not save profile photo", "error");
            });
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
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-white rounded-2xl shadow-sm"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 py-4 sm:py-8 px-3.5 sm:px-6 lg:px-8 ${
        theme === "dark"
          ? "bg-zinc-950 text-white"
          : "bg-[#F9FAFB] text-adv-slate"
      }`}
    >
      <SEO
        title={
          t.myProfile ||
          (lang === "lo" ? "ບັນຊີ & ການຕັ້ງຄ່າ" : "Account & Settings")
        }
        description="Manage your Pasopkan profile, organizer settings, notifications, and event tickets."
        noindex={true}
      />
      <nav
        aria-label="Approval workflows"
        className="max-w-4xl mx-auto flex gap-4 py-4"
      >
        <Link to="/organizer" className="underline">
          ຜູ້ຈັດງານ / Organizer applications
        </Link>
        {user?.role === "admin" && (
          <Link to="/admin" className="underline">
            Admin review
          </Link>
        )}
      </nav>
      <div className="max-w-4xl mx-auto pt-1 sm:pt-2">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1
            className={`text-2xl sm:text-3xl font-bold transition-colors ${
              theme === "dark" ? "text-white" : "text-adv-slate"
            }`}
          >
            {t.settings}
          </h1>
        </div>

        {/* Tabs - Mobile Segmented Pill Bar */}
        <div
          className={`p-1 rounded-xl sm:rounded-2xl flex overflow-x-auto hide-scrollbar gap-1 mb-4 sm:mb-8 transition-colors ${
            theme === "dark" ? "bg-zinc-900/60" : "bg-gray-200/50"
          } sm:bg-transparent sm:p-0 sm:border-b sm:border-gray-100 sm:rounded-none sm:gap-8`}
        >
          <button
            onClick={() => {
              setActiveTab("profile");
              window.scrollTo(0, 0);
            }}
            className={`flex-1 min-w-[90px] sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 ${
              activeTab === "profile"
                ? theme === "dark"
                  ? "bg-zinc-800 text-white border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange"
                  : "bg-white text-adv-slate shadow-sm border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 sm:border-transparent"
            }`}
          >
            {t.myProfile}
          </button>
          <button
            onClick={() => {
              setActiveTab("my-event");
              window.scrollTo(0, 0);
            }}
            className={`flex-1 min-w-[90px] sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 ${
              activeTab === "my-event"
                ? theme === "dark"
                  ? "bg-zinc-800 text-white border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange"
                  : "bg-white text-adv-slate shadow-sm border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 sm:border-transparent"
            }`}
          >
            {t.manageEvent}
          </button>
          <button
            onClick={() => {
              setActiveTab("payouts");
              window.scrollTo(0, 0);
            }}
            className={`flex-1 min-w-[90px] sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 ${
              activeTab === "payouts"
                ? theme === "dark"
                  ? "bg-zinc-800 text-white border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange"
                  : "bg-white text-adv-slate shadow-sm border-transparent sm:bg-transparent sm:border-adv-orange sm:text-adv-orange"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 sm:border-transparent"
            }`}
          >
            {t.payouts || (lang === "lo" ? "ໃບບິນເບີກຈ່າຍ" : "Payout Bills")}
          </button>
        </div>

        <div className={activeTab === "profile" ? "block" : "hidden"}>
          {/* Profile Card */}
          <div
            className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8 shadow-sm border transition-all ${
              theme === "dark"
                ? "bg-zinc-900 border-zinc-800/80 text-white"
                : "bg-white border-gray-100 text-adv-slate"
            }`}
          >
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center text-gray-300 shrink-0 overflow-hidden shadow-inner transition-transform group-hover:scale-[1.02] duration-300">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
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
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {user?.name || user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Account"}
              </h2>
              <p className="text-gray-400 font-medium mb-1 text-xs sm:text-sm truncate">
                {user?.email || user?.phone || ""}
              </p>
              <p className="text-gray-400/80 font-medium text-[10px] sm:text-xs truncate">
                Id: {user?.id || "N/A"}
              </p>
            </div>
          </div>

          {/* Account Menu */}
          <div
            className={`rounded-3xl sm:rounded-[2.5rem] overflow-hidden mb-6 sm:mb-8 shadow-sm border transition-all ${
              theme === "dark"
                ? "bg-zinc-900 border-zinc-800/80 divide-y divide-zinc-800/50"
                : "bg-white border-gray-100 divide-y divide-gray-50"
            }`}
          >
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`w-full flex items-center justify-between p-4 sm:p-5.5 transition-all group text-left ${
                  theme === "dark"
                    ? "hover:bg-zinc-800/45"
                    : "hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  <div
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl ${item.bg} flex items-center justify-center ${item.color} shadow-sm group-hover:scale-105 transition-transform shrink-0`}
                  >
                    <item.icon className="w-5.5 h-5.5" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block font-bold text-sm sm:text-base mb-0.5 group-hover:text-adv-orange transition-colors ${
                        theme === "dark" ? "text-zinc-100" : "text-adv-slate"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block text-xs text-gray-400 font-medium truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none">
                      {item.desc}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    theme === "dark"
                      ? "bg-zinc-800/50 text-zinc-500 group-hover:bg-adv-orange group-hover:text-white"
                      : "bg-gray-50 text-gray-350 group-hover:bg-adv-orange group-hover:text-white"
                  } group-hover:translate-x-0.5`}
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => logout()}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold text-sm sm:text-base ${
                theme === "dark"
                  ? "bg-zinc-900 border-red-500/20 text-red-400 hover:bg-red-500/5"
                  : "bg-white border-red-50 text-red-500 hover:bg-red-50"
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
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                {lang === "lo" ? "ເງື່ອນໄຂການບໍລິການ" : "Terms & Conditions"}
              </Link>
              <Link
                to="/privacy"
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all font-bold text-xs ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Shield className="w-4 h-4" />
                {lang === "lo" ? "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ" : "Privacy Policy"}
              </Link>
            </div>
          </div>
        </div>

        <div className={activeTab === "my-event" ? "block" : "hidden"}>
          {/* Manage Event Header */}
          <div className="mb-6 sm:mb-8">
            <h2
              className={`text-xl sm:text-2xl font-bold transition-colors ${
                theme === "dark" ? "text-white" : "text-adv-slate"
              }`}
            >
              {t.manageEvents}
            </h2>
            <p className="text-gray-400 font-medium text-xs sm:text-sm">
              {t.manageEventsDesc}
            </p>
          </div>

          <div className="mb-6 sm:mb-8">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              {t.selectActivity}
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className={`w-full border rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 shadow-sm appearance-none pr-12 transition-colors ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-adv-orange"
                    : "bg-white border-gray-150 text-adv-slate focus:border-adv-orange"
                }`}
              >
                {myEvents.map((event) => (
                  <option
                    key={event.id}
                    value={event.id}
                    className={
                      theme === "dark"
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-adv-slate"
                    }
                  >
                    {event.title}
                    {event.status === "pending" ? " (Pending Approval)" : ""}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-450 dark:text-zinc-500">
                <ChevronRight className="w-4.5 h-4.5 rotate-90" />
              </div>
            </div>
          </div>

          {myEvents.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {lang === "lo" ? "ຍັງບໍ່ມີກິດຈະກຳຂອງທ່ານໃນລະບົບ" : "You do not have any events to manage yet."}
            </div>
          )}
          {selectedEvent.id && (
            <div className="space-y-6 sm:space-y-8">
              {/* Event Card */}
              <div
                className={`rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border p-4 sm:p-5 transition-all ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white"
                    : "bg-white border-gray-100 text-adv-slate"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                  <div
                    className={`w-full sm:w-28 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm relative ${theme === "dark" ? "bg-zinc-950" : "bg-gray-100"}`}
                  >
                    <img
                      src={selectedEvent.image}
                      alt={selectedEvent.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0 pt-1">
                    <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start mb-2 sm:mb-3">
                      <h3 className="text-xl sm:text-2xl font-black text-adv-slate dark:text-white truncate">
                        {selectedEvent.title}
                      </h3>
                      {selectedEvent.dateType === "booking" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-adv-orange border border-orange-500/20 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {lang === "lo"
                            ? "ກິດຈະກຳແບບຈອງລາຍວັນ"
                            : "Booking Experience"}
                        </span>
                      )}
                      {selectedEvent.status === "pending" && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider shrink-0 border border-amber-200 dark:border-amber-800">
                          {lang === "lo" ? "ລໍຖ້າອະນຸມັດ" : "Pending Approval"}
                        </span>
                      )}
                      {selectedEvent.status === "rejected" && (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-wider shrink-0 border border-red-200 dark:border-red-800 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {lang === "lo" ? "ຖືກປະຕິເສດ" : "Rejected"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 sm:gap-5 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold">
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <CalendarIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-adv-orange shrink-0" />
                        {selectedEvent.dateType === "booking"
                          ? `${selectedEvent.bookingStartDate || selectedEvent.date} to ${selectedEvent.bookingEndDate || "Ongoing"} • Daily Sessions`
                          : selectedEvent.date}
                      </span>
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-adv-orange shrink-0" />{" "}
                        {selectedEvent.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Decision Notice Banner */}
                {selectedEvent.status === "rejected" && (
                  <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-left">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 dark:text-red-200 text-sm">
                          {lang === "lo"
                            ? "ກິດຈະກຳນີ້ຖືກປະຕິເສດໂດຍແອດມິນ"
                            : "Event Submission Rejected by Administrator"}
                        </h4>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed">
                          {selectedEvent.rejectionReason
                            ? `${lang === "lo" ? "ເຫດຜົນ: " : "Reason: "}${selectedEvent.rejectionReason}`
                            : lang === "lo"
                              ? "ກະລຸນາກວດສອບ ແລະ ແກ້ໄຂຂໍ້ມູນກິດຈະກຳ ຈາກນັ້ນສົ່ງໃໝ່ເພື່ອຮັບການກວດສອບ."
                              : "Please update your event details, ticket setup, or cover image and resubmit."}
                        </p>
                        <Link
                          to={`/create?adminEdit=${selectedEvent.id}`}
                          className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>
                            {lang === "lo"
                              ? "ແກ້ໄຂ ແລະ ສົ່ງໃໝ່"
                              : "Edit & Resubmit"}
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
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

              {/* Coupons & Discounts Management (Manage existing coupons created with event) */}
              <ManageCouponsSection
                eventId={String(selectedEvent.id)}
                coupons={selectedEvent.coupons || []}
                onUpdateCoupons={handleUpdateEventCoupons}
                theme={theme}
                lang={lang}
              />

              {selectedEvent.dateType === "booking" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                  {lang === "lo"
                    ? "ການຈັດການວັນຈອງ ແລະລາຍຊື່ຜູ້ຮ່ວມຍັງບໍ່ພ້ອມ ຈົນກວ່າຈະເຊື່ອມກັບ backend API. ໃຊ້ປຸ່ມສະແກນປີ້ດ້ານເທິງເພື່ອກວດປີ້ຈິງ."
                    : "Booking-day and attendee management is unavailable until it is connected to the backend API. Use the scanner above to verify real tickets."}
                </div>
              ) : (
                <>
                  {/* Seating Map (Only visible if event has one) */}
                  {(selectedEvent.hasSeating === true ||
                    String(selectedEvent.hasSeating) === "true") && (
                    <div
                      className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border transition-all ${
                        theme === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-white"
                          : "bg-white border-gray-100 text-adv-slate"
                      }`}
                    >
                      <div className="mb-4 sm:mb-6">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-base sm:text-lg font-bold">
                            {t.seatingConfig}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400 font-medium tracking-tight">
                          {t.seatingDesc}
                        </p>
                      </div>

                      <div
                        className={`relative w-full rounded-2xl border overflow-hidden p-4 sm:p-6 flex flex-col items-center group transition-colors ${
                          theme === "dark"
                            ? "bg-zinc-950/40 border-zinc-850"
                            : "bg-[#F9FAFB] border-gray-100"
                        }`}
                      >
                        <img
                          src={
                            selectedEvent.zoneImage ||
                            "/src/assets/images/seating_map_layout_1782798956470.jpg"
                          }
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

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                    {lang === "lo"
                      ? "ລາຍຊື່ຜູ້ຊື້ປີ້ ແລະສະຖິຕິຕ້ອງອ່ານຈາກ backend ເທົ່ານັ້ນ; ຈະສະແດງເມື່ອມີ API ສຳລັບ organizer."
                      : "The buyer directory and analytics require an organizer-scoped backend API. They are hidden until that API is available."}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className={activeTab === "payouts" ? "block" : "hidden"}>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
            <h2 className="text-xl font-bold">{lang === "lo" ? "ການເບີກຈ່າຍຍັງບໍ່ພ້ອມ" : "Payouts are not available yet"}</h2>
            <p className="mt-3 text-sm leading-relaxed">{lang === "lo" ? "ຂໍ້ມູນທະນາຄານ, ຍອດເງິນ ແລະ ການຂໍເບີກຈ່າຍຈະສະແດງຢູ່ນີ້ເມື່ອມີ API ທີ່ປອດໄພ ແລະຂັ້ນຕອນອະນຸມັດໂດຍ Admin. ບໍ່ມີການໂອນເງິນຈາກໜ້ານີ້." : "Bank details, balances and payout requests will appear here after a secure backend API and admin approval flow are available. This page does not transfer money."}</p>
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
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-800 text-white"
                  : "bg-white border-gray-100 text-adv-slate"
              }`}
            >
              {/* Header */}
              <div
                className={`p-5 sm:p-8 border-b flex items-center justify-between transition-colors ${
                  theme === "dark" ? "border-zinc-800" : "border-gray-50"
                }`}
              >
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-black truncate uppercase tracking-tight">
                    {selectedEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-gray-400 font-bold">
                      {t.seatingConfig}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowFullMap(false)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all group shrink-0 ${
                    theme === "dark"
                      ? "bg-zinc-800 text-zinc-400 hover:text-adv-orange hover:bg-zinc-700"
                      : "bg-gray-50 text-gray-400 hover:text-adv-orange hover:bg-orange-50"
                  }`}
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              {/* Map Container */}
              <div
                className={`flex-1 overflow-auto p-4 sm:p-12 flex items-center justify-center transition-colors ${
                  theme === "dark" ? "bg-zinc-950/40" : "bg-[#F9FAFB]"
                }`}
              >
                <img
                  src={
                    selectedEvent.zoneImage ||
                    "/src/assets/images/seating_map_layout_1782798956470.jpg"
                  }
                  alt="Seating Map Layout"
                  className={`max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-2xl sm:rounded-3xl shadow-md border ${
                    theme === "dark" ? "border-zinc-850" : "border-gray-100"
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Footer */}
              <div
                className={`p-5 sm:p-8 border-t flex items-center justify-end transition-colors ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-white border-gray-50"
                }`}
              >
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
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-850 text-white"
                  : "bg-white border-gray-100 text-adv-slate"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between p-6 border-b flex-shrink-0 transition-colors ${
                  theme === "dark" ? "border-zinc-800" : "border-gray-50"
                }`}
              >
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Camera className="w-6 h-6 text-adv-orange animate-pulse" />
                  {t.entryScanner}
                </h3>
                <button
                  onClick={() => {
                    setShowScanner(false);
                    setScanResult(null);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    theme === "dark"
                      ? "bg-zinc-800 text-zinc-400 hover:text-white"
                      : "bg-gray-50 text-gray-400 hover:text-adv-slate"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className={`p-6 sm:p-8 relative flex-1 overflow-y-auto transition-colors ${
                  theme === "dark" ? "bg-zinc-950/40" : "bg-[#F9FAFB]"
                }`}
              >
                <div
                  className={`rounded-3xl overflow-hidden border-4 shadow-lg relative aspect-square ${
                    theme === "dark" ? "border-zinc-800" : "border-white"
                  }`}
                >
                  {!scannerError &&
                    typeof window !== "undefined" &&
                    window.navigator &&
                    window.navigator.mediaDevices && (
                      <React.Suspense
                        fallback={
                          <div
                            className={`absolute inset-0 flex items-center justify-center ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}
                          >
                            <Loader2 className="w-8 h-8 animate-spin text-adv-orange" />
                          </div>
                        }
                      >
                        <LazyScanner
                          onScan={(result) =>
                            result &&
                            result.length > 0 &&
                            handleScan(result[0].rawValue)
                          }
                          onError={(error) => {
                            const errorMessage =
                              error instanceof Error
                                ? error.message
                                : String(error);
                            console.warn(
                              "Camera scanner warning (safe handling):",
                              errorMessage,
                            );

                            if (
                              errorMessage
                                .toLowerCase()
                                .includes("not allowed") ||
                              errorMessage
                                .toLowerCase()
                                .includes("permission") ||
                              errorMessage.toLowerCase().includes("denied") ||
                              errorMessage.toLowerCase().includes("restricted")
                            ) {
                              setScannerError(
                                lang === "en"
                                  ? "Camera permission is restricted or denied in this frame. Please use our instant scan simulator or enter the ticket code below!"
                                  : "ການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບຖືກຈຳກັດ. ກະລຸນາໃຊ້ເຄື່ອງຈຳລອງການສະແກນ ຫຼື ປ້ອນລະຫັດປີ້ຢູ່ດ້ານລຸ່ມ!",
                              );
                            } else {
                              setScannerError(errorMessage || t.accessDenied);
                            }
                          }}
                        />
                      </React.Suspense>
                    )}

                  {scannerError && (
                    <div
                      className={`absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 transition-colors ${
                        theme === "dark" ? "bg-zinc-900/95" : "bg-white/95"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border ${
                          theme === "dark"
                            ? "bg-orange-500/10 text-adv-orange border-orange-500/20"
                            : "bg-orange-50 text-adv-orange border-orange-100"
                        }`}
                      >
                        <AlertCircle className="w-7 h-7 animate-pulse" />
                      </div>
                      <h4
                        className={`text-lg font-black uppercase tracking-tight mb-1.5 ${theme === "dark" ? "text-white" : "text-adv-slate"}`}
                      >
                        {t.scannerError}
                      </h4>
                      <p className="text-gray-400 mb-6 font-bold text-xs leading-relaxed max-w-xs">
                        {scannerError}
                      </p>
                      <div className="flex flex-col gap-2 w-full max-w-[240px]">
                        <button
                          onClick={() => setScannerError(null)}
                          className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-colors ${
                            theme === "dark"
                              ? "border-zinc-800 text-zinc-400 hover:bg-zinc-850"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
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
                        theme === "dark" ? "bg-zinc-900 text-white" : "bg-white"
                      }`}
                    >
                      <div className="flex-1 space-y-2.5">
                        {/* Status Header */}
                        <div
                          className={`flex items-center gap-2 pb-2.5 border-b ${theme === "dark" ? "border-zinc-800" : "border-gray-100"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              scanResult.alreadyScanned
                                ? "bg-amber-500/10 text-amber-500"
                                : theme === "dark"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-emerald-50 text-emerald-500"
                            }`}
                          >
                            {scanResult.alreadyScanned ? (
                              <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                scanResult.alreadyScanned
                                  ? "bg-amber-500/15 text-amber-600"
                                  : theme === "dark"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {scanResult.alreadyScanned
                                ? lang === "en"
                                  ? "Already Scanned / Checked In"
                                  : "ສະແກນແລ້ວ / ເຊັກອິນແລ້ວ"
                                : t.validTicket}
                            </span>
                            <h4 className="text-xs font-bold mt-0.5">
                              {t.ticketDetails}
                            </h4>
                          </div>
                        </div>

                        {/* Compact card layout */}
                        <div
                          className={`p-3 rounded-xl border space-y-2 text-[11px] transition-colors ${
                            theme === "dark"
                              ? "bg-zinc-950/40 border-zinc-850"
                              : "bg-gray-50/80 border-gray-100"
                          }`}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {t.attendee}
                              </span>
                              <span className="font-extrabold block truncate text-adv-slate dark:text-zinc-200">
                                {scanResult.attendeeName}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {t.ticketCode}
                              </span>
                              <span className="font-mono font-bold block truncate text-adv-slate dark:text-zinc-200">
                                {scanResult.id}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-gray-200/40 dark:border-zinc-800/60 pt-2 grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {t.zone}
                              </span>
                              <span className="font-bold block truncate text-xs text-adv-slate dark:text-zinc-300">
                                {scanResult.zone || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {t.seat}
                              </span>
                              <span className="font-bold block truncate text-xs text-adv-slate dark:text-zinc-300">
                                {scanResult.seat || "—"}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-gray-200/40 dark:border-zinc-800/60 pt-2">
                            <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                              {t.email}
                            </span>
                            <span className="font-semibold block truncate text-xs text-gray-500 dark:text-zinc-400">
                              {scanResult.email}
                            </span>
                          </div>

                          <div className="border-t border-gray-200/40 dark:border-zinc-800/60 pt-2 grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {t.price}
                              </span>
                              <span className="font-black text-adv-orange block">
                                {scanResult.price}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {t.scannedAt}
                              </span>
                              <span className="font-bold text-gray-500 block">
                                {scanResult.alreadyScanned
                                  ? (lang === "lo" ? "ເຊັກອິນແລ້ວ" : "Already checked in")
                                  : (lang === "lo" ? "ຍັງບໍ່ເຊັກອິນ" : "Not checked in")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`mt-4 flex gap-2 flex-shrink-0 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-gray-100"}`}
                      >
                        <button
                          onClick={() => setScanResult(null)}
                          className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest ${
                            theme === "dark"
                              ? "bg-zinc-850 text-zinc-300 hover:bg-zinc-800"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-150"
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmEntry}
                          disabled={isConfirmingEntry || scanResult.alreadyScanned}
                          className="flex-[2] py-2.5 rounded-xl bg-adv-orange text-white font-black hover:opacity-95 transition-all text-[10px] uppercase tracking-widest shadow-md"
                        >
                          {isConfirmingEntry ? (lang === "lo" ? "ກຳລັງກວດ..." : "Checking...") : t.confirmEntry}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual Check-in and Simulator Controls */}
                <div
                  className={`mt-6 pt-6 border-t ${theme === "dark" ? "border-zinc-800" : "border-gray-100"}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {t.manualEntry}
                    </span>
                    <span
                      className={`h-px flex-1 ${theme === "dark" ? "bg-zinc-850" : "bg-gray-100"}`}
                    />
                  </div>

                  <form
                    onSubmit={handleManualCheckIn}
                    className="flex gap-2 mb-3"
                  >
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder={t.enterTicketCode}
                      className={`flex-1 px-4 py-3 rounded-xl border text-xs font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all ${
                        theme === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-white"
                          : "bg-white border-gray-100 text-adv-slate"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isLookingUpTicket || !selectedEventId}
                      className="px-5 py-3 rounded-xl bg-adv-slate dark:bg-white text-white dark:text-adv-slate text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all"
                    >
                      {isLookingUpTicket ? (lang === "lo" ? "ກຳລັງກວດ..." : "Looking up...") : t.checkIn}
                    </button>
                  </form>

                </div>
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
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">
                {toast.text}
              </span>
              <button
                onClick={() =>
                  setToastQueue((prev) => prev.filter((t) => t.id !== toast.id))
                }
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
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug text-black">
                {t.profileUpdated}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
