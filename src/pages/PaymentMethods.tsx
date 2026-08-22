import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  Building,
  User,
  Hash,
  Edit2,
  Save,
  Plus,
  Shield,
  Clock,
  AlertTriangle,
  X,
  Download,
  FileText,
  Search,
  ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLanguage } from '../LanguageContext';

const translations = {
  en: {
    backToAccount: 'Back to Account',
    payoutSettings: 'Payout Settings',
    cashOutAccount: 'Cash Out Account',
    payoutDesc: 'Bank account for receiving event payouts',
    bankName: 'Bank Name',
    bankPlaceholder: 'e.g. BCEL Lao',
    accountName: 'Account Holder Name',
    accountPlaceholder: 'e.g. Somsack Xayarath',
    accountNumber: 'Account Number',
    numberPlaceholder: 'e.g. 120-11-00-1234567-001',
    saveBankDetails: 'Save Bank Details',
    cancel: 'Cancel',
    activePayout: 'Active Payout Account',
    bankInstitution: 'Bank Institution',
    accountHolder: 'Account Holder',
    noPayoutAccount: 'No Payout Account Set',
    noPayoutDesc: "You haven't linked a bank account yet. You'll need this to receive funds from your ticket sales.",
    linkBankAccount: 'Link Bank Account',
    connected: 'Connected',
    payoutUpdated: 'Payout account updated',
    changesSaved: 'Changes saved successfully',
    edit: 'Edit / Change Bank',
    selectBank: 'Select Bank',
    otherBank: 'Other Bank...',
    securityNoticeTitle: 'Are you sure you want to change payout details?',
    securityNoticeDesc: 'To protect your earnings, changing your payout bank account triggers a strict 24-hour verification hold. Payouts to the new account will be pending during this period.',
    securityNoticeProceed: 'I Understand, Proceed',
    securityNotice: '24-Hour Security Hold Alert',
    payoutOnHold: '24h Security Hold Active',
    payoutOnHoldDesc: 'Your new payout account is undergoing security review. Payouts will resume after 24 hours.',
    transactionHistory: 'Payout History',
    historyDesc: 'View and export your past ticket sale payouts.',
    date: 'Date',
    reference: 'Payout Ref',
    event: 'Event',
    amount: 'Amount',
    status: 'Status',
    exportCsv: 'CSV',
    exportPdf: 'PDF',
    statusCompleted: 'Completed',
    statusProcessing: 'Processing',
    noTransactions: 'No transaction history available yet.',
    currency: '₭',
    pdfTitle: 'PASOPKAN - PAYOUT TRANSACTION REPORT',
    pdfGeneratedAt: 'Generated on',
    pdfTotalAmount: 'Total Payout Amount',
    pdfTotalTransactions: 'Total Transactions',
    csvExportSuccess: 'Successfully exported payout history to CSV!',
    pdfExportSuccess: 'Successfully exported payout report to PDF!',
    searchPlaceholder: 'Search by ref or event...'
  },
  lo: {
    backToAccount: 'ກັບໄປຫາບັນຊີ',
    payoutSettings: 'ຕັ້ງຄ່າການຈ່າຍເງິນ',
    cashOutAccount: 'ບັນຊີຖອນເງິນ',
    payoutDesc: 'ບັນຊີທະນາຄານສຳລັບການຮັບເງິນຈາກກິດຈະກຳ',
    bankName: 'ຊື່ທະນາຄານ',
    bankPlaceholder: 'ຕົວຢ່າງ: BCEL Lao',
    accountName: 'ຊື່ເຈົ້າຂອງບັນຊີ',
    accountPlaceholder: 'ຕົວຢ່າງ: ສົມສັກ ໄຊຍະລາດ',
    accountNumber: 'ເລກບັນຊີ',
    numberPlaceholder: 'ຕົວຢ່າງ: 120-11-00-1234567-001',
    saveBankDetails: 'ບັນທຶກລາຍລະອຽດ',
    cancel: 'ຍົກເລີກ',
    activePayout: 'ບັນຊີການຈ່າຍເງິນທີ່ໃຊ້ງານຢູ່',
    bankInstitution: 'ສະຖາບັນທະນາຄານ',
    accountHolder: 'ເຈົ້າຂອງບັນຊີ',
    noPayoutAccount: 'ຍັງບໍ່ໄດ້ຕັ້ງຄ່າບັນຊີການຈ່າຍເງິນ',
    noPayoutDesc: 'ທ່ານຍັງບໍ່ໄດ້ເຊື່ອມຕໍ່ບັນຊີທະນາຄານເທື່ອ. ທ່ານຈະຕ້ອງໃຊ້ສິ່ງນີ້ເພື່ອຮັບເງິນຈາກການຂາຍປີ້ຂອງທ່ານ.',
    linkBankAccount: 'ເຊື່ອມຕໍ່ບັນຊີທະນາຄານ',
    connected: 'ເຊື່ອມຕໍ່ແລ້ວ',
    payoutUpdated: 'ອັບເດດບັນຊີການຈ່າຍເງິນແລ້ວ',
    changesSaved: 'ບັນທຶກການປ່ຽນແປງສຳເລັດແລ້ວ',
    edit: 'ແກ້ໄຂ / ປ່ຽນທະນາຄານ',
    selectBank: 'ເລືອກທະນາຄານ',
    otherBank: 'ທະນາຄານອື່ນໆ...',
    securityNoticeTitle: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການປ່ຽນລາຍລະອຽດການຮັບເງິນ?',
    securityNoticeDesc: 'ແກ້ໄຂບັນຊີທະນາຄານຮັບເງິນຂອງທ່ານຈະກະຕຸ້ນການຢຸດກວດສອບ 24 ຊົ່ວໂມງຢ່າງເຂັ້ມງວດ. ການຈ່າຍເງິນໄປຍັງບັນຊີໃໝ່ຈະຢູ່ໃນສະຖານະລໍຖ້າການກວດສອບໃນໄລຍະເວລານີ້.',
    securityNoticeProceed: 'ຂ້ອຍເຂົ້າໃຈແລ້ວ, ດຳເນີນການຕໍ່',
    securityNotice: 'ແຈ້ງເຕືອນການລະງັບເພື່ອຄວາມປອດໄພ 24ຊມ',
    payoutOnHold: 'ກຳລັງຢຸດເພື່ອກວດສອບຄວາມປອດໄພ 24ຊມ',
    payoutOnHoldDesc: 'ບັນຊີຮັບເງິນໃໝ່ຂອງທ່ານກຳລັງຢູ່ໃນການກວດສອບຄວາມປອດໄພ. ການຈ່າຍເງິນຈະກັບມາໃຊ້ງານໄດ້ຫຼັງຈາກ 24 ຊົ່ວໂມງ.',
    transactionHistory: 'ປະຫວັດການຮັບເງິນ',
    historyDesc: 'ເບິ່ງ ແລະ ສົ່ງອອກປະຫວັດການຈ່າຍເງິນຄ່າປີ້ຂອງທ່ານ.',
    date: 'ວັນທີ',
    reference: 'ເລກອ້າງອີງ',
    event: 'ກິດຈະກຳ',
    amount: 'ຈຳນວນເງິນ',
    status: 'ສະຖານະ',
    exportCsv: 'CSV',
    exportPdf: 'PDF',
    statusCompleted: 'ສຳເລັດແລ້ວ',
    statusProcessing: 'ກຳລັງດຳເນີນການ',
    noTransactions: 'ຍັງບໍ່ມີປະຫວັດທຸລະກຳເທື່ອ.',
    currency: '₭',
    pdfTitle: 'ບົດລາຍງານການຮັບເງິນ - ປະສົບການ (PASOPKAN)',
    pdfGeneratedAt: 'ອອກບົດລາຍງານເມື່ອ',
    pdfTotalAmount: 'ຍອດເງິນທັງໝົດ',
    pdfTotalTransactions: 'ທຸລະກຳທັງໝົດ',
    csvExportSuccess: 'ສົ່ງອອກປະຫວັດການຮັບເງິນເປັນ CSV ສຳເລັດແລ້ວ!',
    pdfExportSuccess: 'ສົ່ງອອກລາຍງານເປັນ PDF ສຳເລັດແລ້ວ!',
    searchPlaceholder: 'ຄົ້ນຫາການຮັບເງິນ...'
  }
};

const LAO_BANKS = [
  { id: 'bcel', name: 'BCEL Bank', label: 'BCEL One', badgeBg: 'bg-red-600', textColor: 'text-red-600', logo: '/BCEL.png' },
  { id: 'jdb', name: 'JDB Bank', label: 'JDB', badgeBg: 'bg-blue-600', textColor: 'text-blue-600', logo: '/JDB.png' },
  { id: 'ldb', name: 'LDB Bank', label: 'LDB', badgeBg: 'bg-emerald-600', textColor: 'text-emerald-600', logo: '/LDB.png' },
  { id: 'ibcool', name: 'Indochina Bank', label: 'IB Cool', badgeBg: 'bg-cyan-600', textColor: 'text-cyan-600', logo: '/IB.png' },
  { id: 'stb', name: 'ST Bank', label: 'STB', badgeBg: 'bg-purple-600', textColor: 'text-purple-600', logo: '/ST.png' }
];

const MOCK_PAYOUTS = [
  {
    id: 'TXN-98472-LA',
    date: '2026-07-01',
    event: 'Vang Vieng Music Festival 2026',
    amount: 15500000,
    status: 'Completed',
    account: 'BCEL *6701'
  },
  {
    id: 'TXN-47201-LA',
    date: '2026-06-18',
    event: 'That Luang Cultural Workshop',
    amount: 8200000,
    status: 'Completed',
    account: 'BCEL *6701'
  },
  {
    id: 'TXN-21049-LA',
    date: '2026-05-30',
    event: 'Luang Prabang Film & Food Experience',
    amount: 12400000,
    status: 'Completed',
    account: 'BCEL *6701'
  },
  {
    id: 'TXN-11590-LA',
    date: '2026-05-15',
    event: 'Kip Exchange Artisan Bazaar',
    amount: 3500000,
    status: 'Completed',
    account: 'BCEL *2209'
  }
];

interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isHoldActive, setIsHoldActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [payouts] = useState(MOCK_PAYOUTS);

  // Pre-populate realistic Lao bank account so user can immediately test changing/editing
  const [bankAccount, setBankAccount] = useState<BankAccount | null>({
    bankName: 'BCEL Bank',
    accountName: 'Somsack Xayarath',
    accountNumber: '120-11-00-1234567-001'
  });

  // Form state
  const [formData, setFormData] = useState<BankAccount>({
    bankName: 'BCEL Bank',
    accountName: 'Somsack Xayarath',
    accountNumber: '120-11-00-1234567-001'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isChanging = bankAccount !== null;
    setBankAccount(formData);
    setIsEditing(false);
    if (isChanging) {
      setIsHoldActive(true);
    }
    triggerSuccess(t.payoutUpdated);
  };

  const startEditing = () => {
    if (bankAccount) {
      setFormData(bankAccount);
      setShowWarningModal(true);
    } else {
      setIsEditing(true);
    }
  };

  const confirmStartEditing = () => {
    setShowWarningModal(false);
    setIsEditing(true);
  };

  const triggerSuccess = (msg: string) => {
    setToastMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleExportCsv = () => {
    const headers = lang === 'en' 
      ? ['Date', 'Payout Ref', 'Event', 'Account', 'Amount (LAK)', 'Status']
      : ['ວັນທີ', 'ເລກອ້າງອີງ', 'ກິດຈະກຳ', 'ບັນຊີ', 'ຈຳນວນເງິນ (ກີບ)', 'ສະຖານະ'];
      
    const rows = payouts.map(p => [
      p.date,
      p.id,
      p.event,
      p.account,
      p.amount.toString(),
      p.status === 'Completed' ? (lang === 'en' ? 'Completed' : 'ສຳເລັດແລ້ວ') : (lang === 'en' ? 'Processing' : 'ກຳລັງດຳເນີນການ')
    ]);

    const BOM = '\uFEFF'; 
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pasopkan_payouts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerSuccess(t.csvExportSuccess);
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Banner
      doc.setFillColor(30, 41, 59); // Tailwind text-adv-slate bg
      doc.rect(0, 0, 210, 40, 'F');

      // Brand Title
      doc.setTextColor(251, 146, 60); // Orange color
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('PASOPKAN', 15, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('PASOPKAN PAYOUT TRANSACTION STATEMENT', 15, 26);

      // Metadata
      doc.setTextColor(100, 116, 139); // Gray
      doc.setFontSize(9);
      doc.text(`Statement Generated: ${new Date().toLocaleString(lang === 'lo' ? 'lo-LA' : 'en-US')}`, 15, 52);
      
      if (bankAccount) {
        doc.text(`Active Payout Account: ${bankAccount.bankName} - ${bankAccount.accountNumber} (${bankAccount.accountName})`, 15, 57);
      }

      // Summary Stats Section
      const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
      
      doc.setDrawColor(241, 245, 249);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 64, 85, 20, 3, 3, 'FD');
      doc.roundedRect(110, 64, 85, 20, 3, 3, 'FD');

      // Left KPI
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('TOTAL PAYOUT AMOUNT', 20, 71);
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(`${totalAmount.toLocaleString()} KIP`, 20, 78);

      // Right KPI
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('TOTAL TRANSACTIONS', 115, 71);
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(`${payouts.length}`, 115, 78);

      // Table mapping (using English headers for standard PDF compatibility and perfect typography layout)
      const tableHeaders = [
        ['Date', 'Payout Ref', 'Event Description', 'Amount', 'Status']
      ];

      const tableRows = payouts.map(p => [
        p.date,
        p.id,
        p.event,
        `${p.amount.toLocaleString()} KIP`,
        p.status
      ]);

      (doc as any).autoTable({
        startY: 92,
        head: tableHeaders,
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [249, 115, 22], // Pasopkan Orange
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [51, 65, 85],
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 70 },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 25, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        margin: { left: 15, right: 15 }
      });

      // Save the generated document
      doc.save(`pasopkan_payouts_${new Date().toISOString().slice(0,10)}.pdf`);
      triggerSuccess(t.pdfExportSuccess);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const filteredPayouts = payouts.filter(p => 
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.event.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-2 sm:pt-3 pb-8 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-1">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.backToAccount}</span>
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-adv-orange shadow-xs shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-adv-slate">{t.payoutSettings}</h1>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {bankAccount && !isEditing ? (
            /* Active Bank Account View - Compact Redesign */
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const matchedBank = LAO_BANKS.find(b => 
                      b.name.toLowerCase() === bankAccount.bankName.toLowerCase() || 
                      b.label.toLowerCase() === bankAccount.bankName.toLowerCase() ||
                      bankAccount.bankName.toLowerCase().includes(b.id)
                    );
                    return matchedBank?.logo ? (
                      <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                        <img src={matchedBank.logo} alt={bankAccount.bankName} className="w-full h-full object-contain rounded-lg" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-adv-orange/10 text-adv-orange flex items-center justify-center font-black text-xs shrink-0 border border-adv-orange/20">
                        <Building className="w-4 h-4" />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-adv-slate">{bankAccount.bankName}</h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.connected}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startEditing}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-adv-orange border border-gray-150 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t.edit}</span>
                </button>
              </div>

              {isHoldActive && (
                <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-850 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-adv-orange shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-adv-orange leading-none">{t.payoutOnHold}</h4>
                    <p className="text-[11px] font-medium text-amber-800 mt-1">{t.payoutOnHoldDesc}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-0.5">{t.accountHolder}</span>
                  <span className="text-xs sm:text-sm font-bold text-adv-slate">{bankAccount.accountName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-0.5">{t.accountNumber}</span>
                  <span className="text-xs sm:text-sm font-bold text-adv-slate font-mono tracking-wide">{bankAccount.accountNumber}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Setup / Edit Form View - Compact Redesign with Quick Select Lao Banks */
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-base font-bold text-adv-slate">{t.cashOutAccount}</h2>
                  <p className="text-xs text-gray-400 font-medium">{t.payoutDesc}</p>
                </div>
                {bankAccount && isEditing && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {bankAccount && (
                <div className="mb-4 p-3 rounded-xl bg-orange-50/60 border border-orange-100 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-adv-orange shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-adv-slate">{t.securityNotice}</h4>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{t.securityNoticeDesc}</p>
                  </div>
                </div>
              )}

              {isEditing || !bankAccount ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Bank Dropdown Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">{t.selectBank}</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={formData.bankName || ""}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200/80 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>-- {t.selectBank} --</option>
                          {LAO_BANKS.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name} ({b.label})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">{t.accountName}</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          required
                          placeholder={t.accountPlaceholder}
                          value={formData.accountName || ""}
                          onChange={(e) => setFormData({...formData, accountName: e.target.value.replace(/[0-9]/g, '')})}
                          className="w-full bg-gray-50 border border-gray-200/80 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">{t.accountNumber}</label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          inputMode="numeric"
                          required
                          placeholder={t.numberPlaceholder}
                          value={formData.accountNumber || ""}
                          onChange={(e) => setFormData({...formData, accountNumber: e.target.value.replace(/\D/g, '')})}
                          className="w-full bg-gray-50 border border-gray-200/80 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      type="submit"
                      className="flex-1 bg-adv-slate text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-black transition-all cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {t.saveBankDetails}
                    </button>
                    {bankAccount && (
                      <button 
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Building className="w-6 h-6 text-gray-300 mb-2" />
                  <h3 className="text-xs font-bold text-adv-slate mb-1">{t.noPayoutAccount}</h3>
                  <p className="text-[11px] text-gray-400 font-medium text-center mb-4 max-w-xs">
                    {t.noPayoutDesc}
                  </p>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-1.5 bg-adv-orange text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-orange-600 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    {t.linkBankAccount}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payout Transaction History Section - Compact Redesign */}
        <div className="mt-6 bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div>
              <h2 className="text-base font-bold text-adv-slate flex items-center gap-1.5">
                <span>📜</span>
                {t.transactionHistory}
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">{t.historyDesc}</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={handleExportCsv}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 hover:border-adv-orange hover:bg-orange-50/20 text-gray-600 hover:text-adv-orange rounded-lg text-xs font-bold transition-all bg-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {t.exportCsv}
              </button>
              <button
                onClick={handleExportPdf}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 hover:border-adv-orange hover:bg-orange-50/20 text-gray-600 hover:text-adv-orange rounded-xl text-xs font-bold transition-all bg-white cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                {t.exportPdf}
              </button>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative mb-3 group">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-adv-orange transition-colors" />
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200/80 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-adv-slate focus:outline-none focus:ring-2 focus:ring-adv-orange focus:bg-white transition-all placeholder-gray-400"
            />
          </div>

          {/* Mobile Card List View (sm:hidden) */}
          <div className="sm:hidden space-y-2">
            {filteredPayouts.length > 0 ? (
              filteredPayouts.map((payout) => (
                <div 
                  key={payout.id} 
                  className="p-3 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-adv-slate">{payout.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      payout.status === 'Completed' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${payout.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {payout.status === 'Completed' ? t.statusCompleted : t.statusProcessing}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-gray-800 line-clamp-2">
                    {payout.event}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                    <span className="text-[11px] font-medium text-gray-400">{payout.date}</span>
                    <span className="font-black text-adv-slate font-mono">
                      {payout.amount.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{t.currency}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                {t.noTransactions}
              </div>
            )}
          </div>

          {/* Desktop Transactions Table (hidden sm:block) */}
          <div className="hidden sm:block border border-gray-150 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[540px]">
                <thead className="bg-gray-50/90 border-b border-gray-150">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.date}</th>
                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.reference}</th>
                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.event}</th>
                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">{t.amount}</th>
                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredPayouts.length > 0 ? (
                    filteredPayouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-3 py-2.5 text-xs font-bold text-gray-500 whitespace-nowrap">{payout.date}</td>
                        <td className="px-3 py-2.5 text-xs font-mono font-bold text-adv-slate whitespace-nowrap">{payout.id}</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-gray-700 max-w-[240px] truncate">{payout.event}</td>
                        <td className="px-3 py-2.5 text-xs font-black text-adv-slate text-right font-mono whitespace-nowrap">
                          {payout.amount.toLocaleString()} <span className="text-[10px] font-bold text-gray-400">{t.currency}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            payout.status === 'Completed' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${payout.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {payout.status === 'Completed' ? t.statusCompleted : t.statusProcessing}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-xs font-bold text-gray-400">
                        {t.noTransactions}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* 24-Hour Security Hold Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWarningModal(false)}
              className="absolute inset-0 bg-adv-slate/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-8"
            >
              <button 
                onClick={() => setShowWarningModal(false)}
                className="absolute right-6 top-6 p-2 text-gray-400 hover:text-adv-slate rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-[2rem] bg-amber-50 text-adv-orange flex items-center justify-center mb-6 border border-amber-100 shadow-sm">
                  <AlertTriangle className="w-8 h-8 animate-pulse text-adv-orange" />
                </div>

                <h3 className="text-lg font-black text-adv-slate uppercase tracking-tight leading-snug mb-3">
                  {t.securityNoticeTitle}
                </h3>
                
                <p className="text-gray-450 font-bold text-xs leading-relaxed mb-8 max-w-sm">
                  {t.securityNoticeDesc}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button 
                    type="button"
                    onClick={() => setShowWarningModal(false)}
                    className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="button"
                    onClick={confirmStartEditing}
                    className="flex-1 bg-adv-orange text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {t.securityNoticeProceed}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-adv-slate text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10"
          >
            <CheckCircle2 className="w-5 h-5 text-adv-orange" />
            {toastMessage || t.changesSaved}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
