import re

with open('frontend/src/pages/StaffScanner.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("name.toLowerCase().replace(", "(name || '').toLowerCase().replace(")
content = content.replace("mockName.toLowerCase().replace(", "(mockName || '').toLowerCase().replace(")

with open('frontend/src/pages/StaffScanner.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to StaffScanner")
