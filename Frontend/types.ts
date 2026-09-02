export interface BankAccountInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface PayoutBill {
  id: string;
  eventTitle: string;
  organizer: string;
  status: 'pending' | 'paid';
  revenue: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  payoutAmount: number;
  bankInfo: BankAccountInfo;
  billImage?: string;
  completedDate?: string;
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
