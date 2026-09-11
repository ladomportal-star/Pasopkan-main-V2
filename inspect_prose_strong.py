# Look at the default content in the editor:
# <p className="font-bold mb-2">{t.intro}</p>
# <p className="mb-4 text-gray-400">{t.introPlaceholder}</p>
# <p className="font-bold mb-2">{t.details}</p>
# <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-600">
#   <li><strong>{t.mainProgram}</strong> {t.mainProgramDesc}</li>
#   <li><strong>{t.guests}</strong> {t.guestsDesc}</li>
#   <li><strong>{t.specialExperience}</strong> {t.specialExperienceDesc}</li>
# </ul>
# <p className="font-bold mb-2">{t.termsAndConditions}</p>
# <p className="mb-2 text-gray-600">{t.tncEvent}</p>
#
# Now what does Tailwind's .prose and .prose-slate do to <strong>, <p>, <span>?
# In @tailwindcss/typography:
# .prose strong { color: var(--tw-prose-bold); font-weight: 600; }
# .prose :where(p):not(:where([class~="not-prose"] *)) { color: var(--tw-prose-body); }
# When document.execCommand('styleWithCSS', false, 'true') executes:
# If you select "Main Program:" (which is inside <strong>):
# Chromium wraps it in:
# <strong><span style="color: rgb(...)">Main Program:</span></strong>
# Does .prose strong override <span style="color: ...">?
# No, span has inline style!
# BUT what if the user selected text across elements, or what if document.execCommand('styleWithCSS', false, 'true') didn't work?
# Wait! What if document.execCommand('styleWithCSS', false, 'true') creates:
# <span style="color: #FF5500;">
# BUT why did the user say:
# "still have bug with feature custom color if custom by text color with not correct"
# Let's break down EVERY reason custom color might be wrong:
#
# Reason 1: Focus & Selection loss when clicking Custom Color button or label.
# As discovered earlier, clicking on <label> or <input type="color"> causes blur on the editor.
# When the editor blurs, if savedSelectionRange was overwritten by onMouseDown with a collapsed or empty range,
# applyToolbarTextColor doesn't find a valid selection, so it doesn't color the selected text at all!
# Instead, the text stays the old color, which is "not correct"!
#
# Reason 2: The color format!
# What if the user types a hex color into the text box, e.g. "3b82f6" or "ff0000" or "#00ff00"?
# In the current code:
# <input
#   type="text"
#   value={selectedTextColor.toUpperCase()}
#   onChange={(e) => {
#     const val = e.target.value.trim();
#     if (/^#?[0-9A-Fa-f]{6}$/.test(val)) {
#       applyToolbarTextColor(val.startsWith('#') ? val : `#${val}`, false);
#     } else {
#       setSelectedTextColor(val);
#     }
#   }}
# />
# Look at this:
# While the user is typing (e.g. typing "#", then "F", then "F", then "0"),
# setSelectedTextColor(val) sets selectedTextColor to "#", "#F", "#FF", "#FF0"!
# Then the component re-renders:
# The <input type="color" value={selectedTextColor} /> receives value="#FF"!
# BUT according to the HTML5 specification for `<input type="color">`:
# "The value attribute, if specified and not empty, must have a value that is a valid simple color, which is a string that consists of exactly seven characters: a '#' followed by six hexadecimal digits.
# If the value is not a valid simple color, the user agent must set the value to '#000000' (black)!"
# AND IN CHROMIUM:
# When <input type="color" value="#FF"> renders, Chromium throws a console error:
# "The specified value '#FF' does not conform to the required format. The format is '#rrggbb' where rr, gg, bb are two-digit hexadecimal numbers."
# AND resets its internal value to #000000!
# Then when the user finishes typing or clicks, the color gets set to #000000 (black) or reverts, which is NOT the color the user entered!
#
# Reason 3:
# Look at what happens when the user picks a color with the native color picker:
# <label className="... overflow-hidden relative">
#   <Plus ... />
#   <input ref={colorInputRef} type="color" ... />
# </label>
# And:
# <label className="...">
#   <input type="color" ... />
# </label>
# There are TWO <input type="color"> elements in the same dropdown!
# One in the grid (+ button), and one in the footer ("Custom:" row)!
# Both have value={selectedTextColor}.
# When the user clicks the one in the footer or the grid, they might conflict or cause double events.
#
# Reason 4:
# Look at how the color is actually applied to the DOM in applyToolbarTextColor:
# Let's inspect the exact code!
