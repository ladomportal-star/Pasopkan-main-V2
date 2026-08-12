const fs = require('fs');
let content = fs.readFileSync('src/pages/CreateEvent.tsx', 'utf8');

const searchParamCheck = `  useEffect(() => {
    const editId = searchParams.get('editId') || location.state?.editEventId;
    const adminEditId = searchParams.get('adminEdit');
    if (adminEditId && localEvents.length > 0) {
      const evt = localEvents.find(e => e.id === adminEditId);
      if (evt) {
        handleStartEdit(evt);
        setActiveTab('createEvent');
      }
    } else if (editId && localEvents.length > 0) {
      setShowEditBlockedModal(true);
    }
  }, [searchParams, location.state, localEvents]);`;

const newSearchParamCheck = `  const hasLoadedAdminEdit = useRef(false);
  useEffect(() => {
    const editId = searchParams.get('editId') || location.state?.editEventId;
    const adminEditId = searchParams.get('adminEdit');
    
    if (adminEditId && localEvents.length > 0 && !hasLoadedAdminEdit.current) {
      const evt = localEvents.find(e => e.id === adminEditId);
      if (evt) {
        handleStartEdit(evt);
        setActiveTab('createEvent');
        hasLoadedAdminEdit.current = true;
      }
    } else if (editId && localEvents.length > 0) {
      setShowEditBlockedModal(true);
    }
  }, [searchParams, location.state, localEvents]);`;

content = content.replace(searchParamCheck, newSearchParamCheck);
fs.writeFileSync('src/pages/CreateEvent.tsx', content);
