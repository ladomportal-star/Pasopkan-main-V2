const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Checkout.tsx', 'utf8');
content = content.replace(
  /import \{ doc, setDoc, collection \} from "firebase\/firestore";\nimport \{ db, auth, handleFirestoreError, OperationType \} from "\.\.\/lib\/firebase";/,
  'import { supabase } from "../lib/supabase";'
);
content = content.replace(
  /const createFirestoreTicket = async \(\) => \{[\s\S]*?createFirestoreTicket\(\);/m,
  `const createSupabaseTicket = async () => {
        if (!user) return;
        try {
          const { error } = await supabase.from('tickets').insert({
            user_id: user.id,
            event_id: event.id,
            ticket_type: state.ticketType,
            quantity: state.quantity,
            total_price: finalTotal,
            status: 'valid'
          });
          if (error) throw error;
        } catch (err: any) {
          console.error("Failed to sync ticket to database:", err);
        }
      };

      createSupabaseTicket();`
);
fs.writeFileSync('Frontend/src/pages/Checkout.tsx', content);
