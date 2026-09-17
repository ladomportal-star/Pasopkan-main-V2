import re

with open('frontend/src/pages/Notifications.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-24 sm:bottom-12 pointer-events-none sm:bottom-12 left-1/2 bg-adv-slate text-black px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-adv-orange" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>"""

replacement = """      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-24 sm:bottom-12 pointer-events-none left-1/2 bg-white text-black px-6 py-3 sm:py-2 sm:px-5 sm:text-sm rounded-2xl sm:rounded-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3 z-50 border border-gray-200 relative overflow-hidden whitespace-nowrap w-[90%] sm:w-auto justify-center"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>"""

if target in content:
    content = content.replace(target, replacement)
    print("Patched Notifications Toast")

with open('frontend/src/pages/Notifications.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
