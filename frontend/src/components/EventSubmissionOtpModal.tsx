import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { api } from "../lib/api";
import { isValidLaoMobilePhone, normalizeLaoPhone } from "../lib/phone";
import OtpInput from "./OtpInput";

type Proof = { challengeId: string; code: string };

/** A one-use OTP for submitting this event, separate from login and organizer enrollment. */
export default function EventSubmissionOtpModal({
  token,
  onClose,
  onConfirm,
}: {
  token: string;
  onClose: () => void;
  onConfirm: (proof: Proof) => Promise<boolean>;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [deliveryUncertain, setDeliveryUncertain] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(
      () => setCooldown((seconds) => seconds - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (busy || cooldown > 0) return;
    const normalized = normalizeLaoPhone(phone);
    if (!isValidLaoMobilePhone(normalized)) {
      setError(
        "ກະລຸນາໃສ່ເບີມືຖືລາວທີ່ຖືກຕ້ອງ / Enter a valid Lao mobile number",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.post<{
        challengeId: string;
        deliveryUncertain: boolean;
      }>(
        "/organizer/event-submission-otp",
        { phone: normalized },
        { token, throwOnError: true },
      );
      if (!response.data?.challengeId)
        throw new Error("Could not start OTP verification");
      setChallengeId(response.data.challengeId);
      setDeliveryUncertain(response.data.deliveryUncertain);
      setCode("");
      setCooldown(60);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (busy || !challengeId || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    try {
      const success = await onConfirm({ challengeId, code });
      if (!success)
        throw new Error(
          "Could not submit event. Check the form and OTP, then retry.",
        );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not submit event",
      );
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[300] grid place-items-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-submit-otp-title"
        className="relative w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
        >
          <X size={20} />
        </button>
        <ShieldCheck className="mb-4 text-orange-600" size={32} />
        <h2 id="event-submit-otp-title" className="text-xl font-bold">
          ຢືນຢັນກ່ອນສົ່ງ Event / Verify submission
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          ໃສ່ເບີມືຖືລາວເພື່ອຮັບ OTP ເມື່ອສົ່ງ Event. ຖ້າບັນຊີມີເບີທີ່ຢືນຢັນແລ້ວ
          ຕ້ອງໃຊ້ເບີນັ້ນ. ລະຫັດໃຊ້ໄດ້ຄັ້ງດຽວ ແລະໝົດອາຍຸໃນ 5 ນາທີ.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <form onSubmit={(event) => void send(event)} className="mt-5 space-y-3">
          <label
            htmlFor="submission-phone"
            className="block text-sm font-semibold"
          >
            ເບີໂທ / Lao mobile number
          </label>
          <input
            id="submission-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setChallengeId("");
              setCode("");
              setDeliveryUncertain(false);
            }}
            placeholder="020 XXXXXXXX"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
          <button
            type="submit"
            disabled={busy || cooldown > 0}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {cooldown ? `ສົ່ງອີກໃນ ${cooldown} ວິນາທີ` : "ສົ່ງ OTP / Send code"}
          </button>
        </form>
        {deliveryUncertain && (
          <p
            role="status"
            className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
          >
            SMS gateway ຍັງບໍ່ຢືນຢັນຜົນ. ຖ້າໄດ້ຮັບລະຫັດ ໃຫ້ປ້ອນດ້ານລຸ່ມ;
            ຢ່າກົດສົ່ງຊ້ຳທັນທີ.
          </p>
        )}
        {challengeId && (
          <form
            onSubmit={(event) => void confirm(event)}
            className="mt-6 space-y-4 border-t pt-5"
          >
            <label className="block text-sm font-semibold">
              ລະຫັດ OTP 6 ຫຼັກ
            </label>
            <OtpInput value={code} onChange={setCode} error={Boolean(error)} />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}ຢືນຢັນ ແລະ
              ສົ່ງໃຫ້ Admin ກວດ
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
