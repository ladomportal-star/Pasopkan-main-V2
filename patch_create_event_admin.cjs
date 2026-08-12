const fs = require('fs');
let content = fs.readFileSync('src/pages/CreateEvent.tsx', 'utf8');

// replace the edit blocking logic
const searchParamCheck = `    const editId = searchParams.get('editId') || location.state?.editEventId;
    if (editId && localEvents.length > 0) {
      setShowEditBlockedModal(true);
    }`;

const newSearchParamCheck = `    const editId = searchParams.get('editId') || location.state?.editEventId;
    const adminEditId = searchParams.get('adminEdit');
    if (adminEditId && localEvents.length > 0) {
      const evt = localEvents.find(e => e.id === adminEditId);
      if (evt) {
        handleStartEdit(evt);
        setActiveTab('createEvent');
      }
    } else if (editId && localEvents.length > 0) {
      setShowEditBlockedModal(true);
    }`;

content = content.replace(searchParamCheck, newSearchParamCheck);
fs.writeFileSync('src/pages/CreateEvent.tsx', content);
