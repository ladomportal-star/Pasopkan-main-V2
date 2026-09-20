export interface BankAccountInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  updatedAt?: string;
}

export interface PayoutBill {
  id: string;
  status: string;
  eventTitle?: string;
  organizer?: string;
  revenue?: number;
  platformFeePercent?: number;
  platformFeeAmount?: number;
  payoutAmount?: number;
  bankInfo?: BankAccountInfo;
  billImage?: string;
  completedDate?: string;
  reference?: string;
  // Alternate display shape used by the payout-history table
  date?: string;
  event?: string;
  account?: string;
  accountName?: string;
  grossAmount?: number;
  platformFee?: number;
  amount?: number;
  receiptUrl?: string;
}

export interface TicketZone {
  name: string;
  price: number;
  capacity: number;
  sold: number;
}

export interface EventData {
  id: string | number;
  title: string;
  date: string;
  time?: string;
  image: string;
  location?: string;
  status?: string;
  totalTickets?: number;
  soldTickets?: number;
  revenue?: number;
  zones?: TicketZone[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface EventReview {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AppNotification {
  id: string;
  title: string;
  titleLo?: string;
  message: string;
  messageLo?: string;
  type?: 'upcomingEvent' | 'noted' | 'ticket' | 'promo' | 'verified' | 'system' | string;
  /** Deep-link context, e.g. { eventId, orderId } */
  data?: Record<string, string>;
  isUnread: boolean;
  /** ISO timestamp from the server; the "x minutes ago" text is derived from it. */
  createdAt: string;
}
