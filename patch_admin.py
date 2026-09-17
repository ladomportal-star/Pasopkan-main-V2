import re

with open('frontend/src/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("tx.amount.replace", "String(tx.amount || '').replace")

with open('frontend/src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to AdminDashboard")
