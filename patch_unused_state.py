with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  const [showClaimTwoFaModal, setShowClaimTwoFaModal] = useState(false);\n"

if target in content:
    content = content.replace(target, "")
    with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Removed unused state!")
else:
    print("Could not find unused state.")
