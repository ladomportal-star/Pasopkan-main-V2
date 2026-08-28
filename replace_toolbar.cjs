const fs = require('fs');
const content = fs.readFileSync('src/pages/CreateEvent.tsx', 'utf8');

const startIndex = content.indexOf('{/* Sleek Rich-Text Editor Toolbar Matching Reference */}');
const editorAreaIndex = content.indexOf('{/* Editor Area */}');
if (startIndex === -1 || editorAreaIndex === -1) {
  console.log('Could not find markers');
  process.exit(1);
}

// Back up to the parent div of Editor Area
const blockEndIndex = content.lastIndexOf('<div className="border border-gray-200', editorAreaIndex);

const before = content.slice(0, startIndex);
const after = content.slice(blockEndIndex);

const newToolbar = `{/* Refined Comprehensive Rich-Text Editor Toolbar */}
                <div className="w-full bg-[#F6F4EF] border border-[#E8E5DC] rounded-[20px] p-2.5 mb-4 shadow-sm select-none">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    
                    {/* History */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button type="button" onClick={() => document.execCommand('undo')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Undo">
                        <Undo className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => document.execCommand('redo')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Redo">
                        <Redo className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-px h-5 bg-gray-300 mx-0.5"></div>

                    {/* Font Dropdown */}
                    <div className="relative">
                      <button type="button" onClick={() => { setShowFontMenu(!showFontMenu); setShowFontSizeMenu(false); setShowColorMenu(false); setShowToolbarLinkModal(false); }} className="h-8 bg-[#EAE8E2] hover:bg-[#E2DFD8] active:scale-95 text-gray-800 text-xs font-semibold px-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-black/5" title="Font Family">
                        <span className="truncate max-w-[70px]">{selectedFont}</span>
                        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                      </button>
                      {showFontMenu && (
                        <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-150 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                          {fontOptions.map((f) => (
                            <button key={f.label} type="button" onClick={() => applyToolbarFont(f.label, f.value)} className={\`w-full text-left px-3 py-1.5 text-xs hover:bg-orange-50 hover:text-adv-orange flex items-center justify-between transition-colors \${selectedFont === f.label ? 'text-adv-orange font-bold bg-orange-50/50' : 'text-gray-700'}\`} style={{ fontFamily: f.value }}>
                              <span>{f.label}</span>
                              {selectedFont === f.label && <Check className="w-3 h-3 text-adv-orange" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Size Dropdown */}
                    <div className="relative">
                      <button type="button" onClick={() => { setShowFontSizeMenu(!showFontSizeMenu); setShowFontMenu(false); setShowColorMenu(false); setShowToolbarLinkModal(false); }} className="h-8 bg-[#EAE8E2] hover:bg-[#E2DFD8] active:scale-95 text-gray-800 text-xs font-semibold px-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs border border-black/5" title="Font Size">
                        <span>{selectedFontSize}</span>
                        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                      </button>
                      {showFontSizeMenu && (
                        <div className="absolute top-full left-0 mt-1 w-20 bg-white rounded-xl shadow-xl border border-gray-150 py-1 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                          {fontSizeOptions.map((sz) => (
                            <button key={sz} type="button" onClick={() => applyToolbarFontSize(sz)} className={\`w-full text-left px-3 py-1.5 text-xs hover:bg-orange-50 hover:text-adv-orange flex items-center justify-between transition-colors \${selectedFontSize === sz ? 'text-adv-orange font-bold bg-orange-50/50' : 'text-gray-700'}\`}>
                              <span>{sz}</span>
                              {selectedFontSize === sz && <Check className="w-3 h-3 text-adv-orange" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Color Picker */}
                    <div className="relative">
                      <button type="button" onClick={() => { setShowColorMenu(!showColorMenu); setShowFontMenu(false); setShowFontSizeMenu(false); setShowToolbarLinkModal(false); }} className="h-8 bg-[#EAE8E2] hover:bg-[#E2DFD8] active:scale-95 text-gray-800 rounded-xl px-2 flex items-center gap-1 transition-all cursor-pointer shadow-xs border border-black/5" title="Text Color">
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="font-extrabold text-[12px] leading-tight text-gray-800">T</span>
                          <span className="w-3 h-[3px] rounded-full mt-0.5 shadow-xs" style={{ backgroundColor: selectedTextColor }} />
                        </div>
                        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                      </button>
                      {showColorMenu && (
                        <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-150 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Color</div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {colorPalette.map((col) => (
                              <button key={col.value} type="button" onClick={() => applyToolbarTextColor(col.value)} className={\`w-6 h-6 rounded-lg border flex items-center justify-center transition-transform hover:scale-110 \${selectedTextColor === col.value ? 'border-gray-800 ring-2 ring-adv-orange/40 scale-105' : 'border-gray-200'}\`} style={{ backgroundColor: col.value }} title={col.label}>
                                {selectedTextColor === col.value && <Check className="w-3 h-3 text-white drop-shadow-xs" />}
                              </button>
                            ))}
                          </div>
                          <div className="pt-1 border-t border-gray-100 flex items-center gap-1.5">
                            <input type="color" value={selectedTextColor} onChange={(e) => applyToolbarTextColor(e.target.value)} className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent" title="Custom color" />
                            <span className="text-[11px] text-gray-600 font-mono">{selectedTextColor}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-px h-5 bg-gray-300 mx-0.5"></div>

                    {/* Headings & Quote */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button type="button" onClick={() => execCommand('formatBlock', 'H2')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Heading 1">
                        <Heading1 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => execCommand('formatBlock', 'H3')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Heading 2">
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => { try { execCommand('formatBlock', 'blockquote'); } catch(e) { execCommand('formatBlock', 'BLOCKQUOTE'); } }} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Blockquote">
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-px h-5 bg-gray-300 mx-0.5"></div>

                    {/* Inline Formats */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button type="button" onClick={() => execCommand('bold')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-bold text-xs transition-all cursor-pointer" title="Bold">B</button>
                      <button type="button" onClick={() => execCommand('italic')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-serif italic text-xs transition-all cursor-pointer" title="Italic">I</button>
                      <button type="button" onClick={() => execCommand('underline')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-semibold underline text-xs transition-all cursor-pointer" title="Underline">U</button>
                      <button type="button" onClick={() => execCommand('strikethrough')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-800 hover:text-black flex items-center justify-center font-semibold line-through text-xs transition-all cursor-pointer" title="Strikethrough">S</button>
                    </div>

                    {/* Script */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button type="button" onClick={() => execCommand('superscript')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center text-xs font-bold transition-all cursor-pointer" title="Superscript"><span className="text-[11px] font-bold">T<sup className="text-[8px]">↑</sup></span></button>
                      <button type="button" onClick={() => execCommand('subscript')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center text-xs font-bold transition-all cursor-pointer" title="Subscript"><span className="text-[11px] font-bold">T<sub className="text-[8px]">↓</sub></span></button>
                    </div>

                    <div className="w-px h-5 bg-gray-300 mx-0.5"></div>

                    {/* Alignment */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button type="button" onClick={() => execCommand('justifyLeft')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => execCommand('justifyCenter')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => execCommand('justifyRight')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => execCommand('justifyFull')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="w-px h-5 bg-gray-300 mx-0.5"></div>

                    {/* Lists */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5">
                      <button type="button" onClick={() => execCommand('insertUnorderedList')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => execCommand('insertOrderedList')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="w-px h-5 bg-gray-300 mx-0.5"></div>

                    {/* Inserts & Links */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center gap-0.5 shadow-xs border border-black/5 relative">
                      {/* Link Modal Popup inside the group */}
                      {showToolbarLinkModal && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-150 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2">
                          <input type="url" value={toolbarLinkUrl} onChange={(e) => setToolbarLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyToolbarLink(); } else if (e.key === 'Escape') { setShowToolbarLinkModal(false); } }} placeholder="https://example.com" className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-adv-orange focus:ring-1 focus:ring-adv-orange" autoFocus />
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => setShowToolbarLinkModal(false)} className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-800 rounded-md">Cancel</button>
                            <button type="button" onClick={applyToolbarLink} className="px-2.5 py-1 text-[11px] bg-adv-orange text-white font-bold rounded-md shadow-xs hover:bg-orange-600">Apply</button>
                          </div>
                        </div>
                      )}
                      <button type="button" onClick={() => { const sel = window.getSelection(); if (sel && sel.rangeCount > 0) { setSavedSelectionRange(sel.getRangeAt(0).cloneRange()); } setShowToolbarLinkModal(true); setShowColorMenu(false); setShowFontMenu(false); setShowFontSizeMenu(false); }} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Insert Link"><LinkIcon className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => execCommand('unlink')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Remove Link"><Unlink className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" /></button>
                      
                      <div className="w-px h-4 bg-gray-300 mx-0.5"></div>
                      
                      <button type="button" onClick={handleEditorImageUpload} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Insert Image"><ImageIcon className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => execCommand('insertHorizontalRule')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Divider Line"><Minus className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={insertCalloutBlock} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Insert Callout Note"><MessageSquare className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="flex-1"></div>

                    {/* Clear Format */}
                    <div className="h-8 bg-[#EAE8E2] rounded-xl p-0.5 flex items-center shadow-xs border border-black/5">
                      <button type="button" onClick={() => execCommand('removeFormat')} className="w-7 h-7 rounded-lg hover:bg-white active:scale-95 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer" title="Clear Formatting"><RemoveFormatting className="w-3.5 h-3.5" /></button>
                    </div>

                  </div>
                </div>
                
`;

fs.writeFileSync('src/pages/CreateEvent.tsx', before + newToolbar + after);
console.log('Successfully replaced toolbar');
