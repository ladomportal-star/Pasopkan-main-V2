const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

content = content.replace(
  /import \{ collection, query, where, onSnapshot, doc, setDoc, getDocs \} from 'firebase\/firestore';\nimport \{ db, auth, handleFirestoreError, OperationType \} from '\.\.\/lib\/firebase';/,
  'import { supabase } from "../lib/supabase";'
);

// Replace "organizer_inquiries" logic
content = content.replace(
  /\/\/ Try sending to firebase first[\s\S]*?\} catch \(fbErr\) \{[\s\S]*?console\.warn\('Could not save to Firestore collection, fallback to local storage:', fbErr\);[\s\S]*?\}[\s\S]*?\}/m,
  `if (user) {
        try {
          await supabase.from('organizer_inquiries').insert(messageData);
        } catch (err) {
          console.warn('Could not save to Supabase, fallback to local storage:', err);
        }
      }`
);

// Replace "Check Firestore tickets collection" logic
content = content.replace(
  /\/\/ Check Firestore tickets collection[\s\S]*?const ticketsRef = collection\(db, 'tickets'\);[\s\S]*?const q = query\(ticketsRef, where\('eventId', '==', event\.id\), where\('userId', '==', user\.uid\)\);[\s\S]*?const querySnapshot = await getDocs\(q\);[\s\S]*?if \(!querySnapshot\.empty\) \{[\s\S]*?hasTicket = true;[\s\S]*?\}[\s\S]*?\} catch \(err\) \{[\s\S]*?handleFirestoreError\(err, OperationType\.LIST, 'tickets'\);[\s\S]*?\}/m,
  `try {
              const { data, error } = await supabase.from('tickets').select('id').eq('event_id', event.id).eq('user_id', user.id).limit(1);
              if (data && data.length > 0 && !error) {
                hasTicket = true;
              }
            } catch (err) {
              console.error(err);
            }`
);

// Replace saving reviews logic
content = content.replace(
  /try \{[\s\S]*?if \(auth\.currentUser\) \{[\s\S]*?const reviewRef = doc\(collection\(db, 'reviews'\)\);[\s\S]*?await setDoc\(reviewRef, newReview\);[\s\S]*?\}[\s\S]*?\} catch \(error\) \{[\s\S]*?handleFirestoreError\(error, OperationType\.CREATE, 'reviews'\);[\s\S]*?\}/m,
  `try {
        if (user) {
          await supabase.from('reviews').insert({
            event_id: newReview.eventId,
            user_id: user.id,
            user_name: newReview.userName,
            rating: newReview.rating,
            comment: newReview.comment,
            created_at: newReview.createdAt
          });
        }
      } catch (error) {
        console.error(error);
      }`
);

// Replace listening to real-time reviews logic
content = content.replace(
  /\/\/ Listen to real-time reviews from Firestore for this event[\s\S]*?const reviewsRef = collection\(db, 'reviews'\);[\s\S]*?const q = query\(reviewsRef, where\('eventId', '==', event\.id\)\);[\s\S]*?const unsubscribe = onSnapshot\(q, \(snapshot\) => \{[\s\S]*?const firestoreReviews: any\[\] = \[\];[\s\S]*?snapshot\.forEach\(\(doc\) => \{[\s\S]*?firestoreReviews\.push\(\{[\s\S]*?\.\.\.doc\.data\(\)[\s\S]*?\}\);[\s\S]*?\}\);[\s\S]*?\/\/ Sort Firestore reviews by date\/createdAt descending[\s\S]*?firestoreReviews\.sort\(\(a, b\) => \{[\s\S]*?return new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)\.getTime\(\);[\s\S]*?\}\);[\s\S]*?const localReviews = getReviewsForEvent\(event\.id\)\.filter\(mock => !firestoreReviews\.some\(fire => fire\.eventId === mock\.eventId && \(fire\.comment === mock\.comment || fire\.id === mock\.id\)\)\);[\s\S]*?const combined = \[\.\.\.firestoreReviews, \.\.\.localReviews\];[\s\S]*?setReviews\(combined\);[\s\S]*?\}, \(err\) => \{[\s\S]*?handleFirestoreError\(err, OperationType\.GET, 'reviews'\);[\s\S]*?\}\);[\s\S]*?return \(\) => unsubscribe\(\);/m,
  `const fetchReviews = async () => {
      try {
        const { data, error } = await supabase.from('reviews').select('*').eq('event_id', event.id).order('created_at', { ascending: false });
        if (data && !error) {
          const supabaseReviews = data.map((r: any) => ({
            id: r.id,
            eventId: r.event_id,
            userId: r.user_id,
            userName: r.user_name,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at
          }));
          const localReviews = getReviewsForEvent(event.id).filter(mock => !supabaseReviews.some(fire => fire.eventId === mock.eventId && (fire.comment === mock.comment || fire.id === mock.id)));
          setReviews([...supabaseReviews, ...localReviews]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchReviews();
    
    // Subscribe to realtime updates for this event's reviews
    const channel = supabase
      .channel('public:reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: \`event_id=eq.\${event.id}\` }, payload => {
        fetchReviews();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };`
);

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
