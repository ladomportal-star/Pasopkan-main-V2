import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// ==========================================
// TYPES DEFINITIONS
// ==========================================

export interface ContactSettings {
  contactUs_en: string;
  contactUs_lo: string;
  contactDesc_en: string;
  contactDesc_lo: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  whatsapp: string; // e.g. "https://wa.me/8562091951529"
  email: string;
  phone: string;
  officeAddress1_en: string;
  officeAddress1_lo: string;
  officeAddress2_en: string;
  officeAddress2_lo: string;
}

export interface FAQItem {
  q_en: string;
  q_lo: string;
  a_en: string;
  a_lo: string;
}

export interface SupportSettings {
  helpSupport_en: string;
  helpSupport_lo: string;
  whatsappNumber: string; // e.g. "8562091951529"
  whatsappLabel_en: string;
  whatsappLabel_lo: string;
  emailAddress: string;
  faqs: FAQItem[];
}

export interface TermSection {
  title_en: string;
  title_lo: string;
  content_en: string;
  content_lo: string;
}

export interface TermsSettings {
  sections: TermSection[];
}

export interface PrivacySection {
  title_en: string;
  title_lo: string;
  content_en: string;
  content_lo: string;
}

export interface PrivacySettings {
  sections: PrivacySection[];
}

// ==========================================
// DEFAULT VALUE FALLBACKS (FROM ORIGINAL CODE)
// ==========================================

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  contactUs_en: 'Contact Us',
  contactUs_lo: 'ຕິດຕໍ່ພວກເຮົາ',
  contactDesc_en: "We'd love to hear from you. Get in touch with us through any of the platforms below or visit our office.",
  contactDesc_lo: 'ພວກເຮົາຢາກໄດ້ຍິນຈາກທ່ານ. ຕິດຕໍ່ຫາພວກເຮົາຜ່ານເວທີໃດໜຶ່ງລຸ່ມນີ້ ຫຼື ເຂົ້າມາຫາພວກເຮົາທີ່ຫ້ອງການ.',
  facebook: 'https://facebook.com/pasopkan',
  instagram: 'https://instagram.com/pasopkan',
  tiktok: 'https://tiktok.com/@pasopkans',
  youtube: 'https://youtube.com/@pasopkan',
  whatsapp: 'https://wa.me/8562091951529',
  email: 'Ladomportal@gmail.com',
  phone: '+856 20 91 951 529',
  officeAddress1_en: 'Buengkhayong Village, Sisattanak district',
  officeAddress1_lo: 'ບ້ານບຶງຂະຫຍອງ, ເມືອງສີສັດຕະນາກ',
  officeAddress2_en: 'Vientiane Capital, Laos',
  officeAddress2_lo: 'ນະຄອນຫຼວງວຽງຈັນ, ລາວ',
};

export const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  helpSupport_en: 'Help & Support',
  helpSupport_lo: 'ຊ່ວຍເຫຼືອ ແລະ ສະໜັບສະໜູນ',
  whatsappNumber: '8562091951529',
  whatsappLabel_en: 'Chat on WhatsApp',
  whatsappLabel_lo: 'ສົນທະນາທາງ WhatsApp',
  emailAddress: 'Ladomportal@gmail.com',
  faqs: [
    {
      q_en: "How do I get a refund?",
      q_lo: "ຂ້ອຍຈະຂໍເງິນຄືນໄດ້ແນວໃດ?",
      a_en: "Refunds can be requested up to 24 hours before the event starts. Go to your Dashboard, select the ticket, and click 'Request Refund'.",
      a_lo: "ສາມາດຂໍເງິນຄືນໄດ້ເຖິງ 24 ຊົ່ວໂມງກ່ອນງານເລີ່ມ. ໄປທີ່ Dashboard ຂອງທ່ານ, ເລືອກປີ້, ແລະກົດ 'ຂໍເງິນຄືນ'."
    },
    {
      q_en: "Where can I find my tickets?",
      q_lo: "ຂ້ອຍຈະຊອກຫາປີ້ຂອງຂ້ອຍໄດ້ຢູ່ໃສ?",
      a_en: "All your purchased tickets are available in the Dashboard tab. You can view the QR code there for entry.",
      a_lo: "ປີ້ທັງໝົດທີ່ທ່ານຊື້ແມ່ນຢູ່ໃນແຖບ Dashboard. ທ່ານສາມາດເບິ່ງ QR code ຢູ່ບ່ອນນັ້ນເພື່ອເຂົ້າງານ."
    },
    {
      q_en: "Can I transfer my ticket to someone else?",
      q_lo: "ຂ້ອຍສາມາດໂອນປີ້ໃຫ້ຄົນອື່ນໄດ້ບໍ?",
      a_en: "Yes, you can transfer tickets to another user via email from the ticket details page.",
      a_lo: "ໄດ້, ທ່ານສາມາດໂອນປີ້ໃຫ້ຜູ້ໃຊ້ອື່ນຜ່ານທາງອີເມວຈາກໜ້າລາຍລະອຽດຂອງປີ້."
    },
    {
      q_en: "How do I create an event?",
      q_lo: "ຂ້ອຍຈະສ້າງກິດຈະກຳໄດ້ແນວໃດ?",
      a_en: "You can create an event by clicking the 'Create Event' button in the navigation bar. You will need to provide event details, location, and ticket information.",
      a_lo: "ທ່ານສາມາດສ້າງກິດຈະກຳໄດ້ໂດຍການຄລິກທີ່ປຸ່ມ 'ສ້າງກິດຈະກຳ' ໃນແຖບນຳທາງ. ທ່ານຈະຕ້ອງໃຫ້ລາຍລະອຽດຂອງກິດຈະກຳ, ສະຖານທີ່, ແລະຂໍ້ມູນປີ້."
    },
    {
      q_en: "Is my payment secure?",
      q_lo: "ການຊຳລະເງິນຂອງຂ້ອຍປອດໄພບໍ?",
      a_en: "Yes, we use industry-standard encryption and secure payment gateways to process all transactions.",
      a_lo: "ແມ່ນແລ້ວ, ພວກເຮົາໃຊ້ການເຂົ້າລະຫັດມາດຕະຖານອຸດສາຫະກຳ ແລະ ປະຕູການຊຳລະເງິນທີ່ປອດໄພເພື່ອປະມວນຜົນທຸລະກຳທັງໝົດ."
    }
  ]
};

export const DEFAULT_TERMS_SETTINGS: TermsSettings = {
  sections: [
    {
      title_en: '1. Welcome to Pasopkan',
      title_lo: '1. ຍິນດີຕ້ອນຮັບສູ່ Pasopkan',
      content_en: 'Welcome to pasopkan, the premier event listing and booking platform in Laos. By accessing or using our services, website, or applications, you agree to comply with and be bound by these Terms & Conditions. Please read them carefully.',
      content_lo: 'ຍິນດີຕ້ອນຮັບສູ່ pasopkan, ແພລດຟອມລາຍການ ແລະ ຈອງປີ້ກິດຈະກຳຊັ້ນນຳໃນ ສປປ ລາວ. ໂດຍການເຂົ້າເຖິງ ຫຼື ນຳໃຊ້ບໍລິການ, ເວັບໄຊ ຫຼື ແອັບພລິເຄຊັນຂອງພວກເຮົາ, ທ່ານຕົກລົງທີ່ຈະປະຕິບັດຕາມ ແລະ ຜູກພັນກັບເງື່ອນໄຂ ແລະ ຂໍ້ກຳນົດເຫຼົ່ານີ້. ກະລຸນາອ່ານຢ່າງລະອຽດ.'
    },
    {
      title_en: '2. User Accounts',
      title_lo: '2. ບັນຊີຜູ້ໃຊ້',
      content_en: 'To access certain features of the platform, including purchasing tickets or creating events, you must register for an account. You agree to provide accurate, current, and complete information and maintain the security of your account credentials.',
      content_lo: 'ເພື່ອເຂົ້າເຖິງຄຸນສົມບັດບາງຢ່າງຂອງແພລດຟອມ, ລວມທັງການຊື້ປີ້ ຫຼື ການສ້າງກິດຈະກຳ, ທ່ານຕ້ອງລົງທະບຽນບັນຊີ. ທ່ານຕົກລົງທີ່ຈະໃຫ້ຂໍ້ມູນທີ່ຖືກຕ້ອງ, ເປັນປັດຈຸບັນ, ແລະ ຄົບຖ້ວນ ແລະ ຮັກສາຄວາມປອດໄພຂອງຂໍ້ມູນເຂົ້າສູ່ລະບົບຂອງທ່ານ.'
    },
    {
      title_en: '3. Event Tickets & Booking',
      title_lo: '3. ປີ້ກິດຈະກຳ ແລະ ການຈອງ',
      content_en: 'All ticket prices are set by the respective event organizers. Ticket purchases are secure and processed through authorized channels. Refunds may be requested up to 24 hours prior to the event starting time, subject to the organizer\'s approval and our standard refund policy.',
      content_lo: 'ລາຄາປີ້ທັງໝົດແມ່ນກຳນົດໂດຍຜູ້ຈັດກິດຈະກຳ. การຊື້ປີ້ແມ່ນມີຄວາມປອດໄພ ແລະ ປະມວນຜົນຜ່ານຊ່ອງທາງທີ່ໄດ້ຮັບອະນຸຍາດ. ທ່ານສາມາດຮ້ອງຂໍເງິນຄືນໄດ້ເຖິງ 24 ຊົ່ວໂມງກ່ອນເວລາເລີ່ມກິດຈະກຳ, ໂດຍຂຶ້ນກັບການອະນຸມັດຂອງຜູ້ຈັດງານ ແລະ ນະໂຍບາຍການຄືນເງິນມາດຕະຖານຂອງພວກເຮົາ.'
    },
    {
      title_en: '4. Event Organizer Responsibilities',
      title_lo: '4. ຄວາມຮັບຜິດຊອບຂອງຜູ້ຈັດກິດຈະກຳ',
      content_en: 'Event organizers are solely responsible for the planning, execution, safety, and representation of their events. Pasopkan acts strictly as a platform connecting attendees with organizers and does not assume liability for event cancellations, changes, or safety incidents.',
      content_lo: 'ຜູ້ຈັດງານມີໜ້າທີ່ຮັບຜິດຊອບແຕ່ພຽງຜູ້ດຽວໃນການວາງແຜນ, ການຈັດງານ, ຄວາມປອດໄພ ແລະ ການນຳສະເໜີກິດຈະກຳຂອງພວກເຂົາ. Pasopkan ເຮັດໜ້າທີ່ເປັນພຽງແພລດຟອມເຊື່ອມຕໍ່ລະຫວ່າງຜູ້ເຂົ້າຮ່ວມ ແລະ ຜູ້ຈັດງານເທົ່ານັ້ນ ແລະ ບໍ່ຮັບຜິດຊອບຕໍ່ການຍົກເລີກ, ການປ່ຽນແປງ ຫຼື ອຸບັດຕິເຫດໃດໆ.'
    },
    {
      title_en: '5. Prohibited Conduct',
      title_lo: '5. ຂໍ້ຫ້າມໃນການນຳໃຊ້',
      content_en: 'Users are prohibited from listing fraudulent events, uploading abusive or copyrighted materials, scraping data, or using the service for any illegal activities within the Lao People\'s Democratic Republic.',
      content_lo: 'ຫ້າມບໍ່ໃຫ້ຜູ້ໃຊ້ລົງລາຍການກິດຈະກຳປອມ, ອັບໂຫຼດເນື້ອຫາທີ່ລະເມີດລິຂະສິດ ຫຼື ບໍ່ເໝາະສົມ, ຫຼື ນຳໃຊ້ບໍລິການເພື່ອຈຸດປະສົງທີ່ຜິດຕໍ່ກົດໝາຍຂອງ ສປປ ລາວ.'
    }
  ]
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  sections: [
    {
      title_en: '1. Information We Collect',
      title_lo: '1. ຂໍ້ມູນທີ່ພວກເຮົາເກັບກຳ',
      content_en: 'We collect personal information that you provide to us directly, such as your name, email address, phone number, and account details when registering or booking tickets. We may also collect device usage data to optimize website performance.',
      content_lo: 'ພວກເຮົາເກັບກຳຂໍ້ມູນສ່ວນຕົວທີ່ທ່ານສະໜອງໃຫ້ພວກເຮົາໂດຍກົງ ເຊັ່ນ: ຊື່, ທີ່ຢູ່ອີເມວ, ເບີໂທລະສັບ ແລະ ລາຍລະອຽດບັນຊີໃນເວລາລົງທະບຽນ ຫຼື ຈອງປີ້. ພວກເຮົາຍັງອາດເກັບກຳຂໍ້ມູນການນຳໃຊ້ອຸປະກອນເພື່ອປັບປຸງປະສິດທິພາບເວັບໄຊ.'
    },
    {
      title_en: '2. How We Use Your Information',
      title_lo: '2. ວິທີທີ່ພວກເຮົານຳໃຊ້ຂໍ້ມູນຂອງທ່ານ',
      content_en: 'Your information is used to facilitate booking transactions, deliver electronic tickets (via QR codes), verify identities at event entrances, communicate updates about your events, and provide customer support.',
      content_lo: 'ຂໍ້ມູນຂອງທ່ານຖືກນຳໃຊ້ເພື່ອອຳນວຍຄວາມສະດວກໃນການຈອງປີ້, ສົ່ງປີ້ເອເລັກໂຕຣນິກ (QR Code), ກວດສອບຕົວຕົນຢູ່ທາງເຂົ້າງານ, ແຈ້ງເຕືອນການອັບເດດກ່ຽວກັບກິດຈະກຳ ແລະ ໃຫ້ການຊ່ວຍເຫຼືອລູກຄ້າ.'
    },
    {
      title_en: '3. Information Sharing',
      title_lo: '3. ການແບ່ງປັນຂໍ້ມູນ',
      content_en: 'We do not sell your personal data. We share only necessary details (e.g., ticket holder name and email) with the respective event organizers for verification and gate management purposes.',
      content_lo: 'ພວກເຮົາບໍ່ເຄີຍຂາຍຂໍ້ມູນສ່ວນຕົວຂອງທ່ານໃຫ້ກັບບຸກຄົນທີສາມ. ພວກເຮົາແບ່ງປັນສະເພາະຂໍ້ມູນທີ່ຈຳເປັນ (ເຊັ່ນ: ຊື່ຜູ້ຖືປີ້ ແລະ ອີເມວ) ໃຫ້ກັບຜູ້ຈັດກິດຈະກຳເພື່ອຈຸດປະສົງໃນການກວດສອບປີ້ ແລະ ຈັດການທາງເຂົ້າງານ.'
    },
    {
      title_en: '4. Data Security',
      title_lo: '4. ຄວາມປອດໄພຂອງຂໍ້ມູນ',
      content_en: 'We prioritize the safety of your information. We implement robust physical and electronic security procedures, including Secure Socket Layer (SSL) encryption, to guard your data against unauthorized access, loss, or alteration.',
      content_lo: 'ພວກເຮົາໃຊ້ການເຂົ້າລະຫັດມາດຕະຖານອຸດສາຫະກຳເພື່ອປົກປ້ອງຂໍ້ມູນຂອງທ່ານຈາກການເຂົ້າເຖິງທີ່ບໍ່ໄດ້ຮັບອະນຸຍາດ.'
    }
  ]
};

// ==========================================
// PERSISTENCE HELPER FUNCTIONS
// ==========================================

// Helper to load settings from Firestore, with LocalStorage and Hardcoded fallbacks
async function getSettings<T>(docId: string, defaultValue: T): Promise<T> {
  try {
    // Try to get from Firestore first
    const docRef = doc(db, 'site_settings', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as T;
      // Backup to localStorage for lightning fast loading
      localStorage.setItem(`pasopkan_setting_${docId}`, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn(`Firestore load failed for site_settings/${docId}:`, error);
  }

  // Fallback to localStorage
  const cached = localStorage.getItem(`pasopkan_setting_${docId}`);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Ignore
    }
  }

  return defaultValue;
}

// Helper to save settings to Firestore and LocalStorage
async function saveSettings<T extends object>(docId: string, data: T): Promise<void> {
  // Save to LocalStorage instantly
  localStorage.setItem(`pasopkan_setting_${docId}`, JSON.stringify(data));

  // Save to Firestore asynchronously
  try {
    const docRef = doc(db, 'site_settings', docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Firestore save failed for site_settings/${docId}:`, error);
    // Even if Firestore fails (no permission or offline), we already persisted locally.
  }
}

// Contact
export async function getContactSettings(): Promise<ContactSettings> {
  return getSettings<ContactSettings>('contact_us', DEFAULT_CONTACT_SETTINGS);
}
export async function saveContactSettings(settings: ContactSettings): Promise<void> {
  await saveSettings<ContactSettings>('contact_us', settings);
}

// Support
export async function getSupportSettings(): Promise<SupportSettings> {
  return getSettings<SupportSettings>('support', DEFAULT_SUPPORT_SETTINGS);
}
export async function saveSupportSettings(settings: SupportSettings): Promise<void> {
  await saveSettings<SupportSettings>('support', settings);
}

// Terms
export async function getTermsSettings(): Promise<TermsSettings> {
  return getSettings<TermsSettings>('terms_conditions', DEFAULT_TERMS_SETTINGS);
}
export async function saveTermsSettings(settings: TermsSettings): Promise<void> {
  await saveSettings<TermsSettings>('terms_conditions', settings);
}

// Privacy
export async function getPrivacySettings(): Promise<PrivacySettings> {
  return getSettings<PrivacySettings>('privacy_policy', DEFAULT_PRIVACY_SETTINGS);
}
export async function savePrivacySettings(settings: PrivacySettings): Promise<void> {
  await saveSettings<PrivacySettings>('privacy_policy', settings);
}
