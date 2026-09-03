import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, MapPin, ChevronRight, Inbox, RefreshCw, Sparkles, Star, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { events } from '../data/events';
import { useLanguage } from '../context/LanguageContext';
import { saveReview, getUserReviewForEvent } from '../data/reviews';
import SEO from '../components/SEO';

const translations = {
  en: {
    back: 'Back',
    title: 'Past Events Attended',
    clearHistory: 'Clear History',
    restoreHistory: 'Restore Sample History',
    noPastEventsTitle: 'No Past Events Yet',
    noPastEventsDesc: 'Your past event history is currently empty. Once you purchase tickets and attend an experience, it will be beautifully recorded here.',
    exploreUpcoming: 'Explore Upcoming Events',
    loading: 'Loading your event history...',
    clearedSuccess: 'History cleared',
    restoredSuccess: 'Sample history restored',
    rateReview: 'Rate & Review',
    editReview: 'Edit Review',
    viewEvent: 'View Event',
    reviewed: 'Reviewed',
    submitReview: 'Submit Review',
    writeReviewFor: 'Write a Review for',
    yourRating: 'Your Rating',
    yourReview: 'Your Review',
    reviewPlaceholder: 'Share your genuine experience with this activity...',
    cancel: 'Cancel',
    reviewSaved: 'Thank you! Review saved successfully.',
    anonymous: 'Anonymous',
  },
  lo: {
    back: 'ກັບຄືນ',
    title: 'ກິດຈະກຳທີ່ຜ່ານມາ',
    clearHistory: 'ລຶບປະຫວັດ',
    restoreHistory: 'ກູ້ຄືນປະຫວັດຕົວຢ່າງ',
    noPastEventsTitle: 'ຍັງບໍ່ມີກິດຈະກຳທີ່ຜ່ານມາ',
    noPastEventsDesc: 'ປະຫວັດການເຂົ້າຮ່ວມກິດຈະກຳຂອງທ່ານແມ່ນວ່າງເປົ່າ. ເມື່ອທ່ານຊື້ປີ້ ແລະ ເຂົ້າຮ່ວມກິດຈະກຳ, ມັນຈະຖືກບັນທຶກໄວ້ຢູ່ນີ້.',
    exploreUpcoming: 'ຄົ້ນຫາກິດຈະກຳທີ່ຈະມາເຖິງ',
    loading: 'ກຳລັງໂຫຼດປະຫວັດກິດຈະກຳ...',
    clearedSuccess: 'ລຶບປະຫວັດສຳເລັດແລ້ວ',
    restoredSuccess: 'ກູ້ຄືນປະຫວັດຕົວຢ່າງສຳເລັດແລ້ວ',
    rateReview: 'ໃຫ້ຄະແນນ & ຣີວິວ',
    editReview: 'ແກ້ໄຂການຣີວິວ',
    viewEvent: 'ເບິ່ງກິດຈະກຳ',
    reviewed: 'ຣີວິວແລ້ວ',
    submitReview: 'ສົ່ງການຣີວິວ',
    writeReviewFor: 'ຂຽນຣີວິວສຳລັບ',
    yourRating: 'ຄະແນນຂອງທ່ານ',
    yourReview: 'ຄວາມຄິດເຫັນຂອງທ່ານ',
    reviewPlaceholder: 'ແບ່ງປັນປະສົບການທີ່ແທ້ຈິງຂອງທ່ານກັບກິດຈະກຳນີ້...',
    cancel: 'ຍົກເລີກ',
    reviewSaved: 'ຂອບໃຈ! ບັນທຶກການຣີວິວສຳເລັດແລ້ວ.',
    anonymous: 'ບໍ່ປະສົງອອກຊື່',
  }
};

// Interactive rating labels mapping
const ratingLabels: Record<'en' | 'lo', Record<number, string>> = {
  en: {
    1: "Needs Improvement 🥺",
    2: "Decent / Just OK 🫤",
    3: "Good Experience 🙂",
    4: "Great / Very Satisfied 🤩",
    5: "Amazing, Highly Recommend! 💖"
  },
  lo: {
    1: "ຄວນປັບປຸງ 🥺",
    2: "ພໍໃຊ້ໄດ້ 🫤",
    3: "ດີ, ປະທັບໃຈ 🙂",
    4: "ດີຫຼາຍ, ເພິ່ງພໍໃຈຫຼາຍ 🤩",
    5: "ດີເລີດ, ແນະນຳເລີຍ! 💖"
  }
};

// Quick Tags to click and easily append to the review
const quickTags: Record<'en' | 'lo', string[]> = {
  en: [
    "Great Atmosphere 🌟",
    "Amazing Staff 🙌",
    "Clean & Safe 🛡️",
    "Fun Activities 🎉",
    "Well Organized 🗓️",
    "Highly Recommended 💯"
  ],
  lo: [
    "ບັນຍາກາດດີຫຼາຍ 🌟",
    "ພະນັກງານບໍລິການດີ 🙌",
    "ສະອາດ & ປອດໄພ 🛡️",
    "ກິດຈະກຳມ່ວນຊື່ນ 🎉",
    "ຈັດງານໄດ້ດີຫຼາຍ 🗓️",
    "ແນະນຳເລີຍ 💯"
  ]
};

export default function PastEvents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  const [isLoading, setIsLoading] = useState(true);
  const [pastEvents, setPastEvents] = useState<typeof events>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeReviewEvent, setActiveReviewEvent] = useState<typeof events[0] | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reviewsByEvent, setReviewsByEvent] = useState<Record<string, any>>({});
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Helper to toggle quick suggestion tags
  const handleToggleTag = (tag: string) => {
    setReviewComment(prev => {
      if (prev.includes(tag)) {
        // Remove tag and cleanup any double spaces
        return prev.replace(tag, '').replace(/\s+/g, ' ').trim();
      } else {
        // Append tag
        return prev ? `${prev} ${tag}` : tag;
      }
    });
  };

  const getActiveName = () => {
    try {
      const saved = localStorage.getItem('pasopkan_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.firstName || parsed.lastName) {
          return `${parsed.firstName} ${parsed.lastName}`.trim();
        }
      }
    } catch (e) {}
    return 'Sirithida Souksavat';
  };

  const loadUserReviews = () => {
    try {
      const saved = localStorage.getItem('pasopkan_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        const name = getActiveName();
        const map: Record<string, any> = {};
        parsed.forEach((r: any) => {
          if (r.userName === name || r.userRealName === name) {
            map[r.eventId] = r;
          }
        });
        setReviewsByEvent(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenReviewModal = (event: typeof events[0]) => {
    const existing = reviewsByEvent[event.id];
    if (existing) {
      setReviewRating(existing.rating);
      setReviewComment(typeof existing.comment === 'object' ? (existing.comment[lang] || existing.comment.en || '') : existing.comment || '');
      setIsAnonymous(existing.userName === 'Anonymous User' || existing.userName === 'ຜູ້ໃຊ້ບໍ່ປະສົງອອກຊື່');
    } else {
      setReviewRating(5);
      setReviewComment('');
      setIsAnonymous(false);
    }
    setActiveReviewEvent(event);
  };

  const handleSaveReview = () => {
    if (!activeReviewEvent) return;
    
    const realName = getActiveName();
    const anonymousName = lang === 'en' ? 'Anonymous User' : 'ຜູ້ໃຊ້ບໍ່ປະສົງອອກຊື່';
    const userName = isAnonymous ? anonymousName : realName;
    const existing = reviewsByEvent[activeReviewEvent.id];

    saveReview({
      id: existing?.id,
      eventId: activeReviewEvent.id,
      userName,
      userRealName: realName,
      rating: reviewRating,
      comment: reviewComment,
    });

    loadUserReviews();
    setActiveReviewEvent(null);
    showToast(t.reviewSaved);
  };

  useEffect(() => {
    loadUserReviews();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Initialize with mock past events
      const saved = localStorage.getItem('pasopkan_past_events');
      if (saved) {
        setPastEvents(JSON.parse(saved));
      } else {
        const initialPast = events.slice(0, 3);
        setPastEvents(initialPast);
        localStorage.setItem('pasopkan_past_events', JSON.stringify(initialPast));
      }
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleClearHistory = () => {
    setPastEvents([]);
    localStorage.setItem('pasopkan_past_events', JSON.stringify([]));
    showToast(t.clearedSuccess);
  };

  const handleRestoreHistory = () => {
    const initialPast = events.slice(0, 3);
    setPastEvents(initialPast);
    localStorage.setItem('pasopkan_past_events', JSON.stringify(initialPast));
    showToast(t.restoredSuccess);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-2 sm:pt-3 pb-8 md:pb-12 animate-pulse flex flex-col items-center">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gray-200"></div>
            <div className="w-64 h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl">
                <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex gap-3">
                    <div className="w-1/4 h-3 bg-gray-100 rounded"></div>
                    <div className="w-1/3 h-3 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-2 sm:pt-3 pb-8 md:pb-12">
      <SEO
        title={t.title}
        description="View your past event attendance history and leave verified reviews for experiences in Laos."
        noindex={true}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white text-adv-slate hover:bg-gray-50 hover:text-adv-orange transition-all border border-gray-200 shadow-xs hover:shadow-sm cursor-pointer"
              title={t.back}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-adv-slate">{t.title}</h1>
          </div>
          
          {pastEvents.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded-full border border-red-100 transition-all cursor-pointer self-start sm:self-auto shadow-xs"
            >
              {t.clearHistory}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {pastEvents.length > 0 ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-gray-100 rounded-3xl p-3 sm:p-4 shadow-sm space-y-1"
            >
              {pastEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl hover:bg-gray-50/50 transition-all group border border-transparent hover:border-gray-100 bg-white">
                    <Link
                      to={`/event/${event.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:scale-[1.03] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-50 text-gray-500 group-hover:bg-adv-orange/10 group-hover:text-adv-orange transition-colors">
                            {event.category || 'Event'}
                          </span>
                        </div>
                        <h4 className="text-adv-slate font-bold truncate group-hover:text-adv-orange transition-colors text-sm sm:text-base">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-adv-orange transition-colors" />
                            {new Date(event.date).toLocaleDateString(lang === 'lo' ? 'lo-LA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Action Buttons: View Event and Rate/Edit Review (Identical heights and padding) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pl-20 sm:pl-0">
                      <button
                        onClick={() => navigate(`/event/${event.id}`, { state: { from: location.pathname + location.search } })}
                        className="h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black bg-slate-800 text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                      >
                        <span>{t.viewEvent}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {reviewsByEvent[event.id] ? (
                        <button
                          onClick={() => handleOpenReviewModal(event)}
                          className="h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                          <span>{reviewsByEvent[event.id].rating}.0</span>
                          <span className="text-[10px] text-amber-600 font-bold ml-0.5">({t.editReview})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenReviewModal(event)}
                          className="h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black bg-adv-orange/10 hover:bg-adv-orange text-adv-orange hover:text-white border border-adv-orange/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>{t.rateReview}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-16 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center relative overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              
              {/* Illustrative Icon Container */}
              <div className="relative mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50/60 rounded-full flex items-center justify-center text-adv-orange shadow-inner border border-orange-100/50">
                  <Inbox className="w-10 h-10 sm:w-12 sm:h-12 text-adv-orange stroke-[1.5]" />
                </div>
                <motion.div 
                  animate={{ y: [0, -6, 0] }} 
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1 bg-white p-2 rounded-2xl shadow-md border border-gray-50 flex items-center justify-center text-amber-500"
                >
                  <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
                </motion.div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-adv-slate mb-3">{t.noPastEventsTitle}</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm mb-8 font-medium">
                {t.noPastEventsDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link 
                  to="/" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-adv-orange text-white px-7 py-3.5 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {t.exploreUpcoming}
                </Link>
                
                <button
                  onClick={handleRestoreHistory}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-500 hover:text-adv-slate bg-gray-50 hover:bg-gray-100 border border-gray-200 px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.restoreHistory}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-12 left-1/2 bg-adv-slate text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10 text-sm"
          >
            <Sparkles className="w-4 h-4 text-adv-orange fill-adv-orange" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rate & Review Modal */}
      <AnimatePresence>
        {activeReviewEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-adv-orange">
                    <Star className="w-5 h-5 fill-adv-orange text-adv-orange" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-adv-slate leading-tight">{t.rateReview}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-0.5 truncate max-w-[240px]">
                      {activeReviewEvent.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReviewEvent(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Mini Info */}
              <div className="flex gap-4 p-3 bg-gray-50 rounded-2xl mb-6">
                <img
                  src={activeReviewEvent.image}
                  alt={activeReviewEvent.title}
                  className="w-12 h-12 rounded-xl object-cover shadow-inner shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black text-adv-slate truncate">{activeReviewEvent.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeReviewEvent.location}
                  </p>
                </div>
              </div>

              {/* Star Rating Selection */}
              <div className="mb-6 text-center">
                <label className="block text-xs font-black text-adv-slate uppercase tracking-wider mb-2">
                  {t.yourRating}
                </label>
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoveredStar ?? reviewRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="p-1 hover:scale-120 transition-transform duration-150 cursor-pointer text-center"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors ${
                            isFilled ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                {/* Dynamic Rating Label */}
                <div className="h-6 mt-2 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={hoveredStar ?? reviewRating}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs font-black text-amber-600 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-100 inline-block shadow-xs"
                    >
                      {ratingLabels[lang as 'en' | 'lo']?.[hoveredStar ?? reviewRating]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Reviewing As & Anonymous Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-2xl text-xs text-gray-500 font-medium w-full mb-5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-adv-orange shrink-0" />
                  <span>
                    {lang === 'en' ? 'Reviewing as:' : 'ຣີວິວໃນນາມ:'}{' '}
                    <strong className="text-adv-slate">
                      {isAnonymous ? (lang === 'en' ? 'Anonymous User' : 'ຜູ້ໃຊ້ບໍ່ປະສົງອອກຊື່') : getActiveName()}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className="flex items-center gap-2 hover:opacity-80 transition-all focus:outline-none cursor-pointer"
                >
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    {lang === 'en' ? 'Review Anonymously' : 'ຣີວິວແບບບໍ່ເປີດເຜີຍຊື່'}
                  </span>
                  <div className={`w-8 h-4.5 rounded-full transition-colors relative ${isAnonymous ? 'bg-adv-orange' : 'bg-gray-300'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-transform ${isAnonymous ? 'translate-x-3.5 left-[2px]' : 'translate-x-0 left-[2px]'}`} />
                  </div>
                </button>
              </div>

              {/* Written Review */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-adv-slate uppercase tracking-wider">
                    {t.yourReview}
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">
                    {reviewComment.length} {lang === 'en' ? 'chars' : 'ຕົວອັກສອນ'}
                  </span>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={t.reviewPlaceholder}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl focus:outline-none focus:ring-4 focus:ring-adv-orange/15 focus:border-adv-orange text-sm text-adv-slate font-medium placeholder-gray-400 resize-none transition-all shadow-inner"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveReviewEvent(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 hover:text-adv-slate hover:bg-gray-50 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveReview}
                  className="flex-1 py-3 bg-adv-orange text-white hover:bg-orange-600 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] cursor-pointer text-center"
                >
                  {t.submitReview}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
