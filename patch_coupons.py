import re

with open('frontend/src/components/ManageCouponsSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("r.userName.replace", "(r.userName || '').replace")
content = content.replace("r.tierName.replace", "(r.tierName || '').replace")

with open('frontend/src/components/ManageCouponsSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to ManageCouponsSection")
