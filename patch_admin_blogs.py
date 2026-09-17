import re

with open('frontend/src/components/AdminBlogsTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[150] bg-adv-slate text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>"""

replacement = """      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[150] bg-white text-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-gray-200"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>"""

if target in content:
    content = content.replace(target, replacement)
    print("Patched AdminBlogsTab Toast")

with open('frontend/src/components/AdminBlogsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
