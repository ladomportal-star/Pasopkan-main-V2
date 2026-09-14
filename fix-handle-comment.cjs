const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

const startStr = 'const handleCommentSubmit = async () => {';
const endStr = '  useEffect(() => {';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);
  
  const newFunction = "  const handleCommentSubmit = async () => {\\n" +
    "    if (!userComment.trim()) {\\n" +
    "      setCommentStatus({\\n" +
    "        type: 'error',\\n" +
    "        message: translations[lang].commentError\\n" +
    "      });\\n" +
    "      return;\\n" +
    "    }\\n" +
    "\\n" +
    "    const activeUser = user;\\n" +
    "    if (!activeUser) {\\n" +
    "      setCommentStatus({\\n" +
    "        type: 'error',\\n" +
    "        message: lang === 'en' ? 'You must be logged in to comment.' : 'ທ່ານຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນເພື່ອອອກຄວາມຄິດເຫັນ.'\\n" +
    "      });\\n" +
    "      return;\\n" +
    "    }\\n" +
    "\\n" +
    "    setCommentStatus({ type: 'submitting', message: '' });\\n" +
    "\\n" +
    "    const anonymousName = lang === 'en' ? 'Anonymous User' : 'ຜູ້ໃຊ້ບໍ່ປະສົງອອກຊື່';\\n" +
    "\\n" +
    "    const reviewData = {\\n" +
    "      eventId: id,\\n" +
    "      userId: activeUser.id,\\n" +
    "      rating: userRating,\\n" +
    "      comment: userComment.trim(),\\n" +
    "      userName: isAnonymous ? anonymousName : (getAccountUserName() || anonymousName),\\n" +
    "      userRealName: getAccountUserName(),\\n" +
    "      date: new Date().toISOString().slice(0, 10)\\n" +
    "    };\\n" +
    "\\n" +
    "    const mockId = `mock_rev_${Math.random().toString(36).substring(2, 11)}`;\\n" +
    "    saveReview({\\n" +
    "      id: mockId,\\n" +
    "      ...reviewData\\n" +
    "    });\\n" +
    "\\n" +
    "    setUserComment('');\\n" +
    "    setUserRating(5);\\n" +
    "    \\n" +
    "    setCommentStatus({\\n" +
    "      type: 'success',\\n" +
    "      message: translations[lang].commentSuccess\\n" +
    "    });\\n" +
    "\\n" +
    "    setTimeout(() => {\\n" +
    "      setCommentStatus(prev => prev.type === 'success' ? { type: 'idle', message: '' } : prev);\\n" +
    "    }, 5000);\\n" +
    "  };\\n\\n";

  content = before + newFunction + after;
  fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
}
