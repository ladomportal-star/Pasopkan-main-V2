import { useState, useEffect, useMemo } from 'react';
import { safeStorage } from './storage';

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
  visitDate?: string;
  timeSlot?: string;
  isCheckedIn: boolean;
  checkedInTime?: string;
  checkedInTimestamp?: number;
  staffLabel?: string;
  customAnswers: Record<string, string | string[]>;
}

// Versioned keys avoid displaying legacy seeded demo records as real attendees.
const STORAGE_KEY_CHECKINS = 'pasopkan_checkins_v2';
const STORAGE_KEY_ATTENDEES = 'pasopkan_event_attendees_v2';
const BROADCAST_CHANNEL_NAME = 'pasopkan_checkins_channel';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

// ----------------------------------------------------
// ATTENDEES CRUD & STORAGE
// ----------------------------------------------------

export function getAllAttendees(): EventAttendee[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = safeStorage.getItem(STORAGE_KEY_ATTENDEES) || localStorage.getItem(STORAGE_KEY_ATTENDEES);
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

  return [];
}

export function getAttendeesForEvent(eventId: string): EventAttendee[] {
  return getAllAttendees().filter(c => String(c.eventId) === String(eventId));
}

export function saveAllAttendees(records: EventAttendee[]): void {
  if (typeof window === 'undefined') return;
  try {
    safeStorage.setItem(STORAGE_KEY_ATTENDEES, JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving attendees to storage:', e);
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
    visitDate: attendee.visitDate || '',
    timeSlot: attendee.timeSlot || '',
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

export function rescheduleAttendeeBooking(
  ticketIdOrId: string, 
  newDate: string, 
  newTimeSlot: string
): EventAttendee | null {
  const all = getAllAttendees();
  const index = all.findIndex(a => 
    a.id === ticketIdOrId || 
    a.ticketId.toLowerCase() === ticketIdOrId.toLowerCase()
  );

  if (index === -1) {
    return null;
  }

  const updatedRecord: EventAttendee = {
    ...all[index],
    visitDate: newDate,
    timeSlot: newTimeSlot
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
    safeStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(checkedInItems));
  } catch (e) {}
}

export function getAllCheckins(): CheckinRecord[] {
  if (typeof window === 'undefined') return [];

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
    const saved = safeStorage.getItem(STORAGE_KEY_CHECKINS) || localStorage.getItem(STORAGE_KEY_CHECKINS);
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
    safeStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving checkins:', e);
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
      updateAttendeeCheckinStatus(ticketIdOrId, status, staffLabel),
    rescheduleBooking: (ticketIdOrId: string, newDate: string, newTimeSlot: string) =>
      rescheduleAttendeeBooking(ticketIdOrId, newDate, newTimeSlot)
  };
}
