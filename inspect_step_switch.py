# Let's inspect when activeStep changes from 2 -> 1, or initial load:
# When activeStep is 1:
# If user moves from step 1 to step 2, the editor unmounts (since step 1 is hidden).
# When user returns to step 1 from step 2, the editor mounts again!
# When it mounts, editorRef.current exists, but innerHTML is empty (or the default placeholders).
# At THAT moment, if editorContent is set, we want to restore editorContent to editorRef.current.innerHTML.
# BUT while activeStep === 1 and the user is actively working inside step 1,
# editorRef.current.innerHTML already has the user's latest content!
# It MUST NOT be overwritten on every editorContent state update!
