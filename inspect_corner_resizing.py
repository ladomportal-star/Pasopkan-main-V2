# Let's test the 4 corners:
# Corners: 'nw' (top-left), 'ne' (top-right), 'sw' (bottom-left), 'se' (bottom-right)
#
# When dragging:
# 'se' (bottom-right):
# cursor: 'nwse-resize'
# deltaX = moveEvent.clientX - startX
# deltaY = moveEvent.clientY - startY
# or preserving aspect ratio:
# newWidth = Math.max(50, startWidth + deltaX)
# newHeight = newWidth * ratio
#
# 'sw' (bottom-left):
# cursor: 'nesw-resize'
# deltaX = startX - moveEvent.clientX
# newWidth = Math.max(50, startWidth + deltaX)
# newHeight = newWidth * ratio
#
# 'ne' (top-right):
# cursor: 'nesw-resize'
# deltaX = moveEvent.clientX - startX
# newWidth = Math.max(50, startWidth + deltaX)
# newHeight = newWidth * ratio
#
# 'nw' (top-left):
# cursor: 'nwse-resize'
# deltaX = startX - moveEvent.clientX
# newWidth = Math.max(50, startWidth + deltaX)
# newHeight = newWidth * ratio
#
# In all 4 cases:
# On mouse move:
# selectedImage.style.width = `${newWidth}px`;
# selectedImage.style.height = `${newHeight}px`;
# updateImageRect();
#
# On mouse up:
# sync editorContent!
# if (editorRef.current) {
#   isInternalEditorUpdateRef.current = true;
#   setEditorContent(editorRef.current.innerHTML);
# }
