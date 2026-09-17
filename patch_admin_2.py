import re

with open('frontend/src/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("event.title.replace(", "(event.title || '').replace(")
content = content.replace("user.name.replace(", "(user.name || '').replace(")
content = content.replace("user.email.replace(", "(user.email || '').replace(")
content = content.replace("eventName.replace(", "(eventName || '').replace(")
content = content.replace("selectedEventObj.title.toLowerCase().replace(", "(selectedEventObj.title || '').toLowerCase().replace(")
content = content.replace("cell.toString().replace", "(cell?.toString() || '').replace")

with open('frontend/src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch 2 to AdminDashboard")
