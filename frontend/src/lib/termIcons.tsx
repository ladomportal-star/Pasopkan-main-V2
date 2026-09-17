import React from 'react';
import {
  FileCheck,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  RefreshCcw,
  Calendar,
  FileText,
  ShieldAlert,
  Globe,
  Award,
  Users,
  Lock,
  Ticket,
  CreditCard,
  Wallet,
  Clock,
  MapPin,
  Sparkles,
  Star,
  Heart,
  Zap,
  Flame,
  Info,
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Tag,
  Gift,
  Trophy,
  Camera,
  Music,
  Video,
  Mic,
  Compass,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Building,
  Landmark,
  Truck,
  Ban,
  Eye,
  BadgePercent,
  Shield,
  UserCheck,
  BookOpen,
  Megaphone,
  ShoppingBag,
  Flag,
  Key,
  Radio,
  Bookmark,
  ThumbsUp,
  Activity,
  Headphones,
  Check,
  QrCode
} from 'lucide-react';

export interface TermIconOption {
  value: string;
  labelEn: string;
  labelLo: string;
  category: 'legal' | 'finance' | 'events' | 'communication' | 'general';
}

export const TERM_ICON_CATEGORIES = [
  { id: 'all', labelEn: 'All Icons', labelLo: 'ທັງໝົດ' },
  { id: 'legal', labelEn: 'Legal & Trust', labelLo: 'ກົດໝາຍ & ຄວາມປອດໄພ' },
  { id: 'finance', labelEn: 'Pricing & Payout', labelLo: 'ການເງິນ & ຄ່າທຳນຽມ' },
  { id: 'events', labelEn: 'Event & Venue', labelLo: 'ງານ & ສະຖານທີ່' },
  { id: 'communication', labelEn: 'Support & Contact', labelLo: 'ການຕິດຕໍ່ & ຊ່ວຍເຫຼືອ' },
  { id: 'general', labelEn: 'Badges & Features', labelLo: 'ຄຸນສົມບັດ & ອື່ນໆ' }
];

export const TERM_ICON_LIST: TermIconOption[] = [
  // Legal & Trust
  { value: 'file-check', labelEn: 'File Check', labelLo: 'ກວດສອບເອກະສານ', category: 'legal' },
  { value: 'shield-check', labelEn: 'Shield Check', labelLo: 'ປອດໄພ & ຢັ້ງຢືນ', category: 'legal' },
  { value: 'shield-alert', labelEn: 'Safety & Security', labelLo: 'ຄວາມປອດໄພ', category: 'legal' },
  { value: 'scale', labelEn: 'Legal Compliance', labelLo: 'ກົດໝາຍ & ລະບຽບການ', category: 'legal' },
  { value: 'lock', labelEn: 'Lock & Privacy', labelLo: 'ຄວາມເປັນສ່ວນຕົວ', category: 'legal' },
  { value: 'key', labelEn: 'Access & Key', labelLo: 'ສິດການເຂົ້າເຖິງ', category: 'legal' },
  { value: 'shield', labelEn: 'Shield Protection', labelLo: 'ການປ້ອງກັນ', category: 'legal' },
  { value: 'user-check', labelEn: 'KYC & Verification', labelLo: 'ຢັ້ງຢືນຕົວຕົນ', category: 'legal' },
  { value: 'ban', labelEn: 'Prohibited / Ban', labelLo: 'ຂໍ້ຫ້າມ & ຂໍ້ຈຳກັດ', category: 'legal' },
  { value: 'alert-triangle', labelEn: 'Caution & Warning', labelLo: 'ຄຳເຕືອນ & ຂໍ້ຄວນລະວັງ', category: 'legal' },
  { value: 'alert-circle', labelEn: 'Notice & Alerts', labelLo: 'ແຈ້ງເຕືອນ', category: 'legal' },

  // Finance & Pricing
  { value: 'dollar-sign', labelEn: 'Fee & Pricing', labelLo: 'ຄ່າທຳນຽມ & ລາຄາ', category: 'finance' },
  { value: 'credit-card', labelEn: 'Credit Card / Payment', labelLo: 'ການຊຳລະເງິນ', category: 'finance' },
  { value: 'wallet', labelEn: 'Wallet & Payouts', labelLo: 'ກະເປົາເງິນ & ການຖອນ', category: 'finance' },
  { value: 'refresh-ccw', labelEn: 'Refunds & Returns', labelLo: 'ການຄືນເງິນ', category: 'finance' },
  { value: 'badge-percent', labelEn: 'Commission & Discount', labelLo: 'ສ່ວນຫຼຸດ & ຄອມມິດຊັ່ນ', category: 'finance' },
  { value: 'landmark', labelEn: 'Bank & Settlement', labelLo: 'ທະນາຄານ & ການໂອນ', category: 'finance' },
  { value: 'tag', labelEn: 'Ticketing Tier / Tag', labelLo: 'ປ້າຍລາຄາ', category: 'finance' },
  { value: 'shopping-bag', labelEn: 'Sales & Purchases', labelLo: 'ການຂາຍ & ສິນຄ້າ', category: 'finance' },

  // Events & Venue
  { value: 'calendar', labelEn: 'Calendar & Schedule', labelLo: 'ປະຕິທິນ & ຕາຕະລາງ', category: 'events' },
  { value: 'clock', labelEn: 'Timeline & Hours', labelLo: 'ເວລາ & ກຳນົດການ', category: 'events' },
  { value: 'ticket', labelEn: 'Ticket & Admission', labelLo: 'ປີ້ & ການເຂົ້າງານ', category: 'events' },
  { value: 'map-pin', labelEn: 'Venue & Location', labelLo: 'ສະຖານທີ່ຈັດງານ', category: 'events' },
  { value: 'building', labelEn: 'Facility & Hall', labelLo: 'ອາຄານ & ຫ້ອງປະຊຸມ', category: 'events' },
  { value: 'camera', labelEn: 'Media & Photography', labelLo: 'ຮູບພາບ & ສື່ມວນຊົນ', category: 'events' },
  { value: 'video', labelEn: 'Live Stream & Video', labelLo: 'ວິດີໂອ & ຖ່າຍທອດສົດ', category: 'events' },
  { value: 'music', labelEn: 'Music & Concert', labelLo: 'ດົນຕີ & ການສະແດງ', category: 'events' },
  { value: 'mic', labelEn: 'Stage & Speaker', labelLo: 'ເວທີ & ວິທະຍາກອນ', category: 'events' },
  { value: 'truck', labelEn: 'Logistics & Transport', labelLo: 'ການຂົນສົ່ງ & ຈັດຕັ້ງ', category: 'events' },
  { value: 'qr-code', labelEn: 'QR Check-in', labelLo: 'ສະແກນ QR ງານ', category: 'events' },

  // Communication & Support
  { value: 'globe', labelEn: 'Community & Global', labelLo: 'ຊຸມຊົນ & ສາກົນ', category: 'communication' },
  { value: 'users', labelEn: 'Attendees & Team', labelLo: 'ຜູ້ເຂົ້າຮ່ວມ & ທີມງານ', category: 'communication' },
  { value: 'message-square', labelEn: 'Chat & Comments', labelLo: 'ການສົນທະນາ', category: 'communication' },
  { value: 'mail', labelEn: 'Email & Inquiries', labelLo: 'ອີເມວ & ສອບຖາມ', category: 'communication' },
  { value: 'phone', labelEn: 'Phone & Hotline', labelLo: 'ເບີໂທ & ສາຍດ່ວນ', category: 'communication' },
  { value: 'help-circle', labelEn: 'Support & FAQs', labelLo: 'ຊ່ວຍເຫຼືອ & FAQ', category: 'communication' },
  { value: 'info', labelEn: 'Guidelines & Info', labelLo: 'ຂໍ້ມູນແນະນຳ', category: 'communication' },
  { value: 'bell', labelEn: 'Broadcast & Notifications', labelLo: 'ການແຈ້ງເຕືອນ', category: 'communication' },
  { value: 'megaphone', labelEn: 'Announcements', labelLo: 'ປະກາດ & ໂຄສະນາ', category: 'communication' },
  { value: 'headphones', labelEn: 'Customer Service', labelLo: 'ບໍລິການລູກຄ້າ', category: 'communication' },

  // Badges & Features
  { value: 'award', labelEn: 'Award & Quality', labelLo: 'ລາງວັນ & ມາດຕະຖານ', category: 'general' },
  { value: 'trophy', labelEn: 'Competition & Prize', labelLo: 'ການແຂ່ງຂັນ & ໄຊຊະນະ', category: 'general' },
  { value: 'sparkles', labelEn: 'Special & VIP', labelLo: 'ພິເສດ & VIP', category: 'general' },
  { value: 'star', labelEn: 'Featured & Rating', labelLo: 'ດາວ & ໂດດເດັ່ນ', category: 'general' },
  { value: 'heart', labelEn: 'Health & Care', labelLo: 'ສຸຂະພາບ & ຄວາມຫ່ວງໃຍ', category: 'general' },
  { value: 'zap', labelEn: 'Instant & Fast', labelLo: 'ວ່ອງໄວ & ທັນທີ', category: 'general' },
  { value: 'flame', labelEn: 'Popular & Hot', labelLo: 'ຍອດນິຍົມ & ມາແຮງ', category: 'general' },
  { value: 'gift', labelEn: 'Perks & Gifts', labelLo: 'ຂອງຂວັນ & ສິດທິພິເສດ', category: 'general' },
  { value: 'file-text', labelEn: 'Document & Terms', labelLo: 'ເອກະສານ & ຂໍ້ກຳນົດ', category: 'general' },
  { value: 'book-open', labelEn: 'Handbook & Rules', labelLo: 'ປຶ້ມຄູ່ມື & ກົດລະບຽບ', category: 'general' },
  { value: 'briefcase', labelEn: 'Business & Professional', labelLo: 'ທຸລະກິດ & ວິຊາຊີບ', category: 'general' },
  { value: 'compass', labelEn: 'Direction & Ethics', labelLo: 'ທິດທາງ & ຈັນຍາບັນ', category: 'general' },
  { value: 'check-circle-2', labelEn: 'Approved & Verified', labelLo: 'ຜ່ານການອະນຸມັດ', category: 'general' },
  { value: 'thumbs-up', labelEn: 'Recommendations', labelLo: 'ການແນະນຳ', category: 'general' },
  { value: 'activity', labelEn: 'Activity & Performance', labelLo: 'ການເຄື່ອນໄຫວ', category: 'general' },
  { value: 'bookmark', labelEn: 'Saved & Bookmark', labelLo: 'ບັນທຶກໄວ້', category: 'general' },
  { value: 'flag', labelEn: 'Flag & Reporting', labelLo: 'ລາຍງານບັນຫາ', category: 'general' },
  { value: 'eye', labelEn: 'Public & Transparency', labelLo: 'ຄວາມໂປ່ງໃສ & ການເບິ່ງເຫັນ', category: 'general' }
];

export function renderTermIcon(iconName?: string, className = "w-5 h-5") {
  switch (iconName) {
    // Legal
    case 'file-check': return <FileCheck className={className} />;
    case 'shield-check': return <ShieldCheck className={className} />;
    case 'shield-alert': return <ShieldAlert className={className} />;
    case 'scale': return <Scale className={className} />;
    case 'lock': return <Lock className={className} />;
    case 'key': return <Key className={className} />;
    case 'shield': return <Shield className={className} />;
    case 'user-check': return <UserCheck className={className} />;
    case 'ban': return <Ban className={className} />;
    case 'alert-triangle': return <AlertTriangle className={className} />;
    case 'alert-circle': return <AlertCircle className={className} />;

    // Finance
    case 'dollar-sign': return <DollarSign className={className} />;
    case 'credit-card': return <CreditCard className={className} />;
    case 'wallet': return <Wallet className={className} />;
    case 'refresh-ccw': return <RefreshCcw className={className} />;
    case 'badge-percent': return <BadgePercent className={className} />;
    case 'landmark': return <Landmark className={className} />;
    case 'tag': return <Tag className={className} />;
    case 'shopping-bag': return <ShoppingBag className={className} />;

    // Events
    case 'calendar': return <Calendar className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'ticket': return <Ticket className={className} />;
    case 'map-pin': return <MapPin className={className} />;
    case 'building': return <Building className={className} />;
    case 'camera': return <Camera className={className} />;
    case 'video': return <Video className={className} />;
    case 'music': return <Music className={className} />;
    case 'mic': return <Mic className={className} />;
    case 'truck': return <Truck className={className} />;
    case 'qr-code': return <QrCode className={className} />;

    // Communication
    case 'globe': return <Globe className={className} />;
    case 'users': return <Users className={className} />;
    case 'message-square': return <MessageSquare className={className} />;
    case 'mail': return <Mail className={className} />;
    case 'phone': return <Phone className={className} />;
    case 'help-circle': return <HelpCircle className={className} />;
    case 'info': return <Info className={className} />;
    case 'bell': return <Bell className={className} />;
    case 'megaphone': return <Megaphone className={className} />;
    case 'headphones': return <Headphones className={className} />;

    // Badges & General
    case 'award': return <Award className={className} />;
    case 'trophy': return <Trophy className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'star': return <Star className={className} />;
    case 'heart': return <Heart className={className} />;
    case 'zap': return <Zap className={className} />;
    case 'flame': return <Flame className={className} />;
    case 'gift': return <Gift className={className} />;
    case 'file-text': return <FileText className={className} />;
    case 'book-open': return <BookOpen className={className} />;
    case 'briefcase': return <Briefcase className={className} />;
    case 'compass': return <Compass className={className} />;
    case 'check-circle-2': return <CheckCircle2 className={className} />;
    case 'thumbs-up': return <ThumbsUp className={className} />;
    case 'activity': return <Activity className={className} />;
    case 'bookmark': return <Bookmark className={className} />;
    case 'flag': return <Flag className={className} />;
    case 'eye': return <Eye className={className} />;
    case 'check': return <Check className={className} />;

    default: return <FileText className={className} />;
  }
}
