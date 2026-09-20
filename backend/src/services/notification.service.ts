import { logger } from "../utils/logger.ts";

export interface ServerNotification {
  id: string | number;
  title: string;
  titleLo?: string;
  message: string;
  messageLo?: string;
  time: string;
  timeLo?: string;
  type: "upcomingEvent" | "ticket" | "promo" | "verified" | "system" | "noted";
  isUnread: boolean;
  createdAt: string;
}

const SERVER_NOTIFICATIONS: ServerNotification[] = [
  {
    id: "notif-1",
    title: "Upcoming Adventure in Vang Vieng!",
    titleLo: "ການຜະຈົນໄພໃກ້ເຂົ້າມາແລ້ວທີ່ວັງວຽງ!",
    message:
      "Your Nam Ha Trekking starts in 48 hours. Equipment pickup is available at the central hub.",
    messageLo:
      "ການຍ່າງປ່າ ນ້ຳຮາ ຈະເລີ່ມຂຶ້ນໃນອີກ 48 ຊົ່ວໂມງ. ທ່ານສາມາດຮັບອຸປະກອນໄດ້ທີ່ຈຸດບໍລິການສູນກາງ.",
    time: "Just now",
    timeLo: "ດຽວນີ້",
    type: "upcomingEvent",
    isUnread: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notif-2",
    title: "Flash Sale: Mekong Sunset Cruise",
    titleLo: "ໂປຣໂມຊັ່ນດ່ວນ: ລ່ອງເຮືອຊົມຕາເວັນຕົກດິນແມ່ນ້ຳຂອງ",
    message: "Limited 25% discount vouchers released for this weekend evening departures.",
    messageLo: "ບັດສ່ວນຫຼຸດ 25% ຈຳນວນຈຳກັດ ສຳລັບຮອບລ່ອງເຮືອຕອນແລງທ້າຍອາທິດນີ້.",
    time: "20 minutes ago",
    timeLo: "20 ນາທີກ່ອນ",
    type: "promo",
    isUnread: true,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    title: "Ticket Confirmed",
    titleLo: "ຢືນຢັນປີ້ສຳເລັດແລ້ວ",
    message: "Booking #PK-8921 for Vang Vieng Music Festival has been confirmed.",
    messageLo: "ການຈອງ #PK-8921 ສຳລັບ ບຸນດົນຕີ ວັງວຽງ ໄດ້ຮັບການຢືນຢັນແລ້ວ.",
    time: "2 hours ago",
    timeLo: "2 ຊົ່ວໂມງກ່ອນ",
    type: "ticket",
    isUnread: true,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-4",
    title: "New Event Guidelines & Safety",
    titleLo: "ຄູ່ມື ແລະ ມາດຕະຖານຄວາມປອດໄພໃໝ່",
    message:
      "We have updated guidelines for eco-tours and outdoor workshops. Please review them before your trip.",
    messageLo:
      "ພວກເຮົາໄດ້ອັບເດດຄູ່ມືສຳລັບການທ່ອງທ່ຽວແບບອະນຸລັກ ແລະ ເວີກຊັອບກາງແຈ້ງ. ກະລຸນາກວດສອບກ່ອນການເດີນທາງ.",
    time: "5 hours ago",
    timeLo: "5 ຊົ່ວໂມງກ່ອນ",
    type: "noted",
    isUnread: false,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-5",
    title: "Organizer Verification Approved",
    titleLo: "ການຢືນຢັນຕົວຕົນຜູ້ຈັດງານສຳເລັດແລ້ວ",
    message: "Your official Pasopkan verified organizer badge has been activated.",
    messageLo: "ກາໝາຍຜູ້ຈັດງານທີ່ຜ່ານການຢືນຢັນຂອງ Pasopkan ຖືກເປີດໃຊ້ງານແລ້ວ.",
    time: "1 day ago",
    timeLo: "1 ມື້ກ່ອນ",
    type: "verified",
    isUnread: false,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-6",
    title: "System & Network Status",
    titleLo: "ສະຖານະລະບົບ ແລະ ເຄືອຂ່າຍ",
    message:
      "All payment gateways (Phajay, BCEL One, LaoViet Bank) are operating smoothly at 100% uptime.",
    messageLo: "ທຸກຊ່ອງທາງການຊຳລະເງິນ (Phajay, BCEL One, LaoViet Bank) ເຮັດວຽກປົກກະຕິ 100%.",
    time: "2 days ago",
    timeLo: "2 ມື້ກ່ອນ",
    type: "system",
    isUnread: false,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

export async function getLatestNotifications(): Promise<{
  notifications: ServerNotification[];
  lastFetchedAt: string;
}> {
  try {
    // Return the latest notification list with current ISO timestamp
    const now = new Date().toISOString();
    return {
      notifications: [...SERVER_NOTIFICATIONS],
      lastFetchedAt: now,
    };
  } catch (error: unknown) {
    logger.warn("[notification.service] Error getting notifications:", error);
    return {
      notifications: [...SERVER_NOTIFICATIONS],
      lastFetchedAt: new Date().toISOString(),
    };
  }
}
