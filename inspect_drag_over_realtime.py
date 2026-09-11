# Let's see:
# `editorRef.current.parentElement` is the relative container!
# `parentBounds = editorRef.current.parentElement.getBoundingClientRect()`
# When the user drags an image over the editor:
# In `onDragOver={(e) => handleEditorDragOver(e)}`:
#
# const [dropIndicator, setDropIndicator] = useState<{
#   top: number;
#   left: number;
#   width: number;
#   height: number;
#   isBlock?: boolean;
# } | null>(null);
#
# How to get the exact real-time caret position during drag:
# 1. Helper function:
# const getRangeFromPoint = (x: number, y: number): Range | null => {
#   if (document.caretRangeFromPoint) {
#     return document.caretRangeFromPoint(x, y);
#   }
#   const doc = document as unknown as { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
#   if (doc.caretPositionFromPoint) {
#     const pos = doc.caretPositionFromPoint(x, y);
#     if (pos) {
#       const range = document.createRange();
#       range.setStart(pos.offsetNode, pos.offset);
#       range.collapse(true);
#       return range;
#     }
#   }
#   return null;
# };
#
# 2. In handleEditorDragOver(e: React.DragEvent<HTMLDivElement>):
# e.preventDefault();
# if (draggedImageRef.current || (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files'))) {
#   e.dataTransfer.dropEffect = 'move';
#   const range = getRangeFromPoint(e.clientX, e.clientY);
#   if (range && editorRef.current && editorRef.current.contains(range.startContainer)) {
#     // Update the browser's live selection caret so the native blinking cursor follows the mouse:
#     const sel = window.getSelection();
#     if (sel) {
#       sel.removeAllRanges();
#       sel.addRange(range);
#     }
#     // In addition, calculate exact visual indicator coordinates:
#     if (editorRef.current.parentElement) {
#       const parentBounds = editorRef.current.parentElement.getBoundingClientRect();
#       const rects = range.getClientRects();
#       if (rects.length > 0) {
#         const r = rects[0];
#         setDropIndicator({
#           top: r.top - parentBounds.top,
#           left: r.left - parentBounds.left,
#           width: 3,
#           height: Math.max(r.height, 22),
#           isBlock: false
#         });
#       } else {
#         // If between blocks, find target element:
#         const target = range.startContainer.nodeType === Node.ELEMENT_NODE 
#           ? (range.startContainer as HTMLElement) 
#           : range.startContainer.parentElement;
#         if (target) {
#           const targetBounds = target.getBoundingClientRect();
#           const isCloserToBottom = e.clientY > targetBounds.top + targetBounds.height / 2;
#           setDropIndicator({
#             top: (isCloserToBottom ? targetBounds.bottom : targetBounds.top) - parentBounds.top,
#             left: targetBounds.left - parentBounds.left,
#             width: Math.min(targetBounds.width, 320),
#             height: 3,
#             isBlock: true
#           });
#         }
#       }
#     }
#   }
# }
#
# 3. In onDragLeave:
# handleEditorDragLeave = () => {
#   setDropIndicator(null);
# };
#
# 4. In onDrop:
# handleEditorDrop:
# clear dropIndicator: setDropIndicator(null);
# Use the exact range from point to insert the image!
# And also if user cancels drag (onDragEnd on image):
# clear dropIndicator: setDropIndicator(null);
