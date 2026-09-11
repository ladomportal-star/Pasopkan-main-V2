# Let's inspect how the image is inserted when dropped:
# if (range && editorRef.current?.contains(range.startContainer)) {
#   range.insertNode(imgToMove);
# } else if (editorRef.current) {
#   editorRef.current.appendChild(imgToMove);
# }
# Notice: If `imgToMove` was inside another paragraph or container:
# In DOM, `range.insertNode(imgToMove)` moves `imgToMove` from its old position to the new position in `range`!
# BUT what if range is collapsed inside a text node?
# `range.insertNode(imgToMove)` automatically splits the text node and puts `imgToMove` right there at the caret!
# What if the user drags over an existing block or image?
# If the cursor is near the top or bottom of a paragraph or header, or between paragraphs,
# `range.insertNode(imgToMove)` places the image right at that text position or block boundary!
# Furthermore, after insertion:
# If imgToMove is inserted inside an inline tag or paragraph, the browser renders it inline or block according to its style.
# To make sure it fits naturally, we can ensure its display is inline-block or block with max-w-full.
#
# Now let's check:
# "image on information event when drag and drop should be update real time position by cursor"
# What does "update real time position by cursor" mean?
# 1) When the user drags an image, the insertion caret position updates continuously in real time as the cursor moves!
# 2) A sleek, high-visibility drop indicator (cursor line with indicator dot/bar in theme orange #FF5500) shows the user in real time EXACTLY where the image will land!
# 3) The browser selection caret is also synchronized in real time to the mouse coordinates (`caretRangeFromPoint(e.clientX, e.clientY)`), so text responds immediately!
# 4) On drop (mouse release), the image is immediately inserted at the cursor's exact coordinates, selection is restored, and image bounding box selection is updated smoothly!
