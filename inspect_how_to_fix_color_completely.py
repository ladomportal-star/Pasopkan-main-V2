# Look at all those places trying to setSavedSelectionRange on click/mousedown:
# 3679, 3685, 3727, 3733, 3772, 3786, 3792, 3827...
# When user clicks a button, window.getSelection() might already be collapsed or moved to the button!
# If we store savedSelectionRangeRef = useRef<Range | null>(null), AND in document 'selectionchange':
# whenever window.getSelection() has an uncollapsed range inside editorRef.current, we save it immediately!
#
# AND in applyToolbarTextColor:
# 1. Let's see:
# const getActiveRange = () => {
#   const sel = window.getSelection();
#   if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
#     return sel.getRangeAt(0);
#   }
#   if (savedSelectionRangeRef.current && editorRef.current && editorRef.current.contains(savedSelectionRangeRef.current.commonAncestorContainer)) {
#     return savedSelectionRangeRef.current;
#   }
#   return null;
# };
#
# 2. How to apply color in contentEditable:
# When range is active:
# If we restore the range:
# const sel = window.getSelection();
# sel.removeAllRanges();
# sel.addRange(range);
#
# Then:
# document.execCommand('styleWithCSS', false, 'true');
# document.execCommand('foreColor', false, formattedColor);
#
# PLUS, to ensure the color is 100% applied even if Chrome wraps it strangely:
# If range is within editorRef.current:
# We can find all elements intersecting the range that have font[color] or style="color: ...":
# If Chrome generated <font color="...">:
# editorRef.current.querySelectorAll('font[color]').forEach(el => {
#   (el as HTMLElement).style.color = formattedColor;
#   (el as HTMLElement).style.setProperty('color', formattedColor, 'important');
# });
# And for any span created by execCommand, ensure its style.color is set with !important.
#
# 3. What about the text input in the custom color picker?
# User said: "still have bug with feature custom color if custom by text color with not correct"
# Notice: "if custom by text color with not correct"
# That literally refers to:
# "Custom by text [input] color is not correct!"
# Because we added a text input:
# <input type="text" value={selectedTextColor.toUpperCase()} onChange=... />
# When the user tried to change the color by typing into that text box, it was NOT working or not correct!
# Why was it not working?
# 1) As soon as the user clicked inside the text input <input type="text">,
#    the focus left the editor and entered the input box!
# 2) While typing in the text box, on each keystroke, the user's cursor is in the text box.
# 3) When they type "3B82F6", before typing 6 letters, setSelectedTextColor(val) sets it to invalid color.
# 4) If they typed a valid color, applyToolbarTextColor ran, but since the focus was in the input box,
#    window.getSelection() was the text box, and savedSelectionRange was overwritten or collapsed!
#    So the color in the editor DID NOT CHANGE!
# 5) Then when they exited or pressed enter, nothing had changed on the text in the editor!
