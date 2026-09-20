import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { Calendar, Undo, Redo, Heading3, FileImage, Folder, FileText, Plus, User, Users, Mail, Phone, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Inbox, Ticket, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Image as ImageIcon, Video, MapPin, Loader2, Trash2, X, Check, QrCode, LogOut, Edit, ShieldCheck, DollarSign, RefreshCcw, FileCheck, BookOpen, AlertCircle, ShieldAlert, ArrowLeft, ArrowRight, Globe, Clock, Settings, Lock, Eye, UploadCloud, ExternalLink, Monitor, Smartphone, CheckCircle2, Sparkles, Paperclip, Search, Quote, Minus, Heading1, Heading2, Link as LinkIcon, Award, Unlink, Superscript, Subscript, Strikethrough, RemoveFormatting, MessageSquare, MessageCircle, Type, Palette, GripVertical, Info, BarChart3, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../lib/storage';
import { api } from '../lib/api';
import { toEventPayload } from '../lib/eventPayload';
import { laosProvinces, getDistrictsForProvince } from '../lib/laosLocations';
import { events } from '../data/events';
import Logo from '../components/Logo';
import { EventMapPicker } from '../components/EventMapPicker';
import { ScrollTimePicker } from '../components/ScrollTimePicker';
import { FlexibleDatePicker } from '../components/FlexibleDatePicker';
import { CalendarPicker } from '../components/CalendarPicker';
import { DateInputDDMMYYYY, formatToDDMMYYYY, parseDDMMYYYYToDate } from '../components/DateInputDDMMYYYY';
import { AdaptiveImage } from '../components/AdaptiveImage';
import EventDetails from './EventDetails';
import SocialLinksForm, { SocialLinks } from '../components/SocialLinksForm';
import {
  getOrganizerTermsSettings,
  OrganizerTermsSettings,
  DEFAULT_ORGANIZER_TERMS_SETTINGS,
  getSupportSettings,
  SupportSettings,
  DEFAULT_SUPPORT_SETTINGS
} from '../lib/siteSettings';
import { renderTermIcon } from '../lib/termIcons';
import SEO from '../components/SEO';
import { compressImage } from '../lib/imageCompression';
import OrganizerEventAnalytics from '../components/OrganizerEventAnalytics';
import EventDetailGraphSection from '../components/EventDetailGraphSection';

const PAYMENT_BANKS = [
  { value: 'BCEL', labelEn: 'BCEL Bank', labelLo: 'BCEL Bank (ທະນາຄານ ການຄ້າຕ່າງປະເທດລາວ)' },
  { value: 'JDB', labelEn: 'JDB Bank', labelLo: 'JDB Bank (ທະນາຄານ ພັດທະນາຮ່ວມ)' },
  { value: 'LDB', labelEn: 'LDB Bank', labelLo: 'LDB Bank (ທະນາຄານ ພັດທະນາລາວ)' },
  { value: 'Indochina Bank', labelEn: 'Indochina Bank', labelLo: 'Indochina Bank (ທະນາຄານ ອິນໂດຈີນ)' },
  { value: 'ST Bank', labelEn: 'ST Bank', labelLo: 'ST Bank (ທະນາຄານ ເອັສທີ)' },
];

const translations = {
  en: {
    organizerCenter: 'Organizer Center',
    myEvents: 'My Events',
    payouts: 'Payout Bills',
    payoutsEmpty: 'No payout bills yet.',
    totalReceived: 'Total Received',
    reports: 'Reports',
    terms: 'Terms & Conditions',
    language: 'Language',
    createEvent: 'Create Event',
    account: 'Account',
    step1: 'Event Info',
    step2: 'Time & Tickets',
    step3: 'Settings',
    step4: 'Payment Info',
    save: 'Save as Draft',
    saving: 'Saving...',
    saved: 'Saved!',
    lastSaved: 'Last saved: ',
    continue: 'Continue',
    publish: 'Publish Event',
    successTitle: 'Event Created Successfully!',
    successDesc: 'Your event has been submitted and is now pending approval from the admin. You will be notified once it is live.',
    goToDashboard: 'Go to Dashboard',
    uploadImages: 'Upload Images',
    viewImageLocations: 'View image display locations',
    addEventImageOther: 'Add event image for\nother locations',
    addEventBgImage: 'Add event background image',
    eventName: 'Event Name',
    eventAddress: 'Event Address',
    offline: 'Offline',
    online: 'Online',
    venueName: 'Venue Name',
    province: 'Province',
    district: 'District',
    location: 'Location',
    locationPlaceholder: 'Enter location name',
    eventCategory: 'Event Category',
    pleaseSelect: 'Please select',
    concert: 'Concert',
    sports: 'Adventure and Tour',
    workshop: 'Workshops',
    festival: 'Festivals',
    voucher: 'Voucher and Booking',
    eventInfo: 'Event Information',
    sampleTitle: 'Template: Event Details',
    sampleDesc: 'What the event is about, highlights, and reasons not to miss it',
    sampleActivity: 'Activities: ......',
    sampleLocationTime: 'Location & Time: ......',
    sampleRequirements: 'What to bring: .....',
    sampleProhibitions: 'Restrictions: .......',
    intro: 'Event Introduction:',
    introPlaceholder: '[Brief summary of the event: Main content, highlights, and reasons why attendees should not miss it]',
    details: 'Event Details:',
    mainProgram: 'Main Program:',
    mainProgramDesc: '[List notable activities during the event: performances, special guests, specific schedule if any.]',
    guests: 'Guests:',
    guestsDesc: '[Information about special guests, artists, speakers attending the event. Can include a brief description of them and what they will bring to the event.]',
    specialExperience: 'Special Experience:',
    specialExperienceDesc: '[If there are other special activities like workshops, experience areas, photo booths, check-in areas or exclusive gifts/offers for attendees.]',
    termsAndConditions: 'Terms and conditions:',
    tncEvent: '[TnC] event',
    childTerms: 'Note on child terms',
    vatTerms: 'Note on VAT terms',
    addOrganizerLogo: 'Add organizer logo',
    organizerName: 'Organizer Name',
    organizerInfo: 'Organizer Information',
    organizerContact: 'Contact Information',
    hcm: 'Ho Chi Minh',
    hn: 'Ha Noi',
    noted: 'NOTED',
    notification1: 'Please do not display contact information of the Organizer (eg: Phone number/ Email/ Website/ Facebook/ Instagram…) on the banner and in the content.',
    notification2: 'In case the Organizer creates or updates the event not in accordance with the above provisions, Pasopkan has the right to refuse to approve the event.',
    notification3: 'Pasopkan will continuously check the information of events being displayed on the platform, if it detects that there is an error related to the image / post content, Pasopkan has the right to remove or refuse to provide the service.',
    notification4: 'If you are organizing a special event, big-scale event, or other unique formats, please direct message our support team.',
    directMessageSupport: 'Direct Message Support',
    ok: 'OK',
    couponsDiscounts: 'Coupons & Discounts',
    offerDiscounts: 'Offer special discounts to your attendees.',
    addCoupon: 'Add Coupon',
    couponCode: 'Coupon Code',
    discountType: 'Discount Type',
    percentage: 'Percentage (%)',
    fixedAmount: 'Fixed Amount (Kip)',
    discount: 'Discount',
    maxDiscountAmount: 'Max Discount Amount',
    maxUses: 'Max Uses',
    maxUsesPerUser: 'Max Uses Per User',
    validUntil: 'Valid Until',
    validFrom: 'Valid From',
    unlimited: 'Unlimited',
    notApplicableFixed: 'Not applicable (Fixed Amount)',
    noCoupons: 'No coupons added yet.',
    couponStatus: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    // New translations for Organizer Center
    totalEvents: 'Total Events',
    totalTicketsSold: 'Total Tickets Sold',
    totalRevenue: 'Total Revenue',
    activeEvents: 'Active Events',
    pastEvents: 'Past Events',
    draftEvents: 'Draft Events',
    status: 'Status',
    sales: 'Sales',
    revenue: 'Revenue',
    actions: 'Actions',
    edit: 'Edit',
    editBlocked: 'Cannot Edit Event',
    editBlockedDesc: 'Organizers cannot edit events or configurations after submission. If you need to make changes or configure this event, please contact system admin on WhatsApp.',
    contactAdminWhatsApp: 'Contact Admin on WhatsApp',
    close: 'Close',
    updateEventSuccessTitle: 'Event Updated Successfully!',
    updateEventSuccessDesc: 'Your event changes have been saved successfully and are pending review.',
    view: 'View',
    eventDetails: 'Event Details',
    delete: 'Delete',
    noEventsFound: 'No events found.',
    createNewEvent: 'Create New Event',
    reportsOverview: 'Reports Overview',
    salesByEvent: 'Sales by Event',
    recentTransactions: 'Recent Transactions',
    date: 'Date',
    customer: 'Customer',
    amount: 'Amount',
    termsTitle: 'Organizer Terms & Conditions',
    termsIntro: 'By creating events on Pasopkan, you agree to the following terms and conditions:',
    termsList1: 'You are responsible for the accuracy of all event information provided.',
    termsList2: 'Pasopkan reserves the right to review and approve all events before they are published.',
    termsList3: 'You must comply with all local laws and regulations regarding event organization and ticket sales.',
    termsList4: 'Pasopkan will deduct a standard processing fee from all ticket sales.',
    termsList5: 'You are responsible for handling any event cancellations or refunds according to your stated policy.',
    termsList6: 'Ticket sale payouts are processed weekly or within 3-5 business days after the successful completion of the event.',
    termsList7: 'You must own or have explicit rights to all media, trademarks, and content uploaded for your event listing.',
    termsList8: 'Organizers must ensure adequate security, health, and safety protocols are in place for physical attendees.',
    termsList9: 'You must maintain professional conduct and adhere to our community guidelines, promoting respectful interactions with all attendees.',
    term1Title: 'Information Accuracy',
    term2Title: 'Review & Approval',
    term3Title: 'Legal Compliance',
    term4Title: 'Processing Fees',
    term5Title: 'Cancellations & Refunds',
    term6Title: 'Payout Schedule',
    term7Title: 'Content & Copyright',
    term8Title: 'Safety & Security',
    term9Title: 'Community Guidelines',
    agreeToTerms: 'I agree to the Organizer Terms & Conditions',
    termsWarning: 'Please read and agree to the terms before creating events.',
    organizerProfile: 'Organizer Profile',
    enableSeating: 'Enable Zone Seating',
    enableSeatingDesc: 'Allow attendees to select seating zones for this event',
    seatingMap: 'Seating Map Image',
    organizerProfileDesc: 'This information will be displayed publicly on your event page.',
    recommendedLogoSize: 'Recommended: 275x275px.\nMax size: 5MB.',
    clickToUpload: 'Click or drag to upload',
    change: 'Change',
    remove: 'Remove',
    startDate: 'Start Date',
    startTime: 'Start Time',
    endDate: 'End Date',
    endTime: 'End Time',
    ticketTiers: 'Ticket Tiers',
    addTier: 'Add Tier',
    tierName: 'Tier Name',
    tierNamePlaceholder: 'e.g. Early Bird, VIP',
    priceWithCurrency: 'Price (Kip)',
    quantity: 'Quantity',
    saleStarts: 'Sale Starts',
    saleEndsOptional: 'Sale Ends',
    showRemainingTickets: 'Show Remaining Tickets',
    showRemainingTicketsDesc: 'Display the number of available tickets on the event page.',
    requireEveryTicketInfo: 'Require Guest Info for Every Ticket',
    requireEveryTicketInfoDesc: 'If disabled, only the buyer\'s information is required even when purchasing multiple tickets.',
    allowRefunds: 'Allow Refunds',
    allowRefundsDesc: 'Let attendees request refunds up to 48 hours before the event starts.',
    maxTicketsPerUser: 'Max Tickets Per User',
    maxTicketsPerUserDesc: 'Limit the number of tickets a single user can purchase.',
    ticketUnit: 'Ticket',
    ticketsUnit: 'Tickets',
    dateType: 'Date Type',
    fixedDate: 'Fixed Date',
    flexibleDate: 'Event Date',
    bookingDate: 'Booking',
    singleDateTypeRule: 'Single Schedule Type Rule',
    singleDateTypeNote: 'An event can only have 1 schedule type: either specific Event Dates or Booking. You cannot create or combine both schedule types in the same event.',
    bookingScheduleDisabledNote: 'Note: Event Dates schedule is currently active. Booking settings are inactive and will not be applied.',
    eventDatesDisabledNote: 'Note: Booking schedule is currently active. Specific Event Dates are inactive and will not be applied.',
    selectEventDateFirstForSaleDates: 'Please select event date(s) above first before setting ticket sale start and end dates.',
    selectEventDateFirstForCoupons: 'Please select event date(s) above first before setting coupon validity start and end dates.',
    selectEventDateFirstPlaceholder: 'Select event date first',
    flexibleDesc: 'Event Date Description',
    flexibleDescPlaceholder: 'e.g. Valid for any day in July, Every weekend',
    flexibleTimeDesc: 'Set the daily operating hours or time slot for this event.',
    bookingSlotCapacity: 'Capacity per Slot (Per 1 Day)',
    bookingSlotCapacityDesc: 'Specify how many attendees or guests you can service in each time slot for 1 single day. Capacity resets fresh for each booked date.',
    capacityPerDayExplainer: 'Capacity is calculated per day: On any date a customer books, each time slot has its own independent capacity limit (resets daily).',
    capacityPerDayBadge: 'Per 1 Day',
    peoplePerSlot: 'people / slot / day',
    peoplePerDayUnit: 'people / day',
    peopleUnit: 'people',
    applyToAllSlots: 'Apply to all slots',
    defaultSlotCapacity: 'Default capacity',
    slotCapacityPlaceholder: 'e.g. 10',
    timeSlotsAndCapacity: 'Time Slots & Daily Service Capacity (Per 1 Day)',
    noBookingSlots: 'No booking slots added yet. Select a time and set capacity to add slots.',
    slotCapacityInputLabel: 'Service Capacity (People per Slot for 1 Day)',
    totalSlotsCount: 'Total Slots',
    totalDailyCapacity: 'Total Capacity (Per 1 Day)',
    paymentInfo: 'Payment Information',
    bankName: 'Bank Name',
    bankNamePlaceholder: 'e.g. BCEL, JDB',
    accountHolderName: 'Account Holder Name',
    accountHolderPlaceholder: 'Name exactly as it appears on the account',
    accountNumber: 'Account Number',
    accountNumberPlaceholder: 'Account Number',
    manageEventsDesc: 'Manage your upcoming and past events.',
    analyticsDesc: 'View detailed analytics and sales reports for your events.',
    mediaLayoutDesigner: 'Media Layout Designer',
    chooseMediaType: 'Choose Media Type',
    imageType: 'Image Block',
    videoType: 'Video Player',
    uploadMediaFile: 'Upload Media File',
    enterUrlFallback: 'Or enter web URL',
    selectLayoutTemplate: 'Select Layout Template',
    layoutFullWidth: 'Full Width Centered',
    layoutFullWidthDesc: 'Large centered media with elegant card framing and custom caption',
    layoutSplit: 'Two Columns (Split)',
    layoutSplitDesc: 'Two images side-by-side or side-by-side media & detail text card',
    layoutFloatingLeft: 'Floating Left',
    layoutFloatingLeftDesc: 'Media aligned to the left with text flowing smoothly around it',
    layoutFloatingRight: 'Floating Right',
    layoutFloatingRightDesc: 'Media aligned to the right with text flowing smoothly around it',
    layoutEditorial: 'Editorial Frame',
    layoutEditorialDesc: 'A framed picture with a bold headline and styled descriptive caption',
    captionLabel: 'Caption Text',
    captionPlaceholder: 'Add a beautiful description for this media...',
    caption2Label: 'Second Caption (for split layout)',
    caption2Placeholder: 'Description for the second image...',
    headingLabel: 'Layout Heading',
    headingPlaceholder: 'Enter heading text...',
    bodyLabel: 'Layout Body Text',
    bodyPlaceholder: 'Enter detailed paragraphs or features description...',
    insertIntoEditor: 'Insert Into Description',
    closeDesigner: 'Cancel',
    uploadingMedia: 'Uploading media...',
    enableTimeSlots: 'Enable Time Slots',
    enableTimeSlotsDesc: 'Allow attendees to pick specific operating hours or session time slots',
    addTimeSlot: 'Add Time Slot',
    timeSlotPlaceholder: 'e.g. 09:00 - 12:00, Afternoon Session, 18:00',
    addedTimeSlots: 'Added Time Slots',
    noTimeSlots: 'No custom time slots added yet. All tickets will be valid for general admission hours.',
    quickPresets: 'Quick Preset Templates',
    quickPresetsDesc: 'Click to instantly add popular session slots:',
    dateValidationError: 'For approval, events must be scheduled at least 14 days (2 weeks) in advance of their start date.',
    previewEvent: 'Preview Event',
    previewNotice: 'Preview Mode: This is how your event page will look to attendees before publication.',
    backToEdit: 'Back to Edit',
    publishFromPreview: 'Publish Event Now',
    eventPrivacy: 'Event Privacy',
    publicEvent: 'Public',
    publicEventDesc: 'Shown on your calendar and eligible to be featured.',
    privateEvent: 'Private',
    privateEventDesc: 'Unlisted. Only people with the link can register.',
    eventMessageForAttendees: 'Event message for attendees',
    eventMessageDesc: 'This event message will be sent to attendees along with their booking confirmation',
    eventMessagePlaceholder: 'Enter message for attendees...',
    pageSettings: 'Page Settings',
  },
  lo: {
    organizerCenter: 'ສູນຜູ້ຈັດງານ',
    myEvents: 'event ຂອງຂ້ອຍ',
    payouts: 'ບິນຮັບເງິນ',
    payoutsEmpty: 'ຍັງບໍ່ມີບິນຮັບເງິນ.',
    totalReceived: 'ຮັບເງິນທັງໝົດ',
    reports: 'ລາຍງານ',
    terms: 'ຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂ',
    language: 'ພາສາ',
    createEvent: 'ສ້າງກິດຈະກຳ',
    account: 'ບັນຊີ',
    step1: 'ຂໍ້ມູນ event',
    step2: 'ເວລາ & ປີ້',
    step3: 'ການຕັ້ງຄ່າ',
    step4: 'ຂໍ້ມູນການຈ່າຍເງິນ',
    save: 'ບັນທຶກເປັນຮ່າງ',
    saving: 'ກຳລັງບັນທຶກ...',
    saved: 'ບັນທຶກແລ້ວ!',
    lastSaved: 'ບັນທຶກລ່າສຸດ: ',
    continue: 'ສືບຕໍ່',
    publish: 'ເຜີຍແຜ່ກິດຈະກຳ',
    successTitle: 'ສ້າງກິດຈະກຳສຳເລັດແລ້ວ!',
    successDesc: 'ກິດຈະກຳຂອງທ່ານຖືກສົ່ງແລ້ວ ແລະ ກຳລັງລໍຖ້າການອະນຸມັດຈາກແອັດມິນ. ທ່ານຈະໄດ້ຮັບແຈ້ງເຕືອນເມື່ອມັນຖືກເຜີຍແຜ່.',
    goToDashboard: 'ໄປທີ່ໜ້າຫຼັກ',
    uploadImages: 'ອັບໂຫຼດຮູບພາບ',
    viewImageLocations: 'ເບິ່ງສະຖານທີ່ສະແດງຮູບພາບ',
    addEventImageOther: 'ເພີ່ມຮູບພາບ event ສຳລັບ\nສະຖານທີ່ອື່ນໆ',
    addEventBgImage: 'ເພີ່ມຮູບພາບພື້ນຫຼັງ event',
    eventName: 'ຊື່ event',
    eventAddress: 'ທີ່ຢູ່ event',
    offline: 'ອອບລາຍ',
    online: 'ອອນລາຍ',
    venueName: 'ຊື່ສະຖານທີ່',
    province: 'ແຂວງ/ນະຄອນ',
    district: 'ເມືອງ',
    location: 'ສະຖານທີ່',
    locationPlaceholder: 'ປ້ອນຊື່ສະຖານທີ່',
    eventCategory: 'ປະເພດ event',
    pleaseSelect: 'ກະລຸນາເລືອກ',
    concert: 'ຄອນເສີດ',
    sports: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ',
    workshop: 'ເວີກຊອບ',
    festival: 'ເທດສະການ',
    voucher: 'Voucher ແລະ ການຈອງ',
    eventInfo: 'ຂໍ້ມູນ event',
    sampleTitle: 'ແບບຢ່າງ: ລາຍລະອຽດກຽວກັບງານ',
    sampleDesc: 'ເນື້ອຫາກກ່ຽວກັບຍັງ, ມີຈຸດເດັ່ນຍັງ ແລະ ເຫດຜົນທີ່ບໍ່ຄວນພາດ',
    sampleActivity: 'ກິດຈະກຳ:......',
    sampleLocationTime: 'ສະຖານທີ່ ເວລາ:......',
    sampleRequirements: 'ສິ່ງຈຳເປັນ:.....',
    sampleProhibitions: 'ຂໍ້ຫ້າມ:.......',
    intro: 'ແນະນຳ event:',
    introPlaceholder: '[ສະຫຼຸບຫຍໍ້ຂອງ event: ເນື້ອໃນຫຼັກ, ຈຸດເດັ່ນ, ແລະ ເຫດຜົນທີ່ຜູ້ເຂົ້າຮ່ວມບໍ່ຄວນພາດ]',
    details: 'ລາຍລະອຽດ event:',
    mainProgram: 'ໂຄງການຫຼັກ:',
    mainProgramDesc: '[ລາຍຊື່ກິດຈະກຳທີ່ໜ້າສົນໃຈໃນລະຫວ່າງ event: ການສະແດງ, ແຂກພິເສດ, ຕາຕະລາງເວລາສະເພາະຖ້າມີ.]',
    guests: 'ແຂກ:',
    guestsDesc: '[ຂໍ້ມູນກ່ຽວກັບແຂກພິເສດ, ນັກສິລະປິນ, ຜູ້ເວົ້າທີ່ເຂົ້າຮ່ວມ event. ສາມາດລວມເອົາຄຳອະທິບາຍສັ້ນໆກ່ຽວກັບພວກເຂົາ ແລະ ສິ່ງທີ່ພວກເຂົາຈະນຳມາສູ່ event.]',
    specialExperience: 'ປະສົບການພິເສດ:',
    specialExperienceDesc: '[ຖ້າມີກິດຈະກຳພິເສດອື່ນໆ ເຊັ່ນ: ເວີກຊອບ, ພື້ນທີ່ປະສົບການ, ຕູ້ຖ່າຍຮູບ, ພື້ນທີ່ເຊັກອິນ ຫຼື ຂອງຂວັນ/ຂໍ້ສະເໜີພິເສດສຳລັບຜູ້ເຂົ້າຮ່ວມ.]',
    termsAndConditions: 'ຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂ:',
    tncEvent: '[TnC] event',
    childTerms: 'ໝາຍເຫດກ່ຽວກັບເງື່ອນໄຂເດັກນ້ອຍ',
    vatTerms: 'ໝາຍເຫດກ່ຽວກັບເງື່ອນໄຂ VAT',
    addOrganizerLogo: 'ເພີ່ມໂລໂກ້ຜູ້ຈັດງານ',
    organizerName: 'ຊື່ຜູ້ຈັດງານ',
    organizerInfo: 'ຂໍ້ມູນຜູ້ຈັດງານ',
    organizerContact: 'ຂໍ້ມູນຕິດຕໍ່',
    hcm: 'ໂຮ່ຈີມິນ',
    hn: 'ຮ່າໂນ້ຍ',
    noted: 'ໝາຍເຫດ',
    notification1: 'ກະລຸນາ ຢ່າສະແດງຂໍ້ມູນຕິດຕໍ່ຂອງຜູ້ຈັດງານ (ເຊັ່ນ: ເບີໂທລະສັບ/ ອີເມວ/ ເວັບໄຊທ໌/ ເຟສບຸກ/ ອິນສະຕາແກຣມ...) ຢູ່ເທິງປ້າຍໂຄສະນາ ແລະ ໃນເນື້ອຫາ.',
    notification2: 'ໃນກໍລະນີທີ່ຜູ້ຈັດງານ ສ້າງ ຫຼື ອັບເດດ event ບໍ່ສອດຄ່ອງກັບຂໍ້ກຳນົດຂ້າງເທິງ, Pasopkan ມີສິດປະຕິເສດການອະນຸມັດ event.',
    notification3: 'Pasopkan ຈະກວດສອບຂໍ້ມູນຂອງ event ທີ່ສະແດງຢູ່ໃນແພລດຟອມຢ່າງຕໍ່ເນື່ອງ, ຖ້າພົບວ່າມີຂໍ້ຜິດພາດກ່ຽວກັບຮູບພາບ / ເນື້ອຫາທີ່ໂພສ, Pasopkan ມີສິດລຶບ ຫຼື ປະຕິເສດການໃຫ້ບໍລິການ.',
    notification4: 'ຫາກເປັນກິດຈະກຳພິເສດ, ງານຂະໜາດໃຫຍ່ (Big Scale) ຫຼື ຮູບແບບອື່ນໆ ກະລຸນາສົ່ງຂໍ້ຄວາມຫາທີມງານຊ່ວຍເຫຼືອ (Support) ໂດຍກົງ.',
    directMessageSupport: 'ສົ່ງຂໍ້ຄວາມຫາ Support',
    ok: 'ຕົກລົງ',
    couponsDiscounts: 'ຄູປອງ & ສ່ວນຫຼຸດ',
    offerDiscounts: 'ສະເໜີສ່ວນຫຼຸດພິເສດໃຫ້ກັບຜູ້ເຂົ້າຮ່ວມຂອງທ່ານ.',
    addCoupon: 'ເພີ່ມຄູປອງ',
    couponCode: 'ລະຫັດຄູປອງ',
    discountType: 'ປະເພດສ່ວນຫຼຸດ',
    percentage: 'ເປີເຊັນ (%)',
    fixedAmount: 'ຈຳນວນເງິນຄົງທີ່ (ກີບ)',
    discount: 'ສ່ວນຫຼຸດ',
    maxDiscountAmount: 'ມູນຄ່າສ່ວນຫຼຸດສູງສຸດ',
    maxUses: 'ນຳໃຊ້ສູງສຸດ',
    maxUsesPerUser: 'ນຳໃຊ້ສູງສຸດຕໍ່ບັນຊີ',
    validUntil: 'ໃຊ້ໄດ້ເຖິງ',
    validFrom: 'ໃຊ້ໄດ້ຕັ້ງແຕ່',
    unlimited: 'ບໍ່ຈຳກັດ',
    notApplicableFixed: 'ບໍ່ຈຳເປັນ (ສ່ວນຫຼຸດຄົງທີ່)',
    noCoupons: 'ຍັງບໍ່ມີຄູປອງ.',
    couponStatus: 'ສະຖານະ',
    active: 'ເປີດໃຊ້',
    inactive: 'ປິດໃຊ້',
    // New translations for Organizer Center
    totalEvents: 'event ທັງໝົດ',
    totalTicketsSold: 'ປີ້ທີ່ຂາຍແລ້ວທັງໝົດ',
    totalRevenue: 'ລາຍຮັບທັງໝົດ',
    activeEvents: 'event ທີ່ກຳລັງດຳເນີນ',
    pastEvents: 'event ທີ່ຜ່ານມາ',
    draftEvents: 'event ຮ່າງ',
    status: 'ສະຖານະ',
    sales: 'ຍອດຂາຍ',
    revenue: 'ລາຍຮັບ',
    actions: 'ການກະທຳ',
    edit: 'ແກ້ໄຂ',
    editBlocked: 'ບໍ່ສາມາດແກ້ໄຂ Event ໄດ້',
    editBlockedDesc: 'ຜູ້ຈັດງານບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນ ຫຼື ຕັ້ງຄ່າ Event ໄດ້ຫຼັງຈາກສົ່ງແລ້ວ. ຖ້າທ່ານຕ້ອງການແກ້ໄຂ ຫຼື ປ່ຽນແປງຂໍ້ມູນ Event, ກະລຸນາຕິດຕໍ່ Admin ຜ່ານ WhatsApp.',
    contactAdminWhatsApp: 'ຕິດຕໍ່ Admin ຜ່ານ WhatsApp',
    close: 'ປິດ',
    updateEventSuccessTitle: 'ອັບເດດ event ສຳເລັດແລ້ວ!',
    updateEventSuccessDesc: 'ການປ່ຽນແປງຂອງ event ໄດ້ຮັບການບັນທຶກສຳເລັດແລ້ວ ແລະ ກຳລັງລໍຖ້າການກວດສອບ.',
    view: 'ເບິ່ງ',
    eventDetails: 'ລາຍລະອຽດ event',
    delete: 'ລຶບ',
    noEventsFound: 'ບໍ່ພົບ event.',
    createNewEvent: 'ສ້າງ event ໃໝ່',
    reportsOverview: 'ພາບລວມລາຍງານ',
    salesByEvent: 'ຍອດຂາຍຕາມ event',
    recentTransactions: 'ທຸລະກຳຫຼ້າສຸດ',
    date: 'ວັນທີ',
    customer: 'ລູກຄ້າ',
    amount: 'ຈຳນວນເງິນ',
    termsTitle: 'ຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂສຳລັບຜູ້ຈັດງານ',
    termsIntro: 'ໂດຍການສ້າງ event ເທິງ Pasopkan, ທ່ານຕົກລົງເຫັນດີກັບຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂດັ່ງຕໍ່ໄປນີ້:',
    termsList1: 'ທ່ານຕ້ອງຮັບຜິດຊອບຕໍ່ຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ event ທັງໝົດທີ່ໃຫ້ມາ.',
    termsList2: 'Pasopkan ສະຫງວນສິດໃນການກວດສອບ ແລະ ອະນຸມັດທຸກ event ກ່ອນທີ່ຈະຖືກເຜີຍແຜ່.',
    termsList3: 'ທ່ານຕ້ອງປະຕິບັດຕາມກົດໝາຍ ແລະ ລະບຽບການທ້ອງຖິ່ນທັງໝົດກ່ຽວກັບການຈັດ event ແລະ ການຂາຍປີ້.',
    termsList4: 'Pasopkan ຈະຫັກຄ່າທຳນຽມການປະມວນຜົນມາດຕະຖານຈາກການຂາຍປີ້ທັງໝົດ.',
    termsList5: 'ທ່ານຕ້ອງຮັບຜິດຊອບໃນການຈັດການການຍົກເລີກ event ຫຼື ການຄືນເງິນຕາມນະໂຍບາຍທີ່ທ່ານໄດ້ລະບຸໄວ້.',
    termsList6: 'ການໂອນເງິນຍອດຂາຍປີ້ຈະຖືກດຳເນີນການເປັນລາຍອາທິດ ຫຼື ພາຍໃນ 3-5 ວັນລັດຖະການຫຼັງຈາກ event ສິ້ນສຸດລົງຢ່າງສຳເລັດ.',
    termsList7: 'ທ່ານຕ້ອງເປັນເຈົ້າຂອງ ຫຼື ມີສິດຢ່າງຖືກຕ້ອງໃນການນຳໃຊ້ສື່, ເຄື່ອງໝາຍການຄ້າ ແລະ ເນື້ອຫາທັງໝົດທີ່ອັບໂຫຼດ.',
    termsList8: 'ຜູ້ຈັດງານຕ້ອງຮັບປະກັນວ່າມີມາດຕະການຮັກສາຄວາມປອດໄພ, ສຸຂະພາບ ແລະ ຄວາມສະຫງົບຮຽບຮ້ອຍທີ່ພຽງພໍ.',
    termsList9: 'ທ່ານຕ້ອງຮັກສາການປະພຶດທີ່ເປັນມືອາຊີບ ແລະ ປະຕິບັດຕາມແນວທາງຂອງຊຸມຊົນຂອງພວກເຮົາ, ສົ່ງເສີມການພົວພັນທີ່ດີກັບຜູ້ເຂົ້າຮ່ວມທຸກຄົນ.',
    term1Title: 'ຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ',
    term2Title: 'ການກວດສອບ ແລະ ອະນຸມັດ',
    term3Title: 'ການປະຕິບັດຕາມກົດໝາຍ',
    term4Title: 'ຄ່າທຳນຽມການປະມວນຜົນ',
    term5Title: 'ການຍົກເລີກ ແລະ ການຄືນເງິນ',
    term6Title: 'ກຳນົດເວລາການຖອນເງິນ',
    term7Title: 'ລິຂະສິດ ແລະ ເນື້ອຫາ',
    term8Title: 'ຄວາມປອດໄພ ແລະ ຄວາມສະຫງົບ',
    term9Title: 'ແນວທາງປະຕິບັດ ແລະ ກົດລະບຽບຊຸມຊົນ',
    agreeToTerms: 'ຂ້າພະເຈົ້າຕົກລົງເຫັນດີກັບຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂສຳລັບຜູ້ຈັດງານ',
    termsWarning: 'ກະລຸນາອ່ານ ແລະ ຕົກລົງເຫັນດີກັບເງື່ອນໄຂກ່ອນທີ່ຈະສ້າງ event.',
    organizerProfile: 'ໂປຣໄຟລ໌ຜູ້ຈັດງານ',
    enableSeating: 'ເປີດໃຊ້ງານການເລືອກໂຊນບ່ອນນັ່ງ',
    enableSeatingDesc: 'ອະນຸຍາດໃຫ້ຜູ້ເຂົ້າຮ່ວມເລືອກໂຊນບ່ອນນັ່ງສຳລັບ event ນີ້',
    seatingMap: 'ຮູບພາບແຜນຜັງບ່ອນນັ່ງ',
    organizerProfileDesc: 'ຂໍ້ມູນນີ້ຈະຖືກສະແດງຕໍ່ສາທາລະນະໃນໜ້າ event ຂອງທ່ານ.',
    recommendedLogoSize: 'ແນະນຳ: 275x275px.\nຂະໜາດສູງສຸດ: 5MB.',
    clickToUpload: 'ຄລິກ ຫຼື ລາກເພື່ອອັບໂຫຼດ',
    change: 'ປ່ຽນ',
    remove: 'ລຶບອອກ',
    startDate: 'ວັນທີເລີ່ມຕົ້ນ',
    startTime: 'ເວລາເລີ່ມຕົ້ນ',
    endDate: 'ວັນທີສິ້ນສຸດ',
    endTime: 'ເວລາສິ້ນສຸດ',
    ticketTiers: 'ປະເພດປີ້',
    addTier: 'ເພີ່ມປະເພດ',
    tierName: 'ຊື່ປະເພດ',
    tierNamePlaceholder: 'ເຊັ່ນ: Early Bird, VIP',
    priceWithCurrency: 'ລາຄາ (ກີບ)',
    quantity: 'ຈຳນວນ',
    saleStarts: 'ເລີ່ມຕົ້ນຂາຍ',
    saleEndsOptional: 'ສິ້ນສຸດການຂາຍ',
    showRemainingTickets: 'ສະແດງຈຳນວນປີ້ທີ່ເຫຼືອ',
    showRemainingTicketsDesc: 'ສະແດງຈຳນວນປີ້ທີ່ຍັງສາມາດຊື້ໄດ້ໃນໜ້າ event.',
    requireEveryTicketInfo: 'ຕ້ອງການຂໍ້ມູນແຂກສຳລັບທຸກໆປີ້',
    requireEveryTicketInfoDesc: 'ຖ້າປິດການນຳໃຊ້, ຈະຕ້ອງການພຽງແຕ່ຂໍ້ມູນຂອງຜູ້ຊື້ເທົ່ານັ້ນ ເຖິງແມ່ນວ່າຈະຊື້ຫຼາຍປີ້ກໍຕາມ.',
    allowRefunds: 'ອະນຸຍາດໃຫ້ຄືນເງິນ',
    allowRefundsDesc: 'ໃຫ້ຜູ້ເຂົ້າຮ່ວມຮ້ອງຂໍຄືນເງິນໄດ້ເຖິງ 48 ຊົ່ວໂມງກ່ອນ event ເລີ່ມຕົ້ນ.',
    maxTicketsPerUser: 'ຈຳນວນປີ້ສູງສຸດຕໍ່ຜູ້ໃຊ້',
    maxTicketsPerUserDesc: 'ຈຳກັດຈຳນວນປີ້ທີ່ຜູ້ໃຊ້ໜຶ່ງຄົນສາມາດຊື້ໄດ້.',
    ticketUnit: 'ປີ້',
    ticketsUnit: 'ປີ້',
    dateType: 'ປະເພດວັນທີ',
    fixedDate: 'ວັນທີຄົງທີ່',
    flexibleDate: 'ວັນທີຈັດງານ',
    bookingDate: 'ການຈອງ',
    singleDateTypeRule: 'ກົດລະບຽບປະເພດວັນທີ (ເລືອກໄດ້ 1 ປະເພດ)',
    singleDateTypeNote: 'ຜູ້ຈັດງານສາມາດສ້າງວັນທີໄດ້ພຽງ 1 ປະເພດເທົ່ານັ້ນ (ວັນທີຈັດງານ ຫຼື ການຈອງ) ບໍ່ສາມາດສ້າງທັງ 2 ປະເພດພ້ອມກັນໃນ event ດຽວກັນໄດ້.',
    bookingScheduleDisabledNote: 'ໝາຍເຫດ: ຕາຕະລາງວັນທີຈັດງານກຳລັງເປີດໃຊ້ງານຢູ່. ການຕັ້ງຄ່າການຈອງຈະບໍ່ຖືກນຳໃຊ້.',
    eventDatesDisabledNote: 'ໝາຍເຫດ: ຕາຕະລາງການຈອງກຳລັງເປີດໃຊ້ງານຢູ່. ວັນທີຈັດງານສະເພາະຈະບໍ່ຖືກນຳໃຊ້.',
    selectEventDateFirstForSaleDates: 'ກະລຸນາເລືອກວັນທີຈັດງານຂ້າງເທິງກ່ອນ ເພື່ອກຳນົດວັນທີເລີ່ມຕົ້ນ ແລະ ສິ້ນສຸດການຂາຍບັດ.',
    selectEventDateFirstForCoupons: 'ກະລຸນາເລືອກວັນທີຈັດງານຂ້າງເທິງກ່ອນ ເພື່ອກຳນົດວັນທີເລີ່ມຕົ້ນ ແລະ ສິ້ນສຸດການນຳໃຊ້ຄູປອງ.',
    selectEventDateFirstPlaceholder: 'ເລືອກວັນທີງານກ່ອນ',
    flexibleDesc: 'ຄຳອະທິບາຍວັນທີຈັດງານ',
    flexibleDescPlaceholder: 'ເຊັ່ນ: ໃຊ້ໄດ້ທຸກມື້ໃນເດືອນກໍລະກົດ, ທຸກໆທ້າຍອາທິດ',
    flexibleTimeDesc: 'ກຳນົດເວລາເປີດບໍລິການປະຈຳວັນ ຫຼື ຊ່ວງເວລາສຳລັບ event ນີ້.',
    bookingSlotCapacity: 'ຈຳນວນຄົນຕໍ່ຮອບ (ສຳລັບ 1 ວັນ)',
    bookingSlotCapacityDesc: 'ກຳນົດຈຳນວນຄົນທີ່ສາມາດຮອງຮັບໄດ້ໃນແຕ່ລະຮອບເວລາສຳລັບ 1 ວັນ. ຄວາມຈຸຈະເລີ່ມນັບໃໝ່ແຍກກັນໃນແຕ່ລະວັນທີ່ລູກຄ້າເລືອກຈອງ.',
    capacityPerDayExplainer: 'ຄວາມຈຸແມ່ນຄິດໄລ່ຕໍ່ 1 ວັນ: ໃນແຕ່ລະວັນທີ່ລູກຄ້າເລືອກຈອງ, ແຕ່ລະຮອບເວລາຈະຮອງຮັບຄົນໄດ້ແຍກຕ່າງຫາກຕາມທີ່ຕັ້ງໄວ້ນີ້.',
    capacityPerDayBadge: 'ຕໍ່ 1 ວັນ',
    peoplePerSlot: 'ຄົນ / ຮອບ / ວັນ',
    peoplePerDayUnit: 'ຄົນ / ວັນ',
    peopleUnit: 'ຄົນ',
    applyToAllSlots: 'ນຳໃຊ້ກັບທຸກຮອບ',
    defaultSlotCapacity: 'ຈຳນວນຄົນເລີ່ມຕົ້ນ',
    slotCapacityPlaceholder: 'ເຊັ່ນ: 10',
    timeSlotsAndCapacity: 'ຮອບເວລາ & ຈຳນວນຄົນທີ່ຮັບໄດ້ຕໍ່ຮອບ (ສຳລັບ 1 ວັນ)',
    noBookingSlots: 'ຍັງບໍ່ມີຮອບເວລາການຈອງ. ເລືອກເວລາ ແລະ ຈຳນວນຄົນຂ້າງເທິງເພື່ອເພີ່ມຮອບ.',
    slotCapacityInputLabel: 'ຈຳນວນຄົນທີ່ຮັບໄດ້ (ຄົນ/ຮອບ ສຳລັບ 1 ວັນ)',
    totalSlotsCount: 'ຮອບທັງໝົດ',
    totalDailyCapacity: 'ຮອງຮັບໄດ້ທັງໝົດ (ຕໍ່ 1 ວັນ)',
    paymentInfo: 'ຂໍ້ມູນການຈ່າຍເງິນ',
    bankName: 'ຊື່ທະນາຄານ',
    bankNamePlaceholder: 'ເຊັ່ນ: BCEL, JDB',
    accountHolderName: 'ຊື່ເຈົ້າຂອງບັນຊີ',
    accountHolderPlaceholder: 'ຊື່ໃຫ້ກົງກັບທີ່ປາກົດໃນບັນຊີ',
    accountNumber: 'ເລກບັນຊີ',
    accountNumberPlaceholder: 'ເລກບັນຊີ',
    manageEventsDesc: 'ຈັດການ event ທີ່ຈະມາເຖິງ ແລະ ທີ່ຜ່ານມາຂອງທ່ານ.',
    analyticsDesc: 'ເບິ່ງລາຍງານການວິເຄາະ ແລະ ການຂາຍສຳລັບ event ຂອງທ່ານ.',
    mediaLayoutDesigner: 'ເຄື່ອງມືອອກແບບເລກເອົາສື່ (ຮູບພາບ ແລະ ວິດີໂອ)',
    chooseMediaType: 'ເລືອກປະເພດສື່',
    imageType: 'ບລັອກຮູບພາບ',
    videoType: 'ວິດີໂອ',
    uploadMediaFile: 'ອັບໂຫຼດໄຟລ໌ສື່',
    enterUrlFallback: 'ຫຼື ປ້ອນລິ້ງ URL ເວັບ',
    selectLayoutTemplate: 'ເລືອກຮູບແບບເລກເອົາ (Layout)',
    layoutFullWidth: 'ກາງໜ້າຈໍແບບເຕັມ',
    layoutFullWidthDesc: 'ສື່ຂະໜາດໃຫຍ່ຢູ່ກາງໜ້າ ພ້ອມກອບບັດທີ່ສວຍງາມ ແລະ ຄຳອະທິບາຍ',
    layoutSplit: 'ສອງຖັນ (ແບ່ງເຄິ່ງ)',
    layoutSplitDesc: 'ຮູບພາບສອງຮູບຄຽງຂ້າງກັນ ຫຼື ສື່ຢູ່ຄຽງຂ້າງກັບບັດຂໍ້ຄວາມ',
    layoutFloatingLeft: 'ລອຍຢູ່ເບື້ອງຊ້າຍ',
    layoutFloatingLeftDesc: 'ສື່ຢູ່ເບື້ອງຊ້າຍ ແລະ ຂໍ້ຄວາມໄຫຼອ້ອມຮອບຢ່າງກົມກືນ',
    layoutFloatingRight: 'ລອຍຢູ່ເບື້ອງຂວາ',
    layoutFloatingRightDesc: 'ສື່ຢູ່ເບື້ອງຂວາ ແລະ ຂໍ້ຄວາມໄຫຼອ້ອມຮອບຢ່າງກົມກືນ',
    layoutEditorial: 'ກອບບັນນາທິການ (Editorial)',
    layoutEditorialDesc: 'ຮູບພາບທີ່ມີກອບທີ່ສວຍງາມ ພ້ອມຫົວຂໍ້ເດັ່ນ ແລະ ຄຳອະທິບາຍລະອຽດ',
    captionLabel: 'ຂໍ້ຄວາມຄຳອະທິບາຍສື່',
    captionPlaceholder: 'ເພີ່ມຄຳອະທິບາຍທີ່ສວຍງາມໃຫ້ກັບສື່ນີ້...',
    caption2Label: 'ຄຳອະທິບາຍທີສອງ (ສຳລັບ Layout ແບ່ງເຄິ່ງ)',
    caption2Placeholder: 'ຄຳອະທິບາຍສຳລັບຮູບທີສອງ...',
    headingLabel: 'ຫົວຂໍ້ Layout',
    headingPlaceholder: 'ປ້ອນຂໍ້ຄວາມຫົວຂໍ້...',
    bodyLabel: 'ເນື້ອໃນລາຍລະອຽດ Layout',
    bodyPlaceholder: 'ປ້ອນເນື້ອໃນລາຍລະອຽດ ຫຼື ຄຳອະທິບາຍເພີ່ມເຕີມ...',
    insertIntoEditor: 'ແຊກເຂົ້າໃນຄຳອະທິບາຍ',
    closeDesigner: 'ຍົກເລີກ',
    uploadingMedia: 'ກຳລັງອັບໂຫຼດສື່...',
    enableTimeSlots: 'ເປີດໃຊ້ງານຊ່ວງເວລາ (Time Slots)',
    enableTimeSlotsDesc: 'ອະນຸຍາດໃຫ້ຜູ້ເຂົ້າຮ່ວມເລືອກຊ່ວງເວລາ ຫຼື ເວລາເປີດບໍລິການສະເພາະ',
    addTimeSlot: 'ເພີ່ມຊ່ວງເວລາ',
    timeSlotPlaceholder: 'ເຊັ່ນ: 09:00 - 12:00, ຮອບບ່າຍ, 18:00',
    addedTimeSlots: 'ຊ່ວງເວລາທີ່ເພີ່ມແລ້ວ',
    noTimeSlots: 'ຍັງບໍ່ທັນມີການເພີ່ມຊ່ວງເວລາເທື່ອ. ປີ້ທັງໝົດຈະໃຊ້ໄດ້ສຳລັບເວລາທົ່ວໄປ.',
    quickPresets: 'ເທມເພດຊ່ວງເວລາດ່ວນ (ຄລິກເພື່ອເພີ່ມ)',
    quickPresetsDesc: 'ຄລິກເພື່ອເພີ່ມຊ່ວງເວລາທີ່ນິຍົມໃຊ້ທັນທີ:',
    dateValidationError: 'ເພື່ອການອະນຸມັດ, ກິດຈະກຳຕ້ອງຖືກກຳນົດເວລາຢ່າງໜ້ອຍ 14 ວັນ (2 ອາທິດ) ລ່ວງໜ້າກ່ອນວັນທີເລີ່ມຕົ້ນ.',
    previewEvent: 'ເບິ່ງຕົວຢ່າງ event',
    previewNotice: 'ໂໝດເບິ່ງຕົວຢ່າງ: ນີ້ແມ່ນຮູບແບບໜ້າ event ຂອງທ່ານທີ່ຈະສະແດງໃຫ້ຜູ້ເຂົ້າຮ່ວມເບິ່ງກ່ອນການເຜີຍແຜ່.',
    backToEdit: 'ກັບໄປແກ້ໄຂ',
    publishFromPreview: 'ເຜີຍແຜ່ event ດຽວນີ້',
    eventPrivacy: 'ຄວາມເປັນສ່ວນຕົວຂອງກິດຈະກຳ',
    publicEvent: 'ສາທາລະນະ',
    publicEventDesc: 'ສະແດງໃນປະຕິທິນຂອງທ່ານ ແລະ ມີສິດໄດ້ຮັບການແນະນຳ.',
    privateEvent: 'ສ່ວນຕົວ',
    privateEventDesc: 'ບໍ່ສະແດງໃນລາຍການ. ເພື່ອນທີ່ມີລິ້ງເທົ່ານັ້ນທີ່ສາມາດລົງທະບຽນໄດ້.',
    eventMessageForAttendees: 'ຂໍ້ຄວາມກິດຈະກຳສຳລັບຜູ້ເຂົ້າຮ່ວມ',
    eventMessageDesc: 'ຂໍ້ຄວາມກິດຈະກຳນີ້ຈະຖືກສົ່ງໄປຫາຜູ້ເຂົ້າຮ່ວມພ້ອມກັບໃບຢັ້ງຢືນການຈອງຂອງພວກເຂົາ',
    eventMessagePlaceholder: 'ປ້ອນຂໍ້ຄວາມສຳລັບຜູ້ເຂົ້າຮ່ວມ...',
    pageSettings: 'ຕັ້ງຄ່າໜ້າ event',
  }
};

const formatNumberWithCommas = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const cleanStr = String(val).replace(/\D/g, '');
  if (!cleanStr) return '';
  return Number(cleanStr).toLocaleString('en-US');
};

const ONLINE_PLATFORMS_LIST = [
  {
    id: 'zoom',
    name: 'Zoom Meeting / Webinar',
    nameLo: 'Zoom (ຊູມ ວິດີໂອ)',
    badge: 'HD Video Call',
    iconBg: 'bg-blue-500 text-white',
    activeBorder: 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20',
    placeholder: 'https://zoom.us/j/9876543210',
    descEn: 'Interactive live video conferencing, breakout rooms, Q&A, and chat',
    descLo: 'ວິດີໂອຄອນເຟີເຣັນຄຸນນະພາບສູງ, ຮອງຮັບ Q&A, ແຍກຫ້ອງປະຊຸມ, ແລະ ແຊັດ',
    icon: Video
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    nameLo: 'Google Meet (ກູເກີລ ມີດ)',
    badge: 'Browser Direct',
    iconBg: 'bg-emerald-600 text-white',
    activeBorder: 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20',
    placeholder: 'https://meet.google.com/abc-defg-hij',
    descEn: 'Instant one-click browser access without app downloads',
    descLo: 'ເຂົ້າຮ່ວມໄດ້ທັນທີຜ່ານ Web Browser ໂດຍບໍ່ຕ້ອງດາວໂຫລດແອັບ',
    icon: Globe
  },
  {
    id: 'ms_teams',
    name: 'Microsoft Teams',
    nameLo: 'Microsoft Teams',
    badge: 'Enterprise',
    iconBg: 'bg-indigo-600 text-white',
    activeBorder: 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20',
    placeholder: 'https://teams.microsoft.com/l/meetup-join/...',
    descEn: 'Professional conferencing for corporate, academic & enterprise events',
    descLo: 'ແພລດຟອມປະຊຸມສຳລັບອົງກອນ, ບໍລິສັດ ແລະ ສຳມະນາທາງວິຊາການ',
    icon: Users
  },
  {
    id: 'custom',
    name: 'Custom Stream / Link',
    nameLo: 'ລິ້ງເວັບໄຊອື່ນໆ / Custom Link',
    badge: 'Direct Stream URL',
    iconBg: 'bg-orange-500 text-white',
    activeBorder: 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20',
    placeholder: 'https://your-custom-domain.com/live-stream',
    descEn: 'Embed your own custom live streaming server or private portal link',
    descLo: 'ລິ້ງເຂົ້າຮ່ວມງານຜ່ານ ເວັບໄຊ ຫຼື Server ຖ່າຍທອດສົດຂອງທ່ານເອງ',
    icon: ExternalLink
  }
];

export interface AttendeeQuestion {
  id: string;
  type: 'text' | 'long_text' | 'single_choice' | 'multi_choice' | 'options' | 'checkbox' | 'url';
  label: string;
  required: boolean;
  options?: string[];
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { lang, toggleLanguage } = useLanguage();
  const t = translations[lang] as unknown as Record<string, string>;
  const currency = lang === 'lo' ? 'ກີບ' : 'Kip';

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState<'Festival' | 'Sports' | 'Workshop' | 'Voucher'>('Festival');
  const [venueName, setVenueName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [mapInputMode, setMapInputMode] = useState<'map' | 'link'>('map');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerInfo, setOrganizerInfo] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerSocialLinks, setOrganizerSocialLinks] = useState<SocialLinks>({});
  const [durationEn, setDurationEn] = useState('');
  const [durationLo, setDurationLo] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Lao', 'English']);
  const [eventType, setEventType] = useState('offline');
  const [onlinePlatform, setOnlinePlatform] = useState<'zoom' | 'google_meet' | 'ms_teams' | 'custom' | string>('zoom');
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState('');
  const [onlinePasscode, setOnlinePasscode] = useState('');
  const [onlineInstructions, setOnlineInstructions] = useState('');
  const [attendeeQuestions, setAttendeeQuestions] = useState<AttendeeQuestion[]>([]);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [dragOverQuestionIndex, setDragOverQuestionIndex] = useState<number | null>(null);

  const moveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= attendeeQuestions.length || fromIdx === toIdx) return;
    const next = [...attendeeQuestions];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    setAttendeeQuestions(next);
  };
  const [dateType, setDateType] = useState('flexible'); // 'fixed' or 'flexible' or 'booking'
  const [flexibleDateDesc, setFlexibleDateDesc] = useState('');
  
  // Booking specific states
  const [bookingAvailableDays, setBookingAvailableDays] = useState<string[]>([]);
  const [bookingTimeSlots, setBookingTimeSlots] = useState<string[]>([]);
  const [bookingSlotCapacities, setBookingSlotCapacities] = useState<Record<string, number>>({});
  const [newBookingTimeSlot, setNewBookingTimeSlot] = useState('');
  const [newBookingSlotCapacity, setNewBookingSlotCapacity] = useState<number>(10);
  const [defaultBookingCapacity, setDefaultBookingCapacity] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'createEvent' | 'analytics' | 'terms'>('analytics');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  


  // Local events state initialized with static events and storage
  const [localEvents, setLocalEvents] = useState<any[]>(() => {
    const saved = safeStorage.getItem('organizer_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map((e: any) => String(e.id)));
          const defaultUniques = events.filter((e: any) => !savedIds.has(String(e.id)));
          return [...parsed, ...defaultUniques];
        }
      } catch (e) {
        console.error(e);
      }
    }
    return events;
  });
  
  // Edit restriction states
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [wasEditing, setWasEditing] = useState(false);
  const [showEditBlockedModal, setShowEditBlockedModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Dynamic Organizer Terms & Conditions from Site Settings
  const [organizerTerms, setOrganizerTerms] = useState<OrganizerTermsSettings>(DEFAULT_ORGANIZER_TERMS_SETTINGS);
  // Dynamic Support Settings for WhatsApp contact
  const [supportSettings, setSupportSettings] = useState<SupportSettings>(DEFAULT_SUPPORT_SETTINGS);

  useEffect(() => {
    async function loadSiteConfig() {
      try {
        const [termsData, supportData] = await Promise.all([
          getOrganizerTermsSettings(),
          getSupportSettings()
        ]);
        if (termsData) {
          setOrganizerTerms(termsData);
        }
        if (supportData) {
          setSupportSettings(supportData);
        }
      } catch (err) {
        console.error('Failed to load organizer terms/support:', err);
      }
    }
    loadSiteConfig();
  }, []);

  const getWhatsAppAdminUrl = (targetEventTitle?: string) => {
    const rawNumber = supportSettings.whatsappNumber || '8562091951529';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const title = targetEventTitle || selectedEvent?.title || eventName;
    const message = title && title.trim()
      ? `Hello Admin, I am an organizer on Pasopkan. I would like to request changes/edit for my event: "${title.trim()}".`
      : `Hello Admin, I am an organizer on Pasopkan. I would like to request assistance with editing/configuring my event.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const getSpecialEventSupportUrl = () => {
    const rawNumber = supportSettings.whatsappNumber || '8562091951529';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const message = lang === 'lo'
      ? `ສະບາຍດີທີມງານ Pasopkan, ຂ້າພະເຈົ້າຕ້ອງການປຶກສາກ່ຽວກັບການຈັດງານພິເສດ / ງານຂະໜາດໃຫຍ່ (Big Scale Event).`
      : `Hello Pasopkan Support, I am an organizer planning a special event / large-scale event and would like assistance.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };


  // Helper to get today's date in YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to get the event's end date (either the latest date in availableDates, or endDate, or startDate)
  const getEventEndDateStr = () => {
    if (dateType === 'flexible' && availableDates && availableDates.length > 0) {
      const validDates = availableDates.map(d => d.date).filter(Boolean);
      if (validDates.length > 0) {
        const sorted = [...validDates].sort();
        return sorted[sorted.length - 1];
      }
    }
    if (endDate) return endDate;
    if (startDate) return startDate;
    return '';
  };

  // Helper to extract missing required fields across steps
  const getMissingFieldsList = () => {
    const list: {
      id: string;
      step: number;
      stepTitleEn: string;
      stepTitleLo: string;
      fieldEn: string;
      fieldLo: string;
      elementId: string;
    }[] = [];

    // --- Step 1: Basic Event Details & Organizer ---
    if (!eventName || !eventName.trim()) {
      list.push({
        id: 'event-name',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'Event Name',
        fieldLo: 'ຊື່ກິດຈະກຳ',
        elementId: 'field-event-name',
      });
    }

    if (!horizontalImage && !verticalImage) {
      list.push({
        id: 'cover-image',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'Main Event Cover Photo',
        fieldLo: 'ຮູບໜ້າປົກກິດຈະກຳ',
        elementId: 'field-cover-image',
      });
    }

    if (eventType === 'offline') {
      if (!venueName || !venueName.trim() || venueName === 'Online Event / ງານອອນລາຍ') {
        list.push({
          id: 'venue-name',
          step: 1,
          stepTitleEn: 'Event Info',
          stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
          fieldEn: 'Venue Name',
          fieldLo: 'ຊື່ສະຖານທີ່ຈັດງານ',
          elementId: 'field-venue-name',
        });
      }
      if (!province || !province.trim() || province === 'Online') {
        list.push({
          id: 'province',
          step: 1,
          stepTitleEn: 'Event Info',
          stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
          fieldEn: 'Province',
          fieldLo: 'ແຂວງ',
          elementId: 'field-province',
        });
      }
      if (!district || !district.trim() || district === 'Online') {
        list.push({
          id: 'district',
          step: 1,
          stepTitleEn: 'Event Info',
          stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
          fieldEn: 'District',
          fieldLo: 'ເມືອງ',
          elementId: 'field-district',
        });
      }
    } else {
      if (!onlineMeetingUrl || !onlineMeetingUrl.trim()) {
        list.push({
          id: 'online-url',
          step: 1,
          stepTitleEn: 'Event Info',
          stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
          fieldEn: 'Online Meeting URL',
          fieldLo: 'ລິ້ງປະຊຸມອອນລາຍ',
          elementId: 'field-online-url',
        });
      }
    }

    if (!organizerName || !organizerName.trim()) {
      list.push({
        id: 'organizer-name',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'Organizer Name',
        fieldLo: 'ຊື່ຜູ້ຈັດງານ',
        elementId: 'field-organizer-name',
      });
    }

    const digitsOnlyPhone = (organizerPhone || '').replace(/\D/g, '');
    if (!organizerPhone || !organizerPhone.trim()) {
      list.push({
        id: 'organizer-phone',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'Organizer Phone Number (Numbers only)',
        fieldLo: 'ເບີໂທຜູ້ຈັດງານ (ຕົວເລກເທົ່ານັ້ນ)',
        elementId: 'field-organizer-phone',
      });
    } else if (digitsOnlyPhone.length < 6) {
      list.push({
        id: 'organizer-phone-invalid',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'Valid Organizer Phone Number (at least 6 digits)',
        fieldLo: 'ເບີໂທຜູ້ຈັດງານທີ່ຖືກຕ້ອງ (ຢ່າງໜ້ອຍ 6 ຕົວເລກ)',
        elementId: 'field-organizer-phone',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!organizerEmail || !organizerEmail.trim()) {
      list.push({
        id: 'organizer-email',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'Organizer Email',
        fieldLo: 'ອີເມວຜູ້ຈັດງານ',
        elementId: 'field-organizer-email',
      });
    } else if (!emailRegex.test(organizerEmail.trim())) {
      list.push({
        id: 'organizer-email-invalid',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'Valid Organizer Email (e.g. name@example.com)',
        fieldLo: 'ອີເມວຜູ້ຈັດງານທີ່ຖືກຕ້ອງ (ຕົວຢ່າງ: name@example.com)',
        elementId: 'field-organizer-email',
      });
    }

    if (!organizerInfo || !organizerInfo.trim()) {
      list.push({
        id: 'organizer-bio',
        step: 1,
        stepTitleEn: 'Event Info',
        stepTitleLo: 'ຂໍ້ມູນກິດຈະກຳ',
        fieldEn: 'About Organizer (Bio)',
        fieldLo: 'ຂໍ້ມູນກ່ຽວກັບຜູ້ຈັດງານ',
        elementId: 'field-organizer-bio',
      });
    }

    // --- Step 2: Time & Tickets ---
    const minAdvanceDate = new Date();
    minAdvanceDate.setHours(0, 0, 0, 0);
    minAdvanceDate.setDate(minAdvanceDate.getDate() + 5);

    if (dateType === 'booking') {
      if (!bookingAvailableDays || bookingAvailableDays.length === 0) {
        list.push({
          id: 'booking-days-empty',
          step: 2,
          stepTitleEn: 'Time & Tickets',
          stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
          fieldEn: 'At least 1 Booking Available Day',
          fieldLo: 'ຢ່າງໜ້ອຍ 1 ມື້ທີ່ເປີດໃຫ້ຈອງ',
          elementId: 'field-booking-days',
        });
      }
      if (!bookingTimeSlots || bookingTimeSlots.length === 0) {
        list.push({
          id: 'booking-slots-empty',
          step: 2,
          stepTitleEn: 'Time & Tickets',
          stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
          fieldEn: 'At least 1 Booking Time Slot',
          fieldLo: 'ຢ່າງໜ້ອຍ 1 ຮອບເວລາການຈອງ',
          elementId: 'field-booking-slots',
        });
      }
    } else {
      // Event Date
      if (!availableDates || availableDates.length === 0) {
        list.push({
          id: 'available-dates-empty',
          step: 2,
          stepTitleEn: 'Time & Tickets',
          stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
          fieldEn: 'At least 1 Event Date & Time',
          fieldLo: 'ຢ່າງໜ້ອຍ 1 ວັນທີ ແລະ ເວລາຈັດງານ',
          elementId: 'field-flexible-dates',
        });
      } else {
        const hasTooEarlyDate = availableDates.some(d => {
          const dt = new Date(d.date);
          dt.setHours(0, 0, 0, 0);
          return dt.getTime() < minAdvanceDate.getTime();
        });
        if (hasTooEarlyDate) {
          list.push({
            id: 'available-dates-min-5-days',
            step: 2,
            stepTitleEn: 'Time & Tickets',
            stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
            fieldEn: `Event date must be at least 5 days from today (from ${minAdvanceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} onwards)`,
            fieldLo: `ວັນທີຈັດງານຕ້ອງເລືອກລ່ວງໜ້າຢ່າງໜ້ອຍ 5 ວັນ (ເລີ່ມຈາກ ${minAdvanceDate.toLocaleDateString('lo-LA', { day: 'numeric', month: 'short', year: 'numeric' })} ເປັນຕົ້ນໄປ)`,
            elementId: 'field-flexible-dates',
          });
        }
      }
    }

    if (!ticketTiers || ticketTiers.length === 0) {
      list.push({
        id: 'ticket-tier-empty',
        step: 2,
        stepTitleEn: 'Time & Tickets',
        stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
        fieldEn: 'At least 1 Ticket Tier',
        fieldLo: 'ຢ່າງໜ້ອຍ 1 ປະເພດບັດ',
        elementId: 'field-ticket-tiers',
      });
    } else {
      if (ticketTiers.some(t => !t.name || !t.name.trim())) {
        list.push({
          id: 'ticket-tier-name',
          step: 2,
          stepTitleEn: 'Time & Tickets',
          stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
          fieldEn: 'Ticket Tier Name',
          fieldLo: 'ຊື່ປະເພດບັດ',
          elementId: 'field-ticket-tiers',
        });
      }
      if (dateType !== 'booking') {
        if (ticketTiers.some(t => t.quantity === '' || t.quantity === null || t.quantity === undefined)) {
          list.push({
            id: 'ticket-tier-qty',
            step: 2,
            stepTitleEn: 'Time & Tickets',
            stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
            fieldEn: 'Ticket Tier Quantity',
            fieldLo: 'ຈຳນວນບັດ',
            elementId: 'field-ticket-tiers',
          });
        }
        if (getEventEndDateStr()) {
          if (ticketTiers.some(t => !t.saleStartDate || !t.saleStartDate.trim())) {
            list.push({
              id: 'ticket-tier-sale-start',
              step: 2,
              stepTitleEn: 'Time & Tickets',
              stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
              fieldEn: 'Ticket Tier Sale Start Date',
              fieldLo: 'ວັນທີເລີ່ມຂາຍບັດ',
              elementId: 'field-ticket-tiers',
            });
          } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const hasPastStart = ticketTiers.some(t => {
              const d = parseDDMMYYYYToDate(t.saleStartDate);
              return d && d.getTime() < today.getTime();
            });
            if (hasPastStart) {
              list.push({
                id: 'ticket-tier-sale-start-past',
                step: 2,
                stepTitleEn: 'Time & Tickets',
                stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
                fieldEn: 'Ticket Sale Starts must be from today onwards',
                fieldLo: 'ວັນທີເລີ່ມຕົ້ນຂາຍບັດຕ້ອງເລີ່ມຈາກມື້ປັດຈຸບັນເປັນຕົ້ນໄປ',
                elementId: 'field-ticket-tiers',
              });
            }
          }

          if (ticketTiers.some(t => !t.saleEndDate || !t.saleEndDate.trim())) {
            list.push({
              id: 'ticket-tier-sale-end',
              step: 2,
              stepTitleEn: 'Time & Tickets',
              stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
              fieldEn: 'Ticket Tier Sale End Date',
              fieldLo: 'ວັນທີສິ້ນສຸດການຂາຍບັດ',
              elementId: 'field-ticket-tiers',
            });
          } else {
            const evEnd = getEventEndDateStr();
            const evEndDateObj = evEnd ? parseDDMMYYYYToDate(evEnd) : null;
            if (evEndDateObj) {
              evEndDateObj.setHours(23, 59, 59, 999);
              const hasLateSaleEnd = ticketTiers.some(t => {
                const d = parseDDMMYYYYToDate(t.saleEndDate);
                return d && d.getTime() > evEndDateObj.getTime();
              });
              if (hasLateSaleEnd) {
                list.push({
                  id: 'ticket-tier-sale-end-after-event',
                  step: 2,
                  stepTitleEn: 'Time & Tickets',
                  stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
                  fieldEn: 'Ticket Sale Ends cannot be after the end of event',
                  fieldLo: 'ວັນທີສິ້ນສຸດການຂາຍບັດບໍ່ສາມາດເກີນວັນທີສິ້ນສຸດຂອງ Event ໄດ້',
                  elementId: 'field-ticket-tiers',
                });
              }
            }

            const hasInvalidRange = ticketTiers.some(t => {
              const s = parseDDMMYYYYToDate(t.saleStartDate);
              const e = parseDDMMYYYYToDate(t.saleEndDate);
              return s && e && s.getTime() > e.getTime();
            });
            if (hasInvalidRange) {
              list.push({
                id: 'ticket-tier-sale-range-invalid',
                step: 2,
                stepTitleEn: 'Time & Tickets',
                stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
                fieldEn: 'Ticket Sale Start Date cannot be after Sale End Date',
                fieldLo: 'ວັນທີເລີ່ມຕົ້ນຂາຍບັດບໍ່ສາມາດຢູ່ຫຼັງວັນທີສິ້ນສຸດການຂາຍໄດ້',
                elementId: 'field-ticket-tiers',
              });
            }
          }
        }

        // Coupon validity dates validation
        if (enableCoupons && coupons && coupons.length > 0 && getEventEndDateStr()) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const hasPastCouponStart = coupons.some(c => {
            if (!c.validFrom) return false;
            const d = parseDDMMYYYYToDate(c.validFrom);
            return d && d.getTime() < today.getTime();
          });
          if (hasPastCouponStart) {
            list.push({
              id: 'coupon-valid-from-past',
              step: 2,
              stepTitleEn: 'Time & Tickets',
              stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
              fieldEn: 'Coupon Valid From must be from today onwards',
              fieldLo: 'ວັນທີເລີ່ມຕົ້ນໃຊ້ຄູປອງຕ້ອງເລີ່ມຈາກມື້ປັດຈຸບັນເປັນຕົ້ນໄປ',
              elementId: 'field-coupons',
            });
          }

          const evEnd = getEventEndDateStr();
          const evEndDateObj = evEnd ? parseDDMMYYYYToDate(evEnd) : null;
          if (evEndDateObj) {
            evEndDateObj.setHours(23, 59, 59, 999);
            const hasLateCouponEnd = coupons.some(c => {
              if (!c.validUntil) return false;
              const d = parseDDMMYYYYToDate(c.validUntil);
              return d && d.getTime() > evEndDateObj.getTime();
            });
            if (hasLateCouponEnd) {
              list.push({
                id: 'coupon-valid-until-after-event',
                step: 2,
                stepTitleEn: 'Time & Tickets',
                stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
                fieldEn: 'Coupon Valid Until cannot be after the end of event',
                fieldLo: 'ວັນທີສິ້ນສຸດການໃຊ້ຄູປອງບໍ່ສາມາດເກີນວັນທີສິ້ນສຸດຂອງ Event ໄດ້',
                elementId: 'field-coupons',
              });
            }
          }

          const hasInvalidCouponRange = coupons.some(c => {
            if (!c.validFrom || !c.validUntil) return false;
            const s = parseDDMMYYYYToDate(c.validFrom);
            const e = parseDDMMYYYYToDate(c.validUntil);
            return s && e && s.getTime() > e.getTime();
          });
          if (hasInvalidCouponRange) {
            list.push({
              id: 'coupon-valid-range-invalid',
              step: 2,
              stepTitleEn: 'Time & Tickets',
              stepTitleLo: 'ເວລາ & ບັດເຂົ້າຮ່ວມ',
              fieldEn: 'Coupon Valid From Date cannot be after Valid Until Date',
              fieldLo: 'ວັນທີເລີ່ມຕົ້ນໃຊ້ຄູປອງບໍ່ສາມາດຢູ່ຫຼັງວັນທີສິ້ນສຸດໄດ້',
              elementId: 'field-coupons',
            });
          }
        }
      }
    }

    return list;
  };

  const jumpToMissingField = (stepNum: number, elementId?: string) => {
    setActiveStep(stepNum);
    setTimeout(() => {
      if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = el.querySelector('input, textarea, select') as HTMLElement;
          if (input) input.focus();
          return;
        }
      }
      window.scrollTo(0, 0);
    }, 180);
  };
  
  // Additional event detail settings
  const [eventPrivacy, setEventPrivacy] = useState<'public' | 'private'>('public');
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const privacyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(e.target as Node)) {
        setShowPrivacyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [attendeeMessage, setAttendeeMessage] = useState('');
  const [showRemainingTickets, setShowRemainingTickets] = useState(true);
  const [allowRefunds, setAllowRefunds] = useState(false);
  const [allowReviews, setAllowReviews] = useState(true);
  const [eventStatus, setEventStatus] = useState<string>('pending');
  const [maxTickets, setMaxTickets] = useState('4');
  const [requireEveryTicketInfo, setRequireEveryTicketInfo] = useState(true);
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Preview event modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Close preview modal on Escape key press
  useEffect(() => {
    if (!showPreviewModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPreviewModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreviewModal]);

  const handleOpenPreview = () => {
    setPreviewImageIndex(0);
    const preview = {
      id: editingEventId || 'preview-temp-id',
      title: eventName.trim() || (lang === 'lo' ? 'ຊື່ກິດຈະກຳຕົວຢ່າງ' : 'Sample Event Name'),
      category: eventType === 'online' ? 'Workshop' : (category || 'Festival'),
      venue: venueName || (lang === 'lo' ? 'ສະຖານທີ່ຈັດງານ' : 'Event Venue'),
      province: province || 'Vientiane',
      district: district || 'Chanthabouly',
      location: streetAddress || 'Vientiane, Laos',
      googleMapUrl: googleMapsLink || '',
      latitude: latitude,
      longitude: longitude,
      organizer: organizerName || 'Organizer Name',
      organizerInfo: organizerInfo || '',
      organizerBio: organizerInfo || '',
      organizerContact: organizerContact || '',
      organizerPhone: organizerPhone || '',
      organizerEmail: organizerEmail || '',
      organizerLogo: organizerLogo || '',
      organizerSocialLinks: organizerSocialLinks || {},
      eventType: eventType,
      onlinePlatform: onlinePlatform,
      onlineMeetingUrl: onlineMeetingUrl,
      onlinePasscode: onlinePasscode,
      onlineInstructions: onlineInstructions,
      dateType: dateType,
      flexibleDateDesc: dateType === 'flexible' ? flexibleDateDesc : '',
      bookingAvailableDays: dateType === 'booking' ? bookingAvailableDays : [],
      bookingTimeSlots: dateType === 'booking' ? bookingTimeSlots : [],
      bookingSlotCapacities: dateType === 'booking' ? bookingSlotCapacities : {},
      date: dateType === 'flexible' && availableDates.length > 0 ? availableDates[0].date : (startDate || new Date().toISOString().split('T')[0]),
      time: dateType === 'flexible' && availableDates.length > 0 && availableDates[0].timeSlots?.length > 0 ? availableDates[0].timeSlots[0] : (startTime || '18:00'),
      endDate: dateType === 'flexible' && availableDates.length > 0 ? availableDates[availableDates.length - 1].date : (endDate || startDate || new Date().toISOString().split('T')[0]),
      endTime: endTime || '22:00',
      price: ticketTiers[0]?.price ? `${(Number(String(ticketTiers[0].price).replace(/,/g, '')) || 0).toLocaleString()} ${currency}` : `0 ${currency}`,
      currency: currency,
      image: verticalImage || horizontalImage || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000',
      horizontalImage: horizontalImage || verticalImage || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000',
      exampleImages: galleryImages.length > 0 ? galleryImages : [],
      description: (activeStep === 1 && editorRef.current) 
        ? (editorRef.current.innerHTML || editorContent || '') 
        : (editorContent || (lang === 'lo' ? 'ຍັງບໍ່ມີລາຍລະອຽດກິດຈະກຳ...' : 'No event description provided yet...')),
      ticketTiers: ticketTiers.filter(t => t.name || t.price).map(tier => ({
        ...tier,
        id: String(tier.id || Math.random()),
        name: tier.name || 'General Admission',
        price: Number(String(tier.price).replace(/,/g, '')) || 0,
        available: Number(String(tier.quantity).replace(/,/g, '')) || 100,
        quantity: Number(String(tier.quantity).replace(/,/g, '')) || 100,
        description: tier.name ? `${tier.name} Access` : 'General Admission Access',
      })),
      coupons: enableCoupons ? coupons : [],
      hasSeating: hasSeating,
      zoneImage: zoneImage,
      hasTimeSelection: dateType === 'flexible',
      timeSlots: dateType === 'flexible' ? timeSlots : [],
      availableDates: dateType === 'flexible' ? availableDates : [],
      status: 'preview',
      requireEveryTicketInfo: requireEveryTicketInfo,
      allowRefunds: allowRefunds,
      allowReviews: allowReviews,
      showRemainingTickets: showRemainingTickets,
      cancellationPolicy: cancellationPolicy
    };
    setPreviewData(preview);
    setShowPreviewModal(true);
  };

  // Calculate days until event
  const getDaysUntilEvent = (eventDateStr: string) => {
    if (!eventDateStr) return 0;
    const eventStartDate = new Date(`${eventDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventStartDate.setHours(0, 0, 0, 0);
    const diffTime = eventStartDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStartEdit = (event: any) => {
    setEditingEventId(event.id);
    setValidationError(null);
    setEventName(event.title || '');
    setCategory(event.category || 'Festival');
    setVenueName(event.venue || '');
    setProvince(event.province || '');
    setDistrict(event.district || '');
    setStreetAddress(event.location || '');
    setLatitude(event.latitude);
    setLongitude(event.longitude);
    setGoogleMapsLink(event.googleMapUrl || "");
    setOrganizerName(event.organizer || 'Unknown');
    setOrganizerInfo(event.organizerInfo || '');
    setOrganizerContact(event.organizerContact || '');
    setOrganizerPhone(event.organizerPhone || '');
    setOrganizerEmail(event.organizerEmail || '');
    setOrganizerLogo(event.organizerLogo || null);
    setOrganizerSocialLinks(event.organizerSocialLinks || {});
    if (event.bankName) setBankName(event.bankName);
    if (event.accountNumber) setAccountNumber(event.accountNumber);
    if (event.accountHolder) setAccountHolder(event.accountHolder);
    setEventType(event.eventType || 'offline');
    setOnlinePlatform(event.onlinePlatform || 'zoom');
    setOnlineMeetingUrl(event.onlineMeetingUrl || '');
    setOnlinePasscode(event.onlinePasscode || '');
    setOnlineInstructions(event.onlineInstructions || '');
    setDateType(event.dateType || 'flexible');
    setFlexibleDateDesc(event.flexibleDateDesc || '');
    setBookingAvailableDays(event.bookingAvailableDays || []);
    setBookingTimeSlots(event.bookingTimeSlots || []);
    const loadedCapacities: Record<string, number> = {};
    if (event.bookingSlotCapacities) {
      Object.assign(loadedCapacities, event.bookingSlotCapacities);
    } else if (event.bookingTimeSlots && event.bookingTimeSlots.length > 0) {
      const fallbackCap = Number(event.bookingCapacity) || 10;
      event.bookingTimeSlots.forEach((slot: string) => {
        loadedCapacities[slot] = fallbackCap;
      });
    }
    setBookingSlotCapacities(loadedCapacities);
    setStartDate(event.date || '');
    setStartTime(event.time || '');
    setEndDate(event.endDate || '');
    setEndTime(event.endTime || '');
    setDurationEn(event.durationEn || '');
    setDurationLo(event.durationLo || '');
    setSelectedLanguages(event.languages || ['Lao', 'English']);
    const todayStr = getTodayDateStr();
    const evEnd = event.endDate || (event.availableDates?.[event.availableDates.length - 1]?.date) || event.date || '';
    setTicketTiers(
      event.ticketTiers && event.ticketTiers.length > 0
        ? event.ticketTiers.map((t: any) => ({
            ...t,
            price: t.price !== undefined ? String(t.price) : '',
            quantity: t.quantity !== undefined ? String(t.quantity) : (t.available !== undefined ? String(t.available) : ''),
            saleStartDate: t.saleStartDate || todayStr,
            saleEndDate: t.saleEndDate || evEnd || '',
          }))
        : [{ id: 1, name: '', price: '', quantity: '', saleStartDate: todayStr, saleStartTime: '', saleEndDate: evEnd || '', saleEndTime: '' }]
    );
    setCoupons(
      event.coupons && event.coupons.length > 0
        ? event.coupons.map((c: any) => ({
            ...c,
            validFrom: c.validFrom || (evEnd ? todayStr : ''),
            validUntil: c.validUntil || evEnd || '',
          }))
        : []
    );
    setEnableCoupons(event.coupons && event.coupons.length > 0 ? true : false);
    setHasSeating(event.hasSeating || false);
    setZoneImage(event.zoneImage || null);
    setHasTimeSelection(event.hasTimeSelection || false);
    setTimeSlots(event.timeSlots || []);
    setAvailableDates(event.availableDates || []);
    setVerticalImage(event.image || null);
    setHorizontalImage(event.image || null);
    setGalleryImages(event.exampleImages || event.galleryImages || []);
    setEditorContent(event.description || '');
    setCancellationPolicy(event.cancellationPolicy || '');
    setShowRemainingTickets(event.showRemainingTickets !== undefined ? event.showRemainingTickets : true);
    setAllowRefunds(event.allowRefunds !== false);
    setAllowReviews(event.allowReviews !== false);
    setEventStatus(event.status || 'active');
    setMaxTickets(event.maxTickets || '4');
    setEventPrivacy(event.eventPrivacy || 'public');
    setAttendeeMessage(event.attendeeMessage || '');
    
    // Switch to createEvent tab
    setActiveTab('createEvent');
    setActiveStep(1); // start at step 1
    setSelectedEvent(null); // Close details modal if open
  };

  // Organizers cannot edit events after submission
  const hasLoadedAdminEdit = useRef(false);
  useEffect(() => {
    const editId = searchParams.get('editId') || location.state?.editEventId;
    const adminEditId = searchParams.get('adminEdit');
    
    if (adminEditId && localEvents.length > 0 && !hasLoadedAdminEdit.current) {
      const evt = localEvents.find(e => e.id === adminEditId);
      if (evt) {
        handleStartEdit(evt);
        setActiveTab('createEvent');
        hasLoadedAdminEdit.current = true;
      }
    } else if (editId && localEvents.length > 0) {
      setShowEditBlockedModal(true);
    }
  }, [searchParams, location.state, localEvents]);
  
  const [verticalImage, setVerticalImage] = useState<string | null>(null);
  const [horizontalImage, setHorizontalImage] = useState<string | null>(null);
  const [coverFitMode, setCoverFitMode] = useState<'contain' | 'cover'>('contain');
  const [verticalUploadProgress, setVerticalUploadProgress] = useState<number | null>(null);
  const [horizontalUploadProgress, setHorizontalUploadProgress] = useState<number | null>(null);
  const [organizerLogo, setOrganizerLogo] = useState<string | null>(null);
  const [organizerLogoProgress, setOrganizerLogoProgress] = useState<number | null>(null);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(true);
  const [showImageLocationsModal, setShowImageLocationsModal] = useState(false);
  const [imageLocationTab, setImageLocationTab] = useState<'homepage' | 'pdf'>('homepage');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Reports page states
  const [reportMetric, setReportMetric] = useState<'revenue' | 'tickets'>('revenue');
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('All');
  const [reportSortOrder, setReportSortOrder] = useState<string>('highest');
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Step 2 state
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [ticketTiers, setTicketTiers] = useState(() => [
    { id: 1, name: '', price: '', quantity: '', saleStartDate: '', saleStartTime: '', saleEndDate: '', saleEndTime: '' }
  ]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [enableCoupons, setEnableCoupons] = useState(false);
  
  const [hasSeating, setHasSeating] = useState(false);
  const [zoneImage, setZoneImage] = useState<string | null>(null);
  const [zoneImageProgress, setZoneImageProgress] = useState<number | null>(null);
  const [isDraggingZoneImage, setIsDraggingZoneImage] = useState(false);

  const [hasTimeSelection, setHasTimeSelection] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<{ date: string, startTime: string, endTime?: string, timeSlots?: string[] }[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [flexTimeStart, setFlexTimeStart] = useState('09:00');
  const [flexTimeEnd, setFlexTimeEnd] = useState('17:00');

  // Automatically ensure ticket tier sale dates and coupon valid dates default to current date and end of event when event date is set
  useEffect(() => {
    if (dateType === 'booking') return;
    const evEnd = getEventEndDateStr();
    const today = getTodayDateStr();

    if (!evEnd) {
      // If event date is not set, keep sale start/end and coupon validity dates empty
      setTicketTiers(prev => {
        let hasChanges = false;
        const updated = prev.map(tier => {
          if (tier.saleStartDate || tier.saleEndDate) {
            hasChanges = true;
            return { ...tier, saleStartDate: '', saleEndDate: '' };
          }
          return tier;
        });
        return hasChanges ? updated : prev;
      });

      setCoupons(prev => {
        let hasChanges = false;
        const updated = prev.map(coupon => {
          if (coupon.validFrom || coupon.validUntil) {
            hasChanges = true;
            return { ...coupon, validFrom: '', validUntil: '' };
          }
          return coupon;
        });
        return hasChanges ? updated : prev;
      });
      return;
    }

    setTicketTiers(prev => {
      let hasChanges = false;
      const updated = prev.map(tier => {
        let newStartDate = tier.saleStartDate;
        let newEndDate = tier.saleEndDate;

        if (!newStartDate || !newStartDate.trim()) {
          newStartDate = today;
          hasChanges = true;
        }

        if (!newEndDate || !newEndDate.trim()) {
          newEndDate = evEnd;
          hasChanges = true;
        }

        if (hasChanges) {
          return { ...tier, saleStartDate: newStartDate, saleEndDate: newEndDate };
        }
        return tier;
      });

      return hasChanges ? updated : prev;
    });

    setCoupons(prev => {
      let hasChanges = false;
      const updated = prev.map(coupon => {
        let newValidFrom = coupon.validFrom;
        let newValidUntil = coupon.validUntil;

        if (!newValidFrom || !newValidFrom.trim()) {
          newValidFrom = today;
          hasChanges = true;
        }

        if (!newValidUntil || !newValidUntil.trim()) {
          newValidUntil = evEnd;
          hasChanges = true;
        }

        if (hasChanges) {
          return { ...coupon, validFrom: newValidFrom, validUntil: newValidUntil };
        }
        return coupon;
      });

      return hasChanges ? updated : prev;
    });
  }, [availableDates, startDate, endDate, dateType]);

  // Step 4 state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Rich Text Editor state
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [savedSelectionRange, setSavedSelectionRange] = useState<Range | null>(null);

  // Event Information Toolbar Reference State
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState('16');
  const [selectedTextColor, setSelectedTextColor] = useState('#000000');
  const [selectedAlign, setSelectedAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const fontSizeDropdownRef = useRef<HTMLDivElement | null>(null);
  const colorDropdownRef = useRef<HTMLDivElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const savedSelectionRangeRef = useRef<Range | null>(null);
  const [customHexInput, setCustomHexInput] = useState('000000');
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showToolbarLinkModal, setShowToolbarLinkModal] = useState(false);
  const [toolbarLinkUrl, setToolbarLinkUrl] = useState('');
  const [toolbarLinkText, setToolbarLinkText] = useState('');

  const fontOptions = [
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Noto Sans Lao', value: "'Noto Sans Lao', sans-serif" },
    { label: 'Playfair Display', value: "'Playfair Display', serif" },
    { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
    { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Courier New', value: "'Courier New', monospace" }
  ];

  const fontSizeOptions = ['12', '14', '16', '18', '19', '20', '21', '22', '23', '24', '28', '32', '36'];

  const colorPalette = [
    { label: 'Black', value: '#000000' },
    { label: 'Charcoal', value: '#1E293B' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Orange', value: '#FF5500' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Pink', value: '#EC4899' }
  ];

  const applyToolbarFont = (fontName: string, fontVal: string) => {
    setSelectedFont(fontName);
    setShowFontMenu(false);
    document.execCommand('fontName', false, fontVal);
    if (editorRef.current) setEditorContent(editorRef.current.innerHTML);
  };

  const applyToolbarFontSize = (sizePx: string) => {
    setSelectedFontSize(sizePx);
    setShowFontSizeMenu(false);

    // Restore selection if saved
    if (savedSelectionRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRange);
      }
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      document.execCommand('fontSize', false, '7');
      if (editorRef.current) {
        const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
        fontElements.forEach((el) => {
          el.removeAttribute('size');
          (el as HTMLElement).style.fontSize = `${sizePx}px`;
        });
    isInternalEditorUpdateRef.current = true;
        setEditorContent(editorRef.current.innerHTML);
      }
    } else if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('fontSize', false, '7');
      const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
      fontElements.forEach((el) => {
        el.removeAttribute('size');
        (el as HTMLElement).style.fontSize = `${sizePx}px`;
      });
    isInternalEditorUpdateRef.current = true;
      setEditorContent(editorRef.current.innerHTML);
    }
    setSavedSelectionRange(null);
  };

  // Helper to validate and normalize HEX color
  const normalizeHexColor = (input: string): string | null => {
    if (!input) return null;
    const clean = input.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      return `#${clean.toUpperCase()}`;
    }
    if (/^[0-9a-fA-F]{3}$/.test(clean)) {
      return `#${clean.split('').map((c) => c + c).join('').toUpperCase()}`;
    }
    return null;
  };

  const applyToolbarTextColor = (color: string, closeMenu = true) => {
    if (!color) return;
    const formattedColor = normalizeHexColor(color) || (color.startsWith('#') ? color : `#${color}`);
    
    setSelectedTextColor(formattedColor);
    setCustomHexInput(formattedColor.replace('#', ''));
    
    if (closeMenu) {
      setShowColorMenu(false);
    }

    if (!editorRef.current) return;

    // Determine range to use: preference to saved selection ref or current window selection
    const sel = window.getSelection();
    let rangeToUse: Range | null = null;

    if (savedSelectionRangeRef.current && editorRef.current.contains(savedSelectionRangeRef.current.commonAncestorContainer)) {
      rangeToUse = savedSelectionRangeRef.current;
    } else if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current.contains(sel.anchorNode)) {
      rangeToUse = sel.getRangeAt(0);
    } else if (savedSelectionRange && editorRef.current.contains(savedSelectionRange.commonAncestorContainer)) {
      rangeToUse = savedSelectionRange;
    }

    if (rangeToUse && !rangeToUse.collapsed && editorRef.current.contains(rangeToUse.commonAncestorContainer)) {
      // 1. Focus editor and restore the exact active range
      editorRef.current.focus();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(rangeToUse);
      }

      // 2. Enable styleWithCSS so foreColor outputs standard <span> elements with style="color: ..."
      try {
        document.execCommand('styleWithCSS', false, 'true');
      } catch {
        // Fallback for browsers that don't support styleWithCSS
      }
      document.execCommand('foreColor', false, formattedColor);

      // 3. Immediately capture the active range after execCommand so subsequent color changes work smoothly
      const postSel = window.getSelection();
      if (postSel && postSel.rangeCount > 0 && !postSel.isCollapsed && editorRef.current.contains(postSel.anchorNode)) {
        const postRange = postSel.getRangeAt(0).cloneRange();
        savedSelectionRangeRef.current = postRange;
        setSavedSelectionRange(postRange);
      }
    } else {
      // If no text is selected or cursor is at an insertion point, set foreColor for upcoming typing
      editorRef.current.focus();
      try {
        document.execCommand('styleWithCSS', false, 'true');
      } catch {}
      document.execCommand('foreColor', false, formattedColor);
    }

    // Sync content state for draft saving and form submission without re-triggering innerHTML reassignment
    isInternalEditorUpdateRef.current = true;
    setEditorContent(editorRef.current.innerHTML);
  };

  const applyToolbarAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    setSelectedAlign(align);
    setShowAlignMenu(false);
    if (align === 'left') execCommand('justifyLeft');
    else if (align === 'center') execCommand('justifyCenter');
    else if (align === 'right') execCommand('justifyRight');
    else if (align === 'justify') execCommand('justifyFull');
  };

  // Continuously record active selection inside editor so toolbar interactions never lose it
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current) {
        const range = sel.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          savedSelectionRangeRef.current = range.cloneRange();
          setSavedSelectionRange(range.cloneRange());
        }
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Close rich text editor dropdowns when clicking outside
  useEffect(() => {
    const handleToolbarClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fontSizeDropdownRef.current && !fontSizeDropdownRef.current.contains(target)) {
        setShowFontSizeMenu(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(target)) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener('mousedown', handleToolbarClickOutside);
    return () => document.removeEventListener('mousedown', handleToolbarClickOutside);
  }, []);

  const applyToolbarLink = () => {
    if (toolbarLinkUrl.trim()) {
      let formattedUrl = toolbarLinkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith('mailto:') && !formattedUrl.startsWith('tel:')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      const textToDisplay = toolbarLinkText.trim() || formattedUrl;
      const htmlToInsert = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-adv-orange underline hover:text-orange-600 font-semibold transition-colors">${textToDisplay}</a>&nbsp;`;
      
      // Restore selection if we saved it
      if (savedSelectionRange) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedSelectionRange);
        }
      } else if (editorRef.current) {
         // Focus editor and place cursor at end if no selection saved
         editorRef.current.focus();
         const sel = window.getSelection();
         if (sel) {
           const range = document.createRange();
           range.selectNodeContents(editorRef.current);
           range.collapse(false);
           sel.removeAllRanges();
           sel.addRange(range);
         }
      }
      
      document.execCommand('insertHTML', false, htmlToInsert);
      
      if (editorRef.current) {
    isInternalEditorUpdateRef.current = true;
        setEditorContent(editorRef.current.innerHTML);
      }
    }
    setShowToolbarLinkModal(false);
    setToolbarLinkUrl('');
    setToolbarLinkText('');
    setSavedSelectionRange(null);
  };

  const insertCalloutBlock = () => {
    const calloutHtml = `<blockquote class="border-l-4 border-adv-orange pl-4 py-2.5 my-3 italic text-gray-700 bg-orange-50/70 rounded-r-2xl shadow-xs font-medium">“${lang === 'lo' ? 'ເພີ່ມຂໍ້ຄວາມໝາຍເຫດ ຫຼື ຄຳເວົ້າພິເສດຢູ່ທີ່ນີ້...' : 'Add your special note, quote, or highlight here...'}”</blockquote><p><br></p>`;
    execCommand('insertHTML', calloutHtml);
    if (editorRef.current) {
    isInternalEditorUpdateRef.current = true;
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pasteText = e.clipboardData?.getData('text/plain')?.trim();
    if (!pasteText) return;

    // Check if pasted text is a URL
    const isUrl = /^https?:\/\/[^\s]+$/i.test(pasteText) || /^www\.[^\s]+\.[^\s]+$/i.test(pasteText);

    if (isUrl) {
      let formattedUrl = pasteText;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
        // Convert selected text into link
        e.preventDefault();
        document.execCommand('createLink', false, formattedUrl);

        if (editorRef.current) {
          const anchors = editorRef.current.querySelectorAll('a');
          anchors.forEach(a => {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          });
    isInternalEditorUpdateRef.current = true;
          setEditorContent(editorRef.current.innerHTML);
        }
        return;
      } else if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
        // Insert link directly
        e.preventDefault();
        const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-adv-orange underline hover:text-orange-600 font-semibold transition-colors">${pasteText}</a>&nbsp;`;
        document.execCommand('insertHTML', false, linkHtml);
        if (editorRef.current) {
    isInternalEditorUpdateRef.current = true;
          setEditorContent(editorRef.current.innerHTML);
        }
        return;
      }
    }
  };
  
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const draggedImageRef = useRef<HTMLImageElement | null>(null);
  const [imageRect, setImageRect] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  const [imageDropIndicator, setImageDropIndicator] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    isBlock: boolean;
  } | null>(null);

  const getCaretRangeFromPoint = (x: number, y: number): Range | null => {
    if (typeof document.caretRangeFromPoint === 'function') {
      return document.caretRangeFromPoint(x, y);
    }
    const doc = document as unknown as { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
    if (typeof doc.caretPositionFromPoint === 'function') {
      const pos = doc.caretPositionFromPoint(x, y);
      if (pos) {
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        return range;
      }
    }
    return null;
  };

  const updateImageRect = React.useCallback(() => {
    if (selectedImage && editorRef.current && editorRef.current.parentElement) {
      const parentBounds = editorRef.current.parentElement.getBoundingClientRect();
      const imgBounds = selectedImage.getBoundingClientRect();
      setImageRect({
        top: imgBounds.top - parentBounds.top,
        left: imgBounds.left - parentBounds.left,
        width: imgBounds.width,
        height: imgBounds.height
      });
    } else {
      setImageRect(null);
    }
  }, [selectedImage]);

  useEffect(() => {
    window.addEventListener('resize', updateImageRect);
    return () => window.removeEventListener('resize', updateImageRect);
  }, [updateImageRect]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node) && selectedImage) {
        const cursor = (e.target as HTMLElement).style?.cursor;
        if (cursor === 'nwse-resize' || cursor === 'nesw-resize' || (e.target as HTMLElement).dataset.resizeHandle) return;
        setSelectedImage(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [selectedImage]);

  const handlePreviewLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      let href = anchor.getAttribute('href');
      if (href) {
        if (!/^https?:\/\//i.test(href) && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          href = `https://${href}`;
        }
        e.preventDefault();
        e.stopPropagation();
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetEl = e.target as HTMLElement;
    const anchor = targetEl.closest('a');
    if (anchor) {
      let href = anchor.getAttribute('href');
      if (href) {
        if (!/^https?:\/\//i.test(href) && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          href = `https://${href}`;
        }
        e.preventDefault();
        e.stopPropagation();
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    if (targetEl.tagName === 'IMG') {
      setSelectedImage(targetEl as HTMLImageElement);
      setTimeout(updateImageRect, 10);
    } else {
      setSelectedImage(null);
    }
  };

  const handleEditorInput = () => {
    if (selectedImage && !document.body.contains(selectedImage)) {
      setSelectedImage(null);
    } else {
      setTimeout(updateImageRect, 10);
    }
  };

  const startResize = (e: React.MouseEvent, corner: 'nw' | 'ne' | 'se' | 'sw' = 'se') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedImage) return;

    const startX = e.clientX;
    const startWidth = selectedImage.offsetWidth;
    const startHeight = selectedImage.offsetHeight;
    const ratio = startHeight / Math.max(1, startWidth);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth;

      if (corner === 'se' || corner === 'ne') {
        newWidth = Math.max(60, startWidth + deltaX);
      } else {
        // 'sw' or 'nw' - dragging leftwards increases width
        newWidth = Math.max(60, startWidth - deltaX);
      }

      const newHeight = Math.round(newWidth * ratio);

      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = `${newHeight}px`;
      updateImageRect();
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (editorRef.current) {
        isInternalEditorUpdateRef.current = true;
        setEditorContent(editorRef.current.innerHTML);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const deleteSelectedImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedImage) {
      selectedImage.remove();
      setSelectedImage(null);
      setImageRect(null);
      if (editorRef.current) {
    isInternalEditorUpdateRef.current = true;
        setEditorContent(editorRef.current.innerHTML);
      }
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      isInternalEditorUpdateRef.current = true;
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const handleEditorImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              let width = img.width;
              let height = img.height;
              
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              execCommand('insertImage', dataUrl);
            };
            img.src = event.target.result.toString();
          }
        };
        reader.readAsDataURL(file as File);
      }
    };
    input.click();
  };

  const handleEditorDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      draggedImageRef.current = target as HTMLImageElement;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'internal-image-drag');
      setSelectedImage(null);
      setImageRect(null);
    }
  };

  const handleEditorDragEnd = () => {
    draggedImageRef.current = null;
    setImageDropIndicator(null);
  };

  const handleEditorDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!editorRef.current?.contains(e.relatedTarget as Node)) {
      setImageDropIndicator(null);
    }
  };

  const handleEditorDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedImageRef.current) {
      e.dataTransfer.dropEffect = 'move';
    } else if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      return;
    }

    const range = getCaretRangeFromPoint(e.clientX, e.clientY);
    if (range && editorRef.current && editorRef.current.contains(range.startContainer)) {
      // Synchronize caret selection in real time as cursor moves
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Calculate real-time drop indicator coordinates relative to editor container
      const parentContainer = editorRef.current.parentElement;
      if (parentContainer) {
        const parentBounds = parentContainer.getBoundingClientRect();
        const rects = range.getClientRects();
        if (rects.length > 0 && rects[0].height > 0) {
          const r = rects[0];
          setImageDropIndicator({
            top: r.top - parentBounds.top,
            left: Math.max(0, r.left - parentBounds.left - 1.5),
            width: 3,
            height: Math.max(r.height, 22),
            isBlock: false
          });
        } else {
          const elem = range.startContainer.nodeType === Node.ELEMENT_NODE
            ? (range.startContainer as HTMLElement)
            : range.startContainer.parentElement;
          if (elem && editorRef.current.contains(elem)) {
            const bounds = elem.getBoundingClientRect();
            const isLowerHalf = e.clientY > bounds.top + bounds.height / 2;
            setImageDropIndicator({
              top: (isLowerHalf ? bounds.bottom : bounds.top) - parentBounds.top - 1.5,
              left: bounds.left - parentBounds.left,
              width: Math.max(bounds.width, 240),
              height: 3,
              isBlock: true
            });
          }
        }
      }
    }
  };

  const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setImageDropIndicator(null);

    // 1. If dragging an internal image within the editor, move it in real time to the drop position
    if (draggedImageRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const imgToMove = draggedImageRef.current;
      draggedImageRef.current = null;

      // Find drop caret position
      const range = getCaretRangeFromPoint(e.clientX, e.clientY);
      
      if (range && editorRef.current?.contains(range.startContainer)) {
        // Prevent inserting into itself if dropped onto itself
        if (!imgToMove.contains(range.startContainer)) {
          range.insertNode(imgToMove);
          range.setStartAfter(imgToMove);
          range.collapse(true);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      } else if (editorRef.current) {
        editorRef.current.appendChild(imgToMove);
      }

      setSelectedImage(imgToMove);
      if (editorRef.current) {
        isInternalEditorUpdateRef.current = true;
        setEditorContent(editorRef.current.innerHTML);
      }
      setTimeout(updateImageRect, 30);
      return;
    }

    // 2. External file drop (upload new image at cursor position)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      // Update caret position to drop point
      const range = getCaretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }

      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (uploadEvt) => {
          const img = document.createElement('img');
          img.src = uploadEvt.target?.result as string;
          img.className = 'my-3 rounded-xl max-w-full cursor-pointer transition-all inline-block';
          img.style.maxHeight = '380px';
          
          if (range && editorRef.current?.contains(range.startContainer)) {
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
          } else if (editorRef.current) {
            editorRef.current.appendChild(img);
          }

          setSelectedImage(img);
          if (editorRef.current) {
            isInternalEditorUpdateRef.current = true;
            setEditorContent(editorRef.current.innerHTML);
          }
          setTimeout(updateImageRect, 40);
        };
        reader.readAsDataURL(file);
      }
      return;
    }
  };

  useEffect(() => {
    // If admin is editing an existing event or user is in edit mode, do not restore drafts or overwrite with defaults
    if (searchParams.get('adminEdit') || searchParams.get('editId')) {
      return;
    }

    const savedDraft = safeStorage.getItem('eventDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.eventName) setEventName(parsed.eventName);
        if (parsed.venueName) setVenueName(parsed.venueName);
        if (parsed.province) setProvince(parsed.province);
        if (parsed.district) setDistrict(parsed.district);
        if (parsed.streetAddress) setStreetAddress(parsed.streetAddress);
        if (parsed.organizerName) setOrganizerName(parsed.organizerName);
        if (parsed.organizerPhone) setOrganizerPhone(parsed.organizerPhone);
        if (parsed.organizerEmail) setOrganizerEmail(parsed.organizerEmail);
        if (parsed.organizerInfo) setOrganizerInfo(parsed.organizerInfo);
        if (parsed.organizerContact) setOrganizerContact(parsed.organizerContact);
        if (parsed.organizerLogo) setOrganizerLogo(parsed.organizerLogo);
        if (parsed.organizerSocialLinks) setOrganizerSocialLinks(parsed.organizerSocialLinks);
        if (parsed.eventType) setEventType(parsed.eventType);
        if (parsed.onlinePlatform) setOnlinePlatform(parsed.onlinePlatform);
        if (parsed.onlineMeetingUrl) setOnlineMeetingUrl(parsed.onlineMeetingUrl);
        if (parsed.onlinePasscode) setOnlinePasscode(parsed.onlinePasscode);
        if (parsed.onlineInstructions) setOnlineInstructions(parsed.onlineInstructions);
        if (parsed.dateType) setDateType(parsed.dateType);
        if (parsed.flexibleDateDesc) setFlexibleDateDesc(parsed.flexibleDateDesc);
        if (parsed.bookingAvailableDays && Array.isArray(parsed.bookingAvailableDays)) setBookingAvailableDays(parsed.bookingAvailableDays);
        if (parsed.bookingTimeSlots && Array.isArray(parsed.bookingTimeSlots)) setBookingTimeSlots(parsed.bookingTimeSlots);
        if (parsed.bookingSlotCapacities && typeof parsed.bookingSlotCapacities === 'object') setBookingSlotCapacities(parsed.bookingSlotCapacities);
        if (parsed.activeStep) setActiveStep(parsed.activeStep);
        if (parsed.showRemainingTickets !== undefined) setShowRemainingTickets(parsed.showRemainingTickets);
        if (parsed.allowRefunds !== undefined) setAllowRefunds(parsed.allowRefunds);
        if (parsed.maxTickets) setMaxTickets(parsed.maxTickets);
        if (parsed.verticalImage) setVerticalImage(parsed.verticalImage);
        if (parsed.horizontalImage) setHorizontalImage(parsed.horizontalImage);
        if (parsed.galleryImages && Array.isArray(parsed.galleryImages)) setGalleryImages(parsed.galleryImages);
        
        if (parsed.startDate) setStartDate(parsed.startDate);
        if (parsed.startTime) setStartTime(parsed.startTime);
        if (parsed.endDate) setEndDate(parsed.endDate);
        if (parsed.endTime) setEndTime(parsed.endTime);
        if (parsed.ticketTiers) setTicketTiers(parsed.ticketTiers);
        if (parsed.enableCoupons !== undefined) setEnableCoupons(parsed.enableCoupons);
        if (parsed.coupons) setCoupons(parsed.coupons);
        
        if (parsed.bankName) setBankName(parsed.bankName);
        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
        if (parsed.accountHolder) setAccountHolder(parsed.accountHolder);
        
        if (parsed.hasSeating !== undefined) setHasSeating(parsed.hasSeating);
        if (parsed.zoneImage) setZoneImage(parsed.zoneImage);
        if (parsed.hasTimeSelection !== undefined) setHasTimeSelection(parsed.hasTimeSelection);
        if (parsed.timeSlots) setTimeSlots(parsed.timeSlots);
        if (parsed.availableDates) setAvailableDates(parsed.availableDates);
        if (parsed.editorContent) setEditorContent(parsed.editorContent);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }

    // Auto-fill organizer payment information if saved previously or if organizer created events before
    const savedPaymentInfo = safeStorage.getItem('organizer_payment_info');
    let hasLoadedPay = false;
    if (savedPaymentInfo) {
      try {
        const parsedPay = JSON.parse(savedPaymentInfo);
        if (parsedPay.bankName) { setBankName(parsedPay.bankName); hasLoadedPay = true; }
        if (parsedPay.accountNumber) { setAccountNumber(parsedPay.accountNumber); hasLoadedPay = true; }
        if (parsedPay.accountHolder) { setAccountHolder(parsedPay.accountHolder); hasLoadedPay = true; }
      } catch (e) {
        console.error("Failed to parse organizer payment info", e);
      }
    }

    if (!hasLoadedPay && localEvents.length > 0) {
      const prevWithBank = localEvents.find((e: any) => e.bankName || e.accountNumber || e.accountHolder);
      if (prevWithBank) {
        if (prevWithBank.bankName) setBankName(prevWithBank.bankName);
        if (prevWithBank.accountNumber) setAccountNumber(prevWithBank.accountNumber);
        if (prevWithBank.accountHolder) setAccountHolder(prevWithBank.accountHolder);
      } else {
        setBankName('BCEL');
        setAccountNumber('160-12-00001234-001');
        setAccountHolder('LAO EVENT ORGANIZER CO., LTD');
      }
    }
  }, []);

  // Flag to avoid re-injecting innerHTML when changes originate from the editor or toolbar itself
  const isInternalEditorUpdateRef = useRef(false);
  const prevStepRef = useRef(activeStep);

  useEffect(() => {
    // Only synchronize innerHTML from external sources (e.g. initial draft load or step switch),
    // NEVER when the update was triggered internally by typing or formatting!
    if (activeStep === 1 && editorRef.current && editorContent !== null) {
      if (isInternalEditorUpdateRef.current) {
        isInternalEditorUpdateRef.current = false;
      } else if (prevStepRef.current !== 1 || editorRef.current.innerHTML !== editorContent) {
        editorRef.current.innerHTML = editorContent;
      }
    }
    prevStepRef.current = activeStep;
  }, [activeStep, editorContent]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    
    const currentHtml = editorRef.current?.innerHTML || '';
    if (currentHtml) {
      setEditorContent(currentHtml);
    }
    
    const draftData = {
      eventName,
      venueName,
      province,
      district,
      streetAddress,
      organizerName,
      organizerPhone,
      organizerEmail,
      organizerInfo,
      organizerContact,
      organizerLogo,
      organizerSocialLinks,
      eventType,
      onlinePlatform,
      onlineMeetingUrl,
      onlinePasscode,
      onlineInstructions,
      dateType,
      flexibleDateDesc,
      bookingAvailableDays,
      bookingTimeSlots,
      bookingSlotCapacities,
      activeStep,
      showRemainingTickets,
      allowRefunds,
      maxTickets,
      verticalImage,
      horizontalImage,
      galleryImages,
      startDate,
      startTime,
      endDate,
      endTime,
      ticketTiers,
      coupons,
      enableCoupons,
      bankName,
      accountNumber,
      accountHolder,
      hasSeating,
      zoneImage,
      hasTimeSelection,
      timeSlots,
      availableDates,
      editorContent: currentHtml || editorContent || ''
    };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    safeStorage.setItem('eventDraft', JSON.stringify(draftData));
    setLastSavedTime(new Date());
    setIsSavingDraft(false);
    setDraftSaved(true);
    
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleSaveDraftRef = useRef(handleSaveDraft);

  useEffect(() => {
    handleSaveDraftRef.current = handleSaveDraft;
  }, [handleSaveDraft]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'createEvent') {
        handleSaveDraftRef.current();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleDragOver = (e: React.DragEvent, setDragging: (val: boolean) => void) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent, setDragging: (val: boolean) => void) => {
    e.preventDefault();
    setDragging(false);
  };

  const simulateUpload = async (file: File, setImage: (val: string) => void, setProgress: (val: number | null) => void) => {
    if (file.type.startsWith('image/')) {
      setProgress(15);
      try {
        const compressed = await compressImage(file, 1280, 1280, 0.75);
        setProgress(75);
        setTimeout(() => {
          setImage(compressed);
          setProgress(100);
          setTimeout(() => setProgress(null), 200);
        }, 100);
      } catch (err) {
        console.error('Image compression failed:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImage(event.target.result as string);
            setProgress(null);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, setImage: (val: string) => void, setDragging: (val: boolean) => void, setProgress: (val: number | null) => void) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0], setImage, setProgress);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, setImage: (val: string) => void, setProgress: (val: number | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0], setImage, setProgress);
    }
  };

  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<number | null>(null);

  const handleGalleryFilesInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 10 - galleryImages.length;
    if (remainingSlots <= 0) {
      alert(lang === 'lo' ? 'ເພີ່ມຮູບສະໄລ້ໄດ້ສູງສຸດ 10 ຮູບ' : 'Maximum 10 slideshow images allowed');
      return;
    }
    
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);
    setGalleryUploadProgress(20);
    
    try {
      const compressedList = await Promise.all(
        filesToProcess.map((file: File) => compressImage(file, 1280, 1280, 0.75))
      );
      const validUrls = compressedList.filter(Boolean);
      setGalleryImages(prev => {
        const updated = [...prev, ...validUrls].slice(0, 10);
        if (!horizontalImage && !verticalImage && updated.length > 0) {
          setHorizontalImage(updated[0]);
          setVerticalImage(updated[0]);
        }
        return updated;
      });
      setGalleryUploadProgress(100);
      setTimeout(() => setGalleryUploadProgress(null), 300);
    } catch (err) {
      console.error(err);
      setGalleryUploadProgress(null);
    }
    e.target.value = '';
  };

  const handleGalleryDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingGallery(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 10 - galleryImages.length;
    if (remainingSlots <= 0) {
      alert(lang === 'lo' ? 'ເພີ່ມຮູບສະໄລ້ໄດ້ສູງສຸດ 10 ຮູບ' : 'Maximum 10 slideshow images allowed');
      return;
    }
    
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);
    setGalleryUploadProgress(20);
    
    try {
      const compressedList = await Promise.all(
        filesToProcess.map((file: File) => compressImage(file, 1280, 1280, 0.75))
      );
      const validUrls = compressedList.filter(Boolean);
      setGalleryImages(prev => {
        const updated = [...prev, ...validUrls].slice(0, 10);
        if (!horizontalImage && !verticalImage && updated.length > 0) {
          setHorizontalImage(updated[0]);
          setVerticalImage(updated[0]);
        }
        return updated;
      });
      setGalleryUploadProgress(100);
      setTimeout(() => setGalleryUploadProgress(null), 300);
    } catch (err) {
      console.error(err);
      setGalleryUploadProgress(null);
    }
  };

  const handleSetCoverFromGallery = (url: string) => {
    setHorizontalImage(url);
    setVerticalImage(url);
  };

  const handleRemoveCover = () => {
    setHorizontalImage(null);
    setVerticalImage(null);
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const removedUrl = galleryImages[indexToRemove];
    const nextGallery = galleryImages.filter((_, idx) => idx !== indexToRemove);
    setGalleryImages(nextGallery);
    
    if ((horizontalImage === removedUrl || verticalImage === removedUrl)) {
      if (nextGallery.length > 0) {
        setHorizontalImage(nextGallery[0]);
        setVerticalImage(nextGallery[0]);
      } else {
        setHorizontalImage(null);
        setVerticalImage(null);
      }
    }
  };

  const resetForm = () => {
    setEditingEventId(null);
    setValidationError(null);
    setEventName('');
    setVenueName('');
    setProvince('');
    setDistrict('');
    setStreetAddress('');
    setLatitude(undefined);
    setLongitude(undefined);
    setOrganizerName('');
    setOrganizerInfo('');
    setOrganizerContact('');
    setEventType('offline');
    setDateType('flexible');
    setFlexibleDateDesc('');
    setBookingAvailableDays([]);
    setBookingTimeSlots([]);
    setBookingSlotCapacities({});
    setNewBookingSlotCapacity(10);
    setDefaultBookingCapacity(10);
    setAvailableDates([]);
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setTicketTiers([{ id: 1, name: '', price: '', quantity: '', saleStartDate: '', saleStartTime: '', saleEndDate: '', saleEndTime: '' }]);
    setCoupons([]);
    setEnableCoupons(false);
    setHasSeating(false);
    setZoneImage(null);
    setHasTimeSelection(false);
    setTimeSlots([]);
    setVerticalImage(null);
    setHorizontalImage(null);
    setGalleryImages([]);
    setEventPrivacy('public');
    setAttendeeMessage('');

    // Retain saved organizer payment info if available
    const savedPaymentInfo = safeStorage.getItem('organizer_payment_info');
    if (savedPaymentInfo) {
      try {
        const parsedPay = JSON.parse(savedPaymentInfo);
        if (parsedPay.bankName) setBankName(parsedPay.bankName);
        if (parsedPay.accountNumber) setAccountNumber(parsedPay.accountNumber);
        if (parsedPay.accountHolder) setAccountHolder(parsedPay.accountHolder);
      } catch (e) {}
    } else if (localEvents.length > 0) {
      const prevWithBank = localEvents.find((e: any) => e.bankName || e.accountNumber || e.accountHolder);
      if (prevWithBank) {
        if (prevWithBank.bankName) setBankName(prevWithBank.bankName);
        if (prevWithBank.accountNumber) setAccountNumber(prevWithBank.accountNumber);
        if (prevWithBank.accountHolder) setAccountHolder(prevWithBank.accountHolder);
      } else {
        setBankName('BCEL');
        setAccountNumber('160-12-00001234-001');
        setAccountHolder('LAO EVENT ORGANIZER CO., LTD');
      }
    }
  };

  const handleContinue = async () => {
    // If on Step 1..3, just go to next step without validating yet
    if (activeStep < 4) {
      setValidationError(null);
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
      return;
    }

    setAttemptedSubmit(true);
    const allMissing = getMissingFieldsList();

    // On Step 4 (Publish): validate all steps 1..4
    if (allMissing.length > 0) {
      const first = allMissing[0];
      setValidationError(
        lang === 'lo'
          ? `ຂໍ້ມູນກິດຈະກຳຍັງບໍ່ຄົບຖ້ວນ. ຂາດຂໍ້ມູນຈຳເປັນ ${allMissing.length} ຢ່າງ:`
          : `Event information incomplete. ${allMissing.length} required field(s) missing:`
      );
      jumpToMissingField(first.step, first.elementId);
      return;
    }

    setValidationError(null);

    let finalDescription = editorContent || '';
    if (activeStep === 1 && editorRef.current) {
      finalDescription = editorRef.current.innerHTML;
      setEditorContent(finalDescription);
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    } else {
      // Save payment info for organizer so they don't have to enter it again
      const paymentData = {
        bankName: bankName || 'BCEL',
        accountNumber: accountNumber || '160-12-00001234-001',
        accountHolder: accountHolder || 'LAO EVENT ORGANIZER CO., LTD',
      };
      safeStorage.setItem('organizer_payment_info', JSON.stringify(paymentData));

      // Remove draft immediately to free up browser storage quota
      safeStorage.removeItem('eventDraft');

      // Fetch fresh storage events so we don't clobber updates that occurred while the organizer was creating the event
      let currentStorageEvents: any[] = [];
      try {
        const saved = safeStorage.getItem('organizer_events');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) currentStorageEvents = parsed;
        }
      } catch (e) {
        console.error(e);
      }
      if (currentStorageEvents.length === 0 && localEvents.length > 0) {
        currentStorageEvents = [...localEvents];
      }

      if (editingEventId) {
        setWasEditing(true);
        // Update existing event
        const updatedEvents = currentStorageEvents.map(evt => {
          if (String(evt.id) === String(editingEventId)) {
            return {
              ...evt,
              title: eventName,
              category: eventType === 'online' ? 'Workshop' : category,
              venue: venueName,
              province: province || evt.province,
              district: district || evt.district,
              location: streetAddress,
              latitude: latitude !== undefined ? latitude : evt.latitude,
              longitude: longitude !== undefined ? longitude : evt.longitude,
              googleMapUrl: googleMapsLink || evt.googleMapUrl,
              // Keep organizer-created profile and verification data
              organizer: organizerName || evt.organizer,
              organizerInfo: organizerInfo !== undefined && organizerInfo !== '' ? organizerInfo : evt.organizerInfo,
              organizerContact: organizerContact || evt.organizerContact,
              organizerPhone: organizerPhone || evt.organizerPhone,
              organizerEmail: organizerEmail || evt.organizerEmail,
              organizerLogo: organizerLogo || evt.organizerLogo,
              organizerSocialLinks: organizerSocialLinks && Object.keys(organizerSocialLinks).length > 0 ? organizerSocialLinks : (evt.organizerSocialLinks || {}),
              bankName: bankName || evt.bankName || 'BCEL',
              accountNumber: accountNumber || evt.accountNumber || '160-12-00001234-001',
              accountHolder: accountHolder || evt.accountHolder || 'LAO EVENT ORGANIZER CO., LTD',
              userId: evt.userId,
              organizerId: evt.organizerId,
              createdBy: evt.createdBy,
              creatorEmail: evt.creatorEmail,
              createdAt: evt.createdAt,
              registered: evt.registered,
              scanned: evt.scanned,
              totalTickets: evt.totalTickets,
              soldTickets: evt.soldTickets,
              revenue: evt.revenue,
              views: evt.views,
              purchases: evt.purchases,
              likes: evt.likes,
              featured: evt.featured,
              eventType,
              onlinePlatform,
              onlineMeetingUrl,
              onlinePasscode,
              onlineInstructions,
              dateType,
              flexibleDateDesc: dateType === 'flexible' ? flexibleDateDesc : '',
              bookingAvailableDays: dateType === 'booking' ? bookingAvailableDays : [],
              bookingTimeSlots: dateType === 'booking' ? bookingTimeSlots : [],
              bookingSlotCapacities: dateType === 'booking' ? bookingSlotCapacities : {},
              bookingCapacity: dateType === 'booking' ? (Object.values(bookingSlotCapacities).length > 0 ? Math.max(...Object.values(bookingSlotCapacities).map(v => Number(v) || 0)) : 10) : undefined,
              date: dateType === 'flexible' && availableDates.length > 0 ? availableDates[0].date : (startDate || evt.date || new Date().toISOString().split('T')[0]),
              time: dateType === 'flexible' && availableDates.length > 0 && availableDates[0].startTime ? availableDates[0].startTime : (dateType === 'booking' && bookingTimeSlots.length > 0 ? bookingTimeSlots[0] : (startTime || evt.time || '18:00')),
              endDate: dateType === 'flexible' && availableDates.length > 0 ? availableDates[availableDates.length - 1].date : (endDate || startDate || evt.endDate || new Date().toISOString().split('T')[0]),
              endTime: endTime || evt.endTime || '22:00',
              durationEn: durationEn || evt.durationEn,
              durationLo: durationLo || evt.durationLo,
              languages: selectedLanguages && selectedLanguages.length > 0 ? selectedLanguages : (evt.languages || ['Lao', 'English']),
              ticketTiers: ticketTiers.map(tier => ({
                id: tier.id ? String(tier.id) : String(Math.random()),
                name: tier.name,
                price: Number(String(tier.price).replace(/,/g, '')) || 0,
                available: Number(String(tier.quantity).replace(/,/g, '')) || 100,
                description: tier.name + ' Access',
              })),
              coupons: coupons || evt.coupons,
              hasSeating: hasSeating !== undefined ? hasSeating : evt.hasSeating,
              zoneImage: zoneImage || evt.zoneImage,
              hasTimeSelection: dateType === 'flexible' && availableDates.some(d => !!d.startTime),
              timeSlots: dateType === 'flexible' ? Array.from(new Set(availableDates.map(d => d.startTime).filter(Boolean))) : [],
              availableDates: dateType === 'flexible' ? availableDates : [],
              image: verticalImage || horizontalImage || evt.image,
              exampleImages: galleryImages.length > 0 ? galleryImages : (verticalImage ? [verticalImage] : (evt.exampleImages || [])),
              description: editorContent || evt.description || (eventName + ' description'),
              cancellationPolicy: cancellationPolicy || evt.cancellationPolicy,
              showRemainingTickets: showRemainingTickets !== undefined ? showRemainingTickets : evt.showRemainingTickets,
              allowRefunds: allowRefunds !== undefined ? allowRefunds : evt.allowRefunds,
              allowReviews: allowReviews !== undefined ? allowReviews : evt.allowReviews,
              maxTickets: maxTickets || evt.maxTickets,
              enableCountdown: false,
              eventPrivacy: eventPrivacy || evt.eventPrivacy,
              attendeeMessage: attendeeMessage || evt.attendeeMessage,
              status: eventStatus || evt.status || 'pending',
            };
          }
          return evt;
        });
        setLocalEvents(updatedEvents);
        safeStorage.setItem('organizer_events', JSON.stringify(updatedEvents));
        // Mirror to Postgres (source of truth); non-blocking.
        const edited = updatedEvents.find((e) => String(e.id) === String(editingEventId));
        if (edited) api.updateEvent(String(editingEventId), toEventPayload(edited));
        setEditingEventId(null);
      } else {
        setWasEditing(false);
        // Create new event
        const newEvent = {
          id: String(Date.now()),
          title: eventName,
          category: eventType === 'online' ? 'Workshop' : category,
          venue: venueName,
          province,
          district,
          location: streetAddress,
          latitude,
          longitude,
          googleMapUrl: googleMapsLink,
          organizer: organizerName,
          organizerInfo,
          organizerContact,
          organizerPhone,
          organizerEmail,
          organizerLogo,
          organizerSocialLinks,
          bankName: bankName || 'BCEL',
          accountNumber: accountNumber || '160-12-00001234-001',
          accountHolder: accountHolder || 'LAO EVENT ORGANIZER CO., LTD',
          submittedAt: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          views: 0,
          purchases: 0,
          registered: 0,
          likes: 0,
          revenue: '₭ 0',
          eventType,
          onlinePlatform,
          onlineMeetingUrl,
          onlinePasscode,
          onlineInstructions,
          dateType,
          flexibleDateDesc: dateType === 'flexible' ? flexibleDateDesc : '',
          bookingAvailableDays: dateType === 'booking' ? bookingAvailableDays : [],
          bookingTimeSlots: dateType === 'booking' ? bookingTimeSlots : [],
          bookingSlotCapacities: dateType === 'booking' ? bookingSlotCapacities : {},
          bookingCapacity: dateType === 'booking' ? (Object.values(bookingSlotCapacities).length > 0 ? Math.max(...Object.values(bookingSlotCapacities).map(v => Number(v) || 0)) : 10) : undefined,
          date: dateType === 'flexible' && availableDates.length > 0 ? availableDates[0].date : (startDate || new Date().toISOString().split('T')[0]),
          time: dateType === 'flexible' && availableDates.length > 0 && availableDates[0].startTime ? availableDates[0].startTime : (dateType === 'booking' && bookingTimeSlots.length > 0 ? bookingTimeSlots[0] : (startTime || '18:00')),
          endDate: dateType === 'flexible' && availableDates.length > 0 ? availableDates[availableDates.length - 1].date : (endDate || startDate || new Date().toISOString().split('T')[0]),
          endTime: endTime || '22:00',
          durationEn,
          durationLo,
          languages: selectedLanguages,
          ticketTiers: ticketTiers.map(tier => ({
            id: String(tier.id || Date.now()),
            name: tier.name,
            price: Number(String(tier.price).replace(/,/g, '')) || 0,
            available: Number(String(tier.quantity).replace(/,/g, '')) || 100,
            description: tier.name + ' Access',
          })),
          coupons,
          hasSeating: hasSeating,
          zoneImage: zoneImage,
          hasTimeSelection: dateType === 'flexible' && availableDates.some(d => !!d.startTime),
          timeSlots: dateType === 'flexible' ? Array.from(new Set(availableDates.map(d => d.startTime).filter(Boolean))) : [],
          availableDates: dateType === 'flexible' ? availableDates : [],
          image: verticalImage || horizontalImage || 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=2000&auto=format&fit=crop',
          exampleImages: galleryImages.length > 0 ? galleryImages : (verticalImage ? [verticalImage] : []),
          description: editorContent || (eventName + ' description'),
          cancellationPolicy,
          showRemainingTickets,
          allowRefunds,
          allowReviews,
          maxTickets,
          enableCountdown: false,
          eventPrivacy,
          attendeeMessage,
          status: eventStatus || 'pending',
        };
        const updatedEvents = [newEvent, ...currentStorageEvents.filter(e => String(e.id) !== String(newEvent.id))];
        setLocalEvents(updatedEvents);
        safeStorage.setItem('organizer_events', JSON.stringify(updatedEvents));
        // Mirror to Postgres (source of truth); non-blocking.
        api.createEvent(toEventPayload(newEvent));
      }
      }
      setShowSuccessModal(true);
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-1 bg-[#F9FAFB] text-gray-600 font-sans overflow-hidden min-h-screen"
    >
      <SEO
        title={editingEventId ? (lang === 'lo' ? 'ແກ້ໄຂກິດຈະກຳ' : 'Edit Event') : (lang === 'lo' ? 'ສ້າງກິດຈະກຳໃໝ່' : 'Create Event | Organizer Center')}
        description="Host workshops, sports adventures, festivals and sell tickets with Pasopkan organizer suite."
        noindex={true}
      />
      {/* Sidebar */}
      <div className="w-64 sm:w-72 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="h-24 sm:h-28 flex items-center justify-center px-6 border-b border-gray-100">
          <Link to="/" className="flex flex-col items-center text-center gap-1.5 group transition-opacity hover:opacity-80 w-full">
            <img 
              src="/pasopkan_logo.png" 
              alt="Pasopkan Logo" 
              className="h-14 sm:h-16 lg:h-18 w-auto max-w-[220px] object-contain self-center mx-auto transition-transform duration-300 hover:scale-[1.03]" 
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-[0.2em] sm:tracking-[0.24em] text-adv-orange font-black leading-none text-center w-full truncate">{t.organizerCenter}</span>
          </Link>
        </div>
        <div className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-adv-orange/10 text-adv-orange font-bold' : 'text-gray-500 hover:text-adv-slate hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium text-sm">{lang === 'lo' ? 'ສະຖິຕິ & ກຣາບ' : 'Analytics & Graphs'}</span>
          </button>
          
          
          {(activeTab === 'createEvent' || editingEventId) && (
            <button 
              onClick={() => setActiveTab('createEvent')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'createEvent' ? 'bg-adv-orange/10 text-adv-orange font-bold border-l-4 border-adv-orange' : 'text-gray-500 hover:text-adv-slate hover:bg-gray-50'}`}
            >
              <Plus className="w-5 h-5 shrink-0 text-adv-orange" />
              <span className="font-bold text-sm truncate">
                {eventName.trim() ? eventName : t.createEvent}
              </span>
            </button>
          )}

          <button 
            onClick={() => setActiveTab('terms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'terms' ? 'bg-adv-orange/10 text-adv-orange font-bold' : 'text-gray-500 hover:text-adv-slate hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium text-sm">{t.terms}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F9FAFB]">
        {/* Topbar */}
        <div className="h-24 sm:h-28 flex items-center justify-end px-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-all border border-gray-100 group"
              title={t.language}
            >
              <Globe className="w-4 h-4 text-gray-400 group-hover:text-adv-orange transition-colors" />
              <span className="text-sm font-bold text-adv-slate uppercase">{lang === 'lo' ? 'la' : lang}</span>
            </button>
            <button 
              onClick={() => { resetForm(); setActiveStep(1); setActiveTab('createEvent'); }}
              className="flex items-center gap-2 bg-adv-orange hover:bg-adv-orange/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.createEvent}
            </button>
            <div className="relative">
              <button 
                onClick={() => navigate('/account')}
                className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-3 rounded-full transition-colors border border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-adv-slate">{t.account}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            
            {activeTab === 'createEvent' && (
              <>
                {/* Stepper & Actions */}
                <div className="flex items-center justify-between mb-8 border-b border-gray-100">
                  <div className="flex items-center flex-1 max-w-4xl">
                    <button 
                      onClick={() => setActiveStep(1)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 1 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 1 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>1</div>
                      <span className={`text-sm font-bold ${activeStep === 1 ? 'text-adv-slate' : 'text-gray-400'}`}>{t.step1}</span>
                      {attemptedSubmit && getMissingFieldsList().some(m => m.step === 1) && (
                        <span className="w-2 h-2 rounded-full bg-adv-orange animate-pulse shrink-0" title="Missing fields" />
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveStep(2)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 2 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 2 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>2</div>
                      <span className={`text-sm font-bold ${activeStep === 2 ? 'text-adv-slate' : 'text-gray-400'}`}>{t.step2}</span>
                      {attemptedSubmit && getMissingFieldsList().some(m => m.step === 2) && (
                        <span className="w-2 h-2 rounded-full bg-adv-orange animate-pulse shrink-0" title="Missing fields" />
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveStep(3)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 3 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 3 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>3</div>
                      <span className={`text-sm font-bold ${activeStep === 3 ? 'text-adv-slate' : 'text-gray-400'}`}>{lang === 'lo' ? 'ຄຳຖາມ' : 'Questions'}</span>
                    </button>
                    <button 
                      onClick={() => setActiveStep(4)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 4 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 4 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>4</div>
                      <span className={`text-sm font-bold ${activeStep === 4 ? 'text-adv-slate' : 'text-gray-400'}`}>{t.step3}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 ml-8 pb-4">
                    {/* Privacy Selector Dropdown */}
                    <div className="relative" ref={privacyDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-adv-orange border border-orange-200 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                        title={t.eventPrivacy}
                      >
                        {eventPrivacy === 'private' ? (
                          <Lock className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                        )}
                        <span>
                          {eventPrivacy === 'private' ? t.privateEvent : t.publicEvent}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-adv-orange transition-transform ${showPrivacyDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showPrivacyDropdown && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white text-adv-slate rounded-2xl p-2.5 shadow-xl shadow-orange-500/10 border border-orange-200/90 ring-1 ring-orange-100 z-[60]"
                          >
                            {/* Public Option */}
                            <button
                              type="button"
                              onClick={() => {
                                setEventPrivacy('public');
                                setShowPrivacyDropdown(false);
                              }}
                              className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer ${
                                eventPrivacy === 'public'
                                  ? 'bg-orange-50/90 border border-orange-200/70 text-adv-orange'
                                  : 'hover:bg-orange-50/50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Globe className="w-4.5 h-4.5 text-adv-orange shrink-0 mt-0.5" />
                                <div>
                                  <div className={`text-sm leading-snug ${eventPrivacy === 'public' ? 'font-extrabold text-adv-orange' : 'font-bold text-adv-slate'}`}>
                                    {t.publicEvent}
                                  </div>
                                  <div className="text-xs text-gray-500 font-normal leading-relaxed mt-0.5">
                                    {t.publicEventDesc}
                                  </div>
                                </div>
                              </div>
                              {eventPrivacy === 'public' && (
                                <Check className="w-4 h-4 text-adv-orange shrink-0 mt-0.5" />
                              )}
                            </button>

                            {/* Private Option */}
                            <button
                              type="button"
                              onClick={() => {
                                setEventPrivacy('private');
                                setShowPrivacyDropdown(false);
                              }}
                              className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer mt-1 ${
                                eventPrivacy === 'private'
                                  ? 'bg-orange-50/90 border border-orange-200/70 text-adv-orange'
                                  : 'hover:bg-orange-50/50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Lock className="w-4.5 h-4.5 text-adv-orange shrink-0 mt-0.5" />
                                <div>
                                  <div className={`text-sm leading-snug ${eventPrivacy === 'private' ? 'font-extrabold text-adv-orange' : 'font-bold text-adv-slate'}`}>
                                    {t.privateEvent}
                                  </div>
                                  <div className="text-xs text-gray-500 font-normal leading-relaxed mt-0.5">
                                    {t.privateEventDesc}
                                  </div>
                                </div>
                              </div>
                              {eventPrivacy === 'private' && (
                                <Check className="w-4 h-4 text-adv-orange shrink-0 mt-0.5" />
                              )}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {lastSavedTime && (
                      <span className="text-xs text-gray-400 mr-2 animate-in fade-in duration-500 font-medium">
                        {t.lastSaved} {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button 
                      onClick={handleSaveDraft}
                      disabled={isLoading || isSavingDraft}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-200 text-adv-slate rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] shadow-sm"
                    >
                      {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {isSavingDraft ? t.saving : draftSaved ? t.saved : t.save}
                    </button>
                    <button 
                      onClick={handleContinue}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-adv-orange text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] shadow-sm"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {activeStep === 4 ? t.publish : t.continue}
                    </button>
                  </div>
                </div>

            
            {/* Form Container */}
            <div className="space-y-6">
              {/* Missing Fields Banner */}
              {attemptedSubmit && getMissingFieldsList().length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="p-5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-adv-orange/50 rounded-3xl shadow-md mb-6 space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-adv-orange text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-orange-950 flex items-center gap-2">
                          <span>{lang === 'lo' ? 'ຂໍ້ມູນຈຳເປັນຍັງບໍ່ຄົບຖ້ວນ' : 'Incomplete Required Information'}</span>
                          <span className="bg-adv-orange text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                            {getMissingFieldsList().length} {lang === 'lo' ? 'ຢ່າງ' : 'Missing'}
                          </span>
                        </h4>
                        <p className="text-xs font-medium text-orange-900/90 mt-0.5">
                          {lang === 'lo'
                            ? 'ກະລຸນາປ້ອນຂໍ້ມູນໃນຊ່ອງດັ່ງລຸ່ມນີ້ໃຫ້ຄົບຖ້ວນ. ຄລິກທີ່ລາຍການເພື່ອໄປທີ່ຊ່ອງນັ້ນໂດຍກົງ:'
                            : 'Please fill in the required fields below before publishing. Click any item to jump directly to it:'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-orange-200/80">
                    {getMissingFieldsList().map((item) => {
                      const isActiveStep = activeStep === item.step;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => jumpToMissingField(item.step, item.elementId)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border shadow-2xs cursor-pointer ${
                            isActiveStep 
                              ? 'bg-adv-orange text-white border-adv-orange ring-2 ring-orange-300' 
                              : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-100/70 hover:border-orange-300'
                          }`}
                        >
                          <span className="opacity-80 font-bold">[{lang === 'lo' ? `ຂັ້ນຕອນ ${item.step}` : `Step ${item.step}`}]</span>
                          <span>{lang === 'lo' ? item.fieldLo : item.fieldEn}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
              {activeStep === 1 && (
                <>
                  {/* Event Name */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" id="field-event-name">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-adv-orange font-bold">*</span>
                      <span className="text-adv-slate font-bold text-sm">{t.eventName}</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={eventName} 
                        onChange={(e) => setEventName(e.target.value)}
                        maxLength={100}
                        placeholder={lang === 'lo' ? 'ປ້ອນຊື່ກິດຈະກຳ...' : 'Enter event name...'}
                        className={`w-full bg-white text-adv-slate border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all placeholder:text-gray-300 font-bold shadow-inner ${attemptedSubmit && !eventName.trim() ? 'border-orange-400 bg-orange-50/20 ring-2 ring-orange-200' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Redesigned Image Upload Section */}
                  <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-150/80 space-y-7">
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-adv-orange font-black text-base">*</span>
                          <h3 className="text-lg font-extrabold text-adv-slate">
                            {lang === 'lo' ? 'ຮູບໜ້າປົກ & ຮູບສະໄລ້ກິດຈະກຳ' : 'Event Cover & Gallery Slideshow'}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {lang === 'lo' 
                            ? 'ເພີ່ມ 1 ຮູບໜ້າປົກຫຼັກ ແລະ ຮູບສະໄລ້ໄດ້ສູງສຸດ 10 ຮູບ ສຳລັບສະແດງໃນໜ້າກິດຈະກຳ'
                            : 'Upload 1 main event cover photo and up to 10 slideshow images for your event page'}
                        </p>
                      </div>
                    </div>

                    {/* 1. COVER EVENT IMAGE BOX */}
  {attemptedSubmit && (!horizontalImage && !verticalImage) && (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2 text-xs font-bold text-orange-800">
      <AlertCircle className="w-4 h-4 text-adv-orange shrink-0" />
      <span>{lang === 'lo' ? 'ກະລຸນາອັບໂຫຼດຮູບໜ້າປົກກິດຈະກຳ' : 'Main event cover photo is required'}</span>
    </div>
  )}
                    <div className="space-y-3" id="field-cover-image">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-adv-slate uppercase tracking-wider flex items-center gap-2">
                          <span>{lang === 'lo' ? 'ຮູບໜ້າປົກກິດຈະກຳ (Cover Event Image)' : 'Main Event Cover Photo'}</span>
                          <span className="text-adv-orange">*</span>
                        </label>
                      </div>

                      <div 
                        className={`relative w-full aspect-video rounded-2xl border-2 border-dashed ${
                          isDraggingHorizontal ? 'border-adv-orange bg-adv-orange/5' : 'border-gray-300 bg-gray-50/70 hover:bg-adv-orange/5 hover:border-adv-orange'
                        } flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 group overflow-hidden shadow-xs`}
                        onDragOver={(e) => handleDragOver(e, setIsDraggingHorizontal)}
                        onDragLeave={(e) => handleDragLeave(e, setIsDraggingHorizontal)}
                        onDrop={(e) => handleDrop(e, (url) => { setHorizontalImage(url); setVerticalImage(url); }, setIsDraggingHorizontal, setHorizontalUploadProgress)}
                        onClick={() => !horizontalImage && !horizontalUploadProgress && document.getElementById('main-cover-upload')?.click()}
                      >
                        <input 
                          id="main-cover-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileInput(e, (url) => { setHorizontalImage(url); setVerticalImage(url); }, setHorizontalUploadProgress)} 
                        />

                        {horizontalUploadProgress !== null ? (
                          <div className="flex flex-col items-center justify-center w-full">
                            <Loader2 className="w-8 h-8 text-adv-orange animate-spin mb-3" />
                            <div className="w-full max-w-[200px] bg-gray-200 rounded-full h-2 mb-2">
                              <div className="bg-adv-orange h-2 rounded-full transition-all duration-200" style={{ width: `${Math.min(horizontalUploadProgress, 100)}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500 font-bold">{Math.round(Math.min(horizontalUploadProgress, 100))}%</span>
                          </div>
                        ) : horizontalImage || verticalImage ? (
                          <AdaptiveImage showBlurBackdrop={true}
                            src={horizontalImage || verticalImage}
                            alt="Main cover preview"
                            fitMode={coverFitMode}
                            className="absolute inset-0 w-full h-full"
                          >
                            {/* Action Overlay */}
                            <div className="absolute inset-0 z-30 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); document.getElementById('main-cover-upload')?.click(); }}
                                className="text-white font-bold bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl backdrop-blur-md transition-colors text-xs flex items-center gap-1.5 border border-white/30 cursor-pointer"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                {lang === 'lo' ? 'ປ່ຽນຮູບ' : 'Change Cover'}
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setCoverFitMode(prev => prev === 'contain' ? 'cover' : 'contain'); }}
                                className="text-white font-bold bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl backdrop-blur-md transition-colors text-xs flex items-center gap-1.5 border border-white/30 cursor-pointer"
                              >
                                <span>{coverFitMode === 'contain' ? (lang === 'lo' ? 'ຕັດໃຫ້ເຕັມກອບ' : 'Fill Frame') : (lang === 'lo' ? 'ສະແດງເຕັມຮູບ' : 'Fit Full')}</span>
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}
                                className="text-white font-bold bg-rose-500/80 hover:bg-rose-600 px-3.5 py-2 rounded-xl backdrop-blur-md transition-colors text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {lang === 'lo' ? 'ລຶບ' : 'Remove'}
                              </button>
                            </div>
                          </AdaptiveImage>
                        ) : (
                          <>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                              isDraggingHorizontal ? 'bg-adv-orange/20 text-adv-orange' : 'bg-white shadow-sm border border-gray-200 text-gray-400 group-hover:border-adv-orange group-hover:bg-adv-orange/10 group-hover:text-adv-orange'
                            }`}>
                              <UploadCloud className="w-7 h-7" />
                            </div>
                            <p className="text-sm text-adv-slate font-extrabold mb-1">
                              {lang === 'lo' ? 'ອັບໂຫຼດຮູບໜ້າປົກກິດຈະກຳ' : 'Upload Event Cover Photo'}
                            </p>
                            <p className="text-xs text-gray-400 font-medium max-w-xs">
                              {lang === 'lo' ? 'ຄລິກ ຫຼື ລາກໄຟລ໌ມາເພີ່ມທີ່ນີ້ (ຮອງຮັບ PNG, JPG, WEBP)' : 'Click or drag & drop cover image file here (PNG, JPG, WEBP)'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 2. SLIDESHOW / GALLERY IMAGES SECTION (MAX 10) */}
                    <div className="pt-5 border-t border-gray-150/70 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-extrabold text-adv-slate uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-adv-orange" />
                            <span>{lang === 'lo' ? 'ຮູບສະໄລ້ໂຊກິດຈະກຳ (Slideshow Gallery)' : 'Event Slideshow Gallery'}</span>
                            <span className="text-gray-400 font-normal text-xs">(Max 10)</span>
                          </label>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {lang === 'lo' 
                              ? 'ຮູບພາບທີ່ຈະສະແດງເປັນສະໄລ້ໃນໜ້າກິດຈະກຳ. ສາມາດເລືອກຮູບໃດໜຶ່ງເປັນຮູບໜ້າປົກໄດ້.'
                              : 'Images will be displayed as a slideshow on the event page. You can set any slide as Cover.'}
                          </p>
                        </div>

                        {/* Upload Button */}
                        {galleryImages.length < 10 && (
                          <button
                            type="button"
                            onClick={() => document.getElementById('gallery-multi-upload')?.click()}
                            className="bg-adv-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-95 shrink-0 self-start sm:self-center cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>{lang === 'lo' ? 'ເພີ່ມຮູບສະໄລ້' : 'Add Slide Image'}</span>
                          </button>
                        )}
                      </div>

                      {/* Hidden Multi-file input */}
                      <input 
                        id="gallery-multi-upload" 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={handleGalleryFilesInput} 
                      />

                      {/* Gallery Upload Progress */}
                      {galleryUploadProgress !== null && (
                        <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-adv-orange">
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-adv-orange" />
                              {lang === 'lo' ? 'ກຳລັງອັບໂຫຼດຮູບສະໄລ້...' : 'Uploading slideshow images...'}
                            </span>
                            <span>{Math.round(galleryUploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-adv-orange h-1.5 rounded-full transition-all duration-200" 
                              style={{ width: `${Math.min(galleryUploadProgress, 100)}%` }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Gallery Grid */}
                      <div 
                        className={`p-4 rounded-2xl border-2 border-dashed transition-all ${
                          isDraggingGallery ? 'border-adv-orange bg-adv-orange/5' : 'border-gray-200 bg-gray-50/40'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingGallery(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingGallery(false); }}
                        onDrop={handleGalleryDrop}
                      >
                        {galleryImages.length === 0 ? (
                          <div 
                            onClick={() => document.getElementById('gallery-multi-upload')?.click()}
                            className="py-10 flex flex-col items-center justify-center text-center cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-adv-orange group-hover:text-adv-orange group-hover:bg-adv-orange/5 transition-colors mb-3 shadow-xs">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-extrabold text-adv-slate mb-1">
                              {lang === 'lo' ? 'ຍັງບໍ່ທັນມີຮູບສະໄລ້' : 'No slideshow images added yet'}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium">
                              {lang === 'lo' ? 'ຄລິກ ຫຼື ລາກຮູບຫຼາຍໆຮູບມາເພີ່ມຢູ່ທີ່ນີ້ (ສູງສຸດ 10 ຮູບ)' : 'Click or drag & drop multiple images here (Maximum 10 images)'}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                            {galleryImages.map((imgUrl, index) => {
                              const isCover = (horizontalImage === imgUrl || verticalImage === imgUrl);
                              return (
                                <AdaptiveImage showBlurBackdrop={true} 
                                  key={index}
                                  src={imgUrl}
                                  fitMode="contain"
                                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group shadow-xs ${
                                    isCover ? 'border-adv-orange ring-2 ring-adv-orange/30' : 'border-gray-200/80 hover:border-gray-300'
                                  }`}
                                >
                                  {/* Slide Badge */}
                                  <div className="absolute top-2 left-2 z-20 bg-black/60 text-white text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                                    #{index + 1}
                                  </div>

                                  {/* Is Cover Indicator */}
                                  {isCover && (
                                    <div className="absolute top-2 right-2 z-20 bg-adv-orange text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>Cover</span>
                                    </div>
                                  )}

                                  {/* Overlay Controls */}
                                  <div className="absolute inset-0 z-30 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-center">
                                    {!isCover && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetCoverFromGallery(imgUrl)}
                                        className="bg-adv-orange hover:bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                        <span>{lang === 'lo' ? 'ຕັ້ງເປັນໜ້າປົກ' : 'Set as Cover'}</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGalleryImage(index)}
                                      className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>{lang === 'lo' ? 'ລຶບອອກ' : 'Remove'}</span>
                                    </button>
                                  </div>
                                </AdaptiveImage>
                              );
                            })}

                            {/* Extra "+ Add" card in grid if < 10 */}
                            {galleryImages.length < 10 && (
                              <div 
                                onClick={() => document.getElementById('gallery-multi-upload')?.click()}
                                className="aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-adv-orange hover:bg-adv-orange/5 bg-white flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all group"
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-adv-orange/10 text-gray-400 group-hover:text-adv-orange flex items-center justify-center transition-colors mb-1.5">
                                  <Plus className="w-4 h-4 stroke-[3]" />
                                </div>
                                <span className="text-[11px] font-bold text-gray-500 group-hover:text-adv-orange transition-colors">
                                  {lang === 'lo' ? 'ເພີ່ມຮູບ' : 'Add Image'}
                                </span>
                                <span className="text-[9px] text-gray-400">
                                  ({10 - galleryImages.length} {lang === 'lo' ? 'ຮູບທີ່เหลือ' : 'slots left'})
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

              {/* Event Address */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-adv-orange font-bold">*</span>
                    <span className="text-adv-slate font-bold text-sm">{t.eventAddress}:</span>
                  </div>
                  {/* Segmented Pill Selector (Offline vs Online) */}
                  <div className="inline-flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200/80 shadow-inner gap-1">
                    <button 
                      type="button"
                      onClick={() => {
                        setEventType('offline');
                        setVenueName('');
                        setProvince('');
                        setDistrict('');
                        setStreetAddress('');
                      }}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                        eventType === 'offline' 
                          ? 'bg-adv-orange text-white shadow-md shadow-orange-500/20' 
                          : 'text-gray-600 hover:text-adv-slate hover:bg-gray-200/60'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      {t.offline}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setEventType('online');
                        setCategory('Workshop');
                        setVenueName('Online Event / ງານອອນລາຍ');
                        setProvince('Online');
                        setDistrict('Online');
                        setStreetAddress('Online Event / ງານອອນລາຍ');
                      }}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                        eventType === 'online' 
                          ? 'bg-adv-orange text-white shadow-md shadow-orange-500/20' 
                          : 'text-gray-600 hover:text-adv-slate hover:bg-gray-200/60'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      {t.online}
                    </button>
                  </div>
                </div>

                {eventType === 'offline' ? (
                  <>
                    <div id="field-venue-name">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-adv-orange font-bold">*</span>
                        <span className="text-adv-slate font-bold text-sm">{t.venueName}</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="text"
                          value={venueName === 'Online Event / ງານອອນລາຍ' ? '' : venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          maxLength={80}
                          placeholder={t.venueName}
                          className={`w-full bg-white text-adv-slate border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all placeholder:text-gray-300 ${attemptedSubmit && eventType === 'offline' && (!venueName || !venueName.trim() || venueName === 'Online Event / ງານອອນລາຍ') ? 'border-orange-400 bg-orange-50/20 ring-2 ring-orange-200' : 'border-gray-200'}`}
                        />
                        {attemptedSubmit && eventType === 'offline' && (!venueName || !venueName.trim() || venueName === 'Online Event / ງານອອນລາຍ') && (
                          <p className="text-xs text-adv-orange font-bold mt-1.5 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-adv-orange" />
                            <span>{lang === 'lo' ? 'ກະລຸນາປ້ອນຊື່ສະຖານທີ່' : 'Venue name is required'}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <div id="field-province">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-adv-orange font-bold">*</span>
                          <span className="text-adv-slate font-bold text-sm">{t.province}</span>
                        </div>
                        <div className="relative">
                          <select 
                            value={province === 'Online' ? '' : province}
                            onChange={(e) => {
                              setProvince(e.target.value);
                              setDistrict(''); // Reset district when province changes
                            }}
                            className="w-full bg-white text-adv-slate border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all appearance-none"
                          >
                            <option value="" disabled>{t.province}</option>
                            {laosProvinces.map(p => (
                              <option key={p.id} value={p.id}>
                                {lang === 'lo' ? p.nameLo : p.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div id="field-district">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-adv-slate font-bold text-sm">{t.district}</span>
                        </div>
                        <div className="relative">
                          <select 
                            value={district === 'Online' ? '' : district}
                            onChange={(e) => setDistrict(e.target.value)}
                            disabled={!province || province === 'Online'}
                            className="w-full bg-white text-adv-slate border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>{t.district}</option>
                            {getDistrictsForProvince(province).map(d => (
                              <option key={d.id} value={d.id}>
                                {lang === 'lo' ? d.nameLo : d.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">

                      {/* High-Fidelity Interactive Map Picker */}
                      <div className="mt-3">
                        <div className="space-y-4">
                          <EventMapPicker 
                            showOpenInMapsButton={false}
                            address={streetAddress}
                            onChangeAddress={(addr, lat, lng) => {
                              setStreetAddress(addr);
                              if (lat) setLatitude(lat);
                              if (lng) setLongitude(lng);
                            }}
                            googleMapUrl={googleMapsLink}
                            onChangeGoogleMapUrl={setGoogleMapsLink}
                            province={province}
                            district={district}
                            latitude={latitude}
                            longitude={longitude}
                            lang={lang as 'en' | 'lo'}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 bg-gray-50/70 p-6 rounded-[24px] border border-gray-200/80 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200/60">
                      <div>
                        <h4 className="text-base font-extrabold text-adv-slate flex items-center gap-2">
                          <Video className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ເລືອກແພລດຟອມຈັດງານອອນລາຍ' : 'Select Online Event Platform'}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {lang === 'lo' 
                            ? 'ເລືອກແພລດຟອມ ແລະ ປ້ອນລິ້ງເຂົ້າຮ່ວມງານອອນລາຍ. ຂໍ້ມູນນີ້ຈະຖືກສົ່ງໃຫ້ຜູ້ຊື້ປີ້ຢ່າງປອດໄພ' 
                            : 'Choose your streaming platform and configure access details for ticket holders'}
                        </p>
                      </div>
                    </div>

                    {/* Grid of Platform Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {ONLINE_PLATFORMS_LIST.map((item) => {
                        const isSelected = onlinePlatform === item.id;
                        const PlatformIcon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setOnlinePlatform(item.id as any);
                              setVenueName(`Online: ${item.name}`);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                              isSelected
                                ? `${item.activeBorder} shadow-md`
                                : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.iconBg} shadow-sm`}>
                                  <PlatformIcon className="w-4 h-4" />
                                </div>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-adv-orange text-white flex items-center justify-center shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <h5 className="font-extrabold text-sm text-adv-slate leading-snug">
                                {item.name}
                              </h5>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Platform Configuration Form */}
                    {(() => {
                      const activeItem = ONLINE_PLATFORMS_LIST.find(p => p.id === onlinePlatform) || ONLINE_PLATFORMS_LIST[0];
                      return (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 space-y-5 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Meeting / Stream Link */}
                            <div className="md:col-span-2" id="field-online-url">
                              <label className="block text-xs font-extrabold text-adv-slate uppercase tracking-wider mb-2">
                                {lang === 'lo' ? 'ລິ້ງເຂົ້າຮ່ວມງານອອນລາຍ (Stream / Meeting URL)' : 'Stream / Meeting URL'}
                                <span className="text-adv-orange ml-1">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="url"
                                  value={onlineMeetingUrl}
                                  onChange={(e) => setOnlineMeetingUrl(e.target.value)}
                                  placeholder={activeItem.placeholder}
                                  className="w-full bg-gray-50/50 text-adv-slate border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange font-medium placeholder:text-gray-300 transition-all"
                                />
                                <Globe className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>

                            {/* Passcode / Access Key */}
                            <div>
                              <label className="block text-xs font-extrabold text-adv-slate uppercase tracking-wider mb-2">
                                {lang === 'lo' ? 'ລະຫັດຜ່ານ / Passcode (ຖ້າມີ)' : 'Meeting ID / Passcode (Optional)'}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={onlinePasscode}
                                  onChange={(e) => setOnlinePasscode(e.target.value)}
                                  placeholder={lang === 'lo' ? 'ຕົວຢ່າງ: Passcode 8888, Meeting ID 123-456' : 'e.g. Passcode: 8888'}
                                  className="w-full bg-gray-50/50 text-adv-slate border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange font-medium placeholder:text-gray-300 transition-all"
                                />
                                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>

                            {/* Attendance Guidance */}
                            <div>
                              <label className="block text-xs font-extrabold text-adv-slate uppercase tracking-wider mb-2">
                                {lang === 'lo' ? 'ຄຳແນະນຳເພີ່ມເຕີມສຳລັບຜູ້ຊື້ປີ້' : 'Attendee Joining Instructions'}
                              </label>
                              <input
                                type="text"
                                value={onlineInstructions}
                                onChange={(e) => setOnlineInstructions(e.target.value)}
                                placeholder={lang === 'lo' ? 'ຕົວຢ່າງ: ກະລຸນາເຂົ້າຮ່ວມກ່ອນເວລາ 10 ນາທີ, ປິດໄມ...' : 'e.g. Please join 10 minutes early. Link activates on event day.'}
                                className="w-full bg-gray-50/50 text-adv-slate border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange font-medium placeholder:text-gray-300 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Event Category & Duration */}
              {eventType !== 'online' && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-adv-orange font-bold">*</span>
                      <span className="text-adv-slate font-bold text-sm">{t.eventCategory}</span>
                    </div>
                    <div className="relative">
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-white text-adv-slate border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all appearance-none font-bold"
                      >
                        <option value="Festival">{t.festival}</option>
                        <option value="Sports">{t.sports}</option>
                        <option value="Workshop">{t.workshop}</option>
                        <option value="Voucher">{t.voucher}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Event Information (Rich Text) */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-adv-orange font-bold">*</span>
                  <span className="text-adv-slate font-bold text-sm">{t.eventInfo}</span>
                </div>

                {/* Refined Comprehensive Rich-Text Editor Toolbar */}
                <div className="w-full bg-[#F6F4EF] border border-[#E8E5DC] rounded-[20px] p-2.5 mb-4 shadow-sm select-none">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    
                                        {/* History (Undo / Redo) */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          document.execCommand('undo');
                          editorRef.current?.focus();
                          if (editorRef.current) {
                            isInternalEditorUpdateRef.current = true;
                            setEditorContent(editorRef.current.innerHTML);
                          }
                        }} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-black flex items-center justify-center transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ຍົກເລີກ (Undo)' : 'Undo (Ctrl+Z)'}
                      >
                        <Undo className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          document.execCommand('redo');
                          editorRef.current?.focus();
                          if (editorRef.current) {
                            isInternalEditorUpdateRef.current = true;
                            setEditorContent(editorRef.current.innerHTML);
                          }
                        }} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-black flex items-center justify-center transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ເຮັດຄືນ (Redo)' : 'Redo (Ctrl+Y)'}
                      >
                        <Redo className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Text Size Dropdown */}
                    <div ref={fontSizeDropdownRef} className="relative">
                      <button 
                        type="button" 
                        onMouseDown={() => {
                          const sel = window.getSelection();
                          if (sel && sel.rangeCount > 0) {
                            setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                          }
                        }}
                        onClick={() => { 
                          const sel = window.getSelection();
                          if (sel && sel.rangeCount > 0) {
                            setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                          }
                          setShowFontSizeMenu(!showFontSizeMenu); 
                          setShowToolbarLinkModal(false); 
                        }} 
                        className="h-8 bg-[#EAE8E2] hover:bg-[#E2DFD8] active:scale-95 text-gray-800 text-xs font-semibold px-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-black/5" 
                        title="Font Size / ຂະໜາດຕົວໜັງສື"
                      >
                        <span className="text-gray-500 text-[11px] font-medium">{lang === 'lo' ? 'ຂະໜາດ' : 'Size'}:</span>
                        <span className="font-bold text-adv-slate">{selectedFontSize}</span>
                        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                      </button>
                      {showFontSizeMenu && (
                        <div className="absolute top-full left-0 mt-1 w-24 bg-white rounded-xl shadow-xl border border-gray-150 py-1 z-50 max-h-52 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-0.5">
                            {lang === 'lo' ? 'ຂະໜາດ' : 'Size'}
                          </div>
                          {fontSizeOptions.map((sz) => (
                            <button 
                              key={sz} 
                              type="button" 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyToolbarFontSize(sz)} 
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-orange-50 hover:text-adv-orange flex items-center justify-between transition-colors cursor-pointer ${selectedFontSize === sz ? 'text-adv-orange font-bold bg-orange-50/60' : 'text-gray-700'}`}
                            >
                              <span>{sz}</span>
                              {selectedFontSize === sz && <Check className="w-3 h-3 text-adv-orange" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>


                    {/* Color Picker & Custom Color */}
                    <div ref={colorDropdownRef} className="relative">
                      <button 
                        type="button" 
                        onMouseDown={(e) => {
                          // Prevent button click from clearing text selection in editor!
                          e.preventDefault();
                          const sel = window.getSelection();
                          if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
                            savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
                            setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                          }
                        }}
                        onClick={() => { 
                          const sel = window.getSelection();
                          if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
                            savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
                            setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                          }
                          setShowColorMenu(!showColorMenu); 
                          setShowFontSizeMenu(false);
                          setShowToolbarLinkModal(false); 
                        }} 
                        className="h-8 bg-[#EAE8E2] hover:bg-[#E2DFD8] active:scale-95 text-gray-800 rounded-xl px-2.5 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-black/5" 
                        title="Text Color / ສີຕົວໜັງສື"
                      >
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="font-extrabold text-[12px] leading-tight text-gray-800">A</span>
                          <span className="w-3.5 h-[3.5px] rounded-full mt-0.5 shadow-xs" style={{ backgroundColor: selectedTextColor }} />
                        </div>
                        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                      </button>
                      {showColorMenu && (
                        <div 
                          className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3"
                          onMouseDown={(e) => {
                            // Don't steal editor focus when clicking inside dropdown background
                            if ((e.target as HTMLElement).tagName !== 'INPUT') {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {lang === 'lo' ? 'ເລືອກສີຕົວໜັງສື' : 'Text Colors'}
                            </span>
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                              style={{ backgroundColor: selectedTextColor }}
                              title={selectedTextColor}
                            />
                          </div>

                          {/* Quick Swatches Grid */}
                          <div className="grid grid-cols-5 gap-1.5">
                            {colorPalette.map((col) => (
                              <button 
                                key={col.value} 
                                type="button" 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyToolbarTextColor(col.value, true)} 
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                  selectedTextColor.toLowerCase() === col.value.toLowerCase() 
                                    ? 'border-gray-900 ring-2 ring-adv-orange/40 scale-105' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`} 
                                style={{ backgroundColor: col.value }} 
                                title={col.label}
                              >
                                {selectedTextColor.toLowerCase() === col.value.toLowerCase() && (
                                  <Check className="w-3.5 h-3.5 text-white drop-shadow-xs stroke-[2.5]" />
                                )}
                              </button>
                            ))}
                            
                            {/* Native Picker Trigger (+) */}
                            <label
                              onMouseDown={(e) => {
                                // Ensure active range is preserved before opening native color dialog
                                const sel = window.getSelection();
                                if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
                                  savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
                                  setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                                }
                              }}
                              className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 hover:border-adv-orange hover:bg-orange-50/50 text-gray-500 hover:text-adv-orange flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden"
                              title={lang === 'lo' ? 'ສີກຳນົດເອງ (+)' : 'Custom Color (+)'}
                            >
                              <Plus className="w-4 h-4 pointer-events-none" />
                              <input 
                                ref={colorInputRef}
                                type="color" 
                                value={/^#[0-9A-Fa-f]{6}$/.test(selectedTextColor) ? selectedTextColor : '#000000'} 
                                onInput={(e) => {
                                  const val = (e.target as HTMLInputElement).value;
                                  if (val) applyToolbarTextColor(val, false);
                                }}
                                onChange={(e) => {
                                  const val = (e.target as HTMLInputElement).value;
                                  if (val) applyToolbarTextColor(val, false);
                                }} 
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                                title="Custom Color Picker" 
                              />
                            </label>
                          </div>

                          {/* Custom Color Row: Palette Clicker + HEX Input */}
                          <div className="pt-2.5 border-t border-gray-100 space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {lang === 'lo' ? 'ກຳນົດລະຫັດສີ (HEX)' : 'Custom Color (HEX)'}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Color Preview & Native Picker Opener */}
                              <label 
                                className="w-8 h-8 rounded-lg border border-gray-300 shadow-2xs overflow-hidden relative cursor-pointer shrink-0 hover:border-adv-orange transition-colors flex items-center justify-center"
                                style={{ backgroundColor: selectedTextColor }}
                                title={lang === 'lo' ? 'ກົດເພື່ອເລືອກສີ' : 'Click to pick custom color'}
                              >
                                <input 
                                  type="color" 
                                  value={/^#[0-9A-Fa-f]{6}$/.test(selectedTextColor) ? selectedTextColor : '#000000'} 
                                  onMouseDown={() => {
                                    const sel = window.getSelection();
                                    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
                                      savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
                                      setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                                    }
                                  }}
                                  onInput={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) applyToolbarTextColor(val, false);
                                  }}
                                  onChange={(e) => {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) applyToolbarTextColor(val, false);
                                  }}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </label>

                              {/* Direct HEX Input with # prefix */}
                              <div className="flex-1 flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-adv-orange focus-within:ring-2 focus-within:ring-adv-orange/20 overflow-hidden px-2 py-1 transition-all">
                                <span className="text-xs font-mono font-bold text-gray-400 select-none mr-1">#</span>
                                <input
                                  type="text"
                                  value={customHexInput.replace(/^#/, '').toUpperCase()}
                                  placeholder="000000"
                                  maxLength={6}
                                  onFocus={() => {
                                    // Make sure active range is captured before input focus
                                    const sel = window.getSelection();
                                    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
                                      savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
                                      setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                                    }
                                  }}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                    setCustomHexInput(raw);
                                    if (raw.length === 6 || raw.length === 3) {
                                      const normalized = normalizeHexColor(raw);
                                      if (normalized) {
                                        applyToolbarTextColor(normalized, false);
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const normalized = normalizeHexColor(customHexInput);
                                      if (normalized) {
                                        applyToolbarTextColor(normalized, true);
                                      }
                                    }
                                  }}
                                  className="w-full text-xs font-mono font-bold text-gray-800 bg-transparent outline-none uppercase"
                                />
                              </div>

                              {/* Apply Button */}
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  const normalized = normalizeHexColor(customHexInput);
                                  if (normalized) {
                                    applyToolbarTextColor(normalized, true);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-adv-orange hover:bg-orange-600 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
                                title={lang === 'lo' ? 'ນຳໃຊ້ສີ' : 'Apply Color'}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Basic Formatting */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCommand('bold')} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-bold text-xs transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ໂຕໜາ (Bold)' : 'Bold'}
                      >
                        B
                      </button>
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCommand('italic')} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-serif italic text-xs transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ໂຕອຽງ (Italic)' : 'Italic'}
                      >
                        I
                      </button>
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCommand('underline')} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-semibold underline text-xs transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ຂີດກ້ອງ (Underline)' : 'Underline'}
                      >
                        U
                      </button>
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execCommand('strikeThrough')} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-bold line-through text-xs transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ຂີດຂ້າ (Strikethrough)' : 'Strikethrough'}
                      >
                        S
                      </button>
                    </div>

                    {/* Lists (Bullet & Number) */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          document.execCommand('insertUnorderedList');
                          editorRef.current?.focus();
                          if (editorRef.current) {
                            isInternalEditorUpdateRef.current = true;
                            setEditorContent(editorRef.current.innerHTML);
                          }
                        }} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-black flex items-center justify-center transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ລາຍການແບບຈຸດ (Bullet List)' : 'Bullet List'}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          document.execCommand('insertOrderedList');
                          editorRef.current?.focus();
                          if (editorRef.current) {
                            isInternalEditorUpdateRef.current = true;
                            setEditorContent(editorRef.current.innerHTML);
                          }
                        }} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-black flex items-center justify-center transition-all cursor-pointer" 
                        title={lang === 'lo' ? 'ລາຍການແບບຕົວເລກ (Numbered List)' : 'Numbered List'}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                    </div>


                    {/* Inserts & Media */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5 relative">
                      {/* Link Modal Popup inside the group */}
                      {showToolbarLinkModal && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-150 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2">
                          <input type="text" value={toolbarLinkText} onChange={(e) => setToolbarLinkText(e.target.value)} placeholder="Display text" className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-adv-orange focus:ring-1 focus:ring-adv-orange" />
                          <input type="url" value={toolbarLinkUrl} onChange={(e) => setToolbarLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyToolbarLink(); } else if (e.key === 'Escape') { setShowToolbarLinkModal(false); } }} placeholder="https://example.com" className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-adv-orange focus:ring-1 focus:ring-adv-orange" />
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => setShowToolbarLinkModal(false)} className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-800 rounded-md">Cancel</button>
                            <button type="button" onClick={applyToolbarLink} className="px-2.5 py-1 text-[11px] bg-adv-orange text-white font-bold rounded-md shadow-xs hover:bg-orange-600">Apply</button>
                          </div>
                        </div>
                      )}
                      <button type="button" onClick={() => { const sel = window.getSelection(); if (sel && sel.rangeCount > 0) { const range = sel.getRangeAt(0); setSavedSelectionRange(range.cloneRange()); setToolbarLinkText(range.toString()); } else { setToolbarLinkText(''); } setShowToolbarLinkModal(true); setShowColorMenu(false); setShowFontMenu(false); setShowFontSizeMenu(false); }} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Insert Link"><LinkIcon className="w-3.5 h-3.5" /></button>
                      
                      {/* Image Upload Button */}
                      <button 
                        type="button" 
                        onClick={handleEditorImageUpload} 
                        className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" 
                        title="Upload Image / ອັບໂຫຼດຮູບພາບ"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>




                  </div>
                </div>
<div className="border border-gray-200 rounded-xl bg-white shadow-sm relative focus-within:ring-2 focus-within:ring-adv-orange/20 focus-within:border-adv-orange transition-all overflow-hidden">
                  <div className="p-4 relative">
                    {/* Editor Area */}
                    <div 
                      ref={editorRef}
                      contentEditable
                      onClick={handleEditorClick}
                      onInput={handleEditorInput}
                      onKeyUp={(e) => {
                        handleEditorInput();
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                          const r = sel.getRangeAt(0).cloneRange();
                          savedSelectionRangeRef.current = r;
                          setSavedSelectionRange(r);
                        }
                      }}
                      onMouseUp={() => {
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                          const r = sel.getRangeAt(0).cloneRange();
                          savedSelectionRangeRef.current = r;
                          setSavedSelectionRange(r);
                        }
                      }}
                      onPaste={handleEditorPaste}
                      onScroll={() => setTimeout(updateImageRect, 10)}
                      onDragStart={handleEditorDragStart}
                      onDragEnd={handleEditorDragEnd}
                      onDragOver={handleEditorDragOver}
                      onDragLeave={handleEditorDragLeave}
                      onDrop={handleEditorDrop}
                      className="min-h-[300px] text-base text-black outline-none rich-text max-w-none prose prose-sm prose-slate"
                      suppressContentEditableWarning
                    >
                      <p className="font-bold mb-1">{t.sampleTitle}</p>
                      <p className="mb-2 text-gray-700">{t.sampleDesc}</p>
                      <p className="text-gray-700 mb-1">- {t.sampleActivity}</p>
                      <p className="text-gray-700 mb-1">- {t.sampleLocationTime}</p>
                      <p className="text-gray-700 mb-1">- {t.sampleRequirements}</p>
                      <p className="text-gray-700">- {t.sampleProhibitions}</p>
                    </div>

                                        {/* Real-Time Drop Position Indicator */}
                    {imageDropIndicator && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: imageDropIndicator.top,
                          left: imageDropIndicator.left,
                          width: imageDropIndicator.width,
                          height: imageDropIndicator.height,
                          pointerEvents: 'none',
                          zIndex: 20
                        }}
                        className={`bg-adv-orange shadow-[0_0_8px_rgba(255,85,0,0.8)] rounded-full transition-all duration-75 ${
                          imageDropIndicator.isBlock ? 'animate-pulse' : ''
                        }`}
                      >
                        {/* Glowing cursor caret pin */}
                        <div 
                          className={`absolute bg-adv-orange rounded-full shadow-sm ${
                            imageDropIndicator.isBlock 
                              ? '-top-1 -left-1 w-2.5 h-2.5 ring-2 ring-white' 
                              : '-top-1.5 -left-1 w-3 h-3 ring-2 ring-white'
                          }`}
                        />
                      </div>
                    )}

                    {selectedImage && imageRect && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: imageRect.top,
                          left: imageRect.left,
                          width: imageRect.width,
                          height: imageRect.height,
                          border: '2px solid #FF5B00',
                          pointerEvents: 'none',
                          zIndex: 10
                        }}
                      >
                        {/* Top-Left Corner Dot */}
                        <div 
                          data-resize-handle="nw"
                          style={{
                            position: 'absolute',
                            left: -7,
                            top: -7,
                            width: 14,
                            height: 14,
                            backgroundColor: '#FF5B00',
                            border: '2.5px solid white',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            pointerEvents: 'auto',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.35)'
                          }}
                          onMouseDown={(e) => startResize(e, 'nw')}
                          title="Resize image (Top-Left)"
                        />

                        {/* Top-Right Corner Dot */}
                        <div 
                          data-resize-handle="ne"
                          style={{
                            position: 'absolute',
                            right: -7,
                            top: -7,
                            width: 14,
                            height: 14,
                            backgroundColor: '#FF5B00',
                            border: '2.5px solid white',
                            borderRadius: '50%',
                            cursor: 'nesw-resize',
                            pointerEvents: 'auto',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.35)'
                          }}
                          onMouseDown={(e) => startResize(e, 'ne')}
                          title="Resize image (Top-Right)"
                        />

                        {/* Bottom-Left Corner Dot */}
                        <div 
                          data-resize-handle="sw"
                          style={{
                            position: 'absolute',
                            left: -7,
                            bottom: -7,
                            width: 14,
                            height: 14,
                            backgroundColor: '#FF5B00',
                            border: '2.5px solid white',
                            borderRadius: '50%',
                            cursor: 'nesw-resize',
                            pointerEvents: 'auto',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.35)'
                          }}
                          onMouseDown={(e) => startResize(e, 'sw')}
                          title="Resize image (Bottom-Left)"
                        />

                        {/* Bottom-Right Corner Dot */}
                        <div 
                          data-resize-handle="se"
                          style={{
                            position: 'absolute',
                            right: -7,
                            bottom: -7,
                            width: 14,
                            height: 14,
                            backgroundColor: '#FF5B00',
                            border: '2.5px solid white',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            pointerEvents: 'auto',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.35)'
                          }}
                          onMouseDown={(e) => startResize(e, 'se')}
                          title="Resize image (Bottom-Right)"
                        />

                        {/* Floating Delete Button */}
                        <button
                          type="button"
                          onMouseDown={deleteSelectedImage}
                          style={{
                            position: 'absolute',
                            top: -14,
                            right: 18,
                            pointerEvents: 'auto'
                          }}
                          className="w-7 h-7 bg-white border border-gray-200 text-rose-500 hover:text-rose-600 rounded-full flex items-center justify-center shadow-md hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                          title={lang === 'lo' ? 'ລຶບຮູບ' : 'Delete image'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Organizer Profile */}
              <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 mt-6 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-adv-orange/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 mb-6 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-adv-slate flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-adv-orange/10 flex items-center justify-center border border-adv-orange/20 shrink-0">
                        <User className="w-4 h-4 text-adv-orange" />
                      </div>
                      {t.organizerProfile}
                    </h3>
                    <p className="text-gray-500 mt-1 text-xs sm:text-sm leading-relaxed max-w-xl">{t.organizerProfileDesc}</p>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                  {/* Left Column: Organizer Logo Uploader */}
                  <div className="lg:col-span-3">
                    <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col items-center text-center h-full justify-center min-h-[200px]">
                      <label className="text-xs font-bold text-adv-slate mb-3 w-full text-left">{t.addOrganizerLogo}</label>
                      <div 
                        className={`w-28 h-28 rounded-full border-2 border-dashed ${isDraggingLogo ? 'border-adv-orange bg-adv-orange/5' : 'border-gray-300 bg-white hover:bg-adv-orange/5 hover:border-adv-orange'} flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-300 group relative overflow-hidden shadow-sm mb-3`}
                        onDragOver={(e) => handleDragOver(e, setIsDraggingLogo)}
                        onDragLeave={(e) => handleDragLeave(e, setIsDraggingLogo)}
                        onDrop={(e) => handleDrop(e, setOrganizerLogo, setIsDraggingLogo, setOrganizerLogoProgress)}
                        onClick={() => !organizerLogo && !organizerLogoProgress && document.getElementById('logo-upload')?.click()}
                      >
                        <input 
                          id="logo-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileInput(e, setOrganizerLogo, setOrganizerLogoProgress)} 
                        />
                        {organizerLogoProgress !== null ? (
                          <div className="flex flex-col items-center justify-center w-full">
                            <Loader2 className="w-6 h-6 text-adv-orange animate-spin mb-1.5" />
                            <div className="w-full max-w-[60px] bg-gray-200 rounded-full h-1 mb-1">
                              <div className="bg-adv-orange h-1 rounded-full transition-all duration-200" style={{ width: `${Math.min(organizerLogoProgress, 100)}%` }}></div>
                            </div>
                            <span className="text-[10px] text-gray-500">{Math.round(Math.min(organizerLogoProgress, 100))}%</span>
                          </div>
                        ) : organizerLogo ? (
                          <>
                            <img src={organizerLogo} alt="Logo preview" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); document.getElementById('logo-upload')?.click(); }}
                                className="text-white font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm transition-colors text-[10px]"
                              >
                                {t.change}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOrganizerLogo(null); }}
                                className="text-white font-medium bg-red-500/80 hover:bg-red-500 px-3 py-1 rounded-full backdrop-blur-sm transition-colors flex items-center gap-0.5 text-[10px]"
                              >
                                <X className="w-2.5 h-2.5" /> {t.remove}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 transition-colors ${isDraggingLogo ? 'bg-adv-orange/20' : 'bg-gray-100 group-hover:bg-adv-orange/10 group-hover:text-adv-orange'}`}>
                              <UploadCloud className={`w-4 h-4 ${isDraggingLogo ? 'text-adv-orange' : 'text-gray-400 group-hover:text-adv-orange'} transition-colors`} />
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium px-1 leading-tight">{t.clickToUpload}</p>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 whitespace-pre-line leading-tight">
                        {t.recommendedLogoSize}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Organizer Form Fields */}
                  <div className="lg:col-span-9 space-y-4">
                    {/* Organizer Name */}
                    <div id="field-organizer-name">
                      <label className="flex items-center gap-1 mb-1.5 text-xs font-bold text-adv-slate">
                        {t.organizerName} <span className="text-adv-orange">*</span>
                      </label>
                      <input 
                        type="text"
                        value={organizerName}
                        onChange={(e) => {
                          setOrganizerName(e.target.value.replace(/[0-9]/g, ''));
                          setValidationError(null);
                        }}
                        maxLength={80}
                        placeholder="e.g. LiveNation Laos"
                        className="w-full bg-gray-50/80 border border-gray-200 text-adv-slate rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all placeholder:text-gray-300"
                      />
                    </div>

                    {/* Phone & Email Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div id="field-organizer-phone">
                        <label className="flex items-center gap-1 mb-1.5 text-xs font-bold text-adv-slate">
                          {lang === 'en' ? 'Organizer Phone' : 'ເບີໂທຜູ້ຈັດງານ'} <span className="text-adv-orange">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input 
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={organizerPhone}
                            onChange={(e) => {
                              // Only allow numeric digits
                              const numeric = e.target.value.replace(/\D/g, '');
                              setOrganizerPhone(numeric);
                              setValidationError(null);
                            }}
                            placeholder={lang === 'en' ? 'e.g. 020 99887766' : 'ຕົວຢ່າງ: 020 99887766'}
                            className="w-full bg-gray-50/80 border border-gray-200 text-adv-slate rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all placeholder:text-gray-300 font-mono tracking-wide"
                          />
                        </div>
                      </div>

                      <div id="field-organizer-email">
                        <label className="flex items-center gap-1 mb-1.5 text-xs font-bold text-adv-slate">
                          {lang === 'en' ? 'Organizer Email' : 'ອີເມວຜູ້ຈັດງານ'} <span className="text-adv-orange">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input 
                            type="email"
                            inputMode="email"
                            autoCapitalize="none"
                            spellCheck={false}
                            value={organizerEmail}
                            onChange={(e) => {
                              setOrganizerEmail(e.target.value.trim().toLowerCase());
                              setValidationError(null);
                            }}
                            placeholder="organizer@domain.com"
                            className="w-full bg-gray-50/80 border border-gray-200 text-adv-slate rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all placeholder:text-gray-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* About Organizer / Bio */}
                    <div id="field-organizer-bio">
                      <label className="flex items-center gap-1 mb-1.5 text-xs font-bold text-adv-slate">
                        {lang === 'en' ? 'About Organizer / Bio' : 'ກ່ຽວກັບຜູ້ຈັດງານ'} <span className="text-adv-orange">*</span>
                      </label>
                      <textarea
                        rows={2.5}
                        value={organizerInfo}
                        onChange={(e) => {
                          setOrganizerInfo(e.target.value);
                          setValidationError(null);
                        }}
                        placeholder={lang === 'en' ? 'Brief description about the event organizing team...' : 'ຂໍ້ມູນກ່ຽວກັບທີມງານຈັດງານ...'}
                        className="w-full bg-gray-50/80 border border-gray-200 text-adv-slate rounded-xl p-3 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all placeholder:text-gray-300 resize-none"
                      />
                    </div>

                  </div>
                </div>
              </div>
              </>
              )}

              {activeStep === 3 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-adv-slate mb-2">
                        {lang === 'lo' ? 'ຄຳຖາມສຳລັບຜູ້ເຂົ້າຮ່ວມ' : 'Attendee Questions'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {lang === 'lo' ? 'ເພີ່ມຄຳຖາມເພື່ອເກັບກຳຂໍ້ມູນເພີ່ມເຕີມຈາກຜູ້ເຂົ້າຮ່ວມ ເຊັ່ນ: ບໍລິສັດ, ຂະໜາດເສື້ອ, ຫຼື ຂໍ້ຈຳກັດດ້ານອາຫານ.' : 'Add custom questions to collect more info from attendees (e.g. Company, T-shirt size, Dietary restrictions).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttendeeQuestions([...attendeeQuestions, { id: Date.now().toString(), type: 'text', label: '', required: false }])}
                      className="px-4 py-2 bg-adv-orange/10 hover:bg-adv-orange/20 text-adv-orange rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      {lang === 'lo' ? 'ເພີ່ມຄຳຖາມ' : 'Add Question'}
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="text-sm font-bold text-adv-slate mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      {lang === 'lo' ? 'ຄຳຖາມເລີ່ມຕົ້ນ (ລວມຢູ່ແລ້ວ)' : 'Default Questions (Already Included)'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      {lang === 'lo' ? 'ຂໍ້ມູນເຫຼົ່ານີ້ຈະຖືກເກັບກຳຈາກຜູ້ຊື້ປີ້ທຸກຄົນໂດຍອັດຕະໂນມັດ ທ່ານບໍ່ຈຳເປັນຕ້ອງເພີ່ມຄຳຖາມເຫຼົ່ານີ້ອີກ:' : 'This information will be collected automatically from all ticket buyers. You do not need to add these questions:'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['First Name', 'Last Name', 'Phone Number', 'Email', 'Gender', 'Date of Birth'].map((field, i) => (
                        <div key={i} className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm font-medium text-gray-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-adv-orange/70 shrink-0" />
                          <span className="truncate">{lang === 'lo' ? ['ຊື່', 'ນາມສະກຸນ', 'ເບີໂທລະສັບ', 'ອີເມວ', 'ເພດ', 'ວັນເດືອນປີເກີດ'][i] : field}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {attendeeQuestions.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-600 mb-1">
                        {lang === 'lo' ? 'ຍັງບໍ່ມີຄຳຖາມເພີ່ມເຕີມ' : 'No custom questions added'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {lang === 'lo' ? 'ຄລິກ "ເພີ່ມຄຳຖາມ" ເພື່ອເລີ່ມສ້າງແບບຟອມ' : 'Click "Add Question" to start building your form'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attendeeQuestions.map((q, idx) => {
                        const isDragging = draggedQuestionIndex === idx;
                        const isDragOver = dragOverQuestionIndex === idx && draggedQuestionIndex !== idx;

                        return (
                          <motion.div
                            layout
                            key={q.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggedQuestionIndex(idx);
                              (e as unknown as React.DragEvent).dataTransfer.effectAllowed = 'move';
                              (e as unknown as React.DragEvent).dataTransfer.setData('text/plain', idx.toString());
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverQuestionIndex !== idx) {
                                setDragOverQuestionIndex(idx);
                              }
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setDragOverQuestionIndex(idx);
                            }}
                            onDragLeave={() => {
                              if (dragOverQuestionIndex === idx) {
                                setDragOverQuestionIndex(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedQuestionIndex !== null && draggedQuestionIndex !== idx) {
                                moveQuestion(draggedQuestionIndex, idx);
                              }
                              setDraggedQuestionIndex(null);
                              setDragOverQuestionIndex(null);
                            }}
                            onDragEnd={() => {
                              setDraggedQuestionIndex(null);
                              setDragOverQuestionIndex(null);
                            }}
                            className={`p-5 border rounded-xl bg-white shadow-sm space-y-4 relative transition-all duration-150 ${
                              isDragging
                                ? 'opacity-40 border-dashed border-2 border-adv-orange bg-orange-50/40 scale-[0.99]'
                                : isDragOver
                                ? 'ring-2 ring-adv-orange ring-offset-2 border-adv-orange bg-orange-50/20 shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Card Header with Drag Handle, Order Badge, Move Buttons and Delete */}
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div
                                  className="cursor-grab active:cursor-grabbing p-1.5 -ml-1.5 text-gray-400 hover:text-adv-slate hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
                                  title={lang === 'lo' ? 'ລາກເພື່ອປ່ຽນລຳດັບ' : 'Drag to reorder'}
                                >
                                  <GripVertical className="w-4 h-4" />
                                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                    #{idx + 1}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-gray-400 hidden sm:inline">
                                  {lang === 'lo' ? 'ລາກຍ້າຍຕຳແໜ່ງໄດ້' : 'Drag to move position'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveQuestion(idx, idx - 1);
                                  }}
                                  disabled={idx === 0}
                                  title={lang === 'lo' ? 'ຍ້າຍຂຶ້ນ' : 'Move up'}
                                  className="p-1.5 text-gray-400 hover:text-adv-slate hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-colors"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveQuestion(idx, idx + 1);
                                  }}
                                  disabled={idx === attendeeQuestions.length - 1}
                                  title={lang === 'lo' ? 'ຍ້າຍລົງ' : 'Move down'}
                                  className="p-1.5 text-gray-400 hover:text-adv-slate hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-colors"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...attendeeQuestions];
                                    next.splice(idx, 1);
                                    setAttendeeQuestions(next);
                                  }}
                                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                  title={lang === 'lo' ? 'ລຶບຄຳຖາມ' : 'Delete question'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                  {lang === 'lo' ? 'ປະເພດຄຳຖາມ' : 'Question Type'}
                                </label>
                                <div className="relative">
                                  <select
                                    value={q.type}
                                    onChange={(e) => {
                                      const next = [...attendeeQuestions];
                                      const newType = e.target.value as any;
                                      next[idx].type = newType;
                                      if (['single_choice', 'multi_choice', 'options'].includes(newType)) {
                                        if (!next[idx].options || next[idx].options.length === 0) {
                                          next[idx].options = ['Option 1', 'Option 2'];
                                        }
                                      } else {
                                        delete next[idx].options;
                                      }
                                      setAttendeeQuestions(next);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 text-adv-slate rounded-xl px-4 py-2.5 text-sm font-semibold appearance-none focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all pr-10"
                                  >
                                    <option value="text">Short Text</option>
                                    <option value="long_text">Long Text</option>
                                    <option value="single_choice">Single Choice</option>
                                    <option value="multi_choice">Multiple Choice</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="url">URL / Link</option>
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                  {lang === 'lo' ? 'ຄຳຖາມ' : 'Question Label'}
                                </label>
                                <input
                                  type="text"
                                  value={q.label}
                                  onChange={(e) => {
                                    const next = [...attendeeQuestions];
                                    next[idx].label = e.target.value;
                                    setAttendeeQuestions(next);
                                  }}
                                  placeholder={lang === 'lo' ? 'ເຊັ່ນ: ຂະໜາດເສື້ອ...' : 'e.g. T-shirt size...'}
                                  className="w-full bg-gray-50 border border-gray-200 text-adv-slate rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all"
                                />
                              </div>
                            </div>
                            
                            {(['single_choice', 'multi_choice', 'options'].includes(q.type)) && (
                              <div className="pt-2 border-t border-gray-100">
                                <label className="block text-[11px] font-bold text-gray-500 mb-2">
                                  {lang === 'lo' ? 'ຕົວເລືອກ (Options)' : 'Options'}
                                </label>
                                <div className="space-y-2">
                                  {(q.options || []).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const next = [...attendeeQuestions];
                                          if (next[idx].options) {
                                            next[idx].options![optIdx] = e.target.value;
                                            setAttendeeQuestions(next);
                                          }
                                        }}
                                        placeholder={lang === 'lo' ? 'ຕົວເລືອກ...' : 'Option...'}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-adv-orange/50 transition-all text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...attendeeQuestions];
                                          next[idx].options = next[idx].options!.filter((_, i) => i !== optIdx);
                                          setAttendeeQuestions(next);
                                        }}
                                        disabled={(q.options || []).length <= 1}
                                        className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...attendeeQuestions];
                                      if (next[idx].options) {
                                        next[idx].options!.push(`Option ${(next[idx].options!.length + 1)}`);
                                        setAttendeeQuestions(next);
                                      }
                                    }}
                                    className="text-xs font-bold text-adv-orange hover:text-orange-600 transition-colors flex items-center gap-1 mt-2"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {lang === 'lo' ? 'ເພີ່ມຕົວເລືອກ' : 'Add Option'}
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-2">
                              <label className="flex items-center gap-2 cursor-pointer w-fit">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) => {
                                    const next = [...attendeeQuestions];
                                    next[idx].required = e.target.checked;
                                    setAttendeeQuestions(next);
                                  }}
                                  className="w-4 h-4 text-adv-orange border-gray-300 rounded focus:ring-adv-orange focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {lang === 'lo' ? 'ຈຳເປັນຕ້ອງຕອບ (Required)' : 'Required question'}
                                </span>
                              </label>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 2 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-8">
                  <h3 className="text-xl font-bold text-adv-slate mb-2">{t.step2}</h3>
                  
                  <AnimatePresence>
                    {validationError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3.5 text-orange-900 text-sm font-semibold"
                      >
                        <ShieldAlert className="w-5 h-5 text-adv-orange shrink-0 mt-0.5 animate-pulse" />
                        <div>{validationError}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-6">
                    {/* Single Schedule Type Rule Info - Only show when organizer has selected data from both types */}
                    {(availableDates.length > 0 && (bookingAvailableDays.length > 0 || bookingTimeSlots.length > 0)) && (
                      <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start justify-between gap-3 text-amber-900 text-xs shadow-xs animate-in fade-in duration-200">
                        <div className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-bold text-amber-950 flex items-center gap-1.5">
                              <span>{t.singleDateTypeRule}</span>
                              <span className="text-[10px] uppercase font-black bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                                {lang === 'en' ? '1 Type Only' : 'ເລືອກໄດ້ 1 ປະເພດ'}
                              </span>
                            </div>
                            <p className="text-amber-800/90 leading-relaxed font-medium">
                              {t.singleDateTypeNote}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (dateType === 'flexible') {
                              setBookingAvailableDays([]);
                              setBookingTimeSlots([]);
                              setBookingSlotCapacities({});
                            } else {
                              setAvailableDates([]);
                            }
                          }}
                          className="shrink-0 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 px-2 py-1 hover:bg-amber-100/60 rounded-lg transition-colors"
                        >
                          {dateType === 'flexible'
                            ? (lang === 'en' ? 'Clear Inactive Booking Data' : 'ລຶບຂໍ້ມູນການຈອງທີ່ບໍ່ໃຊ້')
                            : (lang === 'en' ? 'Clear Inactive Event Dates' : 'ລຶບວັນທີຈັດງານທີ່ບໍ່ໃຊ້')}
                        </button>
                      </div>
                    )}

                    {/* Date Type Selection */}
                    <div>
                      <label className="block text-xs font-bold text-adv-slate mb-2">
                        {t.dateType} <span className="text-adv-orange">*</span>
                      </label>
                      <div className="flex gap-2 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/60 w-fit">
                        <button 
                          type="button"
                          onClick={() => {
                            setDateType('flexible');
                            setValidationError(null);
                          }}
                          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                            dateType === 'flexible' 
                              ? 'bg-white text-adv-orange shadow-sm' 
                              : 'text-gray-500 hover:text-adv-slate'
                          }`}
                        >
                          {t.flexibleDate}
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setDateType('booking');
                            setValidationError(null);
                          }}
                          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                            dateType === 'booking' 
                              ? 'bg-white text-adv-orange shadow-sm' 
                              : 'text-gray-500 hover:text-adv-slate'
                          }`}
                        >
                          {lang === 'en' ? 'Booking' : 'ການຈອງ'}
                        </button>
                      </div>
                    </div>

                    {/* Operating Time Slots Configuration for Flexible Date */}
                    {dateType === "flexible" && (
                      <motion.div 
                        id="field-flexible-dates"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <FlexibleDatePicker 
                          availableDates={availableDates}
                          onChange={setAvailableDates}
                          lang={lang}
                          theme="light"
                        />
                      </motion.div>
                    )}

                    {/* Booking Configuration */}
                    {dateType === 'booking' && (
                      <motion.div 
                        id="field-booking-settings"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div id="field-booking-days" className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-5">
                          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            {lang === 'en' ? 'Booking Availability Settings' : 'ຕັ້ງຄ່າການຈອງ'}
                          </h4>
                          
                          <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-200">
                            <p className="text-[11px] font-medium text-amber-800 flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              {lang === 'en' 
                                ? 'Users can book dates up to 30 days in advance from the current date.' 
                                : 'ຜູ້ໃຊ້ສາມາດຈອງລ່ວງໜ້າໄດ້ເຖິງ 30 ວັນ ນັບຈາກມື້ປັດຈຸບັນ.'}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">{lang === 'en' ? 'Available Days' : 'ມື້ທີ່ເປີດໃຫ້ຈອງ'}</label>
                            <div className="flex flex-wrap gap-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    if (bookingAvailableDays.includes(day)) {
                                      setBookingAvailableDays(bookingAvailableDays.filter(d => d !== day));
                                    } else {
                                      setBookingAvailableDays([...bookingAvailableDays, day]);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                                    bookingAvailableDays.includes(day)
                                      ? 'bg-amber-500 text-white shadow-sm'
                                      : 'bg-white text-gray-500 border border-gray-200 hover:border-amber-300'
                                  }`}
                                >
                                  {lang === 'en' ? day : 
                                    day === 'Mon' ? 'ຈັນ' : 
                                    day === 'Tue' ? 'ອັງຄານ' : 
                                    day === 'Wed' ? 'ພຸດ' : 
                                    day === 'Thu' ? 'ພະຫັດ' : 
                                    day === 'Fri' ? 'ສຸກ' : 
                                    day === 'Sat' ? 'ເສົາ' : 'ອາທິດ'
                                  }
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div id="field-booking-slots" className="grid grid-cols-1 gap-4">
                          <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-4 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-adv-slate flex items-center gap-1.5 uppercase tracking-wide">
                                  <Users className="w-4 h-4 text-adv-orange" />
                                  {t.timeSlotsAndCapacity}
                                </h4>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                  {t.bookingSlotCapacityDesc}
                                </p>
                              </div>
                              {bookingTimeSlots.length > 0 && (
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100/80 text-adv-orange text-[10px] font-extrabold border border-orange-200">
                                    <Clock className="w-3 h-3" />
                                    {bookingTimeSlots.length} {t.totalSlotsCount}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                                    <Users className="w-3 h-3" />
                                    {Object.values(bookingSlotCapacities).reduce((a: number, b: number) => a + (Number(b) || 0), 0) || (bookingTimeSlots.length * 10)} {lang === 'en' ? 'people / day' : 'ຄົນ / ວັນ'}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Add New Slot Bar */}
                            <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
                              <div className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Plus className="w-3.5 h-3.5 text-adv-orange" />
                                  {lang === 'en' ? 'Add Time Slot & Daily Capacity' : 'ເພີ່ມຮອບເວລາ ແລະ ຈຳນວນຄົນຕໍ່ວັນ'}
                                </div>
                                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                  {lang === 'en' ? '1 Day Limit' : 'ຈຳນວນຕໍ່ 1 ວັນ'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                                <div className="sm:col-span-5">
                                  <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">
                                    {lang === 'en' ? 'Slot Time' : 'ເວລາ'}
                                  </label>
                                  <ScrollTimePicker 
                                    value={newBookingTimeSlot}
                                    onChange={(val) => setNewBookingTimeSlot(val)}
                                    placeholder="09:00"
                                  />
                                </div>
                                
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-1">
                                    {lang === 'en' ? 'Capacity (People / 1 Day)' : 'ຈຳນວນຄົນ (ຕໍ່ 1 ວັນ)'}
                                  </label>
                                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 focus-within:border-adv-orange focus-within:bg-white transition-all">
                                    <button
                                      type="button"
                                      onClick={() => setNewBookingSlotCapacity(prev => Math.max(1, (Number(prev) || 10) - 1))}
                                      className="p-1 text-gray-500 hover:text-adv-orange hover:bg-gray-200/60 rounded-lg transition-colors"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={newBookingSlotCapacity}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        setNewBookingSlotCapacity(isNaN(val) ? 1 : Math.max(1, val));
                                      }}
                                      className="w-full bg-transparent text-center text-xs font-black text-adv-slate focus:outline-hidden"
                                      placeholder="10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setNewBookingSlotCapacity(prev => (Number(prev) || 10) + 1)}
                                      className="p-1 text-gray-500 hover:text-adv-orange hover:bg-gray-200/60 rounded-lg transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="sm:col-span-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newBookingTimeSlot && !bookingTimeSlots.includes(newBookingTimeSlot)) {
                                        const updated = [...bookingTimeSlots, newBookingTimeSlot].sort();
                                        const cap = Math.max(1, Number(newBookingSlotCapacity) || 10);
                                        setBookingTimeSlots(updated);
                                        setBookingSlotCapacities(prev => ({
                                          ...prev,
                                          [newBookingTimeSlot]: cap
                                        }));
                                        setNewBookingTimeSlot('');
                                      }
                                    }}
                                    disabled={!newBookingTimeSlot || bookingTimeSlots.includes(newBookingTimeSlot)}
                                    className="w-full py-2 px-3 bg-adv-orange disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl hover:bg-orange-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>{lang === 'en' ? 'Add' : 'ເພີ່ມ'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Bulk Default Capacity Toolbar if 2+ slots exist */}
                            {bookingTimeSlots.length > 1 && (
                              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-orange-50/60 rounded-xl border border-orange-100 text-xs">
                                <div className="text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-adv-orange" />
                                  <span>{lang === 'en' ? 'Quick set all slots capacity (per 1 day) to:' : 'ຕັ້ງຄວາມຈຸທຸກຮອບ (ຕໍ່ 1 ວັນ) ເປັນ:'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    value={defaultBookingCapacity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      setDefaultBookingCapacity(isNaN(val) ? 1 : Math.max(1, val));
                                    }}
                                    className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center text-xs font-bold text-adv-slate focus:outline-hidden focus:border-adv-orange"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cap = Math.max(1, Number(defaultBookingCapacity) || 10);
                                      const updated: Record<string, number> = {};
                                      bookingTimeSlots.forEach(s => {
                                        updated[s] = cap;
                                      });
                                      setBookingSlotCapacities(updated);
                                    }}
                                    className="px-2.5 py-1 bg-white text-adv-orange hover:bg-orange-100/60 border border-orange-200 rounded-lg text-[11px] font-extrabold transition-colors"
                                  >
                                    {t.applyToAllSlots}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Slot Cards List */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                                <span>{lang === 'en' ? 'Configured Time Slots & Daily Limits (For 1 Day):' : 'ຮອບເວລາ ແລະ ຈຳນວນຄົນທີ່ຕັ້ງຄ່າແລ້ວ (ຕໍ່ 1 ວັນ):'}</span>
                                {bookingTimeSlots.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBookingTimeSlots([]);
                                      setBookingSlotCapacities({});
                                    }}
                                    className="text-red-500 hover:text-red-700 text-[10px] underline underline-offset-2"
                                  >
                                    {lang === 'en' ? 'Remove all' : 'ລຶບທັງໝົດ'}
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pt-1 pr-1 custom-scrollbar">
                                {bookingTimeSlots.map((slot, index) => {
                                  const hour = parseInt(slot.split(':')[0], 10);
                                  const period = hour < 12 
                                    ? (lang === 'en' ? 'Morning' : 'ຕອນເຊົ້າ')
                                    : hour < 17 
                                      ? (lang === 'en' ? 'Afternoon' : 'ຕອນບ່າຍ')
                                      : (lang === 'en' ? 'Evening' : 'ຕອນແລງ');
                                  const currentCap = bookingSlotCapacities[slot] !== undefined ? bookingSlotCapacities[slot] : 10;

                                  return (
                                    <div 
                                      key={index} 
                                      className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-orange-200 transition-all flex flex-col justify-between gap-2.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-7 h-7 rounded-lg bg-orange-50 text-adv-orange flex items-center justify-center font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                          </div>
                                          <div>
                                            <span className="text-xs font-black text-adv-slate tracking-wide font-mono block">
                                              {slot}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block -mt-0.5">
                                              {period}
                                            </span>
                                          </div>
                                        </div>

                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setBookingTimeSlots(bookingTimeSlots.filter((_, i) => i !== index));
                                            setBookingSlotCapacities(prev => {
                                              const next = { ...prev };
                                              delete next[slot];
                                              return next;
                                            });
                                          }}
                                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          title={lang === 'en' ? 'Remove slot' : 'ລຶບຮອບ'}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      {/* Per-Slot Capacity Stepper */}
                                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-extrabold text-gray-500 flex items-center gap-1">
                                          <Users className="w-3 h-3 text-adv-orange" />
                                          {lang === 'en' ? 'Limit / 1 day:' : 'ຮັບໄດ້ / 1 ວັນ:'}
                                        </span>
                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newCap = Math.max(1, currentCap - 1);
                                              setBookingSlotCapacities(prev => ({
                                                ...prev,
                                                [slot]: newCap
                                              }));
                                            }}
                                            className="p-0.5 text-gray-500 hover:text-adv-orange hover:bg-gray-200/60 rounded transition-colors"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <input
                                            type="number"
                                            min="1"
                                            value={currentCap}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value, 10);
                                              const safe = isNaN(val) ? 1 : Math.max(1, val);
                                              setBookingSlotCapacities(prev => ({
                                                ...prev,
                                                [slot]: safe
                                              }));
                                            }}
                                            className="w-10 bg-transparent text-center text-xs font-black text-adv-slate focus:outline-hidden"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newCap = currentCap + 1;
                                              setBookingSlotCapacities(prev => ({
                                                ...prev,
                                                [slot]: newCap
                                              }));
                                            }}
                                            className="p-0.5 text-gray-500 hover:text-adv-orange hover:bg-gray-200/60 rounded transition-colors"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {bookingTimeSlots.length === 0 && (
                                <div className="p-6 text-center bg-white border border-dashed border-gray-200 rounded-xl space-y-1.5">
                                  <Clock className="w-6 h-6 text-gray-300 mx-auto" />
                                  <p className="text-xs text-gray-500 font-medium">
                                    {t.noBookingSlots}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Zone Seating feature */}
                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6 shadow-sm">
                        <div>
                          <h4 className="text-lg font-bold text-adv-slate mb-1">{t.enableSeating}</h4>
                          <p className="text-sm text-gray-500">{t.enableSeatingDesc}</p>
                        </div>
                          <button 
                            type="button"
                            onClick={() => setHasSeating(!hasSeating)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${hasSeating ? 'bg-adv-orange' : 'bg-gray-300'}`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${hasSeating ? 'translate-x-6 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                          </button>
                        </div>

                        {hasSeating && (
                          <div className="mb-6">
                            <label className="block text-sm font-bold text-adv-slate mb-3">{t.seatingMap}</label>
                            <div 
                              className={`w-full max-w-lg h-48 rounded-2xl border-2 border-dashed ${isDraggingZoneImage ? 'border-adv-orange bg-adv-orange/5' : 'border-gray-300 bg-white hover:border-adv-orange hover:bg-adv-orange/5'} flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden shadow-sm`}
                              onDragOver={(e) => handleDragOver(e, setIsDraggingZoneImage)}
                              onDragLeave={(e) => handleDragLeave(e, setIsDraggingZoneImage)}
                              onDrop={(e) => handleDrop(e, setZoneImage, setIsDraggingZoneImage, setZoneImageProgress)}
                              onClick={() => !zoneImage && !zoneImageProgress && document.getElementById('zone-image-upload')?.click()}
                            >
                              <input 
                                id="zone-image-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileInput(e, setZoneImage, setZoneImageProgress)} 
                              />
                              {zoneImageProgress !== null ? (
                                <div className="flex flex-col items-center justify-center w-full">
                                  <Loader2 className="w-8 h-8 text-adv-orange animate-spin mb-3" />
                                  <div className="w-full max-w-[150px] bg-gray-200 rounded-full h-1.5 mb-2">
                                    <div className="bg-adv-orange h-1.5 rounded-full transition-all duration-200" style={{ width: `${Math.min(zoneImageProgress, 100)}%` }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{Math.round(Math.min(zoneImageProgress, 100))}%</span>
                                </div>
                              ) : zoneImage ? (
                                <AdaptiveImage showBlurBackdrop={true}
                                  src={zoneImage}
                                  alt="Seating map preview"
                                  fitMode="contain"
                                  className="absolute inset-0 w-full h-full"
                                >
                                  <div className="absolute inset-0 z-20 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); document.getElementById('zone-image-upload')?.click(); }}
                                      className="text-white font-medium bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full backdrop-blur-sm transition-colors text-xs"
                                    >
                                      {t.change}
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setZoneImage(null); }}
                                      className="text-white font-medium bg-red-500/80 hover:bg-red-500 px-4 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1 text-xs"
                                    >
                                      <X className="w-3 h-3" /> {t.remove}
                                    </button>
                                  </div>
                                </AdaptiveImage>
                              ) : (
                                <>
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDraggingZoneImage ? 'bg-adv-orange/20' : 'bg-gray-100 group-hover:bg-adv-orange/10 group-hover:text-adv-orange'}`}>
                                    <UploadCloud className={`w-6 h-6 ${isDraggingZoneImage ? 'text-adv-orange' : 'text-gray-400 group-hover:text-adv-orange'} transition-colors`} />
                                  </div>
                                  <p className="text-xs text-gray-500 font-medium">{t.clickToUpload}</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    <div id="field-ticket-tiers" className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-adv-slate">{t.ticketTiers}</h4>
                        <button 
                          type="button"
                          onClick={() => {
                            const isDateSet = Boolean(getEventEndDateStr());
                            const today = isDateSet ? getTodayDateStr() : '';
                            const evEnd = isDateSet ? getEventEndDateStr() : '';
                            setTicketTiers([
                              ...ticketTiers, 
                              { 
                                id: Date.now(), 
                                name: '', 
                                price: '', 
                                quantity: '', 
                                saleStartDate: today, 
                                saleStartTime: '', 
                                saleEndDate: evEnd || '', 
                                saleEndTime: '' 
                              }
                            ]);
                          }}
                          className="flex items-center gap-2 text-adv-orange hover:text-orange-600 text-sm font-bold"
                        >
                          <Plus className="w-4 h-4" />
                          {t.addTier}
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {ticketTiers.map((tier, index) => {
                          const isEventDateSet = Boolean(getEventEndDateStr());
                          return (
                          <div key={tier.id} className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 p-4 bg-gray-50/90 rounded-2xl border border-gray-150 relative shadow-sm hover:z-30 focus-within:z-40">
                            <div className="flex-1 min-w-[130px]">
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 whitespace-nowrap truncate" title={t.tierName}>
                                {t.tierName} <span className="text-adv-orange">*</span>
                              </label>
                              <input 
                                type="text" 
                                value={tier.name}
                                onChange={(e) => {
                                  const newTiers = [...ticketTiers];
                                  newTiers[index].name = e.target.value;
                                  setTicketTiers(newTiers);
                                }}
                                placeholder={t.tierNamePlaceholder}
                                className="w-full h-10 bg-white border border-gray-200 text-adv-slate rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all"
                              />
                            </div>
                            <div className="w-full lg:w-32 shrink-0">
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 whitespace-nowrap truncate" title={t.priceWithCurrency}>
                                {t.priceWithCurrency}
                              </label>
                              <input 
                                type="text" 
                                inputMode="numeric"
                                value={tier.price}
                                onChange={(e) => {
                                  const newTiers = [...ticketTiers];
                                  newTiers[index].price = formatNumberWithCommas(e.target.value);
                                  setTicketTiers(newTiers);
                                }}
                                placeholder="0"
                                className="w-full h-10 bg-white border border-gray-200 text-adv-slate rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all"
                              />
                            </div>
                            {dateType !== 'booking' && (
                              <div className="w-full lg:w-28 shrink-0">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 whitespace-nowrap truncate" title={t.quantity}>
                                  {t.quantity} <span className="text-adv-orange">*</span>
                                </label>
                                <input 
                                  type="text"
                                  inputMode="numeric" 
                                  value={tier.quantity}
                                  onChange={(e) => {
                                    const newTiers = [...ticketTiers];
                                    newTiers[index].quantity = formatNumberWithCommas(e.target.value);
                                    setTicketTiers(newTiers);
                                  }}
                                  placeholder="100"
                                  className="w-full h-10 bg-white border border-gray-200 text-adv-slate rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all"
                                />
                              </div>
                            )}
                            {dateType !== 'booking' && (
                              <>
                                <div className="w-full lg:w-40 shrink-0">
                                  <label className="block text-xs font-bold text-gray-500 mb-1.5 whitespace-nowrap truncate" title={t.saleStarts}>
                                    {t.saleStarts} <span className="text-adv-orange">*</span>
                                  </label>
                                  <DateInputDDMMYYYY
                                    value={isEventDateSet ? (tier.saleStartDate || getTodayDateStr()) : ''}
                                    onChange={(val) => {
                                      const newTiers = [...ticketTiers];
                                      newTiers[index].saleStartDate = val;
                                      setTicketTiers(newTiers);
                                    }}
                                    disabled={!isEventDateSet}
                                    minDate={getTodayDateStr()}
                                    maxDate={tier.saleEndDate || getEventEndDateStr() || undefined}
                                    lang={lang}
                                    placeholder={isEventDateSet ? 'DD/MM/YYYY' : t.selectEventDateFirstPlaceholder}
                                    align="auto"
                                  />
                                </div>
                                <div className="w-full lg:w-40 shrink-0">
                                  <label className="block text-xs font-bold text-gray-500 mb-1.5 whitespace-nowrap truncate" title={t.saleEndsOptional}>
                                    {t.saleEndsOptional} <span className="text-adv-orange">*</span>
                                  </label>
                                  <DateInputDDMMYYYY
                                    value={isEventDateSet ? (tier.saleEndDate || getEventEndDateStr() || '') : ''}
                                    onChange={(val) => {
                                      const newTiers = [...ticketTiers];
                                      newTiers[index].saleEndDate = val;
                                      setTicketTiers(newTiers);
                                    }}
                                    disabled={!isEventDateSet}
                                    minDate={tier.saleStartDate || getTodayDateStr()}
                                    maxDate={getEventEndDateStr() || undefined}
                                    lang={lang}
                                    placeholder={isEventDateSet ? 'DD/MM/YYYY' : t.selectEventDateFirstPlaceholder}
                                    align="right"
                                  />
                                </div>
                              </>
                            )}
                            {ticketTiers.length > 1 && (
                              <div className="shrink-0 flex items-center justify-end">
                                <button 
                                  type="button"
                                  onClick={() => setTicketTiers(ticketTiers.filter((_, i) => i !== index))}
                                  className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                  title={lang === 'lo' ? 'ລຶບປະເພດປີ້' : 'Delete Tier'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                            )}
                          </div>
                        );})}
                      </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6 shadow-sm">
                        <div>
                          <h4 className="text-adv-slate font-bold mb-1">{t.couponsDiscounts}</h4>
                          <p className="text-sm text-gray-500">{t.offerDiscounts}</p>
                        </div>
                        <button 
                          onClick={() => setEnableCoupons(!enableCoupons)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${enableCoupons ? 'bg-adv-orange' : 'bg-gray-300'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${enableCoupons ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                        </button>
                      </div>

                      {enableCoupons && (
                        <motion.div 
                          id="field-coupons"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-6 overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-adv-slate">{t.couponsDiscounts}</h4>
                            <button 
                              type="button"
                              onClick={() => {
                                const isDateSet = Boolean(getEventEndDateStr());
                                const today = isDateSet ? getTodayDateStr() : '';
                                const evEnd = isDateSet ? getEventEndDateStr() : '';
                                setCoupons([
                                  ...coupons, 
                                  { 
                                    id: Date.now(), 
                                    code: '', 
                                    discount: '', 
                                    type: 'percentage', 
                                    maxUses: '', 
                                    validFrom: today, 
                                    validUntil: evEnd, 
                                    isActive: true 
                                  }
                                ]);
                              }}
                              className="flex items-center gap-2 text-adv-orange hover:text-orange-600 text-sm font-bold bg-adv-orange/5 hover:bg-adv-orange/10 px-4 py-2 rounded-xl transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              {t.addCoupon}
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {coupons.map((coupon, index) => {
                              const isEventDateSet = Boolean(getEventEndDateStr());
                              return (
                              <div key={coupon.id} className="flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 relative shadow-sm hover:shadow-md transition-shadow group">
                                {/* Header: Coupon Index & Remove */}
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-adv-orange/10 text-adv-orange flex items-center justify-center font-black text-xs">
                                      #{index + 1}
                                    </div>
                                    <span className="text-xs font-black text-adv-slate uppercase tracking-wider">
                                      {coupon.code ? coupon.code : `${t.couponCode} #${index + 1}`}
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setCoupons(coupons.filter((_, i) => i !== index))}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title={t.remove}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{t.remove}</span>
                                  </button>
                                </div>

                                {/* Row 1: 3 equal columns: Code, Discount Type, Discount Value */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Col 1: Code */}
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.couponCode}</label>
                                    <div className="relative">
                                      <input 
                                        type="text" 
                                        value={coupon.code}
                                        onChange={(e) => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].code = e.target.value.toUpperCase();
                                          setCoupons(newCoupons);
                                        }}
                                        placeholder="e.g. DISCOUNT2026"
                                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange uppercase tracking-widest pl-10"
                                      />
                                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Ticket className="w-4 h-4" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Col 2: Discount Type Toggle */}
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.discountType}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].type = 'percentage';
                                          setCoupons(newCoupons);
                                        }}
                                        className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${coupon.type === 'percentage' ? 'bg-adv-orange text-white border-adv-orange shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                      >
                                        {t.percentage}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].type = 'fixed';
                                          setCoupons(newCoupons);
                                        }}
                                        className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${coupon.type === 'fixed' ? 'bg-adv-orange text-white border-adv-orange shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                      >
                                        {t.fixedAmount}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Col 3: Discount Value */}
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider whitespace-nowrap truncate" title={t.discount}>{t.discount}</label>
                                    <div className="relative">
                                      <input 
                                        type="text" 
                                        inputMode="numeric" 
                                        value={coupon.discount}
                                        onChange={(e) => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].discount = coupon.type === 'fixed' ? formatNumberWithCommas(e.target.value) : e.target.value;
                                          setCoupons(newCoupons);
                                        }}
                                        placeholder={coupon.type === 'percentage' ? '20' : '50,000'}
                                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange pr-12"
                                      />
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">
                                        {coupon.type === 'percentage' ? '%' : currency}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Row 2: 3 equal columns: Max Discount Amount (Cap), Max Uses, Max Uses Per User */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Col 1: Max Discount Amount Cap */}
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider whitespace-nowrap truncate" title={t.maxDiscountAmount}>
                                      {t.maxDiscountAmount}
                                    </label>
                                    <div className="relative">
                                      {coupon.type === 'percentage' ? (
                                        <>
                                          <input 
                                            type="text" 
                                            inputMode="numeric" 
                                            value={coupon.maxDiscountAmount ? formatNumberWithCommas(coupon.maxDiscountAmount) : ''}
                                            onChange={(e) => {
                                              const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                              const newCoupons = [...coupons];
                                              newCoupons[index].maxDiscountAmount = rawVal ? Number(rawVal) : undefined;
                                              setCoupons(newCoupons);
                                            }}
                                            placeholder={t.unlimited}
                                            className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange pr-12"
                                          />
                                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold pointer-events-none">
                                            {currency}
                                          </div>
                                        </>
                                      ) : (
                                        <input 
                                          type="text" 
                                          disabled
                                          value={t.notApplicableFixed}
                                          className="w-full bg-gray-50/80 border border-gray-200 text-gray-400 rounded-lg px-3 py-2.5 text-xs font-medium cursor-not-allowed select-none"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Col 2: Max Uses (Total) */}
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider whitespace-nowrap truncate" title={t.maxUses}>{t.maxUses}</label>
                                    <input 
                                      type="number" 
                                      value={coupon.maxUses}
                                      onChange={(e) => {
                                        const newCoupons = [...coupons];
                                        newCoupons[index].maxUses = e.target.value;
                                        setCoupons(newCoupons);
                                      }}
                                      placeholder={t.unlimited}
                                      className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange"
                                    />
                                  </div>

                                  {/* Col 3: Max Uses Per User */}
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider whitespace-nowrap truncate" title={t.maxUsesPerUser}>{t.maxUsesPerUser}</label>
                                    <input 
                                      type="number" 
                                      min="1"
                                      value={coupon.maxUsesPerUser || ''}
                                      onChange={(e) => {
                                        const raw = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                        const newCoupons = [...coupons];
                                        newCoupons[index].maxUsesPerUser = raw;
                                        setCoupons(newCoupons);
                                      }}
                                      placeholder="1"
                                      className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange"
                                    />
                                  </div>
                                </div>

                                {/* Row 3: Validity Period: 2 columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{t.validFrom}</label>
                                    <DateInputDDMMYYYY
                                      value={isEventDateSet ? (coupon.validFrom || getTodayDateStr()) : ''}
                                      onChange={(val) => {
                                        const newCoupons = [...coupons];
                                        newCoupons[index].validFrom = val;
                                        setCoupons(newCoupons);
                                      }}
                                      disabled={!isEventDateSet}
                                      minDate={getTodayDateStr()}
                                      maxDate={coupon.validUntil || getEventEndDateStr() || undefined}
                                      lang={lang}
                                      placeholder={isEventDateSet ? 'DD/MM/YYYY' : t.selectEventDateFirstPlaceholder}
                                      align="auto"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{t.validUntil}</label>
                                    <DateInputDDMMYYYY
                                      value={isEventDateSet ? (coupon.validUntil || getEventEndDateStr() || '') : ''}
                                      onChange={(val) => {
                                        const newCoupons = [...coupons];
                                        newCoupons[index].validUntil = val;
                                        setCoupons(newCoupons);
                                      }}
                                      disabled={!isEventDateSet}
                                      minDate={coupon.validFrom || getTodayDateStr()}
                                      maxDate={getEventEndDateStr() || undefined}
                                      lang={lang}
                                      placeholder={isEventDateSet ? 'DD/MM/YYYY' : t.selectEventDateFirstPlaceholder}
                                      align="auto"
                                    />
                                  </div>
                                </div>
                              </div>
                            );})}
                            {coupons.length === 0 && (
                              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                                <p className="text-sm text-gray-400 font-medium">{t.noCoupons}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-8">
                  <h3 className="text-xl font-bold text-adv-slate mb-2">{t.step3}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-adv-slate font-bold mb-1">{t.showRemainingTickets}</h4>
                        <p className="text-sm text-gray-500">{t.showRemainingTicketsDesc}</p>
                      </div>
                      <button 
                        type="button"
                        id="step4-toggle-show-remaining-tickets"
                        onClick={() => setShowRemainingTickets(!showRemainingTickets)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${showRemainingTickets ? 'bg-adv-orange' : 'bg-gray-300'}`}
                        title={t.showRemainingTickets}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${showRemainingTickets ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-adv-slate font-bold mb-1">{t.requireEveryTicketInfo}</h4>
                        <p className="text-sm text-gray-500">{t.requireEveryTicketInfoDesc}</p>
                      </div>
                      <button 
                        onClick={() => setRequireEveryTicketInfo(!requireEveryTicketInfo)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${requireEveryTicketInfo ? 'bg-adv-orange' : 'bg-gray-300'}`}
                        type="button"
                      >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${requireEveryTicketInfo ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                      </button>
                    </div>

                    {/* Refund Control (Enable / Disable) */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-adv-slate font-bold mb-1">{t.allowRefunds}</h4>
                        <p className="text-sm text-gray-500">{t.allowRefundsDesc}</p>
                      </div>
                      <button 
                        onClick={() => setAllowRefunds(!allowRefunds)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${allowRefunds ? 'bg-adv-orange' : 'bg-gray-300'}`}
                        type="button"
                      >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${allowRefunds ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                      </button>
                    </div>







                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-adv-slate font-bold mb-1">{t.maxTicketsPerUser}</h4>
                        <p className="text-sm text-gray-500">{t.maxTicketsPerUserDesc}</p>
                      </div>
                      <select 
                        value={maxTickets}
                        onChange={(e) => setMaxTickets(e.target.value)}
                        className="bg-white border border-gray-200 text-adv-slate rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-adv-orange font-medium"
                      >
                        <option value="1">1 {t.ticketUnit}</option>
                        <option value="2">2 {t.ticketsUnit}</option>
                        <option value="4">4 {t.ticketsUnit}</option>
                        <option value="8">8 {t.ticketsUnit}</option>
                        <option value="10">10 {t.ticketsUnit}</option>
                        <option value="unlimited">{t.unlimited}</option>
                      </select>
                    </div>



                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-10">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={activeStep === 1}
                  className={`px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 border-2 ${
                    activeStep === 1 
                      ? 'border-gray-100 text-gray-300' 
                      : 'border-gray-100 text-adv-slate hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t.back}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="px-10 py-3.5 bg-adv-orange hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-100 flex items-center gap-2"
                  >
                    {activeStep === 4 ? (wasEditing ? (lang === 'lo' ? 'ອັບເດດກິດຈະກຳ' : 'Update Event') : t.publish) : t.continue}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
          )}

          {/* Modals & Overlays */}
          <AnimatePresence>
            {/* Media Modal Removed */}

            {/* Success Modal */}
            {showSuccessModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white border border-gray-100 rounded-[32px] w-full max-w-md p-10 text-center shadow-2xl"
                >
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Check className="w-12 h-12 text-adv-orange" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-adv-slate mb-4 tracking-tight">
                    {wasEditing ? t.updateEventSuccessTitle : t.successTitle}
                  </h3>
                  <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                    {wasEditing ? t.updateEventSuccessDesc : t.successDesc}
                  </p>
                  <button
                    onClick={() => { setShowSuccessModal(false); navigate('/admin'); }}
                    className="w-full py-4 rounded-2xl bg-adv-orange hover:bg-orange-600 text-white font-bold transition-all shadow-xl shadow-orange-100 text-lg"
                  >
                    {t.goToDashboard}
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Edit Blocked Modal */}
            {showEditBlockedModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white border border-gray-100 rounded-[32px] w-full max-w-md p-8 text-center shadow-2xl relative"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                    <MessageCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-extrabold text-adv-slate mb-3 tracking-tight">{t.editBlocked}</h3>
                  <p className="text-gray-500 mb-6 leading-relaxed font-medium text-sm">
                    {t.editBlockedDesc}
                  </p>
                  <div className="space-y-2.5">
                    <a
                      href={getWhatsAppAdminUrl(selectedEvent?.title || eventName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                      <span>{t.contactAdminWhatsApp}</span>
                    </a>
                    <button
                      onClick={() => setShowEditBlockedModal(false)}
                      className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all text-sm"
                    >
                      {t.close}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Notification Modal */}
            {showNotificationModal && activeTab === 'createEvent' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 30 }}
                  className="bg-white border border-gray-100 rounded-[32px] w-full max-w-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-20 h-20 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6 shadow-sm">
                      <AlertCircle className="w-10 h-10 text-adv-orange" />
                    </div>
                    <h3 className="text-2xl font-bold text-adv-slate">
                      {t.noted}
                    </h3>
                  </div>
                  
                  <div className="space-y-4 mb-8 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="bg-orange-50 border border-orange-100 p-4 sm:p-5 rounded-2xl flex gap-3.5 sm:gap-4">
                      <div className="shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5 text-adv-orange" />
                      </div>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        {t.notification2}
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 p-4 sm:p-5 rounded-2xl flex gap-3.5 sm:gap-4">
                      <div className="shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-adv-orange" />
                      </div>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        {t.notification3}
                      </p>
                    </div>

                    <div className="bg-orange-50/90 border border-orange-200/90 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                      <div className="flex gap-3.5 sm:gap-4 items-start">
                        <div className="shrink-0 mt-0.5">
                          <MessageCircle className="w-5 h-5 text-adv-orange" />
                        </div>
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium">
                          {t.notification4}
                        </p>
                      </div>
                      <a
                        href={getSpecialEventSupportUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-adv-slate hover:bg-black text-white text-xs font-bold shrink-0 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-adv-orange" />
                        <span>{t.directMessageSupport}</span>
                      </a>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="w-full py-4 rounded-2xl bg-adv-orange text-white font-bold text-lg transition-all shadow-xl shadow-orange-100"
                  >
                    {t.ok}
                  </button>
                </motion.div>
              </motion.div>
            )}


            {/* Image Locations Modal */}
            {showImageLocationsModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white border border-gray-100 rounded-[32px] w-full max-w-4xl shadow-2xl relative"
                >
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-adv-slate">Image Display Layout</h3>
                    <button 
                      onClick={() => setShowImageLocationsModal(false)}
                      className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                         <h4 className="font-bold text-adv-slate flex items-center gap-2">
                           <ImageIcon className="w-5 h-5 text-adv-orange" />
                           Vertical Banner (720x958)
                         </h4>
                         <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
                           {verticalImage ? (
                             <AdaptiveImage showBlurBackdrop={true} src={verticalImage} fitMode="contain" className="w-full h-full" />
                           ) : (
                             <div className="text-center p-6 text-gray-400">
                               <p className="text-sm font-bold uppercase tracking-widest text-adv-slate/20">Main Poster</p>
                             </div>
                           )}
                         </div>
                       </div>
                       <div className="space-y-4">
                         <h4 className="font-bold text-adv-slate flex items-center gap-2">
                           <ImageIcon className="w-5 h-5 text-adv-orange" />
                           Horizontal Background (1280x720)
                         </h4>
                         <div className="aspect-video rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
                           {horizontalImage ? (
                             <AdaptiveImage showBlurBackdrop={true} src={horizontalImage} fitMode="contain" className="w-full h-full" />
                           ) : (
                             <div className="text-center p-6 text-gray-400">
                               <p className="text-sm font-bold uppercase tracking-widest text-adv-slate/20">Page Cover</p>
                             </div>
                           )}
                         </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Top Bar with Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-adv-slate flex items-center gap-2.5">
                      <BarChart3 className="w-7 h-7 text-adv-orange shrink-0" />
                      <span>{lang === 'lo' ? 'ການວິເຄາະ & ສະຖິຕິກຣາບ' : 'Analytics & Sales Intelligence'}</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-xs sm:text-sm mt-1">
                      {lang === 'lo' 
                        ? 'ສູນກາງຕິດຕາມຍອດຂາຍປີ້, ລາຍຮັບກ່ອນຫັກຄ່າທຳນຽມ, ແລະ ຄວາມຄືບໜ້າຂອງທຸກກິດຈະກຳ' 
                        : 'Monitor real-time ticket sales performance, revenue before fee curves, and attendance rates.'}
                    </p>
                  </div>
                </div>

                {/* Comprehensive Interactive Graph Dashboard */}
                <OrganizerEventAnalytics 
                  events={localEvents} 
                  lang={lang as 'en' | 'lo'} 
                  currency={currency} 
                  onSelectEventForModal={(event) => setSelectedEvent(event)}
                />
              </div>
            )}
            {activeTab === 'terms' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-50 text-adv-orange mb-6 border border-orange-100 shadow-inner">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-adv-slate mb-4">
                    {lang === 'lo' ? (organizerTerms.title_lo || organizerTerms.title_en) : (organizerTerms.title_en || organizerTerms.title_lo)}
                  </h2>
                  <p className="text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                    {lang === 'lo' ? (organizerTerms.intro_lo || organizerTerms.intro_en) : (organizerTerms.intro_en || organizerTerms.intro_lo)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizerTerms.sections && organizerTerms.sections.map((sect, index) => {
                    const colorSchemes = [
                      { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-100', hoverBg: 'group-hover:bg-blue-500' },
                      { bg: 'bg-orange-50', text: 'text-adv-orange', border: 'border-orange-100', hoverBg: 'group-hover:bg-adv-orange' },
                      { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100', hoverBg: 'group-hover:bg-red-500' },
                      { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100', hoverBg: 'group-hover:bg-emerald-500' },
                      { bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-100', hoverBg: 'group-hover:bg-purple-500' },
                      { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100', hoverBg: 'group-hover:bg-indigo-500' },
                      { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100', hoverBg: 'group-hover:bg-amber-500' },
                      { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100', hoverBg: 'group-hover:bg-rose-500' },
                      { bg: 'bg-teal-50', text: 'text-teal-500', border: 'border-teal-100', hoverBg: 'group-hover:bg-teal-500' }
                    ];
                    const scheme = colorSchemes[index % colorSchemes.length];
                    const title = lang === 'lo' ? (sect.title_lo || sect.title_en) : (sect.title_en || sect.title_lo);
                    const content = lang === 'lo' ? (sect.content_lo || sect.content_en) : (sect.content_en || sect.content_lo);

                    return (
                      <div key={sect.id || index} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${scheme.bg} flex items-center justify-center ${scheme.text} shrink-0 border ${scheme.border} ${scheme.hoverBg} group-hover:text-white transition-all shadow-sm`}>
                            {renderTermIcon(sect.icon, "w-6 h-6")}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-adv-slate mb-2">{title}</h3>
                            <p className="text-gray-500 leading-relaxed text-xs font-medium">{content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (() => {
          const isPastModal = new Date(`${selectedEvent.date}T23:59:59`) < new Date();
          const daysUntilModal = getDaysUntilEvent(selectedEvent.date);
          const isFlexibleModal = selectedEvent.dateType === 'flexible';
          const canEditModal = isFlexibleModal || (daysUntilModal >= 7);
          
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-white border border-gray-100 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative"
              >
                {/* Modal Header */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-adv-slate line-clamp-1">{selectedEvent.title}</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">Event Details & Statistics</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setShowEditBlockedModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-all text-xs font-black border border-emerald-200/60 shadow-sm uppercase tracking-wider"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'lo' ? 'ຕິດຕໍ່ Admin ເພື່ອແກ້ໄຂ' : 'Contact Admin to Edit'}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedEvent(null)}
                      className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-adv-slate transition-all shadow-sm border border-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)] space-y-8">

                  {selectedEvent.image && (
                    <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-xl group">
                      <AdaptiveImage 
                        src={selectedEvent.image} 
                        alt={selectedEvent.title} 
                        className="w-full h-80 group-hover:scale-105 transition-transform duration-700"
                        showBlurBackdrop={true}
                        fitMode="contain"
                      />
                    </div>
                  )}

                  {/* Interactive Event Analytics & Performance Graph */}
                  <EventDetailGraphSection 
                    event={selectedEvent} 
                    lang={lang as 'en' | 'lo'} 
                    currency={currency} 
                  />

                  {/* Ticket Price & Tiers Information */}
                  <div className="bg-gray-50/80 p-6 rounded-[24px] border border-gray-100 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-adv-slate flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-adv-orange" />
                        {lang === 'lo' ? 'ຂໍ້ມູນລາຄາປີ້ ແລະ ປະເພດປີ້' : 'Ticket Pricing & Tiers'}
                      </h4>
                      <span className="text-[10px] bg-orange-50 text-adv-orange font-black px-2.5 py-1 rounded-full border border-orange-100 uppercase tracking-wider">
                        {selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0
                          ? `${selectedEvent.ticketTiers.length} ${lang === 'lo' ? 'ປະເພດປີ້' : 'Tiers'}`
                          : (lang === 'lo' ? 'ປີ້ເຂົ້າຮ່ວມທົ່ວໄປ' : 'General Admission')}
                      </span>
                    </div>

                    {/* Overall / Starting Price Summary Banner */}
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {lang === 'lo' ? 'ລາຄາປີ້ເລີ່ມຕົ້ນ / Starting Ticket Price' : 'Starting Ticket Price'}
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-adv-orange mt-0.5">
                          {selectedEvent.price || (selectedEvent.ticketTiers && selectedEvent.ticketTiers[0]?.price 
                            ? `${(Number(String(selectedEvent.ticketTiers[0].price).replace(/,/g, '')) || 0).toLocaleString()} ${currency}`
                            : `0 ${currency}`)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">
                          {lang === 'lo' ? 'ເປີດຂາຍປີ້ຢູ່' : 'Active Ticket Sales'}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Ticket Tiers Breakdown */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider px-1">
                        {lang === 'lo' ? 'ລາຍລະອຽດປະເພດປີ້ທັງໝົດ' : 'Ticket Tier Breakdown'}
                      </h5>

                      {selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedEvent.ticketTiers.map((tier: any, idx: number) => {
                            const formattedPrice = typeof tier.price === 'number'
                              ? `${tier.price.toLocaleString()} ${currency}`
                              : (tier.price 
                                  ? (isNaN(Number(String(tier.price).replace(/,/g, ''))) 
                                      ? tier.price 
                                      : `${Number(String(tier.price).replace(/,/g, '')).toLocaleString()} ${currency}`)
                                  : `0 ${currency}`);

                            return (
                              <div 
                                key={tier.id || idx}
                                className="p-4 bg-white border border-gray-150 rounded-2xl flex flex-col justify-between gap-2 shadow-sm hover:border-orange-200 transition-all"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-extrabold text-sm text-adv-slate">
                                      {tier.name || (lang === 'lo' ? `ປະເພດປີ້ ${idx + 1}` : `Tier ${idx + 1}`)}
                                    </div>
                                    {tier.description && (
                                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tier.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-black text-sm text-adv-orange">{formattedPrice}</div>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-400">
                                  {dateType !== 'booking' ? (
                                    <span className="flex items-center gap-1">
                                      📦 {lang === 'lo' ? 'ຈຳນວນ:' : 'Qty:'} <strong className="text-adv-slate font-bold">{tier.quantity || tier.available || 'Unlimited'}</strong>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-adv-orange font-bold">
                                      ✨ {lang === 'lo' ? 'ການຈອງຕາມນັດໝາຍ' : 'Booking Service'}
                                    </span>
                                  )}
                                  {dateType !== 'booking' && (tier.saleStartDate || tier.saleEndDate) && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      🗓️ {tier.saleStartDate ? formatToDDMMYYYY(tier.saleStartDate) : ''} 
                                      {tier.saleEndDate ? ` - ${formatToDDMMYYYY(tier.saleEndDate)}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-xs text-gray-600 font-bold">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-adv-orange" />
                            <span>{lang === 'lo' ? 'ປີ້ເຂົ້າຮ່ວມທົ່ວໄປ (General Admission)' : 'General Admission Ticket'}</span>
                          </div>
                          <span className="font-black text-adv-orange text-sm">
                            {selectedEvent.price || `0 ${currency}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule and Location */}
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6 bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-adv-slate flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-adv-orange" />
                        Date & Time
                      </h4>
                      <div className="space-y-2 pl-6">
                        {selectedEvent.dateType === 'flexible' && (
                          <span className="inline-block text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider">
                            {t.flexibleDate}
                          </span>
                        )}
                        {selectedEvent.dateType === 'booking' && (
                          <span className="inline-block text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                            {lang === 'lo' ? 'ການຈອງຕາມຮອບເວລາ (Booking)' : 'Slot Booking Service'}
                          </span>
                        )}
                        <p className="text-sm text-gray-700 font-semibold">
                          {new Date(selectedEvent.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date && (
                            <>
                              <span className="mx-1.5 text-gray-400">→</span>
                              {new Date(selectedEvent.endDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </>
                          )}
                        </p>
                        {selectedEvent.time && selectedEvent.dateType !== 'booking' && (
                          <p className="text-sm text-gray-500 font-bold flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {selectedEvent.time}
                          </p>
                        )}
                        {selectedEvent.dateType === 'booking' && selectedEvent.bookingTimeSlots && selectedEvent.bookingTimeSlots.length > 0 && (
                          <div className="pt-2 space-y-1.5">
                            <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-adv-orange" />
                              {lang === 'lo' ? 'ຮອບເວລາ & ຄວາມຈຸຕໍ່ 1 ວັນ:' : 'Time Slots & Daily Capacity (Per 1 Day):'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedEvent.bookingTimeSlots.map((slot: string, sIdx: number) => {
                                const cap = selectedEvent.bookingSlotCapacities?.[slot] || Number(selectedEvent.bookingCapacity) || 10;
                                return (
                                  <div key={sIdx} className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl flex items-center gap-2 shadow-2xs">
                                    <span className="font-mono font-bold text-xs text-adv-slate">{slot}</span>
                                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                      {cap} {lang === 'lo' ? 'ຄົນ/ຮອບ/ວັນ' : 'people/slot/day'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-adv-slate flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-adv-orange" />
                        Venue & Location
                      </h4>
                      <div className="space-y-1 pl-6">
                        <p className="text-sm text-gray-700 font-bold">{selectedEvent.venue || 'TBA'}</p>
                        <p className="text-sm text-gray-500 font-medium">{selectedEvent.location}</p>
                        {(selectedEvent.district || selectedEvent.province) && (
                          <p className="text-xs text-gray-400 font-bold">
                            {selectedEvent.district && `${selectedEvent.district}, `}{selectedEvent.province}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Venue Map View / Online Stream Details */}
                  {selectedEvent.eventType === 'online' ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-adv-slate flex items-center gap-2">
                        <Video className="w-4 h-4 text-adv-orange" />
                        {lang === 'lo' ? 'ຂໍ້ມູນແພລດຟອມ ແລະ ລິ້ງເຂົ້າຮ່ວມງານອອນລາຍ' : 'Online Platform & Access Details'}
                      </h4>
                      <div className="p-6 bg-gradient-to-br from-orange-50/80 to-amber-50/40 rounded-[24px] border border-orange-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-adv-orange text-white flex items-center justify-center shadow-md">
                              <Video className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-adv-slate text-base">
                                {selectedEvent.onlinePlatform 
                                  ? (ONLINE_PLATFORMS_LIST.find(p => p.id === selectedEvent.onlinePlatform)?.name || selectedEvent.onlinePlatform)
                                  : 'Online Event / Virtual Platform'}
                              </h5>
                              <span className="text-xs font-bold text-adv-orange">
                                {lang === 'lo' ? 'ແພລດຟອມຖ່າຍທອດສົດ' : 'Live Streaming Platform'}
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-white text-emerald-600 rounded-full text-xs font-extrabold border border-emerald-100 shadow-xs">
                            ● {lang === 'lo' ? 'ພ້ອມໃຊ້ງານ' : 'Ready'}
                          </span>
                        </div>

                        {selectedEvent.onlineMeetingUrl && (
                          <div className="p-3.5 bg-white rounded-xl border border-orange-100 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2 overflow-hidden text-xs font-bold text-gray-700">
                              <Globe className="w-4 h-4 text-adv-orange shrink-0" />
                              <span className="truncate">{selectedEvent.onlineMeetingUrl}</span>
                            </div>
                            <a
                              href={selectedEvent.onlineMeetingUrl.startsWith('http') ? selectedEvent.onlineMeetingUrl : `https://${selectedEvent.onlineMeetingUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-adv-orange text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors shrink-0 flex items-center gap-1"
                            >
                              {lang === 'lo' ? 'ເປີດລິ້ງ' : 'Join'} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {(selectedEvent.onlinePasscode || selectedEvent.onlineInstructions) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                            {selectedEvent.onlinePasscode && (
                              <div className="p-3 bg-white/80 rounded-xl border border-gray-100">
                                <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Passcode / Meeting ID</span>
                                <span className="font-extrabold text-adv-slate">{selectedEvent.onlinePasscode}</span>
                              </div>
                            )}
                            {selectedEvent.onlineInstructions && (
                              <div className="p-3 bg-white/80 rounded-xl border border-gray-100 sm:col-span-1">
                                <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider mb-0.5">Attendee Guidance</span>
                                <span className="font-semibold text-gray-600">{selectedEvent.onlineInstructions}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-adv-slate flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-adv-orange" />
                        Map Venue / ແຜນທີ່ສະຖານທີ່ຈັດງານ
                      </h4>
                      <div className="rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
                        <EventMapPicker 
                          isReadOnly={true}
                          venue={selectedEvent.venue}
                          address={selectedEvent.location}
                          googleMapUrl={selectedEvent.googleMapUrl}
                          province={selectedEvent.province}
                          district={selectedEvent.district}
                          latitude={selectedEvent.latitude}
                          longitude={selectedEvent.longitude}
                          lang={lang as 'en' | 'lo'}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                     <h4 className="text-sm font-bold text-adv-slate mb-4">About this Event</h4>
                     <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 shadow-inner">
                       <div 
                         className="text-gray-600 leading-relaxed text-lg font-medium rich-text-content"
                         onClick={handlePreviewLinkClick}
                         dangerouslySetInnerHTML={{ __html: selectedEvent.description || 'No description provided.' }}
                       />
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Full Interactive Event Preview Modal */}
        {showPreviewModal && previewData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              // Clicking directly on the backdrop closes the preview
              if (e.target === e.currentTarget) {
                setShowPreviewModal(false);
              }
            }}
            className="fixed inset-0 z-[200] flex flex-col bg-slate-900/95 backdrop-blur-md overflow-hidden"
          >
            {/* Preview Top Bar */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between shrink-0 shadow-2xl z-20 gap-4"
            >
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <span className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                  <Eye className="w-4 h-4" />
                  {lang === 'lo' ? 'ໂໝດເບິ່ງຕົວຢ່າງ' : 'PREVIEW MODE'}
                </span>
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setPreviewDeviceMode('desktop')}
                    className={`p-2 rounded-lg transition-all ${previewDeviceMode === 'desktop' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                    title={lang === 'lo' ? 'ເບິ່ງແບບເດັສທ໋ອບ' : 'Desktop View'}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDeviceMode('mobile')}
                    className={`p-2 rounded-lg transition-all ${previewDeviceMode === 'mobile' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                    title={lang === 'lo' ? 'ເບິ່ງແບບມືຖື' : 'Mobile View'}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
                <span className="hidden sm:inline text-[11px] text-slate-400 font-medium ml-2">
                  ({lang === 'lo' ? 'ຄລິກພື້ນທີ່ວ່າງເພື່ອປິດ ຫຼື ກົດ Esc' : 'Click blank space to close or press Esc'})
                </span>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex justify-center items-center gap-1.5 cursor-pointer"
                  title={lang === 'lo' ? 'ປິດໂໝດເບິ່ງຕົວຢ່າງ' : 'Close preview'}
                >
                  <X className="w-4 h-4" />
                  {t.backToEdit || (lang === 'lo' ? 'ກັບໄປແກ້ໄຂ' : 'Back to Edit')}
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    if (activeStep !== 5) setActiveStep(5);
                    handleContinue();
                  }}
                  className="flex-1 md:flex-none px-5 py-2 bg-adv-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20 flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {t.publishFromPreview || (lang === 'lo' ? 'ເຜີຍແຜ່ event ດຽວນີ້' : 'Publish Event Now')}
                </button>
              </div>
            </div>

            {/* Preview Body Content Scroll Area - Clicking on any blank space outside the card closes preview */}
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowPreviewModal(false);
                }
              }}
              className={`flex-1 overflow-y-auto text-adv-slate flex justify-center cursor-pointer ${previewDeviceMode === 'mobile' ? 'bg-slate-900/60 py-8 px-4 items-start' : 'bg-slate-900/40 py-8 px-4 sm:px-6 md:px-8'}`}
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`w-full mx-auto transition-all duration-300 cursor-default ${previewDeviceMode === 'mobile' ? 'max-w-[400px] min-h-[800px] h-[800px] bg-gray-50 rounded-[3rem] border-[14px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative' : 'max-w-6xl px-4 sm:px-8 py-8 bg-gray-50 rounded-3xl shadow-2xl border border-gray-200'}`}>
                 {previewDeviceMode === 'mobile' && (
                   <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-start z-50 pointer-events-none">
                     <div className="w-32 h-6 bg-slate-800 rounded-b-3xl"></div>
                   </div>
                 )}
                 <div className={previewDeviceMode === 'mobile' ? 'flex-1 overflow-y-auto scrollbar-hide' : 'flex-1 overflow-y-auto'}>
                   <EventDetails previewEventData={previewData} onClosePreview={() => setShowPreviewModal(false)} />
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
