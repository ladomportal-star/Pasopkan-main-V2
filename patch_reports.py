import re

with open('frontend/src/components/OrganizerReportsTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("event.title.replace", "(event.title || '').replace")
content = content.replace("event.venue.replace", "(event.venue || '').replace")

with open('frontend/src/components/OrganizerReportsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to OrganizerReportsTab")
