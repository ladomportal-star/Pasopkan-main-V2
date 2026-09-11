# Let's verify what happens when:
# 1. User selects text in the editor:
#    - 'selectionchange' event captures the range into savedSelectionRangeRef.current.
# 2. User clicks the 'A' color button in toolbar:
#    - onMouseDown e.preventDefault() prevents the editor selection from un-highlighting!
#    - Dropdown opens cleanly.
# 3. User clicks any quick swatch (e.g. Red, Blue, Charcoal):
#    - onMouseDown e.preventDefault() keeps editor focused.
#    - applyToolbarTextColor(col.value, true) applies the color, closes dropdown.
# 4. User clicks the native color picker (+) or custom color swatch:
#    - savedSelectionRangeRef.current has the exact highlighted text range.
#    - onInput fires in real time as the user drags through the spectrum in the OS color picker.
#    - applyToolbarTextColor(val, false) restores the range, executes foreColor, ensures exact color in style with !important, and updates savedSelectionRangeRef.current to the newly formatted range.
#    - The text changes color live on every mouse move!
# 5. User types a custom HEX code in the text box (e.g. typing "3B82F6"):
#    - input is controlled via `customHexInput`.
#    - As soon as 3 or 6 valid hex characters are entered, `normalizeHexColor` converts it (e.g. "3B82F6" -> "#3B82F6") and calls `applyToolbarTextColor(normalized, false)` in real time!
#    - The text in the editor updates in real time to the exact custom color typed!
#    - User can also hit Enter or click the "✓" button to apply and close!
