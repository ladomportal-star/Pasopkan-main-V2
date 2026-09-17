with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

count = content.count("showClaimTwoFaModal")
print(f"showClaimTwoFaModal found {count} times")
