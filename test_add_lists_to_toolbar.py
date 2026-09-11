with open("Frontend/src/pages/CreateEvent.tsx", "r") as f:
    code = f.read()

# Let's inspect how execCommand is called for formatting buttons:
# <button type="button" onClick={() => execCommand('bold')} ...>
# Notice:
# onClick={() => {
#   document.execCommand('insertUnorderedList');
#   editorRef.current?.focus();
#   if (editorRef.current) {
#     isInternalEditorUpdateRef.current = true;
#     setEditorContent(editorRef.current.innerHTML);
#   }
# }}
# onMouseDown={(e) => e.preventDefault()} so it doesn't drop selection!
#
# And for number list:
# onClick={() => {
#   document.execCommand('insertOrderedList');
#   editorRef.current?.focus();
#   if (editorRef.current) {
#     isInternalEditorUpdateRef.current = true;
#     setEditorContent(editorRef.current.innerHTML);
#   }
# }}
#
# Let's design the List block:
# {/* Lists (Bullet & Number) */}
# <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
#   <button
#     type="button"
#     onMouseDown={(e) => e.preventDefault()}
#     onClick={() => {
#       document.execCommand('insertUnorderedList');
#       editorRef.current?.focus();
#       if (editorRef.current) {
#         isInternalEditorUpdateRef.current = true;
#         setEditorContent(editorRef.current.innerHTML);
#       }
#     }}
#     className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-black flex items-center justify-center transition-all cursor-pointer"
#     title={lang === 'lo' ? 'ລາຍການແບບຈຸດ (Bullet List)' : 'Bullet List'}
#   >
#     <List className="w-3.5 h-3.5" />
#   </button>
#   <button
#     type="button"
#     onMouseDown={(e) => e.preventDefault()}
#     onClick={() => {
#       document.execCommand('insertOrderedList');
#       editorRef.current?.focus();
#       if (editorRef.current) {
#         isInternalEditorUpdateRef.current = true;
#         setEditorContent(editorRef.current.innerHTML);
#       }
#     }}
#     className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-black flex items-center justify-center transition-all cursor-pointer"
#     title={lang === 'lo' ? 'ລາຍການແບບຕົວເລກ (Numbered List)' : 'Numbered List'}
#   >
#     <ListOrdered className="w-3.5 h-3.5" />
#   </button>
# </div>
