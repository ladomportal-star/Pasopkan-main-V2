import { safeStorage } from './storage';
import { api } from './api';
import { AppNotification } from '../types';

export function notifyOrganizerEventDecision(
  event: { id: string | number; title: string; organizer?: string; organizerEmail?: string; organizerContact?: string },
  decision: 'approved' | 'rejected',
  reason?: string
): AppNotification {
  const isApproved = decision === 'approved';
  const notifId = `notif-evt-${decision}-${event.id}-${Date.now()}`;
  
  const newNotif: AppNotification = {
    id: notifId,
    title: isApproved 
      ? `Event Approved: ${event.title} 🎉` 
      : `Event Rejected: ${event.title} ⚠️`,
    titleLo: isApproved 
      ? `ກິດຈະກຳໄດ້ຮັບການອະນຸມັດ: ${event.title} 🎉` 
      : `ກິດຈະກຳຖືກປະຕິເສດ: ${event.title} ⚠️`,
    message: isApproved
      ? `Congratulations! Your event "${event.title}" has been reviewed and approved by Pasopkan administration. It is now live and published for ticket sales.`
      : `Your event submission "${event.title}" was not approved by administration.${reason ? ` Reason: ${reason}.` : ''} Please update the event information in your organizer dashboard and submit again.`,
    messageLo: isApproved
      ? `ຂໍສະແດງຄວາມຍິນດີ! ກິດຈະກຳ "${event.title}" ຂອງທ່ານໄດ້ຮັບການກວດສອບ ແລະ ອະນຸມັດຈາກແອດມິນແລ້ວ. ຕອນນີ້ກິດຈະກຳຂອງທ່ານໄດ້ຖືກເຜີຍແຜ່ ແລະ ເປີດໃຫ້ຈອງປີ້ໃນ Pasopkan ແລ້ວ.`
      : `ກິດຈະກຳ "${event.title}" ຂອງທ່ານບໍ່ໄດ້ຮັບການອະນຸມັດຈາກແອດມິນ.${reason ? ` ເຫດຜົນ: ${reason}.` : ''} ກະລຸນາກວດສອບ ແລະ ແກ້ໄຂຂໍ້ມູນກິດຈະກຳໃນໜ້າຜູ້ຈັດງານແລ້ວສົ່ງໃໝ່.`,
    type: isApproved ? 'verified' : 'system',
    isUnread: true,
    createdAt: new Date().toISOString(),
    eventId: String(event.id),
    organizerEmail: event.organizerEmail || event.organizerContact || '',
    rejectionReason: reason,
    status: decision,
    link: '/account'
  };

  // 1. Update pasopkan_user_notifications in localStorage
  try {
    const raw = safeStorage.getItem('pasopkan_user_notifications');
    let list: AppNotification[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
      } catch {
        list = [];
      }
    }
    const updated = [newNotif, ...list.filter(n => n.id !== notifId)];
    safeStorage.setItem('pasopkan_user_notifications', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to persist user notification for event decision:', err);
  }

  // 2. Also save to organizer_notifications
  try {
    const orgRaw = safeStorage.getItem('organizer_notifications');
    let orgList: unknown[] = [];
    if (orgRaw) {
      try {
        orgList = JSON.parse(orgRaw);
        if (!Array.isArray(orgList)) orgList = [];
      } catch {
        orgList = [];
      }
    }
    const orgNotif = {
      ...newNotif,
      eventTitle: event.title,
      organizer: event.organizer,
      decision,
      reason
    };
    safeStorage.setItem('organizer_notifications', JSON.stringify([orgNotif, ...orgList]));
  } catch (err) {
    console.error('Failed to persist organizer notification:', err);
  }

  // 3. Dispatch window events for real-time reactivity across components
  try {
    window.dispatchEvent(new CustomEvent('pasopkan_notification_added', { detail: newNotif }));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Ignore window event dispatch errors in restricted runtimes
  }

  // 4. Non-blocking sync to backend server
  try {
    api.createNotification(newNotif).catch(err => {
      console.warn('Backend notification sync error (non-fatal):', err);
    });
  } catch (err) {
    console.warn('Backend notification call error:', err);
  }

  return newNotif;
}
