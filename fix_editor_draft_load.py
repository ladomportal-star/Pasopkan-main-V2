with open("Frontend/src/pages/CreateEvent.tsx", "r") as f:
    code = f.read()

# Notice:
# When component mounts:
# 1) hasInitializedEditorRef.current is false.
# 2) editorContent is initially null!
# 3) Then in useEffect([], ...) localStorage draft is parsed:
#    if (parsed.editorContent) setEditorContent(parsed.editorContent);
# If the activeStep effect only depends on [activeStep], it ran initially when editorContent was null,
# and wouldn't run when setEditorContent(parsed.editorContent) resolves!
# BUT if we depend on [activeStep, editorContent !== null], or track whether the draft was injected:
# Notice:
# We only want to inject into `editorRef.current.innerHTML` ONCE when a saved draft is first loaded or when navigating back into step 1 from step > 1!
# We NEVER want to inject when `editorContent` was set by the editor itself!
# We can track `isInternalEditorUpdateRef = useRef(false);`!
# When `setEditorContent(editorRef.current.innerHTML)` is called by the toolbar/editor,
# `isInternalEditorUpdateRef.current = true;`
# In the effect:
# if (isInternalEditorUpdateRef.current) {
#   isInternalEditorUpdateRef.current = false;
#   return;
# }
# If NOT internal (e.g. from draft load or step change), populate editorRef.current.innerHTML = editorContent!
# This is the gold standard design for rich text editors in React!
