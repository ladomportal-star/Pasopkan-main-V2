// @ts-ignore
import thatLuangImage from '../assets/images/that_luang_festival_1783950645361.jpg';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  available: number;
  description?: string;
  saleEndDate?: string;
}

export interface SeatingZone {
  id: string;
  name: string;
  capacity: number;
  price: number;
  color: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
}

export interface AttendeeQuestion {
  id: string;
  type: 'text' | 'long_text' | 'options' | 'single_choice' | 'url' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
}

export interface LaoEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  image: string;
  dateType?: 'fixed' | 'flexible';
  flexibleDateDesc?: string;
  category: 'Sports' | 'Workshop' | 'Festival' | 'Voucher' | 'Concert';
  description: string;
  ticketTiers: TicketTier[];
  exampleImages?: string[];
  hasSeating?: boolean;
  seatingZones?: SeatingZone[];
  zoneImage?: string;
  coupons?: Coupon[];
  hasTimeSelection?: boolean;
  timeSlots?: string[];
  availableDates?: { date: string, startTime: string, endTime: string }[];
  requireEveryTicketInfo?: boolean;
  endDate?: string;
  endTime?: string;
  organizer?: string;
  organizerInfo?: string;
  organizerContact?: string;
  organizerLogo?: string;
  showRemainingTickets?: boolean;
  allowRefunds?: boolean;
  maxTickets?: string;
  enableCountdown?: boolean;
  views?: number;
  purchases?: number;
  status?: 'sold_out' | 'selling_fast' | 'new' | 'popular' | string;
  languages?: string[];
  durationEn?: string;
  durationLo?: string;
  latitude?: number;
  longitude?: number;
  googleMapUrl?: string;
  attendeeQuestions?: AttendeeQuestion[];
}

export const events: LaoEvent[] = [
  {
    id: '1',
    title: 'That Luang Festival',
    durationEn: '3 Days',
    durationLo: '3 ວັນ',
    date: '2026-11-24',
    time: '08:00',
    location: 'Vientiane, LA',
    venue: 'Pha That Luang Stupa',
    image: thatLuangImage,
    category: 'Festival',
    status: 'popular',
    languages: ['Lao', 'English'],
    description: 'The most significant religious festival in Laos. Join thousands for the Alms Giving ceremony, traditional sports, and the grand evening processions around the Golden Stupa.',
    exampleImages: [
      'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't1', name: 'Ceremony Participation', price: 0, available: 5000, description: 'Free for everyone to participate in the morning alms.' },
      { id: 't2', name: 'VIP Seating (Grandstand)', price: 999, available: 200, description: 'Reserved seating for the cultural performances.' },
    ],
    coupons: [
      { id: 'c1', code: ' FESTIVAL20', discount: 20, type: 'percentage', isActive: true },
      { id: 'c2', code: 'WELCOME50', discount: 50000, type: 'fixed', isActive: true }
    ]
  },
  {
    id: '2',
    title: 'AI Developer Summit 2026',
    durationEn: '1 Day',
    durationLo: '1 ວັນ',
    date: '2026-09-10',
    time: '09:00',
    location: 'Vientiane, LA',
    venue: 'National Convention Centre',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop',
    category: 'Workshop',
    status: 'selling_fast',
    languages: ['English', 'Lao'],
    description: 'Join top engineers and AI enthusiasts to discuss the latest in generative models, agentic frameworks, and the future of coding. Learn how to scale AI applications in production.',
    hasTimeSelection: false,
    exampleImages: [
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591453006322-5172b665d009?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't3', name: 'General Admission', price: 1500, available: 150, description: 'Includes access to all keynotes and panel discussions.' },
      { id: 't4', name: 'VIP Developer Pass', price: 3000, available: 20, description: 'Includes hands-on workshops and exclusive networking lunch.' },
    ],
    attendeeQuestions: [
      { id: 'q1', type: 'text', label: 'What company do you work for?', required: true },
      { id: 'q2', type: 'long_text', label: 'What is your job title?', required: true },
      { id: 'q3', type: 'single_choice', label: 'How much is your average monthly AI spend?', required: true, options: ['<$100', '$100-$1000', '>$1000'] },
      { id: 'q4', type: 'single_choice', label: 'How often do you hit Token or API Rate Limit?', required: true, options: ['Never', 'Sometimes', 'Often'] },
      { id: 'q5', type: 'options', label: 'Favorite Model?', required: true, options: ['GPT-4', 'Claude 3', 'Gemini 1.5 Pro'] },
      { id: 'q6', type: 'options', label: 'Which Harness?', required: true, options: ['LangChain', 'LlamaIndex', 'Custom'] },
      { id: 'q7', type: 'single_choice', label: 'Does your company supports your token budget?', required: true, options: ['Yes', 'No'] },
      { id: 'q8', type: 'checkbox', label: 'Are you actively looking for a job?', required: false },
      { id: 'q9', type: 'checkbox', label: 'Is your company hiring Lead Engineer or Engineering Management roles?', required: false },
      { id: 'q10', type: 'url', label: 'Your LinkedIn Profile', required: false },
    ],
    coupons: [
      { id: 'c3', code: 'DEV10', discount: 10, type: 'percentage', isActive: true }
    ]
  },
  {
    id: '3',
    title: 'Kayaking in Vang Vieng',
    durationEn: '4 Hours',
    durationLo: '4 ຊົ່ວໂມງ',
    date: '2026-10-15',
    time: '09:30',
    location: 'Vang Vieng, LA',
    venue: 'Nam Song River Plaza',
    image: 'https://images.unsplash.com/photo-1579451861283-a2239070aaa9?q=80&w=2000&auto=format&fit=crop',
    category: 'Sports',
    description: 'Paddle down the scenic Nam Song River, passing through dramatic limestone landscapes and exploring hidden river caves. Perfect for nature lovers.',
    exampleImages: [
      'https://images.unsplash.com/photo-1579451861283-a2239070aaa9?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't5', name: 'Full Day Adventure', price: 350, available: 40, description: 'Includes equipment, guide, and picnic lunch.' },
      { id: 't6', name: 'Half Day Sunset Row', price: 200, available: 30, description: 'Late afternoon kayaking back to town.' },
    ],
  },
  {
    id: '4',
    title: 'Lao Cooking Masterclass',
    durationEn: '3.5 Hours',
    durationLo: '3.5 ຊົ່ວໂມງ',
    date: '2026-07-20',
    time: '10:00',
    location: 'Vientiane, LA',
    venue: 'Tamarind Kitchen',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop',
    category: 'Workshop',
    description: 'Learn the secrets of Lao cuisine. Visit the local market to source ingredients and then cook traditional dishes like Larb, Mok Pa, and Jeow Bong.',
    hasTimeSelection: true,
    timeSlots: ['08:30', '11:00', '14:30', '17:00'],
    exampleImages: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't7', name: 'Cooking Class Seat', price: 300, available: 15, description: 'Includes recipe book and ingredients.' },
    ],
  },
  {
    id: '5',
    title: 'Pi Mai Lao Celebration',
    durationEn: '5 Days',
    durationLo: '5 ວັນ',
    date: '2026-11-14',
    time: '13:00',
    location: 'Luang Prabang, LA',
    venue: 'Old Town Heritage Zone',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000&auto=format&fit=crop',
    category: 'Festival',
    description: 'Celebrate the Lao New Year with the legendary water festival in Luang Prabang. Enjoy the parade, traditional music, and friendly water fights.',
    exampleImages: [
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540039155732-d6824b5ce1fd?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't8', name: 'Viewing Area Access', price: 80, available: 500 },
      { id: 't9', name: 'VIP Heritage Tour', price: 650, available: 50, description: 'Guided experience including traditional dinners.' },
    ],
  },
  {
    id: '6',
    title: 'Boun Bang Fai (Rocket Festival)',
    durationEn: '2 Days',
    durationLo: '2 ວັນ',
    date: '2026-08-10',
    time: '09:00',
    location: 'Vientiane, LA',
    venue: 'Nam Houm Reservoir',
    image: 'https://images.unsplash.com/photo-1540039155732-d6824b5ce1fd?q=80&w=2000&auto=format&fit=crop',
    category: 'Festival',
    description: 'Experience the spectacular launch of homemade bamboo rockets as villagers pray for rain and a bountiful harvest. A day of music, dance, and excitement.',
    exampleImages: [
      'https://images.unsplash.com/photo-1540039155732-d6824b5ce1fd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't10', name: 'General Admission', price: 50, available: 2000 },
    ],
  },
  {
    id: '7',
    title: 'Jungle Trekking Luang Namtha',
    durationEn: '2 Days (1 Night)',
    durationLo: '2 ວັນ (1 ຄືນ)',
    date: '2026-08-05',
    time: '07:30',
    location: 'Luang Namtha, LA',
    venue: 'Nam Ha NPA Office',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2000&auto=format&fit=crop',
    category: 'Sports',
    description: 'Trek through the lush Jungles of Nam Ha National Protected Area. Visit local ethnic minority villages and learn about forest conservation.',
    exampleImages: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't11', name: '2-Day Trekking Pass', price: 950, available: 10, description: 'Includes village homestay and all meals.' },
    ],
  },
  {
    id: '8',
    title: 'Luxury Staycation Voucher',
    durationEn: 'Flexible (1 Night Stay)',
    durationLo: 'ປ່ຽນແປງໄດ້ (ພັກ 1 ຄືນ)',
    date: '2026-12-31',
    time: '23:59',
    dateType: 'flexible',
    flexibleDateDesc: 'Valid throughout 2026',
    location: 'Luang Prabang, LA',
    venue: 'Rosewood Luang Prabang',
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000&auto=format&fit=crop',
    category: 'Voucher',
    description: 'Prepaid voucher for a one-night stay in a luxury tent overlooking the waterfall. Includes breakfast and spa treatment.',
    exampleImages: [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't12', name: 'Standard Tent Stay', price: 450, available: 100 },
      { id: 't13', name: 'Premium Pool Villa', price: 850, available: 20 },
    ],
  },
  {
    id: '9',
    title: 'Traditional Spa Voucher',
    durationEn: '90 Minutes',
    durationLo: '90 ນາທີ',
    date: '2026-10-31',
    time: '22:00',
    dateType: 'flexible',
    flexibleDateDesc: 'Book any time in 2026',
    location: 'Vientiane, LA',
    venue: 'Sengtawan Riverside Spa',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2000&auto=format&fit=crop',
    category: 'Voucher',
    status: 'sold_out',
    description: 'Voucher for a 90-minute traditional Lao massage with organic herbal steam. Relax while overlooking the Mekong river.',
    hasTimeSelection: true,
    timeSlots: ['10:00', '13:00', '15:00', '17:00', '19:00'],
    exampleImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't14', name: '90-min Massage', price: 350, available: 500 },
    ],
  },
  {
    id: '10',
    title: 'Bamboo Art Workshop',
    durationEn: '2.5 Hours',
    durationLo: '2.5 ຊົ່ວໂມງ',
    date: '2026-09-15',
    time: '14:00',
    location: 'Luang Prabang, LA',
    venue: 'Bamboo Experience Center',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2000&auto=format&fit=crop',
    category: 'Workshop',
    description: 'Learn how to weave traditional Lao baskets and mats from bamboo. A meditative experience connecting you with local craftsmanship.',
    exampleImages: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't15', name: 'Workshop Ticket', price: 180, available: 15 },
    ],
  },
  {
    id: '11',
    title: 'Mekong River Sunset Concert (Seating Zone Test)',
    durationEn: '4 Hours',
    durationLo: '4 ຊົ່ວໂມງ',
    date: '2026-10-18',
    time: '17:30',
    location: 'Vientiane, LA',
    venue: 'Mekong Riverfront Stage',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop',
    category: 'Festival',
    status: 'popular',
    description: 'An acoustic musical journey featuring master artists overlooking the magnificent Mekong sunset. This event features fully functional Seating Zone selectors for premium seats, general rows, and VIP booths.',
    hasSeating: true,
    zoneImage: 'https://images.unsplash.com/photo-1503095391757-1117ec7fc765?q=80&w=1000&auto=format&fit=crop',
    seatingZones: [
      { id: 'z1', name: 'VIP Front Lounge (Zone A)', capacity: 50, price: 500, color: '#f97316' },
      { id: 'z2', name: 'Middle Terrace Row (Zone B)', capacity: 150, price: 300, color: '#3b82f6' },
      { id: 'z3', name: 'General Lawn Area (Zone C)', capacity: 300, price: 150, color: '#10b981' }
    ],
    exampleImages: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't16', name: 'General Standing Admission', price: 100, available: 500 }
    ],
    coupons: [
      { id: 'c4', code: 'SUNSET15', discount: 15, type: 'percentage', isActive: true }
    ]
  },
  {
    id: '12',
    title: 'Luang Prabang Heritage Cycle (Flexible & Time Slots)',
    durationEn: '3 Hours',
    durationLo: '3 ຊົ່ວໂມງ',
    date: '2026-12-15',
    time: '08:00',
    dateType: 'flexible',
    flexibleDateDesc: 'Valid any day between Oct & Dec 2026',
    location: 'Luang Prabang, LA',
    venue: 'Town Heritage Center',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=2000&auto=format&fit=crop',
    category: 'Workshop',
    status: 'new',
    description: 'Rent an authentic cruiser bike and join professional local guides for an immersive cycling route through temples, alleys, and hidden artisan shops. Fully flexible visit dates with custom daily time slot selections.',
    hasTimeSelection: true,
    timeSlots: ['Morning Breeze (07:30 - 10:30)', 'Midday Cruise (11:00 - 14:00)', 'Sunset Glide (15:30 - 18:30)'],
    exampleImages: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't17', name: 'Single Day Pass + Bike Hire', price: 120, available: 100, description: 'Includes premium vintage city cruiser and helmet.' },
      { id: 't18', name: 'VIP Pass + Local Lunch', price: 220, available: 30, description: 'Includes professional guide, entry tickets, and lunch.' }
    ]
  },
  {
    id: '13',
    title: 'Vang Vieng Ziplining & Canopy Tour',
    durationEn: '3 Hours',
    durationLo: '3 ຊົ່ວໂມງ',
    date: '2026-09-22',
    time: '08:30',
    location: 'Vang Vieng, LA',
    venue: 'Tham Nam (Water Cave) Adventure Park',
    image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=2000&auto=format&fit=crop',
    category: 'Sports',
    description: 'Fly high above the green rainforest canopy and majestic karst towers of Vang Vieng. Experience 12 thrilling zipline segments, wooden suspension bridges, and a guided abseiling descent.',
    exampleImages: [
      'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't19', name: 'Standard Canopy Adventure', price: 280, available: 25, description: 'Includes all gear, certified guides, and mineral water.' },
      { id: 't20', name: 'VIP Canopy + Blue Lagoon Pass', price: 390, available: 15, description: 'Zipline tour plus private tuk-tuk transfer and entry ticket to Blue Lagoon 1.' }
    ]
  },
  {
    id: '14',
    title: 'Laos Coffee Tasting & Roasting Masterclass',
    durationEn: '2 Hours',
    durationLo: '2 ຊົ່ວໂມງ',
    date: '2026-11-05',
    time: '10:00',
    location: 'Pakse, LA',
    venue: 'Bolaven Plateau Eco Farm',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=2000&auto=format&fit=crop',
    category: 'Workshop',
    description: 'Discover the rich volcanic soil heritage of the Bolaven Plateau. Learn to hand-roast raw Arabica beans over an open fire, master professional cupping techniques, and brew the perfect cup of traditional Lao style drip coffee.',
    hasTimeSelection: true,
    timeSlots: ['10:00', '14:00', '16:30'],
    exampleImages: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't21', name: 'Tasting & Roasting Seat', price: 150, available: 12, description: 'Includes coffee tasting flight, roasting session, and 250g bag of organic beans to take home.' }
    ]
  },
  {
    id: '15',
    title: 'Vientiane Food & Crafts Night Bazaar',
    durationEn: '5 Hours',
    durationLo: '5 ຊົ່ວໂມງ',
    date: '2026-10-25',
    time: '17:00',
    location: 'Vientiane, LA',
    venue: 'Chao Anouvong Park',
    image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=2000&auto=format&fit=crop',
    category: 'Festival',
    description: 'An evening celebration of modern Lao culture, delicious street eats, and handmade artistic crafts. Features street performers, acoustic live bands, and over 100 local vendors right along the Mekong riverbank.',
    exampleImages: [
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't22', name: 'General Entry (Includes 1 Free Beverage)', price: 40, available: 1000 },
      { id: 't23', name: 'Foodie VIP Pass', price: 120, available: 150, description: 'Includes fast-track entry, priority seating at the riverfront terrace, and 5 street food tasting coupons.' }
    ]
  },
  {
    id: '16',
    title: 'Mekong Sunset Cruise with Dinner Voucher',
    durationEn: '2.5 Hours',
    durationLo: '2.5 ຊົ່ວໂມງ',
    date: '2026-12-20',
    time: '16:30',
    dateType: 'flexible',
    flexibleDateDesc: 'Redeemable on any day during late 2026',
    location: 'Luang Prabang, LA',
    venue: 'Nava Mekong Pier',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop',
    category: 'Voucher',
    description: 'Experience an unforgettable sunset on a traditional luxury river barge. Sail up the Mekong, watch the golden reflection on the limestone cliffs, and enjoy a premium 5-course traditional Lao dinner.',
    exampleImages: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't24', name: 'Sunset Cruise Dinner Voucher', price: 320, available: 200, description: 'Valid for one adult. Includes cruise and traditional dinner menu.' }
    ]
  },
  {
    id: '17',
    title: 'Vientiane: Full-Day City Highlights & Buddha Park Tour',
    durationEn: '8 Hours',
    durationLo: '8 ຊົ່ວໂມງ',
    date: '2026-07-24',
    time: '08:30',
    location: 'Vientiane, LA',
    venue: 'Vientiane Hotel Pickup & Buddha Park',
    image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=2000&auto=format&fit=crop',
    category: 'Workshop',
    status: 'popular',
    languages: ['English', 'Lao', 'Chinese', 'Thai'],
    description: 'Discover the iconic heritage and mystical wonders of Vientiane. Wander through the quiet courtyard of Wat Sisaket adorned with over 6,800 clay Buddhas, visit the former emerald house at Hor Phra Keo, climb to the top of Patuxay Victory Gate for sprawling cityscapes, stand in awe of the sacred golden Pha That Luang Stupa, and immerse yourself in the whimsical concrete pantheon of over 200 Hindu-Buddhist statues at Buddha Park.',
    hasTimeSelection: true,
    timeSlots: ['08:30 - 16:30 (Full Day)', '13:00 - 18:00 (Sunset Half-Day)'],
    exampleImages: [
      'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588009475116-2835db0c651c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541604193435-2241500d3b33?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't25', name: 'Shared Guided Group Tour', price: 420, available: 15, description: 'Includes hotel pickup, English-speaking local guide, entry tickets to all sights, and a traditional Lao lunch.' },
      { id: 't26', name: 'Private Luxury SUV Tour', price: 850, available: 6, description: 'Includes private air-conditioned premium SUV transfers, dedicated professional private guide, customized itinerary flexibility, entry tickets, and premium set menu lunch.' }
    ]
  },
  {
    id: '18',
    title: 'Vang Vieng: Kayaking, Cave Tubing with Zip Line/Blue Lagoon',
    durationEn: '8 Hours',
    durationLo: '8 ຊົ່ວໂມງ',
    date: '2026-07-17',
    time: '09:00',
    location: 'Vang Vieng, LA',
    venue: 'Nam Song River & Blue Lagoon 1',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2000&auto=format&fit=crop',
    category: 'Sports',
    status: 'popular',
    languages: ['English', 'Lao', 'Thai'],
    description: `Embark on an unforgettable full-day outdoor adventure in Vang Vieng. Soar high above the pristine rainforest canopy on a spectacular 12-line zipline course, float deep into the mysterious Tham Nam Water Cave on an inner tube, paddle a kayak through dramatic limestone landscapes on the Nam Song River, and dive into the refreshing, crystal-clear turquoise waters of the famous Blue Lagoon.<br/><br/>
    <b>Itinerary Details:</b><br/>
    • <b>09:00 AM</b>: Morning hotel pickup in Vang Vieng by traditional Songthaew truck.<br/>
    • <b>09:30 AM</b>: Visit <b>Tham Xang (Elephant Cave)</b> to see the historic elephant-shaped stalactite and sacred Buddha shrines.<br/>
    • <b>10:00 AM</b>: Fly through the trees on an adrenaline-pumping <b>Zipline Canopy Tour</b> with wooden suspension bridges and gorgeous karst views.<br/>
    • <b>12:00 PM</b>: Experience <b>Cave Tubing at Tham Nam</b>. Float 500 meters into the dark water cave using headlamps and guiding ropes.<br/>
    • <b>01:00 PM</b>: Enjoy a hot local Lao picnic lunch featuring BBQ, fried rice, baguettes, and fresh tropical fruits.<br/>
    • <b>02:00 PM</b>: Paddle 5-8km down the scenic <b>Nam Song River</b> in a kayak through mild rapids and stunning nature.<br/>
    • <b>03:30 PM</b>: Transfer to the famous <b>Blue Lagoon 1</b>. Enjoy swimming, jumping off tree branches, or sunbathing on the lush lawns.<br/>
    • <b>05:00 PM</b>: Return transfer back to your Vang Vieng hotel.<br/><br/>
    <i>* ວັງວຽງ: ພາຍເຮືອຄາຍັກ, ລອດຖ້ຳນ້ຳ ພ້ອມກັບ ກິດຈະກຳຊີບລາຍ ແລະ ບລູລາກູນ. ເລີ່ມຕົ້ນການຜະຈົນໄພກາງແຈ້ງເຕັມວັນທີ່ບໍ່ມີວັນລືມ: ບິນຂ້າມປ່າດົງດິບເທິງຊີບລາຍ, ລອຍຫ່ວງຢາງລອດຖ້ຳນ້ຳທີ່ລຶກລັບ, ພາຍເຮືອຄາຍັກຊົມທິວທັດພູເຂົາຫີນປູນ, ແລະ ໂດດຫຼິ້ນນ້ຳສີຟ້າຄາມທີ່ ບລູລາກູນ 1. ລວມທັງໝົດຄ່າບໍລິການລົດຮັບສົ່ງ, ອາຫານກາງວັນ, ອຸປະກອນຄວາມປອດໄພ, ແລະ ໄກ້ຜູ້ນຳທ່ຽວ.</i>`,
    latitude: 18.9288,
    longitude: 102.4411,
    organizer: 'Discover Vang Vieng Tours',
    organizerContact: 'booking@discovervangvieng.com',
    organizerLogo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    organizerInfo: 'Discover Vang Vieng Tours is a premium certified ecotourism operator specialized in high-quality outdoor adventures across Laos. For over 10 years, we have provided safe, thrilling, and eco-friendly excursions with international safety standards, certified local guides, and top-tier gears.',
    exampleImages: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579451861283-a2239070aaa9?q=80&w=1000&auto=format&fit=crop'
    ],
    ticketTiers: [
      { id: 't27', name: 'Full-Day Adventure Package (All Activities)', price: 480, available: 40, description: 'Includes Zipline Canopy (12 lines), Cave Tubing, Kayaking, Blue Lagoon entry, buffet picnic lunch, all entrance fees, and hotel Songthaew transfers.' },
      { id: 't28', name: 'Explorer Pack (No Zipline Canopy)', price: 350, available: 30, description: 'Includes Cave Tubing, Kayaking, Blue Lagoon entry, lunch, safety gear, and hotel transfers. Perfect for a more relaxed day without the zipline heights.' }
    ]
  },
  // --- Concert Events ---
  {
    id: 'c1',
    title: 'Vientiane Live Music Festival 2026',
    date: '2026-09-28',
    time: '18:00 - 23:00',
    location: 'Vientiane',
    venue: 'National Stadium Vientiane',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2000&auto=format&fit=crop',
    category: 'Concert',
    status: 'popular',
    description: 'The biggest pop and indie concert event in Vientiane featuring popular Lao singers, band performances, and top guest artists from across Southeast Asia.',
    organizer: 'Lao Concert Productions',
    ticketTiers: [
      { id: 'tc1', name: 'Standard Standing', price: 150000, available: 300, description: 'General access zone near the stage.' },
      { id: 'tc2', name: 'VIP Front Stage', price: 350000, available: 50, description: 'Priority access, closest front row view, and free drink voucher.' }
    ]
  },
  {
    id: 'c2',
    title: 'Lao Acoustic Night & Pop Concert 2026',
    date: '2026-06-15',
    time: '19:30 - 22:30',
    location: 'Vientiane',
    venue: 'Mekong Riverfront Outdoor Stage',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop',
    category: 'Concert',
    status: 'popular',
    description: 'An intimate evening of live acoustic melodies and classic Lao ballads overlooking the sunset on the Mekong River.',
    organizer: 'Mekong Sounds',
    ticketTiers: [
      { id: 'tc3', name: 'General Seating', price: 100000, available: 0, description: 'Open seating with complimentary herbal tea.' }
    ]
  },
  {
    id: 'c3',
    title: 'Luang Prabang Heritage Jazz & Blues Night',
    date: '2026-04-20',
    time: '20:00 - 23:00',
    location: 'Luang Prabang',
    venue: 'Old Town Square Cultural Stage',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000&auto=format&fit=crop',
    category: 'Concert',
    description: 'Smooth jazz saxophone, acoustic blues, and traditional Lao instrument fusion in the heart of Luang Prabang Old Town.',
    organizer: 'Luang Prabang Jazz Club',
    ticketTiers: [
      { id: 'tc4', name: 'General Admission', price: 80000, available: 0, description: 'Includes 1 welcome beverage.' }
    ]
  },
  // --- Past Festival Events ---
  {
    id: 'f_past1',
    title: 'Vientiane Light & Lantern Cultural Festival 2026',
    date: '2026-05-12',
    time: '18:30 - 22:00',
    location: 'Vientiane',
    venue: 'That Luang Esplanade',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2000&auto=format&fit=crop',
    category: 'Festival',
    description: 'A magical celebration of light and heritage with illuminated giant lanterns, cultural dance showcases, and traditional food stalls.',
    organizer: 'Vientiane Tourism Board',
    ticketTiers: [
      { id: 'tfp1', name: 'Free Entrance Pass', price: 0, available: 0, description: 'Public community festival pass.' }
    ]
  },
  {
    id: 'f_past2',
    title: 'Mekong River Songkran Cultural Fair 2026',
    date: '2026-04-14',
    time: '10:00 - 18:00',
    location: 'Vientiane',
    venue: 'Chao Anouvong Park',
    image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=2000&auto=format&fit=crop',
    category: 'Festival',
    description: 'Traditional Lao New Year cultural celebrations featuring sand stupa making, water blessings, flower parades, and folk music.',
    organizer: 'Lao Cultural Heritage Association',
    ticketTiers: [
      { id: 'tfp2', name: 'Free Access', price: 0, available: 0, description: 'Open community event.' }
    ]
  },
  // --- Past Voucher Events ---
  {
    id: 'v_past1',
    title: 'Boutique Heritage Resort Weekend Escape Voucher',
    date: '2026-06-10',
    time: 'Check-in 14:00',
    location: 'Luang Prabang',
    venue: 'Luang Prabang Heritage Resort',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop',
    category: 'Voucher',
    description: 'Exclusive 2-night stay voucher with daily champagne breakfast, heritage garden view suite, and airport transfers.',
    organizer: 'Lao Hospitality Group',
    ticketTiers: [
      { id: 'tvp1', name: '2-Night Resort Package', price: 450000, available: 0, description: 'Voucher valid until June 2026.' }
    ]
  },
  {
    id: 'v_past2',
    title: 'French-Lao Gourmet Dinner Experience Voucher',
    date: '2026-05-05',
    time: '18:00 - 22:00',
    location: 'Luang Prabang',
    venue: "L'Elephant Restaurant",
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop',
    category: 'Voucher',
    description: '5-course French-Lao culinary fusion tasting menu paired with fine organic wines in a colonial heritage villa.',
    organizer: 'L Elephant Culinary Team',
    ticketTiers: [
      { id: 'tvp2', name: 'Gourmet Tasting Pass', price: 250000, available: 0, description: 'Includes 5 courses & drink pairing.' }
    ]
  },
  // --- Past Sports Events ---
  {
    id: 's_past1',
    title: 'Luang Prabang Half Marathon & Trail Run 2026',
    date: '2026-04-18',
    time: '06:00 - 11:00',
    location: 'Luang Prabang',
    venue: 'Luang Prabang Old Town Heritage Square',
    image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=2000&auto=format&fit=crop',
    category: 'Sports',
    description: 'Annual heritage run passing through temple-lined streets, local villages, and along the picturesque Nam Khan and Mekong rivers.',
    organizer: 'Lao Running Events',
    ticketTiers: [
      { id: 'tsp1', name: '21km Half Marathon Entry', price: 120000, available: 0, description: 'Includes finisher medal, official bib, and running shirt.' }
    ]
  },
  // --- Past Workshop Events ---
  {
    id: 'w_past1',
    title: 'Lao Traditional Pottery & Clay Sculpting Workshop',
    date: '2026-05-30',
    time: '09:00 - 12:00',
    location: 'Luang Prabang',
    venue: 'Ban Chan Pottery Village',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=2000&auto=format&fit=crop',
    category: 'Workshop',
    description: 'Hands-on clay pottery throwing and wood-fire kiln techniques taught by master artisans of Ban Chan pottery village.',
    organizer: 'Ban Chan Artisan Collective',
    ticketTiers: [
      { id: 'twp1', name: 'Workshop & Pottery Souvenir Pass', price: 180000, available: 0, description: 'Includes raw clay, tools, and fired pottery to take home.' }
    ]
  }
];

export function getEventStatus(event: LaoEvent): 'sold_out' | 'selling_fast' | 'new' | 'popular' | string | undefined {
  if (event.status) {
    return event.status as any;
  }
  
  // Calculate dynamically if not set
  const totalAvailable = event.ticketTiers?.reduce((acc, tier) => acc + (tier.available || 0), 0) ?? 0;
  if (totalAvailable === 0 && (!event.hasSeating || event.ticketTiers?.length > 0)) {
    return 'sold_out';
  }
  
  if (totalAvailable > 0 && totalAvailable <= 15) {
    return 'selling_fast';
  }
  
  // Custom heuristics for default categories if we want
  if (parseInt(event.id) >= 13) {
    return 'new';
  }
  
  return undefined;
}
