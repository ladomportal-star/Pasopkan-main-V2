import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the Dedicated 2FA Modal
start_idx = content.find("      {/* Dedicated 2FA Modal */}")
if start_idx != -1:
    end_idx = content.find("    </Layout>", start_idx)
    if end_idx != -1:
        content = content[:start_idx] + content[end_idx:]
        with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Removed Dedicated 2FA Modal!")
    else:
        print("Could not find end of Dedicated 2FA Modal.")
else:
    print("Could not find start of Dedicated 2FA Modal.")
