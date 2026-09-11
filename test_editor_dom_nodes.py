# Let's inspect line 2237:
# useEffect(() => {
#   if (activeStep === 1 && editorRef.current && editorContent !== null) {
#     editorRef.current.innerHTML = editorContent;
#   }
# }, [activeStep, editorContent]);
#
# Look at why that useEffect was written:
# When switching steps (e.g. going from Step 2 back to Step 1, or loading a draft from localStorage):
# The author wanted the editor to restore the draft content `editorContent`!
# BUT because `editorContent` was in the dependency array:
# Whenever ANY toolbar action (or color change) called `setEditorContent(editorRef.current.innerHTML)`:
# That useEffect triggered immediately after render!
# And it literally executed:
# `editorRef.current.innerHTML = editorContent;`
# This DOM overwrite destroyed all text nodes, selections, and ranges inside the editor!
# Not only that:
# Because innerHTML was reset to editorContent, any active text selection range died completely!
#
# Let's fix that useEffect!
# The editor should only populate from `editorContent` when step 1 mounts (or when switching back to step 1),
# NOT whenever editorContent is updated while user is currently typing or styling inside the editor!
# Even better:
# We can track whether step 1 just became active or initial draft was loaded:
# useEffect(() => {
#   if (activeStep === 1 && editorRef.current && editorContent !== null) {
#     // Only set innerHTML if the editor is currently empty or if switching back to step 1!
#     if (editorRef.current.innerHTML !== editorContent && !editorRef.current.contains(document.activeElement)) {
#       editorRef.current.innerHTML = editorContent;
#     }
#   }
# }, [activeStep]); // NOTE: only depend on activeStep, or check if not focused!
