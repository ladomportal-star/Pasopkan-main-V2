import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the progress line
content = re.sub(r'\{\/\* 5-second auto-remove progress line \*\/\}.*?<\/div>', '', content, flags=re.DOTALL)
# Remove the icons
content = re.sub(r'\{toast\.type === \'error\'[^\}]+\}', '', content)
content = re.sub(r'\{toast\.type === \'warning\'[^\}]+\}', '', content)
content = re.sub(r'\{toast\.type === \'info\'[^\}]+\}', '', content)
content = re.sub(r'\{toast\.type === \'success\'[^\}]+\}', '', content)

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Acc 3")
