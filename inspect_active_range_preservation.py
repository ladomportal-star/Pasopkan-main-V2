# Let's test the entire flow:
# 1. User selects text in editor.
# 2. savedSelectionRangeRef is updated to the selected range.
# 3. User clicks on color picker / changes custom color:
#    - We get `rangeToUse = savedSelectionRangeRef.current || window.getSelection()?.getRangeAt(0)`.
#    - If rangeToUse is valid:
#      - Restore selection:
#        const sel = window.getSelection();
#        sel.removeAllRanges();
#        sel.addRange(rangeToUse);
#      - Execute:
#        document.execCommand('styleWithCSS', false, 'true');
#        document.execCommand('foreColor', false, formattedColor);
#      - In Chrome, execCommand('foreColor') preserves the text selection on the newly colored span!
#      - We immediately update `savedSelectionRangeRef.current` with `sel.getRangeAt(0).cloneRange()`!
#      - SO THE NEXT COLOR CHANGE (when user drags color picker or picks another color)
#        WILL HAVE THE EXACT NEW RANGE ALREADY STORED!
#
# BUT WHY DID IT NOT WORK THE SECOND TIME PREVIOUSLY?
# Because:
# 1) `useEffect` on `[activeStep, editorContent]` ran and did:
#    `editorRef.current.innerHTML = editorContent;`
#    This WIPED OUT the entire DOM of the editor and DETACHED all nodes!
#    So `savedSelectionRangeRef.current` was pointing to a detached text node!
#    When `editorRef.current.contains(rangeToUse.commonAncestorContainer)` ran on the 2nd time:
#    It returned FALSE because the node was detached from the DOM!
#    So on the 2nd time, it fell into the `else` branch, which just focused editor and did foreColor at cursor (or nowhere), not changing the text!
#
# 2) Also, why call setEditorContent on every single color change?
#    In React, contentEditable innerHTML should NOT be controlled in real time by setting innerHTML = editorContent on every render,
#    because re-assigning innerHTML destroys the browser's native Undo/Redo stack and destroys selections!
#    `editorContent` is just used for form submissions, draft saving, and step transitions!
#    When saving draft or submitting or switching steps, we read `editorRef.current.innerHTML`.
#    Updating `editorContent` state is fine, BUT `editorRef.current.innerHTML = editorContent` MUST NOT be executed on every render when user is editing!
