import re

with open('frontend/src/pages/PaymentMethods.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{toastMessage || t.changesSaved}</span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-adv-orange"
              />
            </div>
          </motion.div>"""

replacement = """          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-[100] border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            <span>{toastMessage || t.changesSaved}</span>
          </motion.div>"""

if target in content:
    content = content.replace(target, replacement)
    print("Patched PaymentMethods Toast")

with open('frontend/src/pages/PaymentMethods.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
