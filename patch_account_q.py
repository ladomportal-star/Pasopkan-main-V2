import re

with open('frontend/src/pages/Account.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """              {/* 5-second auto-remove progress line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-adv-orange"
                />
              </div>
              {toast.type === 'error' && <XCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-red-500" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-adv-orange" />}
              {toast.type === 'info' && <Info className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-blue-500" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-emerald-500" />}"""

replacement = """"""

content = content.replace(target, replacement)

with open('frontend/src/pages/Account.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched")
