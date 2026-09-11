# Let's check how selection listener can be mounted in useEffect
#
# useEffect(() => {
#   const handleSelectionChange = () => {
#     const sel = window.getSelection();
#     if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
#       const range = sel.getRangeAt(0);
#       if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
#         savedSelectionRangeRef.current = range.cloneRange();
#         setSavedSelectionRange(range.cloneRange());
#       }
#     }
#   };
#   document.addEventListener('selectionchange', handleSelectionChange);
#   return () => document.removeEventListener('selectionchange', handleSelectionChange);
# }, []);
