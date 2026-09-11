# Look at the user's message:
# "still have bug with feature custom color if custom by text color with not correct"
# Notice what we did in the previous step:
# 1. We added an <input type="text" value={selectedTextColor.toUpperCase()} onChange=... />
# When typing:
# if (/^#?[0-9A-Fa-f]{6}$/.test(val)) {
#   applyToolbarTextColor(val.startsWith('#') ? val : `#${val}`, false);
# } else {
#   setSelectedTextColor(val);
# }
# Wait! When typing into this input field:
# As soon as the user focuses on the text input <input type="text" ... /> or types in it, WHAT HAPPENS TO THE SELECTION RANGE?
# 1) When user clicks on the text input to type, document selection changes to the text inside the input, OR the selection in the editor is lost or collapsed!
# 2) If the user types "FF0000" or "#FF0000", `val` starts as "F", then "FF", then "FF0", etc. During this time, setSelectedTextColor(val) sets selectedTextColor to invalid hex like "F", "#FF", etc.!
# If selectedTextColor is "F", then the next render does <input type="color" value={selectedTextColor} /> which CRASHES or resets in browser because <input type="color"> MUST be a 7-character lowercase hex format like "#ff0000"! If value="F" or "#F", <input type="color"> falls back to #000000!
# AND if the user types in the input box, their selection was in the editor, but clicking into the text box cleared or moved window.getSelection()!
# AND in the custom color picker:
# Look at the custom color trigger:
# <label className="... relative overflow-hidden" title="Custom Color (+)">
#   <Plus className="w-3.5 h-3.5 pointer-events-none" />
#   <input ref={colorInputRef} type="color" ... />
# </label>
# And below:
# <label className="... relative">
#   <span>Custom:</span>
#   <div className="... overflow-hidden relative">
#     <input type="color" ... />
#   </div>
# </label>
# <input type="text" ... />
#
# But wait! Look at the user's exact phrase:
# "still have bug with feature custom color if custom by text color with not correct"
# What does "if custom by text color with not correct" mean?
# Could "text color" mean:
# A) typing text in the custom hex text box?
# B) Or when they pick a custom color, the text's color in the editor doesn't actually turn into that custom color (or it's not the correct color / not applying correctly to the selected text)?
# C) Or both!
