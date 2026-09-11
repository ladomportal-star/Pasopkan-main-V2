# Let's write a cross-browser helper to get Range from point (x, y):
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
