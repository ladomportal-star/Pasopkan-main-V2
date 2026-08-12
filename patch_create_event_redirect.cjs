const fs = require('fs');
let content = fs.readFileSync('src/pages/CreateEvent.tsx', 'utf8');

const targetBtn = `setShowSuccessModal(false); navigate('/account', { state: { targetTab: 'my-event' } });`;
const newBtn = `setShowSuccessModal(false); if (searchParams.get('adminEdit')) { navigate('/admin'); } else { navigate('/account', { state: { targetTab: 'my-event' } }); }`;

content = content.replace(targetBtn, newBtn);
fs.writeFileSync('src/pages/CreateEvent.tsx', content);
