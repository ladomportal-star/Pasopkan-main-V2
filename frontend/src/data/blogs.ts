export interface BlogPost {
  id: string;
  title: string;
  titleLao?: string;
  slug: string;
  excerpt: string;
  excerptLao?: string;
  content: string;
  contentLao?: string;
  coverImage: string;
  author: {
    name: string;
    role?: string;
    avatar?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  isPublished: boolean;
  featured?: boolean;
  tags?: string[];
}

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Vang Vieng Music Fest 2026: The Ultimate Experience & Survival Guide',
    titleLao: 'ເທດສະການດົນຕີ ວັງວຽງ 2026: ຄູ່ມືການກຽມພ້ອມ ແລະ ປະສົບການທີ່ດີທີ່ສຸດ',
    slug: 'vang-vieng-music-fest-2026-guide',
    excerpt: 'Heading to Vang Vieng for the premier outdoor music gathering? Here are essential packing tips, cashless payment advice, and local hotspots you cannot miss.',
    excerptLao: 'ກຳລັງຈະເດີນທາງໄປວັງວຽງເພື່ອຮ່ວມງານເທດສະການດົນຕີກາງແຈ້ງທີ່ໃຫຍ່ທີ່ສຸດບໍ? ນີ້ຄືຄຳແນະນຳການກຽມຕົວ, ການໃຊ້ຈ່າຍຜ່ານລະບົບດິຈິຕອນ ແລະ ຈຸດເຊັກອິນທີ່ຫ້າມພາດ.',
    content: `Vang Vieng is known for its dramatic limestone karsts, crystal-clear blue lagoons, and vibrant outdoor spirit. When you combine this scenic backdrop with Southeast Asia's top indie and EDM performers, you get an electric atmosphere unlike any other festival in the region.

### 1. Seamless Cashless Ticketing
All official tickets are secured on the Pasopkan mobile app. Make sure you take a screenshot of your offline E-Ticket QR code or add it to your Apple/Google Wallet before reaching the festival valley, as cellular networks can get crowded during peak hours.

### 2. What to Pack
- **Lightweight Rainwear & Windbreaker**: Tropical mountain weather can shift quickly from sunshine to cool breezes.
- **Waterproof Dry Bag**: Protect your phone, battery pack, and personal credentials.
- **Comfortable Footwear**: You will be walking on grassy fields and riverside paths.

### 3. Supporting Local Eco-Tourism
Remember that Vang Vieng's natural beauty depends on responsible visitors. Use the designated recycling stations across the festival grounds and support local food vendors serving authentic Lao dishes outside the perimeter.`,
    contentLao: `ເມືອງວັງວຽງ ຂຶ້ນຊື່ເລື່ອງທິວທັດພູຜາຫີນປູນ, ສາຍນ້ຳສີຟ້າໃສສະອາດ ແລະ ທຳມະຊາດທີ່ສວຍສົດງົດງາມ. ເມື່ອລວມກັບສຽງດົນຕີຈາກສິນລະປິນຊັ້ນນຳ, ບັນຍາກາດຈຶ່ງເຕັມໄປດ້ວຍພະລັງ ແລະ ຄວາມມ່ວນຊື່ນ.

### 1. ການໃຊ້ລະບົບປີ້ດິຈິຕອນສະດວກສະບາຍ
ປີ້ທາງການທຸກໃບຖືກຄຸ້ມຄອງຜ່ານ Pasopkan. ແນະນຳໃຫ້ບັນທຶກ QR Code ຫຼື ແຄັບຈໍໄວ້ລ່ວງໜ້າ ເພື່ອຄວາມວ່ອງໄວໃນການສະແກນເຂົ້າງານ ແມ່້ນໃນເວລາທີ່ມີຄົນມາຫຼາຍ.

### 2. ສິ່ງທີ່ຄວນກຽມໄປ
- **ເສື້ອກັນລົມ ຫຼື ກັນຝົນນ້ຳໜັກເບົາ**: ອາກາດແຖວພູດອຍອາດປ່ຽນແປງໄດ້ໄວ.
- **ຖົງກັນນ້ຳ**: ປ້ອງກັນໂທລະສັບ, Powerbank ແລະ ເອກະສານສຳຄັນ.
- **ເກີບທີ່ສະດວກສະບາຍ**: ສຳລັບການຍ່າງ ແລະ ເຕັ້ນມ່ວນຊື່ນຕະຫຼອດງານ.

### 3. ຮ່ວມກັນຮັກສາສິ່ງແວດລ້ອມ
ຄວາມງາມຂອງວັງວຽງຂຶ້ນກັບທຸກໆຄົນ. ກະລຸນາຖິ້ມຂີ້ເຫຍື້ອລົງຖັງທີ່ຈັດໄວ້ໃຫ້ ແລະ ຮ່ວມອຸດໜູນຮ້ານຄ້າທ້ອງຖິ່ນ.`,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Somvang Sisavath',
      role: 'Festival Reporter',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    publishedAt: '2026-03-08',
    isPublished: true,
    featured: false,
    tags: ['Music', 'Vang Vieng', 'Travel', 'Festival']
  },
  {
    id: 'blog-2',
    title: 'How to Host a Sold-Out Creative Workshop in Vientiane',
    titleLao: 'ວິທີການຈັດງານເວີກຊັອບໃຫ້ເຕັມ ແລະ ປະສົບຜົນສຳເລັດໃນນະຄອນຫຼວງວຽງຈັນ',
    slug: 'host-sold-out-workshop-vientiane',
    excerpt: 'From venue selection along the Mekong to digital ticket tiers and interactive attendee engagement: here is how top creators build unforgettable workshops.',
    excerptLao: 'ເລີ່ມຕັ້ງແຕ່ການເລືອກສະຖານທີ່, ການຕັ້ງລາຄາປີ້, ຈົນຮອດການສ້າງປະສົບການທີ່ໜ້າປະທັບໃຈໃຫ້ຜູ້ເຂົ້າຮ່ວມ: ເຄັດລັບຈາກຜູ້ຈັດງານມືອາຊີບ.',
    content: `Workshops and micro-events are booming across Laos. Whether you are teaching traditional silk weaving, modern UI/UX design, or coffee cupping, attendees are looking for hands-on, high-value experiences.

### Key Strategies for Success:
1. **Define a Focused Takeaway**: People join workshops to master a specific skill. Make sure your event description outlines the tangible project participants will complete.
2. **Early Bird Tiering**: Offer a limited Early Bird batch to kickstart ticket momentum. This signals early demand and builds social proof.
3. **Streamlined Check-ins**: Use Pasopkan’s built-in Staff Scanner app so your guests do not wait in long lines at the reception desk.`,
    contentLao: `ການຈັດງານເວີກຊັອບກຳລັງເປັນທີ່ນິຍົມຫຼາຍໃນລາວ ບໍ່ວ່າຈະເປັນການຮຽນຕໍ່າຫູກ, ການອອກແບບ, ຫຼື ການຊົງກາເຟ.

### ເຄັດລັບສູ່ຄວາມສຳເລັດ:
1. **ກຳນົດເປົ້າໝາຍທີ່ຊັດເຈນ**: ຜູ້ເຂົ້າຮ່ວມຕ້ອງການໄດ້ຮັບທັກສະທີ່ນຳໄປໃຊ້ໄດ້ຈິງ.
2. **ປີ້ລາຄາພິເສດ (Early Bird)**: ຊ່ວຍກະຕຸ້ນການຕັດສິນໃຈຈອງໃນໄລຍະທຳອິດ.
3. **ການເຊັກອິນທີ່ໄວ**: ນຳໃຊ້ລະບົບສະແກນ QR ຂອງ Pasopkan ເພື່ອຫຼຸດຜ່ອນການຕໍ່ຄິວ.`,
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Noy Phommasone',
      role: 'Community Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    publishedAt: '2026-03-02',
    isPublished: true,
    featured: false,
    tags: ['Workshop', 'Business', 'Education']
  },
  {
    id: 'blog-3',
    title: 'Transforming Lao Cultural Festivities with Digital E-Ticketing',
    titleLao: 'ການຍົກລະດັບງານບຸນປະເພນີລາວດ້ວຍລະບົບປີ້ອີເລັກໂຕຣນິກ E-Ticket',
    slug: 'digital-eticketing-lao-festivals',
    excerpt: 'Traditional boat racing festivals and cultural celebrations are embracing modern digital passes, reducing paper waste and improving crowd flow.',
    excerptLao: 'ງານບຸນຊ່ວງເຮືອ ແລະ ບຸນປະເພນີຕ່າງໆ ກຳລັງກ້າວສູ່ຍຸກດິຈິຕອນ ຊ່ວຍຫຼຸດຜ່ອນຂີ້ເຫຍື້ອເຈ້ຍ ແລະ ເຮັດໃຫ້ການເຂົ້າງານສະດວກສະບາຍຍິ່ງຂຶ້ນ.',
    content: `Preserving Lao rich cultural heritage while adopting green, modern technology is at the heart of Pasopkan’s mission.

By introducing instant QR tickets, festivalgoers skip printing paper receipts, while local authorities gain real-time visibility into attendance numbers and safety thresholds. It's a win-win for sustainability, heritage, and the modern event economy.`,
    contentLao: `ການອະນຸລັກວັດທະນະທຳອັນດີງາມໄປພ້ອມໆກັບການນຳໃຊ້ເຕັກໂນໂລຊີສີຂຽວ ແມ່ນເປົ້າໝາຍສຳຄັນຂອງ Pasopkan.

ການໃຊ້ປີ້ QR Code ຜ່ານມືຖື ຊ່ວຍຫຼຸດການໃຊ້ເຈ້ຍ, ເຮັດໃຫ້ການຄຸ້ມຄອງຈຳນວນຄົນມີຄວາມປອດໄພ ແລະ ເປັນລະບຽບຮຽບຮ້ອຍຫຼາຍຂຶ້ນ.`,
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Khamla Sengsouvanh',
      role: 'Culture Editor',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    publishedAt: '2026-02-25',
    isPublished: true,
    featured: false,
    tags: ['Culture', 'Sustainability', 'Technology']
  },
  {
    id: 'blog-4',
    title: 'Comfort Zone, Comfort Tone 🌿 🎧 The Safe Sound Space for Your Heart',
    titleLao: 'Comfort Zone, Comfort Tone 🌿 🎧 ພື້ນທີ່ປອດໄພ...ກັບສຽງເພງທີ່ພໍດີກັບໃຈ',
    slug: 'comfort-zone-comfort-tone-laos',
    excerpt: 'Explore relaxing acoustic cafes, indie listening spots, and weekend music sessions across Vientiane.',
    excerptLao: 'ສຳຫຼວດພື້ນທີ່ສຽງເພງສະບາຍໆ, ຮ້ານກາເຟສາຍອິນດີ້ ແລະ ບົດເພງຜ່ອນຄາຍໃນຍາມແລງທີ່ຊ່ວຍຮີລໃຈ.',
    content: `Sometimes you need a pause from high-energy bass and crowded festival fields. We curated the best acoustic and chill listening spots in Vientiane where you can unwind with good sound, warm coffee, and great acoustic sets.

### Top Listening Havens:
- **Riverside Acoustic Lounge**: Sunset views over the Mekong with soft acoustic guitar.
- **Indie Vinyl & Coffee Bar**: Analog vinyl sound with specialty drip coffee.
- **Artisan Garden Jam**: Outdoor Sunday sessions featuring local singer-songwriters.`,
    contentLao: `ບາງຄັ້ງເຮົາກໍຕ້ອງການພື້ນທີ່ງຽບສະຫງົບ, ພັກຜ່ອນຈາກຄວາມວຸ້ນວາຍ ແລະ ຟັງສຽງດົນຕີເບົາໆທີ່ຊ່ວຍເຕີມພະລັງໃຫ້ກັບຊີວິດ.

### ຈຸດເຊັກອິນສຳລັບຄົນຮັກສຽງເພງ:
- **ຮ້ານກາເຟແຄມຂອງ**: ຊົມວິວຕາເວັນຕົກດິນພ້ອມສຽງກີຕ້າໂປ່ງ.
- **ບາແຜ່ນສຽງ Vinyl**: ຟັງສຽງເພງຄລາສສິກກັບກາເຟດຣິບ.
- **ສວນດົນຕີວັນອາທິດ**: ພົບກັບສິນລະປິນອິນດີ້ທ້ອງຖິ່ນໃນບັນຍາກາດອົບອຸ່ນ.`,
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Pasopkan Admin',
      role: 'Administrator'
    },
    publishedAt: '2026-02-18',
    isPublished: true,
    featured: false,
    tags: ['Music', 'Lifestyle', 'Chill']
  },
  {
    id: 'blog-5',
    title: 'Luang Prabang Arts & Heritage Showcase: Culture Meets Contemporary Expression',
    titleLao: 'ເທດສະການສິລະປະ ແລະ ມໍລະດົກ ຫຼວງພະບາງ: ການເຊື່ອມໂຍງວັດທະນະທຳ ແລະ ຍຸກໃໝ່',
    slug: 'luang-prabang-arts-heritage-showcase',
    excerpt: 'Discover sacred temple pathways, traditional indigo textile exhibitions, and lantern-lit river ceremonies.',
    excerptLao: 'ສຳຜັດຄວາມງົດງາມຂອງວັດວາອາຮາມເກົ່າແກ່, ງານວາງສະແດງຜ້າໄໝຍ້ອມຄາມ ແລະ ພິທີໄຫຼເຮືອໄຟແຄມນ້ຳຂອງ.',
    content: `Luang Prabang is the cultural crown jewel of Laos. As the UNESCO World Heritage town awakens to contemporary artistic expression, local artisans and modern creators come together to showcase photography, heritage crafts, and live musical storytelling.

### Highlights:
- **Traditional Indigo & Silk Weaving Demonstrations**: Meet master weavers from surrounding craft villages.
- **Nighttime Lantern Ceremony by the Mekong**: Experience centuries-old spiritual reverence along the riverbanks.
- **Lao Contemporary Photography Pavilion**: Showcasing emerging Lao visual storytellers and photojournalists.`,
    contentLao: `ເມືອງຫຼວງພະບາງ ເມືອງມໍລະດົກໂລກທີ່ເຕັມໄປດ້ວຍສະເໜ່ ແລະ ປະຫວັດສາດອັນລ້ຳຄ່າ. ງານສະແດງສິລະປະ ແລະ ມໍລະດົກ ໄດ້ນຳເອົາຊ່າງຝີມືດັ້ງເດີມ ແລະ ຄົນລຸ້ນໃໝ່ມາພົບກັນເພື່ອສ້າງສັນຜົນງານທີ່ໜ້າຕື່ນຕາຕື່ນໃຈ.

### ຈຸດເດັ່ນທີ່ບໍ່ຄວນພາດ:
- **ການສາທິດການຕ່ຳຫູກ ແລະ ຍ້ອມຄາມແບບບູຮານ**: ຮຽນຮູ້ຈາກຊ່າງຝີມືຕົວຈິງຈາກໝູ່ບ້ານຫັດຖະກຳ.
- **ພິທີໄຫຼເຮືອໄຟ ແລະ ຈູດທຽນແຄມຂອງ**: ສຳຜັດບັນຍາກາດແສງໄຟສ່ອງສະຫວ່າງຍາມຄ່ຳຄືນ.
- **ງານວາງສະແດງຮູບພາບຖ່າຍຮ່ວມສະໄໝ**: ເລົ່າເລື່ອງລາວວິຖີຊີວິດຄົນລາວຜ່ານມຸມມອງຊ່າງພາບຄົນຮຸ່ນໃໝ່.`,
    coverImage: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Pasopkan Admin',
      role: 'Administrator'
    },
    publishedAt: '2026-02-10',
    isPublished: true,
    featured: false,
    tags: ['Culture', 'Luang Prabang', 'Heritage']
  },
  {
    id: 'blog-6',
    title: 'Vientiane International Marathon: Runners Guide & Route Highlights',
    titleLao: 'ງານແລ່ນ ວຽງຈັນ ມາຣາທອນ ສາກົນ: ຄູ່ມືເສັ້ນທາງແລ່ນ ແລະ ຈຸດຊົມວິວທີ່ໜ້າສົນໃຈ',
    slug: 'vientiane-international-marathon-guide',
    excerpt: 'Prepare for the most anticipated morning race along That Luang Esplanade and the scenic Mekong riverside.',
    excerptLao: 'ກຽມພ້ອມສຳລັບການແລ່ນຕອນເຊົ້າສຸດປະທັບໃຈ ຜ່ານເດີ່ນພະທາດຫຼວງ ແລະ ເສັ້ນທາງລຽບແຄມຂອງ.',
    content: `The Vientiane International Marathon brings together thousands of local athletes, amateur joggers, and international distance runners for a race through the historical landmarks of the capital.

### Course Tips:
- **That Luang Sunrise Stretch**: The early 5:00 AM start rewards runners with the sunrise striking Pha That Luang's golden spires.
- **Hydration & Pacing**: Keep a steady pace as morning humidity rises along the Mekong waterfront promenade.
- **Official Pasopkan Bib & Finishers Badge**: Track timing updates and claim your official Finisher NFT ticket badge on the app.`,
    contentLao: `ງານແລ່ນວຽງຈັນ ມາຣາທອນ ສາກົນ ເປັນງານກິລາທີ່ຮວບຮວມນັກແລ່ນຈາກທົ່ວທຸກມຸມໂລກ ແລະ ພາຍໃນປະເທດ ເພື່ອແລ່ນຜ່ານສະຖານທີ່ສຳຄັນຕ່າງໆຂອງນະຄອນຫຼວງ.

### ຄຳແນະນຳສຳລັບນັກແລ່ນ:
- **ຈຸດຊົມຕາເວັນຂຶ້ນທີ່ພະທາດຫຼວງ**: ອອກໂຕຕອນເຊົ້າ 05:00 ໂມງ ພ້ອມແສງທຳອິດທີ່ສ່ອງໃສ່ຍອດພະທາດຫຼວງຄຳ.
- **ການດື່ມນ້ຳ ແລະ ຮັກສາຈັງຫວະ**: ຮັກສາຄວາມໄວໃຫ້ສະໝ່ຳສະເໝີ ເພື່ອຮັບມືກັບອາກາດຍາມເຊົ້າແຄມຂອງ.
- **ການຮັບຫຼຽນ ແລະ ໃບຢັ້ງຢືນດິຈິຕອນ**: ກວດສອບເວລາ ແລະ ຮັບ Finisher Badge ຜ່ານແອັບ Pasopkan ໄດ້ທັນທີ.`,
    coverImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Pasopkan Admin',
      role: 'Administrator'
    },
    publishedAt: '2026-01-25',
    isPublished: true,
    featured: false,
    tags: ['Sports', 'Marathon', 'Vientiane']
  },
  {
    id: 'blog-7',
    title: 'Vang Vieng Eco-Trail Challenge: Kayaking & Cave Exploration',
    titleLao: 'ການທົດສອບຄວາມກ້າຫານທີ່ວັງວຽງ: ພາຍເຮືອຄາຍັກ ແລະ ສຳຫຼວດຖ້ຳທຳມະຊາດ',
    slug: 'vang-vieng-eco-trail-challenge',
    excerpt: 'An adventurous weekend exploring limestone karsts, secret blue lagoons, and Nam Song river rafting.',
    excerptLao: 'ທຣິບຜະຈົນໄພທ້າຍອາທິດ ສຳຫຼວດພູຫີນປູນ, ວັງນ້ຳຂຽວມໍລະກົດ ແລະ ການລ່ອງເຮືອນ້ຳຊອງ.',
    content: `Experience the breathtaking natural scenery of Vang Vieng with organized outdoor challenges including river kayaking, ziplining through tropical canopy, and mountain trekking.`,
    contentLao: `ສຳຜັດກັບທຳມະຊາດອັນສວຍສົດງົດງາມຂອງເມືອງວັງວຽງ ຜ່ານກິດຈະກຳກາງແຈ້ງ ທັງການພາຍເຮືອຄາຍັກ, ໂຫນສະລິງ ແລະ ການຍ່າງປ່າຂຶ້ນຈຸດຊົມວິວ.`,
    coverImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Pasopkan Admin',
      role: 'Administrator'
    },
    publishedAt: '2026-01-18',
    isPublished: true,
    featured: false,
    tags: ['Adventure', 'Vang Vieng', 'Eco']
  },
  {
    id: 'blog-8',
    title: 'Lao Coffee & Craft Roasters Festival: From Bolaven Plateau to Your Cup',
    titleLao: 'ເທດສະການກາເຟລາວ ແລະ ໂຮງຂົ້ວຫັດຖະກຳ: ຈາກພູພຽງບໍລະເວນສູ່ຈອກກາເຟຂອງທ່ານ',
    slug: 'lao-coffee-craft-roasters-festival',
    excerpt: 'Celebrating award-winning Arabica and Robusta beans with artisan baristas and cupping competitions.',
    excerptLao: 'ສະເຫຼີມສະຫຼອງເມັດກາເຟອາຣາບິກາ ແລະ ໂຣບັສຕາ ຄຸນນະພາບສູງ ພ້ອມການແຂ່ງຂັນ Cupping ຈາກບາຣິສຕ້າຊັ້ນນຳ.',
    content: `The Lao Coffee Festival gathers highland coffee growers from Champasak and specialty roasters from across Southeast Asia for workshops, tastings, and equipment demonstrations.`,
    contentLao: `ງານເທດສະການກາເຟລາວ ໄດ້ເຕົ້າໂຮມຊາວກະສິກອນປູກກາເຟຈາກພູພຽງບໍລະເວນ ແລະ ໂຮງຂົ້ວກາເຟພິເສດ ເພື່ອແລກປ່ຽນປະສົບການ ແລະ ຊີມລົດຊາດກາເຟຫຼາກຫຼາຍສາຍພັນ.`,
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'Pasopkan Admin',
      role: 'Administrator'
    },
    publishedAt: '2026-01-10',
    isPublished: true,
    featured: false,
    tags: ['Coffee', 'Food', 'Festival']
  }
];

const STORAGE_KEY = 'pasopkan_blogs';

export function getBlogs(): BlogPost[] {
  if (typeof window === 'undefined') return INITIAL_BLOG_POSTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BLOG_POSTS));
      return INITIAL_BLOG_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_BLOG_POSTS;
    }
    // Ensure all initial blog posts exist so layouts with 4 items render properly
    const existingIds = new Set(parsed.map((p: BlogPost) => p.id));
    const missing = INITIAL_BLOG_POSTS.filter(i => !existingIds.has(i.id));
    const combined = [...parsed, ...missing];

    // Backfill Lao translations if undefined in stored items
    return combined.map(p => {
      const initialMatch = INITIAL_BLOG_POSTS.find(i => i.id === p.id);
      return {
        ...p,
        titleLao: p.titleLao || initialMatch?.titleLao,
        excerptLao: p.excerptLao || initialMatch?.excerptLao,
        contentLao: p.contentLao || initialMatch?.contentLao
      };
    });
  } catch (err) {
    console.error('Failed to get blogs from localStorage:', err);
    return INITIAL_BLOG_POSTS;
  }
}

export function saveBlogs(blogs: BlogPost[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
    window.dispatchEvent(new CustomEvent('pasopkan_blogs_updated', { detail: blogs }));
  } catch (err) {
    console.error('Failed to save blogs to localStorage:', err);
  }
}

export function addBlog(blogData: Partial<BlogPost> & { title: string; content: string }): BlogPost {
  const blogs = getBlogs();
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];

  const newBlog: BlogPost = {
    id: `blog-${Date.now()}`,
    title: blogData.title,
    titleLao: blogData.titleLao,
    slug: blogData.slug || (blogData.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    excerpt: blogData.excerpt || blogData.content.slice(0, 160) + '...',
    excerptLao: blogData.excerptLao,
    content: blogData.content,
    contentLao: blogData.contentLao,
    coverImage: blogData.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    author: blogData.author || { name: 'Pasopkan Admin', role: 'Administrator' },
    publishedAt: todayDate,
    updatedAt: nowIso,
    isPublished: blogData.isPublished !== undefined ? blogData.isPublished : true,
    featured: false,
    tags: blogData.tags || []
  };
  const updated = [newBlog, ...blogs];
  saveBlogs(updated);
  return newBlog;
}

export function updateBlog(id: string, updates: Partial<BlogPost>): BlogPost | null {
  const blogs = getBlogs();
  const existing = blogs.find(b => b.id === id);
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];

  const updatedBlog: BlogPost = {
    ...existing,
    ...updates,
    publishedAt: todayDate,
    updatedAt: nowIso
  };

  // Crucial: Move the updated article to the very top (index 0) of the list!
  // This ensures it becomes the hero ("the big one") and recent articles display below it from top to under.
  const remaining = blogs.filter(b => b.id !== id);
  const updated = [updatedBlog, ...remaining];
  saveBlogs(updated);
  return updatedBlog;
}

export function deleteBlog(id: string): boolean {
  const blogs = getBlogs();
  const filtered = blogs.filter(b => b.id !== id);
  if (filtered.length !== blogs.length) {
    saveBlogs(filtered);
    return true;
  }
  return false;
}

export function toggleBlogPublish(id: string): BlogPost | null {
  const blogs = getBlogs();
  let updatedItem: BlogPost | null = null;
  const updated = blogs.map(b => {
    if (b.id === id) {
      updatedItem = { ...b, isPublished: !b.isPublished };
      return updatedItem;
    }
    return b;
  });
  if (updatedItem) {
    saveBlogs(updated);
  }
  return updatedItem;
}
