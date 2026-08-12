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
}

const STORAGE_KEY = 'pasopkan_checkins';
const BROADCAST_CHANNEL_NAME = 'pasopkan_checkins_channel';

// Default initial check-ins grouped by eventId
const INITIAL_MOCK_CHECKINS: CheckinRecord[] = [
  // --- Event '1': That Luang Festival ---
  {
    id: 'chk_1_1',
    ticketId: 'tk_981245',
    eventId: '1',
    attendeeName: 'Marcus Aurelius',
    email: 'marcus.a@example.com',
    phone: '+856 20 5512 8900',
    ticketType: 'VIP Front Stage',
    zone: 'VIP Row 1',
    seat: 'Seat 4',
    price: '450,000 LAK',
    time: '19:28',
    timestamp: Date.now() - 1000 * 60 * 32,
    staffLabel: 'Gate A Staff'
  },
  {
    id: 'chk_1_2',
    ticketId: 'tk_301984',
    eventId: '1',
    attendeeName: 'Sengdeuan Keo',
    email: 'sengdeuan.k@example.com',
    phone: '+856 20 2234 5678',
    ticketType: 'Standard Zone A',
    zone: 'Zone A Row 10',
    seat: 'Seat 18',
    price: '250,000 LAK',
    time: '19:15',
    timestamp: Date.now() - 1000 * 60 * 45,
    staffLabel: 'Main Gate'
  },
  {
    id: 'chk_1_3',
    ticketId: 'tk_452819',
    eventId: '1',
    attendeeName: 'Liam Neeson',
    email: 'liam.n@example.com',
    phone: '+856 20 9988 7766',
    ticketType: 'General Access Zone B',
    zone: 'Zone B Row 22',
    seat: 'Seat 11',
    price: '150,000 LAK',
    time: '18:45',
    timestamp: Date.now() - 1000 * 60 * 75,
    staffLabel: 'Gate B Staff'
  },
  {
    id: 'chk_1_4',
    ticketId: 'tk_712903',
    eventId: '1',
    attendeeName: 'Khamphoune Vong',
    email: 'khamphoune.v@example.com',
    phone: '+856 20 5566 7788',
    ticketType: 'VIP Front Stage',
    zone: 'VIP Row 2',
    seat: 'Seat 8',
    price: '450,000 LAK',
    time: '18:30',
    timestamp: Date.now() - 1000 * 60 * 90,
    staffLabel: 'VIP Gate'
  },
  {
    id: 'chk_1_5',
    ticketId: 'tk_558120',
    eventId: '1',
    attendeeName: 'Elena Rostova',
    email: 'elena.r@example.com',
    phone: '+856 20 1122 3344',
    ticketType: 'Standard Zone A',
    zone: 'Zone A Row 5',
    seat: 'Seat 12',
    price: '250,000 LAK',
    time: '18:15',
    timestamp: Date.now() - 1000 * 60 * 105,
    staffLabel: 'Main Gate'
  },

  // --- Event '2': Vientiane International Marathon ---
  {
    id: 'chk_2_1',
    ticketId: 'tk_m4201',
    eventId: '2',
    attendeeName: 'Somchai Prasert',
    email: 'somchai.p@example.com',
    phone: '+856 20 5432 1098',
    ticketType: 'Full Marathon 42K',
    zone: 'Starting Gate A',
    seat: 'Bib #4201',
    price: '350,000 LAK',
    time: '05:30',
    timestamp: Date.now() - 1000 * 60 * 180,
    staffLabel: 'Marathon Checkin'
  },
  {
    id: 'chk_2_2',
    ticketId: 'tk_m2104',
    eventId: '2',
    attendeeName: 'Somsack Keobounphanh',
    email: 'somsack.k@example.com',
    phone: '+856 20 2345 6789',
    ticketType: 'Half Marathon 21K',
    zone: 'Starting Gate B',
    seat: 'Bib #2104',
    price: '250,000 LAK',
    time: '05:45',
    timestamp: Date.now() - 1000 * 60 * 165,
    staffLabel: 'Marathon Checkin'
  },
  {
    id: 'chk_2_3',
    ticketId: 'tk_m1089',
    eventId: '2',
    attendeeName: 'Noy Soukaseum',
    email: 'noy.s@example.com',
    phone: '+856 20 9876 5432',
    ticketType: 'Fun Run 10K',
    zone: 'Starting Gate C',
    seat: 'Bib #1089',
    price: '150,000 LAK',
    time: '06:10',
    timestamp: Date.now() - 1000 * 60 * 140,
    staffLabel: 'Fun Run Gate'
  },
  {
    id: 'chk_2_4',
    ticketId: 'tk_m4208',
    eventId: '2',
    attendeeName: 'Linda Taylor',
    email: 'linda.t@example.com',
    phone: '+856 20 3456 7890',
    ticketType: 'Full Marathon 42K',
    zone: 'Starting Gate A',
    seat: 'Bib #4208',
    price: '350,000 LAK',
    time: '05:25',
    timestamp: Date.now() - 1000 * 60 * 185,
    staffLabel: 'VIP Runner Desk'
  },

  // --- Event '3': Lao Fashion Week ---
  {
    id: 'chk_3_1',
    ticketId: 'tk_fw001',
    eventId: '3',
    attendeeName: 'Malee Chanthavong',
    email: 'malee.c@example.com',
    phone: '+856 20 5678 9012',
    ticketType: 'Front Row Runway VIP',
    zone: 'Runway Row A',
    seat: 'Seat A-02',
    price: '600,000 LAK',
    time: '19:00',
    timestamp: Date.now() - 1000 * 60 * 60,
    staffLabel: 'Red Carpet Gate'
  },
  {
    id: 'chk_3_2',
    ticketId: 'tk_fw002',
    eventId: '3',
    attendeeName: 'Natasha Romanoff',
    email: 'natasha.r@example.com',
    phone: '+856 20 6543 2109',
    ticketType: 'Designer Lounge Pass',
    zone: 'VIP Lounge',
    seat: 'Table 04',
    price: '850,000 LAK',
    time: '18:50',
    timestamp: Date.now() - 1000 * 60 * 70,
    staffLabel: 'VIP Lounge Gate'
  },
  {
    id: 'chk_3_3',
    ticketId: 'tk_fw003',
    eventId: '3',
    attendeeName: 'Anousone Vongviseth',
    email: 'anousone.v@example.com',
    phone: '+856 20 7890 1234',
    ticketType: 'Standard Fashion Pass',
    zone: 'Zone B Row 3',
    seat: 'Seat 14',
    price: '300,000 LAK',
    time: '19:12',
    timestamp: Date.now() - 1000 * 60 * 48,
    staffLabel: 'Main Entrance'
  },

  // --- Event '4': Vientiane Music Festival ---
  {
    id: 'chk_4_1',
    ticketId: 'tk_mf101',
    eventId: '4',
    attendeeName: 'Ketsana Soundara',
    email: 'ketsana.s@example.com',
    phone: '+856 20 9012 3456',
    ticketType: 'VIP All-Access Pit',
    zone: 'Stage Pit',
    seat: 'Access #05',
    price: '500,000 LAK',
    time: '17:15',
    timestamp: Date.now() - 1000 * 60 * 120,
    staffLabel: 'Stage Pit Gate'
  },
  {
    id: 'chk_4_2',
    ticketId: 'tk_mf102',
    eventId: '4',
    attendeeName: 'Joey Tribbiani',
    email: 'joey.t@example.com',
    phone: '+856 20 4321 0987',
    ticketType: 'GA Lawn Pass',
    zone: 'Lawn Area',
    seat: 'Standing',
    price: '200,000 LAK',
    time: '17:40',
    timestamp: Date.now() - 1000 * 60 * 95,
    staffLabel: 'General Gate'
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

// Generate fallback mock checkins if an event has none
function generateMockCheckinsForEvent(eventId: string): CheckinRecord[] {
  const names = [
    { name: 'Khamla Phommasone', email: 'khamla.p@example.com', phone: '+856 20 5511 2233' },
    { name: 'Sengaloun Vongphachanh', email: 'sengaloun.v@example.com', phone: '+856 20 2244 6688' },
    { name: 'Anousone Keobounmy', email: 'anousone.k@example.com', phone: '+856 20 9933 1155' },
    { name: 'Chittakone Souk', email: 'chittakone.s@example.com', phone: '+856 20 7711 9922' },
    { name: 'Malee Xaiyavong', email: 'malee.x@example.com', phone: '+856 20 4488 2211' }
  ];

  return names.map((person, index) => ({
    id: `chk_${eventId}_auto_${index + 1}`,
    ticketId: `tk_e${eventId}_00${index + 1}`,
    eventId: String(eventId),
    attendeeName: person.name,
    email: person.email,
    phone: person.phone,
    ticketType: index === 0 ? 'VIP Pass' : index < 3 ? 'Standard Ticket' : 'General Access',
    zone: index === 0 ? 'VIP Zone' : 'Zone A',
    seat: `Row ${index + 1}, Seat ${index * 4 + 2}`,
    price: index === 0 ? '450,000 LAK' : '250,000 LAK',
    time: `${17 + index}:${(10 + index * 12) % 60}`,
    timestamp: Date.now() - (1000 * 60 * (index + 1) * 20),
    staffLabel: 'Gate Staff'
  }));
}

export function getAllCheckins(): CheckinRecord[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_CHECKINS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          ...item,
          eventId: String(item.eventId || '1')
        }));
      }
    }
  } catch (e) {
    console.error('Error loading checkins from storage:', e);
  }

  // Save initial default mock items if none exist
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CHECKINS));
  } catch (e) {}
  return INITIAL_MOCK_CHECKINS;
}

export function getCheckinsForEvent(eventId: string): CheckinRecord[] {
  const all = getAllCheckins();
  const filtered = all.filter(c => String(c.eventId) === String(eventId));
  if (filtered.length > 0) return filtered;

  // If no checkins for this event yet, auto seed and save
  const newMocks = generateMockCheckinsForEvent(String(eventId));
  const updatedAll = [...newMocks, ...all];
  saveAllCheckins(updatedAll);
  return newMocks;
}

export function saveAllCheckins(records: CheckinRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving checkins:', e);
  }

  // Broadcast real-time notification to all tabs & same window
  notifyCheckinSubscribers();
}

export function addCheckinRecord(record: CheckinRecord): CheckinRecord {
  const all = getAllCheckins();
  
  // Prevent duplicate check-in for same ticketId and eventId
  const existing = all.find(c => 
    String(c.eventId) === String(record.eventId) && 
    c.ticketId.toLowerCase() === record.ticketId.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  const newRecord: CheckinRecord = {
    ...record,
    id: record.id || `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId: String(record.eventId),
    timestamp: record.timestamp || Date.now()
  };

  const updated = [newRecord, ...all];
  saveAllCheckins(updated);
  return newRecord;
}

export function deleteCheckinRecord(id: string): void {
  const all = getAllCheckins();
  const updated = all.filter(c => c.id !== id && c.ticketId !== id);
  saveAllCheckins(updated);
}

function notifyCheckinSubscribers() {
  if (typeof window === 'undefined') return;

  // 1. Dispatch custom DOM event for same-window components
  window.dispatchEvent(new CustomEvent('pasopkan_checkins_updated'));

  // 2. Broadcast to other tabs/windows
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CHECKINS_UPDATED', timestamp: Date.now() });
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
    if (e.key === STORAGE_KEY) {
      callback();
    }
  };

  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'CHECKINS_UPDATED') {
      callback();
    }
  };

  window.addEventListener('pasopkan_checkins_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('pasopkan_checkins_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

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
