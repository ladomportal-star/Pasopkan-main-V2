import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { Calendar, Folder, FileText, Plus, User, Users, Mail, ChevronDown, Inbox, Ticket, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Image as ImageIcon, Video, MapPin, Loader2, Trash2, X, Check, QrCode, LogOut, Edit, ShieldCheck, DollarSign, RefreshCcw, FileCheck, BookOpen, AlertCircle, ShieldAlert, ArrowLeft, ArrowRight, Globe, Clock, Settings, Lock, Eye, UploadCloud, ExternalLink, Monitor, Smartphone, CheckCircle2, Sparkles, Paperclip, Search, Quote, Minus, Heading1, Heading2, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { safeStorage } from '../lib/storage';
import { laosProvinces, getDistrictsForProvince } from '../lib/laosLocations';
import { events } from '../data/events';
import Logo from '../components/Logo';
import { EventMapPicker } from '../components/EventMapPicker';
import { ScrollTimePicker } from '../components/ScrollTimePicker';
import { FlexibleDatePicker } from '../components/FlexibleDatePicker';
import { CalendarPicker } from '../components/CalendarPicker';
import SocialLinksForm, { SocialLinks } from '../components/SocialLinksForm';

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
    voucher: 'Vouchers',
    eventInfo: 'Event Information',
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
    ok: 'OK',
    couponsDiscounts: 'Coupons & Discounts',
    offerDiscounts: 'Offer special discounts to your attendees.',
    addCoupon: 'Add Coupon',
    couponCode: 'Coupon Code',
    discountType: 'Discount Type',
    percentage: 'Percentage (%)',
    fixedAmount: 'Fixed Amount (Kip)',
    discount: 'Discount',
    maxUses: 'Max Uses',
    validUntil: 'Valid Until',
    validFrom: 'Valid From',
    unlimited: 'Unlimited',
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
    editBlocked: 'Editing Locked',
    editBlockedDesc: 'This event starts in less than 7 days. To protect buyers and maintain platform reliability, editing is locked during the final 7 days before an event starts.',
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
    organizerKyc: 'Organizer Verification (KYC)',
    organizerKycDesc: 'To ensure a safe platform, please provide your identification documents. These are for verification purposes only.',
    idCard: 'ID Card / Passport',
    businessReg: 'Business Registration (if applicable)',
    uploadDocument: 'Upload Document',
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
    saleStarts: 'Sale Starts (Optional)',
    saleEndsOptional: 'Sale Ends (Optional)',
    showRemainingTickets: 'Show Remaining Tickets',
    showRemainingTicketsDesc: 'Display the number of available tickets on the event page.',
    requireEveryTicketInfo: 'Require Guest Info for Every Ticket',
    requireEveryTicketInfoDesc: 'If disabled, only the buyer\'s information is required even when purchasing multiple tickets.',
    enableCountdown: 'Enable Event Countdown Timer',
    enableCountdownDesc: 'Show a live real-time countdown timer to the event start time on the details page.',
    allowRefunds: 'Allow Refunds',
    allowRefundsDesc: 'Let attendees request refunds up to 24 hours before the event.',
    maxTicketsPerUser: 'Max Tickets Per User',
    maxTicketsPerUserDesc: 'Limit the number of tickets a single user can purchase.',
    ticketUnit: 'Ticket',
    ticketsUnit: 'Tickets',
    dateType: 'Date Type',
    fixedDate: 'Fixed Date',
    flexibleDate: 'Flexible Date',
    flexibleDesc: 'Flexible Date Description',
    flexibleDescPlaceholder: 'e.g. Valid for any day in July, Every weekend',
    flexibleTimeDesc: 'Set the daily operating hours or time slot for this flexible event range.',
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
    voucher: 'Vouchers',
    eventInfo: 'ຂໍ້ມູນ event',
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
    ok: 'ຕົກລົງ',
    couponsDiscounts: 'ຄູປອງ & ສ່ວນຫຼຸດ',
    offerDiscounts: 'ສະເໜີສ່ວນຫຼຸດພິເສດໃຫ້ກັບຜູ້ເຂົ້າຮ່ວມຂອງທ່ານ.',
    addCoupon: 'ເພີ່ມຄູປອງ',
    couponCode: 'ລະຫັດຄູປອງ',
    discountType: 'ປະເພດສ່ວນຫຼຸດ',
    percentage: 'ເປີເຊັນ (%)',
    fixedAmount: 'ຈຳນວນເງິນຄົງທີ່ (ກີບ)',
    discount: 'ສ່ວນຫຼຸດ',
    maxUses: 'ຈຳນວນການນຳໃຊ້ສູງສຸດ',
    validUntil: 'ໃຊ້ໄດ້ເຖິງ',
    validFrom: 'ໃຊ້ໄດ້ຕັ້ງແຕ່',
    unlimited: 'ບໍ່ຈຳກັດ',
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
    editBlocked: 'ການແກ້ໄຂຖືກລັອກ',
    editBlockedDesc: 'event ນີ້ມີກຳນົດຈະເລີ່ມຕົ້ນພາຍໃນບໍ່ຮອດ 7 ວັນ. ເພື່ອປົກປ້ອງຜູ້ຊື້ ແລະ ຮັກສາຄວາມໜ້າເຊື່ອຖືຂອງແພລດຟອມ, ການແກ້ໄຂຈຶ່ງຖືກລັອກໃນຊ່ວງ 7 ວັນສຸດທ້າຍກ່ອນມື້ເລີ່ມຕົ້ນ.',
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
    organizerKyc: 'ການຢືນຢັນຕົວຕົນຜູ້ຈັດງານ (KYC)',
    organizerKycDesc: 'ເພື່ອຮັບປະກັນຄວາມປອດໄພຂອງແພລດຟອມ, ກະລຸນາສະໜອງເອກະສານຢັ້ງຢືນຕົວຕົນຂອງທ່ານ.',
    idCard: 'ບັດປະຈຳຕົວ / ໜັງສືຜ່ານແດນ',
    businessReg: 'ໃບທະບຽນວິສາຫະກິດ (ຖ້າມີ)',
    uploadDocument: 'ອັບໂຫຼດເອກະສານ',
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
    saleStarts: 'ເລີ່ມຕົ້ນການຂາຍ (ທາງເລືອກ)',
    saleEndsOptional: 'ສິ້ນສຸດການຂາຍ (ທາງເລືອກ)',
    showRemainingTickets: 'ສະແດງຈຳນວນປີ້ທີ່ເຫຼືອ',
    showRemainingTicketsDesc: 'ສະແດງຈຳນວນປີ້ທີ່ຍັງສາມາດຊື້ໄດ້ໃນໜ້າ event.',
    requireEveryTicketInfo: 'ຕ້ອງການຂໍ້ມູນແຂກສຳລັບທຸກໆປີ້',
    requireEveryTicketInfoDesc: 'ຖ້າປິດການນຳໃຊ້, ຈະຕ້ອງການພຽງແຕ່ຂໍ້ມູນຂອງຜູ້ຊື້ເທົ່ານັ້ນ ເຖິງແມ່ນວ່າຈະຊື້ຫຼາຍປີ້ກໍຕາມ.',
    enableCountdown: 'ເປີດໃຊ້ງານໂມງນັບຖອຍຫຼັງ',
    enableCountdownDesc: 'ສະແດງໂມງນັບຖອຍຫຼັງແບບສົດໆ ກ່ອນເວລາເລີ່ມຕົ້ນຂອງ event ໃນໜ້າລາຍລະອຽດ.',
    allowRefunds: 'ອະນຸຍາດໃຫ້ຄືນເງິນ',
    allowRefundsDesc: 'ໃຫ້ຜູ້ເຂົ້າຮ່ວມຮ້ອງຂໍຄືນເງິນໄດ້ເຖິງ 24 ຊົ່ວໂມງກ່ອນ event.',
    maxTicketsPerUser: 'ຈຳນວນປີ້ສູງສຸດຕໍ່ຜູ້ໃຊ້',
    maxTicketsPerUserDesc: 'ຈຳກັດຈຳນວນປີ້ທີ່ຜູ້ໃຊ້ໜຶ່ງຄົນສາມາດຊື້ໄດ້.',
    ticketUnit: 'ປີ້',
    ticketsUnit: 'ປີ້',
    dateType: 'ປະເພດວັນທີ',
    fixedDate: 'ວັນທີຄົງທີ່',
    flexibleDate: 'ວັນທີປ່ຽນແປງໄດ້',
    flexibleDesc: 'ຄຳອະທິບາຍວັນທີທີ່ປ່ຽນແປງໄດ້',
    flexibleDescPlaceholder: 'ເຊັ່ນ: ໃຊ້ໄດ້ທຸກມື້ໃນເດືອນກໍລະກົດ, ທຸກໆທ້າຍອາທິດ',
    flexibleTimeDesc: 'ກຳນົດເວລາເປີດບໍລິການປະຈຳວັນ ຫຼື ຊ່ວງເວລາສຳລັບ event ທີ່ປ່ຽນແປງໄດ້ນີ້.',
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
  type: 'text' | 'options' | 'single_choice' | 'url' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[]; // for type 'options' or 'single_choice'
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { lang, toggleLanguage } = useLanguage();
  const t = translations[lang];
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
  const [dateType, setDateType] = useState('fixed'); // 'fixed' or 'flexible'
  const [flexibleDateDesc, setFlexibleDateDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState('myEvents');
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
  
  // Additional event detail settings
  const [eventPrivacy, setEventPrivacy] = useState<'public' | 'private'>('public');
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const privacyDropdownRef = useRef<HTMLDivElement>(null);

  // Block inserter state for rich editor
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const blockMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(e.target as Node)) {
        setShowPrivacyDropdown(false);
      }
      if (blockMenuRef.current && !blockMenuRef.current.contains(e.target as Node)) {
        setShowBlockMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditorAttachmentUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const sizeKb = Math.round(file.size / 1024);
        const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const dataUrl = event.target.result.toString();
            const attachmentHtml = `
              <div contenteditable="false" class="my-3 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="w-10 h-10 rounded-xl bg-orange-100 text-adv-orange flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                    ${file.name.split('.').pop() || 'FILE'}
                  </div>
                  <div class="truncate">
                    <div class="font-bold text-sm text-adv-slate truncate">${file.name}</div>
                    <div class="text-xs text-gray-400">${sizeStr}</div>
                  </div>
                </div>
                <a href="${dataUrl}" download="${file.name}" class="px-3.5 py-1.5 bg-adv-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5">
                  Download
                </a>
              </div>
              <p><br></p>
            `;
            execCommand('insertHTML', attachmentHtml);
          }
        };
        reader.readAsDataURL(file as File);
      }
    };
    input.click();
  };

  const handleInsertBlock = (blockId: string) => {
    setShowBlockMenu(false);
    setBlockSearchQuery('');
    if (editorRef.current) {
      editorRef.current.focus();
    }

    switch (blockId) {
      case 'h1':
        execCommand('insertHTML', '<h2 class="text-2xl font-extrabold text-adv-slate my-3">Heading</h2><p><br></p>');
        break;
      case 'h2':
        execCommand('insertHTML', '<h3 class="text-lg font-bold text-adv-slate my-2">Subheading</h3><p><br></p>');
        break;
      case 'image':
        handleEditorImageUpload();
        break;
      case 'blockquote':
        execCommand('insertHTML', '<blockquote class="border-l-4 border-adv-orange pl-4 py-2 my-3 italic text-gray-600 bg-orange-50/60 rounded-r-xl">"Quote text..."</blockquote><p><br></p>');
        break;
      case 'divider':
        execCommand('insertHTML', '<hr class="my-5 border-t border-gray-200" /><p><br></p>');
        break;
      case 'list':
        execCommand('insertUnorderedList');
        break;
      case 'numbered_list':
        execCommand('insertOrderedList');
        break;
      case 'attachment':
        handleEditorAttachmentUpload();
        break;
      default:
        break;
    }
  };

  const [attendeeMessage, setAttendeeMessage] = useState('');
  const [showRemainingTickets, setShowRemainingTickets] = useState(true);
  const [allowRefunds, setAllowRefunds] = useState(false);
  const [allowReviews, setAllowReviews] = useState(true);
  const [eventStatus, setEventStatus] = useState<string>('active');
  const [maxTickets, setMaxTickets] = useState('4');
  const [requireEveryTicketInfo, setRequireEveryTicketInfo] = useState(true);
  const [enableCountdown, setEnableCountdown] = useState(true);
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Preview event modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const handleOpenPreview = () => {
    const preview = {
      id: editingEventId || 'preview-temp-id',
      title: eventName.trim() || (lang === 'lo' ? 'ຊື່ກິດຈະກຳຕົວຢ່າງ' : 'Sample Event Name'),
      category: eventType === 'online' ? 'Workshop' : (category || 'Festival'),
      venue: venueName || (lang === 'lo' ? 'ສະຖານທີ່ຈັດງານ' : 'Event Venue'),
      province: province || 'Vientiane',
      district: district || 'Chanthabouly',
      location: streetAddress || 'Vientiane, Laos',
      organizer: organizerName || 'Organizer Name',
      organizerInfo: organizerInfo || '',
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
      flexibleDateDesc: flexibleDateDesc,
      date: startDate || new Date().toISOString().split('T')[0],
      time: startTime || '18:00',
      endDate: endDate || startDate,
      endTime: endTime || '22:00',
      price: ticketTiers[0]?.price ? `${(Number(String(ticketTiers[0].price).replace(/,/g, '')) || 0).toLocaleString()} ${currency}` : `0 ${currency}`,
      currency: currency,
      image: verticalImage || horizontalImage || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000',
      horizontalImage: horizontalImage || verticalImage || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000',
      exampleImages: galleryImages.length > 0 ? galleryImages : [],
      description: editorContent || (lang === 'lo' ? 'ຍັງບໍ່ມີລາຍລະອຽດກິດຈະກຳ...' : 'No event description provided yet...'),
      ticketTiers: ticketTiers.filter(t => t.name || t.price),
      coupons: enableCoupons ? coupons : [],
      hasSeating: hasSeating,
      zoneImage: zoneImage,
      hasTimeSelection: hasTimeSelection,
      timeSlots: timeSlots,
      availableDates: availableDates,
      status: 'preview',
      requireEveryTicketInfo: requireEveryTicketInfo,
      enableCountdown: enableCountdown,
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
    setEventType(event.eventType || 'offline');
    setOnlinePlatform(event.onlinePlatform || 'zoom');
    setOnlineMeetingUrl(event.onlineMeetingUrl || '');
    setOnlinePasscode(event.onlinePasscode || '');
    setOnlineInstructions(event.onlineInstructions || '');
    setDateType(event.dateType || 'fixed');
    setFlexibleDateDesc(event.flexibleDateDesc || '');
    setStartDate(event.date || '');
    setStartTime(event.time || '');
    setEndDate(event.endDate || '');
    setEndTime(event.endTime || '');
    setDurationEn(event.durationEn || '');
    setDurationLo(event.durationLo || '');
    setSelectedLanguages(event.languages || ['Lao', 'English']);
    setTicketTiers(event.ticketTiers || [{ id: 1, name: '', price: '', quantity: '', saleStartDate: '', saleStartTime: '', saleEndDate: '', saleEndTime: '' }]);
    setCoupons(event.coupons || []);
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
    setEnableCountdown(event.enableCountdown !== false);
    setEventPrivacy(event.eventPrivacy || 'public');
    setAttendeeMessage(event.attendeeMessage || '');
    
    // Switch to createEvent tab
    setActiveTab('createEvent');
    setActiveStep(1); // start at step 1
    setSelectedEvent(null); // Close details modal if open
  };

  // Auto-edit event if navigated with search param ?editId= or location state
  useEffect(() => {
    const editId = searchParams.get('editId') || location.state?.editEventId;
    if (editId && localEvents.length > 0) {
      const foundEvent = localEvents.find((e: any) => String(e.id) === String(editId));
      if (foundEvent) {
        handleStartEdit(foundEvent);
      }
    }
  }, [searchParams, location.state]);

  const handleToggleDateTypeInOrganizer = (eventToToggle: any) => {
    const currentType = eventToToggle.dateType || 'fixed';
    const newType = currentType === 'flexible' ? 'fixed' : 'flexible';
    
    const updatedEvents = localEvents.map(evt => {
      if (evt.id === eventToToggle.id) {
        return {
          ...evt,
          dateType: newType,
          date: evt.date || new Date().toISOString().split('T')[0],
          endDate: evt.endDate || evt.date || new Date().toISOString().split('T')[0],
          time: evt.time || '09:00',
          endTime: evt.endTime || '17:00'
        };
      }
      return evt;
    });

    setLocalEvents(updatedEvents);
    safeStorage.setItem('organizer_events', JSON.stringify(updatedEvents));
    
    if (selectedEvent && selectedEvent.id === eventToToggle.id) {
      setSelectedEvent({
        ...selectedEvent,
        dateType: newType,
        date: selectedEvent.date || new Date().toISOString().split('T')[0],
        endDate: selectedEvent.endDate || selectedEvent.date || new Date().toISOString().split('T')[0],
        time: selectedEvent.time || '09:00',
        endTime: selectedEvent.endTime || '17:00'
      });
    }
  };
  
  const [verticalImage, setVerticalImage] = useState<string | null>(null);
  const [horizontalImage, setHorizontalImage] = useState<string | null>(null);
  const [verticalUploadProgress, setVerticalUploadProgress] = useState<number | null>(null);
  const [horizontalUploadProgress, setHorizontalUploadProgress] = useState<number | null>(null);
  const [organizerLogo, setOrganizerLogo] = useState<string | null>(null);
  const [organizerLogoProgress, setOrganizerLogoProgress] = useState<number | null>(null);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  
  // KYC states
  const [idCardFile, setIdCardFile] = useState<string | null>(null);
  const [idCardProgress, setIdCardProgress] = useState<number | null>(null);
  const [isDraggingIdCard, setIsDraggingIdCard] = useState(false);
  
  const [businessRegFile, setBusinessRegFile] = useState<string | null>(null);
  const [businessRegProgress, setBusinessRegProgress] = useState<number | null>(null);
  const [isDraggingBusinessReg, setIsDraggingBusinessReg] = useState(false);

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
  const [ticketTiers, setTicketTiers] = useState([{ id: 1, name: '', price: '', quantity: '', saleStartDate: '', saleStartTime: '', saleEndDate: '', saleEndTime: '' }]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [enableCoupons, setEnableCoupons] = useState(false);
  
  const [hasSeating, setHasSeating] = useState(false);
  const [zoneImage, setZoneImage] = useState<string | null>(null);
  const [zoneImageProgress, setZoneImageProgress] = useState<number | null>(null);
  const [isDraggingZoneImage, setIsDraggingZoneImage] = useState(false);

  const [hasTimeSelection, setHasTimeSelection] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<{ date: string, startTime: string, endTime: string }[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [flexTimeStart, setFlexTimeStart] = useState('09:00');
  const [flexTimeEnd, setFlexTimeEnd] = useState('17:00');

  // Step 4 state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Rich Text Editor state
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [plusButtonPos, setPlusButtonPos] = useState<{ top: number; left: number } | null>(null);
  const [selectionMenuPos, setSelectionMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedSelectionRange, setSavedSelectionRange] = useState<Range | null>(null);
  
  const showLinkInputRef = useRef(false);
  useEffect(() => {
    showLinkInputRef.current = showLinkInput;
  }, [showLinkInput]);

  const updateSelectionMenuPosition = React.useCallback(() => {
    if (showLinkInputRef.current) return;
    if (!editorRef.current) {
      setSelectionMenuPos(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelectionMenuPos(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect && rect.width > 0) {
      setSelectionMenuPos({
        top: Math.max(0, rect.top - 48), // 48px above the selection in viewport
        left: rect.left + (rect.width / 2) - 100 // roughly center
      });
    } else {
      setSelectionMenuPos(null);
    }
  }, []);

  const updatePlusButtonPosition = React.useCallback(() => {
    if (!editorRef.current) {
      setPlusButtonPos(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setPlusButtonPos(null);
      return;
    }

    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    let blockEl: HTMLElement | null = node as HTMLElement;
    while (
      blockEl &&
      blockEl !== editorRef.current &&
      !['P', 'H1', 'H2', 'H3', 'DIV', 'LI', 'BLOCKQUOTE'].includes(blockEl.tagName)
    ) {
      blockEl = blockEl.parentElement;
    }

    const containerEl = editorRef.current.parentElement;
    if (!containerEl) {
      setPlusButtonPos(null);
      return;
    }

    const containerBounds = containerEl.getBoundingClientRect();

    if (!blockEl || blockEl === editorRef.current || !editorRef.current.contains(blockEl)) {
      const text = editorRef.current.innerText.replace(/\u8203|\u200B/g, '').trim();
      if (text === '') {
        const editorBounds = editorRef.current.getBoundingClientRect();
        setPlusButtonPos({
          top: editorBounds.top - containerBounds.top + 16,
          left: 16
        });
      } else {
        setPlusButtonPos(null);
      }
      return;
    }

    const text = blockEl.textContent?.replace(/\u8203|\u200B/g, '').trim() || '';
    if (text === '') {
      const blockBounds = blockEl.getBoundingClientRect();
      setPlusButtonPos({
        top: Math.max(12, blockBounds.top - containerBounds.top + (blockBounds.height > 0 ? (blockBounds.height - 28) / 2 : 2)),
        left: 16
      });
    } else {
      setPlusButtonPos(null);
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current || editorRef.current?.contains(document.activeElement)) {
        updatePlusButtonPosition();
        updateSelectionMenuPosition();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updatePlusButtonPosition, updateSelectionMenuPosition]);
  
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageRect, setImageRect] = useState<{top: number, left: number, width: number, height: number} | null>(null);

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
        if ((e.target as HTMLElement).style.cursor === 'nwse-resize') return;
        setSelectedImage(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [selectedImage]);

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'IMG') {
      setSelectedImage(e.target as HTMLImageElement);
      setTimeout(updateImageRect, 10);
    } else {
      setSelectedImage(null);
    }
    setTimeout(updatePlusButtonPosition, 10);
  };

  const handleEditorInput = () => {
    if (selectedImage && !document.body.contains(selectedImage)) {
      setSelectedImage(null);
    } else {
      setTimeout(updateImageRect, 10);
    }
    updatePlusButtonPosition();
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedImage) return;

    const startX = e.clientX;
    const startWidth = selectedImage.offsetWidth;
    const startHeight = selectedImage.offsetHeight;
    const ratio = startHeight / startWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      const newHeight = newWidth * ratio;
      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = `${newHeight}px`;
      updateImageRect();
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
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
        setEditorContent(editorRef.current.innerHTML);
      }
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
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

  const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      
      // Update caret position to drop point
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range) {
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }

      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
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
    } else {
      // It's a native drag of an existing element inside the editor. Let the browser handle it.
      setTimeout(updateImageRect, 50);
    }
  };

  useEffect(() => {
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
        if (parsed.activeStep) setActiveStep(parsed.activeStep);
        if (parsed.showRemainingTickets !== undefined) setShowRemainingTickets(parsed.showRemainingTickets);
        if (parsed.allowRefunds !== undefined) setAllowRefunds(parsed.allowRefunds);
        if (parsed.maxTickets) setMaxTickets(parsed.maxTickets);
        if (parsed.enableCountdown !== undefined) setEnableCountdown(parsed.enableCountdown);
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
        if (parsed.idCardFile) setIdCardFile(parsed.idCardFile);
        if (parsed.businessRegFile) setBusinessRegFile(parsed.businessRegFile);
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

  useEffect(() => {
    if (activeStep === 1 && editorRef.current && editorContent !== null) {
      editorRef.current.innerHTML = editorContent;
    }
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
      activeStep,
      showRemainingTickets,
      allowRefunds,
      maxTickets,
      enableCountdown,
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
      idCardFile,
      businessRegFile,
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

  const simulateUpload = (file: File, setImage: (val: string) => void, setProgress: (val: number | null) => void) => {
    if (file.type.startsWith('image/')) {
      setProgress(0);
      const reader = new FileReader();
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setProgress(progress);
      }, 200);

      reader.onload = (event) => {
        if (event.target?.result) {
          const checkProgress = setInterval(() => {
            if (progress >= 100) {
              clearInterval(checkProgress);
              setImage(event.target.result as string);
              setProgress(null);
            }
          }, 100);
        }
      };
      reader.readAsDataURL(file as File);
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

  const handleGalleryFilesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 10 - galleryImages.length;
    if (remainingSlots <= 0) {
      alert(lang === 'lo' ? 'ເພີ່ມຮູບສະໄລ້ໄດ້ສູງສຸດ 10 ຮູບ' : 'Maximum 10 slideshow images allowed');
      return;
    }
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setGalleryUploadProgress(10);
    
    let processed = 0;
    const newUrls: string[] = [];
    
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newUrls.push(event.target.result.toString());
        }
        processed++;
        setGalleryUploadProgress((processed / filesToProcess.length) * 100);
        
        if (processed === filesToProcess.length) {
          setTimeout(() => {
            setGalleryImages(prev => {
              const updated = [...prev, ...newUrls].slice(0, 10);
              if (!horizontalImage && !verticalImage && updated.length > 0) {
                setHorizontalImage(updated[0]);
                setVerticalImage(updated[0]);
              }
              return updated;
            });
            setGalleryUploadProgress(null);
          }, 300);
        }
      };
      reader.readAsDataURL(file as File);
    });
    
    e.target.value = '';
  };

  const handleGalleryDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingGallery(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 10 - galleryImages.length;
    if (remainingSlots <= 0) {
      alert(lang === 'lo' ? 'ເພີ່ມຮູບສະໄລ້ໄດ້ສູງສຸດ 10 ຮູບ' : 'Maximum 10 slideshow images allowed');
      return;
    }
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setGalleryUploadProgress(10);
    
    let processed = 0;
    const newUrls: string[] = [];
    
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newUrls.push(event.target.result.toString());
        }
        processed++;
        setGalleryUploadProgress((processed / filesToProcess.length) * 100);
        
        if (processed === filesToProcess.length) {
          setTimeout(() => {
            setGalleryImages(prev => {
              const updated = [...prev, ...newUrls].slice(0, 10);
              if (!horizontalImage && !verticalImage && updated.length > 0) {
                setHorizontalImage(updated[0]);
                setVerticalImage(updated[0]);
              }
              return updated;
            });
            setGalleryUploadProgress(null);
          }, 300);
        }
      };
      reader.readAsDataURL(file as File);
    });
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

  const generateTestCoupons = () => {
    const testCoupons = [
      { id: Date.now(), code: 'PASOPKAN10', discount: '10', type: 'percentage', maxUses: '100', validFrom: '2026-05-01', validUntil: '2026-12-31', isActive: true },
      { id: Date.now() + 1, code: 'WELCOME2026', discount: '50000', type: 'fixed', maxUses: '50', validFrom: '2026-01-01', validUntil: '2026-12-31', isActive: true },
      { id: Date.now() + 2, code: 'EARLYBIRD', discount: '15', type: 'percentage', maxUses: '20', validFrom: '2026-05-01', validUntil: '2026-06-01', isActive: false },
    ];
    setCoupons(testCoupons);
    setEnableCoupons(true);
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
    setDateType('fixed');
    setFlexibleDateDesc('');
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
    // Event name validation for Step 1
    if (activeStep === 1 || activeStep === 5) {
      if (!eventName.trim()) {
        setValidationError(lang === 'lo' ? 'ກະລຸນາປ້ອນຊື່ກິດຈະກຳ' : 'Please enter the event name.');
        setActiveStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!organizerName.trim() || !organizerPhone.trim() || !organizerEmail.trim() || !organizerInfo.trim()) {
        setValidationError(
          lang === 'lo'
            ? 'ກະລຸນາປ້ອນຂໍ້ມູນຜູ້ຈັດງານໃຫ້ຄົບຖ້ວນທຸກຊ່ອງ (ຊື່ຜູ້ຈັດງານ, ເບີໂທ, ອີເມວ, ແລະ ກ່ຽວກັບຜູ້ຈັດງານ)'
            : 'Please fill in all organizer information fields (Organizer Name, Phone, Email, and Bio).'
        );
        setActiveStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setValidationError(null);
    }

    // Payment Info validation for Step 5
    if (activeStep === 5) {
      if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
        setValidationError(
          lang === 'lo'
            ? 'ກະລຸນາປ້ອນຂໍ້ມູນບັນຊີທະນາຄານໃຫ້ຄົບຖ້ວນທຸກຊ່ອງ (ຊື່ທະນາຄານ, ເລກບັນຊີ, ແລະ ຊື່ເຈົ້າຂອງບັນຊີ)'
            : 'Please fill in all payment/bank details (Bank Name, Account Number, and Account Holder).'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setValidationError(null);
    }

    // 14-day validation for Event creation
    if ((activeStep === 3 || activeStep === 5) && dateType !== 'flexible') {
      if (!startDate) {
        setValidationError(lang === 'lo' ? 'ກະລຸນາເລືອກວັນທີເລີ່ມຕົ້ນ' : 'Please select a start date.');
        setActiveStep(3);
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const eventDate = new Date(startDate);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 14) {
        setValidationError(t.dateValidationError);
        setActiveStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else {
        setValidationError(null);
      }
    }

    let finalDescription = editorContent || '';
    if (activeStep === 1 && editorRef.current) {
      finalDescription = editorRef.current.innerHTML;
      setEditorContent(finalDescription);
    }

    setIsLoading(true);
    // Simulate API call / form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    if (activeStep < 5) {
      setActiveStep(activeStep + 1);
    } else {
      // Save payment info for organizer so they don't have to enter it again
      const paymentData = {
        bankName: bankName || 'BCEL',
        accountNumber: accountNumber || '160-12-00001234-001',
        accountHolder: accountHolder || 'LAO EVENT ORGANIZER CO., LTD',
      };
      safeStorage.setItem('organizer_payment_info', JSON.stringify(paymentData));

      if (editingEventId) {
        setWasEditing(true);
        // Update existing event
        const updatedEvents = localEvents.map(evt => {
          if (evt.id === editingEventId) {
            return {
              ...evt,
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
              eventType,
              onlinePlatform,
              onlineMeetingUrl,
              onlinePasscode,
              onlineInstructions,
              dateType,
              flexibleDateDesc,
              date: startDate,
              time: startTime,
              endDate,
              endTime,
              durationEn,
              durationLo,
              languages: selectedLanguages,
              ticketTiers: ticketTiers.map(tier => ({
                id: tier.id ? String(tier.id) : String(Math.random()),
                name: tier.name,
                price: Number(String(tier.price).replace(/,/g, '')) || 0,
                available: Number(String(tier.quantity).replace(/,/g, '')) || 100,
                description: tier.name + ' Access',
              })),
              coupons,
              hasSeating: dateType === 'flexible' ? false : hasSeating,
              zoneImage: dateType === 'flexible' ? null : zoneImage,
              hasTimeSelection: dateType === 'flexible',
              timeSlots: dateType === 'flexible' ? timeSlots : [],
              availableDates: dateType === 'flexible' ? availableDates : [],
              image: verticalImage || horizontalImage || evt.image,
              exampleImages: galleryImages.length > 0 ? galleryImages : (verticalImage ? [verticalImage] : []),
              description: finalDescription || evt.description || (eventName + ' description'),
              cancellationPolicy,
              showRemainingTickets,
              allowRefunds,
              allowReviews,
              maxTickets,
              enableCountdown,
              eventPrivacy,
              attendeeMessage,
              status: eventStatus || 'active',
            };
          }
          return evt;
        });
        setLocalEvents(updatedEvents);
        safeStorage.setItem('organizer_events', JSON.stringify(updatedEvents));
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
          eventType,
          onlinePlatform,
          onlineMeetingUrl,
          onlinePasscode,
          onlineInstructions,
          dateType,
          flexibleDateDesc,
          date: startDate,
          time: startTime,
          endDate,
          endTime,
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
          hasSeating: dateType === 'flexible' ? false : hasSeating,
          zoneImage: dateType === 'flexible' ? null : zoneImage,
          hasTimeSelection: dateType === 'flexible',
          timeSlots: dateType === 'flexible' ? timeSlots : [],
          availableDates: dateType === 'flexible' ? availableDates : [],
          image: verticalImage || horizontalImage || 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=2000&auto=format&fit=crop',
          exampleImages: galleryImages.length > 0 ? galleryImages : (verticalImage ? [verticalImage] : []),
          description: finalDescription || (eventName + ' description'),
          cancellationPolicy,
          showRemainingTickets,
          allowRefunds,
          allowReviews,
          maxTickets,
          enableCountdown,
          eventPrivacy,
          attendeeMessage,
          status: eventStatus || 'active',
        };
        const updatedEvents = [newEvent, ...localEvents];
        setLocalEvents(updatedEvents);
        safeStorage.setItem('organizer_events', JSON.stringify(updatedEvents));
      }
      // Clear draft and show success modal
      safeStorage.removeItem('eventDraft');
      setShowSuccessModal(true);
    }
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
            onClick={() => setActiveTab('myEvents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'myEvents' ? 'bg-adv-orange/10 text-adv-orange font-bold' : 'text-gray-500 hover:text-adv-slate hover:bg-gray-50'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium text-sm">{t.myEvents}</span>
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
                    </button>
                    <button 
                      onClick={() => setActiveStep(2)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 2 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 2 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>2</div>
                      <span className={`text-sm font-bold ${activeStep === 2 ? 'text-adv-slate' : 'text-gray-400'}`}>{lang === 'lo' ? 'ຄຳຖາມ' : 'Questions'}</span>
                    </button>
                    <button 
                      onClick={() => setActiveStep(3)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 3 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 3 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>3</div>
                      <span className={`text-sm font-bold ${activeStep === 3 ? 'text-adv-slate' : 'text-gray-400'}`}>{t.step2}</span>
                    </button>
                    <button 
                      onClick={() => setActiveStep(4)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 4 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 4 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>4</div>
                      <span className={`text-sm font-bold ${activeStep === 4 ? 'text-adv-slate' : 'text-gray-400'}`}>{t.step3}</span>
                    </button>
                    <button 
                      onClick={() => setActiveStep(5)}
                      className={`flex-1 pb-4 flex items-center justify-center gap-2 transition-colors ${activeStep === 5 ? 'border-b-2 border-adv-orange translate-y-[1px]' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 5 ? 'bg-adv-orange text-white' : 'bg-gray-100 text-gray-500'}`}>5</div>
                      <span className={`text-sm font-bold ${activeStep === 5 ? 'text-adv-slate' : 'text-gray-400'}`}>{t.step4}</span>
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
                      {activeStep === 5 ? t.publish : t.continue}
                    </button>
                  </div>
                </div>

            {/* Form Container */}
            <div className="space-y-6">
              {activeStep === 1 && (
                <>
                  {/* Event Name */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
                        className="w-full bg-white text-adv-slate border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all placeholder:text-gray-300 font-bold shadow-inner"
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

                      {/* Image Count Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-center bg-orange-50 text-adv-orange px-3.5 py-1.5 rounded-xl border border-orange-100 font-bold text-xs">
                        <ImageIcon className="w-4 h-4 text-adv-orange" />
                        <span>
                          {lang === 'lo' ? 'ຮູບສະໄລ້:' : 'Slideshow:'} {galleryImages.length} / 10
                        </span>
                      </div>
                    </div>

                    {/* 1. COVER EVENT IMAGE BOX */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-adv-slate uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-adv-orange" />
                          <span>{lang === 'lo' ? 'ຮູບໜ້າປົກກິດຈະກຳ (Cover Event Image)' : 'Main Event Cover Photo'}</span>
                          <span className="text-adv-orange">*</span>
                        </label>
                        <span className="text-[11px] font-semibold text-gray-400">
                          (1280 x 720 px recommended)
                        </span>
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
                          <>
                            <img 
                              src={horizontalImage || verticalImage || ''} 
                              alt="Main cover preview" 
                              className="absolute inset-0 w-full h-full object-cover" 
                            />
                            {/* Cover Badge */}
                            <div className="absolute top-3 left-3 bg-adv-slate/90 text-white text-[11px] font-extrabold px-3 py-1 rounded-full backdrop-blur-md shadow-md flex items-center gap-1.5 border border-white/20">
                              <Sparkles className="w-3.5 h-3.5 text-adv-orange" />
                              <span>{lang === 'lo' ? 'ຮູບໜ້າປົກຫຼັກ' : 'Main Cover Photo'}</span>
                            </div>

                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); document.getElementById('main-cover-upload')?.click(); }}
                                className="text-white font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl backdrop-blur-md transition-colors text-xs flex items-center gap-1.5 border border-white/30"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                {lang === 'lo' ? 'ປ່ຽນຮູບ' : 'Change Cover'}
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}
                                className="text-white font-bold bg-rose-500/80 hover:bg-rose-600 px-4 py-2 rounded-xl backdrop-blur-md transition-colors text-xs flex items-center gap-1.5 shadow-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {lang === 'lo' ? 'ລຶບ' : 'Remove'}
                              </button>
                            </div>
                          </>
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
                                <div 
                                  key={index} 
                                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group bg-gray-100 shadow-xs ${
                                    isCover ? 'border-adv-orange ring-2 ring-adv-orange/30' : 'border-gray-200/80 hover:border-gray-300'
                                  }`}
                                >
                                  <img 
                                    src={imgUrl} 
                                    alt={`Slide ${index + 1}`} 
                                    className="w-full h-full object-cover" 
                                  />

                                  {/* Slide Badge */}
                                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                                    #{index + 1}
                                  </div>

                                  {/* Is Cover Indicator */}
                                  {isCover && (
                                    <div className="absolute top-2 right-2 bg-adv-orange text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>Cover</span>
                                    </div>
                                  )}

                                  {/* Overlay Controls */}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-center">
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
                                </div>
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
                    <div>
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
                          className="w-full bg-white text-adv-slate border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all placeholder:text-gray-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
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
                      <div>
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
                            <div className="md:col-span-2">
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
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <option value="Concert">{t.concert}</option>
                        <option value="Sports">{t.sports}</option>
                        <option value="Workshop">{t.workshop}</option>
                        <option value="Voucher">{t.voucher}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-adv-orange" />
                      <span className="text-adv-slate font-bold text-sm">
                        {lang === 'lo' ? 'ໄລຍະເວລາຈັດງານ / Duration' : 'Event Duration'}
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={durationEn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDurationEn(val);
                          
                          // Map to Lao equivalent for durationLo
                          const loMapping: Record<string, string> = {
                            '30 Minutes': '30 ນາທີ',
                            '1 Hour': '1 ຊົ່ວໂມງ',
                            '1.5 Hours': '1.5 ຊົ່ວໂມງ',
                            '2 Hours': '2 ຊົ່ວໂມງ',
                            '2.5 Hours': '2.5 ຊົ່ວໂມງ',
                            '3 Hours': '3 ຊົ່ວໂມງ',
                            '4 Hours': '4 ຊົ່ວໂມງ',
                            '5 Hours': '5 ຊົ່ວໂມງ',
                            '6 Hours': '6 ຊົ່ວໂມງ',
                            'Half Day': 'ເຄິ່ງມື້',
                            'Full Day': 'ເຕັມມື້',
                            '2 Days': '2 ມື້',
                            '3 Days': '3 ມື້',
                            '1 Week': '1 ອາທິດ'
                          };
                          setDurationLo(loMapping[val] || val);
                        }}
                        className="w-full bg-white text-adv-slate border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="" disabled>{lang === 'lo' ? 'ເລືອກໄລຍະເວລາ' : 'Select Duration'}</option>
                        <option value="30 Minutes">{lang === 'lo' ? '30 ນາທີ' : '30 Minutes'}</option>
                        <option value="1 Hour">{lang === 'lo' ? '1 ຊົ່ວໂມງ' : '1 Hour'}</option>
                        <option value="1.5 Hours">{lang === 'lo' ? '1.5 ຊົ່ວໂມງ' : '1.5 Hours'}</option>
                        <option value="2 Hours">{lang === 'lo' ? '2 ຊົ່ວໂມງ' : '2 Hours'}</option>
                        <option value="2.5 Hours">{lang === 'lo' ? '2.5 ຊົ່ວໂມງ' : '2.5 Hours'}</option>
                        <option value="3 Hours">{lang === 'lo' ? '3 ຊົ່ວໂມງ' : '3 Hours'}</option>
                        <option value="4 Hours">{lang === 'lo' ? '4 ຊົ່ວໂມງ' : '4 Hours'}</option>
                        <option value="5 Hours">{lang === 'lo' ? '5 ຊົ່ວໂມງ' : '5 Hours'}</option>
                        <option value="6 Hours">{lang === 'lo' ? '6 ຊົ່ວໂມງ' : '6 Hours'}</option>
                        <option value="Half Day">{lang === 'lo' ? 'ເຄິ່ງມື້' : 'Half Day'}</option>
                        <option value="Full Day">{lang === 'lo' ? 'ເຕັມມື້' : 'Full Day'}</option>
                        <option value="2 Days">{lang === 'lo' ? '2 ມື້' : '2 Days'}</option>
                        <option value="3 Days">{lang === 'lo' ? '3 ມື້' : '3 Days'}</option>
                        <option value="1 Week">{lang === 'lo' ? '1 ອາທິດ' : '1 Week'}</option>
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
                
                <div className="border border-gray-200 rounded-xl bg-white shadow-sm relative focus-within:ring-2 focus-within:ring-adv-orange/20 focus-within:border-adv-orange transition-all">
                  <div className="p-4 relative">
                    {/* Floating Inline Luma-style + Button on Empty Paragraphs */}
                    {plusButtonPos && (
                      <div
                        style={{ top: `${plusButtonPos.top}px`, left: `${plusButtonPos.left}px` }}
                        className="absolute z-20 flex items-center gap-2 pointer-events-auto transition-all duration-150"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowBlockMenu(!showBlockMenu);
                          }}
                          className="w-6 h-6 rounded-md bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer font-bold border border-gray-200 shadow-sm"
                          title="Add block"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span
                          onClick={() => setShowBlockMenu(true)}
                          className="text-gray-400 hover:text-gray-600 text-sm font-medium cursor-pointer select-none transition-colors"
                        >
                          {lang === 'lo' ? 'ໃຜຄວນມາຮ່ວມ? ງານນີ້ກ່ຽວກັບຫຍັງ?' : "Who should come? What's the event about?"}
                        </span>
                      </div>
                    )}

                    {/* Block Selection Menu Dropdown */}
                    {showBlockMenu && (
                      <div 
                        ref={blockMenuRef}
                        style={{
                          top: `${(plusButtonPos?.top || 12) + 32}px`,
                          left: `${plusButtonPos?.left || 16}px`
                        }}
                        className="absolute z-50 w-72 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 p-2 animate-in fade-in zoom-in-95 duration-150"
                      >
                        {/* Search Box */}
                        <div className="relative mb-2 px-1 pt-1">
                          <input
                            type="text"
                            placeholder="Search"
                            value={blockSearchQuery}
                            onChange={(e) => setBlockSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 text-sm text-gray-800 px-3 py-2 rounded-lg border border-gray-200 outline-none placeholder:text-gray-400 focus:border-adv-orange focus:ring-1 focus:ring-adv-orange transition-all"
                            autoFocus
                          />
                        </div>

                        <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {[
                            { id: 'h1', label: 'Heading', icon: Heading1 },
                            { id: 'h2', label: 'Subheading', icon: Heading2 },
                            { id: 'attachment', label: 'Image', icon: ImageIcon },
                            { id: 'blockquote', label: 'Blockquote', icon: Quote },
                            { id: 'divider', label: 'Divider', icon: Minus },
                            { id: 'list', label: 'List', icon: List },
                            { id: 'numbered_list', label: 'Numbered List', icon: ListOrdered },
                            { id: 'attachment_doc', label: 'Attachment', icon: Paperclip },
                          ]
                            .filter(item => item.label.toLowerCase().includes(blockSearchQuery.toLowerCase()))
                            .map((item) => {
                              const IconComp = item.icon;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleInsertBlock(item.id)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 flex items-center transition-colors cursor-pointer group gap-3"
                                >
                                  <div className="text-gray-400 group-hover:text-gray-600">
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <span className="text-sm font-medium">{item.label}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    
                    {/* Formatting Selection Menu */}
                    {selectionMenuPos && (
                      <div
                        style={{
                          top: `${selectionMenuPos.top}px`,
                          left: `${selectionMenuPos.left}px`,
                        }}
                        className="fixed z-[100] flex items-center bg-[#1C1C1E] text-zinc-300 rounded-xl shadow-2xl border border-white/10 px-2 py-2 animate-in fade-in zoom-in-95 duration-150 gap-1"
                        onMouseDown={(e) => {
                          if (!showLinkInput) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {showLinkInput ? (
                          <div className="flex items-center gap-2 px-1 w-64" onMouseDown={(e) => e.stopPropagation()}>
                            <input
                              type="url"
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (linkUrl && savedSelectionRange) {
                                    const sel = window.getSelection();
                                    sel?.removeAllRanges();
                                    sel?.addRange(savedSelectionRange);
                                    execCommand('createLink', linkUrl);
                                  }
                                  setShowLinkInput(false);
                                  setLinkUrl('');
                                  setSavedSelectionRange(null);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setShowLinkInput(false);
                                  setLinkUrl('');
                                  setSavedSelectionRange(null);
                                }
                              }}
                              placeholder="Enter link URL"
                              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none border-none py-1"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (linkUrl && savedSelectionRange) {
                                  const sel = window.getSelection();
                                  sel?.removeAllRanges();
                                  sel?.addRange(savedSelectionRange);
                                  execCommand('createLink', linkUrl);
                                }
                                setShowLinkInput(false);
                                setLinkUrl('');
                                setSavedSelectionRange(null);
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowLinkInput(false);
                                setLinkUrl('');
                                setSavedSelectionRange(null);
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => execCommand('formatBlock', 'H2')}
                              className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-semibold"
                              title="Heading 1"
                            >
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('formatBlock', 'H3')}
                              className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-semibold"
                              title="Heading 2"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('bold')}
                              className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-bold text-lg"
                              title="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => execCommand('italic')}
                              className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-serif italic text-lg"
                              title="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                const sel = window.getSelection();
                                if (!sel || sel.rangeCount === 0) return;
                                setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
                                setShowLinkInput(true);
                                setLinkUrl('');
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                              title="Link"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  execCommand('formatBlock', 'blockquote');
                                } catch (e) {
                                  execCommand('formatBlock', 'BLOCKQUOTE');
                                }
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-serif text-lg leading-none pt-1"
                              title="Blockquote"
                            >
                              &rdquo;
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Editor Area */}
                    <div 
                      ref={editorRef}
                      contentEditable
                      onClick={handleEditorClick}
                      onInput={handleEditorInput}
                      onKeyUp={handleEditorInput}
                      onScroll={() => setTimeout(updateImageRect, 10)}
                      onDrop={handleEditorDrop}
                      onDragOver={(e) => {
                        if (e.dataTransfer?.types?.includes('Files')) {
                          e.preventDefault();
                        }
                      }}
                      className="min-h-[300px] text-base text-gray-800 outline-none rich-text max-w-none prose prose-sm prose-slate"
                      suppressContentEditableWarning
                    >
                      <p className="font-bold mb-2">{t.intro}</p>
                      <p className="mb-4 text-gray-400">{t.introPlaceholder}</p>
                      
                      <p className="font-bold mb-2">{t.details}</p>
                      <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-600">
                        <li><strong>{t.mainProgram}</strong> {t.mainProgramDesc}</li>
                        <li><strong>{t.guests}</strong> {t.guestsDesc}</li>
                        <li><strong>{t.specialExperience}</strong> {t.specialExperienceDesc}</li>
                      </ul>

                      <p className="font-bold mb-2">{t.termsAndConditions}</p>
                      <p className="mb-2 text-gray-600">{t.tncEvent}</p>
                      <p className="mb-2 text-gray-600">{t.childTerms}</p>
                      <p className="text-gray-600">{t.vatTerms}</p>
                    </div>

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
                        <div 
                          style={{
                            position: 'absolute',
                            right: -6,
                            bottom: -6,
                            width: 12,
                            height: 12,
                            backgroundColor: '#FF5B00',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            pointerEvents: 'auto'
                          }}
                          onMouseDown={startResize}
                        />
                        <button
                          type="button"
                          onMouseDown={deleteSelectedImage}
                          style={{
                            position: 'absolute',
                            top: -12,
                            right: -12,
                            pointerEvents: 'auto'
                          }}
                          className="w-8 h-8 bg-white border border-gray-200 text-rose-500 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title={lang === 'lo' ? 'ລຶບຮູບ' : 'Delete image'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Organizer Info & KYC */}
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
                    <div>
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
                      <div>
                        <label className="flex items-center gap-1 mb-1.5 text-xs font-bold text-adv-slate">
                          {lang === 'en' ? 'Organizer Phone' : 'ເບີໂທຜູ້ຈັດງານ'} <span className="text-adv-orange">*</span>
                        </label>
                        <input 
                          type="tel"
                          value={organizerPhone}
                          onChange={(e) => {
                            setOrganizerPhone(e.target.value);
                            setValidationError(null);
                          }}
                          placeholder="+856 20 ..."
                          className="w-full bg-gray-50/80 border border-gray-200 text-adv-slate rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all placeholder:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1 mb-1.5 text-xs font-bold text-adv-slate">
                          {lang === 'en' ? 'Organizer Email' : 'ອີເມວຜູ້ຈັດງານ'} <span className="text-adv-orange">*</span>
                        </label>
                        <input 
                          type="email"
                          value={organizerEmail}
                          onChange={(e) => {
                            setOrganizerEmail(e.target.value);
                            setValidationError(null);
                          }}
                          placeholder="organizer@domain.com"
                          className="w-full bg-gray-50/80 border border-gray-200 text-adv-slate rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all placeholder:text-gray-300"
                        />
                      </div>
                    </div>

                    {/* About Organizer / Bio */}
                    <div>
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

                    {/* Organizer Social Links */}
                    <div className="pt-1">
                      <SocialLinksForm
                        value={organizerSocialLinks}
                        onChange={(links) => setOrganizerSocialLinks(links)}
                        lang={lang}
                        theme="light"
                        compact={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
              </>
              )}

              {activeStep === 2 && (
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['First Name', 'Last Name', 'Phone Number', 'Email'].map((field, i) => (
                        <div key={i} className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm font-medium text-gray-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-adv-orange/70" />
                          {lang === 'lo' ? ['ຊື່', 'ນາມສະກຸນ', 'ເບີໂທລະສັບ', 'ອີເມວ'][i] : field}
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
                      {attendeeQuestions.map((q, idx) => (
                        <div key={q.id} className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4 relative group">
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...attendeeQuestions];
                              next.splice(idx, 1);
                              setAttendeeQuestions(next);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-10">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                {lang === 'lo' ? 'ປະເພດຄຳຖາມ' : 'Question Type'}
                              </label>
                              <div className="relative">
                                <select
                                  value={q.type}
                                  onChange={(e) => {
                                    const next = [...attendeeQuestions];
                                    next[idx].type = e.target.value as any;
                                    if (e.target.value === 'dropdown' || e.target.value === 'radio') {
                                      next[idx].options = ['Option 1'];
                                    } else {
                                      delete next[idx].options;
                                    }
                                    setAttendeeQuestions(next);
                                  }}
                                  className="w-full bg-gray-50 border border-gray-200 text-adv-slate rounded-xl px-4 py-2.5 text-sm font-semibold appearance-none focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all pr-10"
                                >
                                  <option value="text">{lang === 'lo' ? 'ຂໍ້ຄວາມສັ້ນ (Text)' : 'Short Text'}</option>
                                  <option value="dropdown">{lang === 'lo' ? 'ເລືອກແບບເລື່ອນລົງ (Dropdown)' : 'Dropdown'}</option>
                                  <option value="radio">{lang === 'lo' ? 'ເລືອກຂໍ້ດຽວ (Radio Options)' : 'Radio Options'}</option>
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
                          
                          {(q.type === 'dropdown' || q.type === 'radio') && (
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 3 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-8">
                  <h3 className="text-xl font-bold text-adv-slate mb-2">{t.step2}</h3>
                  
                  <AnimatePresence>
                    {validationError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-rose-800 text-sm font-semibold"
                      >
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                        <div>{validationError}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-6">
                    {/* Date Type Selection */}
                    <div className="flex gap-2 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/60 w-fit">
                      <button 
                        type="button"
                        onClick={() => setDateType('fixed')}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                          dateType === 'fixed' 
                            ? 'bg-white text-adv-orange shadow-sm' 
                            : 'text-gray-500 hover:text-adv-slate'
                        }`}
                      >
                        {t.fixedDate}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDateType('flexible')}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                          dateType === 'flexible' 
                            ? 'bg-white text-adv-orange shadow-sm' 
                            : 'text-gray-500 hover:text-adv-slate'
                        }`}
                      >
                        {t.flexibleDate}
                      </button>
                    </div>

                    {/* Fixed Date & Time Configuration */}
                    {dateType !== 'flexible' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Start Date & Start Time Box */}
                          <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
                            <span className="text-xs font-extrabold text-adv-slate uppercase tracking-wider flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-adv-orange" />
                              {lang === 'lo' ? 'ວັນທີ ແລະ ເວລາເລີ່ມ' : 'Start Date & Time'}
                              <span className="text-adv-orange">*</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">{t.startDate}</label>
                                <CalendarPicker 
                                  value={startDate}
                                  onChange={(date) => {
                                    setStartDate(date);
                                    setValidationError(null);
                                  }}
                                  lang={lang}
                                  theme="light"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">{t.startTime}</label>
                                <ScrollTimePicker 
                                  value={startTime}
                                  onChange={(val) => setStartTime(val)}
                                  placeholder="09:00"
                                />
                              </div>
                            </div>
                          </div>

                          {/* End Date & End Time Box */}
                          <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
                            <span className="text-xs font-extrabold text-adv-slate uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-adv-orange" />
                              {lang === 'lo' ? 'ວັນທີ ແລະ ເວລາສິ້ນສຸດ' : 'End Date & Time'}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">{t.endDate}</label>
                                <CalendarPicker 
                                  value={endDate}
                                  onChange={(date) => setEndDate(date)}
                                  lang={lang}
                                  theme="light"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">{t.endTime}</label>
                                <ScrollTimePicker 
                                  value={endTime}
                                  onChange={(val) => setEndTime(val)}
                                  placeholder="17:00"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Operating Time Slots Configuration for Flexible Date */}
                    {dateType === "flexible" && (
                      <motion.div 
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
                    {/* Zone Seating feature */}
                    {dateType !== 'flexible' && (
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
                                <>
                                  <img src={zoneImage} alt="Seating map preview" className="absolute inset-0 w-full h-full object-contain bg-gray-50" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
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
                                </>
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
                    )}

                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-adv-slate">{t.ticketTiers}</h4>
                        <button 
                          onClick={() => setTicketTiers([...ticketTiers, { id: Date.now(), name: '', price: '', quantity: '', saleStartDate: '', saleStartTime: '', saleEndDate: '', saleEndTime: '' }])}
                          className="flex items-center gap-2 text-adv-orange hover:text-orange-600 text-sm font-bold"
                        >
                          <Plus className="w-4 h-4" />
                          {t.addTier}
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {ticketTiers.map((tier, index) => (
                          <div key={tier.id} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 relative shadow-sm">
                            <div className="flex-1">
                              <label className="block text-xs font-bold text-gray-500 mb-1">{t.tierName}</label>
                              <input 
                                type="text" 
                                value={tier.name}
                                onChange={(e) => {
                                  const newTiers = [...ticketTiers];
                                  newTiers[index].name = e.target.value;
                                  setTicketTiers(newTiers);
                                }}
                                placeholder={t.tierNamePlaceholder}
                                className="w-full bg-white border border-gray-200 text-adv-slate rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all"
                              />
                            </div>
                            <div className="w-full md:w-36">
                              <label className="block text-xs font-bold text-gray-500 mb-1">{t.priceWithCurrency}</label>
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
                                className="w-full bg-white border border-gray-200 text-adv-slate rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all"
                              />
                            </div>
                            <div className="w-full md:w-32">
                              <label className="block text-xs font-bold text-gray-500 mb-1">{t.quantity}</label>
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
                                className="w-full bg-white border border-gray-200 text-adv-slate rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all"
                              />
                            </div>
                            <div className="w-full md:w-32">
                              <label className="block text-xs font-bold text-gray-500 mb-1">{t.saleStarts}</label>
                              <input 
                                type="date" 
                                value={tier.saleStartDate || ''}
                                onChange={(e) => {
                                  const newTiers = [...ticketTiers];
                                  newTiers[index].saleStartDate = e.target.value;
                                  setTicketTiers(newTiers);
                                }}
                                className="w-full bg-white border border-gray-200 text-adv-slate rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-adv-orange"
                              />
                            </div>
                            <div className="w-full md:w-32">
                              <label className="block text-xs font-bold text-gray-500 mb-1">{t.saleEndsOptional}</label>
                              <input 
                                type="date" 
                                value={tier.saleEndDate || ''}
                                onChange={(e) => {
                                  const newTiers = [...ticketTiers];
                                  newTiers[index].saleEndDate = e.target.value;
                                  setTicketTiers(newTiers);
                                }}
                                className="w-full bg-white border border-gray-200 text-adv-slate rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-adv-orange"
                              />
                            </div>
                            {ticketTiers.length > 1 && (
                              <button 
                                onClick={() => setTicketTiers(ticketTiers.filter((_, i) => i !== index))}
                                className="absolute top-2 right-2 md:static md:mt-6 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
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
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-6 overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-adv-slate">{t.couponsDiscounts}</h4>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={generateTestCoupons}
                                className="flex items-center gap-2 text-gray-500 hover:text-adv-slate text-sm font-bold bg-gray-100 px-4 py-2 rounded-xl transition-colors"
                              >
                                {lang === 'en' ? 'Generate Test' : 'ສ້າງຊຸດທົດລອງ'}
                              </button>
                              <button 
                                onClick={() => setCoupons([...coupons, { id: Date.now(), code: '', discount: '', type: 'percentage', maxUses: '', validFrom: '', validUntil: '', isActive: true }])}
                                className="flex items-center gap-2 text-adv-orange hover:text-orange-600 text-sm font-bold bg-adv-orange/5 px-4 py-2 rounded-xl transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                {t.addCoupon}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {coupons.map((coupon, index) => (
                              <div key={coupon.id} className="flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 relative shadow-sm hover:shadow-md transition-shadow group">
                                {/* Top row: Code and Status */}
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                  <div className="flex-1 w-full">
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
                                  
                                  <div className="w-full md:w-48">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.couponStatus}</label>
                                    <button
                                      onClick={() => {
                                        const newCoupons = [...coupons];
                                        newCoupons[index].isActive = !newCoupons[index].isActive;
                                        setCoupons(newCoupons);
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-bold ${coupon.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${coupon.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                        {coupon.isActive ? t.active : t.inactive}
                                      </div>
                                      <RefreshCcw className={`w-3.5 h-3.5 transition-transform ${coupon.isActive ? 'rotate-180' : ''}`} />
                                    </button>
                                  </div>
                                </div>

                                {/* Middle row: Discount Type, Amount, Max Uses */}
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.discountType}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].type = 'percentage';
                                          setCoupons(newCoupons);
                                        }}
                                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${coupon.type === 'percentage' ? 'bg-adv-orange text-white border-adv-orange shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                      >
                                        {t.percentage}
                                      </button>
                                      <button
                                        onClick={() => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].type = 'fixed';
                                          setCoupons(newCoupons);
                                        }}
                                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${coupon.type === 'fixed' ? 'bg-adv-orange text-white border-adv-orange shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                      >
                                        {t.fixedAmount}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="w-full md:w-32">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.discount}</label>
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
                                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange"
                                      />
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">
                                        {coupon.type === 'percentage' ? '%' : currency}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="w-full md:w-32">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.maxUses}</label>
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
                                </div>

                                {/* Bottom row: Validity Period */}
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                  <div className="flex-1 w-full grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.validFrom}</label>
                                      <input 
                                        type="date" 
                                        value={coupon.validFrom || ''}
                                        onChange={(e) => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].validFrom = e.target.value;
                                          setCoupons(newCoupons);
                                        }}
                                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-adv-orange"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.validUntil}</label>
                                      <input 
                                        type="date" 
                                        value={coupon.validUntil || ''}
                                        onChange={(e) => {
                                          const newCoupons = [...coupons];
                                          newCoupons[index].validUntil = e.target.value;
                                          setCoupons(newCoupons);
                                        }}
                                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-adv-orange"
                                      />
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => setCoupons(coupons.filter((_, i) => i !== index))}
                                    className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all group-hover:bg-red-50/50"
                                    title={t.remove}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
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
                        onClick={() => setShowRemainingTickets(!showRemainingTickets)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${showRemainingTickets ? 'bg-adv-orange' : 'bg-gray-300'}`}
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



                    {dateType !== 'flexible' && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <h4 className="text-adv-slate font-bold mb-1">{t.enableCountdown}</h4>
                          <p className="text-sm text-gray-500">{t.enableCountdownDesc}</p>
                        </div>
                        <button 
                          onClick={() => setEnableCountdown(!enableCountdown)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${enableCountdown ? 'bg-adv-orange' : 'bg-gray-300'}`}
                          type="button"
                        >
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${enableCountdown ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                        </button>
                      </div>
                    )}



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

              {activeStep === 5 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-adv-slate">{t.paymentInfo}</h3>
                    {(localEvents.length > 0 || !!safeStorage.getItem('organizer_payment_info')) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-extrabold border border-emerald-100">
                        <ShieldCheck className="w-4 h-4" />
                        {lang === 'lo' ? 'ບັນທຶກໄວ້ແລ້ວ' : 'Saved On File'}
                      </span>
                    )}
                  </div>

                  {(localEvents.length > 0 || !!safeStorage.getItem('organizer_payment_info')) && (
                    <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-5 flex items-start gap-3.5 mb-6 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-emerald-950">
                            {lang === 'lo' ? 'ຂໍ້ມູນການຊຳລະເງິນໄດ້ຖືກບັນທຶກໄວ້ແລ້ວ' : 'Payment Information Already Saved'}
                          </h4>
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {lang === 'lo' ? 'ອັດຕະໂນມັດ' : 'Auto-filled'}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium mt-1 leading-relaxed">
                          {lang === 'lo' 
                            ? 'ເນື່ອງຈາກທ່ານເຄີຍສ້າງກິດຈະກຳມາກ່ອນ, ຂໍ້ມູນບັນຊີທະນາຄານຂອງທ່ານໄດ້ຖືກບັນທຶກ ແລະ ເຕີມໃຫ້ອັດຕະໂນມັດ. ທ່ານບໍ່ຈຳເປັນຕ້ອງປ້ອນໃໝ່ ເວັ້ນເສຍແຕ່ຕ້ອງການອັບເດດ.'
                            : 'Because you have already created an event, your payout and bank details are securely saved and auto-filled. You do not need to resubmit them unless you want to update them.'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2">{t.bankName}</label>
                      <input 
                        type="text" 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value.replace(/[0-9]/g, ''))}
                        placeholder={t.bankNamePlaceholder}
                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2">{t.accountHolderName}</label>
                      <input 
                        type="text" 
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value.replace(/[0-9]/g, ''))}
                        placeholder={t.accountHolderPlaceholder}
                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2">{t.accountNumber}</label>
                      <input 
                        type="text" 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder={t.accountNumberPlaceholder}
                        className="w-full bg-white border border-gray-200 text-adv-slate rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-adv-orange/10 focus:border-adv-orange transition-all shadow-inner"
                      />
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
                    {activeStep === 5 ? t.createEvent : t.continue}
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
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
                    onClick={() => { setShowSuccessModal(false); setActiveTab('myEvents'); }}
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
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white border border-gray-100 rounded-[32px] w-full max-w-md p-10 text-center shadow-2xl"
                >
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-amber-100">
                    <ShieldAlert className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-adv-slate mb-4 tracking-tight">{t.editBlocked}</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                    {t.editBlockedDesc}
                  </p>
                  <button
                    onClick={() => setShowEditBlockedModal(false)}
                    className="w-full py-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition-all border border-amber-100 text-lg"
                  >
                    {t.close}
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Notification Modal */}
            {showNotificationModal && activeTab === 'createEvent' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
                  
                  <div className="space-y-4 mb-8">
                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex gap-4">
                      <div className="shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-adv-orange" />
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {lang === 'en' ? 
                          "Please " + t.notification1 : 
                          "ກະລຸນາ " + t.notification1
                        }
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex gap-4">
                      <div className="shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5 text-adv-orange" />
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {t.notification2}
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex gap-4">
                      <div className="shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-adv-orange" />
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {t.notification3}
                      </p>
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
                         <div className="aspect-[3/4] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                           {verticalImage ? (
                             <img src={verticalImage} className="w-full h-full object-cover" alt="Preview" />
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
                         <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                           {horizontalImage ? (
                             <img src={horizontalImage} className="w-full h-full object-cover" alt="Preview" />
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
            {activeTab === 'myEvents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-adv-slate mb-2">{t.myEvents}</h2>
                    <p className="text-gray-500 font-medium">{t.manageEventsDesc}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">{t.totalEvents}</h3>
                    <div className="text-3xl font-extrabold text-adv-slate">{localEvents.length}</div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">{t.totalTicketsSold}</h3>
                    <div className="text-3xl font-extrabold text-adv-slate">{(localEvents.length * 450).toLocaleString()}</div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">{t.totalRevenue}</h3>
                    <div className="text-3xl font-extrabold text-adv-orange">{(localEvents.length * 15000000).toLocaleString()} {currency}</div>
                  </div>
                </div>

                {/* Events List */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">{t.eventName}</th>
                          <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">{t.date}</th>
                          <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">{lang === 'lo' ? 'ລາຄາປີ້' : 'Ticket Price'}</th>
                          <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">{t.status}</th>
                          <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">{t.sales}</th>
                          <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {localEvents.map((event) => {
                          const isPast = new Date(`${event.date}T23:59:59`) < new Date();
                          const daysUntil = getDaysUntilEvent(event.date);
                          const isFlexible = event.dateType === 'flexible';
                          const canEdit = isFlexible || daysUntil >= 7;
                          const displayPrice = event.price || (event.ticketTiers && event.ticketTiers[0]?.price ? `${(Number(String(event.ticketTiers[0].price).replace(/,/g, '')) || 0).toLocaleString()} ${currency}` : `0 ${currency}`);
                          return (
                            <tr 
                              key={event.id} 
                              onClick={() => setSelectedEvent(event)}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-adv-slate flex items-center gap-2">
                                      {event.title}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">{event.location}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-gray-600 font-medium">
                                <div className="space-y-1">
                                  {event.dateType === 'flexible' && (
                                    <span className="inline-block text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider mb-1">
                                      {t.flexibleDate}
                                    </span>
                                  )}
                                  <div className="font-semibold text-adv-slate">
                                    {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {event.endDate && event.endDate !== event.date && (
                                      <>
                                        <span className="mx-1 text-gray-400">→</span>
                                        {new Date(event.endDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </>
                                    )}
                                  </div>
                                  {(event.time || event.endTime) && (
                                    <div className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      {event.time || '00:00'} - {event.endTime || '23:59'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-black text-adv-orange text-xs whitespace-nowrap">
                                <span className="px-2.5 py-1 bg-orange-50 text-adv-orange rounded-lg border border-orange-100/60 inline-block">
                                  {displayPrice}
                                </span>
                              </td>
                              <td className="p-4">
                                {event.status === 'pending' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-amber-50 text-amber-600 border border-amber-100">
                                    {lang === 'lo' ? 'ລໍຖ້າອະນຸມັດ' : 'Pending Approval'}
                                  </span>
                                ) : event.status === 'rejected' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-red-50 text-red-500 border border-red-100">
                                    {lang === 'lo' ? 'ຖືກປະຕິເສດ' : 'Rejected'}
                                  </span>
                                ) : event.status === 'approved' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    {lang === 'lo' ? 'ອະນຸມັດແລ້ວ' : 'Approved'}
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-adv-orange'}`}>
                                    {isPast ? t.pastEvents : t.activeEvents}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-gray-600 font-bold">
                                {Math.floor(Math.random() * 500) + 50} / {Math.floor(Math.random() * 500) + 500}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleToggleDateTypeInOrganizer(event); }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-xs font-extrabold border shadow-2xs cursor-pointer ${
                                      event.dateType === 'flexible'
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                    }`}
                                    title={event.dateType === 'flexible' ? 'Switch to Fixed Date' : 'Switch to Flexible Date'}
                                  >
                                    <RefreshCcw className="w-3.5 h-3.5 shrink-0" />
                                    <span className="whitespace-nowrap">
                                      {event.dateType === 'flexible'
                                        ? (lang === 'lo' ? 'ປ່ຽນເປັນ Fixed Date' : 'Switch to Fixed Date')
                                        : (lang === 'lo' ? 'ປ່ຽນເປັນ Flexible Date' : 'Switch to Flexible Date')
                                      }
                                    </span>
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-adv-orange/10 hover:text-adv-orange text-gray-600 rounded-xl transition-all text-xs font-bold border border-gray-100/50 shadow-sm" 
                                    title={t.view}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{lang === 'lo' ? 'ເບິ່ງກິດຈະກຳ' : 'View Event'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'terms' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-50 text-adv-orange mb-6 border border-orange-100 shadow-inner">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-adv-slate mb-4">{t.termsTitle}</h2>
                  <p className="text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">{t.termsIntro}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Term 1 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term1Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList1}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 2 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange shrink-0 border border-orange-100 group-hover:bg-adv-orange group-hover:text-white transition-all shadow-sm">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term2Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList2}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 3 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term3Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList3}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 4 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term4Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList4}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 5 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0 border border-purple-100 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-sm">
                        <RefreshCcw className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term5Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList5}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 6 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term6Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList6}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 7 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term7Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList7}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 8 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term8Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList8}</p>
                      </div>
                    </div>
                  </div>

                  {/* Term 9 */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 shrink-0 border border-teal-100 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-sm">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-adv-slate mb-2">{t.term9Title}</h3>
                        <p className="text-gray-500 leading-relaxed text-xs font-medium">{t.termsList9}</p>
                      </div>
                    </div>
                  </div>
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
                    {canEditModal ? (
                      <button 
                        onClick={() => {
                          handleStartEdit(selectedEvent);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-50 hover:bg-adv-orange hover:text-white text-adv-orange rounded-2xl transition-all text-xs font-black border border-orange-100/60 shadow-sm uppercase tracking-wider"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{t.edit}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setShowEditBlockedModal(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-2xl transition-all text-xs font-black border border-gray-200/40 shadow-sm cursor-not-allowed uppercase tracking-wider"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{t.editBlocked}</span>
                      </button>
                    )}
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
                      <img 
                        src={selectedEvent.image} 
                        alt={selectedEvent.title} 
                        className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{lang === 'lo' ? 'ຜູ້ຈັດງານ' : 'Organizer'}</h4>
                      <p className="text-adv-slate font-extrabold text-lg">{selectedEvent.organizer || 'Unknown'}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{lang === 'lo' ? 'ຍອດຂາຍ' : 'Sales'}</h4>
                      <p className="text-adv-slate font-extrabold text-2xl">{Math.floor(Math.random() * 500) + 50}</p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                      <h4 className="text-xs font-bold text-adv-orange/60 mb-2 uppercase tracking-wider">{lang === 'lo' ? 'ລາຍຮັບ' : 'Revenue'}</h4>
                      <p className="text-adv-orange font-extrabold text-2xl">{(Math.floor(Math.random() * 50000000)).toLocaleString()} {currency}</p>
                    </div>
                  </div>

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
                                  <span className="flex items-center gap-1">
                                    📦 {lang === 'lo' ? 'ຈຳນວນ:' : 'Qty:'} <strong className="text-adv-slate font-bold">{tier.quantity || tier.available || 'Unlimited'}</strong>
                                  </span>
                                  {(tier.saleStartDate || tier.saleEndDate) && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      🗓️ {tier.saleStartDate ? new Date(tier.saleStartDate).toLocaleDateString() : ''} 
                                      {tier.saleEndDate ? ` - ${new Date(tier.saleEndDate).toLocaleDateString()}` : ''}
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

                  {/* Event Features Configuration (Countdown Timer Toggle) */}
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-adv-slate flex items-center gap-2">
                          <Settings className="w-4 h-4 text-adv-orange" />
                          {lang === 'lo' ? 'ການຕັ້ງຄ່າຄຸນສົມບັດ Event' : 'Event Features Configuration'}
                        </h4>
                        <span className="text-[10px] bg-adv-orange/10 text-adv-orange font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {lang === 'lo' ? 'ຈັດການ' : 'Manage'}
                        </span>
                      </div>
                      
                      {selectedEvent.dateType !== 'flexible' && (
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-150/50 shadow-sm">
                          <div>
                            <h5 className="text-sm font-bold text-adv-slate flex items-center gap-1.5">
                              ⏱️ {t.enableCountdown}
                            </h5>
                            <p className="text-xs text-gray-400 font-semibold mt-1 max-w-xl">
                              {t.enableCountdownDesc}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              const updated = localEvents.map(evt => {
                                if (evt.id === selectedEvent.id) {
                                  const newEnable = evt.enableCountdown === undefined ? false : !evt.enableCountdown;
                                  return { ...evt, enableCountdown: newEnable };
                                }
                                return evt;
                              });
                              setLocalEvents(updated);
                              safeStorage.setItem('organizer_events', JSON.stringify(updated));
                              setSelectedEvent({ ...selectedEvent, enableCountdown: selectedEvent.enableCountdown === undefined ? false : !selectedEvent.enableCountdown });
                            }}
                            className={`w-11 h-6 rounded-full transition-colors relative ${selectedEvent.enableCountdown !== false ? 'bg-adv-orange' : 'bg-gray-300'}`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${selectedEvent.enableCountdown !== false ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-150/50 shadow-sm">
                        <div>
                          <h5 className="text-sm font-bold text-adv-slate flex items-center gap-1.5">
                            👥 {t.requireEveryTicketInfo}
                          </h5>
                          <p className="text-xs text-gray-400 font-semibold mt-1 max-w-xl">
                            {t.requireEveryTicketInfoDesc}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const updated = localEvents.map(evt => {
                              if (evt.id === selectedEvent.id) {
                                const newReq = evt.requireEveryTicketInfo === undefined ? false : !evt.requireEveryTicketInfo;
                                return { ...evt, requireEveryTicketInfo: newReq };
                              }
                              return evt;
                            });
                            setLocalEvents(updated);
                            safeStorage.setItem('organizer_events', JSON.stringify(updated));
                            setSelectedEvent({ ...selectedEvent, requireEveryTicketInfo: selectedEvent.requireEveryTicketInfo === undefined ? false : !selectedEvent.requireEveryTicketInfo });
                          }}
                          className={`w-11 h-6 rounded-full transition-colors relative ${selectedEvent.requireEveryTicketInfo !== false ? 'bg-adv-orange' : 'bg-gray-300'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${selectedEvent.requireEveryTicketInfo !== false ? 'translate-x-5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                        </button>
                      </div>
                    </div>

                  {/* Schedule and Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-adv-slate flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-adv-orange" />
                          Date & Schedule Mode
                        </h4>
                        <button
                          onClick={() => handleToggleDateTypeInOrganizer(selectedEvent)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-adv-orange text-adv-orange hover:text-white rounded-xl text-xs font-black transition-all border border-orange-200/80 shadow-2xs cursor-pointer"
                          title="Switch between Fixed Date and Flexible Date"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {selectedEvent.dateType === 'flexible'
                              ? (lang === 'lo' ? 'ປ່ຽນເປັນ Fixed Date' : 'Switch to Fixed Date')
                              : (lang === 'lo' ? 'ປ່ຽນເປັນ Flexible Date' : 'Switch to Flexible Date')
                            }
                          </span>
                        </button>
                      </div>

                      <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center gap-2">
                          {selectedEvent.dateType === 'flexible' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              {t.flexibleDate} (Open Visit Booking)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider">
                              <Calendar className="w-3 h-3 text-blue-500" />
                              Fixed Date Event
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 font-extrabold mt-1">
                          {new Date(selectedEvent.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date && (
                            <>
                              <span className="mx-1.5 text-gray-400">→</span>
                              {new Date(selectedEvent.endDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </>
                          )}
                        </p>
                        {(selectedEvent.time || selectedEvent.endTime) && (
                          <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-adv-orange" />
                            {selectedEvent.time || '00:00'} - {selectedEvent.endTime || '23:59'}
                          </p>
                        )}
                        {selectedEvent.dateType === 'flexible' && selectedEvent.flexibleDateDesc && (
                          <p className="text-xs text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-100 font-medium mt-1">
                            💬 {selectedEvent.flexibleDateDesc}
                          </p>
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
            className="fixed inset-0 z-[200] flex flex-col bg-slate-900/95 backdrop-blur-md overflow-hidden"
          >
            {/* Preview Top Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between shrink-0 shadow-2xl z-20 gap-4">
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
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex justify-center items-center gap-1.5"
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
                  className="flex-1 md:flex-none px-5 py-2 bg-adv-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20 flex justify-center items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {t.publishFromPreview || (lang === 'lo' ? 'ເຜີຍແຜ່ event ດຽວນີ້' : 'Publish Event Now')}
                </button>
              </div>
            </div>

            {/* Preview Body Content Scroll Area */}
            <div className={`flex-1 overflow-y-auto text-adv-slate flex justify-center ${previewDeviceMode === 'mobile' ? 'bg-slate-900/50 py-8 px-4 items-start' : 'bg-gray-50'}`}>
              <div className={`w-full mx-auto transition-all duration-300 ${previewDeviceMode === 'mobile' ? 'max-w-[400px] min-h-[800px] h-[800px] bg-gray-50 rounded-[3rem] border-[14px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative' : 'max-w-6xl px-4 py-8'}`}>
                 {previewDeviceMode === 'mobile' && (
                   <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-start z-50 pointer-events-none">
                     <div className="w-32 h-6 bg-slate-800 rounded-b-3xl"></div>
                   </div>
                 )}
                 <div className={previewDeviceMode === 'mobile' ? 'flex-1 overflow-y-auto px-4 py-8 space-y-6 scrollbar-hide' : 'space-y-8'}>

                {/* Hero Banner Cover */}
                <div className="relative rounded-3xl overflow-hidden bg-slate-800 aspect-[21/9] min-h-[260px] shadow-2xl border border-gray-200">
                  <img 
                    src={previewData.horizontalImage || previewData.image} 
                    alt={previewData.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 ${previewDeviceMode === 'desktop' ? 'md:p-10' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-adv-orange text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md">
                        {previewData.category}
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30">
                        {previewData.eventType === 'online' ? 'Online Event' : (previewData.province || 'Offline Event')}
                      </span>
                      {previewData.dateType === 'flexible' && (
                        <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                          Flexible Date
                        </span>
                      )}
                    </div>
                    <h1 className={`font-extrabold text-white tracking-tight mb-2 text-2xl ${previewDeviceMode === 'desktop' ? 'md:text-4xl' : ''}`}>
                      {previewData.title}
                    </h1>
                    <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-adv-orange shrink-0" />
                      {previewData.venue} • {previewData.district}, {previewData.province}
                    </p>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className={`grid grid-cols-1 gap-8 ${previewDeviceMode === 'desktop' ? 'lg:grid-cols-3' : ''}`}>
                  
                  {/* Left Column: Details */}
                  <div className={`space-y-8 ${previewDeviceMode === 'desktop' ? 'lg:col-span-2' : ''}`}>
                    
                    {/* Event Quick Info Bar */}
                    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 gap-4 ${previewDeviceMode === 'desktop' ? 'md:grid-cols-2' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-bold uppercase">{lang === 'lo' ? 'ວັນທີ' : 'Date'}</div>
                          <div className="text-sm font-bold text-adv-slate">
                            {previewData.date ? new Date(previewData.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                            {previewData.endDate && previewData.endDate !== previewData.date ? ` - ${new Date(previewData.endDate).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-bold uppercase">{lang === 'lo' ? 'ເວລາ' : 'Time'}</div>
                          <div className="text-sm font-bold text-adv-slate">
                            {previewData.time || '00:00'} {previewData.endTime ? `- ${previewData.endTime}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rich Event Description */}
                    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 ${previewDeviceMode === 'desktop' ? 'sm:p-8' : ''}`}>
                      <h3 className="text-lg font-bold text-adv-slate border-b border-gray-100 pb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-adv-orange" />
                        {lang === 'lo' ? 'ລາຍລະອຽດ event' : 'Event Description'}
                      </h3>
                      <div 
                        className="prose max-w-none text-gray-600 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: previewData.description || '<p>No description provided yet.</p>' }}
                      />
                    </div>

                    {/* Gallery Images */}
                    {previewData.exampleImages && previewData.exampleImages.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ຮູບພາບປະກອບ' : 'Event Gallery'}
                        </h3>
                        <div className={`grid grid-cols-2 gap-3 ${previewDeviceMode === 'desktop' ? 'sm:grid-cols-3' : ''}`}>
                          {previewData.exampleImages.map((img: string, idx: number) => (
                            <img key={idx} src={img} alt={`Gallery ${idx}`} className="w-full h-32 object-cover rounded-xl border border-gray-100 shadow-sm" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seating Zone Map */}
                    {previewData.hasSeating && previewData.zoneImage && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ແຜນຜັງໂຊນບ່ອນນັ່ງ' : 'Zone Seating Map'}
                        </h3>
                        <div className="rounded-xl overflow-hidden border border-gray-200 max-h-[400px] flex justify-center bg-gray-50">
                          <img src={previewData.zoneImage} alt="Seating Map" className="w-full object-contain" />
                        </div>
                      </div>
                    )}

                    {/* Time Slots */}
                    {previewData.hasTimeSelection && previewData.timeSlots && previewData.timeSlots.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-lg font-bold text-adv-slate flex items-center gap-2">
                          <Clock className="w-5 h-5 text-adv-orange" />
                          {lang === 'lo' ? 'ເລືອກຊ່ວງເວລາ' : 'Operating Time Slots'}
                        </h3>
                        <div className={`grid grid-cols-2 gap-3 ${previewDeviceMode === 'desktop' ? 'sm:grid-cols-3' : ''}`}>
                          {previewData.timeSlots.map((slot: string, idx: number) => (
                            <div key={idx} className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-center text-xs font-bold text-adv-slate">
                              {slot}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Organizer Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                      {previewData.organizerLogo ? (
                        <img src={previewData.organizerLogo} alt={previewData.organizer || 'Organizer'} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange font-black text-xl shrink-0">
                          {(previewData.organizer || 'O').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-400 font-bold uppercase">{lang === 'lo' ? 'ຜູ້ຈັດງານ' : 'Organized by'}</div>
                        <div className="text-base font-extrabold text-adv-slate">{previewData.organizer || 'Organizer Name'}</div>
                        {previewData.organizerContact && (
                          <div className="text-xs text-gray-500 font-medium mt-0.5">{previewData.organizerContact}</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Ticket Purchase Box */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-6 sticky top-6">
                      <div className="border-b border-gray-100 pb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          {lang === 'lo' ? 'ລາຄາປີ້ເລີ່ມຕົ້ນ' : 'Starting Ticket Price'}
                        </span>
                        <div className="text-2xl font-black text-adv-orange">
                          {previewData.price || `0 ${currency}`}
                        </div>
                      </div>

                      {/* Ticket Tiers list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                          {lang === 'lo' ? 'ປະເພດປີ້' : 'Ticket Tiers'}
                        </h4>
                        {previewData.ticketTiers && previewData.ticketTiers.length > 0 ? (
                          previewData.ticketTiers.map((tier: any, idx: number) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                              <div>
                                <div className="font-bold text-xs text-adv-slate">{tier.name || `Tier ${idx + 1}`}</div>
                                <div className="text-[10px] text-gray-400 font-medium">Qty: {tier.quantity || 'Unlimited'}</div>
                              </div>
                              <div className="font-extrabold text-xs text-adv-orange">
                                {tier.price ? `${(Number(String(tier.price).replace(/,/g, '')) || 0).toLocaleString()} ${currency}` : `0 ${currency}`}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-400 font-medium">
                            General Admission
                          </div>
                        )}
                      </div>

                      {/* Coupons Badge */}
                      {previewData.coupons && previewData.coupons.length > 0 && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
                          <Ticket className="w-4 h-4 shrink-0" />
                          <span>{previewData.coupons.length} {lang === 'lo' ? 'ຄູປອງສ່ວນຫຼຸດພິເສດ' : 'Special Coupons Available'}</span>
                        </div>
                      )}

                      {/* Mock Buy Button */}
                      <button 
                        disabled 
                        className="w-full py-4 bg-adv-orange/80 text-white font-extrabold text-center rounded-xl shadow-md cursor-not-allowed text-sm"
                      >
                        {lang === 'lo' ? 'ຊື້ປີ້ (ໂໝດເບິ່ງຕົວຢ່າງ)' : 'Buy Tickets (Preview Mode)'}
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
