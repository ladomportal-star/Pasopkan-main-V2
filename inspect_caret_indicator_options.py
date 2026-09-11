# Let's explore how live visual drag-and-drop indicator works for rich text:
# When user drags an image in the editor (or even an external image file):
# While dragging over the editor (onDragOver):
# 1. We get the range at (e.clientX, e.clientY) using caretRangeFromPoint / caretPositionFromPoint.
# 2. We can show a real-time cursor / drop indicator!
#    OR we can also move a visual drop indicator line (e.g. a vertical/horizontal bar showing EXACTLY where the image will drop!).
#    AND set window.getSelection() to that range so the blinking caret tracks the mouse in real-time!
#    AND even better:
#    During drag, if draggedImageRef.current:
#    We can show a sleek drop target indicator line or highlight!
#    Let's check:
#    When user drags an image:
#    "image on information event when drag and drop should be update real time position by cursor"
#    This means:
#    1. In real-time as the cursor moves across the text, paragraphs, and list items, the drop position (caret / insertion indicator) updates dynamically to follow the cursor!
#    2. On drop, the image smoothly snaps to the exact cursor position!
#    3. In addition, when dragging an image, we can show a live visual drop line indicator (e.g., an animated orange line or active insertion cursor) at the exact insertion point so the user sees in real time where the image will be placed!
