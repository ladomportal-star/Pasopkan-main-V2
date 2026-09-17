import re

with open('frontend/src/components/OrganizerEventAnalytics.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("e.title.replace", "(e.title || '').replace")
content = content.replace("e.venue.replace", "(e.venue || '').replace")

with open('frontend/src/components/OrganizerEventAnalytics.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to OrganizerEventAnalytics")
