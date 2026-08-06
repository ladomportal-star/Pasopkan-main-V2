export interface Review {
  id: string;
  eventId: string;
  userName: string;
  userRealName?: string;
  rating: number; // 1 to 5
  comment: {
    en: string;
    lo: string;
  } | string; // support both object or raw string for user-submitted ones
  date: string;
  avatarUrl?: string;
  isMock?: boolean;
}

export const INITIAL_MOCK_REVIEWS: Review[] = [
  // That Luang Festival (Event 1)
  {
    id: 'rev-1-1',
    eventId: '1',
    userName: 'Somsack P.',
    rating: 5,
    comment: {
      en: 'Incredible spiritual experience! The morning alms giving ceremony was breathtaking and very well-organized. Highly recommended for everyone visiting Laos.',
      lo: 'ປະສົບການທີ່ດີເລີດຫຼາຍ! ພິທີຕັກບາດຕອນເຊົ້າແມ່ນສັກສິດ ແລະ ຈັດໄດ້ດີຫຼາຍ. ແນະນຳຢ່າງຍິ່ງສຳລັບທຸກຄົນທີ່ມາທ່ຽວລາວ.'
    },
    date: '2025-11-26',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    isMock: true
  },
  {
    id: 'rev-1-2',
    eventId: '1',
    userName: 'Emily Cooper',
    rating: 4,
    comment: {
      en: 'The grand evening procession was magical, though the crowd was huge. Definitely worth getting the VIP ticket to have a comfortable view of the traditional performances!',
      lo: 'ຂະບວນແຫ່ຕອນແລງແມ່ນວິຈິດງົດງາມຫຼາຍ, ແຕ່ຄົນຫຼາຍແທ້ໆ. ຄຸ້ມຄ່າແທ້ໆທີ່ຊື້ປີ້ VIP ເພື່ອເບິ່ງການສະແດງສິລະປະວັດທະນະທຳຢ່າງສະດວກສະບາຍ!'
    },
    date: '2025-11-25',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    isMock: true
  },
  
  // Traditional Silk Weaving (Event 2)
  {
    id: 'rev-2-1',
    eventId: '2',
    userName: 'Bouavone K.',
    rating: 5,
    comment: {
      en: 'Such a detailed and immersive workshop. I learned so much about the natural dye process and was able to weave my own small scarf. The instructors are incredibly patient!',
      lo: 'ເປັນເວີກຊັອບທີ່ລະອຽດ ແລະ ເຂົ້າເຖິງແທ້ໆ. ໄດ້ຮຽນຮູ້ຫຼາຍຢ່າງກ່ຽວກັບຂັ້ນຕອນການຍ້ອມສີທຳມະຊາດ ແລະ ໄດ້ຕ່ຳແພພັນຄໍຜືນນ້ອຍຂອງຕົນເອງ. ຄູຝຶກມີຄວາມອົດທົນດີຫຼາຍ!'
    },
    date: '2026-03-12',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    isMock: true
  },

  // Kayaking in Vang Vieng (Event 3)
  {
    id: 'rev-3-1',
    eventId: '3',
    userName: 'Marc Wilson',
    rating: 5,
    comment: {
      en: 'The sunset row was spectacular. The karst landscape in Vang Vieng looks unreal from the river. Our guide was very friendly and kept us safe all the time.',
      lo: 'ການພາຍເຮືອເບິ່ງຕາເວັນຕົກດິນແມ່ນງົດງາມຫຼາຍ. ວິວພູເຂົາຫີນປູນໃນວັງວຽງເບິ່ງຄືຄວາມຝັນເລີຍເມື່ອເບິ່ງຈາກແມ່ນ້ຳ. ໄກ້ຂອງພວກເຮົາເປັນກັນເອງ ແລະ ດູແລຄວາມປອດໄພຕະຫຼອດເວລາ.'
    },
    date: '2026-04-01',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
    isMock: true
  },
  {
    id: 'rev-3-2',
    eventId: '3',
    userName: 'Souphaphone S.',
    rating: 4,
    comment: {
      en: 'Super fun activity! Kayaking through the small caves was exciting. Bring waterproof bags because you will definitely get wet!',
      lo: 'ກິດຈະກຳມ່ວນຫຼາຍ! ການພາຍເຮືອລອດຖ້ຳນ້ອຍແມ່ນຕື່ນເຕັ້ນດີ. ກະລຸນາຕຽມຖົງກັນນ້ຳໄປນຳ ເພາະທ່ານຈະປຽກຢ່າງແນ່ນອນ!'
    },
    date: '2026-03-20',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    isMock: true
  },

  // Lao Cooking Masterclass (Event 4)
  {
    id: 'rev-4-1',
    eventId: '4',
    userName: 'Anna Schmidt',
    rating: 5,
    comment: {
      en: 'The market tour was so educational! I finally know how to prepare proper sticky rice and make the most delicious Larb. Absolutely a highlight of my trip.',
      lo: 'ທົວຕະຫຼາດໄດ້ຄວາມຮູ້ດີຫຼາຍ! ໃນທີ່ສຸດຂ້ອຍກໍຮູ້ວິທີໜຶ້ງເຂົ້າໜຽວ ແລະ ເຮັດລາບທີ່ແຊບທີ່ສຸດ. ເປັນຈຸດເດັ່ນຂອງການທ່ອງທ່ຽວຂອງຂ້ອຍເລີຍ.'
    },
    date: '2026-05-18',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
    isMock: true
  },

  // Luang Prabang Heritage Cycle (Event 12)
  {
    id: 'rev-12-1',
    eventId: '12',
    userName: 'Khonesavanh M.',
    rating: 5,
    comment: {
      en: 'Exploring Luang Prabang by bike is the perfect pace. Loved stopping at the smaller, non-touristy temples and enjoying the traditional local Lao lunch.',
      lo: 'ການຂີ່ລົດຖີບສຳຫຼວດຫຼວງພະບາງແມ່ນໄດ້ບັນຍາກາດທີ່ພໍດີຫຼາຍ. ມັກການຢຸດແວ່ວັດນ້ອຍໆທີ່ບໍ່ຄ່ອຍມີນັກທ່ອງທ່ຽວ ແລະ ການຮັບປະທານອາຫານທ່ຽງແບບທ້ອງຖິ່ນ.'
    },
    date: '2026-06-05',
    avatarUrl: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=150&auto=format&fit=crop',
    isMock: true
  }
];

export function getReviewsForEvent(eventId: string): Review[] {
  const saved = localStorage.getItem('pasopkan_reviews');
  let userReviews: Review[] = [];
  if (saved) {
    try {
      userReviews = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse reviews', e);
    }
  }
  
  // Combine mock and user reviews
  const eventUserReviews = userReviews.filter(r => r.eventId === eventId);
  const eventMockReviews = INITIAL_MOCK_REVIEWS.filter(r => r.eventId === eventId);
  
  // Return user reviews first (newer or personalized), then mock reviews
  return [...eventUserReviews, ...eventMockReviews];
}

export function saveReview(review: Omit<Review, 'id' | 'date'> & { id?: string; date?: string }): Review {
  const saved = localStorage.getItem('pasopkan_reviews');
  let userReviews: Review[] = [];
  if (saved) {
    try {
      userReviews = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  const newReview: Review = {
    id: review.id || `rev-usr-${Date.now()}`,
    eventId: review.eventId,
    userName: review.userName || 'Anonymous User',
    userRealName: review.userRealName,
    rating: review.rating,
    comment: review.comment,
    date: review.date || new Date().toISOString().slice(0, 10),
    avatarUrl: review.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
  };

  // Check if user already reviewed this event, if so, replace/edit it
  const existingIndex = userReviews.findIndex(r => r.eventId === review.eventId && r.id === review.id);
  if (existingIndex > -1) {
    userReviews[existingIndex] = newReview;
  } else {
    // If we have an existing review by the same user for this event without ID matching, we can replace or append. 
    // Let's replace if they edit, or append a new one. To be simple, if they submit a review for an event, we can overwrite any previous review by the same user to prevent duplicate reviews for the same event by the same user.
    const duplicateIndex = userReviews.findIndex(r => r.eventId === review.eventId && r.userName === newReview.userName);
    if (duplicateIndex > -1) {
      userReviews[duplicateIndex] = newReview;
    } else {
      userReviews.unshift(newReview);
    }
  }

  localStorage.setItem('pasopkan_reviews', JSON.stringify(userReviews));
  return newReview;
}

export function getUserReviewForEvent(eventId: string, userName: string): Review | null {
  const saved = localStorage.getItem('pasopkan_reviews');
  if (!saved) return null;
  try {
    const userReviews: Review[] = JSON.parse(saved);
    return userReviews.find(r => r.eventId === eventId && r.userName === userName) || null;
  } catch (e) {
    return null;
  }
}

export function getAverageRatingForEvent(eventId: string): { average: number; count: number } {
  const allReviews = getReviewsForEvent(eventId);
  if (allReviews.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
  return {
    average: Math.round((sum / allReviews.length) * 10) / 10,
    count: allReviews.length
  };
}
