import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the 2FA modal completely
start_idx = content.find("      {/* 2FA Claim Verification Modal */}")
end_idx = content.find("      {/* 30-Day Cooling-off Period Notice Modal */}", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]
    with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Removed 2FA modal!")
else:
    print("Could not find 2FA modal.")
