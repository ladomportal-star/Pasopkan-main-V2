with open('frontend/src/types/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  completedDate?: string;\n"
replacement = target + "  reference?: string;\n"

if target in content:
    content = content.replace(target, replacement)
    with open('frontend/src/types/index.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added reference to PayoutBill type")
else:
    print("Failed to add reference to PayoutBill type")
