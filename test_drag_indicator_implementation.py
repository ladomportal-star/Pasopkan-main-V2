# Let's test the state and handlers for real-time cursor drop tracking:
#
# State:
# const [imageDropIndicator, setImageDropIndicator] = useState<{
#   top: number;
#   left: number;
#   width: number;
#   height: number;
#   isBlock: boolean;
# } | null>(null);
#
# Helper:
# const getCaretRangeFromPoint = (x: number, y: number): Range | null => {
#   if (typeof document.caretRangeFromPoint === 'function') {
#     return document.caretRangeFromPoint(x, y);
#   }
#   const doc = document as unknown as { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
#   if (typeof doc.caretPositionFromPoint === 'function') {
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
# Handler for onDragOver:
# const handleEditorDragOver = (e: React.DragEvent<HTMLDivElement>) => {
#   e.preventDefault();
#   if (draggedImageRef.current) {
#     e.dataTransfer.dropEffect = 'move';
#   } else if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
#     e.dataTransfer.dropEffect = 'copy';
#   } else {
#     return;
#   }
#
#   const range = getCaretRangeFromPoint(e.clientX, e.clientY);
#   if (range && editorRef.current && editorRef.current.contains(range.startContainer)) {
#     // Synchronize window selection caret in real time
#     const sel = window.getSelection();
#     if (sel) {
#       sel.removeAllRanges();
#       sel.addRange(range);
#     }
#     // Update real-time position indicator
#     const parentContainer = editorRef.current.parentElement;
#     if (parentContainer) {
#       const parentBounds = parentContainer.getBoundingClientRect();
#       const rects = range.getClientRects();
#       if (rects.length > 0 && rects[0].height > 0) {
#         const r = rects[0];
#         setImageDropIndicator({
#           top: r.top - parentBounds.top,
#           left: Math.max(0, r.left - parentBounds.left - 1.5),
#           width: 3,
#           height: Math.max(r.height, 22),
#           isBlock: false
#         });
#       } else {
#         const elem = range.startContainer.nodeType === Node.ELEMENT_NODE
#           ? (range.startContainer as HTMLElement)
#           : range.startContainer.parentElement;
#         if (elem && editorRef.current.contains(elem)) {
#           const bounds = elem.getBoundingClientRect();
#           const isLowerHalf = e.clientY > bounds.top + bounds.height / 2;
#           setImageDropIndicator({
#             top: (isLowerHalf ? bounds.bottom : bounds.top) - parentBounds.top - 1.5,
#             left: bounds.left - parentBounds.left,
#             width: Math.max(bounds.width, 180),
#             height: 3,
#             isBlock: true
#           });
#         }
#       }
#     }
#   }
# };
#
# In handleEditorDrop:
# setImageDropIndicator(null);
#
# In handleEditorDragLeave:
# setImageDropIndicator(null);
#
# In handleEditorDragEnd:
# setImageDropIndicator(null);
# draggedImageRef.current = null;
