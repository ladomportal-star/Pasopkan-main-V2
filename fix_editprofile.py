with open('frontend/src/pages/EditProfile.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """              ) : showSuccess ? (
                
              ) : ("""

replacement = """              ) : showSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : ("""

if target in content:
    content = content.replace(target, replacement)
    print("Fixed EditProfile.tsx")

with open('frontend/src/pages/EditProfile.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
