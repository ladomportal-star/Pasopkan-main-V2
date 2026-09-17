import re

with open('frontend/src/components/AdminBlogsTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("formData.title.toLowerCase().replace", "(formData.title || '').toLowerCase().replace")

with open('frontend/src/components/AdminBlogsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to AdminBlogsTab")
