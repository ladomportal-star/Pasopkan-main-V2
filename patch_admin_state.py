with open('frontend/src/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  const [uploadingBill, setUploadingBill] = useState<Record<string, string>>({});\n"
replacement = target + "  const [uploadingRef, setUploadingRef] = useState<Record<string, string>>({});\n"

if target in content:
    content = content.replace(target, replacement)
    with open('frontend/src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added uploadingRef state")
else:
    print("Failed to add uploadingRef state")
