import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  Plus,
  AlertCircle,
  FileText,
  DollarSign,
  Ticket,
  Calendar,
  Building2,
  User,
  CreditCard,
  Printer,
  ChevronRight,
  Info,
  ArrowUpDown,
  RefreshCw,
  Copy
} from 'lucide-react';
import { safeStorage } from '../lib/storage';

export interface RefundItem {
  id: string;
  ticketId: string;
  orderId?: string;
  eventId?: string | number;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  eventImage?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  tierName: string;
  quantity: number;
  amount: number; // In LAK
  requestDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  processedDate?: string;
  processedBy?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  notes?: string;
}

interface RefundsManagementTabProps {
  lang: 'en' | 'lo';
  t: Record<string, string>;
  addActivityLog?: (action: string, details: string) => void;
}

const STORAGE_KEY_REFUNDS = 'pasopkan_admin_refunds';
const STORAGE_KEY_USER_TICKETS = 'pasopkan_user_tickets';
const STORAGE_KEY_REFUNDED_IDS = 'pasopkan_refunded_tickets';

// Default initial mock refund requests for demonstration and testing
const defaultMockRefunds: RefundItem[] = [
  {
    id: 'REF-2026-1049',
    ticketId: 'TKT-2026-904',
    orderId: 'ORD-88190',
    eventId: 1,
    eventTitle: 'Underground Indie Fest Vientiane',
    eventDate: '2026-10-15',
    eventLocation: 'Lao-ITECC, Vientiane',
    eventImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    customerName: 'Somchai Phommavong',
    customerEmail: 'somchai.p@gmail.com',
    customerPhone: '+856 20 5512 3456',
    tierName: 'VIP Pass',
    quantity: 2,
    amount: 500000,
    requestDate: '2026-03-28 14:30',
    reason: 'Urgent business trip conflict on event weekend.',
    status: 'pending',
    bankName: 'BCEL (OnePay)',
    bankAccountName: 'SOMCHAI PHOMMAVONG',
    bankAccountNumber: '01012000889212001',
    notes: 'Customer contacted support asking for bank transfer back.'
  },
  {
    id: 'REF-2026-1055',
    ticketId: 'TKT-2026-950',
    orderId: 'ORD-88220',
    eventId: 2,
    eventTitle: 'Lao New Year Grand Water Music Festival',
    eventDate: '2026-04-14',
    eventLocation: 'Mekong Riverfront, Vientiane',
    eventImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    customerName: 'Anousone Keobounphanh',
    customerEmail: 'anousone.k@gmail.com',
    customerPhone: '+856 20 5432 1098',
    tierName: 'VIP Zone A',
    quantity: 1,
    amount: 350000,
    requestDate: '2026-03-29 09:15',
    reason: 'Family event rescheduled to another date.',
    status: 'pending',
    bankName: 'BCEL',
    bankAccountName: 'ANOUSONE KEOBOUNPHANH',
    bankAccountNumber: '01012000776655001',
    notes: 'Requested refund to BCEL account directly.'
  },
  {
    id: 'REF-2026-1038',
    ticketId: 'TKT-2026-812',
    orderId: 'ORD-88045',
    eventId: 2,
    eventTitle: 'Lao New Year Grand Water Music Festival',
    eventDate: '2026-04-14',
    eventLocation: 'Mekong Riverfront, Vientiane',
    eventImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    customerName: 'Alouny Sengsouly',
    customerEmail: 'alouny.seng@example.la',
    customerPhone: '+856 20 9988 7766',
    tierName: 'Early Bird General',
    quantity: 1,
    amount: 150000,
    requestDate: '2026-03-25 10:15',
    reason: 'Accidental double purchase through banking app.',
    status: 'approved',
    processedDate: '2026-03-26 09:00',
    processedBy: 'Admin (System)',
    bankName: 'JDB Bank',
    bankAccountName: 'ALOUNY SENGSOULY',
    bankAccountNumber: '1008020033441',
    notes: 'Verified duplicate transaction. Refund processed.'
  },
  {
    id: 'REF-2026-1022',
    ticketId: 'TKT-2026-701',
    orderId: 'ORD-87910',
    eventId: 3,
    eventTitle: 'Tech Startup & Innovation Meetup Laos',
    eventDate: '2026-04-02',
    eventLocation: 'Luang Prabang Cultural Hall',
    eventImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
    customerName: 'Khamla Vongsa',
    customerEmail: 'khamla.v@startup.la',
    customerPhone: '+856 20 7733 2211',
    tierName: 'Standard Entry',
    quantity: 1,
    amount: 100000,
    requestDate: '2026-03-20 18:40',
    reason: 'Unable to attend due to last-minute personal plan change.',
    status: 'rejected',
    rejectionReason: 'Request submitted after non-refundable cutoff policy (<48 hours to event).',
    processedDate: '2026-03-21 11:20',
    processedBy: 'Admin (Finance)',
    bankName: 'BCEL',
    bankAccountName: 'KHAMLA VONGSA',
    bankAccountNumber: '01011000778899',
    notes: 'Informed customer about organizer policy.'
  }
];

export default function RefundsManagementTab({ lang, t, addActivityLog }: RefundsManagementTabProps) {
  const [refunds, setRefunds] = useState<RefundItem[]>(() => {
    try {
      const stored = safeStorage.getItem(STORAGE_KEY_REFUNDS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored refunds:', e);
    }
    return defaultMockRefunds;
  });

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionInput, setRejectionInput] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk action states (Refund All & Reject All)
  const [selectedRefundIds, setSelectedRefundIds] = useState<string[]>([]);
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);
  const [bulkRejectionInput, setBulkRejectionInput] = useState('');
  const [bulkActionTarget, setBulkActionTarget] = useState<'all' | 'selected'>('all');

  // Manual refund form state
  const [manualTicketId, setManualTicketId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerEmail, setManualCustomerEmail] = useState('');
  const [manualEventTitle, setManualEventTitle] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualBankName, setManualBankName] = useState('BCEL');
  const [manualAccountName, setManualAccountName] = useState('');
  const [manualAccountNumber, setManualAccountNumber] = useState('');

  // Persist refunds whenever they change
  useEffect(() => {
    try {
      safeStorage.setItem(STORAGE_KEY_REFUNDS, JSON.stringify(refunds));
    } catch (e) {
      console.error('Failed to save refunds to storage:', e);
    }
  }, [refunds]);

  // Synchronize any tickets marked as 'refunded' from user dashboard into refunds table
  useEffect(() => {
    try {
      const userTicketsRaw = safeStorage.getItem(STORAGE_KEY_USER_TICKETS);
      const refundedIdsRaw = safeStorage.getItem(STORAGE_KEY_REFUNDED_IDS);
      
      const refundedIds: string[] = refundedIdsRaw ? JSON.parse(refundedIdsRaw) : [];
      const userTickets: any[] = userTicketsRaw ? JSON.parse(userTicketsRaw) : [];

      if (Array.isArray(userTickets)) {
        let hasNew = false;
        const currentIds = new Set(refunds.map(r => r.ticketId));

        const newFromTickets: RefundItem[] = [];

        userTickets.forEach((ticket) => {
          const isRefundedStatus = ticket.status === 'refunded' || refundedIds.includes(ticket.id);
          if (isRefundedStatus && !currentIds.has(ticket.id)) {
            hasNew = true;
            const price = Number(ticket.tier?.price) || 0;
            const qty = Number(ticket.quantity) || 1;
            newFromTickets.push({
              id: `REF-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
              ticketId: ticket.id,
              orderId: `ORD-${ticket.id.slice(-6).toUpperCase()}`,
              eventId: ticket.event?.id || 'live',
              eventTitle: ticket.event?.title || 'Purchased Event',
              eventDate: ticket.event?.date || ticket.bookingDate || '2026-04-01',
              eventLocation: ticket.event?.location || 'Vientiane',
              eventImage: ticket.event?.image || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop',
              customerName: ticket.customerName || 'Registered Customer',
              customerEmail: ticket.customerEmail || 'customer@pasopkan.com',
              customerPhone: ticket.customerPhone || '+856 20 5500 1122',
              tierName: ticket.tier?.name || 'General Admission',
              quantity: qty,
              amount: price * qty,
              requestDate: ticket.bookingDate || new Date().toISOString().replace('T', ' ').slice(0, 16),
              reason: 'Customer initiated refund from User Dashboard.',
              status: 'approved',
              processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
              processedBy: 'User Self-Service / Auto-Approved',
              bankName: 'BCEL One',
              bankAccountName: 'CUSTOMER ACCOUNT',
              bankAccountNumber: '010-XXXX-XXXX'
            });
          }
        });

        if (hasNew && newFromTickets.length > 0) {
          setRefunds(prev => [...newFromTickets, ...prev]);
        }
      }
    } catch (e) {
      console.warn('Error syncing customer tickets to refunds list:', e);
    }
  }, []);

  // Filtered list
  const filteredRefunds = useMemo(() => {
    return refunds.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesSearch =
        item.id.toLowerCase().includes(q) ||
        item.ticketId.toLowerCase().includes(q) ||
        (item.orderId && item.orderId.toLowerCase().includes(q)) ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerEmail.toLowerCase().includes(q) ||
        (item.customerPhone && item.customerPhone.toLowerCase().includes(q)) ||
        item.eventTitle.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [refunds, statusFilter, searchQuery]);

  // Counts & Stats
  const stats = useMemo(() => {
    const total = refunds.length;
    const pending = refunds.filter(r => r.status === 'pending').length;
    const approved = refunds.filter(r => r.status === 'approved').length;
    const rejected = refunds.filter(r => r.status === 'rejected').length;
    const totalAmount = refunds
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    return { total, pending, approved, rejected, totalAmount };
  }, [refunds]);

  // Approve a refund request
  const handleApproveRefund = (refundItem: RefundItem) => {
    const updatedRefunds = refunds.map((r) => {
      if (r.id === refundItem.id) {
        return {
          ...r,
          status: 'approved' as const,
          processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          processedBy: 'Admin (Manual Approval)'
        };
      }
      return r;
    });

    setRefunds(updatedRefunds);

    // Sync to user tickets and refunded tickets list
    try {
      // 1. Add to refunded tickets set
      const existingRefundedRaw = safeStorage.getItem(STORAGE_KEY_REFUNDED_IDS);
      const refundedList: string[] = existingRefundedRaw ? JSON.parse(existingRefundedRaw) : [];
      if (!refundedList.includes(refundItem.ticketId)) {
        refundedList.push(refundItem.ticketId);
        safeStorage.setItem(STORAGE_KEY_REFUNDED_IDS, JSON.stringify(refundedList));
      }

      // 2. Update user tickets
      const userTicketsRaw = safeStorage.getItem(STORAGE_KEY_USER_TICKETS);
      if (userTicketsRaw) {
        const tickets: any[] = JSON.parse(userTicketsRaw);
        const updatedUserTickets = tickets.map((t) => {
          if (t.id === refundItem.ticketId) {
            return { ...t, status: 'refunded' };
          }
          return t;
        });
        safeStorage.setItem(STORAGE_KEY_USER_TICKETS, JSON.stringify(updatedUserTickets));
      }
    } catch (e) {
      console.error('Failed to sync approved refund to storage:', e);
    }

    if (addActivityLog) {
      addActivityLog(
        'Refund Approved',
        `Approved refund ${refundItem.id} (${new Intl.NumberFormat('lo-LA').format(refundItem.amount)} ₭) for ${refundItem.customerName}`
      );
    }

    if (selectedRefund && selectedRefund.id === refundItem.id) {
      setSelectedRefund({
        ...selectedRefund,
        status: 'approved',
        processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        processedBy: 'Admin (Manual Approval)'
      });
    }
  };

  // Reject a refund request
  const handleConfirmReject = () => {
    if (!selectedRefund) return;

    const reason = rejectionInput.trim() || (lang === 'lo' ? 'ບໍ່ກົງກັບນະໂຍບາຍການຄືນເງິນ' : 'Does not comply with event refund policy');

    const updatedRefunds = refunds.map((r) => {
      if (r.id === selectedRefund.id) {
        return {
          ...r,
          status: 'rejected' as const,
          rejectionReason: reason,
          processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          processedBy: 'Admin (Rejected)'
        };
      }
      return r;
    });

    setRefunds(updatedRefunds);

    // Sync to user tickets: ensure ticket is NOT marked as refunded
    try {
      const existingRefundedRaw = safeStorage.getItem(STORAGE_KEY_REFUNDED_IDS);
      if (existingRefundedRaw) {
        const refundedList: string[] = JSON.parse(existingRefundedRaw);
        const filteredList = refundedList.filter(id => id !== selectedRefund.ticketId);
        safeStorage.setItem(STORAGE_KEY_REFUNDED_IDS, JSON.stringify(filteredList));
      }

      const userTicketsRaw = safeStorage.getItem(STORAGE_KEY_USER_TICKETS);
      if (userTicketsRaw) {
        const tickets: any[] = JSON.parse(userTicketsRaw);
        const updatedUserTickets = tickets.map((t) => {
          if (t.id === selectedRefund.ticketId && t.status === 'refunded') {
            return { ...t, status: 'upcoming' };
          }
          return t;
        });
        safeStorage.setItem(STORAGE_KEY_USER_TICKETS, JSON.stringify(updatedUserTickets));
      }
    } catch (e) {
      console.error('Failed to sync rejected refund to storage:', e);
    }

    if (addActivityLog) {
      addActivityLog(
        'Refund Rejected',
        `Rejected refund ${selectedRefund.id} for ${selectedRefund.customerName}. Reason: ${reason}`
      );
    }

    setIsRejectModalOpen(false);
    setRejectionInput('');
    setSelectedRefund(null);
  };

  // Pending refunds calculations for bulk actions
  const targetBulkRefunds = useMemo(() => {
    if (bulkActionTarget === 'selected') {
      return refunds.filter(r => selectedRefundIds.includes(r.id) && r.status === 'pending');
    }
    return refunds.filter(r => r.status === 'pending');
  }, [bulkActionTarget, selectedRefundIds, refunds]);

  const targetBulkTotalAmount = useMemo(() => {
    return targetBulkRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [targetBulkRefunds]);

  // Available pending refunds in the current filtered view
  const visiblePendingRefunds = useMemo(() => {
    return filteredRefunds.filter(r => r.status === 'pending');
  }, [filteredRefunds]);

  const isAllVisiblePendingSelected = useMemo(() => {
    if (visiblePendingRefunds.length === 0) return false;
    return visiblePendingRefunds.every(r => selectedRefundIds.includes(r.id));
  }, [visiblePendingRefunds, selectedRefundIds]);

  const handleToggleSelectAllPending = () => {
    if (isAllVisiblePendingSelected) {
      const visibleIds = new Set(visiblePendingRefunds.map(r => r.id));
      setSelectedRefundIds(prev => prev.filter(id => !visibleIds.has(id)));
    } else {
      const newIds = new Set([...selectedRefundIds, ...visiblePendingRefunds.map(r => r.id)]);
      setSelectedRefundIds(Array.from(newIds));
    }
  };

  const handleToggleSelectRefund = (id: string) => {
    setSelectedRefundIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Batch approve refunds (Refund All or Refund Selected)
  const handleConfirmBatchApprove = () => {
    if (targetBulkRefunds.length === 0) return;

    const targetIds = new Set(targetBulkRefunds.map(r => r.id));
    const targetTicketIds = new Set(targetBulkRefunds.map(r => r.ticketId));
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updatedRefunds = refunds.map((r) => {
      if (targetIds.has(r.id) && r.status === 'pending') {
        return {
          ...r,
          status: 'approved' as const,
          processedDate: nowStr,
          processedBy: 'Admin (Bulk Approval)'
        };
      }
      return r;
    });

    setRefunds(updatedRefunds);

    // Sync to storage
    try {
      const existingRefundedRaw = safeStorage.getItem(STORAGE_KEY_REFUNDED_IDS);
      const refundedList: string[] = existingRefundedRaw ? JSON.parse(existingRefundedRaw) : [];
      let listUpdated = false;
      targetTicketIds.forEach(tid => {
        if (!refundedList.includes(tid)) {
          refundedList.push(tid);
          listUpdated = true;
        }
      });
      if (listUpdated) {
        safeStorage.setItem(STORAGE_KEY_REFUNDED_IDS, JSON.stringify(refundedList));
      }

      const userTicketsRaw = safeStorage.getItem(STORAGE_KEY_USER_TICKETS);
      if (userTicketsRaw) {
        const tickets: any[] = JSON.parse(userTicketsRaw);
        const updatedUserTickets = tickets.map((t) => {
          if (targetTicketIds.has(t.id)) {
            return { ...t, status: 'refunded' };
          }
          return t;
        });
        safeStorage.setItem(STORAGE_KEY_USER_TICKETS, JSON.stringify(updatedUserTickets));
      }
    } catch (e) {
      console.error('Failed to sync batch approved refunds to storage:', e);
    }

    if (addActivityLog) {
      addActivityLog(
        'Batch Refunds Approved',
        `Approved ${targetBulkRefunds.length} refund requests totaling ${new Intl.NumberFormat('lo-LA').format(targetBulkTotalAmount)} ₭`
      );
    }

    setIsBulkApproveModalOpen(false);
    setSelectedRefundIds([]);
  };

  // Batch reject refunds (Reject All or Reject Selected)
  const handleConfirmBatchReject = () => {
    if (targetBulkRefunds.length === 0) return;

    const targetIds = new Set(targetBulkRefunds.map(r => r.id));
    const targetTicketIds = new Set(targetBulkRefunds.map(r => r.ticketId));
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const reason = bulkRejectionInput.trim() || (lang === 'lo' ? 'ບໍ່ກົງກັບນະໂຍບາຍການຄືນເງິນ' : 'Does not comply with event refund policy');

    const updatedRefunds = refunds.map((r) => {
      if (targetIds.has(r.id) && r.status === 'pending') {
        return {
          ...r,
          status: 'rejected' as const,
          rejectionReason: reason,
          processedDate: nowStr,
          processedBy: 'Admin (Bulk Rejection)'
        };
      }
      return r;
    });

    setRefunds(updatedRefunds);

    // Sync to storage
    try {
      const existingRefundedRaw = safeStorage.getItem(STORAGE_KEY_REFUNDED_IDS);
      if (existingRefundedRaw) {
        const refundedList: string[] = JSON.parse(existingRefundedRaw);
        const filteredList = refundedList.filter(id => !targetTicketIds.has(id));
        safeStorage.setItem(STORAGE_KEY_REFUNDED_IDS, JSON.stringify(filteredList));
      }

      const userTicketsRaw = safeStorage.getItem(STORAGE_KEY_USER_TICKETS);
      if (userTicketsRaw) {
        const tickets: any[] = JSON.parse(userTicketsRaw);
        const updatedUserTickets = tickets.map((t) => {
          if (targetTicketIds.has(t.id) && t.status === 'refunded') {
            return { ...t, status: 'upcoming' };
          }
          return t;
        });
        safeStorage.setItem(STORAGE_KEY_USER_TICKETS, JSON.stringify(updatedUserTickets));
      }
    } catch (e) {
      console.error('Failed to sync batch rejected refunds to storage:', e);
    }

    if (addActivityLog) {
      addActivityLog(
        'Batch Refunds Rejected',
        `Rejected ${targetBulkRefunds.length} refund requests. Reason: ${reason}`
      );
    }

    setIsBulkRejectModalOpen(false);
    setBulkRejectionInput('');
    setSelectedRefundIds([]);
  };

  // Handle Manual Refund creation
  const handleCreateManualRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicketId || !manualCustomerName || !manualEventTitle || !manualAmount) {
      alert(lang === 'lo' ? 'ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບຖ້ວນ' : 'Please fill in all required fields.');
      return;
    }

    const cleanAmount = parseInt(manualAmount.replace(/[^0-9]/g, ''), 10) || 0;
    const newRefund: RefundItem = {
      id: `REF-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
      ticketId: manualTicketId.trim(),
      orderId: `ORD-${manualTicketId.slice(-6).toUpperCase() || 'DIRECT'}`,
      eventTitle: manualEventTitle.trim(),
      customerName: manualCustomerName.trim(),
      customerEmail: manualCustomerEmail.trim() || 'customer@pasopkan.com',
      tierName: 'Admin Manual Override',
      quantity: 1,
      amount: cleanAmount,
      requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      reason: manualReason.trim() || 'Manual administrative refund issued.',
      status: 'approved',
      processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      processedBy: 'Admin (Direct Issue)',
      bankName: manualBankName,
      bankAccountName: manualAccountName.trim() || manualCustomerName.trim(),
      bankAccountNumber: manualAccountNumber.trim() || 'Direct Account'
    };

    setRefunds([newRefund, ...refunds]);

    // Update storage
    try {
      const existingRefundedRaw = safeStorage.getItem(STORAGE_KEY_REFUNDED_IDS);
      const refundedList: string[] = existingRefundedRaw ? JSON.parse(existingRefundedRaw) : [];
      if (!refundedList.includes(newRefund.ticketId)) {
        refundedList.push(newRefund.ticketId);
        safeStorage.setItem(STORAGE_KEY_REFUNDED_IDS, JSON.stringify(refundedList));
      }

      const userTicketsRaw = safeStorage.getItem(STORAGE_KEY_USER_TICKETS);
      if (userTicketsRaw) {
        const tickets: any[] = JSON.parse(userTicketsRaw);
        const updatedUserTickets = tickets.map((t) => {
          if (t.id === newRefund.ticketId) {
            return { ...t, status: 'refunded' };
          }
          return t;
        });
        safeStorage.setItem(STORAGE_KEY_USER_TICKETS, JSON.stringify(updatedUserTickets));
      }
    } catch (e) {
      console.error(e);
    }

    if (addActivityLog) {
      addActivityLog(
        'Manual Refund Issued',
        `Issued manual refund ${newRefund.id} (${new Intl.NumberFormat('lo-LA').format(newRefund.amount)} ₭) for ${newRefund.customerName}`
      );
    }

    setIsManualModalOpen(false);
    setManualTicketId('');
    setManualCustomerName('');
    setManualCustomerEmail('');
    setManualEventTitle('');
    setManualAmount('');
    setManualReason('');
    setManualAccountName('');
    setManualAccountNumber('');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRefunds.length === 0) return;
    const headers = ['Refund ID', 'Ticket ID', 'Order ID', 'Event Title', 'Customer Name', 'Customer Email', 'Phone', 'Quantity', 'Amount (LAK)', 'Status', 'Requested Date', 'Reason'];
    const rows = filteredRefunds.map(r => [
      r.id,
      r.ticketId,
      r.orderId || '',
      `"${(r.eventTitle || '').replace(/"/g, '""')}"`,
      `"${(r.customerName || '').replace(/"/g, '""')}"`,
      r.customerEmail,
      r.customerPhone || '',
      r.quantity,
      r.amount,
      r.status,
      r.requestDate,
      `"${(r.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pasopkan_refunds_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs relative overflow-hidden group hover:border-adv-orange/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {lang === 'lo' ? 'ຄຳຮ້ອງຂໍທັງໝົດ' : 'Total Requests'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-adv-orange flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-adv-slate mb-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            {lang === 'lo' ? 'ລວມທຸກສະຖານະ' : 'Across all events'}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-5 bg-white border border-amber-100 rounded-3xl shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
              {lang === 'lo' ? 'ລໍຖ້າການອະນຸມັດ' : 'Pending Review'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mb-1">
            {stats.pending}
          </div>
          <div className="text-[11px] text-amber-700/70 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {lang === 'lo' ? 'ຕ້ອງການການຕັດສິນໃຈ' : 'Requires admin action'}
          </div>
        </div>

        {/* Approved Refunds */}
        <div className="p-5 bg-white border border-emerald-100 rounded-3xl shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              {lang === 'lo' ? 'ຄືນເງິນສຳເລັດ' : 'Refunded / Approved'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mb-1">
            {stats.approved}
          </div>
          <div className="text-[11px] text-emerald-700/70 font-medium">
            {lang === 'lo' ? 'ໂອນເງິນສຳເລັດ' : 'Funds credited to customers'}
          </div>
        </div>

        {/* Total Refunded Amount */}
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs relative overflow-hidden group hover:border-adv-orange/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {lang === 'lo' ? 'ຍອດເງິນຄືນທັງໝົດ' : 'Total Amount Refunded'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-adv-slate mb-1">
            {new Intl.NumberFormat('lo-LA').format(stats.totalAmount)} ₭
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            {lang === 'lo' ? 'ຄິດໄລ່ຈາກທີ່ອະນຸມັດແລ້ວ' : 'Calculated from approved items'}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50/70 border border-gray-100 rounded-3xl">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                  isActive
                    ? 'bg-adv-slate text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200/80 hover:border-gray-300'
                }`}
              >
                {status === 'all'
                  ? (lang === 'lo' ? 'ທັງໝົດ' : 'All')
                  : status === 'pending'
                  ? (lang === 'lo' ? 'ລໍຖ້າກວດສອບ' : 'Pending')
                  : status === 'approved'
                  ? (lang === 'lo' ? 'ອະນຸມັດແລ້ວ' : 'Approved')
                  : (lang === 'lo' ? 'ປະຕິເສດ' : 'Rejected')}
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-md text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {status === 'all'
                    ? stats.total
                    : status === 'pending'
                    ? stats.pending
                    : status === 'approved'
                    ? stats.approved
                    : stats.rejected}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'lo' ? 'ຄົ້ນຫາຊື່, ລະຫັດປີ້, ເຫດການ...' : 'Search ticket, customer, event...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs text-adv-slate placeholder-gray-400 focus:outline-hidden focus:border-adv-orange transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredRefunds.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
            title={lang === 'lo' ? 'ດາວໂຫຼດ CSV' : 'Export CSV'}
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Refund All Button */}
          <button
            onClick={() => {
              setBulkActionTarget('all');
              setIsBulkApproveModalOpen(true);
            }}
            disabled={stats.pending === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title={lang === 'lo' ? 'ອະນຸມັດຄືນເງິນທັງໝົດທີ່ລໍຖ້າ' : 'Approve all pending refund requests'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{lang === 'lo' ? `ຄືນເງິນທັງໝົດ (${stats.pending})` : `Refund All (${stats.pending})`}</span>
          </button>

          {/* Reject All Button */}
          <button
            onClick={() => {
              setBulkActionTarget('all');
              setIsBulkRejectModalOpen(true);
            }}
            disabled={stats.pending === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title={lang === 'lo' ? 'ປະຕິເສດທຸກຄຳຮ້ອງທີ່ລໍຖ້າ' : 'Reject all pending refund requests'}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{lang === 'lo' ? `ປະຕິເສດທັງໝົດ (${stats.pending})` : `Reject All (${stats.pending})`}</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-adv-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'lo' ? 'ອອກຄືນເງິນໃໝ່' : 'Issue Refund'}</span>
          </button>
        </div>
      </div>

      {/* Refunds Table / List */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
        {/* Bulk Selection Bar when items are checked */}
        {selectedRefundIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-orange-50/90 border-b border-orange-100">
            <div className="flex items-center gap-2 text-xs font-bold text-adv-slate">
              <span className="w-6 h-6 rounded-lg bg-adv-orange text-white flex items-center justify-center text-[11px] font-mono">
                {selectedRefundIds.length}
              </span>
              <span>
                {lang === 'lo'
                  ? `ເລືອກແລ້ວ ${selectedRefundIds.length} ລາຍການທີ່ລໍຖ້າ`
                  : `${selectedRefundIds.length} pending request(s) selected`}
              </span>
              <span className="text-gray-400 font-normal">
                • {lang === 'lo' ? 'ລວມຍອດ' : 'Total'}: {new Intl.NumberFormat('lo-LA').format(targetBulkTotalAmount)} ₭
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBulkActionTarget('selected');
                  setIsBulkApproveModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'lo' ? `ຄືນເງິນທີ່ເລືອກ (${selectedRefundIds.length})` : `Refund Selected (${selectedRefundIds.length})`}</span>
              </button>
              <button
                onClick={() => {
                  setBulkActionTarget('selected');
                  setIsBulkRejectModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{lang === 'lo' ? `ປະຕິເສດທີ່ເລືອກ (${selectedRefundIds.length})` : `Reject Selected (${selectedRefundIds.length})`}</span>
              </button>
              <button
                onClick={() => setSelectedRefundIds([])}
                className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
              >
                {lang === 'lo' ? 'ຍົກເລີກການເລືອກ' : 'Clear'}
              </button>
            </div>
          </div>
        )}

        {filteredRefunds.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
              <RotateCcw className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              {lang === 'lo' ? 'ບໍ່ພົບລາຍການຄືນເງິນ' : 'No refund requests found'}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {lang === 'lo'
                ? 'ບໍ່ມີຄຳຮ້ອງຂໍຄືນເງິນທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາຂອງທ່ານ.'
                : 'There are currently no refund records matching your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisiblePendingSelected}
                      onChange={handleToggleSelectAllPending}
                      disabled={visiblePendingRefunds.length === 0}
                      className="w-4 h-4 rounded border-gray-300 text-adv-orange focus:ring-adv-orange cursor-pointer disabled:opacity-30 align-middle"
                      title={lang === 'lo' ? 'ເລືອກທັງໝົດທີ່ລໍຖ້າ' : 'Select all pending in current view'}
                    />
                  </th>
                  <th className="py-2.5 px-5">{lang === 'lo' ? 'ລະຫັດ / ວັນທີ' : 'Refund Ref / Date'}</th>
                  <th className="py-2.5 px-5">{lang === 'lo' ? 'ຜູ້ຊື້ປີ້' : 'Customer / Contact'}</th>
                  <th className="py-2.5 px-5">{lang === 'lo' ? 'ກິດຈະກຳ & ປີ້' : 'Event & Ticket'}</th>
                  <th className="py-2.5 px-5">{lang === 'lo' ? 'ຍອດເງິນຄືນ' : 'Refund Amount'}</th>
                  <th className="py-2.5 px-5">{lang === 'lo' ? 'ສະຖານະ' : 'Status'}</th>
                  <th className="py-2.5 px-5 text-right">{lang === 'lo' ? 'ການຈັດການ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {filteredRefunds.map((refund) => {
                  const isPending = refund.status === 'pending';
                  const isApproved = refund.status === 'approved';
                  const isRejected = refund.status === 'rejected';

                  return (
                    <tr key={refund.id} className="even:bg-gray-50/30 hover:bg-orange-50/30 transition-colors group">
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 align-top text-center">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={selectedRefundIds.includes(refund.id)}
                            onChange={() => handleToggleSelectRefund(refund.id)}
                            className="w-4 h-4 rounded border-gray-300 text-adv-orange focus:ring-adv-orange cursor-pointer mt-1"
                          />
                        ) : (
                          <span className="w-4 h-4 inline-block opacity-20 text-gray-400 mt-1">•</span>
                        )}
                      </td>

                      {/* ID & Date */}
                      <td className="py-2.5 px-5 align-top">
                        <div className="flex items-center gap-1.5 font-bold text-adv-slate">
                          <span>{refund.id}</span>
                          <button
                            onClick={() => copyToClipboard(refund.id, refund.id)}
                            className="text-gray-300 hover:text-adv-orange transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === refund.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {refund.requestDate}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 mt-1 flex items-center gap-1">
                          <Ticket className="w-2.5 h-2.5" />
                          <span>{refund.ticketId}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-2.5 px-5 align-top">
                        <div className="font-bold text-adv-slate">{refund.customerName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{refund.customerEmail}</div>
                        {refund.customerPhone && (
                          <div className="text-[10px] font-mono text-gray-400 mt-0.5">{refund.customerPhone}</div>
                        )}
                        {refund.bankName && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-[9.5px] font-medium text-gray-600">
                            <CreditCard className="w-2.5 h-2.5 text-gray-400" />
                            <span>{refund.bankName}</span>
                          </div>
                        )}
                      </td>

                      {/* Event & Tier */}
                      <td className="py-4 px-5 align-top max-w-xs">
                        <div className="font-bold text-adv-slate truncate" title={refund.eventTitle}>
                          {refund.eventTitle}
                        </div>
                        <div className="text-[11px] text-adv-orange font-semibold mt-0.5">
                          {refund.quantity}x {refund.tierName}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-1 italic" title={refund.reason}>
                          "{refund.reason}"
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-5 align-top">
                        <div className="text-sm font-black text-adv-slate">
                          {new Intl.NumberFormat('lo-LA').format(refund.amount)} ₭
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {refund.quantity} {lang === 'lo' ? 'ປີ້' : 'ticket(s)'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-5 align-top">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                            <span>{lang === 'lo' ? 'ລໍຖ້າກວດສອບ' : 'Pending'}</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{lang === 'lo' ? 'ຄືນເງິນແລ້ວ' : 'Approved'}</span>
                          </span>
                        )}
                        {isRejected && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3 h-3 text-red-500" />
                              <span>{lang === 'lo' ? 'ປະຕິເສດ' : 'Rejected'}</span>
                            </span>
                            {refund.rejectionReason && (
                              <div className="text-[9.5px] text-red-500/80 mt-1 max-w-[140px] truncate" title={refund.rejectionReason}>
                                {refund.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveRefund(refund)}
                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                title={lang === 'lo' ? 'ອະນຸມັດການຄືນເງິນ' : 'Approve Refund'}
                              >
                                <Check className="w-3 h-3" />
                                <span className="hidden sm:inline">{lang === 'lo' ? 'ອະນຸມັດ' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setIsRejectModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold transition-all border border-red-200 flex items-center gap-1 cursor-pointer"
                                title={lang === 'lo' ? 'ປະຕິເສດການຄືນເງິນ' : 'Reject Refund'}
                              >
                                <X className="w-3 h-3" />
                                <span className="hidden sm:inline">{lang === 'lo' ? 'ປະຕິເສດ' : 'Reject'}</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedRefund(refund)}
                            className="p-1.5 text-gray-400 hover:text-adv-orange hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'View Details'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: View Refund Details */}
      <AnimatePresence>
        {selectedRefund && !isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-adv-orange flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-adv-slate">
                      {lang === 'lo' ? 'ລາຍລະອຽດການຄືນເງິນ' : 'Refund Request Details'}
                    </h3>
                    <div className="text-xs text-gray-400 font-mono">
                      {selectedRefund.id}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-2xl mb-5 flex items-center justify-between border ${
                selectedRefund.status === 'pending'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                  : selectedRefund.status === 'approved'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                  : 'bg-red-50/70 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  {selectedRefund.status === 'pending' && <Clock className="w-5 h-5 text-amber-600" />}
                  {selectedRefund.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {selectedRefund.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide">
                      {selectedRefund.status === 'pending'
                        ? (lang === 'lo' ? 'ລໍຖ້າການອະນຸມັດຈາກແອດມິນ' : 'Pending Administrative Review')
                        : selectedRefund.status === 'approved'
                        ? (lang === 'lo' ? 'ອະນຸມັດການຄືນເງິນສຳເລັດແລ້ວ' : 'Refund Approved & Processed')
                        : (lang === 'lo' ? 'ຄຳຮ້ອງຂໍຄືນເງິນຖືກປະຕິເສດ' : 'Refund Request Rejected')}
                    </div>
                    {selectedRefund.processedDate && (
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {lang === 'lo' ? 'ດຳເນີນການເມື່ອ' : 'Processed on'}: {selectedRefund.processedDate} {selectedRefund.processedBy ? `by ${selectedRefund.processedBy}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black">
                    {new Intl.NumberFormat('lo-LA').format(selectedRefund.amount)} ₭
                  </div>
                  <div className="text-[10px] opacity-75 uppercase font-bold">
                    {selectedRefund.quantity} {lang === 'lo' ? 'ປີ້' : 'Tickets'}
                  </div>
                </div>
              </div>

              {/* Event Info Card */}
              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 mb-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {lang === 'lo' ? 'ຂໍ້ມູນກິດຈະກຳ' : 'Event Information'}
                </div>
                <div className="font-bold text-sm text-adv-slate mb-1">
                  {selectedRefund.eventTitle}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 mt-2">
                  {selectedRefund.eventDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                      <span>{selectedRefund.eventDate}</span>
                    </div>
                  )}
                  {selectedRefund.eventLocation && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{selectedRefund.eventLocation}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{selectedRefund.tierName} (ID: {selectedRefund.ticketId})</span>
                  </div>
                </div>
              </div>

              {/* Customer & Banking Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>{lang === 'lo' ? 'ຂໍ້ມູນລູກຄ້າ' : 'Customer Info'}</span>
                  </div>
                  <div className="font-bold text-xs text-adv-slate">{selectedRefund.customerName}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{selectedRefund.customerEmail}</div>
                  {selectedRefund.customerPhone && (
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{selectedRefund.customerPhone}</div>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-gray-400" />
                    <span>{lang === 'lo' ? 'ບັນຊີຮັບເງິນຄືນ' : 'Bank Transfer Info'}</span>
                  </div>
                  <div className="text-xs font-bold text-adv-slate">
                    {selectedRefund.bankName || 'BCEL OnePay'}
                  </div>
                  <div className="text-[11px] text-gray-600 font-mono mt-0.5">
                    {selectedRefund.bankAccountNumber || 'Direct Payout Account'}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">
                    {selectedRefund.bankAccountName || selectedRefund.customerName}
                  </div>
                </div>
              </div>

              {/* Reason & Rejection Reason */}
              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {lang === 'lo' ? 'ເຫດຜົນໃນການຂໍຄືນເງິນ' : 'Reason for Refund'}
                  </div>
                  <div className="text-xs text-gray-700 italic">
                    "{selectedRefund.reason}"
                  </div>
                </div>

                {selectedRefund.rejectionReason && (
                  <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">
                      {lang === 'lo' ? 'ເຫດຜົນໃນການປະຕິເສດ' : 'Admin Rejection Reason'}
                    </div>
                    <div className="text-xs text-red-700">
                      {selectedRefund.rejectionReason}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                {selectedRefund.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => {
                        setIsRejectModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                    >
                      {lang === 'lo' ? 'ປະຕິເສດຄຳຮ້ອງ' : 'Reject Request'}
                    </button>
                    <button
                      onClick={() => handleApproveRefund(selectedRefund)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'lo' ? 'ອະນຸມັດ & ຄືນເງິນທັນທີ' : 'Approve & Refund Now'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedRefund(null)}
                    className="px-5 py-2.5 rounded-xl bg-adv-slate text-white text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    {lang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Reject Confirmation */}
      <AnimatePresence>
        {isRejectModalOpen && selectedRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-adv-slate mb-1">
                {lang === 'lo' ? 'ຢືນຢັນການປະຕິເສດຄຳຮ້ອງຄືນເງິນ' : 'Reject Refund Request?'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {lang === 'lo'
                  ? `ທ່ານກຳລັງຈະປະຕິເສດການຄືນເງິນໃຫ້ກັບ ${selectedRefund.customerName} ສຳລັບ ${selectedRefund.eventTitle}.`
                  : `You are about to reject the refund request for ${selectedRefund.customerName} (${selectedRefund.eventTitle}).`}
              </p>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {lang === 'lo' ? 'ເຫດຜົນໃນການປະຕິເສດ' : 'Reason for Rejection'}
                </label>
                <textarea
                  rows={3}
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                  placeholder={
                    lang === 'lo'
                      ? 'ຕົວຢ່າງ: ຄຳຮ້ອງຂໍເກີນກຳນົດເວລາ 48 ຊົ່ວໂມງກ່ອນເລີ່ມງານ...'
                      : 'e.g. Request submitted past the 48-hour cutoff window...'
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate placeholder-gray-400 focus:outline-hidden focus:border-red-400 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectionInput('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {lang === 'lo' ? 'ຢືນຢັນການປະຕິເສດ' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Bulk Approve Confirmation (Refund All / Refund Selected) */}
      <AnimatePresence>
        {isBulkApproveModalOpen && targetBulkRefunds.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-adv-slate mb-1">
                {bulkActionTarget === 'all'
                  ? (lang === 'lo' ? 'ຢືນຢັນການຄືນເງິນທັງໝົດ' : 'Refund All Pending Requests')
                  : (lang === 'lo' ? 'ຢືນຢັນການຄືນເງິນລາຍການທີ່ເລືອກ' : 'Refund Selected Requests')}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {lang === 'lo'
                  ? `ທ່ານກຳລັງຈະອະນຸມັດ ແລະ ດຳເນີນການຄືນເງິນ ${targetBulkRefunds.length} ລາຍການ, ລວມເປັນມູນຄ່າ ${new Intl.NumberFormat('lo-LA').format(targetBulkTotalAmount)} ₭.`
                  : `You are about to approve and process refunds for ${targetBulkRefunds.length} pending request(s), totaling ${new Intl.NumberFormat('lo-LA').format(targetBulkTotalAmount)} ₭.`}
              </p>

              {/* Items Summary Preview */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 mb-4 max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
                {targetBulkRefunds.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-adv-slate flex items-center gap-1.5 truncate">
                        <span>{item.customerName}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-normal">({item.id})</span>
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {item.eventTitle}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-emerald-600">
                        {new Intl.NumberFormat('lo-LA').format(item.amount)} ₭
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {item.bankName || 'Bank Transfer'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-[11px] text-emerald-800 leading-relaxed mb-5 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  {lang === 'lo'
                    ? 'ລະບົບຈະປັບສະຖານະປີ້ທີ່ກ່ຽວຂ້ອງເປັນ "ຄືນເງິນແລ້ວ" (Refunded) ໃນຖານຂໍ້ມູນ ແລະ ໜ້າ Dashboard ຂອງລູກຄ້າທັນທີ.'
                    : 'All associated tickets will be updated to "Refunded" and synchronized across user dashboards immediately.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBulkApproveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchApprove}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {bulkActionTarget === 'all'
                      ? (lang === 'lo' ? `ຢືນຢັນຄືນເງິນທັງໝົດ (${targetBulkRefunds.length})` : `Confirm Refund All (${targetBulkRefunds.length})`)
                      : (lang === 'lo' ? `ຢືນຢັນຄືນເງິນທີ່ເລືອກ (${targetBulkRefunds.length})` : `Confirm Refund Selected (${targetBulkRefunds.length})`)}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Bulk Reject Confirmation (Reject All / Reject Selected) */}
      <AnimatePresence>
        {isBulkRejectModalOpen && targetBulkRefunds.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-adv-slate mb-1">
                {bulkActionTarget === 'all'
                  ? (lang === 'lo' ? 'ຢືນຢັນການປະຕິເສດທັງໝົດ' : 'Reject All Pending Requests')
                  : (lang === 'lo' ? 'ຢືນຢັນການປະຕິເສດລາຍການທີ່ເລືອກ' : 'Reject Selected Requests')}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {lang === 'lo'
                  ? `ທ່ານກຳລັງຈະປະຕິເສດຄຳຮ້ອງຄືນເງິນຈຳນວນ ${targetBulkRefunds.length} ລາຍການ. ປີ້ເດີມຈະຍັງຄົງມີຜົນບັງຄັບໃຊ້ ແລະ ສາມາດນຳໃຊ້ເຂົ້າງານໄດ້ຕາມປົກກະຕິ.`
                  : `You are about to reject ${targetBulkRefunds.length} pending refund request(s). The original tickets will remain valid and active for event entry.`}
              </p>

              {/* Items Summary Preview */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 mb-4 max-h-40 overflow-y-auto divide-y divide-gray-100 text-xs">
                {targetBulkRefunds.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-adv-slate flex items-center gap-1.5 truncate">
                        <span>{item.customerName}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-normal">({item.id})</span>
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {item.eventTitle}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-bold text-red-500">
                      {new Intl.NumberFormat('lo-LA').format(item.amount)} ₭
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {lang === 'lo' ? 'ເຫດຜົນໃນການປະຕິເສດ (ນຳໃຊ້ກັບທຸກລາຍການ)' : 'Rejection Reason (Applied to all items)'}
                </label>
                <textarea
                  rows={2}
                  value={bulkRejectionInput}
                  onChange={(e) => setBulkRejectionInput(e.target.value)}
                  placeholder={
                    lang === 'lo'
                      ? 'ຕົວຢ່າງ: ບໍ່ກົງກັບນະໂຍບາຍການຄືນເງິນ ຫຼື ເກີນກຳນົດເວລາ...'
                      : 'e.g. Requests do not comply with event refund cutoff policy...'
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate placeholder-gray-400 focus:outline-hidden focus:border-red-400 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkRejectModalOpen(false);
                    setBulkRejectionInput('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchReject}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  <span>
                    {bulkActionTarget === 'all'
                      ? (lang === 'lo' ? `ຢືນຢັນປະຕິເສດທັງໝົດ (${targetBulkRefunds.length})` : `Confirm Reject All (${targetBulkRefunds.length})`)
                      : (lang === 'lo' ? `ຢືນຢັນປະຕິເສດທີ່ເລືອກ (${targetBulkRefunds.length})` : `Confirm Reject Selected (${targetBulkRefunds.length})`)}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Manual Issue Refund */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-adv-orange flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-adv-slate">
                      {lang === 'lo' ? 'ອອກການຄືນເງິນໂດຍແອດມິນ' : 'Issue Manual Refund'}
                    </h3>
                    <div className="text-xs text-gray-400">
                      {lang === 'lo' ? 'ສຳລັບກໍລະນີພິເສດ ຫຼື ຂໍ້ຜິດພາດໃນການຈ່າຍເງິນ' : 'For customer support overrides and banking corrections'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateManualRefund} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'lo' ? 'ລະຫັດປີ້ (Ticket ID) *' : 'Ticket ID *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TKT-2026-999"
                      value={manualTicketId}
                      onChange={(e) => setManualTicketId(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'lo' ? 'ຊື່ກິດຈະກຳ *' : 'Event Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indie Fest Vientiane"
                      value={manualEventTitle}
                      onChange={(e) => setManualEventTitle(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'lo' ? 'ຊື່ລູກຄ້າ *' : 'Customer Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Somchai Phommavong"
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'lo' ? 'ອີເມວລູກຄ້າ' : 'Customer Email'}
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={manualCustomerEmail}
                      onChange={(e) => setManualCustomerEmail(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'lo' ? 'ຈຳນວນເງິນຄືນ (ກີບ) *' : 'Refund Amount (LAK) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="e.g. 250000"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'lo' ? 'ທະນາຄານ' : 'Bank'}
                    </label>
                    <select
                      value={manualBankName}
                      onChange={(e) => setManualBankName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange"
                    >
                      <option value="BCEL">BCEL One</option>
                      <option value="JDB">JDB Bank</option>
                      <option value="LDB">LDB Bank</option>
                      <option value="APB">APB Bank</option>
                      <option value="Maruhan">Maruhan Japan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'lo' ? 'ຊື່ບັນຊີ' : 'Account Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SOMCHAI P."
                      value={manualAccountName}
                      onChange={(e) => setManualAccountName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'lo' ? 'ເລກບັນຊີ' : 'Account Number'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 010120008899"
                      value={manualAccountNumber}
                      onChange={(e) => setManualAccountNumber(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'lo' ? 'ເຫດຜົນໃນການຄືນເງິນ' : 'Refund Reason'}
                  </label>
                  <textarea
                    rows={2}
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="e.g. VIP ticket downgrade / support ticket refund request"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-adv-slate focus:outline-hidden focus:border-adv-orange"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-adv-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {lang === 'lo' ? 'ຢືນຢັນການຄືນເງິນ' : 'Issue & Mark Refunded'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
