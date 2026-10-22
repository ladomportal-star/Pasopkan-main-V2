import { useState } from "react";
import { Link2, Mail, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { normalizeLaoPhone, isValidLaoMobilePhone } from "../lib/phone";
import { supabase } from "../lib/supabase";

export default function AccountIdentityLinks() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lo = lang === "lo";
  const identities = user?.identities ?? [];
  const hasGoogle = identities.some(
    (identity) => identity.provider === "google",
  );
  const hasPhone =
    identities.some((identity) => identity.provider === "phone") ||
    Boolean(user?.phone_confirmed_at);

  const linkGoogle = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/edit-profile` },
    });
    if (linkError) {
      setError(
        lo
          ? "Google ເຊື່ອມບໍ່ສຳເລັດ. ໃຫ້ເປີດ Manual Identity Linking ໃນ Supabase Auth Settings ແລະ ເພີ່ມ redirect URL."
          : "Could not link Google. Enable Manual Identity Linking in Supabase Auth settings and allow this Google redirect URL.",
      );
      setBusy(false);
    }
  };

  const sendPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeLaoPhone(phone);
    if (!isValidLaoMobilePhone(normalized)) {
      setError(
        lo
          ? "ກະລຸນາປ້ອນເບີໂທລາວໃຫ້ຖືກຕ້ອງ."
          : "Enter a valid Lao mobile number.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        phone: normalized,
      });
      if (updateError) throw updateError;
      setPhone(normalized);
      setAwaitingCode(true);
      setNotice(
        lo
          ? "ສົ່ງ OTP ແລ້ວ. ປ້ອນລະຫັດເພື່ອຢືນຢັນເບີ."
          : "OTP sent. Enter the code to verify and link this phone.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : lo
            ? "ສົ່ງ OTP ບໍ່ສຳເລັດ."
            : "Could not send OTP.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError(lo ? "ລະຫັດ OTP ຕ້ອງມີ 6 ຕົວເລກ." : "Enter the 6-digit OTP.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizeLaoPhone(phone),
        token: code,
        type: "phone_change",
      });
      if (verifyError) throw verifyError;
      setAwaitingCode(false);
      setCode("");
      setNotice(
        lo
          ? "ເຊື່ອມເບີໂທກັບບັນຊີສຳເລັດ."
          : "Phone number linked to this account.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : lo
            ? "ຢືນຢັນເບີໂທບໍ່ສຳເລັດ."
            : "Could not verify the phone number.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm"
      aria-labelledby="identity-links-title"
    >
      <div>
        <h2
          id="identity-links-title"
          className="text-lg font-bold text-adv-slate flex items-center gap-2"
        >
          <Link2 className="w-5 h-5 text-adv-orange" />
          {lo ? "ວິທີເຂົ້າລະບົບ" : "Sign-in methods"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {lo
            ? "ເຊື່ອມວິທີເຂົ້າລະບົບໄວ້ກັບ user ດຽວກັນ ເພື່ອໃຊ້ profile ດຽວກັນໃນເວັບ ແລະແອັບ."
            : "Link sign-in methods to this same user so web and app use one profile."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2 font-bold text-sm text-adv-slate">
            <Mail className="w-4 h-4 text-adv-orange" /> Google
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {hasGoogle
              ? lo
                ? "ເຊື່ອມແລ້ວ"
                : "Connected"
              : lo
                ? "ຍັງບໍ່ໄດ້ເຊື່ອມ"
                : "Not connected"}
          </p>
          {!hasGoogle && (
            <button
              type="button"
              onClick={linkGoogle}
              disabled={busy}
              className="mt-3 rounded-lg bg-white border px-3 py-2 text-xs font-bold disabled:opacity-60"
            >
              {lo ? "ເຊື່ອມ Google" : "Link Google"}
            </button>
          )}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2 font-bold text-sm text-adv-slate">
            <Phone className="w-4 h-4 text-adv-orange" />{" "}
            {lo ? "ເບີໂທ" : "Phone"}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {hasPhone
              ? lo
                ? "ຢືນຢັນແລ້ວ"
                : "Verified"
              : lo
                ? "ຍັງບໍ່ໄດ້ເຊື່ອມ"
                : "Not connected"}
          </p>
        </div>
      </div>

      {!hasPhone && !awaitingCode && (
        <form
          onSubmit={sendPhoneCode}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="020 XXXXXXXX"
            aria-label={lo ? "ເບີໂທ" : "Phone number"}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-adv-orange px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy
              ? lo
                ? "ກຳລັງສົ່ງ..."
                : "Sending..."
              : lo
                ? "ສົ່ງ OTP"
                : "Send OTP"}
          </button>
        </form>
      )}

      {!hasPhone && awaitingCode && (
        <form
          onSubmit={verifyPhoneCode}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={lo ? "OTP 6 ຕົວເລກ" : "6-digit OTP"}
            aria-label="OTP"
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-adv-orange px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy
              ? lo
                ? "ກຳລັງກວດສອບ..."
                : "Verifying..."
              : lo
                ? "ຢືນຢັນ"
                : "Verify"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="text-sm text-emerald-700 flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {notice}
        </p>
      )}
      <p className="text-xs text-gray-400">
        {lo
          ? "ຖ້າເບີໂທ ຫຼື Google identity ນີ້ຢູ່ກັບ user ອື່ນແລ້ວ ລະບົບຈະບໍ່ລວມບັນຊີອັດຕະໂນມັດ; ກະລຸນາຕິດຕໍ່ support ເພື່ອກວດຢືນຢັນ."
          : "If this phone or Google identity already belongs to a different user, it will not be auto-merged. Contact support for a verified account recovery."}
      </p>
    </section>
  );
}
