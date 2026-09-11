# Let's check how the image is placed into the range on drop:
# When range is found:
# const imgToMove = draggedImageRef.current;
#
# if (range && editorRef.current?.contains(range.startContainer)) {
#   // If range is within the dragged image itself, ignore
#   if (imgToMove.contains(range.startContainer)) {
#     return;
#   }
#   // Insert at range
#   range.insertNode(imgToMove);
#   // Position selection immediately after the inserted image
#   range.setStartAfter(imgToMove);
#   range.collapse(true);
#   const sel = window.getSelection();
#   if (sel) {
#     sel.removeAllRanges();
#     sel.addRange(range);
#   }
# } else if (editorRef.current) {
#   editorRef.current.appendChild(imgToMove);
# }
# setSelectedImage(imgToMove);
# isInternalEditorUpdateRef.current = true;
# setEditorContent(editorRef.current.innerHTML);
# setTimeout(updateImageRect, 30);
