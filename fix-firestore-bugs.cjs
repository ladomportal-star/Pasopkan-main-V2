const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

// 1. Fix contact form (Organizer Inquiries)
const oldContact = `      // Try sending to firebase first
      if (auth.currentUser) {
        try {
          const inquiryRef = doc(collection(db, 'organizer_inquiries'));
          await setDoc(inquiryRef, messageData);
        } catch (fbErr) {
          console.warn('Could not save to Firestore collection, fallback to local storage:', fbErr);
          // Standard local storage backup
          const savedInquiries = JSON.parse(safeStorage.getItem('pasopkan_local_inquiries') || '[]');
          savedInquiries.push({ id: \`inq_\${Date.now()}\`, ...messageData });
          safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));
        }
      } else {
        // Local storage backup
        const savedInquiries = JSON.parse(safeStorage.getItem('pasopkan_local_inquiries') || '[]');
        savedInquiries.push({ id: \`inq_\${Date.now()}\`, ...messageData });
        safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));
      }`;

const newContact = `      // Local storage backup
      const savedInquiries = JSON.parse(safeStorage.getItem('pasopkan_local_inquiries') || '[]');
      savedInquiries.push({ id: \`inq_\${Date.now()}\`, ...messageData });
      safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));`;

content = content.replace(oldContact, newContact);

// 2. Fix ticket check
const oldTicketCheck = `      // Check Firestore tickets collection
      const activeUser = user;
      if (activeUser) {
        if (activeUser) {
          try {
            const ticketsRef = collection(db, 'tickets');
            const q = query(
              ticketsRef,
              where('userId', '==', activeUser.uid),
              where('eventId', '==', id)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              setHasPurchasedTicket(true);
              return;
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, 'tickets');
          }
        } else {
          // Fallback to localStorage for mock/offline session
          const purchasedIdsStr = localStorage.getItem('pasopkan_purchased_event_ids');
          if (purchasedIdsStr) {
            try {
              const purchasedIds = JSON.parse(purchasedIdsStr);
              if (purchasedIds.includes(id)) {
                setHasPurchasedTicket(true);
                return;
              }
            } catch (e) {}
          }
        }
      }`;

const newTicketCheck = `      // Check local purchased tickets
      const purchasedIdsStr = localStorage.getItem('pasopkan_purchased_event_ids');
      if (purchasedIdsStr) {
        try {
          const purchasedIds = JSON.parse(purchasedIdsStr);
          if (purchasedIds.includes(id)) {
            setHasPurchasedTicket(true);
            return;
          }
        } catch (e) {}
      }`;

content = content.replace(oldTicketCheck, newTicketCheck);

// 3. Fix reviews submission
const oldReview = `    if (activeUser) {
      try {
        const reviewRef = doc(collection(db, 'reviews'));
        await setDoc(reviewRef, reviewData);
        // Local fallback / sync
        saveReview({
          id: reviewRef.id,
          ...reviewData
        });
        
        // Reset form except name
        setUserComment('');
        setUserRating(5);
        setCommentStatus({
          type: 'success',
          message: translations[lang].commentSuccess
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setCommentStatus(prev => prev.type === 'success' ? { type: 'idle', message: '' } : prev);
        }, 5000);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'reviews');
      }
    } else {
      // Mock / Local fallback mode
      const mockId = \`mock_rev_\${Math.random().toString(36).substring(2, 11)}\`;
      saveReview({
        id: mockId,
        ...reviewData
      });
      setUserComment('');
      setUserRating(5);
      
      setCommentStatus({
        type: 'success',
        message: translations[lang].commentSuccess
      });

      setTimeout(() => {
        setCommentStatus(prev => prev.type === 'success' ? { type: 'idle', message: '' } : prev);
      }, 5000);
    }`;

const newReview = `    const mockId = \`mock_rev_\${Math.random().toString(36).substring(2, 11)}\`;
    saveReview({
      id: mockId,
      ...reviewData
    });
    
    // Reset form except name
    setUserComment('');
    setUserRating(5);
    
    setCommentStatus({
      type: 'success',
      message: translations[lang].commentSuccess
    });

    setTimeout(() => {
      setCommentStatus(prev => prev.type === 'success' ? { type: 'idle', message: '' } : prev);
    }, 5000);`;

content = content.replace(oldReview, newReview);

// Remove activeUser.uid from reviewData
content = content.replace('userId: activeUser.uid,', 'userId: activeUser.id,');

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
