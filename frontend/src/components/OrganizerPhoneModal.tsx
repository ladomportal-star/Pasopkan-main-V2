import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const CreateEvent = lazy(() => import("../pages/CreateEvent"));

function SignInPrompt({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="organizer-signin-title"
        className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center text-slate-900 shadow-2xl sm:p-9"
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
        <h2 id="organizer-signin-title" className="text-xl font-bold">
          ເຂົ້າລະບົບກ່ອນສ້າງ Event
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          ຫຼັງເຂົ້າລະບົບ ທ່ານສາມາດສ້າງແລະບັນທຶກ Draft ໄດ້ທັນທີ.
          ການຢືນຢັນເບີໂທ ແລະການກວດອະນຸມັດຈະຢູ່ຂັ້ນສົ່ງເພື່ອເຜີຍແຜ່.
        </p>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/login");
          }}
          className="mt-7 w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white"
        >
          ເຂົ້າລະບົບ / Sign in
        </button>
      </motion.div>
    </motion.div>
  );
}

/** Provision an organizer workspace on demand; publication still requires review. */
export function OrganizerCreateGate() {
  const { user, token, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "error">("checking");
  const [checkedUid, setCheckedUid] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const close = useCallback(() => navigate("/"), [navigate]);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      setCheckedUid(null);
      setState("ready");
      return;
    }
    let active = true;
    setState("checking");
    void (async () => {
      await api.post<{ role: string; organizer: { id: string } }>(
        "/organizer/activate",
        {},
        { token, throwOnError: true },
      );
      await refreshProfile();
      if (active) {
        setCheckedUid(user.id);
        setState("ready");
      }
    })().catch((cause) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : "Could not prepare your Organizer profile.");
      setCheckedUid(user.id);
      setState("error");
    });
    return () => {
      active = false;
    };
  }, [loading, token, user?.id, retry, refreshProfile]);

  if (loading || state === "checking" || (user && checkedUid !== user.id))
    return (
      <main className="grid min-h-screen place-items-center gap-3">
        <Loader2 className="animate-spin text-orange-600" aria-hidden="true" />
        <span>ກຳລັງກຽມພື້ນທີ່ຜູ້ຈັດງານ…</span>
      </main>
    );

  if (!user || !token) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SignInPrompt onClose={close} />
      </main>
    );
  }

  if (state === "error")
    return (
      <main className="grid min-h-screen place-items-center gap-4 p-6 text-center">
        <p role="alert">{error}</p>
        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white"
        >
          ລອງໃໝ່ / Retry
        </button>
      </main>
    );

  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center">
          ກຳລັງໂຫຼດໜ້າສ້າງ Event…
        </main>
      }
    >
      <CreateEvent />
    </Suspense>
  );
}
