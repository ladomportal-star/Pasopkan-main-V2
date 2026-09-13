const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

// 1. Imports
content = content.replace(
  /import \{ collection, query, where, onSnapshot, doc, setDoc, getDocs \} from 'firebase\/firestore';\nimport \{ db, auth, handleFirestoreError, OperationType \} from '\.\.\/lib\/firebase';/,
  `import { supabase } from '../lib/supabase';`
);

// 2. Remove auth.currentUser checks
content = content.replace(/const activeUser = user \|\| auth\.currentUser;/g, 'const activeUser = user;');
content = content.replace(/if \(auth\.currentUser && activeUser\.uid === auth\.currentUser\.uid\) \{/g, 'if (activeUser) {');

// 3. Inquiry submission
content = content.replace(
  /      \/\/ Try sending to firebase first\n      if \(auth\.currentUser\) \{\n        try \{\n          const inquiryRef = doc\(collection\(db, 'organizer_inquiries'\)\);\n          await setDoc\(inquiryRef, messageData\);\n        \} catch \(fbErr\) \{\n          console\.warn\('Could not save to Firestore collection, fallback to local storage:', fbErr\);\n          const savedInquiries = JSON\.parse\(safeStorage\.getItem\('pasopkan_local_inquiries'\) \|\| '\[\]'\);\n          savedInquiries\.push\(\{ id: \`inq_\$\{Date\.now\(\)\}\`, \.\.\.messageData \}\);\n          safeStorage\.setItem\('pasopkan_local_inquiries', JSON\.stringify\(savedInquiries\)\);\n        \}\n      \} else \{/,
  `      // Try sending to supabase first
      if (user) {
        try {
          await supabase.from('organizer_inquiries').insert(messageData);
        } catch (fbErr) {
          console.warn('Could not save to Supabase, fallback to local storage:', fbErr);
          const savedInquiries = JSON.parse(safeStorage.getItem('pasopkan_local_inquiries') || '[]');
          savedInquiries.push({ id: \`inq_\$\{Date.now()\}\`, ...messageData });
          safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));
        }
      } else {`
);

// 4. Ticket checking
content = content.replace(
  /            \/\/ Check Firestore tickets collection\n            try \{\n              const ticketsRef = collection\(db, 'tickets'\);\n              const q = query\(ticketsRef, where\('eventId', '==', event\.id\), where\('userId', '==', user\.uid\)\);\n              const querySnapshot = await getDocs\(q\);\n              \n              if \(!querySnapshot\.empty\) \{\n                hasTicket = true;\n              \}\n            \} catch \(err\) \{\n              handleFirestoreError\(err, OperationType\.LIST, 'tickets'\);\n            \}/,
  `            // Check Supabase tickets
            try {
              const { data, error } = await supabase.from('tickets').select('id').eq('event_id', event.id).eq('user_id', user.id);
              if (data && data.length > 0 && !error) {
                hasTicket = true;
              }
            } catch (err) {
              console.error(err);
            }`
);

// 5. Save review
content = content.replace(
  /      try \{\n        if \(auth\.currentUser\) \{\n          const reviewRef = doc\(collection\(db, 'reviews'\)\);\n          await setDoc\(reviewRef, newReview\);\n        \}\n      \} catch \(error\) \{\n        handleFirestoreError\(error, OperationType\.CREATE, 'reviews'\);\n      \}/,
  `      try {
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

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
