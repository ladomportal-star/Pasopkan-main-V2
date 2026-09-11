# Let's test the applyToolbarTextColor implementation:
#
# const parseValidHex = (input: string): string | null => {
#   const clean = input.trim().replace(/^#/, '');
#   if (/^[0-9a-fA-F]{6}$/.test(clean)) {
#     return `#${clean.toUpperCase()}`;
#   }
#   if (/^[0-9a-fA-F]{3}$/.test(clean)) {
#     return `#${clean.split('').map(c => c + c).join('').toUpperCase()}`;
#   }
#   return null;
# };
#
# In applyToolbarTextColor:
# const applyToolbarTextColor = (color: string, closeMenu = true) => {
#   const validColor = parseValidHex(color) || (color.startsWith('#') ? color : `#${color}`);
#   setSelectedTextColor(validColor);
#   setCustomHexInput(validColor.replace('#', ''));
#   if (closeMenu) {
#     setShowColorMenu(false);
#   }
#
#   const sel = window.getSelection();
#   let rangeToUse = savedSelectionRangeRef.current || savedSelectionRange;
#   if (!rangeToUse && sel && sel.rangeCount > 0 && !sel.isCollapsed) {
#     rangeToUse = sel.getRangeAt(0);
#   }
#
#   if (editorRef.current) {
#     if (rangeToUse && !rangeToUse.collapsed && editorRef.current.contains(rangeToUse.commonAncestorContainer)) {
#       // Restore selection
#       if (sel) {
#         sel.removeAllRanges();
#         sel.addRange(rangeToUse);
#       }
#       try {
#         document.execCommand('styleWithCSS', false, 'true');
#       } catch {}
#       document.execCommand('foreColor', false, validColor);
#
#       // Ensure all styled fonts and elements inside the selection reflect the exact color
#       const fontEls = editorRef.current.querySelectorAll('font[color]');
#       fontEls.forEach((el) => {
#         (el as HTMLElement).style.color = validColor;
#         (el as HTMLElement).style.setProperty('color', validColor, 'important');
#       });
#
#       // Save the resulting range back to savedSelectionRangeRef so further changes work continuously
#       const newSel = window.getSelection();
#       if (newSel && newSel.rangeCount > 0 && !newSel.isCollapsed) {
#         savedSelectionRangeRef.current = newSel.getRangeAt(0).cloneRange();
#         setSavedSelectionRange(newSel.getRangeAt(0).cloneRange());
#       }
#     } else {
#       // Cursor/typing mode
#       editorRef.current.focus();
#       try {
#         document.execCommand('styleWithCSS', false, 'true');
#       } catch {}
#       document.execCommand('foreColor', false, validColor);
#     }
#     setEditorContent(editorRef.current.innerHTML);
#   }
# };
