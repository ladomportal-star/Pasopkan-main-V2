import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, BellRing, Check, CircleX, Layers3, LoaderCircle,
  Mail, Save, ShieldCheck, Smartphone, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import { api } from '../lib/api';
import type { NotificationPreferences } from '../types';

const preferenceKeys = [
  'pushEnabled', 'emailEnabled', 'systemUpdatesEnabled',
  'eventStatusEnabled', 'refundsEnabled', 'payoutsEnabled',
] as const;

const copy = {
  en: {
    title: 'Notification Settings', subtitle: 'Manage how and which notifications you receive on Pasopkan.', back: 'Back to Account',
    channels: 'Notification channels', channelsDesc: 'Choose where you want to receive account updates.',
    push: 'Push Notifications', pushDesc: 'Receive notifications on this device when available.',
    email: 'Email Notifications', emailDesc: 'Receive account updates and important notices by email.',
    types: 'Types and content', typesDesc: 'Choose which account activity you want to hear about.',
    system: 'System updates and announcements', systemDesc: 'Service updates, announcements, and important information.',
    events: 'Event status', eventsDesc: 'Updates about event review, approval, and publishing.',
    refunds: 'Refunds and cancellations', refundsDesc: 'Updates about refund requests and cancelled orders.',
    payouts: 'Payouts', payoutsDesc: 'Updates about organizer payout processing.',
    save: 'Save changes', loading: 'Loading your notification settings…',
    loadError: 'Could not load notification settings from the server.', retry: 'Try again',
    saveError: 'Could not save your changes. Please try again.', saved: 'Notification settings saved.',
  },
  lo: {
    title: 'ຕັ້ງຄ່າການແຈ້ງເຕືອນ', subtitle: 'ຈັດການວິທີ ແລະ ເນື້ອຫາການແຈ້ງເຕືອນຂອງທ່ານໃນ Pasopkan.', back: 'ກັບຄືນໄປໜ້າບັນຊີ',
    channels: 'ຊ່ອງທາງການແຈ້ງເຕືອນ', channelsDesc: 'ເລືອກຊ່ອງທາງທີ່ຕ້ອງການຮັບຂ່າວສານ ແລະ ການແຈ້ງເຕືອນ.',
    push: 'ການແຈ້ງເຕືອນ Push', pushDesc: 'ຮັບການແຈ້ງເຕືອນໃນອຸປະກອນນີ້ ເມື່ອລະບົບຮອງຮັບ.',
    email: 'ການແຈ້ງເຕືອນຜ່ານ Email', emailDesc: 'ຮັບຂ່າວສານບັນຊີ ແລະ ຂໍ້ມູນສຳຄັນຜ່ານ Email.',
    types: 'ປະເພດ ແລະ ເນື້ອຫາການແຈ້ງເຕືອນ', typesDesc: 'ເລືອກກິດຈະກຳບັນຊີທີ່ຕ້ອງການຮັບຂ່າວສານ.',
    system: 'ອັບເດດລະບົບ ແລະ ປະກາດ', systemDesc: 'ອັບເດດບໍລິການ, ປະກາດ ແລະ ຂໍ້ມູນສຳຄັນ.',
    events: 'ສະຖານະກິດຈະກຳ', eventsDesc: 'ອັບເດດການກວດສອບ, ອະນຸມັດ ແລະ ເຜີຍແຜ່ກິດຈະກຳ.',
    refunds: 'ການຄືນເງິນ ແລະ ການຍົກເລີກ', refundsDesc: 'ອັບເດດຄຳຂໍຄືນເງິນ ແລະ ລາຍການສັ່ງຊື້ທີ່ຍົກເລີກ.',
    payouts: 'ການຈ່າຍເງິນ (Payout)', payoutsDesc: 'ອັບເດດການດຳເນີນການຈ່າຍເງິນໃຫ້ຜູ້ຈັດງານ.',
    save: 'ບັນທຶກການຕັ້ງຄ່າ', loading: 'ກຳລັງໂຫຼດຄ່າການແຈ້ງເຕືອນ…',
    loadError: 'ໂຫຼດຄ່າການແຈ້ງເຕືອນຈາກ Server ບໍ່ສຳເລັດ.', retry: 'ລອງອີກຄັ້ງ',
    saveError: 'ບັນທຶກບໍ່ສຳເລັດ. ກະລຸນາລອງອີກຄັ້ງ.', saved: 'ບັນທຶກຄ່າການແຈ້ງເຕືອນແລ້ວ.',
  },
};

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { lang } = useLanguage();
  const t = copy[lang === 'lo' ? 'lo' : 'en'];
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    const result = await api.getNotificationPreferences({ token, signal });
    if (signal?.aborted) return;
    if (!result.ok || !result.data?.preferences) {
      setPreferences(null);
      setLoadError(true);
    } else {
      setPreferences(result.data.preferences);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const toggle = (key: typeof preferenceKeys[number]) => {
    setPreferences((current) => current ? { ...current, [key]: !current[key] } : current);
  };

  const save = async () => {
    if (!preferences || saving) return;
    setSaving(true);
    setFeedback(null);
    const values = Object.fromEntries(preferenceKeys.map((key) => [key, preferences[key]])) as Omit<NotificationPreferences, 'updatedAt'>;
    const result = await api.saveNotificationPreferences(values, { token });
    if (result.ok && result.data?.preferences) {
      setPreferences(result.data.preferences);
      setFeedback({ message: t.saved, error: false });
    } else {
      setFeedback({ message: result.error || t.saveError, error: true });
    }
    setSaving(false);
  };

  const rows = [
    { key: 'pushEnabled', title: t.push, description: t.pushDesc, icon: Smartphone, tone: 'text-orange-500 bg-orange-50' },
    { key: 'emailEnabled', title: t.email, description: t.emailDesc, icon: Mail, tone: 'text-blue-500 bg-blue-50' },
  ] as const;
  const categoryRows = [
    { key: 'systemUpdatesEnabled', title: t.system, description: t.systemDesc, icon: Layers3, tone: 'text-purple-500 bg-purple-50' },
    { key: 'eventStatusEnabled', title: t.events, description: t.eventsDesc, icon: ShieldCheck, tone: 'text-emerald-500 bg-emerald-50' },
    { key: 'refundsEnabled', title: t.refunds, description: t.refundsDesc, icon: CircleX, tone: 'text-red-500 bg-red-50' },
    { key: 'payoutsEnabled', title: t.payouts, description: t.payoutsDesc, icon: Wallet, tone: 'text-teal-500 bg-teal-50' },
  ] as const;

  const renderRows = (items: typeof rows | typeof categoryRows) => items.map((row, index) => {
    const Icon = row.icon;
    const isEnabled = preferences?.[row.key] ?? false;
    return (
      <div key={row.key} className={`flex items-center gap-3 py-3.5 ${index ? 'border-t border-gray-100' : ''}`}>
        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${row.tone}`}><Icon className="w-[18px] h-[18px]" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{row.title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{row.description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          aria-label={row.title}
          disabled={loading || loadError || saving || !preferences}
          onClick={() => toggle(row.key)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isEnabled ? 'bg-[#ff5a00]' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] py-4 md:py-6">
      <SEO title={`${t.title} | Pasopkan`} description={t.title} noindex />
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
        <button onClick={() => navigate('/account')} className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />{t.back}
        </button>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-[#ff5a00] shadow-sm"><BellRing className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t.title}</h1>
            <p className="mt-0.5 text-xs text-slate-500">{t.subtitle}</p>
          </div>
        </div>

        {loadError ? (
          <div role="alert" className="rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <p className="mb-4 text-sm font-semibold text-slate-700">{t.loadError}</p>
            <button onClick={() => void load()} className="rounded-xl bg-[#ff5a00] px-5 py-2.5 text-sm font-bold text-white">{t.retry}</button>
          </div>
        ) : loading || !preferences ? (
          <div role="status" className="flex min-h-56 items-center justify-center gap-3 rounded-3xl border border-gray-100 bg-white text-sm font-semibold text-slate-500 shadow-sm">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#ff5a00]" />{t.loading}
          </div>
        ) : (
          <>
            <section className="mb-5 rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6">
              <div className="mb-2 flex items-center gap-3 border-b border-gray-100 pb-4">
                <Smartphone className="h-5 w-5 text-[#ff5a00]" />
                <div><h2 className="font-bold text-slate-900">{t.channels}</h2><p className="mt-0.5 text-xs text-slate-500">{t.channelsDesc}</p></div>
              </div>
              {renderRows(rows)}
            </section>
            <section className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6">
              <div className="mb-2 flex items-center gap-3 border-b border-gray-100 pb-4">
                <Layers3 className="h-5 w-5 text-[#ff5a00]" />
                <div><h2 className="font-bold text-slate-900">{t.types}</h2><p className="mt-0.5 text-xs text-slate-500">{t.typesDesc}</p></div>
              </div>
              {renderRows(categoryRows)}
            </section>
            <div className="mt-5 flex flex-col items-end gap-3">
              {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`flex items-center gap-2 text-sm ${feedback.error ? 'text-red-600' : 'text-emerald-700'}`}>
                {feedback.error ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}{feedback.message}
              </p>}
              <button onClick={() => void save()} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-[#ff5a00] px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600 disabled:opacity-60">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t.save}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
