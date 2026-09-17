import OtpInput from '../components/OtpInput';
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
  CreditCard,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  LaoEvent,
  TicketTier,
  SeatingZone,
  events,
  Coupon,
} from "../data/events";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../lib/supabase";

import { addEventAttendee } from "../lib/checkinsStore";
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
    generateQr: "Generate QR",
    scanToPay: "Scan to Pay",
    openAppToScan:
      "Open your {bankName} app and scan the QR code to complete the payment.",
    verifyingPayment: "Verifying payment...",
    waitingForPayment: "Waiting for payment confirmation...",
    autoVerifyNotice:
      "This page will automatically update once payment is verified.",
    checkout: "Pay Now",
    book: "Book",
    startingFrom: "From",
    ticketOwnerInfo: "Guest Information",
    ticketOwnerDesc:
      "Please provide the details of the persons attending the activity.",
    guest: "Guest",
    fullName: "Full Name",
    firstName: "First Name",
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
    generateQr: "ສ້າງ QR code",
    scanToPay: "ສະແກນເພື່ອຈ່າຍ",
    openAppToScan: "ໃຊ້ແອັບ {bankName} ເພື່ອສະແກນ QR ແລະ ຊຳລະເງິນ.",
    verifyingPayment: "ກຳລັງກວດສອບການຊຳລະ...",
    waitingForPayment: "ກຳລັງລໍຖ້າການຢືນຢັນການຊຳລະເງິນ...",
    autoVerifyNotice:
      "ໜ້າຈໍຈະປ່ຽນໄປໜ້າສຳເລັດໂດຍອັດຕະໂນມັດເມື່ອໄດ້ຮັບການຊຳລະເງິນ.",
    checkout: "ຊຳລະເງິນ",
    book: "ຈອງ",
    startingFrom: "ເລີ່ມຕົ້ນທີ່",
    ticketOwnerInfo: "ຂໍ້ມູນຜູ້ເຂົ້າຮ່ວມ",
    ticketOwnerDesc: "ກະລຸນາລະບຸຂໍ້ມູນຂອງຜູ້ທີ່ຈະເຂົ້າຮ່ວມກິດຈະກຳ.",
    guest: "ຜູ້ເຂົ້າຮ່ວມ",
    fullName: "ຊື່ ແລະ ນາມສະກຸນ",
    firstName: "ຊື່",
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



  // Checkout OTP State
  const [showCheckoutOtpModal, setShowCheckoutOtpModal] = useState(false);
  const [checkoutOtpCode, setCheckoutOtpCode] = useState("");
  const [checkoutOtpError, setCheckoutOtpError] = useState("");
  const [checkoutOtpCountdown, setCheckoutOtpCountdown] = useState(60);
  const [isVerifyingCheckoutOtp, setIsVerifyingCheckoutOtp] = useState(false);
  const expectedCheckoutOtp = "123456";
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCheckoutOtpModal && checkoutOtpCountdown > 0) {
      timer = setTimeout(() => setCheckoutOtpCountdown(checkoutOtpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showCheckoutOtpModal, checkoutOtpCountdown]);

  const handleResendCheckoutOtp = () => {
    setCheckoutOtpCountdown(60);
    setCheckoutOtpError('');
  };
  
  const handleInitiateCheckout = () => {
    if (!validateContactDetails()) return;
    if (total > 0 && !selectedBank) return;
    setShowCheckoutOtpModal(true);
    setCheckoutOtpCountdown(60);
  };

  const [step, setStep] = useState<"details" | "payment" | "qr" | "success">(
    "details",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(900);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [creditCardUrl, setCreditCardUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const ownersCount =
    event?.requireEveryTicketInfo === false ? 1 : totalQuantity;
  const [ticketOwners, setTicketOwners] = useState(
    Array.from({ length: ownersCount }, () => ({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      customAnswers: {} as Record<string, string | string[]>,
    })),
  );

  const handleTicketOwnerChange = (
    index: number,
    field: "firstName" | "lastName" | "phone" | "email",
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
      (event?.attendeeQuestions?.every((q) => {
        if (!q.required) return true;
        const answer = owner.customAnswers[q.id];
        if (Array.isArray(answer)) return answer.length > 0;
        return answer && answer.trim() !== "";
      }) ??
        true),
  );

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const discountVal = Number(appliedCoupon.discount);

    if (appliedCoupon.type === "percentage") {
      const calculated = (subtotal * discountVal) / 100;
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
    let timer: NodeJS.Timeout;
    if (step === "qr" && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0 && step === "qr") {
      setStep("details");
      setCountdown(900);
      alert("Payment window expired. Please try again.");
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

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
        alert(lang === "lo" ? `ກະລຸນາປ້ອນເບີໂທລະສັບໃຫ້ຖືກຕ້ອງ ສຳລັບຜູ້ເຂົ້າຮ່ວມທີ ${i + 1} (ຫ້າມຍະຫວ່າງ).` : `Please enter a valid phone number for Guest ${i + 1} without spaces.`);
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.includes(" ") || !emailRegex.test(email)) {
        alert(lang === "lo" ? `ກະລຸນາປ້ອນອີເມວໃຫ້ຖືກຕ້ອງ ສຳລັບຜູ້ເຂົ້າຮ່ວມທີ ${i + 1} (ຫ້າມຍະຫວ່າງ).` : `Please enter a valid email for Guest ${i + 1} without spaces.`);
        return false;
      }
    }
    return true;
  };

  const handleFreeCheckout = () => {
    if (!validateContactDetails()) return;
    setIsProcessing(true);
    setTimeout(() => {
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
    }, 1500);
  };

  const handleBankSelection = async () => {
    if (!validateContactDetails()) return;
    if (!selectedBank) return;
    setIsProcessing(true);

    if (selectedBank === "credit_card") {
      try {
        const response = await fetch(
          "https://payment-gateway.phajay.co/v1/api/jdb2c2p/payment/payment-link",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Basic " +
                btoa(
                  "$2a$10$KAXhz.SdbngsbYr.8TYn5ukiYgIJxHT7JqIc5L21K7GJtipmNVJ2.",
                ),
            },
            body: JSON.stringify({
              amount: total,
              description: `Ticket: ${event.title}`
                .replace(/[^\x00-\x7F]/g, "")
                .trim(),
              tag1: "Pasopkan",
              tag2: user?.id || "anonymous",
              tag3: event.id,
            }),
          },
        );

        const data = await response.json();
        if (data.message === "SUCCESSFULLY") {
          setCreditCardUrl(data.paymentUrl);
          setTransactionId(data.transactionId);
          setStep("qr");
        } else {
          alert(data.message || "Failed to generate Credit Card payment link.");
        }
      } catch (error) {
        console.error(error);
        alert("Network error. Please try again.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const bankUrls: Record<string, string> = {
      bcel: "generate-bcel-qr",
      ldb: "generate-ldb-qr",
      jdb: "generate-jdb-qr",
      ib: "generate-ib-qr",
      stb: "generate-stb-qr",
    };

    try {
      const response = await fetch(
        `https://payment-gateway.phajay.co/v1/api/payment/${bankUrls[selectedBank]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            secretKey:
              "$2a$10$KAXhz.SdbngsbYr.8TYn5ukiYgIJxHT7JqIc5L21K7GJtipmNVJ2.",
          },
          body: JSON.stringify({
            amount: total,
            description: `Ticket: ${event.title}`
              .replace(/[^\x00-\x7F]/g, "")
              .trim(),
          }),
        },
      );

      const data = await response.json();
      if (data.message === "SUCCESSFULLY") {
        setQrCodeData(data.qrCode);
        setTransactionId(data.transactionId);
        setStep("qr");
      } else {
        alert(data.message || "Failed to generate payment QR.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let activeSocket: any = null;
    let pollInterval: any = null;
    let isCompleted = false;

    const handlePaymentSuccess = () => {
      if (isCompleted) return;
      isCompleted = true;
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

    if (step === "qr" && transactionId) {
      // 1. Listen via Socket.IO for gateway push event
      import("socket.io-client")
        .then(({ io }) => {
          if (step !== "qr" || !transactionId || isCompleted) return;
          const socket = io("https://payment-gateway.phajay.co/");
          activeSocket = socket;
          const secretKey =
            "$2a$10$KAXhz.SdbngsbYr.8TYn5ukiYgIJxHT7JqIc5L21K7GJtipmNVJ2.";

          socket.on("connect", () => {
            socket.on("join::" + secretKey, (data: any) => {
              if (
                data &&
                data.transactionId === transactionId &&
                (data.status === "PAYMENT_COMPLETED" ||
                  data.status === "COMPLETED" ||
                  data.status === "PAID")
              ) {
                handlePaymentSuccess();
              }
            });
          });
        })
        .catch((err) => {
          console.error("Socket.io load/connection failure:", err);
        });

      // 2. Poll backend webhook status endpoint every 2.5 seconds
      const checkBackendWebhookStatus = async () => {
        if (isCompleted || step !== "qr" || !transactionId) return;
        try {
          const res = await fetch(
            `/api/payment/status/${encodeURIComponent(transactionId)}`,
          );
          if (res.ok) {
            const result = await res.json();
            if (
              result &&
              (result.status === "COMPLETED" ||
                result.status === "PAYMENT_COMPLETED" ||
                result.status === "PAID" ||
                result.verified === true)
            ) {
              handlePaymentSuccess();
            }
          }
        } catch (pollErr) {
          // Ignore network glitch during polling
        }
      };

      // Run initial check after 2s, then every 2.5s
      const initialTimer = setTimeout(checkBackendWebhookStatus, 2000);
      pollInterval = setInterval(checkBackendWebhookStatus, 2500);

      return () => {
        clearTimeout(initialTimer);
        if (pollInterval) clearInterval(pollInterval);
        if (activeSocket) {
          activeSocket.disconnect();
        }
      };
    }
  }, [
    step,
    transactionId,
    navigate,
    event,
    tier,
    totalQuantity,
    selectedTiersList,
    state.selectedDate,
    state.selectedTime,
  ]);

  useEffect(() => {
    if (step === "success" && event?.id) {
      // 1. Local storage tracking
      try {
        const purchased = localStorage.getItem("pasopkan_purchased_event_ids");
        const list = purchased ? JSON.parse(purchased) : [];
        if (!list.includes(event.id)) {
          list.push(event.id);
          localStorage.setItem(
            "pasopkan_purchased_event_ids",
            JSON.stringify(list),
          );
        }

        // Also save to user tickets for the Dashboard
        const existingTicketsRaw = localStorage.getItem(
          "pasopkan_user_tickets",
        );
        let userTickets = [];
        try {
          if (existingTicketsRaw) userTickets = JSON.parse(existingTicketsRaw);
        } catch (e) {}
        const newTicketObj = {
          id: transactionId || `tk_${Math.random().toString(36).substr(2, 9)}`,
          event,
          tier: selectedTiersList.length > 0 ? selectedTiersList[0].tier : tier,
          quantity: totalQuantity,
          selectedTiers: selectedTiersList,
          selectedDate: state.selectedDate || event?.date,
          selectedTime: state.selectedTime || event?.time,
          status: "upcoming",
          bookingDate: new Date().toISOString(),
          purchaseDate: new Date().toISOString(),
        };
        userTickets.push(newTicketObj);
        localStorage.setItem(
          "pasopkan_user_tickets",
          JSON.stringify(userTickets),
        );

        // Save detailed attendee registration records with questionnaire answers for the Organizer
        try {
          ticketOwners.forEach((owner, idx) => {
            const currentTicketId =
              totalQuantity > 1
                ? `${transactionId || "tk"}-${idx + 1}`
                : transactionId ||
                  `tk_${Math.random().toString(36).substr(2, 9)}`;
            const attendeeFirstName =
              owner.firstName.trim() ||
              (user?.name ? user.name.split(" ")[0] : "Attendee");
            const attendeeLastName =
              owner.lastName.trim() ||
              (user?.name
                ? user.name.split(" ").slice(1).join(" ")
                : `${idx + 1}`);
            const tierInfo =
              selectedTiersList.length > 0
                ? selectedTiersList[idx % selectedTiersList.length]?.tier ||
                  tier
                : tier;

            addEventAttendee({
              id: `att_${Date.now()}_${idx + 1}_${Math.random().toString(36).substr(2, 5)}`,
              ticketId: currentTicketId,
              orderId: transactionId || `ord_${Date.now()}`,
              eventId: String(event.id),
              firstName: attendeeFirstName,
              lastName: attendeeLastName,
              attendeeName:
                `${attendeeFirstName} ${attendeeLastName}`.trim() ||
                user?.name ||
                `Attendee ${idx + 1}`,
              email:
                owner.email.trim() || user?.email || "attendee@pasopkan.la",
              phone:
                owner.phone.trim() ||
                (user as any)?.phone ||
                "+856 20 5555 1234",
              ticketType: tierInfo?.name || "Standard Pass",
              tierId: tierInfo?.id,
              zone:
                zone?.name ||
                (event.hasSeating
                  ? `Zone ${String.fromCharCode(65 + (idx % 3))}`
                  : "General Access"),
              seat: event.hasSeating
                ? `Row ${(idx % 8) + 1}, Seat ${(idx % 15) + 1}`
                : `Ticket #${idx + 1}`,
              price: `${total.toLocaleString()} LAK`,
              purchaseDate: new Date().toISOString(),
              isCheckedIn: false,
              customAnswers: owner.customAnswers || {},
            });
          });
        } catch (attErr) {
          console.error("Error saving attendee answers:", attErr);
        }

        // Save coupon redemption details if a coupon was applied
        if (appliedCoupon) {
          try {
            const existingRedemptionsRaw = localStorage.getItem(
              "pasopkan_coupon_redemptions",
            );
            const redemptionsList = existingRedemptionsRaw
              ? JSON.parse(existingRedemptionsRaw)
              : [];
            const activeUsr = user;
            redemptionsList.push({
              id: `red_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              couponId: String(appliedCoupon.id || appliedCoupon.code),
              couponCode: appliedCoupon.code,
              eventId: String(event.id),
              eventTitle:
                typeof event.title === "string" ? event.title : "Event",
              userId: activeUsr?.id || "usr_guest",
              userName:
                activeUsr?.displayName ||
                user?.name ||
                (activeUsr?.email ? activeUsr.email.split("@")[0] : "Attendee"),
              userEmail:
                activeUsr?.email || user?.email || "attendee@pasopkan.la",
              userPhone:
                (activeUsr as any)?.phoneNumber ||
                user?.phone ||
                "+856 20 5555 1234",
              userAvatar: (activeUsr as any)?.photoURL || user?.avatar,
              orderId: transactionId || `ord_${Date.now()}`,
              tierName:
                selectedTiersList.length > 0
                  ? selectedTiersList
                      .map((i) => `${i.quantity}x ${i.tier.name}`)
                      .join(", ")
                  : tier?.name || "Standard",
              discountSaved: discount,
              totalPaid: total,
              usedAt: new Date().toISOString(),
            });
            localStorage.setItem(
              "pasopkan_coupon_redemptions",
              JSON.stringify(redemptionsList),
            );
          } catch (err) {
            console.error("Error saving coupon redemption:", err);
          }
        }
      } catch (e) {
        console.error("Error saving purchased event ID:", e);
      }

      // 2. Firestore tickets collection tracking
      const eventId = event.id;
      const rawTitle = event.title;
      const createSupabaseTicket = async () => {
        if (!user) return;
        try {
          const { error } = await supabase.from('tickets').insert({
            user_id: user.id,
            event_id: event.id,
            ticket_type: selectedTiersList[0]?.tier?.name || 'Standard',
            quantity: quantity || selectedTiersList.reduce((acc, t) => acc + t.quantity, 0),
            total_price: total,
            status: 'valid'
          });
          if (error) throw error;
        } catch (err: any) {
          console.error("Failed to sync ticket to database:", err);
        }
      };

      createSupabaseTicket();
    }
  }, [step, event, tier, quantity, state?.selectedDate, state?.selectedTime]);

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
                ? new Date(displayDate).toLocaleDateString(
                    lang === "en" ? "en-US" : "lo-LA",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )
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
          onClick={() => {
            if (step === "qr") setStep("details");
            else navigate(-1);
          }}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-adv-orange mb-3 transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToHome}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {step === "details" ? (
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
                          onClick={() => setSelectedBank(bank.id)}
                          className={`w-full flex items-center p-3 rounded-xl border-2 transition-all ${
                            selectedBank === bank.id
                              ? "border-adv-orange bg-orange-50/50"
                              : "border-gray-50 hover:border-gray-100 bg-gray-50/50"
                          }`}
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center mr-3 shrink-0 shadow-xs p-1">
                            {bank.logo ? (
                              <img
                                src={bank.logo}
                                alt={bank.name}
                                className="w-full h-full object-contain rounded-lg"
                              />
                            ) : (
                              <div
                                className={`w-full h-full rounded-lg ${bank.color} flex items-center justify-center`}
                              >
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="text-sm sm:text-base font-bold text-adv-slate">
                              {bank.name}
                            </h4>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Mobile Banking
                            </p>
                          </div>
                        </button>
                      ))}

                      <button
                        key="credit_card"
                        onClick={() => setSelectedBank("credit_card")}
                        className={`w-full flex items-center p-3 rounded-xl border-2 transition-all ${
                          selectedBank === "credit_card"
                            ? "border-adv-orange bg-orange-50/50"
                            : "border-gray-50 hover:border-gray-100 bg-gray-50/50"
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
                  </div>
                )}

                <button
                  disabled={!isDetailsValid || (total > 0 && !selectedBank) || isProcessing}
                  onClick={handleInitiateCheckout}
                  className="w-full py-3 bg-adv-orange text-white rounded-xl font-bold text-sm sm:text-base hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : total === 0 ? (
                    t.book || "Book"
                  ) : (
                    t.checkout
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* QR / Credit Card Gateway view */}
              <div className="order-1 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1">
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-150/60 flex flex-col items-center"
                >
                  {selectedBank === "credit_card" ? (
                    <>
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-adv-slate mb-3">
                          {lang === "en"
                            ? "Credit Card Checkout"
                            : "ຊຳລະດ້ວຍບັດເຄຣດິດ"}
                        </h3>
                        <p className="text-gray-500 text-sm font-medium">
                          {lang === "en"
                            ? "Complete your payment securely via our Visa/Mastercard gateway."
                            : "ຊຳລະເງິນຢ່າງປອດໄພຜ່ານລະບົບ Visa/Mastercard ຂອງພວກເຮົາ."}
                        </p>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-3xl w-full flex flex-col items-center border border-gray-100 mb-8">
                        <div className="flex justify-between w-full mb-6 text-xs font-bold uppercase tracking-widest">
                          <span className="text-adv-green flex items-center gap-2">
                            <div className="w-2 h-2 bg-adv-green rounded-full animate-pulse" />{" "}
                            Gateway Secure
                          </span>
                          <span className="text-red-500">
                            {Math.floor(countdown / 60)}:
                            {(countdown % 60).toString().padStart(2, "0")}
                          </span>
                        </div>

                        <div className="w-full bg-white rounded-2xl p-6 border border-gray-100 text-center space-y-6">
                          <div className="w-16 h-16 bg-white border border-gray-150 rounded-2xl flex items-center justify-center mx-auto p-2 shadow-xs">
                            <img
                              src="/Card.png"
                              alt="Credit Card"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-extrabold text-adv-slate text-base">
                              {lang === "en"
                                ? "Secure Payment Portal Ready"
                                : "ຊ່ອງທາງການຊຳລະເງິນປອດໄພພ້ອມແລ້ວ"}
                            </h4>
                            <p className="text-xs text-gray-400 font-semibold max-w-xs mx-auto leading-relaxed">
                              {lang === "en"
                                ? "Click the button below to open the secure banking page and complete your transaction. Only 3D Secure (3DS) cards are supported."
                                : "ກະລຸນາຄລິກປຸ່ມລຸ່ມນີ້ເພື່ອເປີດໜ້າຊຳລະເງິນຂອງທະນາຄານຢ່າງປອດໄພ. ຮອງຮັບສະເພາະບັດທີ່ມີລະບົບ 3D Secure (3DS) ເທົ່ານັ້ນ."}
                            </p>
                          </div>

                          {creditCardUrl && (
                            <a
                              href={creditCardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full py-4 px-6 bg-adv-orange hover:bg-orange-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-wider transition-all items-center justify-center gap-2 shadow-lg shadow-orange-100 active:scale-[0.98]"
                            >
                              <span>
                                {lang === "en"
                                  ? "Open Payment Portal"
                                  : "ເປີດໜ້າຊຳລະເງິນ"}
                              </span>
                              <Zap className="w-4 h-4 text-white" />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        {(() => {
                          const bObj = LAOS_BANKS.find(
                            (b) => b.id === selectedBank,
                          );
                          return bObj?.logo ? (
                            <div className="w-14 h-14 mx-auto mb-3 bg-white p-1.5 rounded-2xl shadow-xs border border-gray-150 flex items-center justify-center">
                              <img
                                src={bObj.logo}
                                alt={bObj.name}
                                className="w-full h-full object-contain rounded-xl"
                              />
                            </div>
                          ) : null;
                        })()}
                        <h3 className="text-2xl font-bold text-adv-slate mb-2">
                          {t.scanToPay}
                        </h3>
                        <p className="text-gray-500 text-sm font-medium">
                          {t.openAppToScan.replace(
                            "{bankName}",
                            LAOS_BANKS.find((b) => b.id === selectedBank)
                              ?.name || "",
                          )}
                        </p>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-3xl w-full flex flex-col items-center border border-gray-100 mb-8">
                        <div className="flex justify-between w-full mb-4 text-xs font-bold uppercase tracking-widest">
                          <span className="text-adv-green flex items-center gap-2">
                            <div className="w-2 h-2 bg-adv-green rounded-full animate-pulse" />{" "}
                            Link Active
                          </span>
                          <span className="text-red-500">
                            {Math.floor(countdown / 60)}:
                            {(countdown % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                        <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center p-6 shadow-inner relative overflow-hidden">
                          {qrCodeData && (
                            <QRCodeSVG
                              value={qrCodeData}
                              size={256}
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="w-full py-4 px-5 bg-gradient-to-r from-orange-50/70 via-gray-50 to-orange-50/70 border border-orange-200/60 rounded-2xl flex items-center justify-center gap-3.5 shadow-xs">
                    <div className="relative flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 bg-adv-orange rounded-full animate-ping absolute opacity-75" />
                      <span className="w-2.5 h-2.5 bg-adv-orange rounded-full relative" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-extrabold text-adv-slate flex items-center gap-1.5">
                        {t.waitingForPayment}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                        {t.autoVerifyNotice}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 2. Activity Summary in QR state */}
              <div className="order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:sticky lg:top-4">
                {renderActivitySummary()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Checkout OTP Modal */}
      <AnimatePresence>
        {showCheckoutOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setShowCheckoutOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-2xl p-5 sm:p-7 shadow-2xl border border-gray-100 text-adv-slate"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-adv-orange flex items-center justify-center mx-auto mb-3 border border-orange-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-center mb-1">
                {lang === 'lo' ? 'ຢືນຢັນການຊຳລະເງິນ' : 'Verify Transaction'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium text-center mb-4 leading-relaxed">
                {lang === 'lo'
                  ? 'ກະລຸນາປ້ອນລະຫັດ OTP 6 ຫຼັກ ເພື່ອຢືນຢັນການສັ່ງຊື້ປີ້'
                  : 'Enter the 6-digit OTP code to securely authorize this ticket purchase.'}
              </p>

              <div className="mb-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block text-center mb-2">
                  {lang === 'lo' ? 'ລະຫັດ OTP 6 ຫຼັກ' : '6-Digit OTP Code'}
                </label>
                <OtpInput
                  length={6}
                  autoFocus={true}
                  value={checkoutOtpCode}
                  onChange={(val) => {
                    setCheckoutOtpCode(val);
                    setCheckoutOtpError('');
                  }}
                  error={!!checkoutOtpError}
                />
                {checkoutOtpError && (
                  <p className="text-red-500 text-[11px] font-bold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{checkoutOtpError}</span>
                  </p>
                )}
                
                {/* Resend OTP */}
                <div className="mt-4 flex flex-col items-center">
                  {checkoutOtpCountdown > 0 ? (
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lang === 'lo' ? `ສົ່ງໃໝ່ໃນ ${checkoutOtpCountdown} ວິນາທີ` : `Resend in ${checkoutOtpCountdown}s`}
                    </span>
                  ) : (
                    <button
                      onClick={handleResendCheckoutOtp}
                      className="text-[11px] font-bold text-adv-orange hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {lang === 'lo' ? 'ສົ່ງລະຫັດໃໝ່' : 'Resend OTP Code'}
                    </button>
                  )}
                </div>

                {/* Demo Helper Pill */}
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutOtpCode(expectedCheckoutOtp);
                      setCheckoutOtpError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full text-[10px] font-bold transition-colors"
                  >
                    Demo OTP: {expectedCheckoutOtp}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCheckoutOtpModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    if (checkoutOtpCode !== expectedCheckoutOtp && checkoutOtpCode !== "123456") {
                      setCheckoutOtpError(lang === 'lo' ? 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ' : 'Invalid OTP code');
                      return;
                    }
                    setIsVerifyingCheckoutOtp(true);
                    await new Promise(r => setTimeout(r, 1000));
                    setIsVerifyingCheckoutOtp(false);
                    setShowCheckoutOtpModal(false);
                    if (total === 0) {
                      handleFreeCheckout();
                    } else {
                      handleBankSelection();
                    }
                  }}
                  disabled={checkoutOtpCode.length < 6 || isVerifyingCheckoutOtp}
                  className="flex-1 py-3 bg-adv-orange hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex justify-center items-center gap-2"
                >
                  {isVerifyingCheckoutOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    lang === 'lo' ? 'ຢືນຢັນ' : 'Verify & Proceed'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
