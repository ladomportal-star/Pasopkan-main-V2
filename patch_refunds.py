import re

with open('frontend/src/components/RefundsManagementTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("r.eventTitle.replace", "(r.eventTitle || '').replace")
content = content.replace("r.customerName.replace", "(r.customerName || '').replace")
content = content.replace("r.reason.replace", "(r.reason || '').replace")

with open('frontend/src/components/RefundsManagementTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to RefundsManagementTab")
