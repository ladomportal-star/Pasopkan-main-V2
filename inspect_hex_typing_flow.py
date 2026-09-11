# Let's design the custom text color input properly so that:
# 1. Selection in the editor is preserved when focusing the custom color inputs (both native picker and HEX text input).
# 2. When the user types or pastes any hex code (with or without #, 3 or 6 chars, uppercase or lowercase):
#    - We maintain an input state `customHexInput` (e.g. initial: selectedTextColor).
#    - As the user types, `customHexInput` updates freely without breaking <input type="color">.
#    - If it's a valid hex (like #FF0000, FF0000, #F00, F00):
#      We parse the clean 6-digit hex.
#      We apply that color in REAL-TIME to the editor's selected text!
#    - There is also an explicit "✓" (Apply) button or pressing Enter to apply immediately and close/confirm!
# 3. For the native color picker (<input type="color">):
#    - Clicking the "+" button or the color swatch opens the color picker.
#    - Dragging the color picker fires `onInput` and updates the text in the editor IN REAL TIME!
#    - Also updates `customHexInput` so the text box shows the exact matching hex value!
# 4. Color application logic:
#    - Restores the saved selection range from `savedSelectionRangeRef.current`.
#    - If there is selected text, applies the exact color to it via document.execCommand('styleWithCSS', false, 'true') and document.execCommand('foreColor', false, hex).
#    - Also inspects all affected nodes in the selection to guarantee the inline style `color: ${hex} !important` is set.
#    - Updates the editor DOM and syncs `editorContent`.
#    - Keeps `savedSelectionRangeRef.current` pointing to the selection so multiple consecutive adjustments (drag slider or typing) continue to update the same text!
#    - If no text was selected, sets the color for subsequent typing.
