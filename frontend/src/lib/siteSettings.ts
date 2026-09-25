import { supabase } from './supabase';

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

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title_en?: string;
  title_lo?: string;
}

export interface HomeHeroSettings {
  mainTitle_en: string;
  mainTitle_lo: string;
  heroSub_en?: string;
  heroSub_lo?: string;
  slideIntervalSeconds: number;
  slides: HeroSlide[];
}

export interface OrganizerTermItem {
  id?: string;
  title_en: string;
  title_lo: string;
  content_en: string;
  content_lo: string;
  icon?: string;
}

export interface OrganizerTermsSettings {
  title_en: string;
  title_lo: string;
  intro_en: string;
  intro_lo: string;
  sections: OrganizerTermItem[];
}

export interface SponsorItem {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  hasSchedule?: boolean;
}

export interface TicketSponsorSettings {
  isEnabled: boolean;
  label_en: string;
  label_lo: string;
  adName?: string;
  adBannerUrl?: string;
  adWebsiteUrl?: string;
  isActive?: boolean;
  hasSchedule?: boolean;
  startDate?: string;
  endDate?: string;
  defaultBannerUrl?: string;
  defaultWebsiteUrl?: string;
  sponsors?: SponsorItem[];
}

export interface ResolvedTicketAd {
  isDisplayed: boolean;
  bannerUrl: string;
  websiteUrl?: string;
  name: string;
  isDefaultFallback: boolean;
  status: 'active_custom' | 'scheduled_future' | 'expired_fallback' | 'inactive_fallback' | 'default_fallback';
  reason?: string;
}

// Falls back to '/Pasopkan ads.png' when expired or no custom ad is active.
export function resolveTicketAd(settings?: TicketSponsorSettings | null): ResolvedTicketAd {
  const DEFAULT_BANNER = '/Pasopkan ads.png';
  const DEFAULT_NAME = 'Pasopkan';
  const DEFAULT_LINK = 'https://pasopkan.com';

  if (!settings || !settings.isEnabled) {
    return {
      isDisplayed: false,
      bannerUrl: DEFAULT_BANNER,
      websiteUrl: DEFAULT_LINK,
      name: DEFAULT_NAME,
      isDefaultFallback: true,
      status: 'default_fallback'
    };
  }

  // Retrieve single custom ad properties (supporting both top-level and first sponsor item)
  const customName = settings.adName || settings.sponsors?.[0]?.name || '';
  const customBannerUrl = settings.adBannerUrl || settings.sponsors?.[0]?.logoUrl || '';
  const customWebsiteUrl = settings.adWebsiteUrl || settings.sponsors?.[0]?.websiteUrl || '';
  const isCustomActive = settings.isActive !== undefined ? settings.isActive : (settings.sponsors?.[0]?.isActive ?? true);
  const hasSchedule = settings.hasSchedule ?? (settings.sponsors?.[0]?.hasSchedule ?? false);
  const startDate = settings.startDate || settings.sponsors?.[0]?.startDate;
  const endDate = settings.endDate || settings.sponsors?.[0]?.endDate;

  const fallbackBanner = settings.defaultBannerUrl || DEFAULT_BANNER;
  const fallbackLink = settings.defaultWebsiteUrl || DEFAULT_LINK;

  // If no custom banner image or custom ad is explicitly disabled:
  if (!customBannerUrl || !isCustomActive) {
    return {
      isDisplayed: true,
      bannerUrl: fallbackBanner,
      websiteUrl: fallbackLink,
      name: DEFAULT_NAME,
      isDefaultFallback: true,
      status: 'inactive_fallback'
    };
  }

  // Check schedule validity
  if (hasSchedule) {
    const now = new Date().getTime();
    
    if (startDate) {
      const startTime = new Date(startDate).getTime();
      if (!isNaN(startTime) && now < startTime) {
        // Not started yet
        return {
          isDisplayed: true,
          bannerUrl: fallbackBanner,
          websiteUrl: fallbackLink,
          name: DEFAULT_NAME,
          isDefaultFallback: true,
          status: 'scheduled_future',
          reason: 'Ad schedule has not started yet'
        };
      }
    }

    if (endDate) {
      const endTime = new Date(endDate).getTime();
      if (!isNaN(endTime) && now > endTime) {
        // Over time / Expired -> Fallback to default Pasopkan ads
        return {
          isDisplayed: true,
          bannerUrl: fallbackBanner,
          websiteUrl: fallbackLink,
          name: DEFAULT_NAME,
          isDefaultFallback: true,
          status: 'expired_fallback',
          reason: 'Ad schedule has expired'
        };
      }
    }
  }

  // Custom ad is active and within schedule!
  return {
    isDisplayed: true,
    bannerUrl: customBannerUrl,
    websiteUrl: customWebsiteUrl,
    name: customName || 'Sponsor Ad',
    isDefaultFallback: false,
    status: 'active_custom'
  };
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
      a_en: "Refunds can be requested up to 48 hours before the event starts. Go to your Dashboard, select the ticket, and click 'Request Refund'.",
      a_lo: "ສາມາດຂໍເງິນຄືນໄດ້ເຖິງ 48 ຊົ່ວໂມງກ່ອນງານເລີ່ມ. ໄປທີ່ Dashboard ຂອງທ່ານ, ເລືອກປີ້, ແລະກົດ 'ຂໍເງິນຄືນ'."
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

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    imageUrl: 'https://images.unsplash.com/photo-1542360663-80149f104730?auto=format&fit=crop&q=80',
    title_en: 'Vang Vieng Hot Air Balloons',
    title_lo: 'ບານລູນ ວັງວຽງ'
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1563725575791-537452d2427a?auto=format&fit=crop&q=80',
    title_en: 'Luang Prabang Alms Giving',
    title_lo: 'ຕັກບາດ ຫຼວງພະບາງ'
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&q=80',
    title_en: 'Vientiane Patuxai Exploration',
    title_lo: 'ປະຕູໄຊ ນະຄອນຫຼວງວຽງຈັນ'
  },
  {
    id: 'slide-4',
    imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80',
    title_en: 'Luang Prabang Kuang Si Falls',
    title_lo: 'ຕາດກວາງຊີ ຫຼວງພະບາງ'
  },
  {
    id: 'slide-5',
    imageUrl: 'https://images.unsplash.com/photo-1579451861283-a2239070aaa9?auto=format&fit=crop&q=80',
    title_en: 'Vang Vieng Kayaking',
    title_lo: 'ພາຍເຮືອຄາຍັກ ວັງວຽງ'
  }
];

export const DEFAULT_HOME_HERO_SETTINGS: HomeHeroSettings = {
  mainTitle_en: 'Your Next Adventure Awaits',
  mainTitle_lo: 'ປະສົບການໃໝ່ໆລໍຖ້າທ່ານຢູ່',
  heroSub_en: 'Discover Great Experiences',
  heroSub_lo: 'ຄົ້ນພົບປະສົບການທີ່ດີເລີດ',
  slideIntervalSeconds: 5,
  slides: DEFAULT_HERO_SLIDES,
};

export const DEFAULT_ORGANIZER_TERMS_SETTINGS: OrganizerTermsSettings = {
  title_en: 'Organizer Terms & Conditions',
  title_lo: 'ຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂສຳລັບຜູ້ຈັດງານ',
  intro_en: 'By creating events on Pasopkan, you agree to the following terms and conditions:',
  intro_lo: 'ໂດຍການສ້າງ event ເທິງ Pasopkan, ທ່ານຕົກລົງເຫັນດີກັບຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂດັ່ງຕໍ່ໄປນີ້:',
  sections: [
    {
      id: 'term-1',
      title_en: 'Information Accuracy',
      title_lo: 'ຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ',
      content_en: 'You are responsible for the accuracy of all event information provided.',
      content_lo: 'ທ່ານຕ້ອງຮັບຜິດຊອບຕໍ່ຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ event ທັງໝົດທີ່ໃຫ້ມາ.',
      icon: 'file-check'
    },
    {
      id: 'term-2',
      title_en: 'Review & Approval',
      title_lo: 'ການກວດສອບ ແລະ ອະນຸມັດ',
      content_en: 'Pasopkan reserves the right to review and approve all events before they are published.',
      content_lo: 'Pasopkan ສະຫງວນສິດໃນການກວດສອບ ແລະ ອະນຸມັດທຸກ event ກ່ອນທີ່ຈະຖືກເຜີຍແຜ່.',
      icon: 'shield-check'
    },
    {
      id: 'term-3',
      title_en: 'Legal Compliance',
      title_lo: 'ການປະຕິບັດຕາມກົດໝາຍ',
      content_en: 'You must comply with all local laws and regulations regarding event organization and ticket sales.',
      content_lo: 'ທ່ານຕ້ອງປະຕິບັດຕາມກົດໝາຍ ແລະ ລະບຽບການທ້ອງຖິ່ນທັງໝົດກ່ຽວກັບການຈັດ event ແລະ ການຂາຍປີ້.',
      icon: 'alert-circle'
    },
    {
      id: 'term-4',
      title_en: 'Processing Fees',
      title_lo: 'ຄ່າທຳນຽມການປະມວນຜົນ',
      content_en: 'Pasopkan will deduct a standard processing fee from all ticket sales.',
      content_lo: 'Pasopkan ຈະຫັກຄ່າທຳນຽມການປະມວນຜົນມາດຕະຖານຈາກການຂາຍປີ້ທັງໝົດ.',
      icon: 'dollar-sign'
    },
    {
      id: 'term-5',
      title_en: 'Cancellations & Refunds',
      title_lo: 'ການຍົກເລີກ ແລະ ການຄືນເງິນ',
      content_en: 'You are responsible for handling any event cancellations or refunds according to your stated policy.',
      content_lo: 'ທ່ານຕ້ອງຮັບຜິດຊອບໃນການຈັດການການຍົກເລີກ event ຫຼື ການຄືນເງິນຕາມນະໂຍບາຍທີ່ທ່ານໄດ້ລະບຸໄວ້.',
      icon: 'refresh-ccw'
    },
    {
      id: 'term-6',
      title_en: 'Payout Schedule',
      title_lo: 'ກຳນົດເວລາການຖອນເງິນ',
      content_en: 'Ticket sale payouts are processed weekly or within 3-5 business days after the successful completion of the event.',
      content_lo: 'ການໂອນເງິນຍອດຂາຍປີ້ຈະຖືກດຳເນີນການເປັນລາຍອາທິດ ຫຼື ພາຍໃນ 3-5 ວັນລັດຖະການຫຼັງຈາກ event ສິ້ນສຸດລົງຢ່າງສຳເລັດ.',
      icon: 'calendar'
    },
    {
      id: 'term-7',
      title_en: 'Content & Copyright',
      title_lo: 'ລິຂະສິດ ແລະ ເນື້ອຫາ',
      content_en: 'You must own or have explicit rights to all media, trademarks, and content uploaded for your event listing.',
      content_lo: 'ທ່ານຕ້ອງເປັນເຈົ້າຂອງ ຫຼື ມີສິດຢ່າງຖືກຕ້ອງໃນການນຳໃຊ້ສື່, ເຄື່ອງໝາຍການຄ້າ ແລະ ເນື້ອຫາທັງໝົດທີ່ອັບໂຫຼດ.',
      icon: 'file-text'
    },
    {
      id: 'term-8',
      title_en: 'Safety & Security',
      title_lo: 'ຄວາມປອດໄພ ແລະ ຄວາມສະຫງົບ',
      content_en: 'Organizers must ensure adequate security, health, and safety protocols are in place for physical attendees.',
      content_lo: 'ຜູ້ຈັດງານຕ້ອງຮັບປະກັນວ່າມີມາດຕະການຮັກສາຄວາມປອດໄພ, ສຸຂະພາບ ແລະ ຄວາມສະຫງົບຮຽບຮ້ອຍທີ່ພຽງພໍ.',
      icon: 'shield-alert'
    },
    {
      id: 'term-9',
      title_en: 'Community Guidelines',
      title_lo: 'ແນວທາງປະຕິບັດ ແລະ ກົດລະບຽບຊຸມຊົນ',
      content_en: 'You must maintain professional conduct and adhere to our community guidelines, promoting respectful interactions with all attendees.',
      content_lo: 'ທ່ານຕ້ອງຮັກສາການປະພຶດທີ່ເປັນມືອາຊີບ ແລະ ປະຕິບັດຕາມແນວທາງຂອງຊຸມຊົນຂອງພວກເຮົາ, ສົ່ງເສີມການພົວພັນທີ່ດີກັບຜູ້ເຂົ້າຮ່ວມທຸກຄົນ.',
      icon: 'globe'
    }
  ]
};

export const DEFAULT_TICKET_SPONSOR_SETTINGS: TicketSponsorSettings = {
  isEnabled: true,
  label_en: 'Sponsored by',
  label_lo: 'ສະໜັບສະໜູນໂດຍ',
  adName: 'LOCA Laos (Official Ride Partner)',
  adBannerUrl: '/Loca banner.png',
  adWebsiteUrl: 'https://loca.la',
  isActive: true,
  hasSchedule: false,
  startDate: '',
  endDate: '',
  defaultBannerUrl: '/Pasopkan ads.png',
  defaultWebsiteUrl: 'https://pasopkan.com',
  sponsors: [
    {
      id: 'sp-loca',
      name: 'LOCA Laos (Official Ride Partner)',
      logoUrl: '/Loca banner.png',
      websiteUrl: 'https://loca.la',
      isActive: true
    }
  ]
};

// ==========================================
// PERSISTENCE HELPER FUNCTIONS
// ==========================================

// Helper to load settings from Supabase, with LocalStorage and Hardcoded fallbacks
async function getSettings<T>(docId: string, defaultValue: T): Promise<T> {
  try {
    // Try to get from Supabase first
    const { data: row, error } = await supabase
      .from('site_settings')
      .select('data')
      .eq('id', docId)
      .single();

    if (row && row.data && !error) {
      const data = row.data as T;
      // Backup to localStorage for lightning fast loading
      localStorage.setItem(`pasopkan_setting_${docId}`, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn(`Supabase load failed for site_settings/${docId}:`, error);
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

// Helper to save settings to Supabase and LocalStorage
async function saveSettings<T extends object>(docId: string, data: T): Promise<void> {
  // Save to LocalStorage instantly
  localStorage.setItem(`pasopkan_setting_${docId}`, JSON.stringify(data));

  // Save to Supabase asynchronously
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: docId, data: data }, { onConflict: 'id' });
      
    if (error) {
      console.error(`Supabase save failed for site_settings/${docId}:`, error);
    }
  } catch (error) {
    console.error(`Supabase save failed for site_settings/${docId}:`, error);
    // Even if Supabase fails (no permission or offline), we already persisted locally.
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

// Organizer Terms & Conditions
export async function getOrganizerTermsSettings(): Promise<OrganizerTermsSettings> {
  return getSettings<OrganizerTermsSettings>('organizer_terms', DEFAULT_ORGANIZER_TERMS_SETTINGS);
}
export async function saveOrganizerTermsSettings(settings: OrganizerTermsSettings): Promise<void> {
  await saveSettings<OrganizerTermsSettings>('organizer_terms', settings);
}

// Home Hero & Slides
export async function getHomeHeroSettings(): Promise<HomeHeroSettings> {
  return getSettings<HomeHeroSettings>('home_hero', DEFAULT_HOME_HERO_SETTINGS);
}
export async function saveHomeHeroSettings(settings: HomeHeroSettings): Promise<void> {
  await saveSettings<HomeHeroSettings>('home_hero', settings);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pasopkan_home_hero_updated', { detail: settings }));
  }
}

// Ticket Sponsors Settings
export async function getTicketSponsorSettings(): Promise<TicketSponsorSettings> {
  return getSettings<TicketSponsorSettings>('ticket_sponsors', DEFAULT_TICKET_SPONSOR_SETTINGS);
}

export async function saveTicketSponsorSettings(settings: TicketSponsorSettings): Promise<void> {
  await saveSettings<TicketSponsorSettings>('ticket_sponsors', settings);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pasopkan_sponsors_updated', { detail: settings }));
  }
}


