# If rangeToUse is restored:
# sel.removeAllRanges();
# sel.addRange(rangeToUse);
# BUT if rangeToUse was saved while the range was inside an input element or when the editor was blurred?
# Also what if the user types a custom color or changes the color in the picker:
# Look at applyToolbarTextColor:
#
# if (rangeToUse && !rangeToUse.collapsed && editorRef.current.contains(rangeToUse.commonAncestorContainer))
#
# Wait! When a user selects across multiple paragraphs, e.g. from <p> to <p>:
# rangeToUse.commonAncestorContainer is editorRef.current (the <div>).
# But what if rangeToUse has collapsed = false, BUT when color input opens:
# On Windows/Chrome/Mac, opening the native <input type="color"> color picker:
# The browser opens an OS-level or browser popup dialog!
# When that dialog is open, the main window loses focus!
# In some browsers, window.getSelection() becomes NULL or rangeCount becomes 0!
# When the color picker fires `onInput` or `onChange`:
# savedSelectionRange was saved... BUT is savedSelectionRange valid?
# Yes, if saved! But what if savedSelectionRange was overwritten by:
# onMouseDown on color picker:
# onMouseDown={(e) => {
#   const sel = window.getSelection();
#   if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
#     setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
#   }
# }}
# What if onMouseDown on the color picker happens AFTER the editor already lost focus or collapsed?
# If the editor already lost focus, window.getSelection() might already be collapsed or empty!
# Then savedSelectionRange is NOT updated or if it was collapsed, what was saved earlier?
