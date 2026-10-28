import { DateInputDDMMYYYY } from "../components/DateInputDDMMYYYY";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Ticket,
  Loader2,
  Building2,
  Activity,
  Shield,
  Zap,
  MapPin,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { LaoEvent, TicketTier, SeatingZone, Coupon } from "../data/events";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { showErrorAlert } from "../lib/alerts";
import { formatEventDateDDMMYYYY } from "../lib/dateFormat";

import SEO from "../components/SEO";

const translations = {
  en: {
    invalidSession: "Session Expired",
    backToHome: "Back to Home",
    paymentSuccess: "Tickets Confirmed!",
    ticketsConfirmed:
      "Your tickets for {eventTitle} are confirmed. Tickets have been sent to your account.",
    totalPaid: "Total Paid",
    orderSummary: "Activity Summary",
    zone: "Section",
    subtotal: "Subtotal",
    total: "Total",
    promoCode: "Promo Code",
    enterPromoCode: "Enter promo code",
    apply: "Apply",
    discount: "Discount",
    invalidCoupon: "Invalid or expired coupon",
    couponApplied: "Coupon applied successfully",
    contactDetails: "Contact Information",
    checkout: "Pay Now",
    book: "Book",
    startingFrom: "From",
    ticketOwnerInfo: "Guest Information",
    ticketOwnerDesc:
      "Please provide the details of the persons attending the activity.",
    guest: "Guest",
    fullName: "Full Name",
    firstName: "First Name",
    gender: "Gender",
    dob: "Date of Birth",
    lastName: "Surname",
    phoneNumber: "Phone Number",
    email: "Email Address",
    nextStep: "Continue to Payment",
  },
  lo: {
    invalidSession: "ການເຊື່ອມຕໍ່ໝົດອາຍຸ",
    backToHome: "ກັບຄືນສູ່ໜ້າຫຼັກ",
    paymentSuccess: "ຢືນຢັນປີ້ສຳເລັດ!",
    ticketsConfirmed:
      "ປີ້ສຳລັບ {eventTitle} ໄດ້ຮັບການຢືນຢັນແລ້ວ. ປີ້ໄດ້ສົ່ງໄປຍັງບັນຊີຂອງທ່ານ.",
    totalPaid: "ຈ່າຍທັງໝົດ",
    orderSummary: "ສະຫຼຸບການຈອງ",
    zone: "ໂຊນ",
    subtotal: "ລາຄາເບື້ອງຕົ້ນ",
    total: "ຍອດລວມທັງໝົດ",
    promoCode: "ລະຫັດສ່ວນຫຼຸດ",
    enterPromoCode: "ປ້ອນລະຫັດສ່ວນຫຼຸດ",
    apply: "ໃຊ້ງານ",
    discount: "ສ່ວນຫຼຸດ",
    invalidCoupon: "ລະຫັດບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸ",
    couponApplied: "ໃຊ້ລະຫັດສ່ວນຫຼຸດສຳເລັດ",
    contactDetails: "ຂໍ້ມູນຕິດຕໍ່",
    checkout: "ຊຳລະເງິນ",
    book: "ຈອງ",
    startingFrom: "ເລີ່ມຕົ້ນທີ່",
    ticketOwnerInfo: "ຂໍ້ມູນຜູ້ເຂົ້າຮ່ວມ",
    ticketOwnerDesc: "ກະລຸນາລະບຸຂໍ້ມູນຂອງຜູ້ທີ່ຈະເຂົ້າຮ່ວມກິດຈະກຳ.",
    guest: "ຜູ້ເຂົ້າຮ່ວມ",
    fullName: "ຊື່ ແລະ ນາມສະກຸນ",
    firstName: "ຊື່",
    gender: "ເພດ",
    dob: "ວັນເດືອນປີເກີດ",
    lastName: "ນາມສະກຸນ",
    phoneNumber: "ເບີໂທລະສັບ",
    email: "ອີເມວ",
    nextStep: "ໄປຫາການຊຳລະເງິນ",
  },
};

interface CheckoutState {
  event: LaoEvent;
  tier: TicketTier | null;
  zone: SeatingZone | null;
  quantity: number;
  selectedTiers?: Array<{ tier: TicketTier; quantity: number }>;
  initialDiscountCode?: string;
  selectedDate?: string;
  selectedTime?: string;
}

const LAOS_BANKS = [
  { id: "bcel", name: "BCEL One", color: "bg-red-600", logo: "/BCEL.png" },
  { id: "ldb", name: "LDB Trust", color: "bg-blue-700", logo: "/LDB.png" },
  { id: "jdb", name: "JDB Yes", color: "bg-green-600", logo: "/JDB.png" },
  { id: "ib", name: "IB Bank", color: "bg-teal-600", logo: "/IB.png" },
  { id: "stb", name: "ST Bank", color: "bg-emerald-600", logo: "/ST.png" },
  { id: "apb", name: "APB Bank", color: "bg-emerald-600", logo: "/APB.svg" },
  { id: "m-money", name: "M-Money", color: "bg-rose-600", logo: "/M-Money.png" },
];

const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  lang,
}: {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  lang: "lo" | "en";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter((v) => v !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
  };

  const removeOption = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== opt));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all cursor-pointer flex justify-between items-center min-h-[38px]"
      >
        <div className="flex flex-wrap gap-1 pr-4 font-normal">
          {selectedValues.length > 0 ? (
            selectedValues.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 border border-adv-orange text-adv-orange bg-orange-50 px-2 py-1.5 rounded-md shadow-sm"
              >
                {val}
                <button
                  onClick={(e) => removeOption(e, val)}
                  className="hover:bg-orange-100 rounded-sm p-0.5 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-400 pl-1">
              {lang === "lo" ? "ເລືອກໄດ້ຫຼາຍຂໍ້..." : "Select multiple..."}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div className="p-1.5 space-y-0.5">
            {options.map((opt, i) => (
              <label
                key={i}
                className="flex items-center px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer group m-0"
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedValues.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                <div
                  className={`flex items-center justify-center w-3.5 h-3.5 border rounded-sm mr-2 flex-shrink-0 transition-colors ${selectedValues.includes(opt) ? "border-adv-orange bg-adv-orange" : "border-gray-300 group-hover:border-adv-orange"}`}
                >
                  {selectedValues.includes(opt) && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  )}
                </div>
                <span className="text-xs text-adv-slate">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Checkout() {
  const { lang } = useLanguage();
  const t = translations[lang === "en" ? "en" : "lo"] as unknown as Record<
    string,
    string
  >;
  const currency = lang === "lo" ? "ກີບ" : "Kip";
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CheckoutState;
  const { isAuthenticated, user, token } = useAuth();
  const {
    event,
    tier,
    zone,
    quantity,
    selectedTiers,
    selectedDate,
    selectedTime,
  } = state || {};
  const displayDate = selectedDate || event?.date;

  const selectedTiersList = useMemo(() => {
    if (selectedTiers && selectedTiers.length > 0) {
      return selectedTiers;
    }
    if (tier) {
      return [{ tier, quantity: quantity || 1 }];
    }
    return [];
  }, [selectedTiers, tier, quantity]);

  const totalQuantity = useMemo(() => {
    if (selectedTiersList.length > 0) {
      return selectedTiersList.reduce((sum, item) => sum + item.quantity, 0);
    }
    return quantity || 1;
  }, [selectedTiersList, quantity]);

  const subtotal = useMemo(() => {
    if (zone) return zone.price * (quantity || 1);
    if (selectedTiersList.length > 0) {
      return selectedTiersList.reduce(
        (acc, item) => acc + (item.tier.price || 0) * item.quantity,
        0,
      );
    }
    return (tier?.price || 0) * (quantity || 1);
  }, [zone, selectedTiersList, tier, quantity]);

  const [step, setStep] = useState<"details" | "success">("details");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [hostedCheckoutUrl, setHostedCheckoutUrl] = useState<string | null>(
    null,
  );
  const [bankDeepLink, setBankDeepLink] = useState<string | null>(null);
  const [paymentQrPayload, setPaymentQrPayload] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktopViewport(desktopQuery.matches);
    updateViewport();
    desktopQuery.addEventListener("change", updateViewport);
    return () => desktopQuery.removeEventListener("change", updateViewport);
  }, []);

  const ownersCount =
    event?.requireEveryTicketInfo === false ? 1 : totalQuantity;
  const [ticketOwners, setTicketOwners] = useState(
    Array.from({ length: ownersCount }, () => ({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      gender: "",
      dob: "",
      customAnswers: {} as Record<string, string | string[]>,
    })),
  );

  // Always-fresh snapshot so the payment-gateway listener effect below can
  // read current form state without re-subscribing (and reconnecting its
  // socket) on every keystroke.
  const latestFormRef = useRef({ ticketOwners, appliedCoupon });
  useEffect(() => {
    latestFormRef.current = { ticketOwners, appliedCoupon };
  });

  const handleTicketOwnerChange = (
    index: number,
    field: "firstName" | "lastName" | "phone" | "email" | "gender" | "dob",
    value: string,
  ) => {
    const newOwners = [...ticketOwners];
    let processedValue = value;
    if (field === "firstName" || field === "lastName") {
      processedValue = value.replace(/[0-9]/g, "");
    } else if (field === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      const maxLen = digitsOnly.startsWith("856020")
        ? 14
        : digitsOnly.startsWith("85620")
          ? 13
          : digitsOnly.startsWith("856")
            ? 14
            : digitsOnly.startsWith("020")
              ? 11
              : 10;
      processedValue = digitsOnly.slice(0, maxLen);
    }
    newOwners[index][field] = processedValue;
    setTicketOwners(newOwners);
  };

  const handleCustomAnswerChange = (
    ownerIndex: number,
    questionId: string,
    value: string | string[],
  ) => {
    const newOwners = [...ticketOwners];
    newOwners[ownerIndex].customAnswers[questionId] = value;
    setTicketOwners(newOwners);
  };

  const isDetailsValid = ticketOwners.every(
    (owner) =>
      owner.firstName.trim() !== "" &&
      owner.lastName.trim() !== "" &&
      owner.phone.trim() !== "" &&
      owner.email.trim() !== "" &&
      owner.email.includes("@") &&
      owner.gender !== "" &&
      owner.dob !== "" &&
      (event?.attendeeQuestions?.every((q) => {
        if (!q.required) return true;
        const answer = owner.customAnswers[q.id];
        if (q.type === "checkbox") return answer === "true";
        if (Array.isArray(answer)) return answer.length > 0;
        return answer && answer.trim() !== "";
      }) ??
        true),
  );

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const discountVal = Number(appliedCoupon.discount);

    if (appliedCoupon.type === "percentage") {
      const calculated = Math.floor((subtotal * discountVal) / 100);
      if (
        appliedCoupon.maxDiscountAmount &&
        appliedCoupon.maxDiscountAmount > 0
      ) {
        return Math.min(calculated, appliedCoupon.maxDiscountAmount);
      }
      return calculated;
    }
    return discountVal;
  };

  useEffect(() => {
    if (state.initialDiscountCode) {
      const coupon = state.event.coupons?.find(
        (c) =>
          c.code.trim().toUpperCase() ===
            state.initialDiscountCode?.trim().toUpperCase() && c.isActive,
      );
      if (coupon) setAppliedCoupon(coupon);
    }
  }, [state.initialDiscountCode, state.event.coupons]);

  useEffect(() => {
    if (!state || !state.event) return;
    if (!isAuthenticated) {
      navigate("/login", {
        state: { returnTo: location.pathname, checkoutState: state },
      });
    }
  }, [isAuthenticated, navigate, location.pathname, state]);

  useEffect(() => {
    if (!paymentReference || step === "success") return;
    let active = true;
    const poll = async () => {
      const res = await api.getPaymentStatus(paymentReference);
      if (
        active &&
        res.ok &&
        (res.data?.verified || res.data?.status === "COMPLETED")
      ) {
        setStep("success");
        setTimeout(() => {
          navigate("/dashboard", {
            replace: true,
            state: {
              newTicket: {
                event,
                tier,
                quantity: totalQuantity,
                selectedTiers: selectedTiersList,
                selectedDate: state?.selectedDate,
                selectedTime: state?.selectedTime,
              },
            },
          });
        }, 3000);
      } else if (
        active &&
        res.ok &&
        ["FAILED", "CANCELLED", "CANCELED", "EXPIRED"].includes(
          res.data?.status?.toUpperCase() || "",
        )
      ) {
        setPaymentReference(null);
        setHostedCheckoutUrl(null);
        setBankDeepLink(null);
        setPaymentQrPayload(null);
        void showErrorAlert(
          lang === "lo"
            ? "ການຊຳລະບໍ່ສຳເລັດ. ກະລຸນາເລືອກທະນາຄານແລະລອງໃໝ່."
            : "Payment was not completed. Choose a bank and try again.",
          lang,
          lang === "lo" ? "ການຊຳລະບໍ່ສຳເລັດ" : "Payment failed",
        );
      }
    };
    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [
    step,
    paymentReference,
    navigate,
    event,
    tier,
    totalQuantity,
    selectedTiersList,
    state?.selectedDate,
    state?.selectedTime,
    lang,
  ]);

  if (!state || !state.event) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 text-center">
        <Activity className="w-16 h-16 text-adv-orange mb-8 animate-pulse" />
        <h2 className="text-3xl font-bold text-adv-slate mb-6">
          {t.invalidSession}
        </h2>
        <Link
          to="/"
          className="text-adv-orange font-bold flex items-center gap-2 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" /> {t.backToHome}
        </Link>
      </div>
    );
  }

  const price = zone ? zone.price : tier?.price || 0;
  const itemName = zone
    ? zone.name
    : selectedTiersList.length > 0
      ? selectedTiersList.map((i) => `${i.quantity}x ${i.tier.name}`).join(", ")
      : tier?.name || "";
  const discount = calculateDiscount();
  const total = Math.max(0, subtotal - discount);

  const validateContactDetails = () => {
    for (let i = 0; i < ticketOwners.length; i++) {
      const owner = ticketOwners[i];
      const phone = owner.phone.trim();
      const email = owner.email.trim();

      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (phone.includes(" ") || !phoneRegex.test(phone)) {
        void showErrorAlert(
          lang === "lo"
            ? `ກະລຸນາປ້ອນເບີໂທລະສັບໃຫ້ຖືກຕ້ອງ ສຳລັບຜູ້ເຂົ້າຮ່ວມທີ ${i + 1} (ຫ້າມຍະຫວ່າງ).`
            : `Please enter a valid phone number for Guest ${i + 1} without spaces.`,
          lang,
          lang === "lo" ? "ກວດສອບເບີໂທ" : "Check phone number",
        );
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.includes(" ") || !emailRegex.test(email)) {
        void showErrorAlert(
          lang === "lo"
            ? `ກະລຸນາປ້ອນອີເມວໃຫ້ຖືກຕ້ອງ ສຳລັບຜູ້ເຂົ້າຮ່ວມທີ ${i + 1} (ຫ້າມຍະຫວ່າງ).`
            : `Please enter a valid email for Guest ${i + 1} without spaces.`,
          lang,
          lang === "lo" ? "ກວດສອບອີເມວ" : "Check email address",
        );
        return false;
      }
    }
    return true;
  };

  // The backend calculates the authoritative total. Free orders are confirmed
  // immediately; paid orders return a provider checkout/deep link.
  const createRealOrder = async (bankId: string | null): Promise<{
    checkoutUrl: string | null;
    qrCode: string | null;
    deepLink: string | null;
    reference: string | null;
  } | null> => {
    if (!event) return null;
    const { ticketOwners: owners, appliedCoupon: currentCoupon } =
      latestFormRef.current;
    const groups =
      selectedTiersList.length > 0
        ? selectedTiersList
        : tier
          ? [{ tier, quantity: quantity || 1 }]
          : [];
    if (groups.length === 0) return null;
    if (
      groups.length > 1 &&
      groups.some((group) => Number(group.tier.price) > 0)
    ) {
      void showErrorAlert(
        lang === "lo"
          ? "ກະລຸນາຊື້ປີ້ຈ່າຍເງິນເທື່ອລະປະເພດ."
          : "Purchase one paid ticket type per checkout.",
        lang,
        lang === "lo" ? "ເລືອກປີ້ໜຶ່ງປະເພດ" : "One paid ticket type",
      );
      return null;
    }
    if (currentCoupon && groups.length > 1) {
      void showErrorAlert(
        lang === "lo"
          ? "ກະລຸນາໃຊ້ Coupon ກັບປີ້ປະເພດດຽວຕໍ່ການສັ່ງຊື້."
          : "Use a coupon with one ticket type per checkout.",
        lang,
        lang === "lo" ? "Coupon ໃຊ້ບໍ່ໄດ້" : "Coupon not applicable",
      );
      return null;
    }

    let offset = 0;
    for (const group of groups) {
      const groupOwners =
        event.requireEveryTicketInfo === false
          ? Array.from({ length: group.quantity }, () => owners[0])
          : owners.slice(offset, offset + group.quantity);
      const attendees = groupOwners.map((o) => ({
        firstName: o.firstName.trim() || undefined,
        lastName: o.lastName.trim() || undefined,
        email: o.email.trim() || undefined,
        phone: o.phone.trim() || undefined,
        customAnswers: o.customAnswers,
      }));
      offset += group.quantity;

      const paymentMethod = (bankId as
        | "bcel"
        | "ldb"
        | "jdb"
        | "ib"
        | "stb"
        | "apb"
        | "m-money"
        | "credit_card"
        | null) ?? "payment_link";

      const res = await api.createOrder({
        eventId: String(event.id),
        tierId: String(group.tier.id),
        tierName: group.tier.name,
        quantity: group.quantity,
        selectedDate: state.selectedDate || event.date,
        selectedTime: state.selectedTime || event.time,
        paymentMethod,
        freeOnly: false,
        couponCode: currentCoupon?.code,
        attendees,
      });
      if (!res.ok) {
        const message =
          res.status === 409
            ? lang === "lo"
              ? "ປີ້ອາດຈະໝົດ ຫຼືຂໍ້ມູນການຈອງປ່ຽນແປງ. ກະລຸນາເລືອກອີກຄັ້ງ."
              : "Tickets may have sold out or the booking changed. Please review your selection."
            : res.status === 429
              ? lang === "lo"
                ? "ມີການຈອງຫຼາຍເກີນໄປ. ກະລຸນາລໍຖ້າແລ້ວລອງໃໝ່."
                : "Too many booking attempts. Please wait and try again."
              : res.status === 503
                ? lang === "lo"
                  ? "ລະບົບຈອງປີ້ກຳລັງບໍ່ພ້ອມ. ການສັ່ງຊື້ຍັງບໍ່ສຳເລັດ—ກະລຸນາລອງໃໝ່ພາຍຫຼັງ."
                  : "Ticket ordering is temporarily unavailable. Your order was not confirmed; please try again later."
                : res.status === 0
                  ? lang === "lo"
                    ? "ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບຈອງປີ້ໄດ້. ກວດອິນເຕີເນັດແລ້ວລອງໃໝ່."
                    : "We couldn't reach the ticket service. Check your connection and try again."
                  : lang === "lo"
                    ? "ບໍ່ສາມາດຈອງປີ້ໄດ້. ກະລຸນາກວດຂໍ້ມູນແລ້ວລອງໃໝ່."
                    : "We couldn't complete your ticket order. Please review your details and try again.";
        void showErrorAlert(
          message,
          lang,
          lang === "lo" ? "ຈອງປີ້ບໍ່ສຳເລັດ" : "Ticket order failed",
        );
        return null;
      }
      const backendTotal = Number(res.data?.order?.totalKip ?? 0);
      if (backendTotal > 0) {
        const checkoutUrl = res.data?.checkout?.checkoutUrl ?? null;
        const qrCode = res.data?.checkout?.qrCode ?? null;
        const deepLink = res.data?.checkout?.deepLink ?? null;
        const reference =
          res.data?.checkout?.transactionId ||
          String(res.data?.order?.orderNumber || "") ||
          String(res.data?.order?.id || "") ||
          null;
        if (
          res.data?.order?.status === "pending" &&
          (qrCode || checkoutUrl || deepLink)
        ) {
          return { checkoutUrl, qrCode, deepLink, reference };
        }
        void showErrorAlert(
          lang === "lo"
            ? qrCode
              ? "ທະນາຄານບໍ່ໄດ້ສົ່ງລິ້ງເຂົ້າໜ້າຊຳລະໂດຍກົງ. ກະລຸນາເລືອກທະນາຄານທີ່ຮອງຮັບລິ້ງຊຳລະ ຫຼືຕິດຕໍ່ຝ່າຍຊ່ວຍເຫຼືອ."
              : "ສ້າງລິ້ງຊຳລະບໍ່ສຳເລັດ. ກະລຸນາລອງໃໝ່."
            : qrCode
              ? "The bank did not return a direct payment link. Choose a bank that supports payment links or contact support."
              : "PhaJay did not return a payment link. Please try again.",
          lang,
          lang === "lo" ? "ສ້າງລິ້ງຊຳລະບໍ່ສຳເລັດ" : "Payment link unavailable",
        );
        return null;
      }
      if (res.data?.order?.status !== "confirmed") {
        void showErrorAlert(
          lang === "lo"
            ? "ບໍ່ສາມາດຢືນຢັນປີ້ຟຣີໄດ້."
            : "The free ticket could not be confirmed.",
          lang,
        );
        return null;
      }
    }
    return { checkoutUrl: null, qrCode: null, deepLink: null, reference: null };
  };

  const handleInitiateCheckout = async (bankId = selectedBank) => {
    if (isProcessing) return;
    if (total > 0 && !bankId) return;
    if (paymentReference) {
      const targetLink = bankDeepLink || hostedCheckoutUrl;
      if (bankId === selectedBank && targetLink) {
        if (isDesktopViewport) {
          window.open(targetLink, "_blank", "noopener,noreferrer");
        } else {
          window.location.assign(targetLink);
        }
      } else {
        void showErrorAlert(
          lang === "lo"
            ? "ມີລາຍການຊຳລະທີ່ຍັງຄ້າງຢູ່. ລະບົບກຳລັງກວດສອບສະຖານະ; ກະລຸນາຢ່າສ້າງລາຍການຊ້ຳ."
            : "A payment is already pending. We are checking its status; please do not create a duplicate order.",
          lang,
          lang === "lo" ? "ລາຍການຊຳລະຍັງຄ້າງ" : "Payment pending",
        );
      }
      return;
    }
    if (!isDetailsValid) {
      void showErrorAlert(
        lang === "lo"
          ? "ກະລຸນາກອກຂໍ້ມູນຜູ້ຊື້ ແລະຕອບຄຳຖາມທີ່ຈຳເປັນໃຫ້ຄົບກ່ອນຊຳລະເງິນ."
          : "Complete the required attendee details before continuing to payment.",
        lang,
        lang === "lo" ? "ຂໍ້ມູນຍັງບໍ່ຄົບ" : "Required details missing",
      );
      return;
    }
    if (!validateContactDetails()) return;
    if (bankId) setSelectedBank(bankId);
    setIsProcessing(true);
    const created = await createRealOrder(bankId);
    if (!created) {
      setIsProcessing(false);
      return;
    }
    const paymentUrl = created.deepLink || created.checkoutUrl;
    if (paymentUrl) {
      setPaymentReference(created.reference);
      setHostedCheckoutUrl(created.checkoutUrl);
      setBankDeepLink(created.deepLink || null);
      setPaymentQrPayload(created.qrCode || created.checkoutUrl || created.deepLink);
      setIsProcessing(false);
      if (isDesktopViewport) return;
      // Preserve the existing mobile flow: open the provider payment URL directly.
      window.location.assign(paymentUrl);
      return;
    }
    if (total > 0 && created.reference) {
      setPaymentReference(created.reference);
      setPaymentQrPayload(created.qrCode);
      setIsProcessing(false);
      if (!isDesktopViewport || !created.qrCode) {
        void showErrorAlert(
          lang === "lo"
            ? "ທະນາຄານບໍ່ໄດ້ສົ່ງລິ້ງ ຫຼື QR ສຳລັບຊຳລະ. ລະບົບຈະກວດສອບສະຖານະລາຍການ."
            : "The bank did not provide a payment link or QR code. We will continue checking the payment status.",
          lang,
          lang === "lo" ? "ຂໍ້ມູນຊຳລະບໍ່ຄົບ" : "Payment details unavailable",
        );
      }
      return;
    }
    setIsProcessing(false);
    setStep("success");
    setTimeout(() => {
      navigate("/dashboard", {
        state: {
          newTicket: {
            event,
            tier,
            quantity: totalQuantity,
            selectedTiers: selectedTiersList,
            selectedDate: state.selectedDate,
            selectedTime: state.selectedTime,
          },
        },
      });
    }, 3000);
  };

  const renderActivitySummary = () => (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-150/60 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          {t.orderSummary}
        </h2>
      </div>
      <div className="flex gap-4 items-center">
        <div
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden cursor-zoom-in shrink-0 border border-gray-100 group"
          onClick={() => setFullscreenImage(event.image)}
        >
          <img
            src={event.image}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-adv-orange px-2 py-0.5 bg-orange-50 rounded-md inline-block mb-1">
            {event.category || "Activity"}
          </span>
          <h3 className="text-sm sm:text-base font-black text-adv-slate leading-snug truncate">
            {event.title}
          </h3>
        </div>
      </div>

      {/* Event Date & Location Block */}
      <div
        className={`grid ${selectedTime ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"} gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs`}
      >
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">
            {lang === "en" ? "Date of Event" : "ວັນທີກິດຈະກຳ"}
          </span>
          <div className="font-extrabold text-adv-slate flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-adv-orange shrink-0" />
            <span>
              {displayDate
                ? formatEventDateDDMMYYYY(displayDate)
                : lang === "en"
                  ? "Flexible"
                  : "ວັນທີປ່ຽນແປງໄດ້"}
            </span>
          </div>
        </div>
        {selectedTime && (
          <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-gray-200/60 pt-2 sm:pt-0 sm:pl-3">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">
              {lang === "en" ? "Time Slot" : "ຮອບເວລາ"}
            </span>
            <div className="font-extrabold text-adv-slate flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-adv-orange shrink-0" />
              <span>{selectedTime}</span>
            </div>
          </div>
        )}
        <div
          className={`space-y-0.5 ${selectedTime ? "border-t sm:border-t-0 sm:border-l border-gray-200/60 pt-2 sm:pt-0 sm:pl-3" : "border-l border-gray-200/60 pl-3"}`}
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">
            {lang === "en" ? "Venue" : "ສະຖານທີ່"}
          </span>
          <div className="font-extrabold text-adv-slate flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-adv-orange shrink-0" />
            <span className="truncate" title={event.location}>
              {event.location}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-1 space-y-2 text-xs font-bold text-gray-600">
        {selectedTiersList.length > 0 ? (
          <div className="space-y-1.5">
            {selectedTiersList.map(({ tier: tItem, quantity: qty }) => (
              <div
                key={tItem.id}
                className="flex justify-between items-center text-adv-slate text-xs sm:text-sm font-extrabold"
              >
                <span>
                  {qty}x {tItem.name}
                </span>
                <span className="font-mono text-adv-orange">
                  {(tItem.price * qty).toLocaleString()} {currency}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-between items-center text-adv-slate text-sm font-extrabold">
            <span>
              {quantity}x {itemName}
            </span>
            <span>
              {subtotal.toLocaleString()} {currency}
            </span>
          </div>
        )}

        {appliedCoupon && (
          <div className="flex justify-between items-center text-adv-green text-xs font-semibold bg-emerald-50/50 px-2.5 py-1.5 rounded-lg border border-emerald-100/40">
            <span className="flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              <span>
                {t.discount} ({appliedCoupon.code})
              </span>
            </span>
            <span>
              -{discount.toLocaleString()} {currency}
            </span>
          </div>
        )}

        <div className="border-t border-gray-150/50 pt-3 flex justify-between items-baseline">
          <span className="text-xs font-black text-adv-slate uppercase tracking-wider">
            {t.total}
          </span>
          <span className="text-xl sm:text-2xl font-black text-adv-orange">
            {total.toLocaleString()} {currency}
          </span>
        </div>
      </div>
    </div>
  );

  if (step === "success") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white">
            <Zap className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-adv-slate">
            {t.paymentSuccess}
          </h2>
          <p className="text-gray-500 font-medium">
            {t.ticketsConfirmed.replace("{eventTitle}", event.title)}
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">
                  Ticket Detail
                </div>
                <div className="font-bold text-adv-slate text-lg">
                  {quantity}x {itemName}
                </div>
              </div>
              <div className="text-xl font-bold text-adv-orange">
                {total.toLocaleString()} {currency}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-adv-orange font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to Tickets...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#F9FAFB] pt-1 sm:pt-2 pb-12 px-4 lg:px-8"
    >
      <SEO
        title={
          lang === "lo"
            ? `ຊຳລະເງິນ - ${event?.title || "ປີ້"}`
            : `Checkout - ${event?.title || "Tickets"}`
        }
        description="Complete your secure ticket payment and registration on Pasopkan."
        noindex={true}
      />
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(null)}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 cursor-zoom-out overflow-y-auto"
          >
            <motion.button
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={fullscreenImage}
              alt="Full view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-adv-orange mb-3 transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToHome}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {step === "details" && (
            <>
              {/* 1. Guest Information (Mobile: 1st, Desktop: Left Column Top) */}
              <div className="order-1 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1">
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-150/60">
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-adv-slate mb-0.5">
                      {t.ticketOwnerInfo}
                    </h3>
                    <p className="text-xs text-gray-500">{t.ticketOwnerDesc}</p>
                  </div>

                  <div className="space-y-3">
                    {ticketOwners.map((owner, idx) => (
                      <div
                        key={idx}
                        className="p-3 sm:p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-adv-orange uppercase tracking-widest">
                            {event?.requireEveryTicketInfo === false
                              ? lang === "en"
                                ? "Buyer Information"
                                : "ຂໍ້ມູນຜູ້ຊື້"
                              : `${t.guest} ${idx + 1}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-0.5">
                              {t.firstName}
                            </label>
                            <input
                              type="text"
                              value={owner.firstName || ""}
                              onChange={(e) =>
                                handleTicketOwnerChange(
                                  idx,
                                  "firstName",
                                  e.target.value,
                                )
                              }
                              placeholder={lang === "en" ? "John" : "ຊື່"}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-0.5">
                              {t.lastName}
                            </label>
                            <input
                              type="text"
                              value={owner.lastName || ""}
                              onChange={(e) =>
                                handleTicketOwnerChange(
                                  idx,
                                  "lastName",
                                  e.target.value,
                                )
                              }
                              placeholder={lang === "en" ? "Doe" : "ນາມສະກຸນ"}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                            />
                          </div>{" "}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-0.5">
                              {t.gender}
                            </label>
                            <select
                              value={owner.gender || ""}
                              onChange={(e) =>
                                handleTicketOwnerChange(
                                  idx,
                                  "gender",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                            >
                              <option value="" disabled>
                                {lang === "lo" ? "ເລືອກເພດ" : "Select Gender"}
                              </option>
                              <option value="Man">
                                {lang === "lo" ? "ຊາຍ (Man)" : "Man"}
                              </option>
                              <option value="Women">
                                {lang === "lo" ? "ຍິງ (Women)" : "Women"}
                              </option>
                              <option value="Other">
                                {lang === "lo" ? "ອື່ນໆ (Other)" : "Other"}
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-0.5">
                              {t.dob}
                            </label>
                            <div
                              className="relative w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DateInputDDMMYYYY
                                key={`dob-input-${idx}`}
                                value={owner.dob || ""}
                                onChange={(val) =>
                                  handleTicketOwnerChange(idx, "dob", val)
                                }
                                placeholder="DD/MM/YYYY"
                                lang={lang}
                                maxDate={new Date()}
                                className="w-full [&_input]:h-[34px] [&_input]:py-0 [&_input]:px-2.5 [&_input]:border-gray-200"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-0.5">
                              {t.phoneNumber}
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={
                                owner.phone.startsWith("856020")
                                  ? 14
                                  : owner.phone.startsWith("85620")
                                    ? 13
                                    : owner.phone.startsWith("856")
                                      ? 14
                                      : owner.phone.startsWith("020")
                                        ? 11
                                        : 10
                              }
                              value={owner.phone || ""}
                              onChange={(e) =>
                                handleTicketOwnerChange(
                                  idx,
                                  "phone",
                                  e.target.value,
                                )
                              }
                              placeholder="20XXXXXXXX"
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-0.5">
                              {t.email}
                            </label>
                            <input
                              type="email"
                              value={owner.email || ""}
                              onChange={(e) =>
                                handleTicketOwnerChange(
                                  idx,
                                  "email",
                                  e.target.value,
                                )
                              }
                              placeholder="example@email.com"
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                            />
                          </div>
                        </div>

                        {event?.attendeeQuestions &&
                          event.attendeeQuestions.length > 0 && (
                            <div className="pt-3 mt-3 border-t border-gray-200/50 space-y-3">
                              {event.attendeeQuestions.map((q) => (
                                <div key={q.id}>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-0.5">
                                    {q.label}{" "}
                                    {q.required && (
                                      <span className="text-adv-orange">*</span>
                                    )}
                                  </label>

                                  {q.type === "text" && (
                                    <input
                                      type="text"
                                      value={
                                        (owner.customAnswers?.[
                                          q.id
                                        ] as string) || ""
                                      }
                                      onChange={(e) =>
                                        handleCustomAnswerChange(
                                          idx,
                                          q.id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                                      placeholder={
                                        lang === "lo"
                                          ? "ຄຳຕອບຂອງທ່ານ..."
                                          : "Your answer..."
                                      }
                                    />
                                  )}

                                  {q.type === "long_text" && (
                                    <textarea
                                      value={
                                        (owner.customAnswers?.[
                                          q.id
                                        ] as string) || ""
                                      }
                                      onChange={(e) =>
                                        handleCustomAnswerChange(
                                          idx,
                                          q.id,
                                          e.target.value,
                                        )
                                      }
                                      rows={4}
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all resize-none"
                                      placeholder={
                                        lang === "lo"
                                          ? "ຄຳຕອບຂອງທ່ານ..."
                                          : "Your answer..."
                                      }
                                    />
                                  )}

                                  {q.type === "url" && (
                                    <input
                                      type="url"
                                      value={
                                        (owner.customAnswers?.[
                                          q.id
                                        ] as string) || ""
                                      }
                                      onChange={(e) =>
                                        handleCustomAnswerChange(
                                          idx,
                                          q.id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                                      placeholder={
                                        lang === "lo"
                                          ? "ລິ້ງ (URL)"
                                          : "Link (URL)"
                                      }
                                    />
                                  )}

                                  {q.type === "single_choice" && (
                                    <select
                                      value={
                                        (owner.customAnswers?.[
                                          q.id
                                        ] as string) || ""
                                      }
                                      onChange={(e) =>
                                        handleCustomAnswerChange(
                                          idx,
                                          q.id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                                    >
                                      <option value="" disabled>
                                        {lang === "lo"
                                          ? "ເລືອກ..."
                                          : "Select..."}
                                      </option>
                                      {q.options?.map((opt, i) => (
                                        <option key={i} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {(q.type === "options" ||
                                    q.type === "multi_choice") && (
                                    <MultiSelectDropdown
                                      options={q.options || []}
                                      selectedValues={
                                        (owner.customAnswers?.[
                                          q.id
                                        ] as string[]) || []
                                      }
                                      onChange={(values) =>
                                        handleCustomAnswerChange(
                                          idx,
                                          q.id,
                                          values,
                                        )
                                      }
                                      lang={lang as "lo" | "en"}
                                    />
                                  )}

                                  {q.type === "checkbox" && (
                                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                                      <input
                                        type="checkbox"
                                        checked={
                                          (owner.customAnswers?.[
                                            q.id
                                          ] as string) === "true"
                                        }
                                        onChange={(e) =>
                                          handleCustomAnswerChange(
                                            idx,
                                            q.id,
                                            e.target.checked ? "true" : "false",
                                          )
                                        }
                                        className="w-3.5 h-3.5 text-adv-orange border-gray-300 rounded focus:ring-adv-orange"
                                      />
                                      <span className="text-xs text-gray-700">
                                        {lang === "lo" ? "ຢືນຢັນ" : "Confirm"}
                                      </span>
                                    </label>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Activity Summary (Mobile: 2nd, Desktop: Right Column Sticky) */}
              <div className="order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-4">
                {renderActivitySummary()}
              </div>

              {/* 3. Payment Method (Mobile: 3rd, Desktop: Left Column Bottom) */}
              <div className="order-3 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-2 space-y-4">
                {total > 0 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-150/60">
                    <h3 className="text-lg sm:text-xl font-bold text-adv-slate mb-3 sm:mb-4">
                      {lang === "en" ? "Payment Method" : "ວິທີການຊຳລະເງິນ"}
                    </h3>
                    <div className="space-y-2 mb-4">
                      {LAOS_BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          disabled={isProcessing || Boolean(paymentReference)}
                          onClick={() => {
                            if (isDesktopViewport) setSelectedBank(bank.id);
                            else void handleInitiateCheckout(bank.id);
                          }}
                          className={`w-full flex items-center p-3 rounded-xl border transition-colors text-left disabled:cursor-wait disabled:opacity-70 ${
                            selectedBank === bank.id
                              ? "border-orange-300 bg-orange-50/60"
                              : "border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 bg-white"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center mr-3 shrink-0 p-1.5">
                            {bank.logo ? (
                              <img
                                src={bank.logo}
                                alt={bank.name}
                                className="w-full h-full object-contain rounded-lg"
                                onError={(event) => {
                                  event.currentTarget.hidden = true;
                                  event.currentTarget.nextElementSibling?.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <div className={`hidden w-full h-full rounded-lg ${bank.color} flex items-center justify-center`}>
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="text-sm sm:text-base font-bold text-adv-slate">
                              {bank.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                              {lang === "lo" ? "Mobile Banking" : "Mobile banking"}
                            </p>
                          </div>
                          {isProcessing && selectedBank === bank.id ? (
                            <Loader2 className="w-4 h-4 text-adv-orange animate-spin" />
                          ) : (
                            <ArrowLeft className="w-4 h-4 rotate-180 text-gray-300" />
                          )}
                        </button>
                      ))}

                      <button
                        key="credit_card"
                        type="button"
                        disabled={isProcessing || Boolean(paymentReference)}
                        onClick={() => {
                          if (isDesktopViewport) setSelectedBank("credit_card");
                          else void handleInitiateCheckout("credit_card");
                        }}
                        className={`w-full flex items-center p-3 rounded-xl border transition-colors disabled:cursor-wait disabled:opacity-70 ${
                          selectedBank === "credit_card"
                            ? "border-orange-300 bg-orange-50/60"
                            : "border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 bg-white"
                        }`}
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center mr-3 shrink-0 shadow-xs p-1">
                          <img
                            src="/Card.png"
                            alt="Credit Card"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-sm sm:text-base font-bold text-adv-slate">
                            {lang === "en" ? "Credit Card" : "ບັດເຄຣດິດ"}
                          </h4>
                          <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Visa / Mastercard (3DS)
                          </p>
                        </div>
                      </button>
                    </div>

                    {isDesktopViewport && selectedBank && !paymentReference && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void handleInitiateCheckout(selectedBank)}
                        className="w-full rounded-xl bg-adv-orange px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {lang === "lo" ? "ກຳລັງສ້າງລາຍການຊຳລະ..." : "Preparing payment..."}
                          </span>
                        ) : (
                          lang === "lo" ? "ຊຳລະເງິນ" : "Pay now"
                        )}
                      </button>
                    )}

                    {isDesktopViewport && paymentReference && (
                      <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-adv-slate">
                              {lang === "lo" ? "ສະແກນ QR ເພື່ອຊຳລະ" : "Scan QR code to pay"}
                            </h4>
                            <p className="mt-1 text-xs text-gray-500">
                              {lang === "lo" ? "ເລກອ້າງອີງ: " : "Reference: "}{paymentReference}
                            </p>
                          </div>
                          {paymentQrPayload && (
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                              <QRCodeSVG value={paymentQrPayload} size={176} level="M" includeMargin />
                            </div>
                          )}
                        </div>
                        {!paymentQrPayload && (
                          <p className="mt-3 text-sm text-gray-600">
                            {lang === "lo" ? "ກຳລັງລໍຖ້າຂໍ້ມູນ QR ຈາກຜູ້ໃຫ້ບໍລິການ..." : "Waiting for the provider's QR payment details..."}
                          </p>
                        )}
                        {(bankDeepLink || hostedCheckoutUrl) && (
                          <button
                            type="button"
                            onClick={() => void handleInitiateCheckout(selectedBank)}
                            className="mt-4 w-full rounded-xl bg-adv-orange px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
                          >
                            {lang === "lo" ? "ເປີດໜ້າຊຳລະ" : "Open payment page"}
                          </button>
                        )}
                        <p className="mt-3 text-center text-xs text-gray-500">
                          {lang === "lo" ? "ລະບົບກຳລັງກວດສອບສະຖານະການຊຳລະອັດຕະໂນມັດ." : "Payment status is checked automatically."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {total === 0 && (
                  <button
                    type="button"
                    disabled={!isDetailsValid || isProcessing}
                    onClick={() => void handleInitiateCheckout(null)}
                    className="w-full py-3 bg-adv-orange text-white rounded-xl font-bold text-sm sm:text-base hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : t.book || "Book"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
