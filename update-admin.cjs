const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /import \{ doc, getDoc \} from 'firebase\/firestore';\nimport \{ db, auth, handleFirestoreError, OperationType \} from '\.\.\/lib\/firebase';/,
  'import { supabase } from "../lib/supabase";'
);

content = content.replace(
  /if \(auth\.currentUser && auth\.currentUser\.uid === user\.uid\) \{[\s\S]*?handleFirestoreError\(err, OperationType\.GET, `users\/\$\{user\.uid\}`\);\n\s*\}\n\s*\}/,
  `if (user.id) {
          try {
            const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (data && data.role === 'admin' && !error) {
              setIsAdminAuthenticated(true);
              sessionStorage.setItem('pasopkan_admin_authorized', 'true');
            }
          } catch (err) {
            console.error(err);
          }
        }`
);

fs.writeFileSync('Frontend/src/pages/AdminDashboard.tsx', content);
