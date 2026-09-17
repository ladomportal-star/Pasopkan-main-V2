with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "import TwoFactorAuthModal from '../components/TwoFactorAuthModal';\n"

if target in content:
    content = content.replace(target, "")
    with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Removed unused import!")
else:
    print("Could not find unused import.")
