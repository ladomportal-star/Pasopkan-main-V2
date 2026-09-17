with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "{bill.status.toLowerCase() !== 'pending' && (<p className=\"text-gray-300 flex justify-between\"><span className=\"text-gray-400\">Ref:</span> <span className=\"font-mono text-gray-100\">{bill.id}</span></p>)}"
replacement = "{bill.status.toLowerCase() !== 'pending' && (<p className=\"text-gray-300 flex justify-between\"><span className=\"text-gray-400\">Ref:</span> <span className=\"font-mono text-gray-100\">{bill.reference || bill.id}</span></p>)}"

if target in content:
    content = content.replace(target, replacement)
    with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced Ref logic in Account")
else:
    print("Could not find Ref logic in Account")
