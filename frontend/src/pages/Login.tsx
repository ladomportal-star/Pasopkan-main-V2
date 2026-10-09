import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Globe2,
  KeyRound,
  Loader2,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { displayLaoPhone, isValidLaoMobilePhone, normalizeLaoPhone } from "../lib/phone";
import OtpInput from "../components/OtpInput";
import SEO from "../components/SEO";

const GoogleMark = ({ className = "h-5 w-5 shrink-0" }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
    <path
      fill="#4285F4"
      d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 5-.9 6.8-2.4l-3.3-2.6c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10.3 10.3 0 0 0 12 22Z"
    />
    <path
      fill="#FBBC05"
      d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3A10 10 0 0 0 3 16.6l3.4-2.7Z"
    />
    <path
      fill="#EA4335"
      d="M12 6c1.5 0 2.9.5 3.9 1.5l3-3A10 10 0 0 0 3 7.4l3.4 2.7A6 6 0 0 1 12 6Z"
    />
  </svg>
);

export default function Login({
  registering = false,
}: {
  registering?: boolean;
}) {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithPhoneSession } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"google" | "phone">("google");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp">("phone");
  const [cooldown, setCooldown] = useState(0);
  const lo = lang === "lo";
  const dark = theme === "dark";

  const copy = {
    title: registering
      ? lo
        ? "ເລີ່ມຕົ້ນກັບ Pasopkan"
        : "Start with Pasopkan"
      : lo
        ? "ຍິນດີຕ້ອນຮັບກັບຄືນ"
        : "Welcome back",
    subtitle: registering
      ? lo
        ? "ສ້າງບັນຊີຢ່າງປອດໄພດ້ວຍ Google ຫຼື ເບີໂທ"
        : "Create your secure account with Google or phone"
      : lo
        ? "ເຂົ້າລະບົບເພື່ອຈອງ ແລະ ຈັດການປີ້ຂອງທ່ານ"
        : "Sign in to book and manage your tickets",
    button: registering
      ? lo
        ? "ສ້າງບັນຊີດ້ວຍ Google"
        : "Create account with Google"
      : lo
        ? "ສືບຕໍ່ດ້ວຍ Google"
        : "Continue with Google",
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function selectMethod(next: "google" | "phone") {
    setMethod(next);
    setError("");
  }

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch {
      setError(
        lo
          ? "ບໍ່ສາມາດເຊື່ອມຕໍ່ Google ໄດ້. ກະລຸນາກວດການຕັ້ງຄ່າ ແລ້ວລອງໃໝ່."
          : "Could not connect to Google. Check the authentication setup and try again.",
      );
      setBusy(false);
    }
  }

  async function sendOtp() {
    const normalized = normalizeLaoPhone(phone);
    if (!isValidLaoMobilePhone(normalized)) {
      setError(
        lo
          ? "ກະລຸນາໃສ່ເບີ Unitel, Lao Telecom, TPlus ຫຼື ETL ໃນຮູບແບບ 020 5555 5555"
          : "Enter a Lao mobile number such as 020 5555 5555.",
      );
      return;
    }

    setBusy(true);
    setError("");
    const result = await api.sendPhoneOtp(normalized);
    setBusy(false);
    if (!result.ok) {
      setError(
        result.status === 429
          ? lo
            ? "ທ່ານຂໍ OTP ຫຼາຍເກີນໄປ. ກະລຸນາລໍຖ້າແລ້ວລອງໃໝ່."
            : "Too many OTP requests. Please wait and try again."
          : lo
            ? "ບໍ່ສາມາດສົ່ງ OTP ໄດ້. ກະລຸນາກວດການຕັ້ງຄ່າ SMS ແລ້ວລອງໃໝ່."
            : "Could not send the OTP. Check the SMS configuration and try again.",
      );
      return;
    }

    setPhone(normalized);
    setOtp("");
    setPhoneStep("otp");
    setCooldown(result.data?.cooldownSeconds ?? 60);
  }

  async function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setError(lo ? "ກະລຸນາໃສ່ OTP ໃຫ້ຄົບ 6 ຕົວ" : "Enter all 6 OTP digits.");
      return;
    }

    setBusy(true);
    setError("");
    const result = await api.verifyPhoneOtp(phone, otp);
    if (!result.ok || !result.data?.session) {
      setBusy(false);
      setError(
        result.status === 429
          ? lo
            ? "ທ່ານລອງ OTP ຫຼາຍເກີນໄປ. ກະລຸນາລໍຖ້າ."
            : "Too many attempts. Please wait before trying again."
          : lo
            ? "OTP ບໍ່ຖືກຕ້ອງ ຫຼືໝົດອາຍຸແລ້ວ."
            : "The OTP is invalid or has expired.",
      );
      return;
    }

    try {
      await loginWithPhoneSession(result.data.session);
      navigate("/");
    } catch {
      setBusy(false);
      setError(lo ? "ບໍ່ສາມາດເປີດ session ໄດ້. ກະລຸນາລອງໃໝ່." : "Could not start your session. Try again.");
    }
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        dark ? "bg-zinc-950 text-white" : "bg-[#fffaf6] text-adv-slate"
      }`}
    >
      <SEO
        title={
          registering
            ? lo
              ? "ສ້າງບັນຊີ Pasopkan"
              : "Create a Pasopkan account"
            : lo
              ? "ເຂົ້າສູ່ Pasopkan"
              : "Sign in to Pasopkan"
        }
        description="Sign in securely with Google or a phone OTP to discover experiences and manage Pasopkan tickets."
        noindex
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 -top-36 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute -bottom-44 -right-28 h-120 w-120 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] texture-bg" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <button
          type="button"
          onClick={() => navigate("/")}
          className={`group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
            dark
              ? "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              : "bg-white/75 text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-white hover:text-slate-950"
          }`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {lo ? "ກັບໜ້າຫຼັກ" : "Back home"}
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
            dark
              ? "bg-white/5 text-zinc-300 hover:bg-white/10"
              : "bg-white/75 text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-white"
          }`}
          aria-label={lo ? "Switch to English" : "ປ່ຽນເປັນພາສາລາວ"}
        >
          <Globe2 className="h-4 w-4 text-adv-orange" />
          {lo ? "ລາວ" : "EN"}
        </button>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-7xl items-center gap-10 px-5 pb-10 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:pb-20">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <Link to="/" className="inline-flex">
            <img
              src="/pasopkan_logo.png"
              alt="Pasopkan"
              className="h-28 w-auto object-contain"
            />
          </Link>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            <Sparkles className="h-4 w-4" />
            {lo
              ? "ປະສົບການດີໆ ເລີ່ມຕົ້ນທີ່ນີ້"
              : "Great experiences start here"}
          </div>
          <h1
            className={`mt-6 max-w-2xl text-5xl font-black leading-[1.13] tracking-[-0.045em] xl:text-6xl ${dark ? "text-white" : "text-slate-950"}`}
          >
            {lo
              ? "ຄົ້ນພົບການຈອງປີ້ ແລະ ສ້າງຄວາມຊົງຈຳ"
              : "Discover, book, and make memories."}
          </h1>
          <p
            className={`mt-6 max-w-xl text-lg leading-8 ${dark ? "text-zinc-400" : "text-slate-600"}`}
          >
            {lo
              ? "ລວມກິດຈະກຳງານບຸນ ແລະ ປະສົບການທີ່ໜ້າຈົດຈຳທົ່ວປະເທດລາວ ໄວ້ໃນບ່ອນດຽວ."
              : "Events, festivals, and memorable experiences across Laos—carefully gathered in one place."}
          </p>
          <div className="mt-9 grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              [TicketCheck, lo ? "ປີ້ດິຈິຕອນ" : "Digital tickets"],
              [ShieldCheck, lo ? "ປອດໄພ" : "Secure access"],
              [CheckCircle2, lo ? "ໃຊ້ງານງ່າຍ" : "Easy booking"],
            ].map(([Icon, label]) => (
              <div
                key={String(label)}
                className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/[0.035]" : "border-white bg-white/70 shadow-sm"}`}
              >
                <Icon className="h-5 w-5 text-adv-orange" />
                <p
                  className={`mt-3 text-sm font-bold ${dark ? "text-zinc-200" : "text-slate-800"}`}
                >
                  {label as string}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={`mx-auto w-full max-w-124 overflow-hidden rounded-4xl border p-6 shadow-2xl sm:p-9 ${
            dark
              ? "border-white/10 bg-zinc-900/85 shadow-black/30 backdrop-blur-xl"
              : "border-white/90 bg-white/90 shadow-orange-950/10 backdrop-blur-xl"
          }`}
        >
          <div className="mb-7 flex justify-center lg:hidden">
            <Link to="/">
              <img
                src="/pasopkan_logo.png"
                alt="Pasopkan"
                className="h-24 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {/* <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                dark
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {lo ? "ປອດໄພດ້ວຍ Supabase" : "Secured by Supabase"}
            </span> */}
          </div>

          <h2
            className={`mt-7 text-3xl font-black tracking-[-0.035em] sm:text-4xl ${dark ? "text-white!" : "text-slate-950!"}`}
          >
            {copy.title}
          </h2>
          <p
            className={`mt-3 text-sm leading-6 sm:text-base ${dark ? "text-zinc-400" : "text-slate-500"}`}
          >
            {copy.subtitle}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700"
            >
              {error}
            </motion.div>
          )}

          <div
            role="tablist"
            aria-label={lo ? "ວິທີເຂົ້າລະບົບ" : "Sign-in method"}
            className={`mt-7 grid grid-cols-2 gap-1 rounded-2xl p-1 ${dark ? "bg-black/25" : "bg-slate-100"}`}
          >
            {([
              ["google", GoogleMark, lo ? "Google" : "Google"],
              ["phone", Phone, lo ? "ເບີໂທ" : "Phone"],
            ] as const).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={method === value}
                disabled={busy}
                onClick={() => selectMethod(value)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-all ${
                  method === value
                    ? dark
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm"
                    : dark
                      ? "text-zinc-500 hover:text-zinc-300"
                      : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className={value === "phone" ? "h-4 w-4 text-adv-orange" : undefined} />
                {label}
              </button>
            ))}
          </div>

          {method === "google" ? (
            <button
              type="button"
              disabled={busy}
              onClick={signIn}
              className={`group mt-5 flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${
                dark
                  ? "border-white/10 bg-white text-slate-900 hover:bg-zinc-100"
                  : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              }`}
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin text-adv-orange" />
              ) : (
                <GoogleMark />
              )}
              <span>
                {busy ? (lo ? "ກຳລັງເຊື່ອມຕໍ່…" : "Connecting…") : copy.button}
              </span>
            </button>
          ) : phoneStep === "phone" ? (
            <form
              className="mt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void sendOtp();
              }}
            >
              <label
                htmlFor="phone"
                className={`mb-2 block text-sm font-bold ${dark ? "text-zinc-200" : "text-slate-700"}`}
              >
                {lo ? "ເບີໂທລະສັບ" : "Mobile number"}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-adv-orange" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  disabled={busy}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="020 5555 5555"
                  className={`w-full rounded-2xl border py-4 pl-12 pr-4 text-base font-semibold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 ${
                    dark
                      ? "border-white/10 bg-black/20 text-white placeholder:text-zinc-600"
                      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !phone.trim()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                {busy
                  ? lo
                    ? "ກຳລັງສົ່ງ…"
                    : "Sending…"
                  : lo
                    ? "ສົ່ງລະຫັດ OTP"
                    : "Send OTP"}
              </button>
            </form>
          ) : (
            <form
              className="mt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void verifyOtp();
              }}
            >
              <div className={`rounded-2xl px-4 py-3 text-center text-sm ${dark ? "bg-black/20 text-zinc-300" : "bg-orange-50 text-slate-600"}`}>
                {lo ? "ສົ່ງ OTP ໄປທີ່" : "OTP sent to"}{" "}
                <strong className={dark ? "text-white" : "text-slate-900"}>{displayLaoPhone(phone)}</strong>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPhoneStep("phone");
                    setOtp("");
                    setError("");
                  }}
                  className="ml-2 font-bold text-adv-orange hover:text-orange-600"
                >
                  {lo ? "ແກ້ໄຂ" : "Edit"}
                </button>
              </div>
              <OtpInput value={otp} onChange={setOtp} error={Boolean(error)} />
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {busy
                  ? lo
                    ? "ກຳລັງກວດສອບ…"
                    : "Verifying…"
                  : lo
                    ? "ຢືນຢັນ ແລະເຂົ້າລະບົບ"
                    : "Verify and sign in"}
              </button>
              <button
                type="button"
                disabled={busy || cooldown > 0}
                onClick={() => void sendOtp()}
                className={`mt-3 flex w-full items-center justify-center gap-2 py-2 text-xs font-bold transition disabled:cursor-not-allowed ${
                  dark ? "text-zinc-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {cooldown > 0
                  ? lo
                    ? `ສົ່ງຄືນໄດ້ໃນ ${cooldown} ວິນາທີ`
                    : `Resend in ${cooldown}s`
                  : lo
                    ? "ສົ່ງ OTP ອີກຄັ້ງ"
                    : "Resend OTP"}
              </button>
            </form>
          )}

          <div
            className={`mt-6 flex items-start gap-3 rounded-2xl px-4 py-3.5 ${dark ? "bg-white/[0.035]" : "bg-slate-50"}`}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <p className={`text-xs leading-5 ${dark ? "text-zinc-400" : "text-slate-500"}`}>
              {method === "phone"
                ? lo
                  ? "OTP ໃຊ້ໄດ້ຄັ້ງດຽວ. Pasopkan ບໍ່ເຄີຍຂໍລະຫັດນີ້ຜ່ານການໂທ."
                  : "Your OTP is single-use. Pasopkan will never ask for it by phone call."
                : lo
                  ? "Pasopkan ບໍ່ເຫັນ ຫຼືເກັບລະຫັດຜ່ານ Google ຂອງທ່ານ."
                  : "Pasopkan never sees or stores your Google password."}
            </p>
          </div>

          <p
            className={`mt-7 text-center text-xs leading-5 ${dark ? "text-zinc-500" : "text-slate-500"}`}
          >
            {lo
              ? "ການສືບຕໍ່ໝາຍເຖິງທ່ານຍອມຮັບ"
              : "By continuing, you agree to our"}{" "}
            <Link
              to="/terms"
              className="font-semibold text-adv-orange underline decoration-orange-300 underline-offset-4 hover:text-orange-600"
            >
              {lo ? "ຂໍ້ກຳນົດ" : "Terms"}
            </Link>{" "}
            {lo ? "ແລະ" : "and"}{" "}
            <Link
              to="/privacy"
              className="font-semibold text-adv-orange underline decoration-orange-300 underline-offset-4 hover:text-orange-600"
            >
              {lo ? "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ" : "Privacy Policy"}
            </Link>
          </p>

          <div
            className={`mt-8 border-t pt-5 text-center text-sm ${dark ? "border-white/10 text-zinc-400" : "border-slate-100 text-slate-500"}`}
          >
            {registering
              ? lo
                ? "ມີບັນຊີແລ້ວ?"
                : "Already have an account?"
              : lo
                ? "ຍັງບໍ່ມີບັນຊີ?"
                : "New to Pasopkan?"}{" "}
            <Link
              to={registering ? "/login" : "/register"}
              className="font-bold text-adv-orange hover:text-orange-600"
            >
              {registering
                ? lo
                  ? "ເຂົ້າລະບົບ"
                  : "Sign in"
                : lo
                  ? "ສ້າງບັນຊີ"
                  : "Create account"}
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
