import re

with open('frontend/src/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace:
#                                     )}
#                                   </div>
#                               {uploadingBill[payout.id] && (
#                                 <div className="space-y-1.5 mt-3">
# With:
#                                     )}
#                                   </div>
#                                 )}
#                               </div>
#                               {uploadingBill[payout.id] && (
#                                 <div className="space-y-1.5 mt-3">


regex = re.compile(r"                                    \)\}\n                                  </div>\n                              \{uploadingBill\[payout.id\] && \(")

replacement = """                                    )}
                                  </div>
                                )}
                              </div>
                              {uploadingBill[payout.id] && ("""

if regex.search(content):
    content = regex.sub(replacement.replace('\n', '\n'), content)
    with open('frontend/src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed syntax in AdminDashboard")
else:
    print("Could not find syntax error section")
