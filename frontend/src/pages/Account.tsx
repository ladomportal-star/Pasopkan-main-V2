import { BankAccountInfo } from "../types";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  User,
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
  Lock,
  Search,
  Phone,
  Mail,
  FileText,
  Users,
  Eye,
  CheckSquare,
  Clock,
  Globe,
  ShieldAlert,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  api,
  listAllMyEvents,
  listAllOrganizerAttendees,
  type OrganizerAttendeeRow,
  type OrganizerCouponRedemption,
  type OrganizerPayoutRow,
  type EventStaffAssignment,
} from "../lib/api";
import { motion, AnimatePresence } from "motion/react";
import { LaoEvent, Coupon } from "../data/events";
import { fromBackendEvent, toEventPayload } from "../lib/eventPayload";
import { formatEventDateDDMMYYYY } from "../lib/dateFormat";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import SEO from "../components/SEO";
import ManageCouponsSection from "../components/ManageCouponsSection";
import BookingDayManagement, {
  type BookingAttendee,
  type WalkinCreateInput,
} from "../components/BookingDayManagement";
import AccountMiniDashboard from "../components/AccountMiniDashboard";
import { prepareProfilePhoto } from "../lib/profilePhoto";

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
      }) as Promise<{
        default: React.ComponentType<
          React.ComponentProps<typeof import("@yudiel/react-qr-scanner").Scanner>
        >;
      }>,
);

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Clipboard access was denied");
  }
}

const LAO_BANKS = [
  { id: "bcel", name: "BCEL Bank", label: "BCEL One", logo: "/BCEL.png" },
  { id: "jdb", name: "JDB Bank", label: "JDB", logo: "/JDB.png" },
  { id: "ldb", name: "LDB Bank", label: "LDB", logo: "/LDB.png" },
  { id: "ibcool", name: "Indochina Bank", label: "IB Cool", logo: "/IB.png" },
  { id: "stb", name: "ST Bank", label: "STB", logo: "/ST.png" },
  { id: "apb", name: "APB Bank", label: "APB", logo: "" },
];

function formatTimeToHHMM(timeStr?: string | null): string {
  if (!timeStr) return "";
  if (/^\d{2}:\d{2}$/.test(timeStr.trim())) return timeStr.trim();
  const parsed = new Date(timeStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  return timeStr;
}

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
    scanQr: "Scan QR Code",
    seatingConfig: "Seating Configuration",
    seatingDesc: "Visual representation of ticket zones and layout",
    viewFullMap: "View Full Map",
    closeDashboard: "Close Dashboard",
    entryScanner: "Entry Scanner",
    invalidTicket: "Invalid Ticket",
    validTicket: "Valid Ticket",
    confirmEntry: "Confirm Entry",
    alreadyScanned: "Ticket {id} already scanned!",
    profileUpdated: "Profile updated successfully",
    scannerError: "Scanner Error",
    resetScanner: "Reset Scanner",
    accessDenied: "Camera access denied",
    manualEntry: "Manual Check-in",
    enterTicketCode: "Enter ticket code (e.g. PSK-123456789012-1)",
    checkIn: "Check In",
    ticketCode: "Ticket Code",
    attendee: "Attendee",
    zone: "Zone",
    seat: "Seat",
    price: "Price",
    email: "Email",
    scannedAt: "Scanned at",
    ticketDetails: "Ticket Verification Details",
    staffScannerLinks: "Staff QR Scanner Access Links",
    staffScannerDesc:
      "Add a staff name now. Scanner access activates after they create or sign into a Pasopkan account.",
    createStaffLink: "Assign Staff Scanner",
    staffEmailLabel: "Staff Account Email or Name",
    staffEmailPlaceholder: "Email or exact account name",
    staffAccountHint: "Enter a name to add staff before they have an account. If they already have an account, an exact name or email activates scanner access now. Duplicate names require an email.",
    staffEmailInvalid: "Enter a staff name or account email.",
    staffAccountMissing: "No active account matches this email. Try the staff member’s name to add them before registration.",
    staffAccountAmbiguous: "More than one account has that name. Use the staff member’s account email.",
    staffAlreadyAssigned: "This person already has scanner access for this event.",
    staffAlreadyAdded: "This staff name has already been added to this event.",
    staffAddedPending: "Staff name added. They can scan after creating/signing into a Pasopkan account and being activated with the same name.",
    staffNameLabel: "Gate / Label (Optional)",
    staffNamePlaceholder: "e.g., Gate 1 - Main Entrance",
    generateLink: "Assign & Copy Link",
    copyLink: "Copy Link",
    linkCopied: "Staff Link Copied to Clipboard!",
    showQrCode: "Show QR Code",
    openScanner: "Open Scanner",
    qrCodeModalDesc:
      "Scan this QR code on a staff device (signed into the assigned account) to open the scanner portal immediately.",
    revoke: "Revoke",
    noStaffLinks:
      'No staff accounts assigned yet. Click "Assign Staff Scanner" above.',
    attendeeDirectory: "Ticket Buyers & Registration Directory",
    attendeeDirectoryDesc:
      "Track all registered ticket holders, check-in status, and their custom questionnaire responses.",
    allBuyers: "All Buyers",
    checkedIn: "Checked In",
    pendingGate: "Pending Gate Scan",
    viewAnswers: "View Answers",
    questionnaireAnswers: "Questionnaire Responses",
    noAttendeesFound: "No ticket buyers match the selected filters.",
    quickCheckin: "Quick Check-In",
    payouts: "Payout Bills",
    payoutsEmpty: "No payouts yet",
    cancel: "Cancel",
    close: "Close",
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
    scanQr: "ສະແກນ QR Code",
    seatingConfig: "ການຕັ້ງຄ່າບ່ອນນັ່ງ",
    seatingDesc: "ການສະແດງພາບຂອງເຂດປີ້ ແລະ ຮູບແບບ",
    viewFullMap: "ເບິ່ງແຜນຜັງທັງໝົດ",
    closeDashboard: "ປິດແຜງຄວບຄຸມ",
    entryScanner: "ເຄື່ອງສະແກນທາງເຂົ້າ",
    invalidTicket: "ປີ້ບໍ່ຖືກຕ້ອງ",
    validTicket: "ປີ້ຖືກຕ້ອງ",
    confirmEntry: "ຢືນຢັນການເຂົ້າ",
    alreadyScanned: "ປີ້ {id} ຖືກສະແກນແລ້ວ!",
    profileUpdated: "ອັບເດດໂປຣໄຟລ໌ສຳເລັດແລ້ວ",
    scannerError: "ຂໍ້ຜິດພາດຂອງເຄື່ອງສະແກນ",
    resetScanner: "ຣີເຊັດເຄື່ອງສະແກນ",
    accessDenied: "ການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບຖືກປະຕິເສດ",
    manualEntry: "ເຊັກອິນດ້ວຍຕົນເອງ",
    enterTicketCode: "ປ້ອນລະຫັດປີ້ (ເຊັ່ນ: PSK-123456789012-1)",
    checkIn: "ເຊັກອິນ",
    ticketCode: "ລະຫັດປີ້",
    attendee: "ຜູ້ເຂົ້າຮ່ວມ",
    zone: "ເຂດ",
    seat: "ບ່ອນນັ່ງ",
    price: "ລາຄາ",
    email: "ອີເມວ",
    scannedAt: "ສະແກນເມື່ອ",
    ticketDetails: "ລາຍລະອຽດການຢືນຢັນປີ້",
    staffScannerLinks: "ລິ້ງສະແກນປີ້ QR ສຳລັບພະນັກງານ",
    staffScannerDesc:
      "ເພີ່ມຊື່ພະນັກງານໄດ້ທັນທີ. ສິດສະແກນຈະເປີດໃຊ້ຫຼັງຈາກພະນັກງານສ້າງ ຫຼື ເຂົ້າບັນຊີ Pasopkan.",
    createStaffLink: "ເພີ່ມພະນັກງານສະແກນປີ້",
    staffEmailLabel: "ອີເມວ ຫຼື ຊື່ບັນຊີພະນັກງານ",
    staffEmailPlaceholder: "ອີເມວ ຫຼື ຊື່ບັນຊີ",
    staffAccountHint: "ພິມຊື່ເພື່ອເພີ່ມພະນັກງານກ່ອນມີບັນຊີໄດ້. ຖ້າມີບັນຊີແລ້ວ ໃຊ້ຊື່ທີ່ກົງກັນ ຫຼື ອີເມວເພື່ອເປີດສິດສະແກນທັນທີ. ຖ້າຊື່ຊ້ຳກັນໃຫ້ໃຊ້ອີເມວ.",
    staffEmailInvalid: "ກະລຸນາໃສ່ຊື່ພະນັກງານ ຫຼື ອີເມວບັນຊີ.",
    staffAccountMissing: "ບໍ່ພົບບັນຊີຕາມອີເມວນີ້. ລອງໃສ່ຊື່ພະນັກງານເພື່ອເພີ່ມກ່ອນລົງທະບຽນ.",
    staffAccountAmbiguous: "ພົບຫຼາຍກວ່າ 1 ບັນຊີທີ່ໃຊ້ຊື່ນີ້. ກະລຸນາໃຊ້ອີເມວຂອງພະນັກງານ.",
    staffAlreadyAssigned: "ພະນັກງານຄົນນີ້ມີສິດສະແກນໃນ Event ນີ້ແລ້ວ.",
    staffAlreadyAdded: "ຊື່ພະນັກງານນີ້ຖືກເພີ່ມໃນ Event ແລ້ວ.",
    staffAddedPending: "ເພີ່ມຊື່ພະນັກງານແລ້ວ. ພະນັກງານຈະສະແກນໄດ້ຫຼັງສ້າງ/ເຂົ້າບັນຊີ Pasopkan ແລະເປີດສິດດ້ວຍຊື່ເດີມ.",
    staffNameLabel: "ຊື່ປະຕູ / ຈຸດສະແກນ (ຖ້າມີ)",
    staffNamePlaceholder: "ເຊັ່ນ: ປະຕູ 1 - ທາງເຂົ້າຫຼັກ",
    generateLink: "ເພີ່ມພະນັກງານ & ຄັດລອກລິ້ງ",
    copyLink: "ຄັດລອກລິ້ງ",
    linkCopied: "ຄັດລອກລິ້ງພະນັກງານສຳເລັດແລ້ວ!",
    showQrCode: "ສະແດງ QR Code",
    openScanner: "ເປີດເຄື່ອງສະແກນ",
    qrCodeModalDesc:
      "ສະແກນ QR code ນີ້ໃນອຸປະກອນພະນັກງານ (ທີ່ເຂົ້າສູ່ລະບົບດ້ວຍບັນຊີທີ່ຖືກກຳນົດ) ເພື່ອເປີດໜ້າສະແກນທັນທີ.",
    revoke: "ຍົກເລີກ",
    noStaffLinks:
      'ຍັງບໍ່ມີພະນັກງານສະແກນປີ້ເທື່ອ. ກົດ "ເພີ່ມພະນັກງານສະແກນປີ້" ດ້ານເທິງ.',
    attendeeDirectory: "ລາຍຊື່ຜູ້ຊື້ປີ້ ແລະ ຄຳຕອບແບບສອບຖາມ",
    attendeeDirectoryDesc:
      "ຕິດຕາມຜູ້ຖືປີ້ທັງໝົດ, ສະຖານະການເຊັກອິນ, ແລະ ຄຳຕອບແບບສອບຖາມຂອງພວກເຂົາ.",
    allBuyers: "ຜູ້ຊື້ທັງໝົດ",
    checkedIn: "ເຊັກອິນແລ້ວ",
    pendingGate: "ລໍຖ້າສະແກນ",
    viewAnswers: "ເບິ່ງຄຳຕອບ",
    questionnaireAnswers: "ຄຳຕອບແບບສອບຖາມ",
    noAttendeesFound: "ບໍ່ພົບຂໍ້ມູນຜູ້ຊື້ປີ້ຕາມເງື່ອນໄຂທີ່ເລືອກ.",
    quickCheckin: "ເຊັກອິນດ່ວນ",
    payouts: "ໃບບິນເບີກຈ່າຍ",
    payoutsEmpty: "ຍັງບໍ່ມີປະຫວັດການເບີກຈ່າຍ",
    cancel: "ຍົກເລີກ",
    close: "ປິດ",
  },
};

/** Display legacy UUID ticket codes in their new compact form. QR codes keep
 * the original stored value, and the backend accepts this compact alias. */
function compactTicketCode(ticketCode: string): string {
  return ticketCode.replace(
    /^(PSK-\d{12}-\d+)-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "$1",
  );
}

export default function Account() {
  const [toastQueue, setToastQueue] = useState<
    {
      id: string;
      text: string;
      type: "error" | "success" | "warning" | "info";
    }[]
  >([]);

  const addToast = useCallback(
    (
      text: string,
      type: "error" | "success" | "warning" | "info" = "success",
      duration = 5000,
    ) => {
      const id = Date.now().toString() + Math.random().toString();
      setToastQueue((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToastQueue((prev) => prev.filter((item) => item.id !== id));
      }, duration);
    },
    [],
  );

  useEffect(() => {
    if (toastQueue.length > 0) {
      const timer = setTimeout(() => {
        setToastQueue((prev) => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastQueue]);

  const navigate = useNavigate();
  const { logout, user, token, syncProfileToSupabase } = useAuth();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const t = translations[lang] as Record<string, string>;

  const profilePic = user?.avatar || user?.photoURL || null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingProfilePhoto, setIsSavingProfilePhoto] = useState(false);
  const [showProfilePicSuccess, setShowProfilePicSuccess] = useState(false);

  type OrganizerEvent = LaoEvent & Record<string, any>;
  const [myEvents, setMyEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [eventsLoadError, setEventsLoadError] = useState(false);
  const [organizerAccessUid, setOrganizerAccessUid] = useState<string | null>(
    null,
  );
  const organizerAccess = Boolean(user?.id && organizerAccessUid === user.id);
  const eventOwnerRef = useRef(user?.id);
  eventOwnerRef.current = user?.id;

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
        category: "Festival",
        description: "",
        ticketTiers: [],
        registered: 0,
      }) as unknown as OrganizerEvent,
    [],
  );

  const selectedEvent =
    myEvents.find((e) => e.id === selectedEventId) || myEvents[0] || noEvent;

  // Backend Attendee Directory & Coupon Redemptions State
  const [attendeeRows, setAttendeeRows] = useState<OrganizerAttendeeRow[]>([]);
  const [attendeeStats, setAttendeeStats] = useState({
    totalPaid: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    totalIncomeKip: 0,
  });
  const [couponRedemptions, setCouponRedemptions] = useState<
    OrganizerCouponRedemption[]
  >([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesLoadError, setAttendeesLoadError] = useState(false);

  // Attendee Directory UI filters & pagination
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState("");
  const [attendeeTierFilter, setAttendeeTierFilter] = useState("all");
  const [attendeeFilter, setAttendeeFilter] = useState<
    "all" | "checked_in" | "pending"
  >("all");
  const [attendeeListPage, setAttendeeListPage] = useState(1);
  const [selectedAttendeeForAnswers, setSelectedAttendeeForAnswers] =
    useState<BookingAttendee | null>(null);
  const [checkinConfirmAttendee, setCheckinConfirmAttendee] =
    useState<BookingAttendee | null>(null);
  const [isQuickCheckingIn, setIsQuickCheckingIn] = useState(false);

  // Staff Scanner Assignments State (100% Backend)
  const [eventStaffList, setEventStaffList] = useState<EventStaffAssignment[]>(
    [],
  );
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [newStaffIdentifier, setNewStaffIdentifier] = useState("");
  const [staffFormError, setStaffFormError] = useState("");
  const [newStaffGateLabel, setNewStaffGateLabel] = useState("");
  const [isAssigningStaff, setIsAssigningStaff] = useState(false);
  const [activeStaffQrModal, setActiveStaffQrModal] = useState<{
    staffLabel: string;
    url: string;
  } | null>(null);

  // Payouts & Bank Account State (100% Backend)
  const [bankAccount, setBankAccount] = useState<BankAccountInfo | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });
  const [showBankConfirmModal, setShowBankConfirmModal] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [payoutRows, setPayoutRows] = useState<OrganizerPayoutRow[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutImagePreview, setPayoutImagePreview] = useState<string | null>(
    null,
  );
  const [loadingBillEventId, setLoadingBillEventId] = useState<string | null>(
    null,
  );
  const [activeTxTooltip, setActiveTxTooltip] = useState<string | null>(null);

  // Scanner & Seating Map Modals
  const [showFullMap, setShowFullMap] = useState(false);
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
  const [requestedTab, setActiveTab] = useState<
    "profile" | "my-event" | "payouts"
  >((location.state as any)?.targetTab || "profile");
  const activeTab = organizerAccess ? requestedTab : "profile";

  useEffect(() => {
    if ((location.state as any)?.targetTab) {
      setActiveTab((location.state as any).targetTab);
      window.scrollTo(0, 0);
    }
  }, [location.state]);

  const loadMyEvents = useCallback(async () => {
    const ownerId = user?.id;
    if (!ownerId) return;
    const rows = await listAllMyEvents({ token });
    if (eventOwnerRef.current !== ownerId) return;
    setEventsLoadError(false);
    const mine = rows.map((e) => {
      const mapped = fromBackendEvent(e);
      const registered = (mapped.ticketTiers || []).reduce(
        (sum: number, tier: any) => sum + (Number(tier.sold) || 0),
        0,
      );
      return { ...mapped, registered };
    });
    setMyEvents(mine);
    setSelectedEventId((prev) =>
      mine.some((ev) => ev.id === prev) ? prev : mine[0]?.id || "",
    );
  }, [user?.id, token]);

  const refreshEventAttendees = useCallback(
    async (targetEventId?: string) => {
      const evId = targetEventId ?? selectedEventId;
      if (!organizerAccess || !evId || !token) return;
      setAttendeesLoading(true);
      setAttendeesLoadError(false);
      try {
        const res = await listAllOrganizerAttendees(evId, { token });
        setAttendeeRows(res.attendees);
        setAttendeeStats(res.stats);
        setCouponRedemptions(res.couponRedemptions);
      } catch {
        setAttendeesLoadError(true);
      } finally {
        setAttendeesLoading(false);
      }
    },
    [organizerAccess, selectedEventId, token],
  );

  const refreshEventStaff = useCallback(
    async (targetEventId?: string) => {
      const evId = targetEventId ?? selectedEventId;
      if (!organizerAccess || !evId || !token) return;
      const res = await api.listEventStaff(evId, { token });
      if (res.ok && res.data?.staff) {
        setEventStaffList(res.data.staff);
      } else {
        setEventStaffList([]);
      }
    },
    [organizerAccess, selectedEventId, token],
  );

  const refreshPayouts = useCallback(async () => {
    if (!organizerAccess || !token) return;
    setPayoutsLoading(true);
    try {
      const res = await api.getOrganizerPayouts({ token });
      if (res.ok && res.data) {
        setBankAccount(res.data.bankAccount);
        if (res.data.bankAccount) {
          setBankFormData({
            bankName: res.data.bankAccount.bankName,
            accountName: res.data.bankAccount.accountName,
            accountNumber: res.data.bankAccount.accountNumber,
          });
        }
        setPayoutRows(res.data.payouts || []);
      }
    } finally {
      setPayoutsLoading(false);
    }
  }, [organizerAccess, token]);

  useEffect(() => {
    let cancelled = false;
    setOrganizerAccessUid(null);
    setMyEvents([]);
    setSelectedEventId("");
    setEventsLoadError(false);
    if (user && token) {
      api
        .get<{ canCreateEvent: boolean }>("/organizer/eligibility", {
          token,
          throwOnError: true,
        })
        .then(async ({ data }) => {
          if (cancelled) return;
          const allowed = data?.canCreateEvent === true;
          setOrganizerAccessUid(allowed ? user.id : null);
          if (allowed) await loadMyEvents();
        })
        .catch(() => {
          if (!cancelled) setEventsLoadError(true);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, token, loadMyEvents]);

  useEffect(() => {
    setAttendeeRows([]);
    setAttendeeStats({
      totalPaid: 0,
      checkedIn: 0,
      notCheckedIn: 0,
      totalIncomeKip: 0,
    });
    setCouponRedemptions([]);
    setEventStaffList([]);
    setAttendeeListPage(1);
    setAttendeeTierFilter("all");
    if (!organizerAccess || !selectedEventId || !token) return;
    void refreshEventAttendees(selectedEventId);
    void refreshEventStaff(selectedEventId);
  }, [
    organizerAccess,
    selectedEventId,
    token,
    refreshEventAttendees,
    refreshEventStaff,
  ]);

  useEffect(() => {
    if (organizerAccess && token) {
      void refreshPayouts();
    }
  }, [organizerAccess, token, refreshPayouts]);

  useEffect(() => {
    const handleSyncEvents = () => {
      if (organizerAccess) {
        loadMyEvents().catch(() => setEventsLoadError(true));
        void refreshPayouts();
      }
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
  }, [organizerAccess, loadMyEvents, refreshPayouts]);

  // Map backend OrganizerAttendeeRow -> BookingAttendee UI shape
  const eventAttendees: BookingAttendee[] = useMemo(() => {
    return attendeeRows.map((row) => ({
      id: row.id,
      ticketId: row.ticketCode,
      orderId: row.orderNumber,
      eventId: selectedEventId,
      attendeeName:
        row.attendeeName || (lang === "lo" ? "ຜູ້ເຂົ້າຮ່ວມ" : "Attendee"),
      email: row.attendeeEmail || "",
      phone: row.attendeePhone || "",
      ticketType: row.tierName || "Standard",
      tierId: row.tierId,
      price: `${(row.unitPriceKip || 0).toLocaleString()} LAK`,
      unitPriceKip: row.unitPriceKip || 0,
      purchaseDate: row.paidAt || row.createdAt || "",
      visitDate:
        row.selectedDate || (row.paidAt ? row.paidAt.slice(0, 10) : ""),
      timeSlot: row.selectedTime || "",
      isCheckedIn:
        row.status === "checked_in" || Boolean(row.checkedInAt),
      checkedInTime: row.checkedInAt
        ? formatTimeToHHMM(row.checkedInAt)
        : undefined,
      staffLabel: row.checkedInBy || row.gate || undefined,
      customAnswers: (row.customAnswers as Record<string, unknown>) || undefined,
    }));
  }, [attendeeRows, selectedEventId, lang]);

  const totalAttendeesCount = attendeeStats.totalPaid || eventAttendees.length;
  const checkedInCount =
    attendeeStats.checkedIn ||
    eventAttendees.filter((a) => a.isCheckedIn).length;
  const pendingCount = Math.max(0, totalAttendeesCount - checkedInCount);

  const filteredAttendees = useMemo(() => {
    return eventAttendees.filter((att) => {
      if (attendeeFilter === "checked_in" && !att.isCheckedIn) return false;
      if (attendeeFilter === "pending" && att.isCheckedIn) return false;
      if (
        attendeeTierFilter !== "all" &&
        att.ticketType !== attendeeTierFilter
      ) {
        return false;
      }
      const q = attendeeSearchQuery.toLowerCase().trim();
      if (!q) return true;
      const nameMatch = (att.attendeeName || "").toLowerCase().includes(q);
      const emailMatch = (att.email || "").toLowerCase().includes(q);
      const phoneMatch = (att.phone || "").toLowerCase().includes(q);
      const ticketMatch = (att.ticketId || "").toLowerCase().includes(q);
      const orderMatch = (att.orderId || "").toLowerCase().includes(q);
      const tierMatch = (att.ticketType || "").toLowerCase().includes(q);
      const answersMatch =
        att.customAnswers &&
        Object.values(att.customAnswers).some((val) => {
          if (typeof val === "string") return val.toLowerCase().includes(q);
          if (Array.isArray(val))
            return val.some((item) => String(item).toLowerCase().includes(q));
          return String(val ?? "").toLowerCase().includes(q);
        });
      return (
        nameMatch ||
        emailMatch ||
        phoneMatch ||
        ticketMatch ||
        orderMatch ||
        tierMatch ||
        Boolean(answersMatch)
      );
    });
  }, [
    eventAttendees,
    attendeeFilter,
    attendeeTierFilter,
    attendeeSearchQuery,
  ]);

  // Check-in & Booking Day Management Handlers (100% Backend)
  const handleBackendCheckIn = async (
    ticketCode: string,
    gateLabel = "Organizer Desk",
  ) => {
    if (!selectedEventId) return;
    const res = await api.scanCheckin(
      {
        ticketCode,
        eventId: selectedEventId,
        gate: gateLabel,
      },
      { token },
    );
    if (!res.ok || !res.data) {
      throw new Error(res.error || "Check-in failed");
    }
    if (res.data.status === "already_checked_in") {
      addToast(t.alreadyScanned.replace("{id}", ticketCode), "warning");
    }
    await refreshEventAttendees(selectedEventId);
  };

  const handleConfirmQuickCheckin = async () => {
    if (!checkinConfirmAttendee || isQuickCheckingIn) return;
    setIsQuickCheckingIn(true);
    try {
      await handleBackendCheckIn(
        checkinConfirmAttendee.ticketId || checkinConfirmAttendee.id,
        "Organizer Desk",
      );
      addToast(
        lang === "en"
          ? `Checked in ${checkinConfirmAttendee.attendeeName}`
          : `ເຊັກອິນ ${checkinConfirmAttendee.attendeeName} ສຳເລັດແລ້ວ`,
        "success",
      );
      setCheckinConfirmAttendee(null);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Check-in failed",
        "error",
      );
    } finally {
      setIsQuickCheckingIn(false);
    }
  };

  const handleCreateWalkin = async (input: WalkinCreateInput) => {
    if (!selectedEventId) return;
    const res = await api.createOrganizerWalkin(selectedEventId, input, {
      token,
    });
    if (!res.ok) {
      throw new Error(res.error || "Could not create walk-in booking");
    }
    await refreshEventAttendees(selectedEventId);
    await loadMyEvents();
  };

  const handleRescheduleAttendee = async (
    itemId: string,
    newDate: string,
    newSlot: string,
  ) => {
    if (!selectedEventId) return;
    const res = await api.rescheduleOrganizerAttendee(
      selectedEventId,
      itemId,
      { selectedDate: newDate, selectedTime: newSlot || null },
      { token },
    );
    if (!res.ok) {
      throw new Error(res.error || "Could not reschedule booking");
    }
    await refreshEventAttendees(selectedEventId);
  };

  // Staff Scanner Assignment Handlers (100% Backend)
  const buildStaffScannerUrl = (staffLabel: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/staff-scanner?eventId=${encodeURIComponent(selectedEventId)}&staffLabel=${encodeURIComponent(staffLabel)}`;
  };

  const handleAssignStaff = async () => {
    const identifier = newStaffIdentifier.trim();
    if (!selectedEventId || isAssigningStaff) return;
    if (!identifier) {
      setStaffFormError(t.staffEmailInvalid);
      return;
    }
    setStaffFormError("");
    setIsAssigningStaff(true);
    try {
      const res = await api.assignEventStaff(
        selectedEventId,
        identifier,
        { token },
        newStaffGateLabel.trim() || undefined,
      );
      if (!res.ok || !res.data?.staff) {
        setStaffFormError(
          res.status === 404
            ? t.staffAccountMissing
            : res.status === 409
              ? res.error?.startsWith("More than one account")
                ? t.staffAccountAmbiguous
                : res.error?.startsWith("A staff entry")
                  ? t.staffAlreadyAdded
                : t.staffAlreadyAssigned
              : res.status === 400
                ? t.staffEmailInvalid
                : (res.error || (lang === "lo" ? "ບໍ່ສາມາດເພີ່ມພະນັກງານໄດ້" : "Could not assign staff")),
        );
        return;
      }
      const staffUser = res.data.staff.user;
      if (!staffUser) {
        addToast(t.staffAddedPending, "success");
        setNewStaffIdentifier("");
        setNewStaffGateLabel("");
        setStaffFormError("");
        setShowCreateStaffModal(false);
        await refreshEventStaff(selectedEventId);
        return;
      }
      const displayName =
        res.data.staff.gateLabel ||
        [staffUser.firstName, staffUser.lastName].filter(Boolean).join(" ") ||
        staffUser.authEmail ||
        identifier;
      const url = buildStaffScannerUrl(displayName);
      let copied = false;
      try {
        await copyToClipboard(url);
        copied = true;
      } catch {
        // Keep the assignment even when the browser blocks clipboard access.
      }
      addToast(
        copied
          ? t.linkCopied
          : lang === "lo"
            ? "ເພີ່ມສິດແລ້ວ ແຕ່ຄັດລອກລິ້ງບໍ່ສຳເລັດ. ກົດປຸ່ມຄັດລອກອີກຄັ້ງ."
            : "Staff assigned, but the link could not be copied. Use the Copy Link button.",
        copied ? "success" : "warning",
      );
      setNewStaffIdentifier("");
      setNewStaffGateLabel("");
      setStaffFormError("");
      setShowCreateStaffModal(false);
      await refreshEventStaff(selectedEventId);
    } catch (error) {
      setStaffFormError(
        error instanceof Error
          ? error.message
          : (lang === "lo" ? "ບໍ່ສາມາດເພີ່ມພະນັກງານໄດ້" : "Could not assign staff"),
      );
    } finally {
      setIsAssigningStaff(false);
    }
  };

  const handleCopyStaffLink = async (url: string) => {
    try {
      await copyToClipboard(url);
      addToast(t.linkCopied, "success");
    } catch {
      addToast(
        lang === "lo"
          ? "ຄັດລອກລິ້ງບໍ່ສຳເລັດ. ກະລຸນາລອງໃໝ່."
          : "Could not copy the link. Please try again.",
        "error",
      );
    }
  };

  const handleRevokeStaff = async (userId: string) => {
    if (!selectedEventId) return;
    const res = await api.revokeEventStaff(selectedEventId, userId, { token });
    if (!res.ok) {
      addToast(res.error || "Could not revoke staff access", "error");
      return;
    }
    addToast(
      lang === "lo"
        ? "ຍົກເລີກສິດພະນັກງານສຳເລັດແລ້ວ"
        : "Staff access revoked",
      "warning",
    );
    await refreshEventStaff(selectedEventId);
  };

  // Excel Export Handler (with dynamic questionnaire columns)
  const handleExportToExcel = () => {
    const configuredQuestions =
      (selectedEvent as any)?.attendeeQuestions || [];
    const questionKeys = new Set<string>();
    const questionLabels: Record<string, string> = {};

    configuredQuestions.forEach((q: any) => {
      const qKey = q.id || q.label || q.title;
      if (qKey) {
        questionKeys.add(qKey);
        questionLabels[qKey] = q.label || q.title || q.id;
      }
    });

    eventAttendees.forEach((att) => {
      if (att.customAnswers) {
        Object.keys(att.customAnswers).forEach((key) => {
          questionKeys.add(key);
          if (!questionLabels[key]) {
            const matchingQ = configuredQuestions.find(
              (q: any) => q.id === key || q.label === key || q.title === key,
            );
            questionLabels[key] =
              matchingQ?.label || matchingQ?.title || key;
          }
        });
      }
    });

    const questionKeyList = Array.from(questionKeys);
    const baseHeaders = [
      "Ticket ID",
      "Order ID",
      "Attendee Full Name",
      "Email",
      "Phone",
      "Ticket Tier",
      "Price Paid",
      "Booking Date",
      "Time Slot",
      "Purchase Date",
      "Check-in Status",
      "Check-in Time",
      "Gate / Staff",
    ];
    const questionHeaderTitles = questionKeyList.map(
      (k) => `Question: ${questionLabels[k] || k}`,
    );
    const allHeaders = [...baseHeaders, ...questionHeaderTitles];

    const exportDataset =
      filteredAttendees.length > 0 ? filteredAttendees : eventAttendees;
    const rows = exportDataset.map((att) => {
      const answersValues = questionKeyList.map((k) => {
        if (
          !att.customAnswers ||
          att.customAnswers[k] === undefined ||
          att.customAnswers[k] === null
        ) {
          return "-";
        }
        const val = att.customAnswers[k];
        if (typeof val === "boolean") return val ? "Yes" : "No";
        if (Array.isArray(val)) return val.join(", ");
        return String(val);
      });

      return [
        att.ticketId || att.id,
        att.orderId || "N/A",
        att.attendeeName || "Attendee",
        att.email || "",
        att.phone || "",
        att.ticketType || "Standard",
        att.price || "",
        att.visitDate || "-",
        att.timeSlot || "-",
        att.purchaseDate ? new Date(att.purchaseDate).toLocaleString() : "",
        att.isCheckedIn ? "Checked In" : "Pending Gate Scan",
        att.checkedInTime || (att.isCheckedIn ? "Verified" : "Not Checked In"),
        att.staffLabel || (att.isCheckedIn ? "Organizer Desk" : "-"),
      ].concat(answersValues);
    });

    const worksheetData = [allHeaders, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendees");

    const cleanTitle =
      typeof selectedEvent?.title === "string" && selectedEvent.title
        ? selectedEvent.title.replace(/[^a-zA-Z0-9_-]/g, "_")
        : "event";
    XLSX.writeFile(
      wb,
      `attendees_and_responses_${cleanTitle}_${selectedEventId}.xlsx`,
    );

    addToast(
      lang === "en"
        ? `Successfully exported ${exportDataset.length} attendee records & answers to Excel!`
        : `ສົ່ງອອກຂໍ້ມູນຜູ້ຊື້ປີ້ ແລະ ຄຳຕອບແບບສອບຖາມ ${exportDataset.length} ລາຍການໄປຍັງ Excel ສຳເລັດແລ້ວ!`,
      "success",
    );
  };

  // QR Scanner Modal Handlers
  const lastScanRef = useRef<{ id: string; time: number } | null>(null);

  const handleScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || !selectedEventId) return;
    const now = Date.now();
    if (
      lastScanRef.current?.id === code &&
      now - lastScanRef.current.time < 2500
    ) {
      return;
    }
    lastScanRef.current = { id: code, time: now };
    setScannerError(null);
    setScanResult(null);
    setIsLookingUpTicket(true);
    try {
      const result = await api.lookupTicket(code, { token });
      const ticket = result.data?.ticket;
      if (!result.ok || !ticket) {
        throw new Error(result.error || t.invalidTicket);
      }
      if (ticket.eventId !== selectedEventId) {
        throw new Error("Ticket belongs to another event");
      }
      if (
        ticket.orderStatus !== "confirmed" ||
        ticket.itemStatus === "void" ||
        ticket.itemStatus === "refunded"
      ) {
        throw new Error("This ticket is not valid for entry");
      }
      setScanResult({
        id: ticket.ticketCode,
        valid: true,
        alreadyScanned:
          ticket.alreadyCheckedIn || ticket.itemStatus === "checked_in",
        attendeeName: ticket.attendeeName || undefined,
        ticketType: ticket.tierName,
        zone: ticket.zoneName || undefined,
        seat: ticket.seatLabel || undefined,
        price: `${new Intl.NumberFormat("lo-LA").format(ticket.unitPriceKip)} ₭`,
        email: ticket.attendeeEmail || undefined,
        phone: ticket.attendeePhone || undefined,
      });
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : t.invalidTicket,
        "error",
      );
      lastScanRef.current = null;
    } finally {
      setIsLookingUpTicket(false);
    }
  };

  const handleConfirmEntry = async () => {
    if (
      !scanResult ||
      scanResult.alreadyScanned ||
      !selectedEventId ||
      isConfirmingEntry
    ) {
      return;
    }
    setIsConfirmingEntry(true);
    try {
      const result = await api.scanCheckin(
        {
          ticketCode: scanResult.id,
          eventId: selectedEventId,
          gate: "Organizer Desk",
        },
        { token },
      );
      if (!result.ok || !result.data) {
        throw new Error(result.error || "Check-in failed");
      }
      if (result.data.status === "already_checked_in") {
        setScanResult({ ...scanResult, alreadyScanned: true });
        addToast(t.alreadyScanned.replace("{id}", scanResult.id), "warning");
        return;
      }
      await refreshEventAttendees(selectedEventId);
      addToast(
        lang === "lo" ? "ເຊັກອິນສຳເລັດແລ້ວ" : "Ticket checked in successfully",
        "success",
      );
      setScanResult(null);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Check-in failed",
        "error",
      );
    } finally {
      setIsConfirmingEntry(false);
    }
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    void handleScan(manualCode.trim());
    setManualCode("");
  };

  // Payouts & Bank Handlers (100% Backend)
  const daysSinceBankUpdate = useMemo(() => {
    if (!bankAccount?.updatedAt) return 999;
    const last = new Date(bankAccount.updatedAt).getTime();
    if (Number.isNaN(last)) return 999;
    return Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
  }, [bankAccount?.updatedAt]);

  const isBankInCoolingPeriod = Boolean(
    bankAccount?.updatedAt && daysSinceBankUpdate < 30,
  );
  const coolingDaysRemaining = isBankInCoolingPeriod
    ? 30 - daysSinceBankUpdate
    : 0;
  const unlockDate = bankAccount?.updatedAt
    ? new Date(
        new Date(bankAccount.updatedAt).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const pendingPayoutEvents = useMemo(
    () => payoutRows.filter((r) => r.status === "pending" && r.payoutKip > 0),
    [payoutRows],
  );
  const unclaimedRevenue = useMemo(
    () => pendingPayoutEvents.reduce((sum, r) => sum + r.payoutKip, 0),
    [pendingPayoutEvents],
  );

  const handleEditBankClick = () => {
    setBankFormData(
      bankAccount
        ? {
            bankName: bankAccount.bankName,
            accountName: bankAccount.accountName,
            accountNumber: bankAccount.accountNumber,
          }
        : { bankName: "", accountName: "", accountNumber: "" },
    );
    setIsEditingBank(true);
  };

  const handleSaveBankFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !bankFormData.bankName.trim() ||
      !bankFormData.accountName.trim() ||
      !bankFormData.accountNumber.trim()
    ) {
      addToast(
        lang === "lo"
          ? "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບທຸກຊ່ອງ"
          : "Please fill all bank fields",
        "error",
      );
      return;
    }
    setShowBankConfirmModal(true);
  };

  const handleConfirmSaveBank = async () => {
    if (isSavingBank) return;
    setIsSavingBank(true);
    try {
      const res = await api.updateOrganizerBankDetails(
        {
          bankName: bankFormData.bankName.trim(),
          accountHolder: bankFormData.accountName.trim(),
          accountNumber: bankFormData.accountNumber.trim(),
        },
        { token },
      );
      if (!res.ok || !res.data?.bankAccount) {
        addToast(
          res.error ||
            (lang === "lo"
              ? "ບໍ່ສາມາດບັນທຶກຂໍ້ມູນທະນາຄານໄດ້"
              : "Failed to save bank details"),
          "error",
        );
        return;
      }
      setBankAccount(res.data.bankAccount);
      setIsEditingBank(false);
      setShowBankConfirmModal(false);
      addToast(
        lang === "lo"
          ? "ອັບເດດຂໍ້ມູນທະນາຄານສຳເລັດແລ້ວ!"
          : "Bank details updated successfully!",
        "success",
      );
      await refreshPayouts();
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleOpenPayoutBill = async (eventId: string) => {
    if (loadingBillEventId) return;
    setLoadingBillEventId(eventId);
    try {
      const res = await api.getOrganizerPayoutBillUrl(eventId, { token });
      if (res.ok && res.data?.url) {
        setPayoutImagePreview(res.data.url);
      } else {
        addToast(
          res.error ||
            (lang === "lo"
              ? "ຍັງບໍ່ມີຮູບໃບບິນໂອນເງິນ"
              : "Transfer receipt is not available yet"),
          "info",
        );
      }
    } finally {
      setLoadingBillEventId(null);
    }
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
      { token },
    );
    if (!res.ok) {
      addToast(res.error || "Failed to save coupons", "error");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSavingProfilePhoto) return;
    setIsSavingProfilePhoto(true);
    try {
      const profilePicDataUrl = await prepareProfilePhoto(file);
      await syncProfileToSupabase({ profilePic: profilePicDataUrl });
      setShowProfilePicSuccess(true);
      setTimeout(() => setShowProfilePicSuccess(false), 5000);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Could not save profile photo",
        "error",
      );
    } finally {
      setIsSavingProfilePhoto(false);
      e.target.value = "";
    }
  };

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
          ? "Configure push, email, and activity notifications"
          : "ຕັ້ງຄ່າການແຈ້ງເຕືອນ Push, Email ແລະກິດຈະກຳ",
      path: "/notification-settings",
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
        {organizerAccess && (
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
              className={`flex-1 min-w-22.5 sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 cursor-pointer ${
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
              className={`flex-1 min-w-22.5 sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 cursor-pointer ${
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
              className={`flex-1 min-w-22.5 sm:flex-initial text-center py-2 sm:pb-4 sm:pt-0 text-xs sm:text-sm font-bold transition-all rounded-lg sm:rounded-none sm:border-b-2 cursor-pointer ${
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
        )}

        {/* TAB 1: PROFILE */}
        <div className={activeTab === "profile" ? "block" : "hidden"}>
          <div
            className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8 shadow-sm border transition-all ${
              theme === "dark"
                ? "bg-zinc-900 border-zinc-800/80 text-white"
                : "bg-white border-gray-100 text-adv-slate"
            }`}
          >
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => {
                if (!isSavingProfilePhoto) fileInputRef.current?.click();
              }}
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
                accept="image/jpeg,image/png,image/webp"
                disabled={isSavingProfilePhoto}
                className="hidden"
              />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                  "Pasopkan"}
              </h2>
              {user?.email && (
                <p className="text-gray-400 font-medium mb-1 text-xs sm:text-sm truncate">
                  {user.email}
                </p>
              )}
              {user?.publicId && (
                <p className="text-gray-400/80 font-medium text-[10px] sm:text-xs truncate">
                  ID: {user.publicId}
                </p>
              )}
            </div>
          </div>

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
                    <span className="block text-xs text-gray-400 font-medium truncate max-w-50 xs:max-w-[280px] sm:max-w-none">
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
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold text-sm sm:text-base cursor-pointer ${
                theme === "dark"
                  ? "bg-zinc-900 border-red-500/20 text-red-400 hover:bg-red-500/5"
                  : "bg-white border-red-50 text-red-500 hover:bg-red-50"
              }`}
            >
              <LogOut className="w-5 h-5" />
              {t.signOut}
            </button>
          </div>

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

        {/* TAB 2: MANAGE EVENT */}
        {organizerAccess && (
          <div className={activeTab === "my-event" ? "block" : "hidden"}>
            {eventsLoadError && (
              <p
                role="alert"
                className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {lang === "lo"
                  ? "ບໍ່ສາມາດໂຫຼດງານຂອງທ່ານໄດ້. ກະລຸນາໂຫຼດໜ້າໃໝ່."
                  : "Could not load your events. Please reload the page."}
              </p>
            )}

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
                  className={`w-full border rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 shadow-sm appearance-none pr-12 transition-colors cursor-pointer ${
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
                {lang === "lo"
                  ? "ຍັງບໍ່ມີກິດຈະກຳຂອງທ່ານໃນລະບົບ"
                  : "You do not have any events to manage yet."}
              </div>
            )}

            {selectedEvent.id && (
              <>
                <AccountMiniDashboard
                  theme={theme}
                  lang={lang}
                  isSingleEvent={true}
                  eventTitle={selectedEvent.title}
                  totalAttendees={totalAttendeesCount}
                  totalCheckedIn={checkedInCount}
                  totalIncome={attendeeStats.totalIncomeKip}
                  onNavigateToPayouts={() => {
                    setActiveTab("payouts");
                    window.scrollTo(0, 0);
                  }}
                />

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
                        className={`w-full sm:w-28 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm relative ${
                          theme === "dark" ? "bg-zinc-950" : "bg-gray-100"
                        }`}
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
                              {lang === "lo"
                                ? "ລໍຖ້າອະນຸມັດ"
                                : "Pending Approval"}
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
                              ? `${formatEventDateDDMMYYYY(selectedEvent.bookingStartDate || selectedEvent.date)} to ${selectedEvent.bookingEndDate ? formatEventDateDDMMYYYY(selectedEvent.bookingEndDate) : "Ongoing"} • Daily Sessions`
                              : formatEventDateDDMMYYYY(selectedEvent.date)}
                          </span>
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <MapPin className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-adv-orange shrink-0" />{" "}
                            {selectedEvent.location}
                          </span>
                        </div>
                      </div>
                    </div>

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

                  {/* Scan QR Code Primary Button */}
                  <div className="w-full">
                    <button
                      onClick={() => setShowScanner(true)}
                      className="w-full flex items-center justify-center gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-adv-slate dark:bg-white text-white dark:text-adv-slate font-bold hover:opacity-95 transition-all shadow-md active:scale-[0.98] transform cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-adv-orange animate-pulse" />
                      <span className="text-sm sm:text-base">{t.scanQr}</span>
                    </button>
                  </div>

                  {/* Staff QR Scanner Access Links Card */}
                  <div
                    className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border transition-all ${
                      theme === "dark"
                        ? "bg-zinc-900 border-zinc-800 text-white"
                        : "bg-white border-gray-100 text-adv-slate"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-gray-100/50 dark:border-zinc-800/50">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Link2 className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="text-sm sm:text-base font-bold">
                            {t.staffScannerLinks}
                          </h4>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium max-w-xl">
                          {t.staffScannerDesc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setStaffFormError("");
                          setShowCreateStaffModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.createStaffLink}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {eventStaffList.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400 font-medium">
                          {t.noStaffLinks}
                        </div>
                      ) : (
                        eventStaffList.map((staffItem) => {
                          const accountName = staffItem.user
                            ? [staffItem.user.firstName, staffItem.user.lastName].filter(Boolean).join(" ") || staffItem.user.authEmail
                            : null;
                          const staffDisplayName = staffItem.staffName || accountName || "Gate Staff";
                          const staffUrl =
                            buildStaffScannerUrl(staffItem.gateLabel || staffDisplayName);
                          const assignedDateStr = staffItem.assignedAt
                            ? new Date(
                                staffItem.assignedAt,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "";

                          return (
                            <div
                              key={staffItem.id}
                              className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                                theme === "dark"
                                  ? "bg-zinc-950/50 border-zinc-800"
                                  : "bg-gray-50/80 border-gray-100"
                              }`}
                            >
                              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-black truncate">
                                  {staffDisplayName}
                                </span>
                                {staffItem.gateLabel && (
                                  <span className="text-[11px] text-gray-400 truncate">
                                    · {staffItem.gateLabel}
                                  </span>
                                )}
                                {staffItem.user?.authEmail &&
                                  staffDisplayName !==
                                    staffItem.user.authEmail && (
                                    <span className="text-[11px] text-gray-400 truncate">
                                      ({staffItem.user.authEmail})
                                    </span>
                                  )}
                                {assignedDateStr && (
                                  <span className="text-[10px] text-gray-400 font-medium hidden md:inline-block shrink-0">
                                    •{" "}
                                    {lang === "lo" ? "ເພີ່ມເມື່ອ" : "Assigned"}:{" "}
                                    {assignedDateStr}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => void handleCopyStaffLink(staffUrl)}
                                  aria-label={t.copyLink}
                                  title={t.copyLink}
                                  className={`min-h-10 min-w-10 px-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                    theme === "dark"
                                      ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                                      : "bg-white border-gray-200 text-gray-700 hover:text-adv-slate"
                                  }`}
                                >
                                  <Copy className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[10px] hidden sm:inline">
                                    {t.copyLink}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveStaffQrModal({
                                      staffLabel: staffDisplayName,
                                      url: staffUrl,
                                    })
                                  }
                                  aria-label={t.showQrCode}
                                  title={t.showQrCode}
                                  className={`h-10 w-10 shrink-0 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                    theme === "dark"
                                      ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                                      : "bg-white border-gray-200 text-gray-700 hover:text-adv-slate"
                                  }`}
                                >
                                  <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                                </button>

                                <a
                                  href={staffUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={t.openScanner}
                                  title={t.openScanner}
                                  className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRevokeStaff(staffItem.id)
                                  }
                                  title={t.revoke}
                                  className="h-10 w-10 shrink-0 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Coupons & Discounts Management */}
                  <ManageCouponsSection
                    eventId={String(selectedEvent.id)}
                    coupons={selectedEvent.coupons || []}
                    redemptions={couponRedemptions}
                    onUpdateCoupons={handleUpdateEventCoupons}
                    theme={theme}
                    lang={lang}
                  />

                  {selectedEvent.dateType === "booking" ? (
                    <BookingDayManagement
                      event={selectedEvent}
                      attendees={eventAttendees}
                      onCheckInAttendee={handleBackendCheckIn}
                      onCreateWalkin={handleCreateWalkin}
                      onRescheduleAttendee={handleRescheduleAttendee}
                      theme={theme}
                      lang={lang}
                      onOpenScanner={() => setShowScanner(true)}
                    />
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
                              className="w-full h-auto max-h-60 sm:max-h-80 object-contain rounded-xl"
                              referrerPolicy="no-referrer"
                            />

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

                      {/* Ticket Buyers & Registration Directory */}
                      <div
                        className={`rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border transition-all ${
                          theme === "dark"
                            ? "bg-zinc-900 border-zinc-800 text-white"
                            : "bg-white border-gray-100 text-adv-slate"
                        }`}
                      >
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <h4 className="text-base sm:text-lg font-black">
                                {t.attendeeDirectory}
                              </h4>
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
                                placeholder={
                                  lang === "lo"
                                    ? "ຄົ້ນຫາຊື່, ອີເມວ, ເບີໂທ, ຫຼື ລະຫັດປີ້..."
                                    : "Search name, email, phone, or ticket ID..."
                                }
                                className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all ${
                                  theme === "dark"
                                    ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500"
                                    : "bg-gray-50 border-gray-200 text-adv-slate placeholder-gray-400"
                                }`}
                              />
                              {attendeeSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAttendeeSearchQuery("");
                                    setAttendeeListPage(1);
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {selectedEvent.ticketTiers &&
                              selectedEvent.ticketTiers.length > 1 && (
                                <div className="w-full sm:w-48 shrink-0">
                                  <select
                                    value={attendeeTierFilter}
                                    onChange={(e) => {
                                      setAttendeeTierFilter(e.target.value);
                                      setAttendeeListPage(1);
                                    }}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange/30 transition-all cursor-pointer ${
                                      theme === "dark"
                                        ? "bg-zinc-950 border-zinc-800 text-white"
                                        : "bg-gray-50 border-gray-200 text-adv-slate"
                                    }`}
                                  >
                                    <option value="all">
                                      {lang === "lo"
                                        ? "ທຸກລະດັບປີ້ (Tiers)"
                                        : "All Ticket Tiers"}
                                    </option>
                                    {selectedEvent.ticketTiers.map(
                                      (tItem: any, idx: number) => (
                                        <option key={idx} value={tItem.name}>
                                          {tItem.name}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                              )}

                            <button
                              type="button"
                              disabled={eventAttendees.length === 0}
                              onClick={handleExportToExcel}
                              className="px-4 py-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-[1.02] active:scale-[0.98] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-emerald-500/20 shadow-sm shrink-0 cursor-pointer disabled:opacity-40"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>
                                {lang === "en"
                                  ? "Export Excel"
                                  : "ສົ່ງອອກ Excel"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {attendeesLoadError && (
                          <div
                            role="alert"
                            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                          >
                            {lang === "lo"
                              ? "ໂຫຼດລາຍຊື່ຈາກ Backend ບໍ່ສຳເລັດ. ກະລຸນາລອງໃໝ່."
                              : "Could not load attendees from the backend. Please try again."}
                          </div>
                        )}

                        {/* 3 Status Pills */}
                        <div className="mb-5">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 p-1.5 bg-gray-100/80 dark:bg-zinc-950/60 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-zinc-850">
                            <button
                              type="button"
                              onClick={() => {
                                setAttendeeFilter("all");
                                setAttendeeListPage(1);
                              }}
                              className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-2 text-center h-full min-h-9 sm:min-h-11 ${
                                attendeeFilter === "all"
                                  ? "bg-adv-orange text-white shadow-sm"
                                  : "text-gray-500 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
                              }`}
                            >
                              <span className="whitespace-normal leading-tight text-left flex-1 min-w-0">
                                {t.allBuyers}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  attendeeFilter === "all"
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300"
                                }`}
                              >
                                {totalAttendeesCount}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAttendeeFilter("checked_in");
                                setAttendeeListPage(1);
                              }}
                              className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-2 text-center h-full min-h-9 sm:min-h-11 ${
                                attendeeFilter === "checked_in"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-gray-500 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
                              }`}
                            >
                              <span className="flex items-center gap-1.5 flex-1 min-w-0">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-normal leading-tight text-left min-w-0">
                                  {t.checkedIn}
                                </span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  attendeeFilter === "checked_in"
                                    ? "bg-white/20 text-white"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {checkedInCount}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAttendeeFilter("pending");
                                setAttendeeListPage(1);
                              }}
                              className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-2 text-center h-full min-h-9 sm:min-h-11 ${
                                attendeeFilter === "pending"
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "text-gray-500 dark:text-gray-400 hover:text-adv-slate dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
                              }`}
                            >
                              <span className="flex items-center gap-1.5 flex-1 min-w-0">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-normal leading-tight text-left min-w-0">
                                  {t.pendingGate}
                                </span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  attendeeFilter === "pending"
                                    ? "bg-white/20 text-white"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {pendingCount}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Attendees List Cards */}
                        <div className="space-y-3.5">
                          {attendeesLoading ? (
                            <div className="py-12 flex items-center justify-center gap-2 text-sm text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin text-adv-orange" />
                              <span>
                                {lang === "lo"
                                  ? "ກຳລັງໂຫຼດລາຍຊື່ຜູ້ຊື້ປີ້..."
                                  : "Loading ticket buyers..."}
                              </span>
                            </div>
                          ) : filteredAttendees.length === 0 ? (
                            <div
                              className={`py-12 px-4 text-center rounded-2xl border border-dashed ${
                                theme === "dark"
                                  ? "border-zinc-800 text-zinc-400"
                                  : "border-gray-200 text-gray-500"
                              }`}
                            >
                              <Users className="w-10 h-10 mx-auto mb-2 text-gray-400 opacity-60" />
                              <p className="font-bold text-sm mb-1">
                                {t.noAttendeesFound}
                              </p>
                              <p className="text-xs text-gray-400">
                                {attendeeSearchQuery
                                  ? lang === "lo"
                                    ? "ລອງປ່ຽນຄຳຄົ້ນຫາໃໝ່"
                                    : "Try adjusting your search terms"
                                  : lang === "lo"
                                    ? "ຍັງບໍ່ມີຂໍ້ມູນຜູ້ຊື້ປີ້ທີ່ຊຳລະສຳເລັດໃນໝວດນີ້"
                                    : "No confirmed ticket buyers in this category yet"}
                              </p>
                            </div>
                          ) : (
                            (() => {
                              const ATTENDEES_PER_PAGE = 10;
                              const totalAttendeePages =
                                Math.ceil(
                                  filteredAttendees.length / ATTENDEES_PER_PAGE,
                                ) || 1;
                              const safePage = Math.min(
                                attendeeListPage,
                                totalAttendeePages,
                              );
                              const paginatedAttendees =
                                filteredAttendees.slice(
                                  (safePage - 1) * ATTENDEES_PER_PAGE,
                                  safePage * ATTENDEES_PER_PAGE,
                                );

                              return (
                                <>
                                  {paginatedAttendees.map((att, index) => {
                                    const answerEntries = att.customAnswers
                                      ? Object.entries(
                                          att.customAnswers,
                                        ).filter(
                                          ([_, val]) =>
                                            val !== undefined &&
                                            val !== null &&
                                            val !== "",
                                        )
                                      : [];
                                    const answerCount = answerEntries.length;

                                    return (
                                      <motion.div
                                        key={att.id || att.ticketId || index}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
                                          theme === "dark"
                                            ? "bg-zinc-950/50 border-zinc-850 hover:border-orange-500/20"
                                            : "bg-[#F9FAFB] border-gray-150 hover:border-orange-200 hover:shadow-xs"
                                        }`}
                                      >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-1">
                                              <span className="text-sm sm:text-base font-black truncate max-w-[200px] sm:max-w-none">
                                                {att.attendeeName || "Attendee"}
                                              </span>
                                              <span className="w-fit px-2 py-0.5 bg-adv-slate dark:bg-zinc-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {att.ticketType || "Standard"}
                                              </span>
                                            </div>

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
                                                Ticket ID:{" "}
                                                <span className="font-bold text-adv-slate dark:text-white sm:ml-1">
                                                  {compactTicketCode(att.ticketId || att.id)}
                                                </span>
                                              </span>
                                            </div>

                                            <div className="flex flex-row flex-wrap items-center gap-2.5 text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider">
                                              {att.price && (
                                                <span className="text-adv-orange font-mono font-black">
                                                  {att.price}
                                                </span>
                                              )}
                                              {att.checkedInTime &&
                                                att.isCheckedIn && (
                                                  <>
                                                    {att.price && (
                                                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                                    )}
                                                    <span className="flex items-center gap-1 font-mono font-bold lowercase text-emerald-500">
                                                      <Clock className="w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0" />
                                                      <span>
                                                        {formatTimeToHHMM(
                                                          att.checkedInTime,
                                                        )}
                                                      </span>
                                                    </span>
                                                  </>
                                                )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200/60 dark:border-zinc-850 shrink-0 w-full sm:w-auto">
                                            <div
                                              className={`grid ${
                                                answerCount > 0
                                                  ? "grid-cols-2"
                                                  : "grid-cols-1"
                                              } sm:flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto`}
                                            >
                                              {answerCount > 0 ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setSelectedAttendeeForAnswers(
                                                      att,
                                                    )
                                                  }
                                                  className="w-full sm:w-[138px] h-9 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-adv-orange border border-orange-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-95 shadow-2xs"
                                                >
                                                  <Eye className="w-3.5 h-3.5 shrink-0" />
                                                  <span>{t.viewAnswers}</span>
                                                </button>
                                              ) : null}

                                              {att.isCheckedIn ? (
                                                <div
                                                  className="w-full sm:w-[138px] h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs select-none shrink-0 whitespace-nowrap"
                                                  title={
                                                    att.checkedInTime
                                                      ? `${t.checkedIn} @ ${att.checkedInTime}`
                                                      : t.checkedIn
                                                  }
                                                >
                                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                  <span>{t.checkedIn}</span>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setCheckinConfirmAttendee(
                                                      att,
                                                    )
                                                  }
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

                                  {totalAttendeePages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-4 border-t border-gray-100 dark:border-zinc-800/80">
                                      <div className="text-xs font-bold text-gray-400">
                                        {lang === "en"
                                          ? `Page ${safePage} of ${totalAttendeePages} (${filteredAttendees.length} total buyers)`
                                          : `ໜ້າ ${safePage} ຈາກ ${totalAttendeePages} (ທັງໝົດ ${filteredAttendees.length} ຜູ້ຊື້)`}
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setAttendeeListPage((prev) =>
                                              Math.max(prev - 1, 1),
                                            )
                                          }
                                          disabled={safePage === 1}
                                          className="p-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                        >
                                          <ChevronLeft className="w-4 h-4" />
                                        </button>

                                        {Array.from(
                                          { length: totalAttendeePages },
                                          (_, i) => i + 1,
                                        ).map((p) => {
                                          if (
                                            p === 1 ||
                                            p === totalAttendeePages ||
                                            (p >= safePage - 1 &&
                                              p <= safePage + 1)
                                          ) {
                                            return (
                                              <button
                                                key={p}
                                                type="button"
                                                onClick={() =>
                                                  setAttendeeListPage(p)
                                                }
                                                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                  safePage === p
                                                    ? "bg-adv-orange text-white shadow-sm"
                                                    : "border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                }`}
                                              >
                                                {p}
                                              </button>
                                            );
                                          }
                                          if (
                                            p === safePage - 2 ||
                                            p === safePage + 2
                                          ) {
                                            return (
                                              <span
                                                key={p}
                                                className="text-gray-400 dark:text-zinc-500 font-bold px-1"
                                              >
                                                ...
                                              </span>
                                            );
                                          }
                                          return null;
                                        })}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setAttendeeListPage((prev) =>
                                              Math.min(
                                                prev + 1,
                                                totalAttendeePages,
                                              ),
                                            )
                                          }
                                          disabled={
                                            safePage === totalAttendeePages
                                          }
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
              </>
            )}
          </div>
        )}

        {/* Payouts Tab (100% Demo UI + 100% Backend API Data) */}
        {organizerAccess && (
          <div className={activeTab === "payouts" ? "block" : "hidden"}>
            <div className="space-y-6">
              <div>
                <h2
                  className={`text-xl sm:text-2xl font-bold mb-1 ${
                    theme === "dark" ? "text-white" : "text-adv-slate"
                  }`}
                >
                  {lang === "lo" ? "ໃບບິນເບີກຈ່າຍ" : "Payout Bills"}
                </h2>
                <p
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-500"
                  }`}
                >
                  {lang === "lo"
                    ? "ຕິດຕາມລາຍຮັບສຸດທິຈາກການຂາຍປີ້, ຕັ້ງຄ່າບັນຊີທະນາຄານຮັບເງິນ, ແລະ ກວດສອບໃບບິນໂອນເງິນ"
                    : "Track net ticket revenue, configure your payout bank account, and inspect transfer receipts"}
                </p>
              </div>

              {/* Claimable Event Revenue Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50 to-slate-100 text-adv-slate p-6 sm:p-8 shadow-sm border border-gray-200">
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-adv-orange/10 blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-black uppercase tracking-wider text-orange-700 mb-3">
                        <DollarSign className="w-3.5 h-3.5" />
                        {lang === "lo"
                          ? "ຍອດເງິນລໍຖ້າໂອນເຂົ້າບັນຊີ"
                          : "Claimable Event Revenue"}
                      </div>
                      <div className="text-3xl sm:text-4xl font-black tracking-tight">
                        {unclaimedRevenue.toLocaleString()}{" "}
                        <span className="text-lg sm:text-xl font-bold text-adv-orange">
                          LAK
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                        {lang === "lo"
                          ? `ຈາກ ${pendingPayoutEvents.length} ກິດຈະກຳທີ່ມີຍອດຂາຍລໍຖ້າໂອນ`
                          : `Across ${pendingPayoutEvents.length} event(s) with pending settlement`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-600 self-start sm:self-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {lang === "lo"
                          ? "ໂອນເງິນອັດຕະໂນມັດຫຼັງຈົບງານ 3-5 ວັນລັດຖະການ"
                          : "Settled within 3-5 business days post-event"}
                      </span>
                    </div>
                  </div>

                  {/* Pending Payout Breakdown */}
                  {pendingPayoutEvents.length > 0 && (
                    <div className="space-y-2.5 mb-5 pt-4 border-t border-gray-200">
                      {pendingPayoutEvents.map((ev) => (
                        <div
                          key={ev.eventId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-white border border-gray-200"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-adv-slate truncate">
                              {ev.eventTitle}
                            </p>
                            <p className="text-xs text-gray-500">
                              {ev.eventDate
                                ? formatEventDateDDMMYYYY(ev.eventDate)
                                : "-"}{" "}
                              •{" "}
                              {lang === "lo"
                                ? `ຂາຍແລ້ວ ${ev.ticketsSold} ປີ້`
                                : `${ev.ticketsSold} tickets sold`}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="text-sm font-black text-emerald-700">
                              {ev.payoutKip.toLocaleString()} LAK
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                              {lang === "lo" ? "ລໍຖ້າໂອນ" : "Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 30-Day Cooling Period Security Banner */}
                  {isBankInCoolingPeriod && (
                    <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                        <p className="font-bold text-amber-800 mb-0.5">
                          {lang === "lo"
                            ? `ໄລຍະເວລາຄຸ້ມຄອງຄວາມປອດໄພບັນຊີໃໝ່ (ອີກ ${coolingDaysRemaining} ວັນ)`
                            : `Security Cooling Period Active (${coolingDaysRemaining} days remaining)`}
                        </p>
                        <p className="text-amber-800/80 text-xs">
                          {lang === "lo"
                            ? `ບັນຊີທະນາຄານຖືກປ່ຽນເມື່ອບໍ່ດົນມານີ້. ເພື່ອປ້ອງກັນການສໍ້ໂກງ ລະບົບຈະກວດສອບກ່ອນປົດລັອກໃນວັນທີ ${unlockDate}.`
                            : `Your payout bank was recently updated. Standard anti-fraud hold clears on ${unlockDate}.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Security Policy Bullet Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-600 pt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {lang === "lo"
                          ? "ຄ່າທຳນຽມແພລດຟອມຄິດໄລ່ຕາມຍອດຂາຍປີ້ຈິງເທົ່ານັ້ນ"
                          : "Platform fee calculated strictly on confirmed ticket orders"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {lang === "lo"
                          ? "ມີຫຼັກຖານໃບບິນໂອນເງິນຈາກລະບົບທຸກລາຍການ"
                          : "Official transfer slip attached for every completed payout"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Settings Card */}
              <div
                className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-colors ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-adv-orange/10 text-adv-orange flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-bold ${
                          theme === "dark" ? "text-white" : "text-adv-slate"
                        }`}
                      >
                        {lang === "lo"
                          ? "ບັນຊີທະນາຄານຮັບເງິນ"
                          : "Payout Bank Account"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                        {lang === "lo"
                          ? "ບັນຊີສຳລັບຮັບເງິນຄ່າປີ້ຫຼັງຈົບກິດຈະກຳ"
                          : "Destination account for event ticket settlements"}
                      </p>
                    </div>
                  </div>

                  {bankAccount && !isEditingBank && (
                    <button
                      type="button"
                      onClick={handleEditBankClick}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-adv-orange text-xs sm:text-sm font-bold text-adv-slate dark:text-zinc-200 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Edit2 className="w-4 h-4 text-adv-orange" />
                      {lang === "lo"
                        ? "ແກ້ໄຂຂໍ້ມູນທະນາຄານ"
                        : "Edit Bank Details"}
                    </button>
                  )}
                </div>

                {!bankAccount || isEditingBank ? (
                  <form
                    onSubmit={handleSaveBankFormSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                          {lang === "lo" ? "ເລືອກທະນາຄານ" : "Select Bank"}
                        </label>
                        <div className="relative">
                          <select
                            value={bankFormData.bankName}
                            onChange={(e) =>
                              setBankFormData((prev) => ({
                                ...prev,
                                bankName: e.target.value,
                              }))
                            }
                            required
                            className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl border text-sm font-bold focus:outline-none focus:border-adv-orange ${
                              theme === "dark"
                                ? "bg-zinc-950 border-zinc-800 text-white"
                                : "bg-gray-50 border-gray-200 text-adv-slate"
                            }`}
                          >
                            <option value="">
                              {lang === "lo"
                                ? "-- ເລືອກທະນາຄານ --"
                                : "-- Choose Bank --"}
                            </option>
                            {LAO_BANKS.map((bank) => (
                              <option key={bank.id} value={bank.name}>
                                {bank.name} ({bank.label})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                          {lang === "lo"
                            ? "ຊື່ບັນຊີ (ພາສາອັງກິດ)"
                            : "Account Holder Name"}
                        </label>
                        <input
                          type="text"
                          value={bankFormData.accountName}
                          onChange={(e) =>
                            setBankFormData((prev) => ({
                              ...prev,
                              accountName: e.target.value,
                            }))
                          }
                          placeholder="SOUKPHASONE XAYAVONG"
                          required
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:border-adv-orange ${
                            theme === "dark"
                              ? "bg-zinc-950 border-zinc-800 text-white"
                              : "bg-gray-50 border-gray-200 text-adv-slate"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                          {lang === "lo" ? "ເລກບັນຊີທະນາຄານ" : "Account Number"}
                        </label>
                        <input
                          type="text"
                          value={bankFormData.accountNumber}
                          onChange={(e) =>
                            setBankFormData((prev) => ({
                              ...prev,
                              accountNumber: e.target.value,
                            }))
                          }
                          placeholder="160-12-00-xxxxx"
                          required
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-bold font-mono focus:outline-none focus:border-adv-orange ${
                            theme === "dark"
                              ? "bg-zinc-950 border-zinc-800 text-white"
                              : "bg-gray-50 border-gray-200 text-adv-slate"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      {bankAccount && (
                        <button
                          type="button"
                          onClick={() => setIsEditingBank(false)}
                          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          {t.cancel}
                        </button>
                      )}
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-adv-orange hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-adv-orange/20 transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        {lang === "lo" ? "ບັນທຶກບັນຊີ" : "Save Details"}
                      </button>
                    </div>
                  </form>
                ) : (
                  (() => {
                    const matchedBank = LAO_BANKS.find(
                      (b) =>
                        b.name.toLowerCase() ===
                          bankAccount.bankName.toLowerCase() ||
                        bankAccount.bankName
                          .toLowerCase()
                          .includes(b.id.toLowerCase()),
                    );
                    return (
                      <div
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border ${
                          theme === "dark"
                            ? "bg-zinc-950/60 border-zinc-800"
                            : "bg-gray-50/80 border-gray-200/80"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {matchedBank?.logo ? (
                            <img
                              src={matchedBank.logo}
                              alt={bankAccount.bankName}
                              className="w-12 h-12 rounded-xl object-contain bg-white p-1.5 border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-adv-orange/10 text-adv-orange flex items-center justify-center font-black text-sm shrink-0">
                              <CreditCard className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-black text-base ${
                                  theme === "dark"
                                    ? "text-white"
                                    : "text-adv-slate"
                                }`}
                              >
                                {bankAccount.bankName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                {lang === "lo" ? "ເຊື່ອມຕໍ່ແລ້ວ" : "Connected"}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-600 dark:text-zinc-300 mt-0.5">
                              {bankAccount.accountName}
                            </p>
                            <p className="text-xs font-mono text-gray-500 dark:text-zinc-400 mt-0.5">
                              {bankAccount.accountNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Payout History List */}
              <div
                className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-colors ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        theme === "dark" ? "text-white" : "text-adv-slate"
                      }`}
                    >
                      {lang === "lo"
                        ? "ປະຫວັດການໂອນເງິນ & ໃບບິນ"
                        : "Payout History & Receipts"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                      {lang === "lo"
                        ? "ລາຍການສະຫຼຸບຍອດຂາຍ, ຄ່າທຳນຽມ, ແລະ ໃບບິນໂອນເງິນຂອງແຕ່ລະກິດຈະກຳ"
                        : "Per-event gross sales, platform fee, net payout, and transfer slip"}
                    </p>
                  </div>
                </div>

                {payoutsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin text-adv-orange mb-2" />
                    <span className="text-xs font-bold">
                      {lang === "lo"
                        ? "ກຳລັງໂຫຼດຂໍ້ມູນການເບີກຈ່າຍ..."
                        : "Loading payout history..."}
                    </span>
                  </div>
                ) : payoutRows.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500 dark:text-zinc-400">
                      {t.payoutsEmpty}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payoutRows.map((row) => {
                      const isCompleted = row.status === "paid";
                      return (
                        <div
                          key={row.eventId}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            theme === "dark"
                              ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                              : "bg-gray-50/70 border-gray-200/80 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4
                                  className={`font-bold text-base truncate ${
                                    theme === "dark"
                                      ? "text-white"
                                      : "text-adv-slate"
                                  }`}
                                >
                                  {row.eventTitle}
                                </h4>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    isCompleted
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  {isCompleted
                                    ? lang === "lo"
                                      ? "ໂອນສຳເລັດແລ້ວ"
                                      : "Completed"
                                    : lang === "lo"
                                      ? "ລໍຖ້າໂອນ"
                                      : "Pending"}
                                </span>
                                {bankAccount && (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveTxTooltip((prev) =>
                                          prev === row.eventId
                                            ? null
                                            : row.eventId,
                                        )
                                      }
                                      className="text-gray-400 hover:text-adv-orange transition-colors cursor-pointer"
                                      title={
                                        lang === "lo"
                                          ? "ຂໍ້ມູນບັນຊີຮັບເງິນ"
                                          : "Destination Account Info"
                                      }
                                    >
                                      <Info className="w-4 h-4" />
                                    </button>
                                    {activeTxTooltip === row.eventId && (
                                      <div className="absolute left-0 top-6 z-30 w-64 p-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-white/10">
                                        <p className="font-bold text-orange-300 mb-1">
                                          {bankAccount.bankName}
                                        </p>
                                        <p className="font-semibold">
                                          {bankAccount.accountName}
                                        </p>
                                        <p className="font-mono text-zinc-400">
                                          {bankAccount.accountNumber}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                                {row.eventDate
                                  ? formatEventDateDDMMYYYY(row.eventDate)
                                  : "-"}{" "}
                                •{" "}
                                {lang === "lo"
                                  ? `ຂາຍໄດ້ ${row.ticketsSold} ປີ້`
                                  : `${row.ticketsSold} tickets sold`}
                                {row.paidAt
                                  ? ` • ${lang === "lo" ? "ໂອນເມື່ອ" : "Paid"} ${formatEventDateDDMMYYYY(row.paidAt)}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200/60 dark:border-zinc-800">
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  {lang === "lo" ? "ຍອດຂາຍລວມ" : "Gross Sales"}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-300">
                                  {row.grossKip.toLocaleString()} ₭
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  {lang === "lo"
                                    ? `ຄ່າທຳນຽມ (${row.feePercent}%)`
                                    : `Fee (${row.feePercent}%)`}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-rose-500">
                                  -{row.feeKip.toLocaleString()} ₭
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  {lang === "lo" ? "ຍອດຮັບສຸດທິ" : "Net Payout"}
                                </p>
                                <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                                  {row.payoutKip.toLocaleString()} ₭
                                </p>
                              </div>

                              {row.hasBill && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleOpenPayoutBill(row.eventId)
                                  }
                                  disabled={loadingBillEventId === row.eventId}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-adv-orange/10 hover:bg-adv-orange text-adv-orange hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                                >
                                  {loadingBillEventId === row.eventId ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  )}
                                  {lang === "lo" ? "ເບິ່ງໃບບິນ" : "View Slip"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Full Seating Map Modal */}
      <AnimatePresence>
        {showFullMap && selectedEvent?.seatingMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowFullMap(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-bold text-lg text-adv-slate dark:text-white">
                  {t.seatingConfig}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFullMap(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 max-h-[80vh] overflow-auto flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <img
                  src={selectedEvent.seatingMap}
                  alt={t.seatingConfig}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. QR Scanner Modal (100% Real Camera + Backend Ticket Lookup) */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-5 h-5 text-adv-orange" />
                  <h3 className="font-bold text-base sm:text-lg text-adv-slate dark:text-white">
                    {t.entryScanner}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowScanner(false);
                    setScanResult(null);
                    setScannerError(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {!scanResult ? (
                  <>
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-gray-200 dark:border-zinc-800">
                      {scannerError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white">
                          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                          <p className="text-xs sm:text-sm font-medium text-zinc-300 mb-4">
                            {scannerError}
                          </p>
                          <button
                            type="button"
                            onClick={() => setScannerError(null)}
                            className="px-4 py-2 rounded-xl bg-adv-orange text-white text-xs font-bold cursor-pointer"
                          >
                            {t.resetScanner}
                          </button>
                        </div>
                      ) : (
                        <React.Suspense
                          fallback={
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                              <Loader2 className="w-8 h-8 animate-spin text-adv-orange" />
                            </div>
                          }
                        >
                          <LazyScanner
                            onScan={(detected) => {
                              const val = detected?.[0]?.rawValue;
                              if (val) void handleScan(val);
                            }}
                            onError={(err: unknown) => {
                              console.error("QR scanner error:", err);
                              setScannerError(t.accessDenied);
                            }}
                          />
                        </React.Suspense>
                      )}
                      {isLookingUpTicket && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                          <Loader2 className="w-8 h-8 animate-spin text-adv-orange mb-2" />
                          <span className="text-xs font-bold">
                            {lang === "lo"
                              ? "ກຳລັງກວດສອບປີ້..."
                              : "Verifying ticket..."}
                          </span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleManualCheckIn} className="flex gap-2">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder={
                          lang === "lo"
                            ? "ປ້ອນລະຫັດປີ້ດ້ວຍມື (ເຊັ່ນ PK-...)"
                            : "Enter ticket code manually..."
                        }
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-sm font-bold text-adv-slate dark:text-white focus:outline-none focus:border-adv-orange"
                      />
                      <button
                        type="submit"
                        disabled={!manualCode.trim() || isLookingUpTicket}
                        className="px-4 py-2.5 rounded-xl bg-adv-orange hover:bg-orange-600 disabled:opacity-40 text-white text-xs sm:text-sm font-bold cursor-pointer"
                      >
                        {lang === "lo" ? "ກວດສອບ" : "Check"}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div
                      className={`p-5 rounded-2xl border text-center ${
                        scanResult.alreadyScanned
                          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {scanResult.alreadyScanned ? (
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                      ) : (
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                      )}
                      <h4 className="font-black text-lg text-adv-slate dark:text-white">
                        {scanResult.alreadyScanned
                          ? t.alreadyScanned.replace("{id}", scanResult.id)
                          : t.validTicket}
                      </h4>
                      <p className="text-xs font-mono text-gray-500 dark:text-zinc-400 mt-1">
                        {scanResult.id}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                      {scanResult.attendeeName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            {lang === "lo" ? "ຜູ້ຖືປີ້" : "Attendee"}
                          </span>
                          <span className="font-bold text-adv-slate dark:text-white">
                            {scanResult.attendeeName}
                          </span>
                        </div>
                      )}
                      {scanResult.ticketType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            {lang === "lo" ? "ປະເພດປີ້" : "Tier"}
                          </span>
                          <span className="font-bold text-adv-orange">
                            {scanResult.ticketType}
                          </span>
                        </div>
                      )}
                      {scanResult.price && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            {lang === "lo" ? "ລາຄາ" : "Price"}
                          </span>
                          <span className="font-bold text-adv-slate dark:text-white">
                            {scanResult.price}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setScanResult(null)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 font-bold text-sm text-gray-600 dark:text-zinc-300 cursor-pointer"
                      >
                        {lang === "lo" ? "ສະແກນໃບຕໍ່ໄປ" : "Scan Next"}
                      </button>
                      {!scanResult.alreadyScanned && (
                        <button
                          type="button"
                          onClick={() => void handleConfirmEntry()}
                          disabled={isConfirmingEntry}
                          className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isConfirmingEntry && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          {t.confirmEntry}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Assign Staff Scanner Modal */}
      <AnimatePresence>
        {showCreateStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateStaffModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-adv-slate dark:text-white">
                  {t.createStaffLink}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
                    {lang === "lo"
                      ? "ອີເມວ ຫຼື ຊື່ບັນຊີພະນັກງານ *"
                      : "Staff Account Email or Name *"}
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    value={newStaffIdentifier}
                    onChange={(e) => {
                      setNewStaffIdentifier(e.target.value);
                      if (staffFormError) setStaffFormError("");
                    }}
                    placeholder={t.staffEmailPlaceholder}
                    aria-invalid={Boolean(staffFormError)}
                    aria-describedby="staff-email-hint"
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm font-bold text-adv-slate focus:outline-none dark:bg-zinc-950 dark:text-white ${staffFormError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-adv-orange dark:border-zinc-700"}`}
                  />
                  <p id="staff-email-hint" className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-zinc-400">{t.staffAccountHint}</p>
                  {staffFormError && <p role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{staffFormError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
                    {t.staffNameLabel}
                  </label>
                  <input
                    type="text"
                    value={newStaffGateLabel}
                    onChange={(e) => setNewStaffGateLabel(e.target.value)}
                    placeholder={t.staffNamePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-sm font-bold text-adv-slate dark:text-white focus:outline-none focus:border-adv-orange"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-600 dark:text-zinc-300 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAssignStaff()}
                  disabled={!newStaffIdentifier.trim() || isAssigningStaff}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-adv-orange hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-bold cursor-pointer"
                >
                  {isAssigningStaff && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {t.generateLink}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Staff QR Code Modal */}
      <AnimatePresence>
        {activeStaffQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveStaffQrModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 text-center shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-adv-slate dark:text-white truncate">
                  {activeStaffQrModal.staffLabel}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveStaffQrModal(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t.qrCodeModalDesc}
              </p>
              <div className="bg-white p-5 rounded-2xl inline-block border border-gray-100 shadow-inner">
                <QRCodeSVG value={activeStaffQrModal.url} size={200} />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => void handleCopyStaffLink(activeStaffQrModal.url)}
                  aria-label={t.copyLink}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-adv-slate dark:text-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {t.copyLink}
                </button>
                <a
                  href={activeStaffQrModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.openScanner}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-adv-orange hover:bg-orange-600 text-white text-xs font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t.openScanner}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Payout Transfer Receipt Preview Modal */}
      <AnimatePresence>
        {payoutImagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPayoutImagePreview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-bold text-base text-adv-slate dark:text-white">
                  {lang === "lo" ? "ໃບບິນໂອນເງິນ" : "Payout Transfer Receipt"}
                </h3>
                <button
                  type="button"
                  onClick={() => setPayoutImagePreview(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-zinc-950 flex items-center justify-center max-h-[75vh] overflow-auto">
                <img
                  src={payoutImagePreview}
                  alt="Payout Receipt"
                  className="max-w-full max-h-[68vh] object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Confirm Bank Account Update Modal */}
      <AnimatePresence>
        {showBankConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isSavingBank && setShowBankConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-adv-slate dark:text-white">
                    {lang === "lo"
                      ? "ຢືນຢັນຂໍ້ມູນບັນຊີທະນາຄານ"
                      : "Confirm Bank Account"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {lang === "lo"
                      ? "ກະລຸນາກວດສອບຊື່ ແລະ ເລກບັນຊີໃຫ້ຖືກຕ້ອງກ່ອນບັນທຶກ"
                      : "Please verify your account holder name and number"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 space-y-1.5 text-sm">
                <p className="font-bold text-adv-orange">
                  {bankFormData.bankName}
                </p>
                <p className="font-bold text-adv-slate dark:text-white">
                  {bankFormData.accountName}
                </p>
                <p className="font-mono text-gray-600 dark:text-zinc-400">
                  {bankFormData.accountNumber}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSavingBank}
                  onClick={() => setShowBankConfirmModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-600 dark:text-zinc-300 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  disabled={isSavingBank}
                  onClick={() => void handleConfirmSaveBank()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-adv-orange hover:bg-orange-600 text-white text-sm font-bold cursor-pointer"
                >
                  {isSavingBank && <Loader2 className="w-4 h-4 animate-spin" />}
                  {lang === "lo" ? "ຢືນຢັນບັນທຶກ" : "Confirm & Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Attendee Questionnaire Answers Modal (Exact Demo UI) */}
      <AnimatePresence>
        {selectedAttendeeForAnswers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedAttendeeForAnswers(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-adv-orange/10 text-adv-orange flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-adv-slate dark:text-white truncate">
                      {t.questionnaireAnswers}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {selectedAttendeeForAnswers.attendeeName} •{" "}
                      {selectedAttendeeForAnswers.ticketId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttendeeForAnswers(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
                {selectedAttendeeForAnswers.customAnswers &&
                Object.keys(selectedAttendeeForAnswers.customAnswers).length >
                  0 ? (
                  Object.entries(selectedAttendeeForAnswers.customAnswers).map(
                    ([key, val]) => {
                      const configuredQuestions =
                        (selectedEvent as any)?.attendeeQuestions || [];
                      const qConfig = configuredQuestions.find(
                        (q: any) =>
                          q.id === key || q.label === key || q.title === key,
                      );
                      const label = qConfig?.label || qConfig?.title || key;
                      const formattedVal =
                        typeof val === "boolean"
                          ? val
                            ? lang === "lo"
                              ? "ແມ່ນ"
                              : "Yes"
                            : lang === "lo"
                              ? "ບໍ່"
                              : "No"
                          : Array.isArray(val)
                            ? val.join(", ")
                            : String(val ?? "-");

                      return (
                        <div
                          key={key}
                          className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800"
                        >
                          <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1">
                            {label}
                          </p>
                          <p className="text-sm font-bold text-adv-slate dark:text-white break-words">
                            {formattedVal || "-"}
                          </p>
                        </div>
                      );
                    },
                  )
                ) : (
                  <p className="text-sm text-center text-gray-500 py-6">
                    {lang === "lo"
                      ? "ບໍ່ມີຄຳຕອບແບບສອບຖາມ"
                      : "No questionnaire responses recorded."}
                  </p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAttendeeForAnswers(null)}
                  className="px-6 py-2.5 rounded-xl bg-adv-slate dark:bg-zinc-800 text-white text-sm font-bold cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. Quick Check-In Confirmation Modal (Exact Demo UI) */}
      <AnimatePresence>
        {checkinConfirmAttendee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() =>
              !isQuickCheckingIn && setCheckinConfirmAttendee(null)
            }
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-adv-slate dark:text-white">
                    {lang === "lo"
                      ? "ຢືນຢັນການເຊັກອິນເຂົ້າງານ"
                      : "Confirm Attendee Check-In"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {lang === "lo"
                      ? "ກະລຸນາກວດສອບຂໍ້ມູນຜູ້ຖືປີ້ກ່ອນຢືນຢັນເຂົ້າງານ"
                      : "Verify attendee ticket details before marking checked in"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">
                    {lang === "lo" ? "ຊື່ຜູ້ເຂົ້າຮ່ວມ" : "Attendee"}
                  </span>
                  <span className="font-bold text-adv-slate dark:text-white text-right">
                    {checkinConfirmAttendee.attendeeName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">
                    {lang === "lo" ? "ລະຫັດປີ້" : "Ticket Code"}
                  </span>
                  <span className="font-mono font-bold text-adv-orange">
                    {checkinConfirmAttendee.ticketId}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">
                    {lang === "lo" ? "ປະເພດປີ້" : "Tier"}
                  </span>
                  <span className="font-bold text-adv-slate dark:text-white">
                    {checkinConfirmAttendee.ticketType}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isQuickCheckingIn}
                  onClick={() => setCheckinConfirmAttendee(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-600 dark:text-zinc-300 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  disabled={isQuickCheckingIn}
                  onClick={() => void handleConfirmQuickCheckin()}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isQuickCheckingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {lang === "lo" ? "ຢືນຢັນເຊັກອິນ" : "Confirm Check-In"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. Toast Queue & Profile Photo Success Toast */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {showProfilePicSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-sm font-bold"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{t.profileUpdated}</span>
            </motion.div>
          )}
          {toastQueue.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-white shadow-xl text-xs sm:text-sm font-bold ${
                item.type === "error"
                  ? "bg-red-600"
                  : item.type === "warning"
                    ? "bg-amber-600"
                    : item.type === "info"
                      ? "bg-slate-800"
                      : "bg-emerald-600"
              }`}
            >
              <span className="leading-snug">{item.text}</span>
              <button
                type="button"
                onClick={() =>
                  setToastQueue((prev) => prev.filter((t) => t.id !== item.id))
                }
                className="p-1 rounded-full hover:bg-white/20 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
