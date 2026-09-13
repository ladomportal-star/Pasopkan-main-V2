const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

content = content.replace(
  `      if (user) {
        try {
          await supabase.from('organizer_inquiries').insert(messageData);
        } catch (err) {
          console.warn('Could not save to Supabase, fallback to local storage:', err);
        }
      }
          safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));
        }
      } else {`,
  `      if (user) {
        try {
          await supabase.from('organizer_inquiries').insert(messageData);
        } catch (err) {
          console.warn('Could not save to Supabase, fallback to local storage:', err);
          const savedInquiries = JSON.parse(safeStorage.getItem('pasopkan_local_inquiries') || '[]');
          savedInquiries.push({ id: \`inq_\${Date.now()}\`, ...messageData });
          safeStorage.setItem('pasopkan_local_inquiries', JSON.stringify(savedInquiries));
        }
      } else {`
);

fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
