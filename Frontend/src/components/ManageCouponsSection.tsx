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

  // Export all redemptions for this event as CSV
  const handleExportAllCsv = () => {
    const eventRedemptions = redemptions.filter(r => String(r.eventId) === String(eventId));
    
    const headers = ['Coupon Code', 'Order ID', 'Account Name', 'Email', 'Phone', 'User ID', 'Ticket / Tier', 'Discount Saved', 'Total Paid', 'Date & Time'];
    
    const rows = eventRedemptions.map(r => [
      r.couponCode,
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
    link.setAttribute('download', `all_coupon_redemptions_${new Date().toISOString().slice(0,10)}.csv`);
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

  return (
    <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border transition-all ${
      theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
    }`}>
      {/* Header section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100/50 dark:border-zinc-800/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-orange-500/10 text-adv-orange border border-orange-500/20 flex items-center justify-center shrink-0">
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-sm sm:text-base font-bold">
              {lang === 'lo' ? 'ຄູປອງ & ສ່ວນຫຼຸດ' : 'Coupons & Discounts'}
            </h4>
          </div>
          <p className="text-[11px] text-gray-400 font-medium max-w-2xl">
            {lang === 'lo' 
              ? 'ຕິດຕາມການນຳໃຊ້ຄູປອງ, ເບິ່ງບັນຊີຜູ້ໃຊ້ທີ່ນຳໃຊ້ແລ້ວ ແລະ ເປີດ/ປິດການໃຊ້ງານຄູປອງ.' 
              : 'Track coupon usage, see which accounts used each coupon, and toggle Active or Paused status.'}
          </p>
        </div>

        {coupons.length > 0 && (
          <button
            type="button"
            onClick={handleExportAllCsv}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-[1.02] active:scale-[0.98] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-emerald-500/20 shadow-sm shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'lo' ? 'ສົ່ງອອກ Excel' : 'Export Excel'}</span>
          </button>
        )}
      </div>

      {/* Coupons Content */}
      {coupons.length === 0 ? (
        <div className={`p-8 text-center rounded-2xl border flex flex-col items-center justify-center ${
          theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-gray-50/70 border-gray-100'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-adv-orange flex items-center justify-center mb-3 border border-orange-500/20">
            <Ticket className="w-6 h-6" />
          </div>
          <h5 className="text-xs sm:text-sm font-bold text-adv-slate dark:text-white mb-1">
            {lang === 'lo' ? 'ບໍ່ມີຄູປອງສຳລັບກິດຈະກຳນີ້' : 'No coupons created for this event'}
          </h5>
          <p className="text-[11px] text-gray-400 font-medium max-w-md leading-relaxed">
            {lang === 'lo'
              ? 'ຄູປອງຈະຖືກສ້າງຂຶ້ນຕອນຕັ້ງຄ່າກິດຈະກຳໃນໜ້າສ້າງກິດຈະກຳ. ທ່ານສາມາດຕິດຕາມການນຳໃຊ້ ແລະ ປັບສະຖານະ (ເປີດ/ປິດ) ໄດ້ທີ່ນີ້.'
              : 'Coupons are created during event setup. Once created, you can track redemption history and toggle their Active/Paused status here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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

            return (
              <div
                key={coupon.id || `coupon-${idx}`}
                className={`p-3.5 sm:p-6 rounded-[1.5rem] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5 ${
                  coupon.isActive
                    ? theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-sm'
                    : theme === 'dark'
                      ? 'bg-zinc-950/20 border-zinc-850 opacity-75'
                      : 'bg-gray-50/70 border-gray-150 opacity-80'
                }`}
              >
                {/* Left side: Details, Code, Stats */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-col items-start gap-2.5">
                    <span className="text-xl sm:text-3xl font-black text-adv-slate dark:text-white leading-tight tracking-tight">
                      {discountLabel}
                    </span>
                    {/* Coupon Code Tag */}
                    <div className={`px-2 sm:px-3.5 py-1.5 rounded-xl border font-bold flex items-center justify-between sm:justify-start gap-2 shrink-0 ${
                      coupon.isActive
                        ? 'bg-orange-500/10 border-orange-500/30 text-adv-orange shadow-sm'
                        : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400'
                    }`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="font-mono font-black text-xs sm:text-base tracking-widest uppercase">
                          {coupon.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        title={lang === 'lo' ? 'ຄັດລອກລະຫັດ' : 'Copy code'}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 hover:text-adv-orange" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Usage Stats Pills */}
                  <div className={`flex flex-wrap items-center gap-1.5`}>
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

                      {usageCount > 0 && totalSavedAmount > 0 && (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span className="whitespace-nowrap">
                            {lang === 'lo' ? 'ປະຢັດທັງໝົດ: ' : 'Total Saved: '}
                            <strong className="font-black">{totalSavedAmount.toLocaleString()} {currency}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Date range */}
                    <p className="text-[10px] sm:text-xs text-gray-400 font-medium flex items-center gap-1 sm:gap-1.5 w-full whitespace-nowrap">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-adv-orange shrink-0" />
                      <span className="whitespace-nowrap tracking-tight">
                        {coupon.validFrom && coupon.validUntil 
                          ? `${formatToDDMMYYYY(coupon.validFrom)} - ${formatToDDMMYYYY(coupon.validUntil)}`
                          : (lang === 'lo' ? 'ບໍ່ມີກຳນົດໝົດອາຍຸ' : 'No expiration date')}
                      </span>
                    </p>
                  </div>

                {/* Right side: Action Controls (Only Status Toggle & View Accounts) */}
                <div className="flex flex-row sm:flex-col items-center sm:justify-center sm:items-end gap-2 sm:gap-2.5 shrink-0 w-full sm:w-[150px] lg:w-[180px] pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-zinc-800/80">
                  {/* View Details / Who Used Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCouponForDetails(coupon);
                      setSearchQuery('');
                    }}
                    className={`flex-1 sm:flex-none px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center justify-center sm:justify-between gap-1 sm:gap-2 transition-all cursor-pointer shadow-xs w-full ${
                      theme === 'dark'
                        ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-adv-slate'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                      <span className="truncate">{lang === 'lo' ? 'ເບິ່ງລາຍລະອຽດຜູ້ໃຊ້' : 'View Accounts'}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </button>

                  {/* Active / Paused Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(String(coupon.id))}
                    title={coupon.isActive 
                      ? (lang === 'lo' ? 'ກົດເພື່ອປິດການໃຊ້ງານຊົ່ວຄາວ' : 'Click to Pause') 
                      : (lang === 'lo' ? 'ກົດເພື່ອເປີດການໃຊ້ງານ' : 'Click to Activate')}
                    className={`flex-1 sm:flex-none px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full ${
                      coupon.isActive
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-xs'
                        : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${coupon.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="truncate">
                      {coupon.isActive 
                        ? (lang === 'lo' ? 'ເປີດໃຊ້ງານ (Active)' : 'Active') 
                        : (lang === 'lo' ? 'ປິດຊົ່ວຄາວ (Paused)' : 'Paused')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Usage Details Modal ("Use by who know account") */}
      <AnimatePresence>
        {selectedCouponForDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => setSelectedCouponForDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-3xl w-full max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-adv-slate'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black tracking-tight">
                        {lang === 'lo' ? 'ລາຍລະອຽດບັນຊີທີ່ນຳໃຊ້ຄູປອງ' : 'Coupon Redemption Account Details'}
                      </h3>
                      <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-adv-orange">
                        {selectedCouponForDetails.code}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {lang === 'lo'
                        ? 'ລາຍຊື່ຜູ້ໃຊ້ ແລະ ບັນຊີທີ່ນຳໃຊ້ລະຫັດສ່ວນຫຼຸດນີ້ສຳລັບການຊື້ປີ້ກິດຈະກຳ'
                        : 'Verified user accounts who redeemed this coupon during ticket checkout'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCouponForDetails(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Metrics Bar */}
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 sm:px-6 border-b ${
                theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-gray-50/60 border-gray-100'
              } shrink-0`}>
                <div className="p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
                    {lang === 'lo' ? 'ນຳໃຊ້ແລ້ວທັງໝົດ' : 'Total Redemptions'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-adv-slate dark:text-white">
                    {getCouponRedemptions(selectedCouponForDetails).length} {lang === 'lo' ? 'ບັນຊີ' : 'accounts'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
                    {lang === 'lo' ? 'ມູນຄ່າສ່ວນຫຼຸດລວມ' : 'Total Discount Saved'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {getCouponRedemptions(selectedCouponForDetails)
                      .reduce((acc, curr) => acc + (curr.discountSaved || 0), 0)
                      .toLocaleString()} {currency}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
                    {lang === 'lo' ? 'ສະຖານະປັດຈຸບັນ' : 'Current Status'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedCouponForDetails.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-xs font-black">
                      {selectedCouponForDetails.isActive 
                        ? (lang === 'lo' ? 'ເປີດໃຊ້ງານ (Active)' : 'Active') 
                        : (lang === 'lo' ? 'ປິດຊົ່ວຄາວ (Paused)' : 'Paused')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Search & Export Bar */}
              <div className="p-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'lo' ? 'ຄົ້ນຫາຊື່ບັນຊີ, ອີເມວ, ເບີໂທລະສັບ...' : 'Search by account name, email, phone...'}
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-adv-orange/30 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-adv-slate'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Redemptions List Table / Cards */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
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
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        theme === 'dark' ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs'
                      }`}
                    >
                      {/* Account Profile Info */}
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

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-black text-adv-slate dark:text-white truncate">
                              {redemption.userName}
                            </h5>
                            <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 text-[9px] font-mono">
                              {redemption.orderId}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-gray-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-adv-orange shrink-0" />
                              <span className="truncate">{redemption.userEmail}</span>
                            </span>
                            {redemption.userPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>{redemption.userPhone}</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-gray-500 font-semibold pt-0.5">
                            <span className="text-adv-orange font-bold">{redemption.tierName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial & Timestamp Info */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-zinc-800/80 shrink-0 text-right">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            -{redemption.discountSaved.toLocaleString()} {currency}
                          </div>
                          <div className="text-[10px] text-gray-400 font-semibold">
                            {lang === 'lo' ? 'ຊຳລະແລ້ວ: ' : 'Paid: '}
                            <strong className="text-adv-slate dark:text-white">{redemption.totalPaid.toLocaleString()} {currency}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium sm:mt-1">
                          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{formatDateTime(redemption.usedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:px-6 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="text-xs text-gray-400 font-medium">
                  {lang === 'lo' ? 'ສະແດງທັງໝົດ: ' : 'Showing: '}
                  <strong className="text-adv-slate dark:text-white">{modalRedemptions.length}</strong> {lang === 'lo' ? 'ລາຍການ' : 'records'}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCouponForDetails(null)}
                  className="px-4 py-2 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  {lang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
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
