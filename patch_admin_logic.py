import re

with open('frontend/src/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_regex = re.compile(r"                              \{\/\* Reference Input \*\/\}.*?                              \{uploadingBill\[payout\.id\] && \(", re.DOTALL)

# Let's do it with split or replace.

replacement = """                              {uploadingBill[payout.id] && (
                                <div className="space-y-1.5 mt-3">
                                  <label className="block text-[11px] font-bold text-gray-500 uppercase">
                                    Reference Number / Txn ID
                                  </label>
                                  <input
                                    type="text"
                                    value={uploadingRef[payout.id] || ''}
                                    onChange={(e) => setUploadingRef(prev => ({...prev, [payout.id]: e.target.value}))}
                                    placeholder="e.g. TR-202609..."
                                    className="w-full text-sm py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-adv-orange/20 focus:border-adv-orange transition-all outline-none"
                                  />
                                </div>
                              )}
                              
                              {uploadingBill[payout.id] && (
                                <button 
                                  onClick={() => {
                                    const img = uploadingBill[payout.id];
                                    const ref = uploadingRef[payout.id] || payout.id;
                                    setPayoutsList(prev => prev.map(p => p.id === payout.id ? { ...p, status: 'paid', billImage: img, reference: ref, completedDate: new Date().toISOString() } : p));
                                    
                                    // Add/update to organizer's local storage for them to see the bill
                                    const savedBills = safeStorage.getItem('organizer_payout_bills') || '[]';
                                    let parsedBills = JSON.parse(savedBills);
                                    
                                    const existingIdx = parsedBills.findIndex((b: any) => b.id === payout.id);
                                    if (existingIdx >= 0) {
                                      parsedBills[existingIdx] = { ...payout, status: 'paid', billImage: img, reference: ref, paidAt: new Date().toISOString() };
                                    } else {
                                      parsedBills.push({ ...payout, status: 'paid', billImage: img, reference: ref, paidAt: new Date().toISOString() });
                                    }
                                    
                                    safeStorage.setItem('organizer_payout_bills', JSON.stringify(parsedBills));
                                    
                                    setUploadingBill(prev => { const next = {...prev}; delete next[payout.id]; return next; });
                                    setUploadingRef(prev => { const next = {...prev}; delete next[payout.id]; return next; });
                                  }}
                                  className="w-full mt-3 bg-adv-orange hover:bg-orange-600 text-white font-bold text-sm px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >"""

# Find exactly where to insert this:
# We will replace from:
#                                 )}
#                               </div>
#                               
#                               {uploadingBill[payout.id] && (
#                                 <button 
#                                   onClick={() => {
# ... up to:
#                                   className="w-full bg-adv-orange hover:bg-orange-600 text-white font-bold text-sm px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
#                                 >

regex2 = re.compile(r"                                \)\}\n                              </div>\n                              \n                              \{uploadingBill\[payout.id\] && \(\n                                <button \n                                  onClick=\{\(\) => \{\n                                    const img = uploadingBill\[payout.id\];\n                                    setPayoutsList\(prev => prev.map\(p => p.id === payout.id \? \{ \.\.\.p, status: 'paid', billImage: img, completedDate: new Date\(\).toISOString\(\) \} : p\)\);\n                                    \n                                    // Add/update to organizer's local storage for them to see the bill\n                                    const savedBills = safeStorage.getItem\('organizer_payout_bills'\) \|\| '\[\]';\n                                    let parsedBills = JSON.parse\(savedBills\);\n                                    \n                                    const existingIdx = parsedBills.findIndex\(\(b: any\) => b.id === payout.id\);\n                                    if \(existingIdx >= 0\) \{\n                                      parsedBills\[existingIdx\] = \{ \.\.\.payout, status: 'paid', billImage: img, paidAt: new Date\(\).toISOString\(\) \};\n                                    \} else \{\n                                      parsedBills.push\(\{ \.\.\.payout, status: 'paid', billImage: img, paidAt: new Date\(\).toISOString\(\) \}\);\n                                    \}\n                                    \n                                    safeStorage.setItem\('organizer_payout_bills', JSON.stringify\(parsedBills\)\);\n                                    \n                                    setUploadingBill\(prev => \{ const next = \{\.\.\.prev\}; delete next\[payout.id\]; return next; \}\);\n                                  \}\}\n                                  className=\"w-full bg-adv-orange hover:bg-orange-600 text-white font-bold text-sm px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2\"\n                                >")

if regex2.search(content):
    content = regex2.sub(replacement.replace('\n', '\n'), content)
    with open('frontend/src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced submission logic")
else:
    print("Could not find the target text for regex2.")
    print("Target text may not match exactly.")
