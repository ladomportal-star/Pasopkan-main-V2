import re

with open('frontend/src/data/blogs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("blogData.title.toLowerCase().replace(", "(blogData.title || '').toLowerCase().replace(")

with open('frontend/src/data/blogs.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied patch to blogs.ts")
