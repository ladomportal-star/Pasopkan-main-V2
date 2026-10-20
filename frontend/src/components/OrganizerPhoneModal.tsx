import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, ShieldCheck, Smartphone, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { isValidLaoMobilePhone, normalizeLaoPhone } from "../lib/phone";
import { supabase } from "../lib/supabase";
import OtpInput from "./OtpInput";

type Eligibility = {
  role: "user" | "organizer" | "admin";
  phoneVerified: boolean;
  phone: string | null;
  canCreateEvent: boolean;
};
type Application = {
  id: string;
  status: string;
  rejectionReason?: string | null;
};

const CreateEvent = lazy(() => import("../pages/CreateEvent"));

/** Verify a phone on the signed-in identity before continuing to Organizer approval. */
export default function OrganizerPhoneModal({
  onClose,
  onEligible,
}: {
  onClose: () => void;
  onEligible?: () => void;
}) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [phone, setPhone] = useState("");
  const [sentPhone, setSentPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const continueToEvent = useCallback(() => {
    if (onEligible) onEligible();
    else {
      onClose();
      navigate("/create?new=1");
    }
  }, [navigate, onClose, onEligible]);

  const refresh = useCallback(async () => {
    if (!token) throw new Error("Sign in before creating an event");
    const { data: sessionData } = await supabase.auth.getSession();
    const opts = {
      token: sessionData.session?.access_token ?? token,
      throwOnError: true,
    };
    const [access, ownApplications] = await Promise.all([
      api.get<Eligibility>("/organizer/eligibility", opts),
      api.get<{ applications: Application[] }>(
        "/organizer-applications/mine",
        opts,
      ),
    ]);
    if (!access.data) throw new Error("Could not check organizer status");
    setEligibility(access.data);
    setApplications(ownApplications.data?.applications ?? []);
    if (access.data.canCreateEvent) continueToEvent();
    return access.data;
  }, [token, continueToEvent]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!token || !user) {
      setChecking(false);
      return;
    }
    let active = true;
    refresh()
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Could not check organizer status",
          );
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [token, user?.id, refresh]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
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
      // updateUser links the number to the Google account; signInWithOtp may switch users.
      const { error: authError } = await supabase.auth.updateUser({
        phone: normalized,
      });
      if (authError) throw authError;
      setSentPhone(normalized);
      setCode("");
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send SMS OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (busy || !user || !sentPhone || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: sentPhone,
        token: code,
        type: "phone_change",
      });
      if (authError) throw authError;
      const { data, error: userError } = await supabase.auth.getUser();
      if (
        userError ||
        data.user?.id !== user.id ||
        data.user.phone !== sentPhone
      ) {
        throw new Error(
          "Phone was not verified on this account. Please contact support.",
        );
      }
      const updated = await refresh();
      if (!updated.phoneVerified)
        throw new Error("Phone confirmation is still pending. Please retry.");
      setCode("");
      setSentPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function apply(event: FormEvent) {
    event.preventDefault();
    if (busy || !eligibility?.phoneVerified || !token) return;
    setBusy(true);
    setError("");
    try {
      await api.post(
        "/organizer-applications",
        { name: name.trim(), description: description.trim() },
        { token, throwOnError: true },
      );
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit application",
      );
    } finally {
      setBusy(false);
    }
  }

  const latest = applications[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="organizer-phone-title"
        className="relative w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={19} />
        </button>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-600 shadow-sm">
          <ShieldCheck size={28} />
        </div>
        <h2
          id="organizer-phone-title"
          className="text-center text-xl font-bold"
        >
          {eligibility?.phoneVerified
            ? "ສະໝັກເປັນ Organizer"
            : sentPhone
              ? "ຢືນຢັນລະຫັດ OTP"
              : "ຢືນຢັນເບີໂທກ່ອນສ້າງກິດຈະກຳ"}
        </h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          {eligibility?.phoneVerified
            ? `ເບີໂທຢືນຢັນແລ້ວ: ${eligibility.phone ?? ""}. ຂັ້ນຕໍ່ໄປແມ່ນໃຫ້ PskAdmin ອະນຸມັດ.`
            : sentPhone
              ? `ປ້ອນລະຫັດ 6 ຫຼັກທີ່ສົ່ງໄປຫາ ${sentPhone}`
              : "ໃສ່ເບີມືຖືລາວຂອງທ່ານ ເພື່ອຮັບລະຫັດ OTP ຈິງທາງ SMS"}
        </p>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {checking ? (
          <div
            className="flex justify-center py-10"
            aria-label="Checking phone status"
          >
            <Loader2 className="animate-spin text-orange-600" />
          </div>
        ) : !user || !token ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className="mt-7 w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white"
          >
            ເຂົ້າລະບົບກ່ອນ / Sign in
          </button>
        ) : !eligibility ? (
          <button
            type="button"
            onClick={() => {
              setChecking(true);
              setError("");
              void refresh()
                .catch((err) => setError(String(err)))
                .finally(() => setChecking(false));
            }}
            className="mt-7 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
          >
            ລອງໃໝ່ / Retry
          </button>
        ) : eligibility.phoneVerified ? (
          <div className="mt-7 space-y-4">
            {latest?.status === "pending" ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                ຄຳຂໍ Organizer ກຳລັງລໍ PskAdmin ອະນຸມັດ. ຍັງສ້າງ Event ບໍ່ໄດ້.
              </p>
            ) : (
              <form
                onSubmit={(event) => void apply(event)}
                className="space-y-4"
              >
                {latest?.status === "rejected" && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    ຄຳຂໍເກົ່າຖືກປະຕິເສດ: {latest.rejectionReason}
                  </p>
                )}
                <label className="block text-sm font-semibold text-slate-700">
                  ຊື່ຜູ້ຈັດງານ / Organizer name
                  <input
                    required
                    maxLength={200}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-orange-500"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  ລາຍລະອຽດ / Description
                  <textarea
                    maxLength={5000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-orange-500"
                  />
                </label>
                <button
                  disabled={busy}
                  className="w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "ກຳລັງສົ່ງ…" : "ສົ່ງຄຳຂໍໃຫ້ PskAdmin / Submit"}
                </button>
              </form>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setChecking(true);
                setError("");
                void refresh()
                  .catch((err) => setError(String(err)))
                  .finally(() => setChecking(false));
              }}
              className="w-full text-sm font-semibold text-orange-700 underline disabled:opacity-50"
            >
              ກວດສະຖານະໃໝ່ / Refresh status
            </button>
          </div>
        ) : sentPhone ? (
          <form
            onSubmit={(event) => void verifyCode(event)}
            className="mt-7 space-y-5"
          >
            <label className="block text-sm font-semibold text-slate-700">
              ລະຫັດຢືນຢັນ OTP 6 ຫຼັກ
            </label>
            <OtpInput value={code} onChange={setCode} error={Boolean(error)} />
            <div className="text-center text-xs text-slate-500">
              {cooldown > 0 ? (
                `ສົ່ງລະຫັດໃໝ່ໄດ້ໃນ ${cooldown} ວິນາທີ`
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendCode()}
                  className="font-semibold text-orange-700 underline disabled:opacity-50"
                >
                  ສົ່ງລະຫັດໃໝ່ / Resend OTP
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSentPhone("");
                  setCode("");
                  setError("");
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-600"
              >
                <ArrowLeft size={16} /> ແກ້ເບີ
              </button>
              <button
                disabled={busy || !/^\d{6}$/.test(code)}
                className="flex flex-1 justify-center rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "ຢືນຢັນ & ສືບຕໍ່"
                )}
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(event) => void sendCode(event)}
            className="mt-7 space-y-4"
          >
            <label
              htmlFor="organizer-phone"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <Smartphone size={17} /> ເບີໂທມືຖື / Mobile number
            </label>
            <input
              id="organizer-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              autoFocus
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="020 XXXXXXXX"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <button
              disabled={busy || cooldown > 0}
              className="flex w-full justify-center rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="animate-spin" size={20} />
              ) : cooldown > 0 ? (
                `ສົ່ງອີກໃນ ${cooldown} ວິນາທີ`
              ) : (
                "ສົ່ງ OTP / Send code"
              )}
            </button>
          </form>
        )}
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          ຫຼັງຢືນຢັນເບີໂທ ຕ້ອງໄດ້ຮັບການອະນຸມັດຈາກ PskAdmin ກ່ອນສ້າງງານ
        </p>
      </motion.div>
    </motion.div>
  );
}

/** Check owner eligibility before mounting the editor or organizer enrollment UI. */
export function OrganizerCreateGate() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [gateState, setGateState] = useState<
    "checking" | "ready" | "onboarding" | "error"
  >("checking");
  const [checkedUid, setCheckedUid] = useState<string | null>(null);
  const [gateError, setGateError] = useState("");
  const [retry, setRetry] = useState(0);
  const close = useCallback(() => navigate("/"), [navigate]);
  const allow = useCallback(() => {
    setCheckedUid(user?.id ?? null);
    setGateState("ready");
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      setCheckedUid(null);
      setGateState("onboarding");
      return;
    }
    let active = true;
    setGateState("checking");
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const result = await api.get<Eligibility>("/organizer/eligibility", {
        token: sessionData.session?.access_token ?? token,
        throwOnError: true,
      });
      if (!result.data) throw new Error("Could not check organizer status");
      if (active) {
        setCheckedUid(user.id);
        setGateState(result.data.canCreateEvent ? "ready" : "onboarding");
      }
    })().catch((error) => {
      if (!active) return;
      setGateError(
        error instanceof Error
          ? error.message
          : "Could not check organizer status",
      );
      setCheckedUid(user.id);
      setGateState("error");
    });
    return () => {
      active = false;
    };
  }, [loading, token, user?.id, retry]);

  if (loading || gateState === "checking" || (user && checkedUid !== user.id))
    return (
      <main className="grid min-h-screen place-items-center">
        ກຳລັງກວດສອບສິດ…
      </main>
    );
  if (gateState === "error")
    return (
      <main className="grid min-h-screen place-items-center gap-4 p-6 text-center">
        <p role="alert">{gateError}</p>
        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white"
        >
          ລອງໃໝ່ / Retry
        </button>
      </main>
    );
  if (user && token && gateState === "ready") {
    return (
      <Suspense
        fallback={
          <main className="grid min-h-screen place-items-center">
            ກຳລັງໂຫຼດໜ້າສ້າງງານ…
          </main>
        }
      >
        <CreateEvent />
      </Suspense>
    );
  }
  return (
    <main className="min-h-screen bg-slate-50">
      <OrganizerPhoneModal onClose={close} onEligible={allow} />
    </main>
  );
}
