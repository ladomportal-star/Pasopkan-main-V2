# Let's inspect caret coordinates from a Range:
# When range = document.caretRangeFromPoint(e.clientX, e.clientY) (or caretPositionFromPoint):
# range.getBoundingClientRect() gives the exact pixel coordinates of the insertion cursor!
# If range.getClientRects().length > 0 or range.getBoundingClientRect():
# const rect = range.getBoundingClientRect();
# In the editor container (which has relative positioning):
# const editorBox = editorRef.current.getBoundingClientRect();
# dropIndicatorRect = {
#   top: rect.top - editorBox.top,
#   left: rect.left - editorBox.left,
#   height: rect.height || 24,
# }
# If rect is empty or 0-width (e.g. between block elements), we can calculate based on nearest child element or clientY!
# And during `onDragOver`:
# - We set `dropIndicatorPos({ x, y, height, width })`
# - And we also set the browser's native selection caret to that range via `sel.removeAllRanges(); sel.addRange(range)` so the native cursor also pulses at that exact position!
# - When `onDragLeave` or `onDrop` or `onDragEnd` occurs:
#   `setDropIndicatorPos(null)`!
# - When dropped:
#   Inserts at the exact target range!
