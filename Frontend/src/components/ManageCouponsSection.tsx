import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Calendar, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Users, 
  User, 
  Mail, 
  Phone, 
  Search, 
  Download, 
  Clock, 
  Percent,
  ChevronRight,
  TrendingUp,
  Tag,
  Sliders,
  ShieldCheck,
  Save,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Coupon } from '../data/events';
import { safeStorage } from '../lib/storage';
import { formatToDDMMYYYY } from './DateInputDDMMYYYY';

export interface CouponRedemption {
  id: string;
  couponId: string;
  couponCode: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userAvatar?: string;
  orderId: string;
  tierName: string;
  discountSaved: number;
  totalPaid: number;
  usedAt: string; // ISO string
}

interface ManageCouponsSectionProps {
  eventId: string;
  coupons?: Coupon[];
  onUpdateCoupons: (updatedCoupons: Coupon[]) => void;
  theme?: 'light' | 'dark';
  lang?: 'en' | 'lo';
  currency?: string;
}

// Initial seed redemptions for sample events so organizers see realistic account usage
const INITIAL_MOCK_REDEMPTIONS: CouponRedemption[] = [
  {
    id: 'red_1',
    couponId: 'c1',
    couponCode: 'FESTIVAL20',
    eventId: '1',
    eventTitle: 'Vang Vieng Music Festival 2026',
    userId: 'usr_001',
    userName: 'Somchai Keomany',
    userEmail: 'somchai.k@gmail.com',
    userPhone: '+856 20 5541 8921',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    orderId: 'ORD-89214',
    tierName: '2x VIP Seating (Grandstand)',
    discountSaved: 399600,
    totalPaid: 1598400,
    usedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString()
  },
  {
    id: 'red_2',
    couponId: 'c1',
    couponCode: 'FESTIVAL20',
    eventId: '1',
    eventTitle: 'Vang Vieng Music Festival 2026',
    userId: 'usr_002',
    userName: 'Anousone Phommachanh',
    userEmail: 'anousone.p@outlook.com',
    userPhone: '+856 20 9988 2314',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop',
    orderId: 'ORD-89215',
    tierName: '1x VIP Seating (Grandstand)',
    discountSaved: 199800,
    totalPaid: 799200,
    usedAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
  },
  {
    id: 'red_3',
    couponId: 'c1',
    couponCode: 'FESTIVAL20',
    eventId: '1',
    eventTitle: 'Vang Vieng Music Festival 2026',
    userId: 'usr_003',
    userName: 'Kelly Vance',
    userEmail: 'kelly.vance@company.com',
    userPhone: '+856 20 7712 9081',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
    orderId: 'ORD-89219',
    tierName: '4x Ceremony Participation',
    discountSaved: 120000,
    totalPaid: 480000,
    usedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString()
  },
  {
    id: 'red_4',
    couponId: 'c2',
    couponCode: 'WELCOME50',
    eventId: '1',
    eventTitle: 'Vang Vieng Music Festival 2026',
    userId: 'usr_004',
    userName: 'Vilaphone Sengsouvanh',
    userEmail: 'vilaphone.s@gmail.com',
    userPhone: '+856 20 5234 1109',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    orderId: 'ORD-89301',
    tierName: '1x VIP Seating (Grandstand)',
    discountSaved: 50000,
    totalPaid: 949000,
    usedAt: new Date(Date.now() - 3600 * 1000 * 30).toISOString()
  },
  {
    id: 'red_5',
    couponId: 'c3',
    couponCode: 'DEV10',
    eventId: '2',
    eventTitle: 'AI Developer Summit 2026',
    userId: 'usr_005',
    userName: 'Sengphet Louangrath',
    userEmail: 'sengphet.dev@laotech.la',
    userPhone: '+856 20 2234 5678',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
    orderId: 'ORD-90112',
    tierName: '1x VIP Developer Pass',
    discountSaved: 300000,
    totalPaid: 2700000,
    usedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  }
];

export const ManageCouponsSection: React.FC<ManageCouponsSectionProps> = ({
  eventId,
  coupons = [],
  onUpdateCoupons,
  theme = 'light',
  lang = 'en',
  currency = '₭'
}) => {
  const [selectedCouponForDetails, setSelectedCouponForDetails] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>(() => {
    try {
      const stored = safeStorage.getItem('pasopkan_coupon_redemptions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_MOCK_REDEMPTIONS;
    } catch (e) {
      console.error('Error loading coupon redemptions:', e);
      return INITIAL_MOCK_REDEMPTIONS;
    }
  });

  // Seed storage once in effect if empty, avoiding side-effects during render
  useEffect(() => {
    try {
      const stored = safeStorage.getItem('pasopkan_coupon_redemptions');
      if (!stored) {
        safeStorage.setItem('pasopkan_coupon_redemptions', JSON.stringify(INITIAL_MOCK_REDEMPTIONS));
      }
    } catch (e) {}
  }, []);

  // Reload redemptions on focus or storage change
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = safeStorage.getItem('pasopkan_coupon_redemptions');
        if (stored) {
          setRedemptions(JSON.parse(stored));
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Only allow toggle Active / Paused status (silent without popup toast)
  const handleToggleStatus = (couponId: string) => {
    const updated = coupons.map(c => {
      if (String(c.id) === String(couponId)) {
        return { ...c, isActive: !c.isActive };
      }
      return c;
    });
    onUpdateCoupons(updated);
  };

  // Helper to get all redemptions for a specific coupon
  const getCouponRedemptions = (coupon: Coupon) => {
    const code = (coupon.code || '').trim().toUpperCase();
    const id = String(coupon.id);
    return redemptions.filter(r => {
      const matchEvent = String(r.eventId) === String(eventId);
      const matchCoupon = String(r.couponId) === id || r.couponCode.trim().toUpperCase() === code;
      return matchEvent && matchCoupon;
    });
  };

  // Export redemptions for selected coupon as CSV
  const handleExportCsv = (coupon: Coupon) => {
    const couponRedemptions = getCouponRedemptions(coupon);
    if (couponRedemptions.length === 0) return;

    const headers = ['Order ID', 'Account Name', 'Email', 'Phone', 'User ID', 'Ticket / Tier', 'Discount Saved', 'Total Paid', 'Date & Time'];
    const rows = couponRedemptions.map(r => [
      r.orderId,
      `"${r.userName.replace(/"/g, '""')}"`,
      r.userEmail,
      r.userPhone || '',
      r.userId,
      `"${r.tierName.replace(/"/g, '""')}"`,
      r.discountSaved,
      r.totalPaid,
      new Date(r.usedAt).toLocaleString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `coupon_${coupon.code}_users_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch (e) {
      return iso;
    }
  };

  // Redemptions for the open details modal
  const modalRedemptions = useMemo(() => {
    if (!selectedCouponForDetails) return [];
    const list = getCouponRedemptions(selectedCouponForDetails);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(r => 
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      (r.userPhone && r.userPhone.includes(q)) ||
      r.orderId.toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q)
    );
  }, [selectedCouponForDetails, redemptions, eventId, searchQuery]);

  const activeCouponsCount = coupons.filter(c => c.isActive).length;

  return (
    <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border transition-all ${
      theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
    }`}>
      {/* Header section - optimized for mobile with clear badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100/60 dark:border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <h4 className="text-sm sm:text-base font-black">
              {lang === 'lo' ? 'ຄູປອງ & ສ່ວນຫຼຸດ' : 'Coupons & Discounts'}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                coupons.length > 0
                  ? 'bg-orange-500/10 text-adv-orange border border-orange-500/20'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
              }`}>
                {coupons.length} {lang === 'lo' ? 'ລາຍການ' : 'Total'}
              </span>
              {coupons.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {activeCouponsCount} {lang === 'lo' ? 'ເປີດໃຊ້' : 'Active'}
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 font-medium">
            {lang === 'lo' 
              ? 'ຕິດຕາມການນຳໃຊ້ຄູປອງ, ເບິ່ງບັນຊີຜູ້ຊື້ທີ່ນຳໃຊ້ ແລະ ເປີດ/ປິດການໃຊ້ງານຄູປອງ.' 
              : 'Track redemptions, view attendee accounts who used each coupon, and toggle Active/Paused status.'}
          </p>
        </div>
      </div>

      {/* Coupons Content */}
      {coupons.length === 0 ? (
        <div className={`p-6 sm:p-8 text-center rounded-2xl border flex flex-col items-center justify-center ${
          theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-gray-50/70 border-gray-100'
        }`}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-500/10 text-adv-orange flex items-center justify-center mb-2.5 border border-orange-500/20">
            <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h5 className="text-xs sm:text-sm font-black text-adv-slate dark:text-white mb-1">
            {lang === 'lo' ? 'ບໍ່ມີຄູປອງສຳລັບກິດຈະກຳນີ້' : 'No coupons created for this event'}
          </h5>
          <p className="text-[11px] text-gray-400 font-medium max-w-md leading-relaxed">
            {lang === 'lo'
              ? 'ຄູປອງຈະຖືກສ້າງຂຶ້ນຕອນຕັ້ງຄ່າກິດຈະກຳໃນໜ້າສ້າງກິດຈະກຳ. ທ່ານສາມາດຕິດຕາມການນຳໃຊ້ ແລະ ປັບສະຖານະ (ເປີດ/ປິດ) ໄດ້ທີ່ນີ້.'
              : 'Coupons are created during event setup. Once created, you can track redemption history and toggle their Active/Paused status here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-3.5">
          {coupons.map((coupon, idx) => {
            const isPercent = coupon.type === 'percentage';
            const maxCapLabel = isPercent && coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0
              ? ` (Max ${Number(coupon.maxDiscountAmount).toLocaleString()} ${currency})`
              : '';
            const discountLabel = isPercent 
              ? `${coupon.discount}% OFF${maxCapLabel}`
              : `${Number(String(coupon.discount).replace(/,/g, '') || 0).toLocaleString()} ${currency} OFF`;

            const couponUsages = getCouponRedemptions(coupon);
            const usageCount = couponUsages.length;
            const maxUsesVal = coupon.maxUses;
            const totalSavedAmount = couponUsages.reduce((acc, curr) => acc + (curr.discountSaved || 0), 0);
            const usagePercentage = maxUsesVal && maxUsesVal > 0 ? Math.min(Math.round((usageCount / maxUsesVal) * 100), 100) : null;

            return (
              <div
                key={coupon.id || `coupon-${idx}`}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  coupon.isActive
                    ? theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-2xs'
                    : theme === 'dark'
                      ? 'bg-zinc-950/20 border-zinc-850 opacity-75'
                      : 'bg-gray-50/70 border-gray-150 opacity-80'
                }`}
              >
                {/* Top Row on Mobile & Desktop: Coupon Code, Discount Badge & Quick Active/Pause Switch */}
                <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-gray-100 dark:border-zinc-850">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    {/* Coupon Code Pill */}
                    <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-black tracking-wider uppercase flex items-center gap-1.5 shrink-0 shadow-2xs ${
                      coupon.isActive
                        ? 'bg-orange-500/10 border-orange-500/30 text-adv-orange'
                        : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400'
                    }`}>
                      <Ticket className="w-3.5 h-3.5 shrink-0" />
                      <span>{coupon.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        title={lang === 'lo' ? 'ຄັດລອກລະຫັດ' : 'Copy code'}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-0.5"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-adv-orange" />
                        )}
                      </button>
                    </div>

                    {/* Discount Label Badge */}
                    <span className="px-2 py-0.5 rounded-lg bg-adv-slate dark:bg-zinc-800 text-white text-[10px] sm:text-[11px] font-black">
                      {discountLabel}
                    </span>
                  </div>

                  {/* Active / Paused Quick Switch (Positioned at top right for easy thumb access on mobile) */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(String(coupon.id))}
                    title={coupon.isActive 
                      ? (lang === 'lo' ? 'ກົດເພື່ອປິດການໃຊ້ງານຊົ່ວຄາວ' : 'Click to Pause') 
                      : (lang === 'lo' ? 'ກົດເພື່ອເປີດການໃຊ້ງານ' : 'Click to Activate')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs ${
                      coupon.isActive
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${coupon.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="hidden xs:inline sm:inline">
                      {coupon.isActive 
                        ? (lang === 'lo' ? 'ເປີດໃຊ້ງານ' : 'Active') 
                        : (lang === 'lo' ? 'ປິດຊົ່ວຄາວ' : 'Paused')}
                    </span>
                  </button>
                </div>

                {/* Middle Info & Metrics: Usage, Total Saved & Date validity */}
                <div className="space-y-2 mb-3">
                  {/* Progress bar if limited uses */}
                  {usagePercentage !== null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                        <span>{lang === 'lo' ? 'ໂຄຕ້າການນຳໃຊ້' : 'Usage Limit'}</span>
                        <span className="font-mono font-bold text-adv-slate dark:text-white">
                          {usageCount} / {maxUsesVal} ({usagePercentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 60 ? 'bg-amber-500' : 'bg-adv-orange'
                          }`}
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Used count chip */}
                    <div className={`px-2.5 py-1 rounded-lg border text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shrink-0 ${
                      usageCount > 0
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400'
                    }`}>
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="whitespace-nowrap">
                        {lang === 'lo' ? 'ນຳໃຊ້ແລ້ວ: ' : 'Used: '}
                        <strong className="font-black">{usageCount}</strong>
                        {maxUsesVal ? ` / ${maxUsesVal} ${lang === 'lo' ? 'ຄັ້ງ' : 'uses'}` : ` ${lang === 'lo' ? 'ຄັ້ງ' : 'times'}`}
                      </span>
                    </div>

                    {/* Total Saved Amount chip */}
                    {usageCount > 0 && totalSavedAmount > 0 && (
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          {lang === 'lo' ? 'ປະຢັດທັງໝົດ: ' : 'Saved: '}
                          <strong className="font-black">{totalSavedAmount.toLocaleString()} {currency}</strong>
                        </span>
                      </div>
                    )}

                    {/* Validity Period */}
                    <div className="px-2.5 py-1 rounded-lg bg-gray-100/70 dark:bg-zinc-800/70 text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-medium flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3 h-3 text-adv-orange shrink-0" />
                      <span>
                        {coupon.validFrom || coupon.validUntil 
                          ? `${coupon.validFrom ? formatToDDMMYYYY(coupon.validFrom) : 'Now'} - ${coupon.validUntil ? formatToDDMMYYYY(coupon.validUntil) : 'Forever'}`
                          : (lang === 'lo' ? 'ບໍ່ມີກຳນົດໝົດອາຍຸ' : 'No expiration date')
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action on Mobile: Prominent View Accounts Button */}
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-850">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCouponForDetails(coupon);
                      setSearchQuery('');
                    }}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] min-h-[44px] ${
                      theme === 'dark'
                        ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-white shadow-2xs'
                        : 'bg-gray-100 hover:bg-gray-150 border-gray-200 text-adv-slate shadow-2xs'
                    }`}
                  >
                    <Users className="w-4 h-4 text-adv-orange shrink-0" />
                    <span>{lang === 'lo' ? 'ເບິ່ງລາຍຊື່ບັນຊີທີ່ນຳໃຊ້' : 'View Accounts Who Redeemed'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-adv-orange text-white text-[10px] font-black">
                      {usageCount}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto sm:ml-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Usage Details Modal / Mobile Bottom Sheet */}
      <AnimatePresence>
        {selectedCouponForDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] bg-black/75 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4"
            onClick={() => setSelectedCouponForDetails(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={`max-w-3xl w-full max-h-[88vh] sm:max-h-[90vh] flex flex-col rounded-t-[2rem] sm:rounded-3xl shadow-2xl border mx-auto overflow-hidden ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile Touch Drag Handle */}
              <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-750 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                        {lang === 'lo' ? 'ບັນຊີທີ່ນຳໃຊ້ຄູປອງ' : 'Coupon Redemptions'}
                      </h3>
                      <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-adv-orange">
                        {selectedCouponForDetails.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                      {lang === 'lo'
                        ? 'ລາຍຊື່ບັນຊີຜູ້ໃຊ້ທີ່ນຳໃຊ້ລະຫັດສ່ວນຫຼຸດນີ້ຕອນຊື້ປີ້'
                        : 'Verified user accounts who redeemed this code during ticket checkout'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCouponForDetails(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Metrics Bar on Mobile */}
              <div className={`grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:px-6 border-b shrink-0 ${
                theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-gray-50/70 border-gray-100'
              }`}>
                <div className="p-2.5 sm:p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-center sm:text-left">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate mb-0.5">
                    {lang === 'lo' ? 'ນຳໃຊ້ແລ້ວ' : 'Redeemed'}
                  </div>
                  <div className="text-sm sm:text-base font-black text-adv-slate dark:text-white">
                    {getCouponRedemptions(selectedCouponForDetails).length} {lang === 'lo' ? 'ຄັ້ງ' : 'uses'}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-center sm:text-left">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate mb-0.5">
                    {lang === 'lo' ? 'ສ່ວນຫຼຸດລວມ' : 'Total Saved'}
                  </div>
                  <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 truncate">
                    {getCouponRedemptions(selectedCouponForDetails)
                      .reduce((acc, curr) => acc + (curr.discountSaved || 0), 0)
                      .toLocaleString()} {currency}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-center sm:text-left">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate mb-0.5">
                    {lang === 'lo' ? 'ສະຖານະ' : 'Status'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedCouponForDetails.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-xs font-black truncate">
                      {selectedCouponForDetails.isActive 
                        ? (lang === 'lo' ? 'ເປີດໃຊ້' : 'Active') 
                        : (lang === 'lo' ? 'ປິດ' : 'Paused')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Search & Export Bar */}
              <div className="p-3 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'lo' ? 'ຄົ້ນຫາຊື່ບັນຊີ, ອີເມວ, ເບີໂທ...' : 'Search by account name, email, phone...'}
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-adv-orange/30 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-750 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {getCouponRedemptions(selectedCouponForDetails).length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleExportCsv(selectedCouponForDetails)}
                    className="px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-adv-orange border border-orange-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[38px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'lo' ? 'ດາວໂຫຼດ CSV' : 'Export CSV'}</span>
                  </button>
                )}
              </div>

              {/* Redemptions List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5">
                {modalRedemptions.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border flex flex-col items-center justify-center ${
                    theme === 'dark' ? 'bg-zinc-950/30 border-zinc-800' : 'bg-gray-50/50 border-gray-100'
                  }`}>
                    <Users className="w-10 h-10 text-gray-400 mb-2 stroke-[1.5]" />
                    <div className="text-xs sm:text-sm font-bold text-gray-500 dark:text-zinc-400 mb-1">
                      {searchQuery
                        ? (lang === 'lo' ? 'ບໍ່ພົບບັນຊີທີ່ກົງກັບການຄົ້ນຫາ' : 'No account matched your search filter')
                        : (lang === 'lo' ? 'ຍັງບໍ່ມີບັນຊີໃດນຳໃຊ້ຄູປອງນີ້ເທື່ອ' : 'No accounts have redeemed this coupon yet')}
                    </div>
                    <p className="text-[11px] text-gray-400 max-w-sm leading-relaxed">
                      {lang === 'lo'
                        ? 'ເມື່ອຜູ້ຊື້ປີ້ໃສ່ລະຫັດສ່ວນຫຼຸດນີ້ຕອນຊຳລະເງິນ, ຂໍ້ມູນບັນຊີ ແລະ ລາຍລະອຽດການສັ່ງຊື້ຈະສະແດງຢູ່ບ່ອນນີ້.'
                        : 'When attendees apply this coupon code at checkout, their account details and order records will appear here.'}
                    </p>
                  </div>
                ) : (
                  modalRedemptions.map((redemption) => (
                    <div
                      key={redemption.id}
                      className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                        theme === 'dark' ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Account Identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          {redemption.userAvatar ? (
                            <img
                              src={redemption.userAvatar}
                              alt={redemption.userName}
                              className="w-10 h-10 rounded-full object-cover border border-orange-500/20 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-adv-orange to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {redemption.userName ? redemption.userName.slice(0, 2).toUpperCase() : 'US'}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-xs sm:text-sm font-black text-adv-slate dark:text-white truncate">
                                {redemption.userName}
                              </h5>
                              <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 text-[9px] font-mono">
                                {redemption.orderId}
                              </span>
                            </div>

                            {/* Contact Links */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-gray-400 font-medium mt-0.5">
                              <a
                                href={`mailto:${redemption.userEmail}`}
                                className="flex items-center gap-1 hover:text-adv-orange transition-colors truncate"
                              >
                                <Mail className="w-3 h-3 text-adv-orange shrink-0" />
                                <span className="truncate">{redemption.userEmail}</span>
                              </a>
                              {redemption.userPhone && (
                                <a
                                  href={`tel:${redemption.userPhone}`}
                                  className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
                                >
                                  <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{redemption.userPhone}</span>
                                </a>
                              )}
                            </div>

                            <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-semibold pt-0.5">
                              <span className="text-adv-orange font-bold">{redemption.tierName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Financial and Time Details */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-zinc-800/80 shrink-0 text-right">
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              -{redemption.discountSaved.toLocaleString()} {currency}
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold">
                              {lang === 'lo' ? 'ຊຳລະ: ' : 'Paid: '}
                              <strong className="text-adv-slate dark:text-white">{redemption.totalPaid.toLocaleString()} {currency}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium sm:mt-1">
                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{formatDateTime(redemption.usedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer on Mobile */}
              <div className="p-3 sm:px-6 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-gray-50/50 dark:bg-zinc-950/30">
                <div className="text-xs text-gray-400 font-medium">
                  {lang === 'lo' ? 'ສະແດງ: ' : 'Showing: '}
                  <strong className="text-adv-slate dark:text-white">{modalRedemptions.length}</strong> {lang === 'lo' ? 'ບັນຊີ' : 'accounts'}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCouponForDetails(null)}
                  className="px-5 py-2 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer min-h-[38px]"
                >
                  {lang === 'lo' ? 'ປິດ' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageCouponsSection;
