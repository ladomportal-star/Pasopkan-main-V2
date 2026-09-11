# Let's think:
# How should range saving work?
# 1) We want a ref: savedSelectionRangeRef = useRef<Range | null>(null);
# Why a ref instead of or in addition to state?
# Because state updates are asynchronous (queued in React)!
# When rapid events like `onInput` fire 60 times a second while dragging the color picker,
# React state `savedSelectionRange` is STALE or queued!
# With a ref, `savedSelectionRangeRef.current` is ALWAYS immediately up to date synchronously!
#
# 2) When should savedSelectionRangeRef.current be captured?
# - In the editor:
#   Whenever the user selects text or releases mouse or presses key in the editor:
#   const sel = window.getSelection();
#   if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
#     savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
#   }
# - In document 'selectionchange' event listener!
#   When the document's selection changes:
#   if the selection is within editorRef.current and NOT collapsed:
#   savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
#   This is the standard, foolproof way Google Docs, Notion, TipTap, Quill, and Medium keep track of active text selection!
#   Because document.addEventListener('selectionchange', ...) fires whenever any selection changes, but we ONLY store it if it is inside editorRef.current and NOT collapsed!
#   If the user clicks outside or clicks a button, selectionchange might collapse the selection, BUT WE DO NOT OVERWRITE OUR SAVED RANGE if the new selection is outside or collapsed!
#   We KEEP the savedRange intact!
#
# 3) Now what happens when user changes color (either preset, custom color picker onInput/onChange, or typing hex)?
# - We check savedSelectionRangeRef.current.
# - Is it non-null, inside editorRef.current, and not collapsed?
# - YES!
# - We restore it:
#   const sel = window.getSelection();
#   sel.removeAllRanges();
#   sel.addRange(savedSelectionRangeRef.current);
# - NOW: How do we apply the color?
#   Let's check how to guarantee the text actually changes color to the exact color requested:
#
#   Let's test both document.execCommand and DOM manipulation.
#   In HTML contentEditable:
#   If document.execCommand('styleWithCSS', false, 'true') is called:
#   document.execCommand('foreColor', false, formattedColor);
#
#   WAIT! Does document.execCommand('foreColor', false, formattedColor) change the range?
#   When execCommand('foreColor') finishes:
#   In WebKit/Blink (Chrome, Edge, Safari):
#   The browser keeps the text selected!
#   AND we can update savedSelectionRangeRef.current with the new active range!
#   AND wait! What if the selected text had existing nested styling or prose class?
#   Let's check:
#   When document.execCommand('foreColor', false, formattedColor) executes:
#   Does it wrap the selected text with <span style="color: rgb(...)">?
#   YES!
#   AND in addition:
#   What if the text had an existing <span style="color: ..."> or <font color="...">?
#   We can also query all elements inside the selection:
#   For any node inside the range, if it's a span or font with color, update its style.color = formattedColor.
#   AND what if the user typed text that is inside <p className="... text-gray-400">?
#   Since <span style="color: formattedColor"> is INSIDE the <p>, inline style has higher specificity!
#
# 4) What about typing HEX code in the text box?
#   When the user types HEX in the input box:
#   e.g. user types "3B82F6" or "#FF0055":
#   If user types or pastes a valid 3-digit or 6-digit hex:
#   applyToolbarTextColor(hex, false);
#   Because savedSelectionRangeRef.current was preserved (never cleared when focusing the hex input!),
#   the selected text in the editor immediately updates to that hex color!
