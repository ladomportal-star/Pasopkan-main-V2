# Look at lines 2236-2240:
# useEffect(() => {
#   if (activeStep === 1 && editorRef.current && editorContent !== null) {
#     editorRef.current.innerHTML = editorContent;
#   }
# }, [activeStep, editorContent]);
#
# When `setEditorContent(editorRef.current.innerHTML)` is called on the FIRST color change:
# React triggers a re-render!
# The useEffect runs because `editorContent` changed!
# `editorRef.current.innerHTML = editorContent;` REPLACES ALL DOM NODES inside editorRef.current!
# When `editorRef.current.innerHTML` is reassigned:
# ALL existing DOM Nodes (and ranges attached to them) are DETACHED from the DOM!
# `rangeToUse.commonAncestorContainer` is now a detached node!
# `editorRef.current.contains(rangeToUse.commonAncestorContainer)` returns FALSE!
# AND window.getSelection() is completely WIPED OUT!
# So on the 2nd time the user changes the color:
# `rangeToUse` is DETACHED!
# `editorRef.current.contains(rangeToUse.commonAncestorContainer)` is FALSE!
# So it falls into `else { ... }` and does NOTHING to the text!
