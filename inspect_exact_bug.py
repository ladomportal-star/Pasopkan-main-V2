with open("Frontend/src/pages/CreateEvent.tsx", "r") as f:
    code = f.read()

# Let's check how the preset colors worked:
# Preset colors button:
# <button
#   key={col.value}
#   type="button"
#   onMouseDown={(e) => e.preventDefault()}
#   onClick={() => applyToolbarTextColor(col.value, true)}
# >
# NOTICE:
# onMouseDown={(e) => e.preventDefault()} !
# Because e.preventDefault() was called onMouseDown, the focus DID NOT LEAVE THE EDITOR!
# The selection inside the editor REMAINED INTACT and was NOT blurred or collapsed!
# So for default preset colors, window.getSelection() was still active and valid!
#
# BUT FOR CUSTOM COLOR:
# 1) The <label> has:
#    onMouseDown={() => {
#      const sel = window.getSelection();
#      if (sel && sel.rangeCount > 0) {
#        setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
#      }
#    }}
#    NO e.preventDefault()!
# 2) When user clicks the <label> or <input type="color">, the click blurs the editor.
# 3) Even worse, the label's onMouseDown ran, and if the user previously clicked the dropdown button, the editor was already blurred, or the label click collapsed the selection.
# 4) And when the native color picker opens and the user picks a color:
#    `onInput` fires.
#    In `applyToolbarTextColor`:
#    `if (closeMenu) setShowColorMenu(false);`
#    `if (!closeMenu) setSavedSelectionRange(curSel.getRangeAt(0).cloneRange());`
#    If the editor is blurred or focus is in the color picker, `curSel` is EMPTY or COLLAPSED, so on the FIRST input tick, `savedSelectionRange` is overwritten with null or collapsed! On the second input tick, it has NO selection range!
# 5) Furthermore, what if the user clicked the text input or custom color button?
# 6) And what if the user selected text across elements or paragraphs?
# If we wrap the selection properly or use an isolated span with direct style, OR execute with restored selection and focus:
# Let's inspect how to make this 100% bulletproof!
