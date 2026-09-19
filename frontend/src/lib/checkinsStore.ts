import { useState, useEffect, useMemo } from 'react';

export interface CheckinRecord {
  id: string;
  ticketId: string;
  eventId: string;
  attendeeName: string;
  email: string;
  phone?: string;
  ticketType: string;
  zone: string;
  seat: string;
  price?: string;
  time: string;
  timestamp?: number;
  staffLabel?: string;
  customAnswers?: Record<string, string | string[]>;
}

export interface EventAttendee {
  id: string;
  ticketId: string;
  orderId?: string;
  eventId: string;
  firstName: string;
  lastName: string;
  attendeeName: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  ticketType: string;
  tierId?: string;
  zone: string;
  seat: string;
  price?: string;
  purchaseDate?: string;
  isCheckedIn: boolean;
  checkedInTime?: string;
  checkedInTimestamp?: number;
  staffLabel?: string;
  customAnswers: Record<string, string | string[]>;
}

const STORAGE_KEY_CHECKINS = 'pasopkan_checkins';
const STORAGE_KEY_ATTENDEES = 'pasopkan_event_attendees';
const BROADCAST_CHANNEL_NAME = 'pasopkan_checkins_channel';

// Rich initial attendees across events (both checked in and pending checkin) with full custom question answers
export const INITIAL_MOCK_ATTENDEES: EventAttendee[] = [
  // --- Event '2': Vientiane Tech Summit 2026 (Has 10 Attendee Questions) ---
  {
    id: 'att_2_1',
    ticketId: 'tk_tech_001',
    orderId: 'ord_ts26_901',
    eventId: '2',
    firstName: 'Khamla',
    lastName: 'Phommasone',
    attendeeName: 'Khamla Phommasone',
    email: 'khamla.p@laotel.la',
    phone: '+856 20 5511 2233',
    ticketType: 'VIP All-Access Pass',
    tierId: 'tier_vip',
    zone: 'VIP Zone A',
    seat: 'Row 1, Seat 04',
    price: '1,200,000 LAK',
    purchaseDate: '2026-08-20T09:30:00Z',
    isCheckedIn: true,
    checkedInTime: '18:40',
    checkedInTimestamp: Date.now() - 1000 * 60 * 50,
    staffLabel: 'VIP Gate Desk',
    customAnswers: {
      'q1': 'Lao Telecom Enterprise',
      'q2': 'Lead AI Engineer & Solutions Architect',
      'q3': '>$1000',
      'q4': 'Often',
      'q5': 'Gemini 1.5 Pro',
      'q6': 'Custom',
      'q7': 'Yes',
      'q8': 'true',
      'q9': 'true',
      'q10': 'https://linkedin.com/in/khamla-phommasone'
    }
  },
  {
    id: 'att_2_2',
    ticketId: 'tk_tech_002',
    orderId: 'ord_ts26_902',
    eventId: '2',
    firstName: 'Sarah',
    lastName: 'Connor',
    attendeeName: 'Sarah Connor',
    email: 'sarah.c@techlaos.io',
    phone: '+856 20 2234 5678',
    ticketType: 'Standard Summit Pass',
    tierId: 'tier_standard',
    zone: 'Main Hall',
    seat: 'Row 4, Seat 12',
    price: '650,000 LAK',
    purchaseDate: '2026-08-21T14:15:00Z',
    isCheckedIn: false,
    staffLabel: undefined,
    customAnswers: {
      'q1': 'TechLaos AI Ventures',
      'q2': 'Principal Product Manager',
      'q3': '$100-$1000',
      'q4': 'Sometimes',
      'q5': 'Claude 3',
      'q6': 'LangChain',
      'q7': 'Yes',
      'q8': 'false',
      'q9': 'true',
      'q10': 'https://linkedin.com/in/sarah-connor'
    }
  },
  {
    id: 'att_2_3',
    ticketId: 'tk_tech_003',
    orderId: 'ord_ts26_903',
    eventId: '2',
    firstName: 'Sengaloun',
    lastName: 'Vongphachanh',
    attendeeName: 'Sengaloun Vongphachanh',
    email: 'sengaloun.v@edl.la',
    phone: '+856 20 2244 6688',
    ticketType: 'Standard Summit Pass',
    tierId: 'tier_standard',
    zone: 'Main Hall',
    seat: 'Row 5, Seat 18',
    price: '650,000 LAK',
    purchaseDate: '2026-08-22T10:45:00Z',
    isCheckedIn: true,
    checkedInTime: '19:05',
    checkedInTimestamp: Date.now() - 1000 * 60 * 35,
    staffLabel: 'Main Gate A',
    customAnswers: {
      'q1': 'Electricite du Laos (EDL)',
      'q2': 'Head of Smart Grid Software',
      'q3': '>$1000',
      'q4': 'Sometimes',
      'q5': 'GPT-4',
      'q6': 'LlamaIndex',
      'q7': 'Yes',
      'q8': 'false',
      'q9': 'false',
      'q10': 'https://linkedin.com/in/sengaloun-v'
    }
  },
  {
    id: 'att_2_4',
    ticketId: 'tk_tech_004',
    orderId: 'ord_ts26_904',
    eventId: '2',
    firstName: 'Anousone',
    lastName: 'Keobounmy',
    attendeeName: 'Anousone Keobounmy',
    email: 'anousone.k@jdbbank.la',
    phone: '+856 20 9933 1155',
    ticketType: 'VIP All-Access Pass',
    tierId: 'tier_vip',
    zone: 'VIP Zone A',
    seat: 'Row 2, Seat 08',
    price: '1,200,000 LAK',
    purchaseDate: '2026-08-23T16:20:00Z',
    isCheckedIn: false,
    customAnswers: {
      'q1': 'JDB Bank Digital Innovation',
      'q2': 'VP of Core Engineering',
      'q3': '>$1000',
      'q4': 'Never',
      'q5': 'Gemini 1.5 Pro',
      'q6': 'Custom',
      'q7': 'Yes',
      'q8': 'false',
      'q9': 'true',
      'q10': 'https://linkedin.com/in/anousone-k'
    }
  },
  {
    id: 'att_2_5',
    ticketId: 'tk_tech_005',
    orderId: 'ord_ts26_905',
    eventId: '2',
    firstName: 'Malee',
    lastName: 'Xaiyavong',
    attendeeName: 'Malee Xaiyavong',
    email: 'malee.x@vientiane-ux.la',
    phone: '+856 20 4488 2211',
    ticketType: 'Early Bird Pass',
    tierId: 'tier_early',
    zone: 'Zone B',
    seat: 'Row 8, Seat 03',
    price: '450,000 LAK',
    purchaseDate: '2026-08-24T11:10:00Z',
    isCheckedIn: false,
    customAnswers: {
      'q1': 'Vientiane UX & Creative Studio',
      'q2': 'Senior Product Designer',
      'q3': '<$100',
      'q4': 'Never',
      'q5': 'Claude 3',
      'q6': 'LangChain',
      'q7': 'No',
      'q8': 'true',
      'q9': 'false',
      'q10': 'https://linkedin.com/in/malee-x'
    }
  },
  {
    id: 'att_2_6',
    ticketId: 'tk_tech_006',
    orderId: 'ord_ts26_906',
    eventId: '2',
    firstName: 'David',
    lastName: 'Miller',
    attendeeName: 'David Miller',
    email: 'david.m@globalfin.io',
    phone: '+856 20 7788 9900',
    ticketType: 'VIP All-Access Pass',
    tierId: 'tier_vip',
    zone: 'VIP Zone A',
    seat: 'Row 1, Seat 09',
    price: '1,200,000 LAK',
    purchaseDate: '2026-08-25T08:50:00Z',
    isCheckedIn: true,
    checkedInTime: '19:22',
    checkedInTimestamp: Date.now() - 1000 * 60 * 20,
    staffLabel: 'VIP Gate Desk',
    customAnswers: {
      'q1': 'GlobalFin Labs Singapore',
      'q2': 'VP of Engineering',
      'q3': '>$1000',
      'q4': 'Often',
      'q5': 'GPT-4',
      'q6': 'Custom',
      'q7': 'Yes',
      'q8': 'false',
      'q9': 'true',
      'q10': 'https://linkedin.com/in/david-miller'
    }
  },
  {
    id: 'att_2_7',
    ticketId: 'tk_tech_007',
    orderId: 'ord_ts26_907',
    eventId: '2',
    firstName: 'Souksakhone',
    lastName: 'Inthavong',
    attendeeName: 'Souksakhone Inthavong',
    email: 'souk.i@bcel.la',
    phone: '+856 20 5588 1234',
    ticketType: 'Standard Summit Pass',
    tierId: 'tier_standard',
    zone: 'Main Hall',
    seat: 'Row 6, Seat 21',
    price: '650,000 LAK',
    purchaseDate: '2026-08-26T13:40:00Z',
    isCheckedIn: false,
    customAnswers: {
      'q1': 'BCEL Bank Tech Center',
      'q2': 'Senior Full-Stack Engineer',
      'q3': '$100-$1000',
      'q4': 'Sometimes',
      'q5': 'Gemini 1.5 Pro',
      'q6': 'LangChain',
      'q7': 'Yes',
      'q8': 'true',
      'q9': 'true',
      'q10': 'https://linkedin.com/in/souksakhone-i'
    }
  },

  // --- Event '1': That Luang Festival ---
  {
    id: 'att_1_1',
    ticketId: 'tk_981245',
    orderId: 'ord_tl_101',
    eventId: '1',
    firstName: 'Marcus',
    lastName: 'Aurelius',
    attendeeName: 'Marcus Aurelius',
    email: 'marcus.a@example.com',
    phone: '+856 20 5512 8900',
    ticketType: 'VIP Front Stage',
    tierId: 'tier_vip',
    zone: 'VIP Row 1',
    seat: 'Seat 4',
    price: '450,000 LAK',
    purchaseDate: '2026-08-25T10:00:00Z',
    isCheckedIn: true,
    checkedInTime: '19:28',
    checkedInTimestamp: Date.now() - 1000 * 60 * 32,
    staffLabel: 'Gate A Staff',
    customAnswers: {
      'tshirt_size': 'L',
      'dietary': 'None',
      'emergency_contact': '+856 20 5512 8999'
    }
  },
  {
    id: 'att_1_2',
    ticketId: 'tk_301984',
    orderId: 'ord_tl_102',
    eventId: '1',
    firstName: 'Sengdeuan',
    lastName: 'Keo',
    attendeeName: 'Sengdeuan Keo',
    email: 'sengdeuan.k@example.com',
    phone: '+856 20 2234 5678',
    ticketType: 'Standard Zone A',
    tierId: 'tier_std',
    zone: 'Zone A Row 10',
    seat: 'Seat 18',
    price: '250,000 LAK',
    purchaseDate: '2026-08-25T11:20:00Z',
    isCheckedIn: true,
    checkedInTime: '19:15',
    checkedInTimestamp: Date.now() - 1000 * 60 * 45,
    staffLabel: 'Main Gate',
    customAnswers: {
      'tshirt_size': 'M',
      'dietary': 'Vegetarian',
      'emergency_contact': '+856 20 2234 5600'
    }
  },
  {
    id: 'att_1_3',
    ticketId: 'tk_452819',
    orderId: 'ord_tl_103',
    eventId: '1',
    firstName: 'Liam',
    lastName: 'Neeson',
    attendeeName: 'Liam Neeson',
    email: 'liam.n@example.com',
    phone: '+856 20 9988 7766',
    ticketType: 'General Access Zone B',
    tierId: 'tier_ga',
    zone: 'Zone B Row 22',
    seat: 'Seat 11',
    price: '150,000 LAK',
    purchaseDate: '2026-08-25T13:45:00Z',
    isCheckedIn: true,
    checkedInTime: '18:45',
    checkedInTimestamp: Date.now() - 1000 * 60 * 75,
    staffLabel: 'Gate B Staff',
    customAnswers: {
      'tshirt_size': 'XL',
      'dietary': 'None'
    }
  },
  {
    id: 'att_1_4',
    ticketId: 'tk_712903',
    orderId: 'ord_tl_104',
    eventId: '1',
    firstName: 'Khamphoune',
    lastName: 'Vong',
    attendeeName: 'Khamphoune Vong',
    email: 'khamphoune.v@example.com',
    phone: '+856 20 5566 7788',
    ticketType: 'VIP Front Stage',
    tierId: 'tier_vip',
    zone: 'VIP Row 2',
    seat: 'Seat 8',
    price: '450,000 LAK',
    purchaseDate: '2026-08-26T09:15:00Z',
    isCheckedIn: true,
    checkedInTime: '18:30',
    checkedInTimestamp: Date.now() - 1000 * 60 * 90,
    staffLabel: 'VIP Gate',
    customAnswers: {
      'tshirt_size': 'M',
      'dietary': 'Halal'
    }
  },
  {
    id: 'att_1_5',
    ticketId: 'tk_558120',
    orderId: 'ord_tl_105',
    eventId: '1',
    firstName: 'Elena',
    lastName: 'Rostova',
    attendeeName: 'Elena Rostova',
    email: 'elena.r@example.com',
    phone: '+856 20 1122 3344',
    ticketType: 'Standard Zone A',
    tierId: 'tier_std',
    zone: 'Zone A Row 5',
    seat: 'Seat 12',
    price: '250,000 LAK',
    purchaseDate: '2026-08-26T14:30:00Z',
    isCheckedIn: true,
    checkedInTime: '18:15',
    checkedInTimestamp: Date.now() - 1000 * 60 * 105,
    staffLabel: 'Main Gate',
    customAnswers: {
      'tshirt_size': 'S',
      'dietary': 'None'
    }
  },
  {
    id: 'att_1_6',
    ticketId: 'tk_664192',
    orderId: 'ord_tl_106',
    eventId: '1',
    firstName: 'Bounmy',
    lastName: 'Saysana',
    attendeeName: 'Bounmy Saysana',
    email: 'bounmy.s@example.com',
    phone: '+856 20 7744 1122',
    ticketType: 'Standard Zone A',
    tierId: 'tier_std',
    zone: 'Zone A Row 8',
    seat: 'Seat 19',
    price: '250,000 LAK',
    purchaseDate: '2026-08-27T16:00:00Z',
    isCheckedIn: false,
    customAnswers: {
      'tshirt_size': 'L',
      'dietary': 'Vegetarian'
    }
  },
  {
    id: 'att_1_7',
    ticketId: 'tk_883011',
    orderId: 'ord_tl_107',
    eventId: '1',
    firstName: 'Somphorn',
    lastName: 'Manivong',
    attendeeName: 'Somphorn Manivong',
    email: 'somphorn.m@example.com',
    phone: '+856 20 9955 3311',
    ticketType: 'VIP Front Stage',
    tierId: 'tier_vip',
    zone: 'VIP Row 1',
    seat: 'Seat 7',
    price: '450,000 LAK',
    purchaseDate: '2026-08-28T10:15:00Z',
    isCheckedIn: false,
    customAnswers: {
      'tshirt_size': 'XL',
      'dietary': 'None'
    }
  },

  // --- Event '3': Lao Fashion Week ---
  {
    id: 'att_3_1',
    ticketId: 'tk_fw001',
    orderId: 'ord_fw_301',
    eventId: '3',
    firstName: 'Malee',
    lastName: 'Chanthavong',
    attendeeName: 'Malee Chanthavong',
    email: 'malee.c@example.com',
    phone: '+856 20 5678 9012',
    ticketType: 'Front Row Runway VIP',
    zone: 'Runway Row A',
    seat: 'Seat A-02',
    price: '600,000 LAK',
    purchaseDate: '2026-08-20T12:00:00Z',
    isCheckedIn: true,
    checkedInTime: '19:00',
    checkedInTimestamp: Date.now() - 1000 * 60 * 60,
    staffLabel: 'Red Carpet Gate',
    customAnswers: {
      'preferred_beverage': 'Champagne',
      'after_party_access': 'Yes'
    }
  },
  {
    id: 'att_3_2',
    ticketId: 'tk_fw002',
    orderId: 'ord_fw_302',
    eventId: '3',
    firstName: 'Natasha',
    lastName: 'Romanoff',
    attendeeName: 'Natasha Romanoff',
    email: 'natasha.r@example.com',
    phone: '+856 20 6543 2109',
    ticketType: 'Designer Lounge Pass',
    zone: 'VIP Lounge',
    seat: 'Table 04',
    price: '850,000 LAK',
    purchaseDate: '2026-08-21T15:30:00Z',
    isCheckedIn: true,
    checkedInTime: '18:50',
    checkedInTimestamp: Date.now() - 1000 * 60 * 70,
    staffLabel: 'VIP Lounge Gate',
    customAnswers: {
      'preferred_beverage': 'Sparkling Water',
      'after_party_access': 'Yes'
    }
  },
  {
    id: 'att_3_3',
    ticketId: 'tk_fw003',
    orderId: 'ord_fw_303',
    eventId: '3',
    firstName: 'Anousone',
    lastName: 'Vongviseth',
    attendeeName: 'Anousone Vongviseth',
    email: 'anousone.v@example.com',
    phone: '+856 20 7890 1234',
    ticketType: 'Standard Fashion Pass',
    zone: 'Zone B Row 3',
    seat: 'Seat 14',
    price: '300,000 LAK',
    purchaseDate: '2026-08-22T09:40:00Z',
    isCheckedIn: true,
    checkedInTime: '19:12',
    checkedInTimestamp: Date.now() - 1000 * 60 * 48,
    staffLabel: 'Main Entrance',
    customAnswers: {
      'preferred_beverage': 'Juice',
      'after_party_access': 'No'
    }
  },
  {
    id: 'att_3_4',
    ticketId: 'tk_fw004',
    orderId: 'ord_fw_304',
    eventId: '3',
    firstName: 'Jessica',
    lastName: 'Alba',
    attendeeName: 'Jessica Alba',
    email: 'jessica.a@example.com',
    phone: '+856 20 8899 0011',
    ticketType: 'Front Row Runway VIP',
    zone: 'Runway Row A',
    seat: 'Seat A-05',
    price: '600,000 LAK',
    purchaseDate: '2026-08-23T17:10:00Z',
    isCheckedIn: false,
    customAnswers: {
      'preferred_beverage': 'Champagne',
      'after_party_access': 'Yes'
    }
  }
];

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

// Generate fallback mock attendees if an event has none
function generateMockAttendeesForEvent(eventId: string): EventAttendee[] {
  const names = [
    { first: 'Khamla', last: 'Phommasone', email: 'khamla.p@example.com', phone: '+856 20 5511 2233', company: 'Lao Telecom', role: 'Solutions Architect' },
    { first: 'Sengaloun', last: 'Vongphachanh', email: 'sengaloun.v@example.com', phone: '+856 20 2244 6688', company: 'EDL Laos', role: 'Systems Manager' },
    { first: 'Anousone', last: 'Keobounmy', email: 'anousone.k@example.com', phone: '+856 20 9933 1155', company: 'JDB Bank', role: 'Technology Officer' },
    { first: 'Chittakone', last: 'Souk', email: 'chittakone.s@example.com', phone: '+856 20 7711 9922', company: 'Vientiane Tech', role: 'Developer' },
    { first: 'Malee', last: 'Xaiyavong', email: 'malee.x@example.com', phone: '+856 20 4488 2211', company: 'Design Lab', role: 'Lead Designer' }
  ];

  return names.map((person, index) => {
    const isChecked = index < 2;
    return {
      id: `att_${eventId}_auto_${index + 1}`,
      ticketId: `tk_e${eventId}_00${index + 1}`,
      orderId: `ord_${eventId}_${100 + index}`,
      eventId: String(eventId),
      firstName: person.first,
      lastName: person.last,
      attendeeName: `${person.first} ${person.last}`,
      email: person.email,
      phone: person.phone,
      ticketType: index === 0 ? 'VIP Pass' : index < 3 ? 'Standard Ticket' : 'General Access',
      tierId: index === 0 ? 'tier_vip' : 'tier_std',
      zone: index === 0 ? 'VIP Zone' : 'Zone A',
      seat: `Row ${index + 1}, Seat ${index * 4 + 2}`,
      price: index === 0 ? '450,000 LAK' : '250,000 LAK',
      purchaseDate: new Date(Date.now() - (1000 * 60 * 60 * 24 * (index + 2))).toISOString(),
      isCheckedIn: isChecked,
      checkedInTime: isChecked ? `${17 + index}:${(10 + index * 12) % 60}` : undefined,
      checkedInTimestamp: isChecked ? Date.now() - (1000 * 60 * (index + 1) * 20) : undefined,
      staffLabel: isChecked ? 'Gate Staff' : undefined,
      customAnswers: {
        'q1': person.company,
        'q2': person.role,
        'q3': index % 2 === 0 ? '>$1000' : '$100-$1000',
        'q4': 'Sometimes',
        'q5': index % 2 === 0 ? 'Gemini 1.5 Pro' : 'GPT-4',
        'q6': 'Custom',
        'q7': 'Yes',
        'company': person.company,
        'job_title': person.role,
        'tshirt_size': index % 2 === 0 ? 'L' : 'M'
      }
    };
  });
}

// ----------------------------------------------------
// ATTENDEES CRUD & STORAGE
// ----------------------------------------------------

export function getAllAttendees(): EventAttendee[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_ATTENDEES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ATTENDEES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          ...item,
          eventId: String(item.eventId || '1'),
          customAnswers: item.customAnswers || {}
        }));
      }
    }
  } catch (e) {
    console.error('Error loading attendees from storage:', e);
  }

  // Save initial default mock items if none exist
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDEES, JSON.stringify(INITIAL_MOCK_ATTENDEES));
  } catch (e) {}
  return INITIAL_MOCK_ATTENDEES;
}

export function getAttendeesForEvent(eventId: string): EventAttendee[] {
  const all = getAllAttendees();
  const filtered = all.filter(c => String(c.eventId) === String(eventId));
  if (filtered.length > 0) return filtered;

  // If no attendees found for this custom or mock event, generate and save mock attendees so organizers always have data
  const generated = generateMockAttendeesForEvent(eventId);
  const updated = [...generated, ...all];
  saveAllAttendees(updated);
  return generated;
}

export function saveAllAttendees(records: EventAttendee[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDEES, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving attendees:', e);
  }

  // Also sync checkins list to keep checkins store in 1:1 sync
  syncCheckinsFromAttendees(records);

  notifySubscribers();
}

export function addEventAttendee(attendee: Partial<EventAttendee>): EventAttendee {
  const all = getAllAttendees();
  const ticketId = attendee.ticketId || `tk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Check if exists
  const existingIdx = all.findIndex(a => 
    String(a.eventId) === String(attendee.eventId) && 
    (a.ticketId.toLowerCase() === ticketId.toLowerCase() || a.id === attendee.id)
  );

  const newAttendee: EventAttendee = {
    id: attendee.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketId: ticketId,
    orderId: attendee.orderId || `ord_${Date.now()}`,
    eventId: String(attendee.eventId || '1'),
    firstName: attendee.firstName || (attendee.attendeeName ? attendee.attendeeName.split(' ')[0] : 'Attendee'),
    lastName: attendee.lastName || (attendee.attendeeName ? attendee.attendeeName.split(' ').slice(1).join(' ') : ''),
    attendeeName: attendee.attendeeName || `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Attendee',
    email: attendee.email || 'attendee@pasopkan.la',
    phone: attendee.phone || '',
    ticketType: attendee.ticketType || 'Standard Pass',
    tierId: attendee.tierId,
    zone: attendee.zone || 'General Access',
    seat: attendee.seat || 'Seat 1',
    price: attendee.price || '0 LAK',
    purchaseDate: attendee.purchaseDate || new Date().toISOString(),
    isCheckedIn: !!attendee.isCheckedIn,
    checkedInTime: attendee.checkedInTime,
    checkedInTimestamp: attendee.checkedInTimestamp,
    staffLabel: attendee.staffLabel,
    customAnswers: attendee.customAnswers || {}
  };

  let updated: EventAttendee[];
  if (existingIdx >= 0) {
    updated = [...all];
    updated[existingIdx] = { ...all[existingIdx], ...newAttendee };
  } else {
    updated = [newAttendee, ...all];
  }

  saveAllAttendees(updated);
  return newAttendee;
}

export function updateAttendeeCheckinStatus(
  ticketIdOrId: string, 
  isCheckedIn: boolean, 
  staffLabel: string = 'Staff Scanner'
): EventAttendee | null {
  const all = getAllAttendees();
  const index = all.findIndex(a => 
    a.id === ticketIdOrId || 
    a.ticketId.toLowerCase() === ticketIdOrId.toLowerCase()
  );

  if (index === -1) {
    // If not found in attendees, create one from lookup
    return null;
  }

  // Feature: Undo check-in is disabled. Once checked in, tickets remain checked in.
  if (!isCheckedIn && all[index].isCheckedIn) {
    console.warn(`[checkinsStore] Undo check-in is disabled. Ticket ${ticketIdOrId} remains checked in.`);
    return all[index];
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
  
  const updatedRecord: EventAttendee = {
    ...all[index],
    isCheckedIn: isCheckedIn,
    checkedInTime: isCheckedIn ? (all[index].checkedInTime || timeStr) : undefined,
    checkedInTimestamp: isCheckedIn ? (all[index].checkedInTimestamp || Date.now()) : undefined,
    staffLabel: isCheckedIn ? (staffLabel || all[index].staffLabel || 'Staff Gate') : undefined
  };

  const updatedAll = [...all];
  updatedAll[index] = updatedRecord;
  saveAllAttendees(updatedAll);
  return updatedRecord;
}

// ----------------------------------------------------
// CHECKINS COMPATIBILITY & SYNC
// ----------------------------------------------------

function syncCheckinsFromAttendees(attendees: EventAttendee[]): void {
  const checkedInItems: CheckinRecord[] = attendees
    .filter(a => a.isCheckedIn)
    .map(a => ({
      id: a.id,
      ticketId: a.ticketId,
      eventId: String(a.eventId),
      attendeeName: a.attendeeName,
      email: a.email,
      phone: a.phone,
      ticketType: a.ticketType,
      zone: a.zone,
      seat: a.seat,
      price: a.price,
      time: a.checkedInTime || 'Checked In',
      timestamp: a.checkedInTimestamp || Date.now(),
      staffLabel: a.staffLabel || 'Staff Gate'
    }));

  try {
    localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(checkedInItems));
  } catch (e) {}
}

export function getAllCheckins(): CheckinRecord[] {
  if (typeof window === 'undefined') {
    return INITIAL_MOCK_ATTENDEES.filter(a => a.isCheckedIn).map(a => ({
      id: a.id,
      ticketId: a.ticketId,
      eventId: String(a.eventId),
      attendeeName: a.attendeeName,
      email: a.email,
      phone: a.phone,
      ticketType: a.ticketType,
      zone: a.zone,
      seat: a.seat,
      price: a.price,
      time: a.checkedInTime || 'Checked In',
      timestamp: a.checkedInTimestamp || Date.now(),
      staffLabel: a.staffLabel || 'Gate Staff'
    }));
  }

  // First try to load from attendees
  const attendees = getAllAttendees();
  const checkedIn = attendees.filter(a => a.isCheckedIn);
  if (checkedIn.length > 0) {
    return checkedIn.map(a => ({
      id: a.id,
      ticketId: a.ticketId,
      eventId: String(a.eventId),
      attendeeName: a.attendeeName,
      email: a.email,
      phone: a.phone,
      ticketType: a.ticketType,
      zone: a.zone,
      seat: a.seat,
      price: a.price,
      time: a.checkedInTime || 'Checked In',
      timestamp: a.checkedInTimestamp || Date.now(),
      staffLabel: a.staffLabel || 'Gate Staff'
    }));
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_CHECKINS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          ...item,
          eventId: String(item.eventId || '1')
        }));
      }
    }
  } catch (e) {}

  return [];
}

export function getCheckinsForEvent(eventId: string): CheckinRecord[] {
  const all = getAllCheckins();
  return all.filter(c => String(c.eventId) === String(eventId));
}

export function saveAllCheckins(records: CheckinRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving checkins:', e);
  }
  notifySubscribers();
}

export function addCheckinRecord(record: CheckinRecord): CheckinRecord {
  // Update or insert into attendees
  const allAttendees = getAllAttendees();
  const existingAttIdx = allAttendees.findIndex(a => 
    String(a.eventId) === String(record.eventId) && 
    a.ticketId.toLowerCase() === record.ticketId.toLowerCase()
  );

  if (existingAttIdx >= 0) {
    updateAttendeeCheckinStatus(record.ticketId, true, record.staffLabel || 'Staff Gate');
    return {
      ...record,
      id: allAttendees[existingAttIdx].id
    };
  }

  // Create new attendee with checked-in status
  const names = (record.attendeeName || 'Attendee').split(' ');
  const newAttendee = addEventAttendee({
    id: record.id || `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketId: record.ticketId,
    eventId: String(record.eventId),
    firstName: names[0] || 'Attendee',
    lastName: names.slice(1).join(' ') || '',
    attendeeName: record.attendeeName,
    email: record.email,
    phone: record.phone,
    ticketType: record.ticketType,
    zone: record.zone,
    seat: record.seat,
    price: record.price,
    isCheckedIn: true,
    checkedInTime: record.time || new Date().toLocaleTimeString('en-GB', { hour12: false }),
    checkedInTimestamp: record.timestamp || Date.now(),
    staffLabel: record.staffLabel || 'Gate Staff'
  });

  return {
    ...record,
    id: newAttendee.id
  };
}

export function deleteCheckinRecord(id: string): void {
  // Feature: Undo check-in is disabled to preserve check-in audit integrity
  console.warn(`[checkinsStore] Cannot remove check-in record ${id}; undo check-in feature is disabled.`);
}

// ----------------------------------------------------
// SUBSCRIPTIONS & NOTIFICATIONS
// ----------------------------------------------------

function notifySubscribers() {
  if (typeof window === 'undefined') return;

  // 1. Dispatch custom DOM event for same-window components
  window.dispatchEvent(new CustomEvent('pasopkan_checkins_updated'));
  window.dispatchEvent(new CustomEvent('pasopkan_attendees_updated'));

  // 2. Broadcast to other tabs/windows
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CHECKINS_UPDATED', timestamp: Date.now() });
      broadcastChannel.postMessage({ type: 'ATTENDEES_UPDATED', timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }
}

export function subscribeCheckins(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => {
    callback();
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_CHECKINS || e.key === STORAGE_KEY_ATTENDEES) {
      callback();
    }
  };

  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && (e.data.type === 'CHECKINS_UPDATED' || e.data.type === 'ATTENDEES_UPDATED')) {
      callback();
    }
  };

  window.addEventListener('pasopkan_checkins_updated', handleCustomEvent);
  window.addEventListener('pasopkan_attendees_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('pasopkan_checkins_updated', handleCustomEvent);
    window.removeEventListener('pasopkan_attendees_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

// ----------------------------------------------------
// REACT HOOKS
// ----------------------------------------------------

export function useCheckins(eventId?: string) {
  const [allCheckins, setAllCheckins] = useState<CheckinRecord[]>(() => getAllCheckins());

  useEffect(() => {
    setAllCheckins(getAllCheckins());
    const unsubscribe = subscribeCheckins(() => {
      setAllCheckins(getAllCheckins());
    });
    return unsubscribe;
  }, []);

  const eventCheckins = useMemo(() => {
    if (!eventId) return allCheckins;
    return getCheckinsForEvent(eventId);
  }, [allCheckins, eventId]);

  return {
    allCheckins,
    eventCheckins,
    addCheckin: (record: CheckinRecord) => addCheckinRecord(record),
    removeCheckin: (id: string) => deleteCheckinRecord(id),
    scannedCount: eventCheckins.length
  };
}

export function useAttendees(eventId?: string) {
  const [allAttendees, setAllAttendees] = useState<EventAttendee[]>(() => getAllAttendees());

  useEffect(() => {
    setAllAttendees(getAllAttendees());
    const unsubscribe = subscribeCheckins(() => {
      setAllAttendees(getAllAttendees());
    });
    return unsubscribe;
  }, []);

  const eventAttendees = useMemo(() => {
    if (!eventId) return allAttendees;
    return getAttendeesForEvent(eventId);
  }, [allAttendees, eventId]);

  const checkedInAttendees = useMemo(() => {
    return eventAttendees.filter(a => a.isCheckedIn);
  }, [eventAttendees]);

  const pendingAttendees = useMemo(() => {
    return eventAttendees.filter(a => !a.isCheckedIn);
  }, [eventAttendees]);

  const attendeesWithAnswers = useMemo(() => {
    return eventAttendees.filter(a => 
      a.customAnswers && Object.keys(a.customAnswers).length > 0 && 
      Object.values(a.customAnswers).some(v => Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined))
    );
  }, [eventAttendees]);

  return {
    allAttendees,
    eventAttendees,
    checkedInAttendees,
    pendingAttendees,
    attendeesWithAnswers,
    totalCount: eventAttendees.length,
    checkedInCount: checkedInAttendees.length,
    pendingCount: pendingAttendees.length,
    withAnswersCount: attendeesWithAnswers.length,
    addAttendee: (att: Partial<EventAttendee>) => addEventAttendee(att),
    toggleCheckin: (ticketIdOrId: string, currentStatus: boolean, staffLabel?: string) => 
      updateAttendeeCheckinStatus(ticketIdOrId, true, staffLabel),
    setCheckinStatus: (ticketIdOrId: string, status: boolean, staffLabel?: string) => 
      updateAttendeeCheckinStatus(ticketIdOrId, status, staffLabel)
  };
}
